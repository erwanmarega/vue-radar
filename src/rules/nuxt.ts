import type { Rule } from '../types'
import { walkAst, collectCalls, calleeName, isInsideSetup } from '../ast-utils'

const SETUP_ONLY_FETCH = new Set([
  'useFetch', 'useAsyncData', 'useLazyFetch', 'useLazyAsyncData',
])

export const nuxtUseFetchOutsideSetup: Rule = {
  id: 'nuxt-usefetch-outside-setup',
  name: 'useFetch/useAsyncData outside setup context',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    // <script setup> is always a valid context; only check the Options API.
    if (ctx.sfc.scriptSetup || !ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      const name = calleeName(call)
      if (!name || !SETUP_ONLY_FETCH.has(name)) continue
      if (isInsideSetup(call)) continue
      ctx.report({
        ruleId: 'nuxt-usefetch-outside-setup',
        category: 'composition',
        severity: 'error',
        message: 'useFetch/useAsyncData called outside setup(). These composables require the Nuxt composable context.',
        line: (call as any).loc?.start.line,
        fix: 'Move into setup() or use <script setup>.',
      })
    }
  },
}

export const nuxtMissingPageMeta: Rule = {
  id: 'nuxt-missing-page-meta',
  name: 'Nuxt page without definePageMeta',
  category: 'architecture',
  severity: 'info',
  check(ctx) {
    if (!/pages\/|layouts\//.test(ctx.filename)) return
    if (!ctx.sfc.scriptSetup || !ctx.scriptAst) return

    const hasPageMeta = collectCalls(ctx.scriptAst).some(c => calleeName(c) === 'definePageMeta')
    if (!hasPageMeta) {
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

const SETUP_ONLY_COMPOSABLES = new Set(['useRoute', 'useRouter', 'useNuxtApp', 'useState'])

export const nuxtUseRouteOutsideSetup: Rule = {
  id: 'nuxt-use-route-outside-setup',
  name: 'useRoute/useRouter outside setup',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    if (ctx.sfc.scriptSetup || !ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      const name = calleeName(call)
      if (!name || !SETUP_ONLY_COMPOSABLES.has(name)) continue
      if (isInsideSetup(call)) continue
      ctx.report({
        ruleId: 'nuxt-use-route-outside-setup',
        category: 'composition',
        severity: 'error',
        message: 'Nuxt composable called outside setup context. Will throw "nuxt instance unavailable".',
        line: (call as any).loc?.start.line,
        fix: 'Move into setup() or use <script setup>.',
      })
    }
  },
}

/** True if a useFetch/useAsyncData result destructures `error` or `status`. */
function destructuresError(call: any): boolean {
  const declarator = call.parent
  if (declarator?.type !== 'VariableDeclarator') return false
  const id = declarator.id
  if (id?.type !== 'ObjectPattern') return false
  return (id.properties ?? []).some((p: any) =>
    p.type === 'Property' && p.key?.type === 'Identifier' && (p.key.name === 'error' || p.key.name === 'status'),
  )
}

export const nuxtFetchWithoutErrorHandling: Rule = {
  id: 'nuxt-fetch-no-error-handling',
  name: 'useFetch without error handling',
  category: 'correctness',
  severity: 'warning',
  check(ctx) {
    if (!ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      const name = calleeName(call)
      if (name !== 'useFetch' && name !== 'useAsyncData') continue
      if (destructuresError(call)) continue
      ctx.report({
        ruleId: 'nuxt-fetch-no-error-handling',
        category: 'correctness',
        severity: 'warning',
        message: 'useFetch/useAsyncData without destructuring error. Network failures silently produce undefined data.',
        line: (call as any).loc?.start.line,
        fix: 'Destructure: const { data, error, pending } = useFetch(...) and handle error in template.',
      })
    }
  },
}

const SERVER_ONLY = new Set([
  'fs', 'path', 'os', 'child_process', 'net', 'crypto', 'http', 'https', 'stream',
])

export const nuxtServerOnlyInClient: Rule = {
  id: 'nuxt-server-import-in-client',
  name: 'Server-only import in client component',
  category: 'security',
  severity: 'error',
  check(ctx) {
    if (!ctx.scriptAst) return
    walkAst(ctx.scriptAst, (n: any) => {
      if (n.type !== 'ImportDeclaration') return
      const src = String(n.source?.value ?? '').replace(/^node:/, '')
      if (!SERVER_ONLY.has(src)) return
      ctx.report({
        ruleId: 'nuxt-server-import-in-client',
        category: 'security',
        severity: 'error',
        message: `Node.js built-in "${src}" imported in a component. Runs on client = crashes browser; exposes server internals.`,
        line: n.loc?.start.line,
        fix: 'Move to server/api/ route or use #imports to access server-only utils.',
      })
    })
  },
}
