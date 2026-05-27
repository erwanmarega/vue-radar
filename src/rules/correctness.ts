import type { Rule } from '../types'

export const vIfVForSameElement: Rule = {
  id: 'v-if-v-for-same-element',
  name: 'v-if and v-for on same element',
  category: 'correctness',
  severity: 'error',
  check(ctx) {
    const template = ctx.sfc.template?.content ?? ''
    const lines = template.split('\n')

    lines.forEach((line, i) => {
      const hasVFor = /\bv-for\b/.test(line)
      const hasVIf = /\bv-if\b/.test(line)
      if (hasVFor && hasVIf) {
        ctx.report({
          ruleId: 'v-if-v-for-same-element',
          category: 'correctness',
          severity: 'error',
          message: 'v-if and v-for on the same element. In Vue 3, v-if takes priority — it cannot access v-for variables.',
          line: i + 1,
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
    const template = ctx.sfc.template?.content ?? ''
    const lines = template.split('\n')

    let inVFor = false
    lines.forEach((line, i) => {
      if (/\bv-for\b/.test(line)) {
        inVFor = true
        if (!/\s:key\s*=|v-bind:key\s*=/.test(line)) {
          ctx.report({
            ruleId: 'missing-key-in-v-for',
            category: 'correctness',
            severity: 'warning',
            message: 'v-for without :key. Vue cannot efficiently patch the DOM without stable keys.',
            line: i + 1,
            fix: 'Add :key="item.id" — use a stable unique identifier, not the loop index.',
          })
        }
        inVFor = false
      }
    })
    void inVFor
  },
}

export const missingDotValue: Rule = {
  id: 'missing-dot-value',
  name: 'Possible missing .value on ref',
  category: 'correctness',
  severity: 'warning',
  check(ctx) {
    if (!ctx.scriptAst) return
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    const refNames = new Set<string>()
    const refPattern = /const\s+(\w+)\s*=\s*ref\s*[(<]/g
    let m: RegExpExecArray | null
    while ((m = refPattern.exec(script)) !== null) {
      refNames.add(m[1])
    }

    if (refNames.size === 0) return

    lines.forEach((line, i) => {
      refNames.forEach(name => {
        const usedRaw = new RegExp(`\\b${name}\\s*[=!<>](?!=)`, 'g')
        const hasDotValue = new RegExp(`\\b${name}\\.value`)
        if (usedRaw.test(line) && !hasDotValue.test(line) && !/const|let|var/.test(line)) {
          ctx.report({
            ruleId: 'missing-dot-value',
            category: 'correctness',
            severity: 'warning',
            message: `"${name}" looks like a ref but is used without .value. This assigns to the ref object, not its value.`,
            line: i + 1,
            fix: `Use ${name}.value = ... instead of ${name} = ...`,
          })
        }
      })
    })
  },
}

export const directReactiveMutation: Rule = {
  id: 'direct-reactive-mutation',
  name: 'Direct reactive object replacement',
  category: 'correctness',
  severity: 'error',
  check(ctx) {
    const script = ctx.sfc.scriptSetup?.content ?? ctx.sfc.script?.content ?? ''
    const lines = script.split('\n')

    const reactiveNames = new Set<string>()
    const reactivePattern = /const\s+(\w+)\s*=\s*reactive\s*[(<{]/g
    let m: RegExpExecArray | null
    while ((m = reactivePattern.exec(script)) !== null) {
      reactiveNames.add(m[1])
    }

    if (reactiveNames.size === 0) return

    lines.forEach((line, i) => {
      reactiveNames.forEach(name => {
        if (new RegExp(`\\b${name}\\s*=\\s*[{(\\[]`).test(line) && !/const|let|var/.test(line)) {
          ctx.report({
            ruleId: 'direct-reactive-mutation',
            category: 'correctness',
            severity: 'error',
            message: `Replacing reactive object "${name}" breaks reactivity. The proxy reference becomes stale.`,
            line: i + 1,
            fix: `Mutate properties in-place: Object.assign(${name}, newData) or use ref() instead.`,
          })
        }
      })
    })
  },
}
