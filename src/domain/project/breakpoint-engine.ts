import { failure, success, type Result } from '../common/result'
import type { BreakpointId, NodeId } from './identity'
import { BreakpointSchema, type Breakpoint, type ProjectStructure } from './structure-schema'
import type { TreeOperationError, TreeOwner } from './tree-operations'
import { validateProjectStructure } from './validate-structure'

export type BreakpointInput = Omit<Breakpoint, 'id'>
export type BreakpointPatch = Partial<BreakpointInput>

function operationFailure(code: TreeOperationError['code'], message: string): Result<never, TreeOperationError> {
  return failure({ code, message })
}

function validateMutation(structure: ProjectStructure): Result<ProjectStructure, TreeOperationError> {
  const validated = validateProjectStructure(structure)
  if (validated.ok) return success(validated.value)
  return operationFailure('invalid-breakpoint', validated.error.slice(0, 3).map((item) => item.message).join(' '))
}

function ownerNodes(structure: ProjectStructure, owner: TreeOwner) {
  return owner.kind === 'document'
    ? structure.documents[owner.documentId]?.nodes
    : structure.globalComponents[owner.componentId]?.nodes
}

export function createBreakpoint(
  structure: ProjectStructure,
  id: BreakpointId,
  input: BreakpointInput,
  index = structure.breakpoints.length,
): Result<ProjectStructure, TreeOperationError> {
  if (structure.breakpoints.some((item) => item.id === id)) {
    return operationFailure('invalid-breakpoint', `El breakpoint ${id} ya existe.`)
  }
  const parsed = BreakpointSchema.safeParse({ ...input, id })
  if (!parsed.success) return operationFailure('invalid-breakpoint', parsed.error.issues[0]?.message ?? 'El breakpoint no es válido.')
  if (!Number.isInteger(index) || index < 0) return operationFailure('invalid-breakpoint', 'La posición del breakpoint no es válida.')
  const next = structuredClone(structure)
  next.breakpoints.splice(Math.min(index, next.breakpoints.length), 0, parsed.data)
  return validateMutation(next)
}

export function updateBreakpoint(
  structure: ProjectStructure,
  breakpointId: BreakpointId,
  patch: BreakpointPatch,
): Result<ProjectStructure, TreeOperationError> {
  const index = structure.breakpoints.findIndex((item) => item.id === breakpointId)
  if (index < 0) return operationFailure('breakpoint-not-found', `El breakpoint ${breakpointId} no existe.`)
  const current = structure.breakpoints[index]
  if (!current) return operationFailure('breakpoint-not-found', `El breakpoint ${breakpointId} no existe.`)
  const parsed = BreakpointSchema.safeParse({ ...current, ...patch, id: breakpointId })
  if (!parsed.success) return operationFailure('invalid-breakpoint', parsed.error.issues[0]?.message ?? 'El breakpoint no es válido.')
  const next = structuredClone(structure)
  next.breakpoints[index] = parsed.data
  return validateMutation(next)
}

export function reorderBreakpoint(
  structure: ProjectStructure,
  breakpointId: BreakpointId,
  targetIndex: number,
): Result<ProjectStructure, TreeOperationError> {
  const sourceIndex = structure.breakpoints.findIndex((item) => item.id === breakpointId)
  if (sourceIndex < 0) return operationFailure('breakpoint-not-found', `El breakpoint ${breakpointId} no existe.`)
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= structure.breakpoints.length) {
    return operationFailure('invalid-breakpoint', 'La posición del breakpoint no es válida.')
  }
  if (sourceIndex === targetIndex) return success(structuredClone(structure))
  const next = structuredClone(structure)
  const [moved] = next.breakpoints.splice(sourceIndex, 1)
  if (!moved) return operationFailure('breakpoint-not-found', `El breakpoint ${breakpointId} no existe.`)
  next.breakpoints.splice(targetIndex, 0, moved)
  return validateMutation(next)
}

export function resetNodeBreakpointOverride(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeId: NodeId,
  breakpointId: BreakpointId,
): Result<ProjectStructure, TreeOperationError> {
  if (!structure.breakpoints.some((item) => item.id === breakpointId)) {
    return operationFailure('breakpoint-not-found', `El breakpoint ${breakpointId} no existe.`)
  }
  const next = structuredClone(structure)
  const nodes = ownerNodes(next, owner)
  if (!nodes) return operationFailure('owner-not-found', 'El documento o componente de destino no existe.')
  const node = nodes[nodeId]
  if (!node) return operationFailure('node-not-found', `El nodo ${nodeId} no existe.`)
  if (node.locked) return operationFailure('locked-node', `El nodo ${nodeId} está bloqueado.`)
  const responsive = { ...node.responsive }
  delete responsive[breakpointId]
  node.responsive = responsive
  return validateMutation(next)
}
