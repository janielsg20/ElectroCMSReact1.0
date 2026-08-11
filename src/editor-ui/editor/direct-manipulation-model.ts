import { snapValue, type Document, type NodeId, type NodeSize } from '../../domain'

export type ResizeCorner = 'north-west' | 'north-east' | 'south-east' | 'south-west'

export interface ResizePreview {
  readonly size: NodeSize
  readonly horizontalGuide: 'grid' | 'guide'
  readonly verticalGuide: 'grid' | 'guide'
}

export interface SelectionBreadcrumb {
  readonly id: NodeId | null
  readonly label: string
}

export function resizePreview(
  origin: NodeSize,
  deltaX: number,
  deltaY: number,
  corner: ResizeCorner,
  widthGuides: readonly number[] = [],
  heightGuides: readonly number[] = [],
): ResizePreview {
  const horizontalDirection = corner.endsWith('west') ? -1 : 1
  const verticalDirection = corner.startsWith('north') ? -1 : 1
  const width = snapValue(Math.max(24, origin.width + deltaX * horizontalDirection), widthGuides)
  const height = snapValue(Math.max(24, origin.height + deltaY * verticalDirection), heightGuides)
  return {
    horizontalGuide: width.source,
    size: { height: height.value, width: width.value },
    verticalGuide: height.source,
  }
}

export function selectionBreadcrumbs(document: Document, selectedNodeId: NodeId | null): readonly SelectionBreadcrumb[] {
  const documentCrumb: SelectionBreadcrumb = { id: null, label: document.name }
  if (!selectedNodeId || !document.nodes[selectedNodeId]) return [documentCrumb]

  const parents = new Map<NodeId, NodeId>()
  for (const node of Object.values(document.nodes)) {
    for (const childId of Object.values(node.slots).flat()) parents.set(childId, node.id)
  }

  const path: NodeId[] = []
  const visited = new Set<NodeId>()
  let current: NodeId | undefined = selectedNodeId
  while (current && !visited.has(current)) {
    visited.add(current)
    path.unshift(current)
    current = parents.get(current)
  }

  return [
    documentCrumb,
    ...path.map((id) => ({ id, label: document.nodes[id]?.name ?? id })),
  ]
}
