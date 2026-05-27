import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs'
import { resolve, join } from 'path'
import chalk from 'chalk'

type Agent = 'claude-code' | 'cursor' | 'codex' | 'opencode' | 'auto'

const CLAUDE_SKILL = `# vue-radar

Run \`vue-radar\` to scan the Vue.js codebase for issues.

## When to use
- Before opening a PR
- After writing or editing Vue components
- When reviewing unfamiliar Vue code

## What it checks
| Category | Examples |
|---|---|
| security | v-html XSS, dynamic :href |
| correctness | v-if+v-for same element, missing :key, ref .value misuse |
| performance | no lazy components, index as key, deep ref on large objects |
| architecture | missing defineEmits/Props, component too large, explicit any |
| composition | watch without cleanup, side effects in computed, missing onUnmounted |

## Commands
\`\`\`bash
vue-radar                   # scan entire project
vue-radar --diff            # scan only changed files (git diff vs main)
vue-radar --json            # JSON output for programmatic use
vue-radar --rule v-html-unsafe,missing-key-in-v-for  # specific rules
vue-radar --skip no-async-component                  # exclude rules
vue-radar --fail-on warning # exit 1 on warnings too
\`\`\`

## Score
0–100. Deductions: error=10pts, warning=4pts, info=1pt.
A score below 70 should block a PR merge.
`

const CURSOR_RULES = `
# vue-radar integration
Before committing Vue components, run: npx vue-radar@latest --diff
Fix all errors, address warnings. Score must be ≥70 to ship.
Key rules: no v-html without DOMPurify, always :key in v-for, no direct reactive() replacement, cleanup in watch() async.
`

const CODEX_RULES = `vue-radar: run \`npx vue-radar@latest --diff\` after editing .vue files. Fix errors before continuing.`

function detectAgent(dir: string): Agent {
  if (existsSync(join(dir, '.claude'))) return 'claude-code'
  if (existsSync(join(dir, '.cursor')) || existsSync(join(dir, '.cursorrules'))) return 'cursor'
  if (existsSync(join(dir, '.codex'))) return 'codex'
  return 'claude-code'
}

export function install(dir: string, agent: Agent = 'auto'): void {
  const absDir = resolve(dir)
  const resolved = agent === 'auto' ? detectAgent(absDir) : agent

  console.log()
  console.log(chalk.bold('  vue-radar') + chalk.dim(' — agent skill install'))
  console.log()

  switch (resolved) {
    case 'claude-code': {
      const skillDir = join(absDir, '.claude', 'commands')
      mkdirSync(skillDir, { recursive: true })
      const skillPath = join(skillDir, 'vue-radar.md')
      writeFileSync(skillPath, CLAUDE_SKILL)
      console.log(`  ${chalk.green('✓')} Claude Code skill written → ${chalk.dim(skillPath)}`)
      console.log(`  ${chalk.dim('Use /vue-radar in Claude Code to run the scan.')}`)
      break
    }
    case 'cursor': {
      const rulesPath = join(absDir, '.cursorrules')
      if (existsSync(rulesPath)) {
        appendFileSync(rulesPath, CURSOR_RULES)
        console.log(`  ${chalk.green('✓')} Appended to → ${chalk.dim(rulesPath)}`)
      } else {
        writeFileSync(rulesPath, CURSOR_RULES.trim())
        console.log(`  ${chalk.green('✓')} Created → ${chalk.dim(rulesPath)}`)
      }
      break
    }
    case 'codex':
    case 'opencode': {
      const agentsPath = join(absDir, 'AGENTS.md')
      if (existsSync(agentsPath)) {
        appendFileSync(agentsPath, '\n' + CODEX_RULES)
        console.log(`  ${chalk.green('✓')} Appended to → ${chalk.dim(agentsPath)}`)
      } else {
        writeFileSync(agentsPath, CODEX_RULES)
        console.log(`  ${chalk.green('✓')} Created → ${chalk.dim(agentsPath)}`)
      }
      break
    }
  }

  console.log()
  console.log(`  ${chalk.dim('Detected agent:')} ${resolved}  ${chalk.dim('| Override with --agent <claude-code|cursor|codex>')}`)
  console.log()
}
