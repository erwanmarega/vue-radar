import type { TSESTree } from '@typescript-eslint/typescript-estree'
import type { RootNode } from '@vue/compiler-dom'

export type Severity = 'error' | 'warning' | 'info'
export type Category = 'security' | 'performance' | 'correctness' | 'architecture' | 'composition'

export interface Diagnostic {
  ruleId: string
  category: Category
  severity: Severity
  message: string
  file: string
  line?: number
  fix?: string
}

export interface SFCBlock {
  content: string
}

export interface ParsedSFC {
  template?: SFCBlock
  script?: SFCBlock
  scriptSetup?: SFCBlock
}

export interface ReportInput {
  ruleId: string
  category: Category
  severity: Severity
  line?: number
  /** Message catalog key resolved against the active language. */
  msgId: string
  /** Interpolation values for the catalog entry. */
  params?: Record<string, string | number>
}

export interface RuleContext {
  filename: string
  source: string
  sfc: ParsedSFC
  scriptAst?: TSESTree.Program
  templateAst?: RootNode
  report: (diag: ReportInput) => void
}

export interface Rule {
  id: string
  name: string
  category: Category
  severity: Severity
  check: (ctx: RuleContext) => void
}

export interface ScanResult {
  files: number
  diagnostics: Diagnostic[]
  score: number
  duration: number
  byCategory: Record<Category, Diagnostic[]>
}
