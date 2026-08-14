import { createContext, useContext, useSyncExternalStore } from 'react'
import type {
  BreakpointId,
  AuditActor,
  AuditLogEntry,
  BreakpointInput,
  BreakpointPatch,
  ContentRecord,
  ContentRecordId,
  ContentRecordRevisionId,
  ContentType,
  ContentTypeId,
  Document,
  DocumentId,
  FieldDefinition,
  FieldDefinitionId,
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
  Relation,
  RelationEntry,
  RelationEntryId,
  RelationId,
  Result,
  Role,
  RoleId,
  User,
  UserId,
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
import type { RoleEditablePatch } from '../../domain/project/role-engine'
import type { UserEditablePatch } from '../../domain/project/user-engine'
import type { ContentTypeEditablePatch } from '../../domain/project/content-type-engine'
import type { FieldDefinitionEditablePatch } from '../../domain/project/custom-field-engine'
import type {
  ContentRecordEditablePatch,
  RelationEditablePatch,
  RelationEntryEditablePatch,
} from '../../domain/project/record-relation-engine'
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
  selectDocument?(documentId: DocumentId): void
  subscribeDocumentSelection?(listener: () => void): () => void
  readonly initialSelectedNodeId?: NodeId
  readonly store: ProjectStructureRenderStore
  setAuditActor?(actor: AuditActor): void
  listAuditEntries?(): Promise<Result<readonly AuditLogEntry[], string>>
  exportAuditEntries?(): Promise<Result<string, string>>
  createDocument?(document: Document): Promise<Result<ProjectStructure, string>>
  createBreakpoint(input: BreakpointInput, index?: number): Promise<Result<BreakpointCreationResult, string>>
  insertWidget(widgetType: string, anchorNodeId?: NodeId | null, template?: WidgetInsertionTemplate): Promise<Result<WidgetInsertionResult, string>>
  deleteNodes?(nodeIds: readonly NodeId[]): Promise<Result<ProjectStructure, string>>
  duplicateNodes?(nodeIds: readonly NodeId[]): Promise<Result<ProjectStructure, string>>
  moveNodes(nodeIds: readonly NodeId[], placement: NodePlacement): Promise<Result<ProjectStructure, string>>
  renameNode?(nodeId: NodeId, name: string): Promise<Result<ProjectStructure, string>>
  setNodesHidden?(nodeIds: readonly NodeId[], hidden: boolean): Promise<Result<ProjectStructure, string>>
  setNodesLocked?(nodeIds: readonly NodeId[], locked: boolean): Promise<Result<ProjectStructure, string>>
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
  createRole?(role: Role): Promise<Result<ProjectStructure, string>>
  updateRole?(roleId: RoleId, patch: RoleEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteRole?(roleId: RoleId): Promise<Result<ProjectStructure, string>>
  createUser?(user: User): Promise<Result<ProjectStructure, string>>
  updateUser?(userId: UserId, patch: UserEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteUser?(userId: UserId): Promise<Result<ProjectStructure, string>>
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

export interface CustomFieldSession {
  createCustomField(field: FieldDefinition): Promise<Result<ProjectStructure, string>>
  updateCustomField(fieldId: FieldDefinitionId, patch: FieldDefinitionEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteCustomField(fieldId: FieldDefinitionId): Promise<Result<ProjectStructure, string>>
}

export interface RecordRelationSession {
  createContentRecord(record: ContentRecord): Promise<Result<ProjectStructure, string>>
  updateContentRecord(recordId: ContentRecordId, patch: ContentRecordEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteContentRecord(recordId: ContentRecordId): Promise<Result<ProjectStructure, string>>
  restoreContentRecordRevision(revisionId: ContentRecordRevisionId): Promise<Result<ProjectStructure, string>>
  createRelation(relation: Relation): Promise<Result<ProjectStructure, string>>
  updateRelation(relationId: RelationId, patch: RelationEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteRelation(relationId: RelationId): Promise<Result<ProjectStructure, string>>
  createRelationEntry(entry: RelationEntry): Promise<Result<ProjectStructure, string>>
  updateRelationEntry(entryId: RelationEntryId, patch: RelationEntryEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteRelationEntry(entryId: RelationEntryId): Promise<Result<ProjectStructure, string>>
}

export interface RoleSession {
  createRole(role: Role): Promise<Result<ProjectStructure, string>>
  updateRole(roleId: RoleId, patch: RoleEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteRole(roleId: RoleId): Promise<Result<ProjectStructure, string>>
}

export interface UserSession {
  createUser(user: User): Promise<Result<ProjectStructure, string>>
  updateUser(userId: UserId, patch: UserEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteUser(userId: UserId): Promise<Result<ProjectStructure, string>>
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

export function requireCustomFieldSession(session: EditorProjectSession): EditorProjectSession & CustomFieldSession {
  const candidate = session as EditorProjectSession & Partial<CustomFieldSession>
  if (
    typeof candidate.createCustomField !== 'function'
    || typeof candidate.updateCustomField !== 'function'
    || typeof candidate.deleteCustomField !== 'function'
  ) {
    throw new Error('La sesión actual no ofrece la capacidad de campos personalizados.')
  }
  return candidate as EditorProjectSession & CustomFieldSession
}

export function useCustomFieldSession(): CustomFieldSession {
  return requireCustomFieldSession(useEditorProject())
}

export function requireRecordRelationSession(session: EditorProjectSession): EditorProjectSession & RecordRelationSession {
  const candidate = session as EditorProjectSession & Partial<RecordRelationSession>
  if (
    typeof candidate.createContentRecord !== 'function'
    || typeof candidate.updateContentRecord !== 'function'
    || typeof candidate.deleteContentRecord !== 'function'
    || typeof candidate.restoreContentRecordRevision !== 'function'
    || typeof candidate.createRelation !== 'function'
    || typeof candidate.updateRelation !== 'function'
    || typeof candidate.deleteRelation !== 'function'
    || typeof candidate.createRelationEntry !== 'function'
    || typeof candidate.updateRelationEntry !== 'function'
    || typeof candidate.deleteRelationEntry !== 'function'
  ) {
    throw new Error('La sesión actual no ofrece la capacidad de registros y relaciones.')
  }
  return candidate as EditorProjectSession & RecordRelationSession
}

export function useRecordRelationSession(): RecordRelationSession {
  return requireRecordRelationSession(useEditorProject())
}

export function requireRoleSession(session: EditorProjectSession): EditorProjectSession & RoleSession {
  const candidate = session as EditorProjectSession & Partial<RoleSession>
  if (typeof candidate.createRole !== 'function' || typeof candidate.updateRole !== 'function' || typeof candidate.deleteRole !== 'function') {
    throw new Error('La sesión actual no ofrece la gestión de roles.')
  }
  return candidate as EditorProjectSession & RoleSession
}

export function useRoleSession(): RoleSession {
  return requireRoleSession(useEditorProject())
}

export function requireUserSession(session: EditorProjectSession): EditorProjectSession & UserSession {
  const candidate = session as EditorProjectSession & Partial<UserSession>
  if (typeof candidate.createUser !== 'function' || typeof candidate.updateUser !== 'function' || typeof candidate.deleteUser !== 'function') throw new Error('La sesión actual no ofrece la gestión de personas.')
  return candidate as EditorProjectSession & UserSession
}

export function useUserSession(): UserSession {
  return requireUserSession(useEditorProject())
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
