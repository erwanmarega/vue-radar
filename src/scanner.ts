import { readFileSync, existsSync, statSync } from 'fs'
import { resolve, relative, join } from 'path'
import fg from 'fast-glob'
import { parseVueFile } from './parser'
import { coreRules, nuxtRules, filterRules } from './rules'
import { loadConfig } from './config'
import type { ResolvedConfig } from './config'
import { collectSuppressions, filterSuppressed } from './suppress'
import { t } from './i18n'
import type { Lang } from './i18n'
import type { Diagnostic, ScanResult, Category } from './types'

const SEVERITY_WEIGHT: Record<string, number> = {
  error: 10,
  warning: 4,
  info: 1,
}

function computeScore(diagnostics: Diagnostic[], totalFiles: number): number {
  if (totalFiles === 0) return 100
  const penalty = diagnostics.reduce((acc, d) => acc + (SEVERITY_WEIGHT[d.severity] ?? 1), 0)
  const maxPenalty = totalFiles * 20
  return Math.max(0, 100 - Math.round((penalty / Math.max(maxPenalty, penalty)) * 100))
}

function isNuxtProject(dir: string): boolean {
  return (
    existsSync(join(dir, 'nuxt.config.ts')) ||
    existsSync(join(dir, 'nuxt.config.js')) ||
    existsSync(join(dir, '.nuxt'))
  )
}

const DEFAULT_IGNORE = ['**/node_modules/**', '**/dist/**', '**/.nuxt/**', '**/.output/**']

/**
 * Project root for config/Nuxt detection. A single directory target keeps the
 * historical behaviour (it is the root); anything else roots at the cwd.
 */
export function computeRoot(targets: string[]): string {
  if (targets.length === 1) {
    const abs = resolve(targets[0])
    if (existsSync(abs) && statSync(abs).isDirectory()) return abs
  }
  return process.cwd()
}

/**
 * Resolve scan targets (files, directories, or globs) to a flat list of
 * absolute .vue paths.
 */
async function resolveFiles(targets: string[], root: string, ignore: string[]): Promise<string[]> {
  const out = new Set<string>()
  for (const target of targets) {
    if (fg.isDynamicPattern(target)) {
      const matched = await fg(target, { cwd: root, absolute: true, ignore: [...DEFAULT_IGNORE, ...ignore] })
      matched.forEach(f => f.endsWith('.vue') && out.add(f))
      continue
    }
    const abs = resolve(target)
    if (!existsSync(abs)) continue
    if (statSync(abs).isDirectory()) {
      const matched = await fg('**/*.vue', { cwd: abs, absolute: true, ignore: [...DEFAULT_IGNORE, ...ignore] })
      matched.forEach(f => out.add(f))
    } else if (abs.endsWith('.vue')) {
      // Explicitly named file — scanned even if it matches an ignore pattern.
      out.add(abs)
    }
  }
  return [...out]
}

export interface ScanOptions {
  diffFiles?: string[]
  only?: string[]
  skip?: string[]
  /** Path to an explicit config file. When omitted, auto-discovered at the root. */
  configPath?: string
  /** Pre-resolved config (overrides file discovery). */
  config?: ResolvedConfig
  /** Report language for resolved diagnostic text. Defaults to 'en'. */
  lang?: Lang
}

/**
 * `targets` may be a single path or several — each a .vue file, a directory, or
 * a glob. Defaults to the current directory.
 */
export async function scan(targets: string | string[] = '.', opts: ScanOptions = {}): Promise<ScanResult> {
  const start = Date.now()
  const targetList = Array.isArray(targets) ? (targets.length ? targets : ['.']) : [targets]

  const isDiff = !!(opts.diffFiles && opts.diffFiles.length > 0)
  const root = isDiff ? process.cwd() : computeRoot(targetList)
  const config = opts.config ?? loadConfig(root, opts.configPath)
  const lang: Lang = opts.lang ?? 'en'

  const files = isDiff
    ? opts.diffFiles!.map(f => resolve(f)).filter(f => f.endsWith('.vue'))
    : await resolveFiles(targetList, root, config.ignore)

  const nuxt = isNuxtProject(root)

  const baseRules = nuxt ? [...coreRules, ...nuxtRules] : coreRules
  // Rules turned off in config are merged into the skip list. CLI --skip wins
  // by virtue of being unioned, and CLI --rule (only) still narrows the set.
  const skip = [...(opts.skip ?? []), ...config.off]
  const rules = filterRules(baseRules, opts.only, skip.length ? skip : undefined)

  const allDiagnostics: Diagnostic[] = []

  for (const file of files) {
    const source = readFileSync(file, 'utf-8')
    const rel = relative(root, file)

    let parsed
    try {
      parsed = parseVueFile(source)
    } catch {
      continue
    }

    const fileDiagnostics: Diagnostic[] = []

    for (const rule of rules) {
      rule.check({
        filename: rel,
        source,
        sfc: parsed.sfc,
        scriptAst: parsed.scriptAst,
        templateAst: parsed.templateAst,
        report(diag) {
          const severity = config.severityOverrides[diag.ruleId] ?? diag.severity
          const { message, fix } = t(lang, diag.msgId, diag.params)
          fileDiagnostics.push({
            ruleId: diag.ruleId,
            category: diag.category,
            severity,
            line: diag.line,
            message,
            fix,
            file: rel,
          })
        },
      })
    }

    // Drop diagnostics silenced by inline directives (line-accurate).
    const suppressions = collectSuppressions(source)
    allDiagnostics.push(...filterSuppressed(suppressions, fileDiagnostics))
  }

  const byCategory = allDiagnostics.reduce((acc, d) => {
    ;(acc[d.category] ??= []).push(d)
    return acc
  }, {} as Record<Category, Diagnostic[]>)

  return {
    files: files.length,
    diagnostics: allDiagnostics,
    score: computeScore(allDiagnostics, files.length),
    duration: Date.now() - start,
    byCategory,
  }
}
