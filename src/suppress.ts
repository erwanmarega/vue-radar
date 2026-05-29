import type { Diagnostic } from './types'

/**
 * Inline suppression directives, recognised inside both HTML comments
 * (`<!-- ... -->`) and JS/TS comments (`// ...` or `/* ... *​/`):
 *
 *   vue-radar-disable-line               → suppress all rules on this line
 *   vue-radar-disable-line  rule-a,rule-b → suppress listed rules on this line
 *   vue-radar-disable-next-line          → suppress all rules on the next line
 *   vue-radar-disable-next-line rule-a   → suppress listed rules on the next line
 *
 * Line numbers are 1-based and match the original .vue file (the parser pads
 * each block so reported diagnostic lines are file-accurate).
 */

const DIRECTIVE_RE = /vue-radar-disable-(next-line|line)\b([^\n>*]*)/g

interface Suppression {
  // null = all rules
  ruleIds: Set<string> | null
}

function parseRuleList(raw: string): Set<string> | null {
  const ids = raw
    .split(/[\s,]+/)
    .map(s => s.trim())
    // Keep only well-formed rule ids (kebab-case, start with a letter). This
    // drops comment terminators that bleed into the capture, e.g. `-->` → `--`.
    .filter(s => /^[a-z][a-z0-9-]*$/i.test(s))
  return ids.length > 0 ? new Set(ids) : null
}

export type SuppressionMap = Map<number, Suppression[]>

export function collectSuppressions(source: string): SuppressionMap {
  const map: SuppressionMap = new Map()
  const lines = source.split('\n')

  lines.forEach((line, idx) => {
    const lineNo = idx + 1
    DIRECTIVE_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = DIRECTIVE_RE.exec(line)) !== null) {
      const kind = m[1]
      const ruleIds = parseRuleList(m[2] ?? '')
      const target = kind === 'next-line' ? lineNo + 1 : lineNo
      const list = map.get(target) ?? []
      list.push({ ruleIds })
      map.set(target, list)
    }
  })

  return map
}

export function isSuppressed(map: SuppressionMap, diag: Diagnostic): boolean {
  if (diag.line === undefined) return false
  const supps = map.get(diag.line)
  if (!supps) return false
  return supps.some(s => s.ruleIds === null || s.ruleIds.has(diag.ruleId))
}

export function filterSuppressed(map: SuppressionMap, diagnostics: Diagnostic[]): Diagnostic[] {
  if (map.size === 0) return diagnostics
  return diagnostics.filter(d => !isSuppressed(map, d))
}
