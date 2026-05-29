import chalk from 'chalk'
import { uiStrings } from './i18n'
import type { Lang } from './i18n'
import type { ScanResult, Diagnostic, Category } from './types'

const SEVERITY_ICON: Record<string, string> = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
}

const SEVERITY_COLOR: Record<string, (s: string) => string> = {
  error: (s) => chalk.red(s),
  warning: (s) => chalk.yellow(s),
  info: (s) => chalk.cyan(s),
}

const CATEGORY_COLOR: Record<Category, (s: string) => string> = {
  security:     (s) => chalk.bgRed.white(s),
  correctness:  (s) => chalk.red(s),
  performance:  (s) => chalk.yellow(s),
  architecture: (s) => chalk.blue(s),
  composition:  (s) => chalk.magenta(s),
}

const CATEGORY_DOT: Record<Category, (s: string) => string> = {
  security:     (s) => chalk.red(s),
  correctness:  (s) => chalk.red(s),
  performance:  (s) => chalk.yellow(s),
  architecture: (s) => chalk.blue(s),
  composition:  (s) => chalk.magenta(s),
}

function scoreColor(score: number): (s: string) => string {
  if (score >= 80) return (s) => chalk.green(s)
  if (score >= 50) return (s) => chalk.yellow(s)
  return (s) => chalk.red(s)
}

function scoreGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function renderScoreBlock(lang: Lang, score: number, files: number, duration: number, errors: number, warnings: number, infos: number): void {
  const ui = uiStrings(lang)
  const sc = scoreColor(score)
  const grade = scoreGrade(score)
  const BAR_WIDTH = 30
  const filled = Math.round((score / 100) * BAR_WIDTH)
  const empty = BAR_WIDTH - filled

  const bar = sc('█'.repeat(filled)) + chalk.dim('░'.repeat(empty))

  console.log(chalk.dim('  ' + '─'.repeat(54)))
  console.log()

  console.log(`  ${chalk.dim(ui.score)}  ${sc(chalk.bold(String(score).padStart(3)))}${chalk.dim('/100')}  ${sc(chalk.bold(grade))}`)
  console.log()
  console.log(`  ${bar}`)
  console.log()

  console.log(
    `  ${chalk.dim(ui.files)} ${files}  ` +
    `${chalk.dim(ui.time)} ${duration}ms  ` +
    `${chalk.red(`${errors}e`)}  ` +
    `${chalk.yellow(`${warnings}w`)}  ` +
    `${chalk.cyan(`${infos}i`)}`
  )
  console.log()
}

function formatDiagnostic(d: Diagnostic): string {
  const icon = SEVERITY_ICON[d.severity] ?? '•'
  const colorFn = SEVERITY_COLOR[d.severity] ?? ((s: string) => s)
  const loc = d.line ? `:${d.line}` : ''
  const location = chalk.dim(`${d.file}${loc}`)
  const badge = chalk.dim(`[${d.ruleId}]`)

  let out = `  ${colorFn(icon)} ${location}  ${badge}\n`
  out += `    ${d.message}\n`
  if (d.fix) {
    out += `    ${chalk.dim('→')} ${chalk.green(d.fix)}\n`
  }
  return out
}

export function printReport(result: ScanResult, lang: Lang = 'en'): void {
  const { score, files, diagnostics, duration, byCategory } = result
  const ui = uiStrings(lang)

  const errors   = diagnostics.filter(d => d.severity === 'error').length
  const warnings = diagnostics.filter(d => d.severity === 'warning').length
  const infos    = diagnostics.filter(d => d.severity === 'info').length

  console.log()
  console.log(`  ${chalk.bold('vue-radar')}  ${chalk.dim('─')}  ${chalk.dim(ui.health)}`)
  console.log()

  const categories: Category[] = ['security', 'correctness', 'performance', 'architecture', 'composition']

  for (const cat of categories) {
    const diags = byCategory[cat] ?? []
    if (diags.length === 0) continue

    const colorFn = CATEGORY_COLOR[cat]
    const dot = CATEGORY_DOT[cat]('●')
    const label = diags.length !== 1 ? ui.issues : ui.issue
    console.log(`  ${dot}  ${colorFn(` ${ui.categories[cat]} `)}  ${chalk.dim(`${diags.length} ${label}`)}`)
    console.log()
    diags.forEach(d => process.stdout.write(formatDiagnostic(d)))
    console.log()
  }

  if (diagnostics.length === 0) {
    console.log(`  ${chalk.green('✓')} ${ui.noIssues}`)
    console.log()
  }

  renderScoreBlock(lang, score, files, duration, errors, warnings, infos)
}

const SEVERITY_RANK: Record<string, number> = { error: 0, warning: 1, info: 2 }

/**
 * Pre-computed presentation fields so an agent (e.g. the /vue-radar Claude
 * skill) can render the report by interpolation alone — no manual arithmetic
 * for the bar, grade, icon or counts, which is where rendering drifts.
 */
function buildSummary(result: ScanResult) {
  const { score, files, diagnostics, duration } = result
  const errors   = diagnostics.filter(d => d.severity === 'error').length
  const warnings = diagnostics.filter(d => d.severity === 'warning').length
  const infos    = diagnostics.filter(d => d.severity === 'info').length

  const BAR_WIDTH = 20
  const filled = Math.round((score / 100) * BAR_WIDTH)
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)

  const scoreIcon = score >= 80 ? '✅' : score >= 50 ? '⚠️' : '🔴'

  // Highest-severity, earliest issue — what the agent should tell the user to
  // fix first.
  const priority = [...diagnostics].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)
  )[0]

  return {
    score,
    grade: scoreGrade(score),
    scoreIcon,
    bar,
    files,
    errors,
    warnings,
    infos,
    duration,
    priority: priority
      ? { ruleId: priority.ruleId, file: priority.file, line: priority.line, severity: priority.severity }
      : null,
  }
}

export function printJson(result: ScanResult): void {
  console.log(JSON.stringify({ ...result, summary: buildSummary(result) }, null, 2))
}
