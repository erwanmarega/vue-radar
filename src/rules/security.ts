import type { Rule } from '../types'

export const vHtmlUnsafe: Rule = {
  id: 'v-html-unsafe',
  name: 'Unsafe v-html usage',
  category: 'security',
  severity: 'error',
  check(ctx) {
    const template = ctx.sfc.template?.content ?? ''
    const lines = template.split('\n')

    lines.forEach((line, i) => {
      if (/v-html\s*=/.test(line)) {
        // flag all v-html — even "safe" strings can be XSS vectors
        ctx.report({
          ruleId: 'v-html-unsafe',
          category: 'security',
          severity: 'error',
          message: 'v-html renders raw HTML and is vulnerable to XSS. Use text interpolation {{ }} or sanitize with DOMPurify first.',
          line: i + 1,
          fix: 'Replace v-html with {{ }} or sanitize: v-html="sanitize(content)"',
        })
      }
    })
  },
}

export const dynamicHrefBinding: Rule = {
  id: 'dynamic-href-unsafe',
  name: 'Unsafe dynamic href binding',
  category: 'security',
  severity: 'warning',
  check(ctx) {
    const template = ctx.sfc.template?.content ?? ''
    const lines = template.split('\n')

    lines.forEach((line, i) => {
      // :href bound to a variable (not a hardcoded string or route object)
      if (/:href\s*=\s*["'](?!{?\s*['"`])[^'"]+["']/.test(line) || /:href\s*=\s*"\w/.test(line)) {
        ctx.report({
          ruleId: 'dynamic-href-unsafe',
          category: 'security',
          severity: 'warning',
          message: 'Dynamic :href binding may allow javascript: URLs. Validate or whitelist the value.',
          line: i + 1,
          fix: 'Validate URL: const safeHref = computed(() => url.startsWith("https://") ? url : "#")',
        })
      }
    })
  },
}
