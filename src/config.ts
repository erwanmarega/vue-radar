import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Severity } from './types'

/**
 * Per-rule setting. Either turn a rule off, or override its severity.
 *   "off"     → rule is not run
 *   "error" | "warning" | "info" → run, but report at this severity
 * Aliases accepted: "warn" → "warning", "on" → keep rule's default severity.
 */
export type RuleSetting = 'off' | 'on' | 'error' | 'warning' | 'warn' | 'info'

export interface VueRadarConfig {
  /** Per-rule overrides keyed by rule id. */
  rules?: Record<string, RuleSetting>
  /** Extra glob patterns to exclude from scanning. */
  ignore?: string[]
  /** Severity threshold that makes the CLI exit non-zero. */
  failOn?: Severity
  /** Report language: 'en' | 'fr'. */
  lang?: string
}

export interface ResolvedConfig {
  /** Rule ids explicitly turned off. */
  off: string[]
  /** Rule id → severity override (excludes off/on). */
  severityOverrides: Record<string, Severity>
  ignore: string[]
  failOn?: Severity
  lang?: string
}

const CONFIG_FILENAMES = [
  'vue-radar.config.json',
  '.vue-radarrc.json',
  '.vue-radarrc',
]

function normalizeSeverity(setting: RuleSetting): Severity | undefined {
  switch (setting) {
    case 'error':
      return 'error'
    case 'warning':
    case 'warn':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return undefined
  }
}

export function findConfigPath(dir: string, explicit?: string): string | undefined {
  if (explicit) {
    if (!existsSync(explicit)) {
      throw new Error(`vue-radar: config file not found: ${explicit}`)
    }
    return explicit
  }
  for (const name of CONFIG_FILENAMES) {
    const p = join(dir, name)
    if (existsSync(p)) return p
  }
  return undefined
}

export function loadConfig(dir: string, explicit?: string): ResolvedConfig {
  const path = findConfigPath(dir, explicit)
  const resolved: ResolvedConfig = { off: [], severityOverrides: {}, ignore: [] }
  if (!path) return resolved

  let raw: VueRadarConfig
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'))
  } catch (e) {
    throw new Error(`vue-radar: failed to parse config ${path}: ${(e as Error).message}`)
  }

  if (raw.rules) {
    for (const [id, setting] of Object.entries(raw.rules)) {
      if (setting === 'off') {
        resolved.off.push(id)
        continue
      }
      const sev = normalizeSeverity(setting)
      if (sev) resolved.severityOverrides[id] = sev
    }
  }

  if (Array.isArray(raw.ignore)) resolved.ignore = raw.ignore
  if (raw.failOn) resolved.failOn = raw.failOn
  if (raw.lang) resolved.lang = raw.lang

  return resolved
}
