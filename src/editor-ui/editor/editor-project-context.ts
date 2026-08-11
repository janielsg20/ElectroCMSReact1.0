import { createContext, useContext, useSyncExternalStore } from 'react'
import type { BreakpointId, BreakpointInput, BreakpointPatch, DocumentId, JsonValue, NodeDataSettings, NodeId, NodePlacement, NodeResponsiveOverride, NodeSize, NodeSpacing, ProjectStructure, ProjectTheme, ProjectThemeScope, Result } from '../../domain'
import type { ProjectStructureRenderStore } from '../../renderers'

export interface WidgetInsertionTemplate {
  readonly name?: string
  readonly properties?: Readonly<Record<string, JsonValue>>
  readonly responsive?: Readonly<Record<string, NodeResponsiveOverride>>
  readonly styles?: Readonly<Record<string, JsonValue>>
}

export interface WidgetInsertionResult {
  readonly nodeId: NodeId
  readonly structure: ProjectStructure
}

export interface BreakpointCreationResult {
  readonly breakpointId: BreakpointId
  readonly structure: ProjectStructure
}

export interface EditorProjectSession {
  readonly documentId: DocumentId
  readonly initialSelectedNodeId?: NodeId
  readonly store: ProjectStructureRenderStore
  createBreakpoint(input: BreakpointInput, index?: number): Promise<Result<BreakpointCreationResult, string>>
  insertWidget(widgetType: string, anchorNodeId?: NodeId | null, template?: WidgetInsertionTemplate): Promise<Result<WidgetInsertionResult, string>>
  moveNodes(nodeIds: readonly NodeId[], placement: NodePlacement): Promise<Result<ProjectStructure, string>>
  reorderBreakpoint(breakpointId: BreakpointId, targetIndex: number): Promise<Result<ProjectStructure, string>>
  resetNodeBreakpointOverride(nodeId: NodeId, breakpointId: BreakpointId): Promise<Result<ProjectStructure, string>>
  resetNodeDataSettings(nodeId: NodeId): Promise<Result<ProjectStructure, string>>
  resetWidgetProperty(nodeId: NodeId, key: string): Promise<Result<ProjectStructure, string>>
  resetNodeVisualStyles(nodeId: NodeId): Promise<Result<ProjectStructure, string>>
  resetProjectTheme(scope: ProjectThemeScope): Promise<Result<ProjectStructure, string>>
  resizeNode(nodeId: NodeId, size: NodeSize, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>>
  updateWidgetProperty(nodeId: NodeId, key: string, value: JsonValue): Promise<Result<ProjectStructure, string>>
  updateNodeVisualStyles(nodeId: NodeId, styles: Readonly<Record<string, JsonValue>>): Promise<Result<ProjectStructure, string>>
  updateProjectTheme(scope: ProjectThemeScope, theme: ProjectTheme): Promise<Result<ProjectStructure, string>>
  updateNodeSpacing(nodeId: NodeId, spacing: NodeSpacing, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>>
  updateNodeDataSettings(nodeId: NodeId, settings: NodeDataSettings): Promise<Result<ProjectStructure, string>>
  updateBreakpoint(breakpointId: BreakpointId, patch: BreakpointPatch): Promise<Result<ProjectStructure, string>>
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
