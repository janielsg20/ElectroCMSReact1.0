import * as z from 'zod'
import { failure, success, type Result } from '../common/result'
import { JsonValueSchema, type JsonValue } from './project-envelope'
import {
  BindingSourceSchema,
  ConditionGroupSchema,
  NodeAccessibilitySchema,
  type BindingSource,
  type Node,
  type NodeAccessibility,
  type ProjectStructure,
} from './structure-schema'
import type { TreeOperationError, TreeOwner } from './tree-operations'
import { validateProjectStructure } from './validate-structure'

const PropertyKeySchema = z.string().trim().min(1).max(160)

export const NodeDataSettingsSchema = z.strictObject({
  accessibility: NodeAccessibilitySchema,
  bindings: z.record(PropertyKeySchema, BindingSourceSchema),
  conditions: z.array(ConditionGroupSchema),
})

export type NodeDataSettings = z.infer<typeof NodeDataSettingsSchema>

export interface DataConditionDiagnostic {
  readonly code: 'missing-path' | 'unsafe-path' | 'non-json-value' | 'invalid-comparison'
  readonly message: string
  readonly path: readonly string[]
}

export interface ResolvedNodeDataState {
  readonly accessibility: NodeAccessibility
  readonly diagnostics: readonly DataConditionDiagnostic[]
  readonly properties: Readonly<Record<string, JsonValue>>
  readonly visible: boolean
}

const blockedPathSegments = new Set(['__proto__', 'constructor', 'prototype'])

function allNodes(structure: ProjectStructure): Readonly<Record<string, Node>> {
  return Object.fromEntries([
    ...Object.values(structure.documents).flatMap((document) => Object.entries(document.nodes)),
    ...Object.values(structure.globalComponents).flatMap((component) => Object.entries(component.nodes)),
  ])
}

function readPath(root: unknown, path: readonly string[]): Result<JsonValue, DataConditionDiagnostic> {
  let current = root
  for (const segment of path) {
    if (blockedPathSegments.has(segment)) {
      return failure({ code: 'unsafe-path', message: `El segmento ${segment} no está permitido.`, path })
    }
    if (typeof current !== 'object' || current === null || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return failure({ code: 'missing-path', message: `La ruta ${path.join('.')} no existe.`, path })
    }
    current = (current as Record<string, unknown>)[segment]
  }
  const parsed = JsonValueSchema.safeParse(current)
  return parsed.success
    ? success(parsed.data)
    : failure({ code: 'non-json-value', message: `La ruta ${path.join('.')} no produce un valor JSON.`, path })
}

function resolveSource(structure: ProjectStructure, nodes: Readonly<Record<string, Node>>, source: BindingSource): Result<JsonValue, DataConditionDiagnostic> {
  if (source.kind === 'literal') return success(source.value)
  if (source.kind === 'project-path') return readPath(structure, source.path)
  const node = nodes[source.nodeId]
  return node
    ? readPath(node, source.path)
    : failure({ code: 'missing-path', message: `El nodo ${source.nodeId} no existe.`, path: source.path })
}

function sameValue(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function compare(left: JsonValue, operator: string, right: JsonValue): Result<boolean, DataConditionDiagnostic> {
  if (operator === 'equals') return success(sameValue(left, right))
  if (operator === 'not-equals') return success(!sameValue(left, right))
  if (operator === 'contains') {
    if (typeof left === 'string' && typeof right === 'string') return success(left.includes(right))
    if (Array.isArray(left)) return success(left.some((item) => sameValue(item, right)))
  }
  if (['greater-than', 'greater-or-equal', 'less-than', 'less-or-equal'].includes(operator) && typeof left === 'number' && typeof right === 'number') {
    if (operator === 'greater-than') return success(left > right)
    if (operator === 'greater-or-equal') return success(left >= right)
    if (operator === 'less-than') return success(left < right)
    return success(left <= right)
  }
  return failure({ code: 'invalid-comparison', message: `El operador ${operator} no admite estos valores.`, path: [] })
}

export function resolveNodeDataState(
  structure: ProjectStructure,
  node: Node,
  responsiveProperties: Readonly<Record<string, JsonValue>>,
): ResolvedNodeDataState {
  const diagnostics: DataConditionDiagnostic[] = []
  const nodes = allNodes(structure)
  const properties = { ...responsiveProperties }

  for (const [key, source] of Object.entries(node.bindings)) {
    const resolved = resolveSource(structure, nodes, source)
    if (resolved.ok) properties[key] = resolved.value
    else diagnostics.push({ ...resolved.error, path: ['bindings', key, ...resolved.error.path] })
  }

  const groupResults = node.conditions.map((group, groupIndex) => {
    const predicates = group.predicates.map((predicate, predicateIndex) => {
      const resolved = resolveSource(structure, nodes, predicate.source)
      if (!resolved.ok) {
        if (predicate.operator === 'exists' && resolved.error.code === 'missing-path') return false
        diagnostics.push({ ...resolved.error, path: ['conditions', String(groupIndex), String(predicateIndex), ...resolved.error.path] })
        return null
      }
      if (predicate.operator === 'exists') return true
      const compared = compare(resolved.value, predicate.operator, predicate.value)
      if (!compared.ok) {
        diagnostics.push({ ...compared.error, path: ['conditions', String(groupIndex), String(predicateIndex)] })
        return null
      }
      return compared.value
    })
    if (predicates.some((value) => value === null)) return null
    const matched = group.operator === 'all' ? predicates.every(Boolean) : predicates.some(Boolean)
    return group.negate ? !matched : matched
  })

  return {
    accessibility: node.accessibility ?? {},
    diagnostics,
    properties,
    visible: groupResults.some((value) => value === null) ? true : groupResults.every(Boolean),
  }
}

export function setNodeDataSettings(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeId: Node['id'],
  input: unknown,
): Result<ProjectStructure, TreeOperationError> {
  const parsed = NodeDataSettingsSchema.safeParse(input)
  if (!parsed.success) return failure({ code: 'invalid-data-settings', message: parsed.error.issues[0]?.message ?? 'La configuración de datos no es válida.' })
  const next = structuredClone(structure)
  const nodes = owner.kind === 'document'
    ? next.documents[owner.documentId]?.nodes
    : next.globalComponents[owner.componentId]?.nodes
  if (!nodes) return failure({ code: 'owner-not-found', message: 'El documento o componente no existe.' })
  const node = nodes[nodeId]
  if (!node) return failure({ code: 'node-not-found', message: `El nodo ${nodeId} no existe.` })
  if (node.locked) return failure({ code: 'locked-node', message: `El nodo ${nodeId} está bloqueado.` })
  node.bindings = structuredClone(parsed.data.bindings)
  node.conditions = structuredClone(parsed.data.conditions)
  if (Object.keys(parsed.data.accessibility).length > 0) node.accessibility = structuredClone(parsed.data.accessibility)
  else delete node.accessibility
  const resolved = resolveNodeDataState(next, node, node.properties)
  const blockingDiagnostic = resolved.diagnostics.find((item) => item.code !== 'missing-path')
  if (blockingDiagnostic) return failure({ code: 'invalid-data-settings', message: blockingDiagnostic.message })
  const validated = validateProjectStructure(next)
  return validated.ok
    ? success(validated.value)
    : failure({ code: 'invalid-data-settings', message: validated.error.slice(0, 3).map((item) => item.message).join(' ') })
}
