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
        line: node.loc?.start.line,
        msgId: 'no-async-component',
        params: { name, source },
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
              line: p.loc.start.line,
              msgId: 'inline-complex-handler',
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
          line: n.loc?.start.line,
          msgId: 'missing-shallow-ref',
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
          line: keyDir.loc.start.line,
          msgId: 'v-for-index-as-key',
        })
      }
    })
  },
}
