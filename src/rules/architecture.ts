import type { Rule } from '../types'
import { walkAst, walkElements, getStaticAttr, calleeName } from '../ast-utils'

/** Set of call names used anywhere in the script AST. */
function callNames(scriptAst: any): Set<string> {
  const names = new Set<string>()
  walkAst(scriptAst, (n: any) => {
    if (n.type === 'CallExpression') {
      const name = calleeName(n)
      if (name) names.add(name)
    }
  })
  return names
}

export const missingDefineEmits: Rule = {
  id: 'missing-define-emits',
  name: 'Emitting events without defineEmits',
  category: 'architecture',
  severity: 'warning',
  check(ctx) {
    if (!ctx.sfc.scriptSetup || !ctx.scriptAst) return
    const calls = callNames(ctx.scriptAst)
    const hasEmit = calls.has('emit') || calls.has('$emit')
    if (hasEmit && !calls.has('defineEmits')) {
      ctx.report({
        ruleId: 'missing-define-emits',
        category: 'architecture',
        severity: 'warning',
        msgId: 'missing-define-emits',
      })
    }
  },
}

export const missingDefineProps: Rule = {
  id: 'missing-define-props',
  name: 'Props used without defineProps',
  category: 'architecture',
  severity: 'warning',
  check(ctx) {
    if (!ctx.sfc.scriptSetup || !ctx.scriptAst) return

    let usesProps = false
    walkAst(ctx.scriptAst, (n: any) => {
      if (
        n.type === 'MemberExpression' &&
        n.object?.type === 'Identifier' &&
        (n.object.name === 'props' || n.object.name === '$props')
      ) {
        usesProps = true
      }
    })

    const calls = callNames(ctx.scriptAst)
    const hasDefineProps = calls.has('defineProps') || calls.has('withDefaults')

    if (usesProps && !hasDefineProps) {
      ctx.report({
        ruleId: 'missing-define-props',
        category: 'architecture',
        severity: 'warning',
        msgId: 'missing-define-props',
      })
    }
  },
}

export const componentTooLarge: Rule = {
  id: 'component-too-large',
  name: 'Oversized component',
  category: 'architecture',
  severity: 'info',
  check(ctx) {
    const lines = ctx.source.split('\n').length

    if (lines > 400) {
      ctx.report({
        ruleId: 'component-too-large',
        category: 'architecture',
        severity: 'error',
        msgId: 'component-too-large-error',
        params: { lines },
      })
    } else if (lines > 250) {
      ctx.report({
        ruleId: 'component-too-large',
        category: 'architecture',
        severity: 'info',
        msgId: 'component-too-large-warn',
        params: { lines },
      })
    }
  },
}

export const noExplicitAny: Rule = {
  id: 'no-explicit-any',
  name: 'Explicit any in component script',
  category: 'architecture',
  severity: 'info',
  check(ctx) {
    if (!ctx.scriptAst) return
    // Real type-node detection — ignores `any` in comments, strings, or identifiers.
    walkAst(ctx.scriptAst, (n: any) => {
      if (n.type === 'TSAnyKeyword') {
        ctx.report({
          ruleId: 'no-explicit-any',
          category: 'architecture',
          severity: 'info',
          line: n.loc?.start.line,
          msgId: 'no-explicit-any',
        })
      }
    })
  },
}

export const missingExpose: Rule = {
  id: 'missing-expose',
  name: 'Script setup without defineExpose',
  category: 'architecture',
  severity: 'info',
  check(ctx) {
    if (!ctx.sfc.scriptSetup || !ctx.scriptAst) return
    if (!ctx.templateAst) return

    // Self-referencing template ref pattern: a static ref="..." in the template.
    let hasTemplateRef = false
    walkElements(ctx.templateAst, el => {
      if (getStaticAttr(el, 'ref')) hasTemplateRef = true
    })
    if (!hasTemplateRef) return

    if (!callNames(ctx.scriptAst).has('defineExpose')) {
      ctx.report({
        ruleId: 'missing-expose',
        category: 'architecture',
        severity: 'info',
        msgId: 'missing-expose',
      })
    }
  },
}
