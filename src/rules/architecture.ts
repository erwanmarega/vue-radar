import type { Rule } from '../types'

export const missingDefineEmits: Rule = {
  id: 'missing-define-emits',
  name: 'Emitting events without defineEmits',
  category: 'architecture',
  severity: 'warning',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ''
    if (!script) return

    const hasEmit = /\$emit\s*\(|emit\s*\(/.test(script)
    const hasDefineEmits = /defineEmits\s*[(<]/.test(script)

    if (hasEmit && !hasDefineEmits) {
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
    const script = ctx.sfc.scriptSetup?.content ?? ''
    if (!script) return

    const usesProps = /\$props\b/.test(script) || /props\.\w+/.test(script)
    const hasDefineProps = /defineProps\s*[(<]/.test(script)
    const hasWithDefaults = /withDefaults\s*\(/.test(script)

    if (usesProps && !hasDefineProps && !hasWithDefaults) {
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
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    lines.forEach((line, i) => {
      if (/:\s*any\b/.test(line) && !/\/\//.test(line.split(':')[0])) {
        ctx.report({
          ruleId: 'no-explicit-any',
          category: 'architecture',
          severity: 'info',
          message: 'Explicit `any` type. Loses type safety across the component boundary.',
          line: i + 1,
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
    const scriptSetup = ctx.sfc.scriptSetup?.content ?? ''
    if (!scriptSetup) return

    // only flag if parent likely uses template refs (hard to know statically — skip)
    // instead flag if the component has ref="..." in its own template (self-ref pattern)
    const template = ctx.sfc.template?.content ?? ''
    const hasTemplateRef = /ref\s*=\s*["']\w+["']/.test(template)
    const hasDefineExpose = /defineExpose\s*\(/.test(scriptSetup)

    if (hasTemplateRef && !hasDefineExpose) {
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
