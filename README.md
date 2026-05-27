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

# list all rules
npx vue-radar@latest rules
```

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
    const template = ctx.sfc.template?.content ?? ''
    // analyse ctx.sfc.template, ctx.sfc.scriptSetup, ctx.scriptAst
    // call ctx.report() if issue found
    if (/bad-pattern/.test(template)) {
      ctx.report({
        ruleId: 'my-rule-id',
        category: 'correctness',
        severity: 'warning',
        message: 'Explain what is wrong.',
        line: 1,
        fix: 'Explain how to fix it.',
      })
    }
  },
}
```

3. Export it from `src/rules/index.ts`
4. `npm run build`

## License

MIT
