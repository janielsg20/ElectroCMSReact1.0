import {
  addDocument,
  addMediaAsset,
  createMediaFolder,
  createMediaTag,
  applyThemePackage as applyThemePackageToStructure,
  applyProjectBlueprint as applyProjectBlueprintToStructure,
  createAuditLogEntry,
  createBreakpoint,
  createCompleteWidgetRegistry,
  deleteNodes,
  deleteMediaAsset,
  duplicateNodes,
  editableVisualStyles,
  failure,
  insertNode,
  mergeEditableVisualStyles,
  moveNodes,
  parseBreakpointId,
  parseAuditLogEntryId,
  parseContentRecordRevisionId,
  parseDocumentId,
  parseGlobalComponentId,
  parseNodeId,
  parseProjectHistoryEntryId,
  parseProjectId,
  parseMediaFolderId,
  parseMediaTagId,
  parseTimestamp,
  ProjectStructureSchema,
  reorderBreakpoint,
  resetNodeBreakpointOverride,
  resetProjectTheme,
  resizeNode,
  resolveNodeDataState,
  setNodeDataSettings,
  setNodesHidden,
  setNodesLocked,
  renameNode,
  setNodeProperties,
  setNodeStyles,
  setProjectTheme,
  success,
  updateBreakpoint,
  updateMediaAsset,
  updateDocumentConditions,
  updateEditableDemoStore,
  updateNodeSpacing,
  type BreakpointId,
  type AuditActor,
  type AuditLogEntry,
  type BreakpointInput,
  type BreakpointPatch,
  type ContentRecord,
  type ContentRecordId,
  type ContentRecordRevisionId,
  type ContentType,
  type ContentTypeId,
  type Document,
  type DocumentId,
  type EditableDemoStorePatch,
  type FieldDefinition,
  type FieldDefinitionId,
  type Form,
  type FormId,
  type JsonValue,
  type MediaAssetId,
  type MediaAssetInput,
  type MediaAssetVariantName,
  type MediaFolder,
  type MediaTag,
  type Node,
  type NodeDataSettings,
  type NodeId,
  type NodePlacement,
  type NodeSize,
  type NodeSpacing,
  type ProjectId,
  type ProjectRecord,
  type ProjectStructure,
  type ProjectTheme,
  type ProjectThemeScope,
  type ProjectBlueprint,
  type ProjectBlueprintApplyReport,
  type Query,
  type QueryId,
  type Relation,
  type RelationEntry,
  type RelationEntryId,
  type RelationId,
  type Result,
  type Role,
  type RoleId,
  type User,
  type UserId,
  type Taxonomy,
  type TaxonomyId,
  type TaxonomyTerm,
  type TaxonomyTermId,
  type TemplateCondition,
  type ThemePackage,
  type ThemePackageId,
  type ThemePackageImportReport,
  type ThemePackagePartSelection,
  type ThemePackageRouteConflictPolicy,
} from './domain'
import {
  createContentType as createContentTypeInStructure,
  deleteContentType as deleteContentTypeInStructure,
  updateContentType as updateContentTypeInStructure,
  type ContentTypeEditablePatch,
} from './domain/project/content-type-engine'
import {
  createCustomField as createCustomFieldInStructure,
  deleteCustomField as deleteCustomFieldInStructure,
  updateCustomField as updateCustomFieldInStructure,
  type FieldDefinitionEditablePatch,
} from './domain/project/custom-field-engine'
import {
  addFormControl as addFormControlInStructure,
  createForm as createFormInStructure,
  deleteForm as deleteFormInStructure,
  removeFormControl as removeFormControlInStructure,
  reorderFormControl as reorderFormControlInStructure,
  updateForm as updateFormInStructure,
  updateFormControl as updateFormControlInStructure,
  type FormControl,
  type FormControlEditablePatch,
  type FormEditablePatch,
} from './domain/project/form-builder-engine'
import {
  createAdminShell as createAdminShellStructure,
  deleteAdminShell as deleteAdminShellStructure,
  updateAdminShell as updateAdminShellStructure,
  type AdminShellInput,
  type AdminShellUpdate,
} from './domain/project/backend-shell-engine'
import type { BackendScreenId } from './domain/project/identity'
import {
  createContentRecord as createContentRecordInStructure,
  createRelation as createRelationInStructure,
  createRelationEntry as createRelationEntryInStructure,
  deleteContentRecord as deleteContentRecordInStructure,
  deleteRelation as deleteRelationInStructure,
  deleteRelationEntry as deleteRelationEntryInStructure,
  restoreContentRecordRevision as restoreContentRecordRevisionInStructure,
  updateContentRecord as updateContentRecordInStructure,
  updateRelation as updateRelationInStructure,
  updateRelationEntry as updateRelationEntryInStructure,
  type ContentRecordEditablePatch,
  type RelationEditablePatch,
  type RelationEntryEditablePatch,
} from './domain/project/record-relation-engine'
import {
  createRole as createRoleInStructure,
  deleteRole as deleteRoleInStructure,
  updateRole as updateRoleInStructure,
  type RoleEditablePatch,
} from './domain/project/role-engine'
import {
  createUser as createUserInStructure,
  deleteUser as deleteUserInStructure,
  updateUser as updateUserInStructure,
  type UserEditablePatch,
} from './domain/project/user-engine'
import {
  createSavedQuery as createSavedQueryInStructure,
  deleteSavedQuery as deleteSavedQueryInStructure,
  updateSavedQuery as updateSavedQueryInStructure,
  type QueryEditablePatch,
} from './domain/project/query-definition-engine'
import {
  createTaxonomy as createTaxonomyInStructure,
  createTaxonomyTerm as createTaxonomyTermInStructure,
  deleteTaxonomy as deleteTaxonomyInStructure,
  deleteTaxonomyTerm as deleteTaxonomyTermInStructure,
  updateTaxonomy as updateTaxonomyInStructure,
  updateTaxonomyTerm as updateTaxonomyTermInStructure,
  type TaxonomyEditablePatch,
  type TaxonomyTermEditablePatch,
} from './domain/project/taxonomy-engine'
import { ProjectCommandBus, ProjectStructureCommand, type ProjectCommandBusError } from './application'
import {
  createAuditLogRepository,
  createMediaBlobRepository,
  createProjectHistoryRepository,
  createProjectRecordRepository,
  createThemePackageRepository,
  ElectroCmsLocalDatabase,
} from './infrastructure'
import { ProjectStructureRenderStore } from './renderers'
import {
  STARTER_DOCUMENT_ID,
  STARTER_PROJECT_STRUCTURE,
  STARTER_SELECTED_NODE_ID,
} from './editor-ui/editor/starter-project-structure'
import type {
  BreakpointCreationResult,
  EditorProjectSession,
  WidgetInsertionResult,
  WidgetInsertionTemplate,
} from './editor-ui/editor/editor-project-context'

const EDITOR_PROJECT_ID = parseProjectId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1')
const EDITOR_DATABASE_NAME = 'electrocms-editor-project-v2'
const widgetRegistry = createCompleteWidgetRegistry()

function now() {
  return parseTimestamp(new Date().toISOString())
}

function initialRecord(projectId: ProjectId): ProjectRecord<ProjectStructure> {
  const timestamp = now()
  return {
    lifecycle: { archivedAt: null, restoreState: null, state: 'active', trashedAt: null },
    project: {
      createdAt: timestamp,
      format: 'electrocms.project',
      metadata: {},
      name: 'Proyecto local',
      payload: structuredClone(STARTER_PROJECT_STRUCTURE),
      projectId,
      revision: 0,
      schemaVersion: 1,
      updatedAt: timestamp,
    },
  }
}

function commandErrorMessage(error: ProjectCommandBusError): string {
  if (error.kind === 'command-failed' || error.kind === 'invalid-command-output' || error.kind === 'history-conflict') return error.message
  if (error.kind === 'persistence') return error.cause.message
  if (error.kind === 'not-found') return 'El proyecto local no existe.'
  if (error.kind === 'pending-operation') return 'Hay una operación pendiente de reconciliación.'
  if (error.kind === 'nothing-to-undo') return 'No hay cambios para deshacer.'
  return 'No hay cambios para rehacer.'
}

class BrowserEditorProjectSession implements EditorProjectSession {
  #documentId = STARTER_DOCUMENT_ID
  readonly #documentSelectionListeners = new Set<() => void>()
  get documentId(): DocumentId { return this.#documentId }
  readonly initialSelectedNodeId = STARTER_SELECTED_NODE_ID
  readonly store = new ProjectStructureRenderStore(STARTER_PROJECT_STRUCTURE)
  readonly #database: ElectroCmsLocalDatabase
  readonly #projects: ReturnType<typeof createProjectRecordRepository<ProjectStructure>>
  readonly #histories: ReturnType<typeof createProjectHistoryRepository<ProjectStructure>>
  readonly #auditLog: ReturnType<typeof createAuditLogRepository>
  readonly #mediaBlobs: ReturnType<typeof createMediaBlobRepository>
  readonly #themePackages: ReturnType<typeof createThemePackageRepository>
  readonly #bus: ProjectCommandBus<ProjectStructure>
  readonly #ready: Promise<Result<void, string>>
  #auditActor: AuditActor = { kind: 'system', label: 'Configuración del proyecto' }

  constructor(databaseName = EDITOR_DATABASE_NAME) {
    this.#database = new ElectroCmsLocalDatabase(databaseName)
    this.#projects = createProjectRecordRepository(this.#database, ProjectStructureSchema)
    this.#histories = createProjectHistoryRepository(this.#database, ProjectStructureSchema)
    this.#auditLog = createAuditLogRepository(this.#database)
    this.#mediaBlobs = createMediaBlobRepository(this.#database)
    this.#themePackages = createThemePackageRepository(this.#database)
    this.#bus = new ProjectCommandBus(this.#projects, this.#histories, ProjectStructureSchema, {
      createHistoryEntryId: () => parseProjectHistoryEntryId(crypto.randomUUID()),
      now,
    })
    this.#ready = this.#initialize()
  }

  selectDocument(documentId: DocumentId): void {
    if (!this.store.structure.documents[documentId] || this.#documentId === documentId) return
    this.#documentId = documentId
    for (const listener of [...this.#documentSelectionListeners]) listener()
  }

  subscribeDocumentSelection(listener: () => void): () => void {
    this.#documentSelectionListeners.add(listener)
    return () => this.#documentSelectionListeners.delete(listener)
  }

  setAuditActor(actor: AuditActor): void {
    this.#auditActor = structuredClone(actor)
  }

  async listAuditEntries(): Promise<Result<readonly AuditLogEntry[], string>> {
    const entries = await this.#auditLog.list()
    if (!entries.ok) return failure(entries.error.message)
    return success([...entries.value]
      .filter((entry) => entry.projectId === EDITOR_PROJECT_ID)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)))
  }

  async exportAuditEntries(): Promise<Result<string, string>> {
    const entries = await this.listAuditEntries()
    if (!entries.ok) return entries
    return success(JSON.stringify({ exportedAt: new Date().toISOString(), format: 'electrocms.audit-log', schemaVersion: 1, entries: entries.value }, null, 2))
  }

  async applyThemePackage(themePackage: ThemePackage, selection: ThemePackagePartSelection, routeConflict: ThemePackageRouteConflictPolicy): Promise<Result<ThemePackageImportReport, string>> {
    let report: ThemePackageImportReport | null = null
    const applied = await this.#execute(new ProjectStructureCommand(
      'theme-package.apply',
      `Aplicar paquete ${themePackage.name}`,
      (structure) => {
        const imported = applyThemePackageToStructure(structure, themePackage, selection, {
          ids: {
            breakpointId: () => parseBreakpointId(crypto.randomUUID()),
            documentId: () => parseDocumentId(crypto.randomUUID()),
            globalComponentId: () => parseGlobalComponentId(crypto.randomUUID()),
            nodeId: () => parseNodeId(crypto.randomUUID()),
          },
          routeConflict,
        })
        if (!imported.ok) return failure({ code: 'invalid-tree' as const, message: imported.error[0]?.message ?? 'El paquete no se puede aplicar al proyecto actual.' })
        report = imported.value.report
        return success(imported.value.structure)
      },
    ))
    if (!applied.ok) return failure(applied.error)
    return report ? success(report) : failure('El paquete se aplicó sin producir un informe de cambios.')
  }

  async applyProjectBlueprint(blueprint: ProjectBlueprint): Promise<Result<ProjectBlueprintApplyReport, string>> {
    let report: ProjectBlueprintApplyReport | null = null
    const applied = await this.#execute(new ProjectStructureCommand(
      'project-blueprint.apply',
      `Aplicar modelo ${blueprint.name}`,
      (structure) => {
        const result = applyProjectBlueprintToStructure(structure, blueprint, { createId: () => crypto.randomUUID(), now: new Date().toISOString() })
        if (!result.ok) return failure({ code: 'invalid-tree' as const, message: result.error.join(' ') })
        report = result.value.report
        return success(result.value.structure)
      },
    ))
    if (!applied.ok) return failure(applied.error)
    return report ? success(report) : failure('El modelo se aplicó sin producir un informe de cambios.')
  }

  async updateEditableDemoStore(patch: EditableDemoStorePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('demo-store.update', 'Actualizar tienda demo', (structure) => {
      const updated = updateEditableDemoStore(structure, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error })
    }))
  }

  async addFormControl(formId: FormId, stepId: string, control: FormControl, position?: number): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.add-form-control', `Añadir control ${control.label}`, (structure) => {
      const added = addFormControlInStructure(structure, formId, stepId, control, position)
      return added.ok ? success(added.value) : failure({ code: 'invalid-tree' as const, message: added.error[0]?.message ?? 'El control no es válido.' })
    }))
  }

  async createBreakpoint(input: BreakpointInput, index?: number): Promise<Result<BreakpointCreationResult, string>> {
    const breakpointId = parseBreakpointId(crypto.randomUUID())
    const created = await this.#execute(new ProjectStructureCommand(
      'responsive.create-breakpoint', `Crear breakpoint ${input.name}`,
      (structure) => createBreakpoint(structure, breakpointId, input, index),
    ))
    return created.ok ? success({ breakpointId, structure: created.value }) : created
  }

  async createContentRecord(record: ContentRecord): Promise<Result<ProjectStructure, string>> {
    const timestamp = now()
    const normalized: ContentRecord = { ...structuredClone(record), createdAt: timestamp, updatedAt: timestamp }
    return this.#execute(new ProjectStructureCommand('cms.create-content-record', 'Crear registro de contenido', (structure) => {
      const created = createContentRecordInStructure(structure, normalized)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El registro no es válido.' })
    }))
  }

  async createMediaAsset(asset: MediaAssetInput): Promise<Result<ProjectStructure, string>> {
    const timestamp = now()
    return this.#execute(new ProjectStructureCommand('media.create-asset', `Añadir recurso ${asset.name}`, (structure) => {
      const created = addMediaAsset(structure, asset, timestamp)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error })
    }))
  }

  async createMediaFolder(name: string, parentId: MediaFolder['parentId'] = null): Promise<Result<ProjectStructure, string>> {
    const folder: MediaFolder = { id: parseMediaFolderId(crypto.randomUUID()), name, parentId }
    return this.#execute(new ProjectStructureCommand('media.create-folder', `Crear carpeta ${name}`, (structure) => {
      const created = createMediaFolder(structure, folder)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error })
    }))
  }

  async createMediaTag(name: string): Promise<Result<ProjectStructure, string>> {
    const tag: MediaTag = { id: parseMediaTagId(crypto.randomUUID()), name }
    return this.#execute(new ProjectStructureCommand('media.create-tag', `Crear etiqueta ${name}`, (structure) => {
      const created = createMediaTag(structure, tag)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error })
    }))
  }

  async importMediaAsset(asset: MediaAssetInput, dataUrl: string, variantData: Readonly<Partial<Record<MediaAssetVariantName, string>>> = {}): Promise<Result<ProjectStructure, string>> {
    const blob = await this.#mediaBlobs.save({ assetId: asset.id, dataUrl, schemaVersion: 1, variantData })
    if (!blob.ok) return failure(blob.error.message)
    const created = await this.createMediaAsset(asset)
    if (!created.ok) await this.#mediaBlobs.remove(asset.id)
    return created
  }

  async readMediaAssetData(assetId: MediaAssetId, variant?: MediaAssetVariantName): Promise<Result<string | null, string>> {
    const blob = await this.#mediaBlobs.findById(assetId)
    if (!blob.ok) return failure(blob.error.message)
    return success(variant ? blob.value?.variantData[variant] ?? null : blob.value?.dataUrl ?? null)
  }

  async updateMediaAsset(assetId: MediaAssetId, patch: Partial<Pick<MediaAssetInput, 'altText' | 'description' | 'folderId' | 'name' | 'starred' | 'tagIds'>>): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('media.update-asset', 'Editar recurso multimedia', (structure) => {
      const updated = updateMediaAsset(structure, assetId, patch, now())
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error })
    }))
  }

  async deleteMediaAsset(assetId: MediaAssetId): Promise<Result<ProjectStructure, string>> {
    const removed = await this.#execute(new ProjectStructureCommand('media.delete-asset', 'Eliminar recurso multimedia', (structure) => {
      const removed = deleteMediaAsset(structure, assetId)
      return removed.ok ? success(removed.value) : failure({ code: 'invalid-tree' as const, message: removed.error })
    }))
    if (removed.ok) await this.#mediaBlobs.remove(assetId)
    return removed
  }

  async createContentType(contentType: ContentType): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-content-type', `Crear tipo ${contentType.pluralName}`, (structure) => {
      const created = createContentTypeInStructure(structure, contentType)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El tipo de contenido no es válido.' })
    }))
  }

  async createCustomField(field: FieldDefinition): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-custom-field', `Crear campo ${field.label}`, (structure) => {
      const created = createCustomFieldInStructure(structure, field)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El campo personalizado no es válido.' })
    }))
  }

  async createDocument(document: Document): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('template.create-document', `Crear ${document.kind}: ${document.name}`, (structure) => {
      const created = addDocument(structure, document)
      return created.ok ? created : failure({ code: 'invalid-tree' as const, message: created.error.message })
    }))
  }

  async createAdminShell(input: AdminShellInput): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-admin-shell', `Crear shell administrativo ${input.screenName}`, (structure) => {
      const created = createAdminShellStructure(structure, input)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El shell administrativo no es válido.' })
    }))
  }

  async updateAdminShell(screenId: BackendScreenId, patch: AdminShellUpdate): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-admin-shell', 'Actualizar shell administrativo', (structure) => {
      const updated = updateAdminShellStructure(structure, screenId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El shell administrativo no es válido.' })
    }))
  }

  async deleteAdminShell(screenId: BackendScreenId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-admin-shell', 'Eliminar shell administrativo', (structure) => {
      const deleted = deleteAdminShellStructure(structure, screenId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El shell administrativo no se puede retirar.' })
    }))
  }

  async createForm(form: Form): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-form', `Crear formulario ${form.name}`, (structure) => {
      const created = createFormInStructure(structure, form)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El formulario no es válido.' })
    }))
  }

  async createRelation(relation: Relation): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-relation', `Crear relación ${relation.name}`, (structure) => {
      const created = createRelationInStructure(structure, relation)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'La relación no es válida.' })
    }))
  }

  async createRelationEntry(entry: RelationEntry): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-relation-entry', 'Conectar registros', (structure) => {
      const created = createRelationEntryInStructure(structure, entry)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'La conexión no es válida.' })
    }))
  }

  async createUser(user: User): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-user', `Crear persona ${user.displayName}`, (structure) => {
      const created = createUserInStructure(structure, user)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error })
    }))
  }

  async createRole(role: Role): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-role', `Crear rol ${role.name}`, (structure) => {
      const created = createRoleInStructure(structure, role)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error })
    }))
  }

  async updateRole(roleId: RoleId, patch: RoleEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-role', 'Actualizar rol', (structure) => {
      const updated = updateRoleInStructure(structure, roleId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error })
    }))
  }

  async deleteRole(roleId: RoleId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-role', 'Eliminar rol', (structure) => {
      const deleted = deleteRoleInStructure(structure, roleId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error })
    }))
  }

  async createSavedQuery(query: Query): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-query', `Crear consulta ${query.name}`, (structure) => {
      const created = createSavedQueryInStructure(structure, query)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'La consulta no es válida.' })
    }))
  }

  async createTaxonomy(taxonomy: Taxonomy): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-taxonomy', `Crear taxonomía ${taxonomy.pluralName}`, (structure) => {
      const created = createTaxonomyInStructure(structure, taxonomy)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'La taxonomía no es válida.' })
    }))
  }

  async createTaxonomyTerm(term: TaxonomyTerm): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-taxonomy-term', `Crear término ${term.name}`, (structure) => {
      const created = createTaxonomyTermInStructure(structure, term)
      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El término no es válido.' })
    }))
  }

  async deleteContentRecord(recordId: ContentRecordId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-content-record', 'Eliminar registro de contenido', (structure) => {
      const deleted = deleteContentRecordInStructure(structure, recordId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El registro no se puede eliminar.' })
    }))
  }

  async deleteUser(userId: UserId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-user', 'Eliminar persona', (structure) => {
      const deleted = deleteUserInStructure(structure, userId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error })
    }))
  }

  async deleteContentType(contentTypeId: ContentTypeId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-content-type', 'Eliminar tipo de contenido', (structure) => {
      const deleted = deleteContentTypeInStructure(structure, contentTypeId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El tipo de contenido no se puede eliminar.' })
    }))
  }

  async deleteCustomField(fieldId: FieldDefinitionId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-custom-field', 'Eliminar campo personalizado', (structure) => {
      const deleted = deleteCustomFieldInStructure(structure, fieldId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El campo personalizado no se puede eliminar.' })
    }))
  }

  async deleteForm(formId: FormId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-form', 'Eliminar formulario', (structure) => {
      const deleted = deleteFormInStructure(structure, formId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El formulario no se puede eliminar.' })
    }))
  }

  async deleteRelation(relationId: RelationId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-relation', 'Eliminar relación', (structure) => {
      const deleted = deleteRelationInStructure(structure, relationId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'La relación no se puede eliminar.' })
    }))
  }

  async deleteRelationEntry(entryId: RelationEntryId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-relation-entry', 'Desconectar registros', (structure) => {
      const deleted = deleteRelationEntryInStructure(structure, entryId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'La conexión no se puede eliminar.' })
    }))
  }

  async deleteSavedQuery(queryId: QueryId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-query', 'Eliminar consulta guardada', (structure) => {
      const deleted = deleteSavedQueryInStructure(structure, queryId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'La consulta no se puede eliminar.' })
    }))
  }

  async deleteTaxonomy(taxonomyId: TaxonomyId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-taxonomy', 'Eliminar taxonomía', (structure) => {
      const deleted = deleteTaxonomyInStructure(structure, taxonomyId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'La taxonomía no se puede eliminar.' })
    }))
  }

  async deleteTaxonomyTerm(termId: TaxonomyTermId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-taxonomy-term', 'Eliminar término de taxonomía', (structure) => {
      const deleted = deleteTaxonomyTermInStructure(structure, termId)
      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El término no se puede eliminar.' })
    }))
  }

  async insertWidget(widgetType: string, anchorNodeId?: NodeId | null, template: WidgetInsertionTemplate = {}): Promise<Result<WidgetInsertionResult, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const definition = widgetRegistry.get(widgetType)
    if (!definition) return failure(`El widget ${widgetType} no está registrado.`)
    const properties = { ...structuredClone(definition.defaults), ...structuredClone(template.properties ?? {}) }
    const validatedProperties = definition.propertySchema.safeParse(properties)
    if (!validatedProperties.success) return failure(`El preset de ${definition.label} contiene propiedades inválidas.`)

    const nodeId = parseNodeId(crypto.randomUUID())
    const node: Node = {
      bindings: {}, conditions: [], hidden: false, id: nodeId, kind: 'widget', locked: false,
      name: template.name?.trim() || definition.label,
      properties: validatedProperties.data,
      responsive: structuredClone(template.responsive ?? {}),
      slots: {}, styles: structuredClone(template.styles ?? {}), widgetType,
    }
    const placement = this.#insertionPlacement(anchorNodeId ?? null)
    const inserted = await this.#execute(new ProjectStructureCommand(
      'tree.insert-widget', `Insertar ${definition.label}`,
      (structure) => insertNode(structure, { documentId: this.documentId, kind: 'document' }, node, placement),
    ))
    return inserted.ok ? success({ nodeId, structure: inserted.value }) : inserted
  }

  async listThemePackages(): Promise<Result<readonly ThemePackage[], string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const listed = await this.#themePackages.list()
    return listed.ok ? success(listed.value) : failure(listed.error.message)
  }

  async moveNodes(nodeIds: readonly NodeId[], placement: NodePlacement): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('tree.move', nodeIds.length === 1 ? 'Mover capa' : 'Mover capas', (structure) => moveNodes(structure, { documentId: this.documentId, kind: 'document' }, nodeIds, placement)))
  }

  async removeFormControl(formId: FormId, controlId: string): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.remove-form-control', 'Eliminar control del formulario', (structure) => {
      const removed = removeFormControlInStructure(structure, formId, controlId)
      return removed.ok ? success(removed.value) : failure({ code: 'invalid-tree' as const, message: removed.error[0]?.message ?? 'El control no se puede eliminar.' })
    }))
  }

  async removeThemePackage(packageId: ThemePackageId): Promise<Result<boolean, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const removed = await this.#themePackages.remove(packageId)
    return removed.ok ? success(removed.value) : failure(removed.error.message)
  }

  async reorderBreakpoint(breakpointId: BreakpointId, targetIndex: number): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('responsive.reorder-breakpoint', 'Reordenar breakpoint', (structure) => reorderBreakpoint(structure, breakpointId, targetIndex)))
  }

  async reorderFormControl(formId: FormId, controlId: string, position: number): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.reorder-form-control', 'Reordenar control del formulario', (structure) => {
      const reordered = reorderFormControlInStructure(structure, formId, controlId, position)
      return reordered.ok ? success(reordered.value) : failure({ code: 'invalid-tree' as const, message: reordered.error[0]?.message ?? 'El control no se puede reordenar.' })
    }))
  }

  async resetNodeBreakpointOverride(nodeId: NodeId, breakpointId: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('responsive.reset-node-override', 'Restablecer override responsive', (structure) => resetNodeBreakpointOverride(structure, { documentId: this.documentId, kind: 'document' }, nodeId, breakpointId)))
  }

  async resetNodeDataSettings(nodeId: NodeId): Promise<Result<ProjectStructure, string>> {
    return this.#mutateNodeDataSettings(nodeId, { accessibility: {}, bindings: {}, conditions: [] }, true)
  }

  async resetWidgetProperty(nodeId: NodeId, key: string): Promise<Result<ProjectStructure, string>> {
    return this.#mutateWidgetProperty(nodeId, key, undefined, true)
  }

  async resetNodeVisualStyles(nodeId: NodeId): Promise<Result<ProjectStructure, string>> {
    return this.#mutateNodeVisualStyles(nodeId, {})
  }

  async resetProjectTheme(scope: ProjectThemeScope): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(`theme.reset-${scope}`, `Restablecer tema de ${scope === 'frontend' ? 'frontend' : 'backend'}`, (structure) => {
      const reset = resetProjectTheme(structure, scope)
      return reset.ok ? reset : failure({ code: 'invalid-theme' as const, message: reset.error[0]?.message ?? 'El tema no es válido.' })
    }))
  }

  async resizeNode(nodeId: NodeId, size: NodeSize, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('canvas.resize', 'Redimensionar nodo', (structure) => resizeNode(structure, { breakpointId, nodeId, owner: { documentId: this.documentId, kind: 'document' } }, size)))
  }

  async restoreContentRecordRevision(revisionId: ContentRecordRevisionId): Promise<Result<ProjectStructure, string>> {
    const timestamp = now()
    const backupRevisionId = parseContentRecordRevisionId(crypto.randomUUID())
    return this.#execute(new ProjectStructureCommand('cms.restore-content-record-revision', 'Restaurar revisión de contenido', (structure) => {
      const restored = restoreContentRecordRevisionInStructure(structure, revisionId, { now: timestamp, revisionId: backupRevisionId })
      return restored.ok ? success(restored.value) : failure({ code: 'invalid-tree' as const, message: restored.error[0]?.message ?? 'La revisión no se puede restaurar.' })
    }))
  }

  async saveThemePackage(themePackage: ThemePackage): Promise<Result<void, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const saved = await this.#themePackages.save(themePackage)
    return saved.ok ? success(undefined) : failure(saved.error.message)
  }

  async updateContentRecord(recordId: ContentRecordId, patch: ContentRecordEditablePatch): Promise<Result<ProjectStructure, string>> {
    const timestamp = now()
    const revisionId = parseContentRecordRevisionId(crypto.randomUUID())
    return this.#execute(new ProjectStructureCommand('cms.update-content-record', 'Editar registro de contenido', (structure) => {
      const updated = updateContentRecordInStructure(structure, recordId, patch, { now: timestamp, revisionId })
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El registro no es válido.' })
    }))
  }

  async updateContentType(contentTypeId: ContentTypeId, patch: ContentTypeEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-content-type', 'Editar tipo de contenido', (structure) => {
      const updated = updateContentTypeInStructure(structure, contentTypeId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El tipo de contenido no es válido.' })
    }))
  }

  async deleteNodes(nodeIds: readonly NodeId[]): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'tree.delete', nodeIds.length === 1 ? 'Eliminar capa' : 'Eliminar capas',
      (structure) => deleteNodes(structure, { documentId: this.documentId, kind: 'document' }, nodeIds),
    ))
  }

  async duplicateNodes(nodeIds: readonly NodeId[]): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('tree.duplicate', nodeIds.length === 1 ? 'Duplicar capa' : 'Duplicar capas', (structure) => {
      const duplicated = duplicateNodes(structure, { documentId: this.documentId, kind: 'document' }, nodeIds, () => parseNodeId(crypto.randomUUID()))
      return duplicated.ok ? success(duplicated.value.structure) : duplicated
    }))
  }

  async renameNode(nodeId: NodeId, name: string): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('tree.rename', 'Renombrar capa', (structure) => renameNode(structure, { documentId: this.documentId, kind: 'document' }, nodeId, name)))
  }

  async setNodesHidden(nodeIds: readonly NodeId[], hidden: boolean): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('tree.set-hidden', hidden ? 'Ocultar capa' : 'Mostrar capa', (structure) => setNodesHidden(structure, { documentId: this.documentId, kind: 'document' }, nodeIds, hidden)))
  }

  async setNodesLocked(nodeIds: readonly NodeId[], locked: boolean): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('tree.set-locked', locked ? 'Bloquear capa' : 'Desbloquear capa', (structure) => setNodesLocked(structure, { documentId: this.documentId, kind: 'document' }, nodeIds, locked)))
  }

  async updateUser(userId: UserId, patch: UserEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-user', 'Editar persona', (structure) => {
      const updated = updateUserInStructure(structure, userId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error })
    }))
  }

  async updateCustomField(fieldId: FieldDefinitionId, patch: FieldDefinitionEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-custom-field', 'Editar campo personalizado', (structure) => {
      const updated = updateCustomFieldInStructure(structure, fieldId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El campo personalizado no es válido.' })
    }))
  }

  async updateForm(formId: FormId, patch: FormEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-form', 'Editar formulario', (structure) => {
      const updated = updateFormInStructure(structure, formId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El formulario no es válido.' })
    }))
  }

  async updateFormControl(formId: FormId, controlId: string, patch: FormControlEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-form-control', 'Editar control del formulario', (structure) => {
      const updated = updateFormControlInStructure(structure, formId, controlId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El control no es válido.' })
    }))
  }

  async updateRelation(relationId: RelationId, patch: RelationEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-relation', 'Editar relación', (structure) => {
      const updated = updateRelationInStructure(structure, relationId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'La relación no es válida.' })
    }))
  }

  async updateRelationEntry(entryId: RelationEntryId, patch: RelationEntryEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-relation-entry', 'Editar conexión entre registros', (structure) => {
      const updated = updateRelationEntryInStructure(structure, entryId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'La conexión no es válida.' })
    }))
  }

  async updateSavedQuery(queryId: QueryId, patch: QueryEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-query', 'Editar consulta guardada', (structure) => {
      const updated = updateSavedQueryInStructure(structure, queryId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'La consulta no es válida.' })
    }))
  }

  async updateTaxonomy(taxonomyId: TaxonomyId, patch: TaxonomyEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-taxonomy', 'Editar taxonomía', (structure) => {
      const updated = updateTaxonomyInStructure(structure, taxonomyId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'La taxonomía no es válida.' })
    }))
  }

  async updateTaxonomyTerm(termId: TaxonomyTermId, patch: TaxonomyTermEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-taxonomy-term', 'Editar término de taxonomía', (structure) => {
      const updated = updateTaxonomyTermInStructure(structure, termId, patch)
      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El término no es válido.' })
    }))
  }

  async updateWidgetProperty(nodeId: NodeId, key: string, value: JsonValue): Promise<Result<ProjectStructure, string>> {
    return this.#mutateWidgetProperty(nodeId, key, value, false)
  }

  async updateNodeVisualStyles(nodeId: NodeId, styles: Readonly<Record<string, JsonValue>>): Promise<Result<ProjectStructure, string>> {
    return this.#mutateNodeVisualStyles(nodeId, styles)
  }

  async updateNodeSpacing(nodeId: NodeId, spacing: NodeSpacing, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('canvas.spacing', 'Editar espaciado', (structure) => updateNodeSpacing(structure, { breakpointId, nodeId, owner: { documentId: this.documentId, kind: 'document' } }, spacing)))
  }

  async updateNodeDataSettings(nodeId: NodeId, settings: NodeDataSettings): Promise<Result<ProjectStructure, string>> {
    return this.#mutateNodeDataSettings(nodeId, settings, false)
  }

  async updateProjectTheme(scope: ProjectThemeScope, theme: ProjectTheme): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(`theme.update-${scope}`, `Editar tema de ${scope === 'frontend' ? 'frontend' : 'backend'}`, (structure) => {
      const updated = setProjectTheme(structure, scope, theme)
      return updated.ok ? updated : failure({ code: 'invalid-theme' as const, message: updated.error[0]?.message ?? 'El tema no es válido.' })
    }))
  }

  async updateBreakpoint(breakpointId: BreakpointId, patch: BreakpointPatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('responsive.update-breakpoint', 'Editar breakpoint', (structure) => updateBreakpoint(structure, breakpointId, patch)))
  }

  async updateDocumentConditions(documentId: DocumentId, conditions: readonly TemplateCondition[]): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('template.update-conditions', 'Editar condiciones de plantilla', (structure) => {
      const updated = updateDocumentConditions(structure, documentId, conditions)
      return updated.ok ? updated : failure({ code: 'invalid-tree' as const, message: updated.error.message })
    }))
  }

  async undo(): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const undone = await this.#bus.undo(EDITOR_PROJECT_ID)
    if (!undone.ok) return failure(commandErrorMessage(undone.error))
    await this.#appendAuditEntry(undone.value.entryId, 'undo')
    return this.#publishPersistedStructure()
  }

  async redo(): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const redone = await this.#bus.redo(EDITOR_PROJECT_ID)
    if (!redone.ok) return failure(commandErrorMessage(redone.error))
    await this.#appendAuditEntry(redone.value.entryId, 'redo')
    return this.#publishPersistedStructure()
  }

  async #initialize(): Promise<Result<void, string>> {
    const loaded = await this.#projects.findById(EDITOR_PROJECT_ID)
    if (!loaded.ok) return failure(loaded.error.message)
    if (!loaded.value) {
      const saved = await this.#projects.save(initialRecord(EDITOR_PROJECT_ID))
      return saved.ok ? success(undefined) : failure(saved.error.message)
    }
    const replaced = this.store.replaceStructure(loaded.value.project.payload)
    return replaced.ok ? success(undefined) : failure('El proyecto local persistido no es estructuralmente válido.')
  }

  async #publishPersistedStructure(): Promise<Result<ProjectStructure, string>> {
    const loaded = await this.#projects.findById(EDITOR_PROJECT_ID)
    if (!loaded.ok) return failure(loaded.error.message)
    if (!loaded.value) return failure('El proyecto local desapareció después del comando.')
    const replaced = this.store.replaceStructure(loaded.value.project.payload)
    return replaced.ok ? success(replaced.value) : failure('El comando persistido no pudo publicarse en el renderer.')
  }

  #insertionPlacement(anchorNodeId: NodeId | null): NodePlacement {
    const document = this.store.structure.documents[this.documentId]
    if (!document) return { index: 0, parentId: null, slot: null }
    if (!anchorNodeId) return { index: document.rootNodeIds.length, parentId: null, slot: null }
    const anchor = document.nodes[anchorNodeId]
    if (!anchor) return { index: document.rootNodeIds.length, parentId: null, slot: null }
    const anchorDefinition = anchor.kind === 'widget' ? widgetRegistry.get(anchor.widgetType) : undefined
    if (anchor.kind === 'widget' && anchorDefinition?.category === 'structure' && !anchor.locked) {
      const slot = Object.keys(anchor.slots)[0] ?? 'content'
      return { index: anchor.slots[slot]?.length ?? 0, parentId: anchor.id, slot }
    }
    const rootIndex = document.rootNodeIds.indexOf(anchor.id)
    if (rootIndex >= 0) return { index: rootIndex + 1, parentId: null, slot: null }
    for (const parent of Object.values(document.nodes)) {
      for (const [slot, children] of Object.entries(parent.slots)) {
        const index = children.indexOf(anchor.id)
        if (index >= 0) return { index: index + 1, parentId: parent.id, slot }
      }
    }
    return { index: document.rootNodeIds.length, parentId: null, slot: null }
  }

  async #mutateWidgetProperty(nodeId: NodeId, key: string, value: JsonValue | undefined, reset: boolean): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const document = this.store.structure.documents[this.documentId]
    const node = document?.nodes[nodeId]
    if (!node || node.kind !== 'widget') return failure('El nodo seleccionado no es un widget editable.')
    if (node.locked) return failure('El nodo está bloqueado.')
    const definition = widgetRegistry.get(node.widgetType)
    if (!definition) return failure(`El widget ${node.widgetType} no está registrado.`)
    if (!definition.inspector.some((field) => field.key === key)) return failure(`La propiedad ${key} no está declarada en el inspector.`)
    const properties = structuredClone(node.properties)
    if (reset) delete properties[key]
    else if (value !== undefined) properties[key] = value
    const effective = { ...structuredClone(definition.defaults), ...properties }
    const validated = definition.propertySchema.safeParse(effective)
    if (!validated.success) {
      const issue = validated.error.issues.find((candidate) => candidate.path[0] === key) ?? validated.error.issues[0]
      return failure(issue?.message ?? `La propiedad ${key} no es válida.`)
    }
    return this.#execute(new ProjectStructureCommand(
      reset ? 'inspector.reset-property' : 'inspector.update-property', reset ? `Restablecer ${key}` : `Editar ${key}`,
      (structure) => setNodeProperties(structure, { documentId: this.documentId, kind: 'document' }, nodeId, properties),
    ))
  }

  async #mutateNodeVisualStyles(nodeId: NodeId, styles: Readonly<Record<string, JsonValue>>): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const document = this.store.structure.documents[this.documentId]
    const node = document?.nodes[nodeId]
    if (!node) return failure('El nodo seleccionado no existe.')
    if (node.locked) return failure('El nodo está bloqueado.')
    const merged = mergeEditableVisualStyles(node.styles, styles)
    const reset = Object.keys(editableVisualStyles(merged)).length === 0
    return this.#execute(new ProjectStructureCommand(
      reset ? 'inspector.reset-styles' : 'inspector.update-styles', reset ? 'Restablecer estilos visuales' : 'Editar estilos visuales',
      (structure) => setNodeStyles(structure, { documentId: this.documentId, kind: 'document' }, nodeId, merged),
    ))
  }

  async #mutateNodeDataSettings(nodeId: NodeId, settings: NodeDataSettings, reset: boolean): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const node = this.store.structure.documents[this.documentId]?.nodes[nodeId]
    if (!node) return failure('El nodo seleccionado no existe.')
    if (node.locked) return failure('El nodo está bloqueado.')
    if (node.kind === 'widget') {
      const definition = widgetRegistry.get(node.widgetType)
      const declaredKeys = new Set(definition?.inspector.map((field) => field.key) ?? [])
      const unknownBinding = Object.keys(settings.bindings).find((key) => !declaredKeys.has(key))
      if (unknownBinding) return failure(`El binding ${unknownBinding} no corresponde a una propiedad declarada del widget.`)
      if (definition) {
        const prospectiveNode = { ...node, accessibility: settings.accessibility, bindings: settings.bindings, conditions: settings.conditions }
        const resolved = resolveNodeDataState(this.store.structure, prospectiveNode, node.properties)
        if (resolved.diagnostics.length === 0) {
          const properties = definition.propertySchema.safeParse({ ...definition.defaults, ...resolved.properties })
          if (!properties.success) return failure(properties.error.issues[0]?.message ?? 'Los bindings no producen propiedades válidas.')
        }
      }
    }
    return this.#execute(new ProjectStructureCommand(
      reset ? 'inspector.reset-data-settings' : 'inspector.update-data-settings', reset ? 'Restablecer datos y accesibilidad' : 'Editar datos y accesibilidad',
      (structure) => setNodeDataSettings(structure, { documentId: this.documentId, kind: 'document' }, nodeId, settings),
    ))
  }

  async #execute(command: ProjectStructureCommand): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const executed = await this.#bus.execute(command, EDITOR_PROJECT_ID)
    if (!executed.ok) return failure(commandErrorMessage(executed.error))
    await this.#appendAuditEntry(executed.value.entryId, 'execute')
    return this.#publishPersistedStructure()
  }

  async #appendAuditEntry(historyEntryId: string, action: AuditLogEntry['action']): Promise<void> {
    const history = await this.#histories.findById(EDITOR_PROJECT_ID)
    if (!history.ok || !history.value) return
    const source = history.value.entries.find((entry) => entry.id === historyEntryId)
    if (!source) return
    const before = action === 'undo' ? source.after.project.payload : source.before.project.payload
    const after = action === 'undo' ? source.before.project.payload : source.after.project.payload
    const entry = createAuditLogEntry({
      action,
      actor: this.#auditActor,
      after,
      before,
      commandIds: source.commandIds,
      createdAt: now(),
      id: parseAuditLogEntryId(crypto.randomUUID()),
      label: action === 'undo' ? `Deshacer: ${source.label}` : action === 'redo' ? `Rehacer: ${source.label}` : source.label,
      projectId: EDITOR_PROJECT_ID,
    })
    await this.#auditLog.save(entry)
  }
}

export function createBrowserEditorProjectSession(databaseName = EDITOR_DATABASE_NAME): EditorProjectSession {
  return new BrowserEditorProjectSession(databaseName)
}
