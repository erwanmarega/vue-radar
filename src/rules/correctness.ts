import type { Rule } from '../types'
import {
  walkElements,
  getDirective,
  getBoundProp,
  walkAst,
  varNamesByInitCall,
} from '../ast-utils'

export const vIfVForSameElement: Rule = {
  id: 'v-if-v-for-same-element',
  name: 'v-if and v-for on same element',
  category: 'correctness',
  severity: 'error',
  check(ctx) {
    if (!ctx.templateAst) return
    walkElements(ctx.templateAst, el => {
      const vFor = getDirective(el, 'for')
      const vIf = getDirective(el, 'if')
      if (vFor && vIf) {
        ctx.report({
          ruleId: 'v-if-v-for-same-element',
          category: 'correctness',
          severity: 'error',
          message: 'v-if and v-for on the same element. In Vue 3, v-if takes priority — it cannot access v-for variables.',
          line: el.loc.start.line,
          fix: 'Wrap with <template v-for> and put v-if on the inner element, or filter the array with computed().',
        })
      }
    })
  },
}

export const missingKeyInVFor: Rule = {
  id: 'missing-key-in-v-for',
  name: 'Missing :key in v-for',
  category: 'correctness',
  severity: 'warning',
  check(ctx) {
    if (!ctx.templateAst) return
    walkElements(ctx.templateAst, el => {
      const vFor = getDirective(el, 'for')
      if (!vFor) return
      // Either :key (bound) or a static key attribute satisfies Vue.
      if (getBoundProp(el, 'key')) return
      ctx.report({
        ruleId: 'missing-key-in-v-for',
        category: 'correctness',
        severity: 'warning',
        message: 'v-for without :key. Vue cannot efficiently patch the DOM without stable keys.',
        line: vFor.loc.start.line,
        fix: 'Add :key="item.id" — use a stable unique identifier, not the loop index.',
      })
    })
  },
}

export const missingDotValue: Rule = {
  id: 'missing-dot-value',
  name: 'Possible missing .value on ref',
  category: 'correctness',
  severity: 'warning',
  check(ctx) {
    if (!ctx.scriptAst) return
    const refNames = varNamesByInitCall(
      ctx.scriptAst,
      new Set(['ref', 'shallowRef', 'customRef']),
    )
    if (refNames.size === 0) return

    walkAst(ctx.scriptAst, (n: any) => {
      // Assigning to the ref identifier itself (not `.value`) replaces the ref.
      if (
        n.type === 'AssignmentExpression' &&
        n.left?.type === 'Identifier' &&
        refNames.has(n.left.name)
      ) {
        const name = n.left.name
        ctx.report({
          ruleId: 'missing-dot-value',
          category: 'correctness',
          severity: 'warning',
          message: `"${name}" is a ref but is assigned without .value. This overwrites the ref object, losing reactivity.`,
          line: n.loc?.start.line,
          fix: `Use ${name}.value = ... instead of ${name} = ...`,
        })
      }
    })
  },
}

export const directReactiveMutation: Rule = {
  id: 'direct-reactive-mutation',
  name: 'Direct reactive object replacement',
  category: 'correctness',
  severity: 'error',
  check(ctx) {
    if (!ctx.scriptAst) return
    const reactiveNames = varNamesByInitCall(ctx.scriptAst, new Set(['reactive']))
    if (reactiveNames.size === 0) return

    walkAst(ctx.scriptAst, (n: any) => {
      if (
        n.type === 'AssignmentExpression' &&
        n.operator === '=' &&
        n.left?.type === 'Identifier' &&
        reactiveNames.has(n.left.name)
      ) {
        const name = n.left.name
        ctx.report({
          ruleId: 'direct-reactive-mutation',
          category: 'correctness',
          severity: 'error',
          message: `Replacing reactive object "${name}" breaks reactivity. The proxy reference becomes stale.`,
          line: n.loc?.start.line,
          fix: `Mutate properties in-place: Object.assign(${name}, newData) or use ref() instead.`,
        })
      }
    })
  },
}
