import { readFileSync, existsSync } from 'fs'
import { resolve, relative, join } from 'path'
import fg from 'fast-glob'
import { parseVueFile } from './parser'
import { coreRules, nuxtRules, filterRules } from './rules'
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

export interface ScanOptions {
  diffFiles?: string[]
  only?: string[]
  skip?: string[]
}

export async function scan(dir: string, opts: ScanOptions = {}): Promise<ScanResult> {
  const start = Date.now()
  const absDir = resolve(dir)
  const nuxt = isNuxtProject(absDir)

  const baseRules = nuxt ? [...coreRules, ...nuxtRules] : coreRules
  const rules = filterRules(baseRules, opts.only, opts.skip)

  let files: string[]

  if (opts.diffFiles && opts.diffFiles.length > 0) {
    files = opts.diffFiles.map(f => resolve(f)).filter(f => f.endsWith('.vue'))
  } else {
    files = await fg('**/*.vue', {
      cwd: absDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.nuxt/**', '**/.output/**'],
    })
  }

  const allDiagnostics: Diagnostic[] = []

  for (const file of files) {
    const source = readFileSync(file, 'utf-8')
    const rel = relative(absDir, file)

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
        report(diag) {
          fileDiagnostics.push({ ...diag, file: rel })
        },
      })
    }

    allDiagnostics.push(...fileDiagnostics)
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
