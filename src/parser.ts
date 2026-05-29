import { parse as parseTS } from '@typescript-eslint/typescript-estree'
import type { TSESTree } from '@typescript-eslint/typescript-estree'
import { parse as parseSFC } from '@vue/compiler-sfc'
import type { RootNode } from '@vue/compiler-dom'
import { parseTemplate, attachParents } from './ast-utils'
import type { ParsedSFC } from './types'

export interface ParsedFile {
  sfc: ParsedSFC
  scriptAst?: TSESTree.Program
  templateAst?: RootNode
  source: string
}

/**
 * Pad a block's content with leading newlines so that line numbers reported by
 * any analyser (template AST, script AST, or naive line split) match the line
 * in the original .vue file. `startLine` is the 1-based line where the block
 * content begins in the source. No padding needed when it starts on line 1.
 */
function padToLine(content: string, startLine: number): string {
  if (startLine <= 1) return content
  return '\n'.repeat(startLine - 1) + content
}

export function parseVueFile(source: string): ParsedFile {
  const sfc: ParsedSFC = {
    template: undefined,
    script: undefined,
    scriptSetup: undefined,
  }

  // @vue/compiler-sfc resolves nested <template>, multiple/duplicate blocks,
  // comments and custom blocks correctly — unlike the previous regex parser.
  const { descriptor } = parseSFC(source, { filename: 'component.vue' })

  if (descriptor.template) {
    sfc.template = {
      content: padToLine(descriptor.template.content, descriptor.template.loc.start.line),
    }
  }

  if (descriptor.scriptSetup) {
    sfc.scriptSetup = {
      content: padToLine(descriptor.scriptSetup.content, descriptor.scriptSetup.loc.start.line),
    }
  }

  if (descriptor.script) {
    sfc.script = {
      content: padToLine(descriptor.script.content, descriptor.script.loc.start.line),
    }
  }

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
      if (scriptAst) attachParents(scriptAst)
    } catch {
    }
  }

  let templateAst: RootNode | undefined
  if (sfc.template?.content) {
    templateAst = parseTemplate(sfc.template.content) ?? undefined
  }

  return { sfc, scriptAst, templateAst, source }
}
