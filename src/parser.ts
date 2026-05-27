import { parse as parseTS } from '@typescript-eslint/typescript-estree'
import type { TSESTree } from '@typescript-eslint/typescript-estree'
import type { ParsedSFC } from './types'

export interface ParsedFile {
  sfc: ParsedSFC
  scriptAst?: TSESTree.Program
  source: string
}

function extractBlock(source: string, tag: string, attrs?: string): string | undefined {
  const attrPart = attrs ? `(?=[^>]*\\b${attrs}\\b)` : '(?![^>]*\\bsetup\\b)'
  const re = new RegExp(`<${tag}${attrPart}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = source.match(re)
  return m?.[1]
}

export function parseVueFile(source: string): ParsedFile {
  const sfc: ParsedSFC = {
    template: undefined,
    script: undefined,
    scriptSetup: undefined,
  }

  const templateContent = extractBlock(source, 'template')
  if (templateContent !== undefined) sfc.template = { content: templateContent }

  const scriptSetupContent = extractBlock(source, 'script', 'setup')
  if (scriptSetupContent !== undefined) sfc.scriptSetup = { content: scriptSetupContent }

  const scriptContent = extractBlock(source, 'script')
  if (scriptContent !== undefined) sfc.script = { content: scriptContent }

  const scriptBlock = sfc.scriptSetup ?? sfc.script
  let scriptAst: TSESTree.Program | undefined

  if (scriptBlock?.content) {
    try {
      scriptAst = parseTS(scriptBlock.content, {
        jsx: false,
        loc: true,
        range: true,
        tolerant: true,
      })
    } catch {
    }
  }

  return { sfc, scriptAst, source }
}
