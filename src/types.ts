import type { TSESTree } from '@typescript-eslint/typescript-estree'

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

export interface RuleContext {
  filename: string
  source: string
  sfc: ParsedSFC
  scriptAst?: TSESTree.Program
  report: (diag: Omit<Diagnostic, 'file'>) => void
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
