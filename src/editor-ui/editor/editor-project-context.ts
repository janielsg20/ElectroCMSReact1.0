import { createContext, useContext, useSyncExternalStore } from 'react'
import type { BreakpointId, DocumentId, NodeId, NodePlacement, NodeSize, NodeSpacing, ProjectStructure, Result } from '../../domain'
import type { ProjectStructureRenderStore } from '../../renderers'

export interface EditorProjectSession {
  readonly documentId: DocumentId
  readonly initialSelectedNodeId?: NodeId
  readonly store: ProjectStructureRenderStore
  moveNodes(nodeIds: readonly NodeId[], placement: NodePlacement): Promise<Result<ProjectStructure, string>>
  resizeNode(nodeId: NodeId, size: NodeSize, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>>
  updateNodeSpacing(nodeId: NodeId, spacing: NodeSpacing, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>>
  undo(): Promise<Result<ProjectStructure, string>>
  redo(): Promise<Result<ProjectStructure, string>>
}

export interface EditorSelection {
  readonly getSelectedNodeId: () => NodeId | null
  readonly selectNode: (nodeId: NodeId) => void
  readonly subscribe: (listener: () => void) => () => void
}

export const EditorProjectContext = createContext<EditorProjectSession | null>(null)
export const EditorSelectionContext = createContext<EditorSelection | null>(null)

export function useEditorProject(): EditorProjectSession {
  const session = useContext(EditorProjectContext)
  if (!session) throw new Error('El editor requiere una sesión de proyecto canónica.')
  return session
}

export function useEditorSelection(): EditorSelection {
  const selection = useContext(EditorSelectionContext)
  if (!selection) throw new Error('El editor requiere selección compartida.')
  return selection
}

export function useEditorSelectedNodeId(): NodeId | null {
  const selection = useEditorSelection()
  return useSyncExternalStore(selection.subscribe, selection.getSelectedNodeId, selection.getSelectedNodeId)
}

export function useNodeSelected(nodeId: NodeId): boolean {
  const selection = useEditorSelection()
  return useSyncExternalStore(
    (listener) => selection.subscribe(listener),
    () => selection.getSelectedNodeId() === nodeId,
    () => selection.getSelectedNodeId() === nodeId,
  )
}

export function useEditorProjectStructure(): ProjectStructure {
  const { store } = useEditorProject()
  return useSyncExternalStore(
    (listener) => store.subscribeStructure(listener),
    () => store.structure,
    () => store.structure,
  )
}
