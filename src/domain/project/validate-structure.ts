import { failure, success, type Result } from '../common/result'
import type { BreakpointId, NodeId } from './identity'
import type { JsonValue } from './project-envelope'
import {
  ProjectStructureSchema,
  type BindingSource,
  type GlobalComponent,
  type Node,
  type ProjectStructure,
} from './structure-schema'

export type StructureDiagnosticCode =
  | 'schema-invalid'
  | 'duplicate-breakpoint-id'
  | 'missing-breakpoint-parent'
  | 'breakpoint-cycle'
  | 'document-key-mismatch'
  | 'component-key-mismatch'
  | 'node-key-mismatch'
  | 'duplicate-node-id'
  | 'missing-node-reference'
  | 'node-cycle'
  | 'multiple-node-parents'
  | 'orphan-node'
  | 'missing-binding-node'
  | 'missing-breakpoint-override'
  | 'missing-component-reference'
  | 'component-cycle'

export interface StructureDiagnostic {
  readonly code: StructureDiagnosticCode
  readonly message: string
  readonly path: readonly (number | string)[]
}

interface NodeTree {
  readonly rootNodeIds: readonly NodeId[]
  readonly nodes: Readonly<Record<string, Node>>
}

function bindingSources(node: Node): BindingSource[] {
  return [
    ...Object.values(node.bindings),
    ...node.conditions.flatMap((group) => group.predicates.map((predicate) => predicate.source)),
  ]
}

function validateBreakpointGraph(
  structure: ProjectStructure,
  diagnostics: StructureDiagnostic[],
): Map<string, ProjectStructure['breakpoints'][number]> {
  const breakpoints = new Map<string, ProjectStructure['breakpoints'][number]>()

  structure.breakpoints.forEach((breakpoint, index) => {
    if (breakpoints.has(breakpoint.id)) {
      diagnostics.push({
        code: 'duplicate-breakpoint-id',
        message: `El breakpoint ${breakpoint.id} está duplicado.`,
        path: ['breakpoints', index, 'id'],
      })
    }
    breakpoints.set(breakpoint.id, breakpoint)
  })

  for (const [index, breakpoint] of structure.breakpoints.entries()) {
    if (breakpoint.inheritsFrom && !breakpoints.has(breakpoint.inheritsFrom)) {
      diagnostics.push({
        code: 'missing-breakpoint-parent',
        message: `El breakpoint ${breakpoint.id} hereda de uno inexistente.`,
        path: ['breakpoints', index, 'inheritsFrom'],
      })
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(id: string): void {
    if (visiting.has(id)) {
      diagnostics.push({
        code: 'breakpoint-cycle',
        message: `La herencia de breakpoints contiene un ciclo en ${id}.`,
        path: ['breakpoints'],
      })
      return
    }
    if (visited.has(id)) return

    visiting.add(id)
    const parentId = breakpoints.get(id)?.inheritsFrom
    if (parentId && breakpoints.has(parentId)) visit(parentId)
    visiting.delete(id)
    visited.add(id)
  }

  for (const id of breakpoints.keys()) visit(id)
  return breakpoints
}

function validateNodeTree(
  tree: NodeTree,
  ownerPath: readonly string[],
  breakpoints: ReadonlyMap<string, unknown>,
  components: Readonly<Record<string, GlobalComponent>>,
  globalNodeOwners: Map<string, string>,
  diagnostics: StructureDiagnostic[],
): void {
  const parentCounts = new Map<string, number>()
  const edges = new Map<string, string[]>()

  for (const [nodeKey, node] of Object.entries(tree.nodes)) {
    const nodePath = [...ownerPath, 'nodes', nodeKey]
    if (node.id !== nodeKey) {
      diagnostics.push({
        code: 'node-key-mismatch',
        message: `La clave ${nodeKey} no coincide con el ID interno ${node.id}.`,
        path: [...nodePath, 'id'],
      })
    }

    const existingOwner = globalNodeOwners.get(node.id)
    if (existingOwner && existingOwner !== ownerPath.join('.')) {
      diagnostics.push({
        code: 'duplicate-node-id',
        message: `El nodo ${node.id} aparece en más de un árbol.`,
        path: nodePath,
      })
    } else {
      globalNodeOwners.set(node.id, ownerPath.join('.'))
    }

    const children = Object.values(node.slots).flat()
    edges.set(node.id, children)

    for (const childId of children) {
      if (!tree.nodes[childId]) {
        diagnostics.push({
          code: 'missing-node-reference',
          message: `El nodo ${node.id} referencia al hijo inexistente ${childId}.`,
          path: [...nodePath, 'slots'],
        })
      } else {
        parentCounts.set(childId, (parentCounts.get(childId) ?? 0) + 1)
      }
    }

    for (const breakpointId of Object.keys(node.responsive)) {
      if (!breakpoints.has(breakpointId)) {
        diagnostics.push({
          code: 'missing-breakpoint-override',
          message: `El nodo ${node.id} contiene un override para un breakpoint inexistente.`,
          path: [...nodePath, 'responsive', breakpointId],
        })
      }
    }

    for (const source of bindingSources(node)) {
      if (source.kind === 'node-property' && !tree.nodes[source.nodeId]) {
        diagnostics.push({
          code: 'missing-binding-node',
          message: `El binding del nodo ${node.id} referencia al nodo inexistente ${source.nodeId}.`,
          path: [...nodePath, 'bindings'],
        })
      }
    }

    if (node.kind === 'component-instance' && !components[node.componentId]) {
      diagnostics.push({
        code: 'missing-component-reference',
        message: `El nodo ${node.id} referencia al componente inexistente ${node.componentId}.`,
        path: [...nodePath, 'componentId'],
      })
    }
  }

  for (const [rootIndex, rootId] of tree.rootNodeIds.entries()) {
    if (!tree.nodes[rootId]) {
      diagnostics.push({
        code: 'missing-node-reference',
        message: `La raíz ${rootId} no existe en el registro de nodos.`,
        path: [...ownerPath, 'rootNodeIds', rootIndex],
      })
    } else {
      parentCounts.set(rootId, (parentCounts.get(rootId) ?? 0) + 1)
    }
  }

  for (const nodeId of Object.keys(tree.nodes)) {
    const parentCount = parentCounts.get(nodeId) ?? 0
    if (parentCount === 0) {
      diagnostics.push({
        code: 'orphan-node',
        message: `El nodo ${nodeId} no es raíz ni hijo de ningún slot.`,
        path: [...ownerPath, 'nodes', nodeId],
      })
    } else if (parentCount > 1) {
      diagnostics.push({
        code: 'multiple-node-parents',
        message: `El nodo ${nodeId} tiene ${parentCount} ubicaciones en el árbol.`,
        path: [...ownerPath, 'nodes', nodeId],
      })
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(nodeId: string): void {
    if (visiting.has(nodeId)) {
      diagnostics.push({
        code: 'node-cycle',
        message: `El árbol contiene un ciclo en el nodo ${nodeId}.`,
        path: [...ownerPath, 'nodes', nodeId],
      })
      return
    }
    if (visited.has(nodeId)) return

    visiting.add(nodeId)
    for (const childId of edges.get(nodeId) ?? []) {
      if (tree.nodes[childId]) visit(childId)
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  for (const nodeId of Object.keys(tree.nodes)) visit(nodeId)
}

function validateComponentGraph(
  components: Readonly<Record<string, GlobalComponent>>,
  diagnostics: StructureDiagnostic[],
): void {
  const edges = new Map<string, string[]>()
  for (const [componentId, component] of Object.entries(components)) {
    edges.set(
      componentId,
      Object.values(component.nodes)
        .filter((node) => node.kind === 'component-instance')
        .map((node) => node.componentId),
    )
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(componentId: string): void {
    if (visiting.has(componentId)) {
      diagnostics.push({
        code: 'component-cycle',
        message: `Los componentes globales contienen un ciclo en ${componentId}.`,
        path: ['globalComponents', componentId],
      })
      return
    }
    if (visited.has(componentId)) return

    visiting.add(componentId)
    for (const dependencyId of edges.get(componentId) ?? []) {
      if (components[dependencyId]) visit(dependencyId)
    }
    visiting.delete(componentId)
    visited.add(componentId)
  }

  for (const componentId of Object.keys(components)) visit(componentId)
}

export function validateProjectStructure(
  input: unknown,
): Result<ProjectStructure, readonly StructureDiagnostic[]> {
  const parsed = ProjectStructureSchema.safeParse(input)
  if (!parsed.success) {
    return failure(
      parsed.error.issues.map((issue) => ({
        code: 'schema-invalid' as const,
        message: issue.message,
        path: issue.path.map((segment) =>
          typeof segment === 'symbol' ? (segment.description ?? segment.toString()) : segment,
        ),
      })),
    )
  }

  const structure = parsed.data
  const diagnostics: StructureDiagnostic[] = []
  const breakpoints = validateBreakpointGraph(structure, diagnostics)
  const globalNodeOwners = new Map<string, string>()

  for (const [documentKey, document] of Object.entries(structure.documents)) {
    if (document.id !== documentKey) {
      diagnostics.push({
        code: 'document-key-mismatch',
        message: `La clave ${documentKey} no coincide con el ID ${document.id}.`,
        path: ['documents', documentKey, 'id'],
      })
    }
    validateNodeTree(
      document,
      ['documents', documentKey],
      breakpoints,
      structure.globalComponents,
      globalNodeOwners,
      diagnostics,
    )
  }

  for (const [componentKey, component] of Object.entries(structure.globalComponents)) {
    if (component.id !== componentKey) {
      diagnostics.push({
        code: 'component-key-mismatch',
        message: `La clave ${componentKey} no coincide con el ID ${component.id}.`,
        path: ['globalComponents', componentKey, 'id'],
      })
    }
    validateNodeTree(
      component,
      ['globalComponents', componentKey],
      breakpoints,
      structure.globalComponents,
      globalNodeOwners,
      diagnostics,
    )
  }

  validateComponentGraph(structure.globalComponents, diagnostics)
  return diagnostics.length > 0 ? failure(diagnostics) : success(structure)
}

export interface ResolvedNodeResponsiveState {
  readonly properties: Readonly<Record<string, JsonValue>>
  readonly styles: Readonly<Record<string, JsonValue>>
  readonly hidden: boolean
}

function findNode(structure: ProjectStructure, nodeId: NodeId): Node | undefined {
  const trees: NodeTree[] = [
    ...Object.values(structure.documents),
    ...Object.values(structure.globalComponents),
  ]
  return trees.map((tree) => tree.nodes[nodeId]).find((node) => node !== undefined)
}

export function resolveNodeResponsiveState(
  input: unknown,
  nodeId: NodeId,
  breakpointId: BreakpointId,
): Result<ResolvedNodeResponsiveState, readonly StructureDiagnostic[]> {
  const validated = validateProjectStructure(input)
  if (!validated.ok) return validated

  const structure = validated.value
  const node = findNode(structure, nodeId)
  if (!node) {
    return failure([{
      code: 'missing-node-reference',
      message: `El nodo ${nodeId} no existe.`,
      path: [],
    }])
  }

  return resolveValidatedNodeResponsiveState(structure, node, breakpointId)
}

/**
 * Resuelve un nodo que ya pertenece a una ProjectStructure validada.
 * Evita revalidar el árbol completo durante el render incremental.
 */
export function resolveValidatedNodeResponsiveState(
  structure: ProjectStructure,
  node: Node,
  breakpointId: BreakpointId,
): Result<ResolvedNodeResponsiveState, readonly StructureDiagnostic[]> {
  const breakpointMap = new Map(structure.breakpoints.map((breakpoint) => [breakpoint.id, breakpoint]))
  const breakpoint = breakpointMap.get(breakpointId)

  if (!breakpoint) {
    return failure([{
      code: 'missing-breakpoint-override',
      message: `El breakpoint ${breakpointId} no existe.`,
      path: [],
    }])
  }

  const chain: ProjectStructure['breakpoints'] = []
  let current: typeof breakpoint | undefined = breakpoint
  while (current) {
    chain.push(current)
    current = current.inheritsFrom ? breakpointMap.get(current.inheritsFrom) : undefined
  }
  chain.reverse()

  const properties = new Map(Object.entries(node.properties))
  const styles = new Map(Object.entries(node.styles))
  let hidden = node.hidden

  for (const item of chain) {
    const override = node.responsive[item.id]
    if (!override) continue
    for (const [key, value] of Object.entries(override.properties)) properties.set(key, value)
    for (const [key, value] of Object.entries(override.styles)) styles.set(key, value)
    if (override.hidden !== undefined) hidden = override.hidden
  }

  return success({
    properties: Object.fromEntries(properties),
    styles: Object.fromEntries(styles),
    hidden,
  })
}
