import { createContext, useContext, useSyncExternalStore } from 'react'
import type {
  BreakpointId,
  BreakpointInput,
  BreakpointPatch,
  ContentType,
  ContentTypeId,
  Document,
  DocumentId,
  JsonValue,
  NodeDataSettings,
  NodeId,
  NodePlacement,
  NodeResponsiveOverride,
  NodeSize,
  NodeSpacing,
  ProjectStructure,
  ProjectTheme,
  ProjectThemeScope,
  Result,
  Taxonomy,
  TaxonomyId,
  TaxonomyTerm,
  TaxonomyTermId,
  TemplateCondition,
  ThemePackage,
  ThemePackageId,
  ThemePackageImportReport,
  ThemePackagePartSelection,
  ThemePackageRouteConflictPolicy,
} from '../../domain'
import type { ContentTypeEditablePatch } from '../../domain/project/content-type-engine'
import type {
  TaxonomyEditablePatch,
  TaxonomyTermEditablePatch,
} from '../../domain/project/taxonomy-engine'
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
  createDocument?(document: Document): Promise<Result<ProjectStructure, string>>
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
  updateDocumentConditions?(documentId: DocumentId, conditions: readonly TemplateCondition[]): Promise<Result<ProjectStructure, string>>
  undo(): Promise<Result<ProjectStructure, string>>
  redo(): Promise<Result<ProjectStructure, string>>
}

export interface ThemePackageSession {
  applyThemePackage(
    themePackage: ThemePackage,
    selection: ThemePackagePartSelection,
    routeConflict: ThemePackageRouteConflictPolicy,
  ): Promise<Result<ThemePackageImportReport, string>>
  listThemePackages(): Promise<Result<readonly ThemePackage[], string>>
  removeThemePackage(packageId: ThemePackageId): Promise<Result<boolean, string>>
  saveThemePackage(themePackage: ThemePackage): Promise<Result<void, string>>
}

export interface ContentTypeSession {
  createContentType(contentType: ContentType): Promise<Result<ProjectStructure, string>>
  deleteContentType(contentTypeId: ContentTypeId): Promise<Result<ProjectStructure, string>>
  updateContentType(contentTypeId: ContentTypeId, patch: ContentTypeEditablePatch): Promise<Result<ProjectStructure, string>>
}

export interface TaxonomySession {
  createTaxonomy(taxonomy: Taxonomy): Promise<Result<ProjectStructure, string>>
  updateTaxonomy(taxonomyId: TaxonomyId, patch: TaxonomyEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteTaxonomy(taxonomyId: TaxonomyId): Promise<Result<ProjectStructure, string>>
  createTaxonomyTerm(term: TaxonomyTerm): Promise<Result<ProjectStructure, string>>
  updateTaxonomyTerm(termId: TaxonomyTermId, patch: TaxonomyTermEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteTaxonomyTerm(termId: TaxonomyTermId): Promise<Result<ProjectStructure, string>>
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

export function requireThemePackageSession(session: EditorProjectSession): EditorProjectSession & ThemePackageSession {
  const candidate = session as EditorProjectSession & Partial<ThemePackageSession>
  if (
    typeof candidate.applyThemePackage !== 'function'
    || typeof candidate.listThemePackages !== 'function'
    || typeof candidate.removeThemePackage !== 'function'
    || typeof candidate.saveThemePackage !== 'function'
  ) {
    throw new Error('La sesión actual no ofrece la capacidad de paquetes de tema.')
  }
  return candidate as EditorProjectSession & ThemePackageSession
}

export function useThemePackageSession(): ThemePackageSession {
  return requireThemePackageSession(useEditorProject())
}

export function requireContentTypeSession(session: EditorProjectSession): EditorProjectSession & ContentTypeSession {
  const candidate = session as EditorProjectSession & Partial<ContentTypeSession>
  if (
    typeof candidate.createContentType !== 'function'
    || typeof candidate.updateContentType !== 'function'
    || typeof candidate.deleteContentType !== 'function'
  ) {
    throw new Error('La sesión actual no ofrece la capacidad de tipos de contenido.')
  }
  return candidate as EditorProjectSession & ContentTypeSession
}

export function useContentTypeSession(): ContentTypeSession {
  return requireContentTypeSession(useEditorProject())
}

export function requireTaxonomySession(session: EditorProjectSession): EditorProjectSession & TaxonomySession {
  const candidate = session as EditorProjectSession & Partial<TaxonomySession>
  if (
    typeof candidate.createTaxonomy !== 'function'
    || typeof candidate.updateTaxonomy !== 'function'
    || typeof candidate.deleteTaxonomy !== 'function'
    || typeof candidate.createTaxonomyTerm !== 'function'
    || typeof candidate.updateTaxonomyTerm !== 'function'
    || typeof candidate.deleteTaxonomyTerm !== 'function'
  ) {
    throw new Error('La sesión actual no ofrece la capacidad de taxonomías.')
  }
  return candidate as EditorProjectSession & TaxonomySession
}

export function useTaxonomySession(): TaxonomySession {
  return requireTaxonomySession(useEditorProject())
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
