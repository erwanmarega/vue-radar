import type { Rule } from '../types'
import { walkElements, getDirective, getBoundProp } from '../ast-utils'

export const vHtmlUnsafe: Rule = {
  id: 'v-html-unsafe',
  name: 'Unsafe v-html usage',
  category: 'security',
  severity: 'error',
  check(ctx) {
    if (!ctx.templateAst) return
    walkElements(ctx.templateAst, el => {
      const dir = getDirective(el, 'html')
      if (!dir) return
      ctx.report({
        ruleId: 'v-html-unsafe',
        category: 'security',
        severity: 'error',
        line: dir.loc.start.line,
        msgId: 'v-html-unsafe',
      })
    })
  },
}

// Tags whose href can carry a javascript: URL.
const HREF_TAGS = new Set(['a'])

export const dynamicHrefBinding: Rule = {
  id: 'dynamic-href-unsafe',
  name: 'Unsafe dynamic href binding',
  category: 'security',
  severity: 'warning',
  check(ctx) {
    if (!ctx.templateAst) return
    walkElements(ctx.templateAst, el => {
      if (!HREF_TAGS.has(el.tag)) return
      const hrefDir = getBoundProp(el, 'href')
      if (!hrefDir) return
      const exp = (hrefDir.exp?.content ?? '').trim()
      // Static string literals can't inject javascript: at runtime.
      if (/^['"`]/.test(exp)) return
      if (exp === '' || exp === '#') return
      ctx.report({
        ruleId: 'dynamic-href-unsafe',
        category: 'security',
        severity: 'warning',
        line: hrefDir.loc.start.line,
        msgId: 'dynamic-href-unsafe',
        params: { exp },
      })
    })
  },
}
