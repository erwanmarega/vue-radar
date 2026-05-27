# vue-doctor

Run `npx vue-doctor@latest` to diagnose Vue.js codebase health.

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
```bash
npx vue-doctor@latest            # scan entire project
npx vue-doctor@latest --diff     # scan only changed files (git diff vs main)
npx vue-doctor@latest --json     # JSON output for programmatic use
npx vue-doctor@latest --rule v-html-unsafe,missing-key-in-v-for  # specific rules
npx vue-doctor@latest --skip no-async-component                   # exclude rules
npx vue-doctor@latest --fail-on warning  # exit 1 on warnings too
```

## Score
0–100. Deductions: error=10pts, warning=4pts, info=1pt.
Run `npx vue-doctor@latest --json` and parse `result.score` in CI gates.
