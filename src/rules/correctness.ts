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
          line: el.loc.start.line,
          msgId: 'v-if-v-for-same-element',
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
        line: vFor.loc.start.line,
        msgId: 'missing-key-in-v-for',
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
          line: n.loc?.start.line,
          msgId: 'missing-dot-value',
          params: { name },
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
          line: n.loc?.start.line,
          msgId: 'direct-reactive-mutation',
          params: { name },
        })
      }
    })
  },
}
