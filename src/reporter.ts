import chalk from 'chalk'
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
  security: (s) => chalk.bgRed.white(s),
  correctness: (s) => chalk.red(s),
  performance: (s) => chalk.yellow(s),
  architecture: (s) => chalk.blue(s),
  composition: (s) => chalk.magenta(s),
}

function scoreColor(score: number): (s: string) => string {
  if (score >= 80) return (s) => chalk.green(s)
  if (score >= 50) return (s) => chalk.yellow(s)
  return (s) => chalk.red(s)
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 5)
  const empty = 20 - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
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

export function printReport(result: ScanResult): void {
  const { score, files, diagnostics, duration, byCategory } = result

  console.log()
  console.log(chalk.bold('  vue-radar') + chalk.dim(' — codebase health report'))
  console.log(chalk.dim('  ' + '─'.repeat(50)))
  console.log()

  const categories: Category[] = ['security', 'correctness', 'performance', 'architecture', 'composition']

  for (const cat of categories) {
    const diags = byCategory[cat] ?? []
    if (diags.length === 0) continue

    const colorFn = CATEGORY_COLOR[cat]
    console.log(`  ${colorFn(` ${cat.toUpperCase()} `)}  ${chalk.dim(`${diags.length} issue${diags.length !== 1 ? 's' : ''}`)}`)
    console.log()
    diags.forEach(d => process.stdout.write(formatDiagnostic(d)))
    console.log()
  }

  // summary line
  const errors = diagnostics.filter(d => d.severity === 'error').length
  const warnings = diagnostics.filter(d => d.severity === 'warning').length
  const infos = diagnostics.filter(d => d.severity === 'info').length

  console.log(chalk.dim('  ' + '─'.repeat(50)))
  console.log()

  const sc = scoreColor(score)
  console.log(`  Health score  ${sc(scoreBar(score))}  ${sc(chalk.bold(score + '/100'))}`)
  console.log()
  console.log(
    `  ${chalk.dim('Scanned')} ${files} file${files !== 1 ? 's' : ''}  ` +
    `${chalk.dim('in')} ${duration}ms  ` +
    `${chalk.red(`${errors} error${errors !== 1 ? 's' : ''}`)}  ` +
    `${chalk.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`)}  ` +
    `${chalk.cyan(`${infos} hint${infos !== 1 ? 's' : ''}`)}`
  )
  console.log()

  if (diagnostics.length === 0) {
    console.log(`  ${chalk.green('✓')} No issues found. Ship it.`)
    console.log()
  }
}

export function printJson(result: ScanResult): void {
  console.log(JSON.stringify(result, null, 2))
}
