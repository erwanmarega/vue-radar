import type { Rule } from '../types'

export const noAsyncComponent: Rule = {
  id: 'no-async-component',
  name: 'Large component not lazy-loaded',
  category: 'performance',
  severity: 'warning',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    lines.forEach((line, i) => {
      if (/^import\s+\w+\s+from\s+['"]/.test(line.trim())) {
        const isComponent = /[A-Z]/.test(line.split('from')[0])
        const isVue = /from\s+['"]vue['"]/.test(line)
        const isNode = /from\s+['"][^./]/.test(line) && !/\.vue/.test(line)
        if (isComponent && !isVue && !isNode) {
          ctx.report({
            ruleId: 'no-async-component',
            category: 'performance',
            severity: 'info',
            message: `Static import of "${line.trim().split(/\s+/)[1]}" increases initial bundle size.`,
            line: i + 1,
            fix: 'Use defineAsyncComponent(() => import("./MyComp.vue")) for route-level or heavy components.',
          })
        }
      }
    })
  },
}

export const inlineComplexHandler: Rule = {
  id: 'inline-complex-handler',
  name: 'Complex inline event handler',
  category: 'performance',
  severity: 'info',
  check(ctx) {
    const template = ctx.sfc.template?.content ?? ''
    const lines = template.split('\n')

    lines.forEach((line, i) => {
      if (/@\w+\s*=\s*["'][^"']{40,}["']/.test(line) || /v-on:\w+\s*=\s*["'][^"']{40,}["']/.test(line)) {
        ctx.report({
          ruleId: 'inline-complex-handler',
          category: 'performance',
          severity: 'info',
          message: 'Long inline event handler in template. Hard to test and re-parsed on every render.',
          line: i + 1,
          fix: 'Extract to a named method in <script setup>.',
        })
      }
    })
  },
}

export const missingShallowRef: Rule = {
  id: 'missing-shallow-ref',
  name: 'Deep ref for large object',
  category: 'performance',
  severity: 'info',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    lines.forEach((line, i) => {
      if (/=\s*ref\s*\(\s*\[/.test(line) || /=\s*ref\s*\(\s*\{/.test(line)) {
        ctx.report({
          ruleId: 'missing-shallow-ref',
          category: 'performance',
          severity: 'info',
          message: 'ref() deep-tracks all nested properties. For large arrays/objects, consider shallowRef().',
          line: i + 1,
          fix: 'Use shallowRef() if you only replace the whole value, not mutate nested props.',
        })
      }
    })
  },
}

export const vForWithIndex: Rule = {
  id: 'v-for-index-as-key',
  name: 'Array index used as v-for key',
  category: 'performance',
  severity: 'warning',
  check(ctx) {
    const template = ctx.sfc.template?.content ?? ''
    const lines = template.split('\n')

    lines.forEach((line, i) => {
      if (/\bv-for\b.+\bindex\b/.test(line) && /:key\s*=\s*["']index["']/.test(line)) {
        ctx.report({
          ruleId: 'v-for-index-as-key',
          category: 'performance',
          severity: 'warning',
          message: 'Array index as :key causes wrong DOM reuse when list order changes.',
          line: i + 1,
          fix: 'Use a stable unique ID: :key="item.id"',
        })
      }
    })
  },
}
