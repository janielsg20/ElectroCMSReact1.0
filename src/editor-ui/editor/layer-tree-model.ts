import type { Document, Node, NodeId, NodePlacement } from '../../domain'

export interface LayerTreeEntry {
  readonly depth: number
  readonly index: number
  readonly node: Node
  readonly parentId: NodeId | null
  readonly slot: string | null
}

export type MoveRelation = 'before' | 'after' | 'inside'

export const LAYER_DRAG_POLICY = {
  pointerDistance: 4,
  touchDelay: 180,
  touchTolerance: 6,
} as const

export function buildLayerTreeEntries(document: Document): readonly LayerTreeEntry[] {
  const entries: LayerTreeEntry[] = []

  function visit(nodeId: NodeId, depth: number, parentId: NodeId | null, slot: string | null, index: number): void {
    const node = document.nodes[nodeId]
    if (!node) return
    entries.push({ depth, index, node, parentId, slot })
    for (const [childSlot, childIds] of Object.entries(node.slots)) {
      childIds.forEach((childId, childIndex) => visit(childId, depth + 1, node.id, childSlot, childIndex))
    }
  }

  document.rootNodeIds.forEach((nodeId, index) => visit(nodeId, 0, null, null, index))
  return entries
}

export function placementRelativeTo(
  target: LayerTreeEntry,
  relation: MoveRelation,
): NodePlacement {
  if (relation === 'inside') {
    const slot = Object.keys(target.node.slots)[0] ?? 'content'
    return {
      index: target.node.slots[slot]?.length ?? 0,
      parentId: target.node.id,
      slot,
    }
  }
  return {
    index: target.index + (relation === 'after' ? 1 : 0),
    parentId: target.parentId,
    slot: target.slot,
  }
}

export function dragPlacement(
  active: LayerTreeEntry,
  target: LayerTreeEntry,
): NodePlacement {
  const sameContainer = active.parentId === target.parentId && active.slot === target.slot
  const relation = sameContainer && active.index < target.index ? 'after' : 'before'
  return placementRelativeTo(target, relation)
}
