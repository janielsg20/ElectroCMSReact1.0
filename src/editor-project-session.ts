import {
  addDocument,
  applyThemePackage as applyThemePackageToStructure,
  createBreakpoint,
  createCompleteWidgetRegistry,
  editableVisualStyles,
  failure,
  insertNode,
  mergeEditableVisualStyles,
  moveNodes,
  parseBreakpointId,
  parseDocumentId,
  parseGlobalComponentId,
  parseNodeId,
  parseProjectHistoryEntryId,
  parseProjectId,
  parseTimestamp,
  ProjectStructureSchema,
  reorderBreakpoint,
  resetNodeBreakpointOverride,
  resetProjectTheme,
  resizeNode,
  resolveNodeDataState,
  setNodeDataSettings,
  setNodeProperties,
  setNodeStyles,
  setProjectTheme,
  success,
  updateBreakpoint,
  updateDocumentConditions,
  updateNodeSpacing,
  type BreakpointId,
  type BreakpointInput,
  type BreakpointPatch,
  type ContentType,
  type ContentTypeId,
  type Document,
  type DocumentId,
  type FieldDefinition,
  type FieldDefinitionId,
  type JsonValue,
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
  type Result,
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
  readonly documentId = STARTER_DOCUMENT_ID
  readonly initialSelectedNodeId = STARTER_SELECTED_NODE_ID
  readonly store = new ProjectStructureRenderStore(STARTER_PROJECT_STRUCTURE)
  readonly #database: ElectroCmsLocalDatabase
  readonly #projects: ReturnType<typeof createProjectRecordRepository<ProjectStructure>>
  readonly #histories: ReturnType<typeof createProjectHistoryRepository<ProjectStructure>>
  readonly #themePackages: ReturnType<typeof createThemePackageRepository>
  readonly #bus: ProjectCommandBus<ProjectStructure>
  readonly #ready: Promise<Result<void, string>>

  constructor(databaseName = EDITOR_DATABASE_NAME) {
    this.#database = new ElectroCmsLocalDatabase(databaseName)
    this.#projects = createProjectRecordRepository(this.#database, ProjectStructureSchema)
    this.#histories = createProjectHistoryRepository(this.#database, ProjectStructureSchema)
    this.#themePackages = createThemePackageRepository(this.#database)
    this.#bus = new ProjectCommandBus(this.#projects, this.#histories, ProjectStructureSchema, {
      createHistoryEntryId: () => parseProjectHistoryEntryId(crypto.randomUUID()),
      now,
    })
    this.#ready = this.#initialize()
  }

  async applyThemePackage(
    themePackage: ThemePackage,
    selection: ThemePackagePartSelection,
    routeConflict: ThemePackageRouteConflictPolicy,
  ): Promise<Result<ThemePackageImportReport, string>> {
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
        if (!imported.ok) {
          return failure({
            code: 'invalid-tree' as const,
            message: imported.error[0]?.message ?? 'El paquete no se puede aplicar al proyecto actual.',
          })
        }
        report = imported.value.report
        return success(imported.value.structure)
      },
    ))
    if (!applied.ok) return failure(applied.error)
    return report ? success(report) : failure('El paquete se aplicó sin producir un informe de cambios.')
  }

  async createBreakpoint(input: BreakpointInput, index?: number): Promise<Result<BreakpointCreationResult, string>> {
    const breakpointId = parseBreakpointId(crypto.randomUUID())
    const created = await this.#execute(new ProjectStructureCommand(
      'responsive.create-breakpoint',
      `Crear breakpoint ${input.name}`,
      (structure) => createBreakpoint(structure, breakpointId, input, index),
    ))
    return created.ok ? success({ breakpointId, structure: created.value }) : created
  }

  async createContentType(contentType: ContentType): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.create-content-type',
      `Crear tipo ${contentType.pluralName}`,
      (structure) => {
        const created = createContentTypeInStructure(structure, contentType)
        return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El tipo de contenido no es válido.' })
      },
    ))
  }

  async createCustomField(field: FieldDefinition): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.create-custom-field',
      `Crear campo ${field.label}`,
      (structure) => {
        const created = createCustomFieldInStructure(structure, field)
        return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El campo personalizado no es válido.' })
      },
    ))
  }

  async createDocument(document: Document): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'template.create-document',
      `Crear ${document.kind}: ${document.name}`,
      (structure) => {
        const created = addDocument(structure, document)
        return created.ok ? created : failure({ code: 'invalid-tree' as const, message: created.error.message })
      },
    ))
  }

  async createTaxonomy(taxonomy: Taxonomy): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.create-taxonomy',
      `Crear taxonomía ${taxonomy.pluralName}`,
      (structure) => {
        const created = createTaxonomyInStructure(structure, taxonomy)
        return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'La taxonomía no es válida.' })
      },
    ))
  }

  async createTaxonomyTerm(term: TaxonomyTerm): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.create-taxonomy-term',
      `Crear término ${term.name}`,
      (structure) => {
        const created = createTaxonomyTermInStructure(structure, term)
        return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El término no es válido.' })
      },
    ))
  }

  async deleteContentType(contentTypeId: ContentTypeId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.delete-content-type',
      'Eliminar tipo de contenido',
      (structure) => {
        const deleted = deleteContentTypeInStructure(structure, contentTypeId)
        return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El tipo de contenido no se puede eliminar.' })
      },
    ))
  }

  async deleteCustomField(fieldId: FieldDefinitionId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.delete-custom-field',
      'Eliminar campo personalizado',
      (structure) => {
        const deleted = deleteCustomFieldInStructure(structure, fieldId)
        return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El campo personalizado no se puede eliminar.' })
      },
    ))
  }

  async deleteTaxonomy(taxonomyId: TaxonomyId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.delete-taxonomy',
      'Eliminar taxonomía',
      (structure) => {
        const deleted = deleteTaxonomyInStructure(structure, taxonomyId)
        return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'La taxonomía no se puede eliminar.' })
      },
    ))
  }

  async deleteTaxonomyTerm(termId: TaxonomyTermId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.delete-taxonomy-term',
      'Eliminar término de taxonomía',
      (structure) => {
        const deleted = deleteTaxonomyTermInStructure(structure, termId)
        return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El término no se puede eliminar.' })
      },
    ))
  }

  async insertWidget(
    widgetType: string,
    anchorNodeId?: NodeId | null,
    template: WidgetInsertionTemplate = {},
  ): Promise<Result<WidgetInsertionResult, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const definition = widgetRegistry.get(widgetType)
    if (!definition) return failure(`El widget ${widgetType} no está registrado.`)
    const properties = {
      ...structuredClone(definition.defaults),
      ...structuredClone(template.properties ?? {}),
    }
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
      'tree.insert-widget',
      `Insertar ${definition.label}`,
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
    return this.#execute(new ProjectStructureCommand(
      'tree.move', nodeIds.length === 1 ? 'Mover capa' : 'Mover capas',
      (structure) => moveNodes(structure, { documentId: this.documentId, kind: 'document' }, nodeIds, placement),
    ))
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

  async resetNodeBreakpointOverride(nodeId: NodeId, breakpointId: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'responsive.reset-node-override', 'Restablecer override responsive',
      (structure) => resetNodeBreakpointOverride(structure, { documentId: this.documentId, kind: 'document' }, nodeId, breakpointId),
    ))
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
    return this.#execute(new ProjectStructureCommand(
      `theme.reset-${scope}`, `Restablecer tema de ${scope === 'frontend' ? 'frontend' : 'backend'}`,
      (structure) => {
        const reset = resetProjectTheme(structure, scope)
        return reset.ok ? reset : failure({ code: 'invalid-theme' as const, message: reset.error[0]?.message ?? 'El tema no es válido.' })
      },
    ))
  }

  async resizeNode(nodeId: NodeId, size: NodeSize, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'canvas.resize', 'Redimensionar nodo',
      (structure) => resizeNode(structure, { breakpointId, nodeId, owner: { documentId: this.documentId, kind: 'document' } }, size),
    ))
  }

  async saveThemePackage(themePackage: ThemePackage): Promise<Result<void, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const saved = await this.#themePackages.save(themePackage)
    return saved.ok ? success(undefined) : failure(saved.error.message)
  }

  async updateContentType(contentTypeId: ContentTypeId, patch: ContentTypeEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.update-content-type', 'Editar tipo de contenido',
      (structure) => {
        const updated = updateContentTypeInStructure(structure, contentTypeId, patch)
        return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El tipo de contenido no es válido.' })
      },
    ))
  }

  async updateCustomField(fieldId: FieldDefinitionId, patch: FieldDefinitionEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.update-custom-field', 'Editar campo personalizado',
      (structure) => {
        const updated = updateCustomFieldInStructure(structure, fieldId, patch)
        return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El campo personalizado no es válido.' })
      },
    ))
  }

  async updateTaxonomy(taxonomyId: TaxonomyId, patch: TaxonomyEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.update-taxonomy', 'Editar taxonomía',
      (structure) => {
        const updated = updateTaxonomyInStructure(structure, taxonomyId, patch)
        return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'La taxonomía no es válida.' })
      },
    ))
  }

  async updateTaxonomyTerm(termId: TaxonomyTermId, patch: TaxonomyTermEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'cms.update-taxonomy-term', 'Editar término de taxonomía',
      (structure) => {
        const updated = updateTaxonomyTermInStructure(structure, termId, patch)
        return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El término no es válido.' })
      },
    ))
  }

  async updateWidgetProperty(nodeId: NodeId, key: string, value: JsonValue): Promise<Result<ProjectStructure, string>> {
    return this.#mutateWidgetProperty(nodeId, key, value, false)
  }

  async updateNodeVisualStyles(nodeId: NodeId, styles: Readonly<Record<string, JsonValue>>): Promise<Result<ProjectStructure, string>> {
    return this.#mutateNodeVisualStyles(nodeId, styles)
  }

  async updateNodeSpacing(nodeId: NodeId, spacing: NodeSpacing, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'canvas.spacing', 'Editar espaciado',
      (structure) => updateNodeSpacing(structure, { breakpointId, nodeId, owner: { documentId: this.documentId, kind: 'document' } }, spacing),
    ))
  }

  async updateNodeDataSettings(nodeId: NodeId, settings: NodeDataSettings): Promise<Result<ProjectStructure, string>> {
    return this.#mutateNodeDataSettings(nodeId, settings, false)
  }

  async updateProjectTheme(scope: ProjectThemeScope, theme: ProjectTheme): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      `theme.update-${scope}`, `Editar tema de ${scope === 'frontend' ? 'frontend' : 'backend'}`,
      (structure) => {
        const updated = setProjectTheme(structure, scope, theme)
        return updated.ok ? updated : failure({ code: 'invalid-theme' as const, message: updated.error[0]?.message ?? 'El tema no es válido.' })
      },
    ))
  }

  async updateBreakpoint(breakpointId: BreakpointId, patch: BreakpointPatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('responsive.update-breakpoint', 'Editar breakpoint', (structure) => updateBreakpoint(structure, breakpointId, patch)))
  }

  async updateDocumentConditions(documentId: DocumentId, conditions: readonly TemplateCondition[]): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'template.update-conditions', 'Editar condiciones de plantilla',
      (structure) => {
        const updated = updateDocumentConditions(structure, documentId, conditions)
        return updated.ok ? updated : failure({ code: 'invalid-tree' as const, message: updated.error.message })
      },
    ))
  }

  async undo(): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const undone = await this.#bus.undo(EDITOR_PROJECT_ID)
    if (!undone.ok) return failure(commandErrorMessage(undone.error))
    return this.#publishPersistedStructure()
  }

  async redo(): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const redone = await this.#bus.redo(EDITOR_PROJECT_ID)
    if (!redone.ok) return failure(commandErrorMessage(redone.error))
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
    return this.#publishPersistedStructure()
  }
}

export function createBrowserEditorProjectSession(databaseName = EDITOR_DATABASE_NAME): EditorProjectSession {
  return new BrowserEditorProjectSession(databaseName)
}
