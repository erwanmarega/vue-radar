import type { Rule } from '../types'
import { walkElements, getDirective, getBoundProp, walkAst, calleeName, NodeTypes } from '../ast-utils'

export const noAsyncComponent: Rule = {
  id: 'no-async-component',
  name: 'Large component not lazy-loaded',
  category: 'performance',
  severity: 'info',
  check(ctx) {
    if (!ctx.scriptAst) return
    for (const node of ctx.scriptAst.body) {
      if (node.type !== 'ImportDeclaration') continue
      const source = node.source.value as string
      // Only flag .vue component imports — not utilities, images, styles, or packages.
      if (!source.endsWith('.vue')) continue
      const defaultSpec = node.specifiers.find(s => s.type === 'ImportDefaultSpecifier')
      if (!defaultSpec) continue
      const name = (defaultSpec as any).local.name as string
      if (!/^[A-Z]/.test(name)) continue
      ctx.report({
        ruleId: 'no-async-component',
        category: 'performance',
        severity: 'info',
        message: `Static import of "${name}" increases initial bundle size.`,
        line: node.loc?.start.line,
        fix: `const ${name} = defineAsyncComponent(() => import('${source}'))`,
      })
    }
  },
}

export const inlineComplexHandler: Rule = {
  id: 'inline-complex-handler',
  name: 'Complex inline event handler',
  category: 'performance',
  severity: 'info',
  check(ctx) {
    if (!ctx.templateAst) return
    walkElements(ctx.templateAst, el => {
      for (const p of (el.props ?? [])) {
        if (p.type === NodeTypes.DIRECTIVE && p.name === 'on' && p.exp) {
          const exp = p.exp.content ?? ''
          if (exp.length > 40) {
            ctx.report({
              ruleId: 'inline-complex-handler',
              category: 'performance',
              severity: 'info',
              message: 'Long inline event handler in template. Hard to test and re-parsed on every render.',
              line: p.loc.start.line,
              fix: 'Extract to a named method in <script setup>.',
            })
          }
        }
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
    if (!ctx.scriptAst) return
    walkAst(ctx.scriptAst, (n: any) => {
      if (n.type !== 'CallExpression') return
      if (calleeName(n) !== 'ref') return
      const arg = n.arguments?.[0]
      if (arg && (arg.type === 'ObjectExpression' || arg.type === 'ArrayExpression')) {
        ctx.report({
          ruleId: 'missing-shallow-ref',
          category: 'performance',
          severity: 'info',
          message: 'ref() deep-tracks all nested properties. For large arrays/objects, consider shallowRef().',
          line: n.loc?.start.line,
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
    if (!ctx.templateAst) return
    walkElements(ctx.templateAst, el => {
      const vFor = getDirective(el, 'for')
      if (!vFor) return
      const forExp = vFor.exp?.content ?? ''
      // Index variable from "(item, idx) in list".
      const m = forExp.match(/\(\s*\w+\s*,\s*(\w+)\s*\)/)
      if (!m) return
      const indexVar = m[1]
      const keyDir = getBoundProp(el, 'key')
      if (keyDir && (keyDir.exp?.content ?? '').trim() === indexVar) {
        ctx.report({
          ruleId: 'v-for-index-as-key',
          category: 'performance',
          severity: 'warning',
          message: 'Array index as :key causes wrong DOM reuse when list order changes.',
          line: keyDir.loc.start.line,
          fix: 'Use a stable unique ID: :key="item.id"',
        })
      }
    })
  },
}
