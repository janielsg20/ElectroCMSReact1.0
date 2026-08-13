import { failure, success, type Result } from '../common/result'
import type { DocumentId, GlobalComponentId, NodeId } from './identity'
import type { BindingSource, Node, ProjectStructure } from './structure-schema'
import { validateCanonicalStyles } from './style-engine'
import { validateProjectStructure } from './validate-structure'

export type TreeOwner =
  | { readonly kind: 'document'; readonly documentId: DocumentId }
  | { readonly kind: 'global-component'; readonly componentId: GlobalComponentId }

export interface NodePlacement {
  readonly parentId: NodeId | null
  readonly slot: string | null
  readonly index: number
}

export type TreeOperationErrorCode =
  | 'owner-not-found'
  | 'node-not-found'
  | 'node-id-conflict'
  | 'parent-not-found'
  | 'slot-required'
  | 'locked-node'
  | 'invalid-selection'
  | 'invalid-placement'
  | 'invalid-tree'
  | 'clipboard-empty'
  | 'breakpoint-not-found'
  | 'invalid-breakpoint'
  | 'invalid-geometry'
  | 'invalid-spacing'
  | 'invalid-styles'
  | 'invalid-theme'
  | 'invalid-data-settings'

export interface TreeOperationError {
  readonly code: TreeOperationErrorCode
  readonly message: string
}

export interface TreeClipboard {
  readonly version: 1
  readonly rootNodeIds: readonly NodeId[]
  readonly nodes: Readonly<Record<string, Node>>
}

export interface PasteResult {
  readonly structure: ProjectStructure
  readonly insertedNodeIds: readonly NodeId[]
}

interface MutableNodeTree {
  rootNodeIds: NodeId[]
  nodes: Record<string, Node>
}

interface NodeLocation {
  readonly parentId: NodeId | null
  readonly slot: string | null
  readonly index: number
}

function operationFailure(code: TreeOperationErrorCode, message: string): Result<never, TreeOperationError> {
  return failure({ code, message })
}

function ownerTree(structure: ProjectStructure, owner: TreeOwner): MutableNodeTree | null {
  if (owner.kind === 'document') return structure.documents[owner.documentId] ?? null
  return structure.globalComponents[owner.componentId] ?? null
}

function cloneStructure(structure: ProjectStructure): ProjectStructure {
  return structuredClone(structure)
}

function validateMutation(structure: ProjectStructure): Result<ProjectStructure, TreeOperationError> {
  const validated = validateProjectStructure(structure)
  if (validated.ok) return success(validated.value)
  const summary = validated.error.slice(0, 3).map((diagnostic) => diagnostic.message).join(' ')
  return failure({ code: 'invalid-tree', message: summary || 'La operación produciría una estructura inválida.' })
}

function allNodeIds(structure: ProjectStructure): Set<string> {
  const ids = new Set<string>()
  for (const document of Object.values(structure.documents)) {
    for (const id of Object.keys(document.nodes)) ids.add(id)
  }
  for (const component of Object.values(structure.globalComponents)) {
    for (const id of Object.keys(component.nodes)) ids.add(id)
  }
  return ids
}

function findLocation(tree: MutableNodeTree, nodeId: NodeId): NodeLocation | null {
  const rootIndex = tree.rootNodeIds.indexOf(nodeId)
  if (rootIndex >= 0) return { parentId: null, slot: null, index: rootIndex }

  for (const node of Object.values(tree.nodes)) {
    for (const [slot, children] of Object.entries(node.slots)) {
      const index = children.indexOf(nodeId)
      if (index >= 0) return { parentId: node.id, slot, index }
    }
  }
  return null
}

function childrenOf(tree: MutableNodeTree, nodeId: NodeId): NodeId[] {
  const node = tree.nodes[nodeId]
  return node ? Object.values(node.slots).flat() : []
}

function descendantSet(tree: MutableNodeTree, nodeId: NodeId): Set<NodeId> {
  const descendants = new Set<NodeId>()
  const queue = [...childrenOf(tree, nodeId)]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || descendants.has(current)) continue
    descendants.add(current)
    queue.push(...childrenOf(tree, current))
  }
  return descendants
}

function canonicalSelection(tree: MutableNodeTree, nodeIds: readonly NodeId[]): Result<NodeId[], TreeOperationError> {
  const unique: NodeId[] = []
  const seen = new Set<string>()
  for (const nodeId of nodeIds) {
    if (seen.has(nodeId)) continue
    if (!tree.nodes[nodeId]) return failure({ code: 'node-not-found', message: `El nodo ${nodeId} no existe en el árbol.` })
    seen.add(nodeId)
    unique.push(nodeId)
  }
  if (unique.length === 0) return failure({ code: 'invalid-selection', message: 'La selección no contiene nodos.' })

  const selected = new Set(unique)
  return success(unique.filter((nodeId) => {
    for (const candidate of unique) {
      if (candidate === nodeId) continue
      if (selected.has(candidate) && descendantSet(tree, candidate).has(nodeId)) return false
    }
    return true
  }))
}

function assertUnlocked(tree: MutableNodeTree, nodeIds: readonly NodeId[]): Result<void, TreeOperationError> {
  const locked = nodeIds.find((nodeId) => tree.nodes[nodeId]?.locked)
  return locked
    ? failure({ code: 'locked-node', message: `El nodo ${locked} está bloqueado.` })
    : success(undefined)
}

function assertPlacement(tree: MutableNodeTree, placement: NodePlacement): Result<void, TreeOperationError> {
  if (!Number.isInteger(placement.index) || placement.index < 0) {
    return failure({ code: 'invalid-placement', message: 'La posición de inserción debe ser un entero no negativo.' })
  }
  if (placement.parentId === null) {
    return placement.slot === null
      ? success(undefined)
      : failure({ code: 'invalid-placement', message: 'Una raíz no puede declarar slot padre.' })
  }
  const parent = tree.nodes[placement.parentId]
  if (!parent) return failure({ code: 'parent-not-found', message: `El padre ${placement.parentId} no existe.` })
  if (parent.locked) return failure({ code: 'locked-node', message: `El padre ${placement.parentId} está bloqueado.` })
  if (!placement.slot?.trim()) return failure({ code: 'slot-required', message: 'Un nodo anidado requiere un slot de destino.' })
  return success(undefined)
}

function removeFromLocation(tree: MutableNodeTree, nodeId: NodeId): void {
  const location = findLocation(tree, nodeId)
  if (!location) return
  if (location.parentId === null) {
    tree.rootNodeIds.splice(location.index, 1)
    return
  }
  const parent = tree.nodes[location.parentId]
  if (!parent || !location.slot) return
  const children = parent.slots[location.slot] ?? []
  parent.slots = { ...parent.slots, [location.slot]: children.filter((id) => id !== nodeId) }
}

function insertAtPlacement(tree: MutableNodeTree, nodeIds: readonly NodeId[], placement: NodePlacement): void {
  if (placement.parentId === null) {
    const index = Math.min(placement.index, tree.rootNodeIds.length)
    tree.rootNodeIds.splice(index, 0, ...nodeIds)
    return
  }
  const parent = tree.nodes[placement.parentId]
  if (!parent || !placement.slot) return
  const existing = [...(parent.slots[placement.slot] ?? [])]
  const index = Math.min(placement.index, existing.length)
  existing.splice(index, 0, ...nodeIds)
  parent.slots = { ...parent.slots, [placement.slot]: existing }
}

function sameContainer(locations: readonly NodeLocation[]): boolean {
  const first = locations[0]
  return Boolean(first) && locations.every((location) => location.parentId === first.parentId && location.slot === first.slot)
}

function sortedSiblingSelection(tree: MutableNodeTree, nodeIds: readonly NodeId[]): Result<{ ids: NodeId[]; locations: NodeLocation[] }, TreeOperationError> {
  const selected = canonicalSelection(tree, nodeIds)
  if (!selected.ok) return selected
  const located = selected.value.map((nodeId) => ({ nodeId, location: findLocation(tree, nodeId) }))
  if (located.some((entry) => entry.location === null)) {
    return failure({ code: 'invalid-selection', message: 'Todos los nodos seleccionados deben ocupar una posición válida.' })
  }
  const entries = located as { nodeId: NodeId; location: NodeLocation }[]
  const locations = entries.map((entry) => entry.location)
  if (!sameContainer(locations)) {
    return failure({ code: 'invalid-selection', message: 'La operación requiere nodos hermanos del mismo contenedor.' })
  }
  entries.sort((left, right) => left.location.index - right.location.index)
  return success({ ids: entries.map((entry) => entry.nodeId), locations: entries.map((entry) => entry.location) })
}

function remapBinding(source: BindingSource, idMap: ReadonlyMap<string, NodeId>): BindingSource {
  if (source.kind !== 'node-property') return structuredClone(source)
  return { ...structuredClone(source), nodeId: idMap.get(source.nodeId) ?? source.nodeId }
}

function remapNode(node: Node, nextId: NodeId, idMap: ReadonlyMap<string, NodeId>): Node {
  const bindings = Object.fromEntries(Object.entries(node.bindings).map(([key, source]) => [key, remapBinding(source, idMap)]))
  const conditions = node.conditions.map((group) => ({
    ...structuredClone(group),
    predicates: group.predicates.map((predicate) => ({
      ...structuredClone(predicate),
      source: remapBinding(predicate.source, idMap),
    })),
  }))
  const slots = Object.fromEntries(Object.entries(node.slots).map(([slot, children]) => [
    slot,
    children.map((childId) => idMap.get(childId) ?? childId),
  ]))
  return { ...structuredClone(node), id: nextId, bindings, conditions, slots }
}

export function insertNode(
  structure: ProjectStructure,
  owner: TreeOwner,
  node: Node,
  placement: NodePlacement,
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente de destino no existe.')
  if (allNodeIds(next).has(node.id)) return operationFailure('node-id-conflict', `El ID ${node.id} ya existe en el proyecto.`)
  const placementValid = assertPlacement(tree, placement)
  if (!placementValid.ok) return placementValid

  tree.nodes[node.id] = structuredClone(node)
  insertAtPlacement(tree, [node.id], placement)
  return validateMutation(next)
}

export function moveNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
  placement: NodePlacement,
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente de destino no existe.')
  const selected = canonicalSelection(tree, nodeIds)
  if (!selected.ok) return selected
  const unlocked = assertUnlocked(tree, selected.value)
  if (!unlocked.ok) return unlocked
  const placementValid = assertPlacement(tree, placement)
  if (!placementValid.ok) return placementValid

  const sourceLocations = selected.value
    .map((nodeId) => findLocation(tree, nodeId))
    .filter((location): location is NodeLocation => location !== null)

  if (placement.parentId) {
    for (const nodeId of selected.value) {
      if (nodeId === placement.parentId || descendantSet(tree, nodeId).has(placement.parentId)) {
        return operationFailure('invalid-placement', 'No se puede mover un nodo dentro de sí mismo o de uno de sus descendientes.')
      }
    }
  }

  const removedBeforeDestination = sourceLocations.filter((location) => (
    location.parentId === placement.parentId
    && location.slot === placement.slot
    && location.index < placement.index
  )).length
  const adjustedPlacement = {
    ...placement,
    index: Math.max(0, placement.index - removedBeforeDestination),
  }

  for (const nodeId of selected.value) removeFromLocation(tree, nodeId)
  insertAtPlacement(tree, selected.value, adjustedPlacement)
  return validateMutation(next)
}

export function nestNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
  parentId: NodeId,
  slot: string,
  index = Number.MAX_SAFE_INTEGER,
): Result<ProjectStructure, TreeOperationError> {
  return moveNodes(structure, owner, nodeIds, { parentId, slot, index })
}

export function groupNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
  groupNode: Node,
  childSlot = 'content',
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente de destino no existe.')
  if (allNodeIds(next).has(groupNode.id)) return operationFailure('node-id-conflict', `El ID ${groupNode.id} ya existe en el proyecto.`)
  const siblings = sortedSiblingSelection(tree, nodeIds)
  if (!siblings.ok) return siblings
  const unlocked = assertUnlocked(tree, siblings.value.ids)
  if (!unlocked.ok) return unlocked

  const firstLocation = siblings.value.locations[0]
  if (!firstLocation) return operationFailure('invalid-selection', 'No hay nodos para agrupar.')
  const insertion: NodePlacement = { parentId: firstLocation.parentId, slot: firstLocation.slot, index: firstLocation.index }
  const placementValid = assertPlacement(tree, insertion)
  if (!placementValid.ok) return placementValid

  for (const nodeId of siblings.value.ids) removeFromLocation(tree, nodeId)
  tree.nodes[groupNode.id] = {
    ...structuredClone(groupNode),
    slots: { ...structuredClone(groupNode.slots), [childSlot]: [...siblings.value.ids] },
  }
  insertAtPlacement(tree, [groupNode.id], insertion)
  return validateMutation(next)
}

export function copyNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
): Result<TreeClipboard, TreeOperationError> {
  const tree = ownerTree(structuredClone(structure), owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente de origen no existe.')
  const selected = canonicalSelection(tree, nodeIds)
  if (!selected.ok) return selected

  const included = new Set<NodeId>()
  for (const rootId of selected.value) {
    included.add(rootId)
    for (const descendant of descendantSet(tree, rootId)) included.add(descendant)
  }
  const nodes: Record<string, Node> = {}
  for (const nodeId of included) {
    const node = tree.nodes[nodeId]
    if (node) nodes[nodeId] = structuredClone(node)
  }
  return success({ version: 1, rootNodeIds: selected.value, nodes })
}

export function pasteNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  clipboard: TreeClipboard,
  placement: NodePlacement,
  createNodeId: (sourceId: NodeId, index: number) => NodeId,
): Result<PasteResult, TreeOperationError> {
  if (clipboard.rootNodeIds.length === 0 || Object.keys(clipboard.nodes).length === 0) {
    return operationFailure('clipboard-empty', 'El portapapeles no contiene nodos.')
  }
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente de destino no existe.')
  const placementValid = assertPlacement(tree, placement)
  if (!placementValid.ok) return placementValid

  const existing = allNodeIds(next)
  const orderedSourceIds = Object.keys(clipboard.nodes) as NodeId[]
  const idMap = new Map<string, NodeId>()
  orderedSourceIds.forEach((sourceId, index) => {
    const nextId = createNodeId(sourceId, index)
    if (existing.has(nextId) || [...idMap.values()].includes(nextId)) throw new Error(`ID duplicado generado al pegar: ${nextId}`)
    idMap.set(sourceId, nextId)
  })

  for (const sourceId of orderedSourceIds) {
    const source = clipboard.nodes[sourceId]
    const nextId = idMap.get(sourceId)
    if (!source || !nextId) continue
    tree.nodes[nextId] = remapNode(source, nextId, idMap)
  }
  const pastedRoots = clipboard.rootNodeIds.map((rootId) => idMap.get(rootId)).filter((id): id is NodeId => id !== undefined)
  insertAtPlacement(tree, pastedRoots, placement)
  const validated = validateMutation(next)
  return validated.ok ? success({ structure: validated.value, insertedNodeIds: pastedRoots }) : validated
}

export function duplicateNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
  createNodeId: (sourceId: NodeId, index: number) => NodeId,
): Result<PasteResult, TreeOperationError> {
  const tree = ownerTree(structuredClone(structure), owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const siblings = sortedSiblingSelection(tree, nodeIds)
  if (!siblings.ok) return siblings
  const lastLocation = siblings.value.locations[siblings.value.locations.length - 1]
  if (!lastLocation) return operationFailure('invalid-selection', 'No hay nodos para duplicar.')
  const copied = copyNodes(structure, owner, siblings.value.ids)
  if (!copied.ok) return copied
  return pasteNodes(structure, owner, copied.value, {
    parentId: lastLocation.parentId,
    slot: lastLocation.slot,
    index: lastLocation.index + 1,
  }, createNodeId)
}

/** Removes selected roots and their descendants as one reversible tree mutation. */
export function deleteNodes(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const selected = canonicalSelection(tree, nodeIds)
  if (!selected.ok) return selected
  const unlocked = assertUnlocked(tree, selected.value)
  if (!unlocked.ok) return unlocked
  const removed = new Set<NodeId>()
  for (const nodeId of selected.value) {
    removed.add(nodeId)
    for (const descendantId of descendantSet(tree, nodeId)) removed.add(descendantId)
  }
  for (const nodeId of selected.value) removeFromLocation(tree, nodeId)
  for (const nodeId of removed) delete tree.nodes[nodeId]
  return validateMutation(next)
}

export function setNodesLocked(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
  locked: boolean,
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const selected = canonicalSelection(tree, nodeIds)
  if (!selected.ok) return selected
  for (const nodeId of selected.value) {
    const node = tree.nodes[nodeId]
    if (node) tree.nodes[nodeId] = { ...node, locked }
  }
  return validateMutation(next)
}

export function setNodesHidden(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeIds: readonly NodeId[],
  hidden: boolean,
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const selected = canonicalSelection(tree, nodeIds)
  if (!selected.ok) return selected
  for (const nodeId of selected.value) {
    const node = tree.nodes[nodeId]
    if (node) tree.nodes[nodeId] = { ...node, hidden }
  }
  return validateMutation(next)
}

export function renameNode(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeId: NodeId,
  name: string,
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const node = tree.nodes[nodeId]
  if (!node) return operationFailure('node-not-found', `El nodo ${nodeId} no existe.`)
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 160) return operationFailure('invalid-selection', 'El nombre debe contener entre 1 y 160 caracteres.')
  tree.nodes[nodeId] = { ...node, name: trimmed }
  return validateMutation(next)
}

export function setNodeProperties(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeId: NodeId,
  properties: Node['properties'],
): Result<ProjectStructure, TreeOperationError> {
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const node = tree.nodes[nodeId]
  if (!node) return operationFailure('node-not-found', `El nodo ${nodeId} no existe.`)
  if (node.locked) return operationFailure('locked-node', `El nodo ${nodeId} está bloqueado.`)
  tree.nodes[nodeId] = { ...node, properties: structuredClone(properties) }
  return validateMutation(next)
}

export function setNodeStyles(
  structure: ProjectStructure,
  owner: TreeOwner,
  nodeId: NodeId,
  styles: Node['styles'],
): Result<ProjectStructure, TreeOperationError> {
  const safe = validateCanonicalStyles(styles)
  if (!safe.ok) {
    return operationFailure('invalid-styles', safe.error.slice(0, 3).map((item) => item.message).join(' '))
  }
  const next = cloneStructure(structure)
  const tree = ownerTree(next, owner)
  if (!tree) return operationFailure('owner-not-found', 'El documento o componente no existe.')
  const node = tree.nodes[nodeId]
  if (!node) return operationFailure('node-not-found', `El nodo ${nodeId} no existe.`)
  if (node.locked) return operationFailure('locked-node', `El nodo ${nodeId} está bloqueado.`)
  tree.nodes[nodeId] = { ...node, styles: structuredClone(safe.value) }
  return validateMutation(next)
}
