#!/usr/bin/env node
import { Command } from 'commander'
import { scan } from './scanner'
import { printReport, printJson } from './reporter'
import { install } from './commands/install'
import { initAction } from './commands/init-action'
import { execSync } from 'child_process'

const program = new Command()

program
  .name('vue-radar')
  .description('Static analysis for Vue.js codebases. Catch bad Vue before it ships.')
  .version('0.1.0')

program
  .command('scan', { isDefault: true })
  .description('Scan Vue components for issues')
  .argument('[dir]', 'directory to scan', '.')
  .option('--json', 'output results as JSON')
  .option('--diff', 'scan only files changed vs main/master branch')
  .option('--rule <ids>', 'run only these rule IDs (comma-separated)')
  .option('--skip <ids>', 'skip these rule IDs (comma-separated)')
  .option('--fail-on <level>', 'exit 1 if issues at this severity exist (error|warning|info)', 'error')
  .action(async (dir: string, opts: {
    json?: boolean
    diff?: boolean
    rule?: string
    skip?: string
    failOn?: string
  }) => {
    let diffFiles: string[] | undefined

    if (opts.diff) {
      try {
        const base = execSync(
          'git merge-base HEAD main 2>/dev/null || git merge-base HEAD master',
          { encoding: 'utf-8' }
        ).trim()
        const changed = execSync(`git diff --name-only ${base}`, { encoding: 'utf-8' }).trim()
        diffFiles = changed.split('\n').filter(f => f.endsWith('.vue'))
      } catch {
        console.error('vue-radar: --diff requires a git repo with main/master branch')
        process.exit(1)
      }
    }

    const only = opts.rule ? opts.rule.split(',').map(s => s.trim()) : undefined
    const skip = opts.skip ? opts.skip.split(',').map(s => s.trim()) : undefined

    const result = await scan(dir, { diffFiles, only, skip })

    if (opts.json) {
      printJson(result)
    } else {
      printReport(result)
    }

    const failLevel = opts.failOn ?? 'error'
    const failSeverities =
      failLevel === 'info' ? ['error', 'warning', 'info']
      : failLevel === 'warning' ? ['error', 'warning']
      : ['error']

    const hasFailure = result.diagnostics.some(d => failSeverities.includes(d.severity))
    if (hasFailure) process.exit(1)
  })

program
  .command('install')
  .description('Install vue-doctor as an agent skill (Claude Code, Cursor, Codex)')
  .argument('[dir]', 'project root', '.')
  .option('--agent <name>', 'agent type: claude-code | cursor | codex | opencode (default: auto-detect)')
  .action((dir: string, opts: { agent?: string }) => {
    install(dir, (opts.agent as any) ?? 'auto')
  })

program
  .command('init-action')
  .description('Generate a GitHub Actions workflow for vue-doctor CI')
  .argument('[dir]', 'project root', '.')
  .action((dir: string) => {
    initAction(dir)
  })

program
  .command('rules')
  .description('List all available rules')
  .action(async () => {
    const { allRules } = await import('./rules')
    const chalk = (await import('chalk')).default
    console.log()
    console.log(chalk.bold('  vue-radar — rules'))
    console.log()
    const cats = [...new Set(allRules.map(r => r.category))]
    for (const cat of cats) {
      console.log(`  ${chalk.bold(cat.toUpperCase())}`)
      allRules.filter(r => r.category === cat).forEach(r => {
        const sev = r.severity === 'error' ? chalk.red(r.severity)
          : r.severity === 'warning' ? chalk.yellow(r.severity)
          : chalk.cyan(r.severity)
        console.log(`    ${chalk.dim(r.id.padEnd(40))} ${sev}`)
      })
      console.log()
    }
  })

program.parse()
