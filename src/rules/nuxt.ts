import type { Rule } from '../types'

export const nuxtUseFetchOutsideSetup: Rule = {
  id: 'nuxt-usefetch-outside-setup',
  name: 'useFetch/useAsyncData outside setup context',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    if (ctx.sfc.scriptSetup) return

    const lines = script.split('\n')
    let inSetup = false
    let depth = 0

    lines.forEach((line, i) => {
      if (/\bsetup\s*\(/.test(line)) { inSetup = true; depth = 0 }
      if (inSetup) {
        depth += (line.match(/\{/g) ?? []).length
        depth -= (line.match(/\}/g) ?? []).length
        if (depth <= 0) inSetup = false
      }

      if (!inSetup && /\b(useFetch|useAsyncData|useLazyFetch|useLazyAsyncData)\s*\(/.test(line)) {
        ctx.report({
          ruleId: 'nuxt-usefetch-outside-setup',
          category: 'composition',
          severity: 'error',
          message: 'useFetch/useAsyncData called outside setup(). These composables require the Nuxt composable context.',
          line: i + 1,
          fix: 'Move into setup() or use <script setup>.',
        })
      }
    })
  },
}

export const nuxtMissingPageMeta: Rule = {
  id: 'nuxt-missing-page-meta',
  name: 'Nuxt page without definePageMeta',
  category: 'architecture',
  severity: 'info',
  check(ctx) {
    if (!/pages\/|layouts\//.test(ctx.filename)) return

    const script = ctx.sfc.scriptSetup?.content ?? ''
    if (!script) return

    if (!/definePageMeta\s*\(/.test(script)) {
      ctx.report({
        ruleId: 'nuxt-missing-page-meta',
        category: 'architecture',
        severity: 'info',
        message: 'Nuxt page component without definePageMeta(). Missing route metadata (title, middleware, layout, auth).',
        fix: "Add: definePageMeta({ title: 'Page Title', middleware: 'auth' })",
      })
    }
  },
}

export const nuxtUseRouteOutsideSetup: Rule = {
  id: 'nuxt-use-route-outside-setup',
  name: 'useRoute/useRouter outside setup',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    if (ctx.sfc.scriptSetup) return

    const script = ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')
    let inSetup = false
    let depth = 0

    lines.forEach((line, i) => {
      if (/\bsetup\s*\(/.test(line)) { inSetup = true; depth = 0 }
      if (inSetup) {
        depth += (line.match(/\{/g) ?? []).length
        depth -= (line.match(/\}/g) ?? []).length
        if (depth <= 0) inSetup = false
      }

      if (!inSetup && /\b(useRoute|useRouter|useNuxtApp|useState)\s*\(/.test(line)) {
        ctx.report({
          ruleId: 'nuxt-use-route-outside-setup',
          category: 'composition',
          severity: 'error',
          message: `Nuxt composable called outside setup context. Will throw "nuxt instance unavailable".`,
          line: i + 1,
          fix: 'Move into setup() or use <script setup>.',
        })
      }
    })
  },
}

export const nuxtFetchWithoutErrorHandling: Rule = {
  id: 'nuxt-fetch-no-error-handling',
  name: 'useFetch without error handling',
  category: 'correctness',
  severity: 'warning',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    lines.forEach((line, i) => {
      if (/\b(useFetch|useAsyncData)\s*\(/.test(line)) {
        if (!/\berror\b/.test(line) && !/\bstatus\b/.test(line)) {
          ctx.report({
            ruleId: 'nuxt-fetch-no-error-handling',
            category: 'correctness',
            severity: 'warning',
            message: 'useFetch/useAsyncData without destructuring error. Network failures silently produce undefined data.',
            line: i + 1,
            fix: 'Destructure: const { data, error, pending } = useFetch(...) and handle error in template.',
          })
        }
      }
    })
  },
}

export const nuxtServerOnlyInClient: Rule = {
  id: 'nuxt-server-import-in-client',
  name: 'Server-only import in client component',
  category: 'security',
  severity: 'error',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    const SERVER_ONLY = ['fs', 'path', 'os', 'child_process', 'net', 'crypto', 'http', 'https', 'stream']
    const re = new RegExp(`from\\s+['"](?:node:)?(${SERVER_ONLY.join('|')})['"]`)

    lines.forEach((line, i) => {
      if (re.test(line)) {
        const mod = line.match(re)?.[1]
        ctx.report({
          ruleId: 'nuxt-server-import-in-client',
          category: 'security',
          severity: 'error',
          message: `Node.js built-in "${mod}" imported in a component. Runs on client = crashes browser; exposes server internals.`,
          line: i + 1,
          fix: 'Move to server/api/ route or use #imports to access server-only utils.',
        })
      }
    })
  },
}
