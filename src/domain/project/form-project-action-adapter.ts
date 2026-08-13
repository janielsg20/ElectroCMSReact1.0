import { projectCmsBackend } from './cms-defaults'
import type { ContentRecord, Form } from './cms-schema'
import type {
  ContentRecordId,
  ContentRecordRevisionId,
  RelationEntryId,
  Timestamp,
} from './identity'
import type {
  FormActionHandler,
  FormActionHandlerResult,
  FormActionHandlers,
  FormMappedValues,
} from './form-action-engine'
import {
  createContentRecord,
  createRelationEntry,
  updateContentRecord,
  type RecordRelationDiagnostic,
} from './record-relation-engine'
import type { ProjectStructure } from './structure-schema'

type FormAction = Form['actions'][number]

export interface ProjectFormActionIdentity {
  readonly now: () => Timestamp
  readonly recordId: () => ContentRecordId
  readonly relationEntryId: () => RelationEntryId
  readonly revisionId: () => ContentRecordRevisionId
}

export interface ProjectFormActionOptions {
  readonly currentRecordId?: ContentRecordId | null
  readonly identity: ProjectFormActionIdentity
  readonly structure: ProjectStructure
}

export interface ProjectFormActionAdapter {
  readonly handlers: FormActionHandlers
  getCurrentRecordId(): ContentRecordId | null
  getStructure(): ProjectStructure
}

function configString(action: FormAction, key: string): string | null {
  const value = action.config[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function diagnosticMessage(diagnostics: readonly RecordRelationDiagnostic[]): string {
  return diagnostics.map((item) => item.message).join(' ') || 'La operación de contenido no pudo completarse.'
}

function mappedForContentType(
  structure: ProjectStructure,
  contentTypeId: string,
  mappedValues: FormMappedValues,
): ContentRecord['values'] {
  const cms = projectCmsBackend(structure.cms)
  const contentType = Object.values(cms.contentTypes).find((candidate) => candidate.id === contentTypeId)
  const fieldIds = new Set<string>(contentType?.fieldIds ?? [])
  return Object.fromEntries(Object.entries(mappedValues).filter(([fieldId]) => fieldIds.has(fieldId)))
}

export function createProjectFormActionAdapter(options: ProjectFormActionOptions): ProjectFormActionAdapter {
  let structure = structuredClone(options.structure)
  let currentRecordId = options.currentRecordId ?? null
  let lastRecordId: ContentRecordId | null = null

  function createRecord(contentTypeId: string, mappedValues: FormMappedValues): FormActionHandlerResult {
    const cms = projectCmsBackend(structure.cms)
    const contentType = Object.values(cms.contentTypes).find((candidate) => candidate.id === contentTypeId)
    if (!contentType) return { ok: false, message: 'El tipo de contenido elegido ya no existe.' }
    const now = options.identity.now()
    const id = options.identity.recordId()
    const record: ContentRecord = {
      authorId: null,
      contentTypeId: contentType.id,
      createdAt: now,
      id,
      status: 'draft',
      taxonomyTermIds: [],
      updatedAt: now,
      values: mappedForContentType(structure, contentType.id, mappedValues),
    }
    const result = createContentRecord(structure, record)
    if (!result.ok) return { ok: false, message: diagnosticMessage(result.error) }
    structure = result.value
    currentRecordId = id
    lastRecordId = id
    return { ok: true, output: id }
  }

  function updateRecord(recordId: ContentRecordId, mappedValues: FormMappedValues): FormActionHandlerResult {
    const cms = projectCmsBackend(structure.cms)
    const record = cms.records[recordId]
    if (!record) return { ok: false, message: 'El contenido que debía actualizarse ya no existe.' }
    const result = updateContentRecord(
      structure,
      recordId,
      { values: { ...record.values, ...mappedForContentType(structure, record.contentTypeId, mappedValues) } },
      { now: options.identity.now(), revisionId: options.identity.revisionId() },
    )
    if (!result.ok) return { ok: false, message: diagnosticMessage(result.error) }
    structure = result.value
    currentRecordId = recordId
    lastRecordId = recordId
    return { ok: true, output: recordId }
  }

  const saveRecord: FormActionHandler = (_action, context) => {
    if (currentRecordId) return updateRecord(currentRecordId, context.mappedValues)
    if (!context.form.contentTypeId) return { ok: false, message: 'El formulario necesita un tipo de contenido para guardar un registro.' }
    return createRecord(context.form.contentTypeId, context.mappedValues)
  }

  const createContent: FormActionHandler = (action, context) => {
    const contentTypeId = configString(action, 'contentTypeId') ?? context.form.contentTypeId
    if (!contentTypeId) return { ok: false, message: 'Elige el tipo de contenido que se creará.' }
    return createRecord(contentTypeId, context.mappedValues)
  }

  const updateContent: FormActionHandler = (_action, context) => {
    if (!currentRecordId) return { ok: false, message: 'Esta acción necesita un contenido actual para actualizar.' }
    return updateRecord(currentRecordId, context.mappedValues)
  }

  const updateRelation: FormActionHandler = (action, context) => {
    const relationId = configString(action, 'relationId')
    const controlId = configString(action, 'relatedRecordControl')
    if (!relationId || !controlId) return { ok: false, message: 'Elige una relación y el campo que contiene el contenido relacionado.' }

    const cms = projectCmsBackend(structure.cms)
    const relation = Object.values(cms.relations).find((candidate) => candidate.id === relationId)
    if (!relation) return { ok: false, message: 'La relación elegida ya no existe.' }
    const baseRecordId = lastRecordId ?? currentRecordId
    const baseRecord = baseRecordId ? cms.records[baseRecordId] : undefined
    if (!baseRecord) return { ok: false, message: 'No hay un registro procesado para conectar con la relación.' }

    const raw = context.values[controlId]
    const relatedIds = (Array.isArray(raw) ? raw : [raw]).filter((value): value is string => typeof value === 'string' && value.length > 0)
    if (relatedIds.length === 0) return { ok: false, message: 'El campo relacionado no contiene ningún registro.' }

    let connected = 0
    for (const relatedId of relatedIds) {
      const currentCms = projectCmsBackend(structure.cms)
      const relatedRecord = Object.values(currentCms.records).find((candidate) => candidate.id === relatedId)
      if (!relatedRecord) return { ok: false, message: 'Uno de los registros relacionados ya no existe.' }

      let sourceRecordId: ContentRecordId
      let targetRecordId: ContentRecordId
      if (baseRecord.contentTypeId === relation.sourceContentTypeId && relatedRecord.contentTypeId === relation.targetContentTypeId) {
        sourceRecordId = baseRecord.id
        targetRecordId = relatedRecord.id
      } else if (baseRecord.contentTypeId === relation.targetContentTypeId && relatedRecord.contentTypeId === relation.sourceContentTypeId) {
        sourceRecordId = relatedRecord.id
        targetRecordId = baseRecord.id
      } else {
        return { ok: false, message: 'Los registros elegidos no corresponden a los extremos de esta relación.' }
      }

      const result = createRelationEntry(structure, {
        id: options.identity.relationEntryId(),
        relationId: relation.id,
        sourceRecordId,
        targetRecordId,
      })
      if (!result.ok) return { ok: false, message: diagnosticMessage(result.error) }
      structure = result.value
      connected += 1
    }
    return { ok: true, output: connected }
  }

  return {
    handlers: {
      'save-record': saveRecord,
      'create-content': createContent,
      'update-content': updateContent,
      'update-relation': updateRelation,
    },
    getCurrentRecordId: () => currentRecordId,
    getStructure: () => structuredClone(structure),
  }
}
