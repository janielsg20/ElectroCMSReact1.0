import { failure, success, type Result } from '../common/result'
import type { BreakpointId, NodeId } from './identity'
import type { Node, ProjectStructure } from './structure-schema'
import type { TreeOperationError, TreeOwner } from './tree-operations'
import { validateProjectStructure } from './validate-structure'

export const DIRECT_MANIPULATION_GRID = 8
export const MIN_NODE_SIZE = 24
export const MAX_NODE_SIZE = 10_000
export const MAX_NODE_SPACING = 1_000

export interface NodeSize {
  readonly width: number
  readonly height: number
}

export interface BoxSpacing {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface NodeSpacing {
  readonly margin: BoxSpacing
  readonly padding: BoxSpacing
}

export interface NodeMutationTarget {
  readonly owner: TreeOwner
  readonly nodeId: NodeId
  readonly breakpointId?: BreakpointId
}

export interface SnappedValue {
  readonly value: number
  readonly source: 'grid' | 'guide'
}

const sizeStyleKeys = {
  height: 'height',
  width: 'width',
} as const

const spacingStyleKeys = {
  margin: {
    bottom: 'marginBottom',
    left: 'marginLeft',
    right: 'marginRight',
    top: 'marginTop',
  },
  padding: {
    bottom: 'paddingBottom',
    left: 'paddingLeft',
    right: 'paddingRight',
    top: 'paddingTop',
  },
} as const

function mutationFailure(code: TreeOperationError['code'], message: string): Result<never, TreeOperationError> {
  return failure({ code, message })
}

function treeFor(structure: ProjectStructure, owner: TreeOwner) {
  return owner.kind === 'document'
    ? structure.documents[owner.documentId]
    : structure.globalComponents[owner.componentId]
}

function validatedMutation(structure: ProjectStructure): Result<ProjectStructure, TreeOperationError> {
  const validated = validateProjectStructure(structure)
  if (validated.ok) return success(validated.value)
  return mutationFailure(
    'invalid-tree',
    validated.error.slice(0, 3).map((diagnostic) => diagnostic.message).join(' ') || 'La manipulación produciría una estructura inválida.',
  )
}

function finiteInteger(value: number, minimum: number, maximum: number): number | null {
  if (!Number.isFinite(value)) return null
  const rounded = Math.round(value)
  return rounded >= minimum && rounded <= maximum ? rounded : null
}

function mutableStyles(
  structure: ProjectStructure,
  node: Node,
  breakpointId?: BreakpointId,
): Result<Record<string, unknown>, TreeOperationError> {
  if (!breakpointId) return success(node.styles)
  if (!structure.breakpoints.some((breakpoint) => breakpoint.id === breakpointId)) {
    return mutationFailure('breakpoint-not-found', `El breakpoint ${breakpointId} no existe.`)
  }
  const current = node.responsive[breakpointId]
  const override = {
    ...(current?.hidden === undefined ? {} : { hidden: current.hidden }),
    properties: { ...(current?.properties ?? {}) },
    styles: { ...(current?.styles ?? {}) },
  }
  node.responsive = { ...node.responsive, [breakpointId]: override }
  return success(override.styles)
}

function editableNode(
  structure: ProjectStructure,
  target: NodeMutationTarget,
): Result<Node, TreeOperationError> {
  const tree = treeFor(structure, target.owner)
  if (!tree) return mutationFailure('owner-not-found', 'El documento o componente no existe.')
  const node = tree.nodes[target.nodeId]
  if (!node) return mutationFailure('node-not-found', `El nodo ${target.nodeId} no existe.`)
  if (node.locked) return mutationFailure('locked-node', `El nodo ${target.nodeId} está bloqueado.`)
  return success(node)
}

function numericStyle(styles: Readonly<Record<string, unknown>>, key: string): number | null {
  const value = styles[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBox(styles: Readonly<Record<string, unknown>>, kind: keyof typeof spacingStyleKeys): BoxSpacing {
  const keys = spacingStyleKeys[kind]
  return {
    top: numericStyle(styles, keys.top) ?? 0,
    right: numericStyle(styles, keys.right) ?? 0,
    bottom: numericStyle(styles, keys.bottom) ?? 0,
    left: numericStyle(styles, keys.left) ?? 0,
  }
}

export function readCanonicalNodeSize(
  styles: Readonly<Record<string, unknown>>,
  fallback: NodeSize,
): NodeSize {
  return {
    width: numericStyle(styles, sizeStyleKeys.width) ?? fallback.width,
    height: numericStyle(styles, sizeStyleKeys.height) ?? fallback.height,
  }
}

export function readCanonicalNodeSpacing(styles: Readonly<Record<string, unknown>>): NodeSpacing {
  return { margin: readBox(styles, 'margin'), padding: readBox(styles, 'padding') }
}

export function snapValue(
  value: number,
  guides: readonly number[] = [],
  threshold = 4,
  grid = DIRECT_MANIPULATION_GRID,
): SnappedValue {
  const nearestGuide = guides.reduce<number | null>((nearest, guide) => {
    if (!Number.isFinite(guide) || Math.abs(guide - value) > threshold) return nearest
    if (nearest === null || Math.abs(guide - value) < Math.abs(nearest - value)) return guide
    return nearest
  }, null)
  if (nearestGuide !== null) return { source: 'guide', value: Math.round(nearestGuide) }
  const safeGrid = Number.isFinite(grid) && grid > 0 ? grid : DIRECT_MANIPULATION_GRID
  return { source: 'grid', value: Math.round(value / safeGrid) * safeGrid }
}

export function resizeNode(
  structure: ProjectStructure,
  target: NodeMutationTarget,
  size: NodeSize,
): Result<ProjectStructure, TreeOperationError> {
  const width = finiteInteger(size.width, MIN_NODE_SIZE, MAX_NODE_SIZE)
  const height = finiteInteger(size.height, MIN_NODE_SIZE, MAX_NODE_SIZE)
  if (width === null || height === null) {
    return mutationFailure('invalid-geometry', `El tamaño debe estar entre ${MIN_NODE_SIZE} y ${MAX_NODE_SIZE} píxeles.`)
  }

  const next = structuredClone(structure)
  const found = editableNode(next, target)
  if (!found.ok) return found
  const styles = mutableStyles(next, found.value, target.breakpointId)
  if (!styles.ok) return styles
  styles.value[sizeStyleKeys.width] = width
  styles.value[sizeStyleKeys.height] = height
  return validatedMutation(next)
}

export function updateNodeSpacing(
  structure: ProjectStructure,
  target: NodeMutationTarget,
  spacing: NodeSpacing,
): Result<ProjectStructure, TreeOperationError> {
  const values: readonly number[] = [
    spacing.margin.top,
    spacing.margin.right,
    spacing.margin.bottom,
    spacing.margin.left,
    spacing.padding.top,
    spacing.padding.right,
    spacing.padding.bottom,
    spacing.padding.left,
  ]
  if (values.some((value) => finiteInteger(value, 0, MAX_NODE_SPACING) === null)) {
    return mutationFailure('invalid-spacing', `El espaciado debe estar entre 0 y ${MAX_NODE_SPACING} píxeles.`)
  }

  const next = structuredClone(structure)
  const found = editableNode(next, target)
  if (!found.ok) return found
  const styles = mutableStyles(next, found.value, target.breakpointId)
  if (!styles.ok) return styles

  for (const kind of ['margin', 'padding'] as const) {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      styles.value[spacingStyleKeys[kind][side]] = Math.round(spacing[kind][side])
    }
  }
  return validatedMutation(next)
}
