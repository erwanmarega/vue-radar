import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs'
import { resolve, join } from 'path'
import chalk from 'chalk'

type Agent = 'claude-code' | 'cursor' | 'codex' | 'opencode' | 'auto'

const CLAUDE_SKILL = `# vue-radar

Run \`vue-radar --json\` and render the result as Markdown using **exactly** the
format below. Do not invent tables, sections, or values.

The JSON already contains a \`summary\` object with everything pre-computed — use
those fields verbatim. **Never recompute the bar, grade, icon, or counts
yourself.** The only thing you write from scratch is the one-line priority advice.

\`\`\`
summary.score      number 0–100        summary.bar       20-char █/░ string
summary.scoreIcon  ✅ / ⚠️ / 🔴          summary.grade     A–F
summary.files      file count          summary.duration  ms
summary.errors / .warnings / .infos    severity counts
summary.priority   { ruleId, file, line, severity } | null
\`\`\`

## Output format (copy this structure exactly)

---

## {summary.scoreIcon} vue-radar — {summary.score}/100  ·  grade {summary.grade}

\`{summary.bar}\`

{summary.files} files · {summary.errors} errors · {summary.warnings} warnings · {summary.duration}ms

---

{for each category in diagnostics that has at least one issue, in this order —
security, correctness, performance, architecture, composition:}
### {cat_emoji} {Category}
{for each issue in that category:}
{sev_icon} \`{file}:{line}\` **{ruleId}**
{message}
> ↳ {fix}

{end}

---

*{one sentence of priority advice, referencing summary.priority — e.g. "Fix
v-html-unsafe in LoginForm.vue first — it's the only error."}*

## Legend

**cat_emoji:** 🔒 security · ✅ correctness · ⚡ performance · 🏗 architecture · 🔄 composition
**sev_icon:** 🔴 error · 🟡 warning · 🔵 info

If there are zero diagnostics, respond with a single line and stop:
\`✅ **vue-radar — 100/100** — nothing to fix.\`

## Flags
\`\`\`
vue-radar --json            full project
vue-radar --json --diff     changed files only
vue-radar --json --skip no-async-component
\`\`\`
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
