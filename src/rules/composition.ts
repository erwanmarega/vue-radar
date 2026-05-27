import type { Rule } from '../types'

export const watchMissingCleanup: Rule = {
  id: 'watch-missing-cleanup',
  name: 'Async fetch in watch without cleanup',
  category: 'composition',
  severity: 'warning',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    let inWatch = false
    let braceDepth = 0
    let watchStart = -1
    let hasFetch = false
    let hasCleanup = false

    lines.forEach((line, i) => {
      if (/\bwatch\s*\(|\bwatchEffect\s*\(/.test(line)) {
        inWatch = true
        watchStart = i
        braceDepth = 0
        hasFetch = false
        hasCleanup = false
      }

      if (inWatch) {
        braceDepth += (line.match(/\{/g) ?? []).length
        braceDepth -= (line.match(/\}/g) ?? []).length

        if (/\bfetch\s*\(|\baxios\b|\$fetch\b|useFetch|useAsyncData/.test(line)) hasFetch = true
        if (/onWatcherCleanup|onCleanup|AbortController/.test(line)) hasCleanup = true

        if (braceDepth <= 0 && watchStart >= 0) {
          if (hasFetch && !hasCleanup) {
            ctx.report({
              ruleId: 'watch-missing-cleanup',
              category: 'composition',
              severity: 'warning',
              message: 'Async fetch inside watch() without cleanup. Causes race conditions when deps change rapidly.',
              line: watchStart + 1,
              fix: 'Use onWatcherCleanup(() => controller.abort()) or AbortController to cancel stale requests.',
            })
          }
          inWatch = false
          watchStart = -1
        }
      }
    })
  },
}

export const sideEffectInComputed: Rule = {
  id: 'side-effect-in-computed',
  name: 'Side effect inside computed()',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    let inComputed = false
    let braceDepth = 0
    let computedStart = -1

    lines.forEach((line, i) => {
      if (/\bcomputed\s*\(/.test(line)) {
        inComputed = true
        computedStart = i
        braceDepth = 0
      }

      if (inComputed) {
        braceDepth += (line.match(/\{/g) ?? []).length
        braceDepth -= (line.match(/\}/g) ?? []).length

        if (/\bfetch\s*\(|\baxios\b|\$fetch\b|\bemit\s*\(|\brouter\.push\b|console\.\w+/.test(line)) {
          ctx.report({
            ruleId: 'side-effect-in-computed',
            category: 'composition',
            severity: 'error',
            message: 'Side effect inside computed(). Computed should be pure — only derive state, no mutations or async calls.',
            line: i + 1,
            fix: 'Move side effects to watch(), watchEffect(), or an event handler.',
          })
        }

        if (braceDepth <= 0 && computedStart >= 0) {
          inComputed = false
          computedStart = -1
        }
      }
    })
  },
}

export const lifecycleInSetup: Rule = {
  id: 'lifecycle-outside-setup',
  name: 'Lifecycle hook called outside setup context',
  category: 'composition',
  severity: 'error',
  check(ctx) {
    const script = ctx.sfc.script?.content ?? ''
    if (ctx.sfc.scriptSetup) return

    if (!script) return

    const lines = script.split('\n')
    let inSetup = false
    let setupDepth = 0

    lines.forEach((line, i) => {
      if (/\bsetup\s*\(/.test(line)) { inSetup = true; setupDepth = 0 }
      if (inSetup) {
        setupDepth += (line.match(/\{/g) ?? []).length
        setupDepth -= (line.match(/\}/g) ?? []).length
        if (setupDepth <= 0) inSetup = false
      }

      if (!inSetup && /\b(onMounted|onUnmounted|onUpdated|onBeforeMount|onCreated)\s*\(/.test(line)) {
        ctx.report({
          ruleId: 'lifecycle-outside-setup',
          category: 'composition',
          severity: 'error',
          message: 'Composition API lifecycle hook called outside setup(). Hook will be silently ignored.',
          line: i + 1,
          fix: 'Move lifecycle hooks inside setup() or use <script setup>.',
        })
      }
    })
  },
}

export const missingOnUnmounted: Rule = {
  id: 'missing-on-unmounted-cleanup',
  name: 'Event listener added without cleanup',
  category: 'composition',
  severity: 'warning',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    let hasAddEventListener = false
    let hasSetInterval = false
    let hasRemoveEventListener = false
    let hasClearInterval = false
    let hasOnUnmounted = false

    lines.forEach(line => {
      if (/addEventListener\s*\(/.test(line)) hasAddEventListener = true
      if (/setInterval\s*\(/.test(line)) hasSetInterval = true
      if (/removeEventListener\s*\(/.test(line)) hasRemoveEventListener = true
      if (/clearInterval\s*\(/.test(line)) hasClearInterval = true
      if (/onUnmounted\s*\(/.test(line)) hasOnUnmounted = true
    })

    if (hasAddEventListener && !hasRemoveEventListener && !hasOnUnmounted) {
      ctx.report({
        ruleId: 'missing-on-unmounted-cleanup',
        category: 'composition',
        severity: 'warning',
        message: 'addEventListener() without removeEventListener() in onUnmounted(). Memory leak on component destroy.',
        fix: 'Add onUnmounted(() => el.removeEventListener(...))',
      })
    }

    if (hasSetInterval && !hasClearInterval && !hasOnUnmounted) {
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
