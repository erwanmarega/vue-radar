# vue-radar

Static analysis for Vue.js codebases. Catch bad Vue before it ships.

```
$ npx vue-radar@latest

  ✖ LoginForm.vue:42   [v-html-unsafe]
    v-html renders raw HTML — XSS vector
    → sanitize with DOMPurify first

  ⚠ UserList.vue:17    [missing-key-in-v-for]
    v-for without :key

  score  ████████████░░░░  74/100
  3 files  1 error  1 warning  312ms
```

## Usage

```bash
# scan entire project
npx vue-radar@latest

# scan a single component
npx vue-radar@latest src/components/LoginForm.vue

# scan specific files, a folder, or a glob (any mix)
npx vue-radar@latest src/components/LoginForm.vue src/App.vue
npx vue-radar@latest src/components
npx vue-radar@latest 'src/**/*.vue'

# scan only changed files (git diff vs main)
npx vue-radar@latest --diff

# JSON output
npx vue-radar@latest --json

# run specific rules only
npx vue-radar@latest --rule v-html-unsafe,missing-key-in-v-for

# skip rules
npx vue-radar@latest --skip no-async-component,missing-shallow-ref

# exit 1 on warnings too (useful for CI)
npx vue-radar@latest --fail-on warning

# use an explicit config file
npx vue-radar@latest --config vue-radar.config.json

# report language (en | fr) — defaults to config, then system locale
npx vue-radar@latest --lang fr

# list all rules
npx vue-radar@latest rules
```

## Commands

| Command | Argument | Description |
|---|---|---|
| `scan` *(default)* | `[targets...]` | Scan the given files, directories or globs (default: current directory). Runs when no command is named. |
| `install` | `[dir]` | Install vue-radar as an agent skill (Claude Code, Cursor, Codex/OpenCode). |
| `init-action` | `[dir]` | Generate a GitHub Actions workflow (`.github/workflows/vue-radar.yml`). |
| `rules` | — | List every available rule with its category and severity. |

### `scan` options

| Option | Description |
|---|---|
| `--json` | Output results as JSON (includes a pre-computed `summary`). |
| `--diff` | Scan only files changed vs the `main`/`master` branch. |
| `--rule <ids>` | Run only these rule IDs (comma-separated). |
| `--skip <ids>` | Skip these rule IDs (comma-separated). |
| `--config <path>` | Path to a config file (default: auto-detect at project root). |
| `--lang <code>` | Report language: `en` or `fr` (default: config → system locale → `en`). |
| `--fail-on <level>` | Exit `1` if issues at this severity exist: `error` (default) \| `warning` \| `info`. |

### `install` options

| Option | Description |
|---|---|
| `--agent <name>` | Target agent: `claude-code` \| `cursor` \| `codex` \| `opencode` (default: auto-detect). |

## Configuration

Drop a `vue-radar.config.json` (or `.vue-radarrc.json`) in your project root.
It is auto-detected; override with `--config <path>`.

```json
{
  "rules": {
    "v-html-unsafe": "error",
    "dynamic-href-unsafe": "warning",
    "missing-key-in-v-for": "off"
  },
  "ignore": ["**/legacy/**", "**/*.spec.vue"],
  "failOn": "error",
  "lang": "fr"
}
```

- **`rules`** — per-rule override. `"off"` disables the rule; `"error"`,
  `"warning"`/`"warn"`, `"info"` change its reported severity.
- **`ignore`** — extra glob patterns excluded from scanning (on top of
  `node_modules`, `dist`, `.nuxt`, `.output`).
- **`failOn`** — severity threshold that makes the CLI exit `1`.
- **`lang`** — report language, `"en"` or `"fr"`. Resolution order:
  `--lang` flag → config `lang` → system locale (`LANG`/`LC_ALL`) → `en`.

CLI flags win over the config file: `--skip` adds to disabled rules, `--rule`
narrows to the listed rules, and `--fail-on` overrides `failOn`.

## Suppressing issues inline

Silence a specific finding without disabling the rule project-wide. Works in
both template (HTML) and script (JS/TS) comments. Omit the rule ids to suppress
every rule on the target line.

```vue
<template>
  <!-- vue-radar-disable-next-line v-html-unsafe -->
  <p v-html="trustedMarkdown"></p>

  <a :href="url">link</a> <!-- vue-radar-disable-line dynamic-href-unsafe -->
</template>

<script setup lang="ts">
// vue-radar-disable-next-line no-explicit-any
const data: any = await fetchLegacy()
</script>
```

- `vue-radar-disable-next-line [rule-a,rule-b]` — silence the next line.
- `vue-radar-disable-line [rule-a,rule-b]` — silence the current line.

## Install as agent skill

```bash
# auto-detects your agent (Claude Code, Cursor, Codex)
npx vue-radar@latest install

# or specify
npx vue-radar@latest install --agent claude-code
npx vue-radar@latest install --agent cursor
npx vue-radar@latest install --agent codex
```

**Claude Code** → writes `.claude/commands/vue-radar.md` → `/vue-radar` slash command available  
**Cursor** → appends to `.cursorrules`  
**Codex / OpenCode** → writes `AGENTS.md`

## GitHub Actions

```bash
npx vue-radar@latest init-action
```

Generates `.github/workflows/vue-radar.yml`. On every PR touching `.vue/.ts/.js`:
- posts a sticky comment with score + issue table
- fails CI if errors found
- uploads JSON report as artifact

## Rules

24 rules across 5 categories. Nuxt rules auto-enabled when `nuxt.config.ts` is detected.

### Security
| Rule | Severity |
|---|---|
| `v-html-unsafe` | error |
| `dynamic-href-unsafe` | warning |
| `nuxt-server-import-in-client` | error |

### Correctness
| Rule | Severity |
|---|---|
| `v-if-v-for-same-element` | error |
| `direct-reactive-mutation` | error |
| `side-effect-in-computed` | error |
| `lifecycle-outside-setup` | error |
| `nuxt-usefetch-outside-setup` | error |
| `nuxt-use-route-outside-setup` | error |
| `missing-key-in-v-for` | warning |
| `missing-dot-value` | warning |
| `watch-missing-cleanup` | warning |
| `missing-on-unmounted-cleanup` | warning |
| `nuxt-fetch-no-error-handling` | warning |

### Performance
| Rule | Severity |
|---|---|
| `v-for-index-as-key` | warning |
| `no-async-component` | info |
| `missing-shallow-ref` | info |
| `inline-complex-handler` | info |

### Architecture
| Rule | Severity |
|---|---|
| `component-too-large` | error |
| `missing-define-emits` | warning |
| `missing-define-props` | warning |
| `no-explicit-any` | info |
| `missing-expose` | info |
| `nuxt-missing-page-meta` | info |

## Score

`0–100`. Penalty per diagnostic: `error = 10pts`, `warning = 4pts`, `info = 1pt`.

Use `--json` to get `result.score` programmatically for CI gates.

## Supported frameworks

Vue 3 · Nuxt 3 · Vite · Quasar · Ionic Vue

## How analysis works

Rules run against real ASTs, not text matching:

- **Templates** are parsed with `@vue/compiler-sfc` + `@vue/compiler-dom` —
  directives, `v-for`/`v-if`, `:key` and bindings are inspected structurally.
- **Scripts** are parsed with `@typescript-eslint/typescript-estree` — calls
  (`ref`, `reactive`, `computed`, `watch`, lifecycle hooks, `useFetch`) are
  resolved by name and scope, assignments and type nodes (e.g. `any`) by node
  type. No brace-counting, no line regex.

This keeps false positives low: `any` in a comment, a ref reassigned vs.
declared, a `reactive` property set vs. replaced, or a lifecycle hook inside
`<script setup>` are all distinguished correctly. Each rule is covered by
pass/fail tests in `src/rules.test.ts` (`npm test`).

## Local development

```bash
git clone https://github.com/your-org/vue-radar
cd vue-radar
npm install
npm run build

# link globally
npm link

# run on any Vue project
vue-radar /path/to/project
```

### Add a rule

1. Create or edit a file in `src/rules/`
2. Implement the `Rule` interface:

```typescript
import type { Rule } from '../types'

export const myRule: Rule = {
  id: 'my-rule-id',
  name: 'Human readable name',
  category: 'correctness', // security | correctness | performance | architecture | composition
  severity: 'warning',     // error | warning | info
  check(ctx) {
    // Walk the template AST (ctx.templateAst) and/or the script AST
    // (ctx.scriptAst). Helpers live in src/ast-utils.ts: walkElements,
    // getDirective, collectCalls, calleeName, isInsideSetup, varNamesByInitCall…
    if (!ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      if (calleeName(call) !== 'badApi') continue
      ctx.report({
        ruleId: 'my-rule-id',
        category: 'correctness',
        severity: 'warning',
        message: 'Explain what is wrong.',
        line: (call as any).loc?.start.line,
        fix: 'Explain how to fix it.',
      })
    }
  },
}
```

3. Export it from `src/rules/index.ts`
4. Add pass/fail cases in `src/rules.test.ts`
5. `npm test`

## License

MIT
