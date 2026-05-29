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
        line: (call as any).loc?.start.line,
        msgId: 'nuxt-usefetch-outside-setup',
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
        msgId: 'nuxt-missing-page-meta',
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
        line: (call as any).loc?.start.line,
        msgId: 'nuxt-use-route-outside-setup',
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
        line: (call as any).loc?.start.line,
        msgId: 'nuxt-fetch-no-error-handling',
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
        line: n.loc?.start.line,
        msgId: 'nuxt-server-import-in-client',
        params: { mod: src },
      })
    })
  },
}
