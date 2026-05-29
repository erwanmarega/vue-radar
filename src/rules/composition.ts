import type { Rule } from '../types'
import {
  walkAst,
  collectCalls,
  calleeName,
  calleeObjectName,
  isInsideSetup,
} from '../ast-utils'

const FETCH_CALLS = new Set([
  'fetch', '$fetch', 'useFetch', 'useAsyncData', 'useLazyFetch', 'useLazyAsyncData',
])

/** A call that kicks off async I/O. */
function isAsyncFetchCall(call: any): boolean {
  const name = calleeName(call)
  if (name && FETCH_CALLS.has(name)) return true
  return calleeObjectName(call) === 'axios'
}

/** True if the subtree contains a watcher-cleanup call or `new AbortController`. */
function hasCleanup(root: any): boolean {
  let found = false
  walkAst(root, (n: any) => {
    if (n.type === 'CallExpression') {
      const name = calleeName(n)
      if (name === 'onWatcherCleanup' || name === 'onCleanup') found = true
    }
    if (n.type === 'NewExpression' && n.callee?.type === 'Identifier' && n.callee.name === 'AbortController') {
      found = true
    }
  })
  return found
}

export const watchMissingCleanup: Rule = {
  id: 'watch-missing-cleanup',
  name: 'Async fetch in watch without cleanup',
  category: 'composition',
  severity: 'warning',
  check(ctx) {
    if (!ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      const name = calleeName(call)
      if (name !== 'watch' && name !== 'watchEffect') continue

      // Inspect the watcher's callback arguments only.
      const args: any[] = (call as any).arguments ?? []
      const fetchInside = args.some(a =>
        collectCalls(a).some(c => c !== call && isAsyncFetchCall(c)),
      )
      if (!fetchInside) continue
      if (args.some(a => hasCleanup(a))) continue

      ctx.report({
        ruleId: 'watch-missing-cleanup',
        category: 'composition',
        severity: 'warning',
        message: 'Async fetch inside watch() without cleanup. Causes race conditions when deps change rapidly.',
        line: (call as any).loc?.start.line,
        fix: 'Use onWatcherCleanup(() => controller.abort()) or AbortController to cancel stale requests.',
      })
    }
  },
}

const COMPUTED_SIDE_EFFECTS = new Set(['emit', '$emit'])

/** A call that mutates state or performs I/O — illegal inside computed(). */
function isSideEffectCall(call: any): boolean {
  const name = calleeName(call)
  if (name && (FETCH_CALLS.has(name) || COMPUTED_SIDE_EFFECTS.has(name))) return true
  const obj = calleeObjectName(call)
  if (obj === 'axios') return true
  if (obj === 'console') return true
  if (obj === 'router' && name === 'push') return true
  return false
}

export const sideEffectInComputed: Rule = {
  id: 'side-effect-in-computed',
  name: 'Side effect inside computed()',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    if (!ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      if (calleeName(call) !== 'computed') continue
      const args: any[] = (call as any).arguments ?? []
      for (const arg of args) {
        for (const inner of collectCalls(arg)) {
          if (inner === call) continue
          if (isSideEffectCall(inner)) {
            ctx.report({
              ruleId: 'side-effect-in-computed',
              category: 'composition',
              severity: 'error',
              message: 'Side effect inside computed(). Computed should be pure — only derive state, no mutations or async calls.',
              line: (inner as any).loc?.start.line,
              fix: 'Move side effects to watch(), watchEffect(), or an event handler.',
            })
          }
        }
      }
    }
  },
}

const LIFECYCLE_HOOKS = new Set([
  'onMounted', 'onUnmounted', 'onUpdated', 'onBeforeMount',
  'onBeforeUnmount', 'onBeforeUpdate', 'onActivated', 'onDeactivated',
])

export const lifecycleInSetup: Rule = {
  id: 'lifecycle-outside-setup',
  name: 'Lifecycle hook called outside setup context',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    // Only relevant to the Options API. <script setup> is implicitly setup.
    if (ctx.sfc.scriptSetup || !ctx.scriptAst) return
    for (const call of collectCalls(ctx.scriptAst)) {
      const name = calleeName(call)
      if (!name || !LIFECYCLE_HOOKS.has(name)) continue
      if (isInsideSetup(call)) continue
      ctx.report({
        ruleId: 'lifecycle-outside-setup',
        category: 'composition',
        severity: 'error',
        message: 'Composition API lifecycle hook called outside setup(). Hook will be silently ignored.',
        line: (call as any).loc?.start.line,
        fix: 'Move lifecycle hooks inside setup() or use <script setup>.',
      })
    }
  },
}

export const missingOnUnmounted: Rule = {
  id: 'missing-on-unmounted-cleanup',
  name: 'Event listener added without cleanup',
  category: 'composition',
  severity: 'warning',
  check(ctx) {
    if (!ctx.scriptAst) return
    const names = new Set(collectCalls(ctx.scriptAst).map(calleeName).filter(Boolean) as string[])

    const hasOnUnmounted = names.has('onUnmounted') || names.has('onBeforeUnmount')

    if (names.has('addEventListener') && !names.has('removeEventListener') && !hasOnUnmounted) {
      ctx.report({
        ruleId: 'missing-on-unmounted-cleanup',
        category: 'composition',
        severity: 'warning',
        message: 'addEventListener() without removeEventListener() in onUnmounted(). Memory leak on component destroy.',
        fix: 'Add onUnmounted(() => el.removeEventListener(...))',
      })
    }

    if (names.has('setInterval') && !names.has('clearInterval') && !hasOnUnmounted) {
      ctx.report({
        ruleId: 'missing-on-unmounted-cleanup',
        category: 'composition',
        severity: 'warning',
        message: 'setInterval() without clearInterval() in onUnmounted(). Timer keeps running after component unmounts.',
        fix: 'Add onUnmounted(() => clearInterval(timer))',
      })
    }
  },
}
