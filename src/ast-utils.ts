import { parse } from '@vue/compiler-dom'
import type { RootNode } from '@vue/compiler-dom'
import type { TSESTree } from '@typescript-eslint/typescript-estree'

export type { RootNode } from '@vue/compiler-dom'

export const NodeTypes = { ELEMENT: 1, ATTRIBUTE: 6, DIRECTIVE: 7 } as const

export function parseTemplate(content: string): RootNode | null {
  try {
    return parse(content)
  } catch {
    return null
  }
}

export function walkElements(node: { children?: unknown[] }, fn: (el: any) => void): void {
  for (const child of (node.children ?? [])) {
    if ((child as any).type === NodeTypes.ELEMENT) {
      fn(child)
      walkElements(child as any, fn)
    }
  }
}

export function getDirective(el: any, name: string): any | undefined {
  return el.props?.find((p: any) => p.type === NodeTypes.DIRECTIVE && p.name === name)
}

export function getBoundProp(el: any, argName: string): any | undefined {
  return el.props?.find((p: any) =>
    p.type === NodeTypes.DIRECTIVE &&
    p.name === 'bind' &&
    p.arg?.type === 4 &&
    p.arg.content === argName
  )
}

/** Find a plain static attribute (e.g. `ref="foo"`) by name. */
export function getStaticAttr(el: any, name: string): any | undefined {
  return el.props?.find((p: any) => p.type === NodeTypes.ATTRIBUTE && p.name === name)
}

export function walkAst(node: any, fn: (n: any) => void): void {
  if (!node || typeof node !== 'object') return
  fn(node)
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue
    const val = node[key]
    if (Array.isArray(val)) {
      val.forEach(child => walkAst(child, fn))
    } else if (val && typeof val === 'object' && val.type) {
      walkAst(val, fn)
    }
  }
}

// Script-side AST helpers (typescript-estree).

type AnyNode = any

/** Set a `.parent` pointer on every child so rules can walk ancestors. */
export function attachParents(root: AnyNode): void {
  walkAst(root, node => {
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue
      const val = node[key]
      if (Array.isArray(val)) {
        val.forEach(c => {
          if (c && typeof c === 'object' && c.type) c.parent = node
        })
      } else if (val && typeof val === 'object' && val.type) {
        val.parent = node
      }
    }
  })
}

/** Resolved name of a call's callee: `foo()` → "foo", `obj.foo()` → "foo". */
export function calleeName(call: TSESTree.CallExpression): string | undefined {
  const c = call.callee as AnyNode
  if (c.type === 'Identifier') return c.name
  if (c.type === 'MemberExpression' && c.property.type === 'Identifier') return c.property.name
  return undefined
}

/** Object root of a member call: `axios.get()` → "axios", `$emit()` → undefined. */
export function calleeObjectName(call: TSESTree.CallExpression): string | undefined {
  const c = call.callee as AnyNode
  if (c.type === 'MemberExpression' && c.object?.type === 'Identifier') return c.object.name
  return undefined
}

/** All CallExpression nodes within a subtree. */
export function collectCalls(root: AnyNode): TSESTree.CallExpression[] {
  const out: TSESTree.CallExpression[] = []
  walkAst(root, n => {
    if (n.type === 'CallExpression') out.push(n)
  })
  return out
}

/** Names of all calls within a subtree (deduped via array). */
export function descendantCallNames(root: AnyNode): string[] {
  return collectCalls(root).map(calleeName).filter((n): n is string => !!n)
}

/**
 * `const x = fn(...)` declarators where `fn` is one of `calleeNames`.
 * Returns a map of declared identifier name → declarator node.
 */
export function varNamesByInitCall(root: AnyNode, calleeNames: Set<string>): Map<string, AnyNode> {
  const map = new Map<string, AnyNode>()
  walkAst(root, n => {
    if (
      n.type === 'VariableDeclarator' &&
      n.id?.type === 'Identifier' &&
      n.init?.type === 'CallExpression'
    ) {
      const name = calleeName(n.init)
      if (name && calleeNames.has(name)) map.set(n.id.name, n)
    }
  })
  return map
}

/** Nearest function-ish ancestor (or undefined at module scope). */
export function enclosingFunction(node: AnyNode): AnyNode | undefined {
  let cur = node.parent
  while (cur) {
    if (
      cur.type === 'FunctionDeclaration' ||
      cur.type === 'FunctionExpression' ||
      cur.type === 'ArrowFunctionExpression'
    ) {
      return cur
    }
    cur = cur.parent
  }
  return undefined
}

/**
 * True if `node` is lexically inside an Options-API `setup()` — i.e. a function
 * that is the value of a property/method named `setup`. Requires attachParents.
 */
export function isInsideSetup(node: AnyNode): boolean {
  let cur = node.parent
  while (cur) {
    const isFn =
      cur.type === 'FunctionExpression' ||
      cur.type === 'ArrowFunctionExpression' ||
      cur.type === 'FunctionDeclaration'
    if (isFn) {
      const p = cur.parent
      if (
        p &&
        (p.type === 'Property' || p.type === 'MethodDefinition') &&
        p.key?.type === 'Identifier' &&
        p.key.name === 'setup'
      ) {
        return true
      }
    }
    cur = cur.parent
  }
  return false
}
