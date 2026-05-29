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
        message: 'Component emits events but has no defineEmits(). Missing type contract and IDE autocomplete.',
        fix: 'Add: const emit = defineEmits<{ change: [value: string] }>()',
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
        message: 'Component accesses props without defineProps(). Props are untyped and unvalidated.',
        fix: 'Add: const props = defineProps<{ title: string }>()',
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
        message: `Component is ${lines} lines. Components over 400 lines are hard to test and understand.`,
        fix: 'Extract composables (useXxx.ts) for logic, split template into child components.',
      })
    } else if (lines > 250) {
      ctx.report({
        ruleId: 'component-too-large',
        category: 'architecture',
        severity: 'info',
        message: `Component is ${lines} lines. Consider splitting logic into composables.`,
        fix: 'Extract reusable logic to composables/useXxx.ts',
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
          message: 'Explicit `any` type. Loses type safety across the component boundary.',
          line: n.loc?.start.line,
          fix: 'Use `unknown` and narrow with type guards, or define an interface.',
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
        message: 'Component uses template refs internally. If parent accesses this ref, add defineExpose() to control the public API.',
        fix: 'Add defineExpose({ methodName }) to explicitly expose what parent can access.',
      })
    }
  },
}
