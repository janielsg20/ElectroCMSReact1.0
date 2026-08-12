import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import {
  ContentRecordRevisionSchema,
  ContentRecordSchema,
  RelationEntrySchema,
  RelationSchema,
  type CmsBackend,
  type ContentRecord,
  type ContentRecordRevision,
  type FieldDefinition,
  type Relation,
  type RelationEntry,
} from './cms-schema'
import type {
  ContentRecordId,
  ContentRecordRevisionId,
  RelationEntryId,
  RelationId,
  Timestamp,
} from './identity'
import type { JsonValue } from './project-envelope'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type RecordRelationDiagnosticCode =
  | 'record-not-found'
  | 'record-id-conflict'
  | 'record-in-use'
  | 'invalid-record'
  | 'invalid-field-value'
  | 'missing-required-field'
  | 'invalid-taxonomy-term'
  | 'invalid-author'
  | 'revision-not-found'
  | 'revision-id-conflict'
  | 'invalid-revision'
  | 'relation-not-found'
  | 'relation-id-conflict'
  | 'relation-slug-conflict'
  | 'relation-in-use'
  | 'invalid-relation'
  | 'relation-entry-not-found'
  | 'relation-entry-id-conflict'
  | 'invalid-relation-entry'
  | 'invalid-cms'
  | 'invalid-project'

export interface RecordRelationDiagnostic {
  readonly code: RecordRelationDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type ContentRecordEditablePatch = Partial<Pick<ContentRecord,
  | 'status'
  | 'authorId'
  | 'values'
  | 'taxonomyTermIds'
>>

export type RelationEditablePatch = Partial<Pick<Relation,
  | 'name'
  | 'slug'
  | 'cardinality'
  | 'sourceContentTypeId'
  | 'targetContentTypeId'
>>

export type RelationEntryEditablePatch = Partial<Pick<RelationEntry,
  | 'sourceRecordId'
  | 'targetRecordId'
>>

export interface RecordUpdateOptions {
  readonly now: Timestamp
  readonly revisionId?: ContentRecordRevisionId
}

function diagnostic(
  code: RecordRelationDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): RecordRelationDiagnostic {
  return { code, message, path }
}

function jsonKey(value: JsonValue): string {
  return JSON.stringify(value)
}

function optionContains(field: FieldDefinition, value: JsonValue): boolean {
  const key = jsonKey(value)
  return field.options.some((option) => jsonKey(option.value) === key)
}

function requiredValuePresent(value: JsonValue | undefined): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function matchesPattern(value: string, pattern: string): boolean {
  try {
    return new RegExp(pattern).test(value)
  } catch {
    return false
  }
}

function userExists(cms: CmsBackend, value: string): boolean {
  return Object.values(cms.users).some((user) => user.id === value)
}

function recordExists(cms: CmsBackend, value: string): boolean {
  return Object.values(cms.records).some((record) => record.id === value)
}

function validateStringConstraints(
  field: FieldDefinition,
  value: string,
): readonly RecordRelationDiagnostic[] {
  const path = ['cms', 'records', 'values', field.id] as const
  const diagnostics: RecordRelationDiagnostic[] = []
  if (field.validation.minLength !== null && value.length < field.validation.minLength) {
    diagnostics.push(diagnostic('invalid-field-value', `${field.label} requiere al menos ${field.validation.minLength} caracteres.`, path))
  }
  if (field.validation.maxLength !== null && value.length > field.validation.maxLength) {
    diagnostics.push(diagnostic('invalid-field-value', `${field.label} admite como máximo ${field.validation.maxLength} caracteres.`, path))
  }
  if (field.validation.pattern && !matchesPattern(value, field.validation.pattern)) {
    diagnostics.push(diagnostic('invalid-field-value', `${field.label} no cumple el patrón configurado.`, path))
  }
  return diagnostics
}

function validateNumberConstraints(
  field: FieldDefinition,
  value: number,
): readonly RecordRelationDiagnostic[] {
  const path = ['cms', 'records', 'values', field.id] as const
  const diagnostics: RecordRelationDiagnostic[] = []
  if (field.validation.min !== null && value < field.validation.min) {
    diagnostics.push(diagnostic('invalid-field-value', `${field.label} debe ser mayor o igual que ${field.validation.min}.`, path))
  }
  if (field.validation.max !== null && value > field.validation.max) {
    diagnostics.push(diagnostic('invalid-field-value', `${field.label} debe ser menor o igual que ${field.validation.max}.`, path))
  }
  return diagnostics
}

function taxonomyValueValid(cms: CmsBackend, field: FieldDefinition, value: JsonValue): boolean {
  if (!field.taxonomyId) return false
  const values = Array.isArray(value) ? value : [value]
  return values.every((item) => {
    if (typeof item !== 'string') return false
    const term = Object.values(cms.taxonomyTerms).find((candidate) => candidate.id === item)
    return term?.taxonomyId === field.taxonomyId
  })
}

function relationValueValid(cms: CmsBackend, field: FieldDefinition, value: JsonValue): boolean {
  if (!field.relationId) return false
  const relation = cms.relations[field.relationId]
  if (!relation || field.owner.kind !== 'content-type') return false
  const values = Array.isArray(value) ? value : [value]
  return values.every((item) => typeof item === 'string' && recordExists(cms, item))
}

function validateFieldValue(
  cms: CmsBackend,
  field: FieldDefinition,
  value: JsonValue,
): readonly RecordRelationDiagnostic[] {
  const path = ['cms', 'records', 'values', field.id] as const
  if (value === null) return []

  if (field.type === 'number' || field.type === 'currency') {
    return typeof value === 'number'
      ? validateNumberConstraints(field, value)
      : [diagnostic('invalid-field-value', `${field.label} requiere un número.`, path)]
  }
  if (field.type === 'switch') {
    return typeof value === 'boolean' ? [] : [diagnostic('invalid-field-value', `${field.label} requiere true/false.`, path)]
  }
  if (field.type === 'select' || field.type === 'radio') {
    return optionContains(field, value) ? [] : [diagnostic('invalid-field-value', `${field.label} debe usar una opción existente.`, path)]
  }
  if (field.type === 'checkbox') {
    if (typeof value === 'boolean') return []
    return Array.isArray(value) && value.every((item) => optionContains(field, item))
      ? []
      : [diagnostic('invalid-field-value', `${field.label} debe usar opciones existentes.`, path)]
  }

  const stringTypes = new Set<FieldDefinition['type']>([
    'text', 'textarea', 'rich-text', 'email', 'phone', 'url', 'date', 'time', 'datetime', 'color', 'image', 'file',
  ])
  if (stringTypes.has(field.type)) {
    if (typeof value !== 'string') return [diagnostic('invalid-field-value', `${field.label} requiere texto.`, path)]
    const diagnostics = [...validateStringConstraints(field, value)]
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) diagnostics.push(diagnostic('invalid-field-value', `${field.label} no es un email válido.`, path))
    if (field.type === 'url' && value) {
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
      } catch {
        diagnostics.push(diagnostic('invalid-field-value', `${field.label} debe usar una URL http/https.`, path))
      }
    }
    if (field.type === 'color' && value && !/^#[0-9a-f]{6}$/i.test(value)) diagnostics.push(diagnostic('invalid-field-value', `${field.label} debe usar #RRGGBB.`, path))
    if (field.type === 'date' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) diagnostics.push(diagnostic('invalid-field-value', `${field.label} debe usar YYYY-MM-DD.`, path))
    if (field.type === 'time' && value && !/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) diagnostics.push(diagnostic('invalid-field-value', `${field.label} debe usar HH:MM o HH:MM:SS.`, path))
    if (field.type === 'datetime' && value && Number.isNaN(Date.parse(value))) diagnostics.push(diagnostic('invalid-field-value', `${field.label} contiene una fecha/hora inválida.`, path))
    return diagnostics
  }

  if (field.type === 'gallery') {
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
      ? []
      : [diagnostic('invalid-field-value', `${field.label} requiere una lista de medios.`, path)]
  }
  if (field.type === 'map' || field.type === 'group') {
    return !Array.isArray(value) && typeof value === 'object'
      ? []
      : [diagnostic('invalid-field-value', `${field.label} requiere un objeto JSON.`, path)]
  }
  if (field.type === 'repeater') {
    return Array.isArray(value) ? [] : [diagnostic('invalid-field-value', `${field.label} requiere una lista JSON.`, path)]
  }
  if (field.type === 'user') {
    return typeof value === 'string' && userExists(cms, value)
      ? []
      : [diagnostic('invalid-field-value', `${field.label} debe referenciar un usuario existente.`, path)]
  }
  if (field.type === 'taxonomy') {
    return taxonomyValueValid(cms, field, value)
      ? []
      : [diagnostic('invalid-field-value', `${field.label} debe referenciar términos de la taxonomía configurada.`, path)]
  }
  if (field.type === 'relation') {
    return relationValueValid(cms, field, value)
      ? []
      : [diagnostic('invalid-field-value', `${field.label} debe referenciar registros existentes de su relación.`, path)]
  }

  // calculated y conditional aceptan JSON canónico; su evaluación/visibilidad pertenece al runtime de datos/bindings.
  return []
}

function validateRecordValues(cms: CmsBackend, record: ContentRecord): readonly RecordRelationDiagnostic[] {
  const contentType = cms.contentTypes[record.contentTypeId]
  if (!contentType) return [diagnostic('invalid-record', 'El tipo de contenido del registro no existe.', ['cms', 'records', record.id, 'contentTypeId'])]
  const diagnostics: RecordRelationDiagnostic[] = []
  const fieldIds = new Set(contentType.fieldIds)

  for (const [fieldId, value] of Object.entries(record.values)) {
    const field = cms.fields[fieldId as keyof typeof cms.fields]
    if (!field || !fieldIds.has(field.id)) {
      diagnostics.push(diagnostic('invalid-field-value', `El campo ${fieldId} no pertenece al CPT.`, ['cms', 'records', record.id, 'values', fieldId]))
      continue
    }
    diagnostics.push(...validateFieldValue(cms, field, value))
  }

  if (record.status !== 'draft') {
    for (const fieldId of contentType.fieldIds) {
      const field = cms.fields[fieldId]
      if (field?.required && !requiredValuePresent(record.values[fieldId])) {
        diagnostics.push(diagnostic('missing-required-field', `Falta el campo obligatorio ${field.label}.`, ['cms', 'records', record.id, 'values', fieldId]))
      }
    }
  }
  return diagnostics
}

function validateRecordReferences(cms: CmsBackend, record: ContentRecord): readonly RecordRelationDiagnostic[] {
  const diagnostics: RecordRelationDiagnostic[] = []
  const contentType = cms.contentTypes[record.contentTypeId]
  if (!contentType) return diagnostics

  if (record.authorId && !cms.users[record.authorId]) diagnostics.push(diagnostic('invalid-author', 'El autor no existe.', ['cms', 'records', record.id, 'authorId']))
  const seenTerms = new Set<string>()
  for (const termId of record.taxonomyTermIds) {
    if (seenTerms.has(termId)) {
      diagnostics.push(diagnostic('invalid-taxonomy-term', 'Un término no puede repetirse en el mismo registro.', ['cms', 'records', record.id, 'taxonomyTermIds']))
      continue
    }
    seenTerms.add(termId)
    const term = cms.taxonomyTerms[termId]
    if (!term || !contentType.taxonomyIds.includes(term.taxonomyId)) {
      diagnostics.push(diagnostic('invalid-taxonomy-term', `El término ${termId} no pertenece a una taxonomía asociada al CPT.`, ['cms', 'records', record.id, 'taxonomyTermIds']))
    }
  }
  return diagnostics
}

function validateRecord(cms: CmsBackend, record: ContentRecord): readonly RecordRelationDiagnostic[] {
  return [...validateRecordReferences(cms, record), ...validateRecordValues(cms, record)]
}

function validateCandidate(structure: ProjectStructure, cms: CmsBackend): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) return failure(cmsValidation.error.map((issue) => diagnostic('invalid-cms', issue.message, ['cms', ...issue.path])))
  const candidate: ProjectStructure = { ...structuredClone(structure), cms: cmsValidation.value }
  const validated = validateProjectStructure(candidate)
  return validated.ok
    ? success(validated.value)
    : failure(validated.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}

function revisionFor(
  record: ContentRecord,
  revisionId: ContentRecordRevisionId,
  createdAt: Timestamp,
): ContentRecordRevision {
  return { id: revisionId, recordId: record.id, createdAt, snapshot: structuredClone(record) }
}

function addRevision(
  cms: CmsBackend,
  record: ContentRecord,
  revisionId: ContentRecordRevisionId | undefined,
  createdAt: Timestamp,
): Result<void, readonly RecordRelationDiagnostic[]> {
  const contentType = cms.contentTypes[record.contentTypeId]
  if (!contentType?.supports.includes('revisions')) return success(undefined)
  if (!revisionId) return failure([diagnostic('invalid-revision', 'Este CPT tiene revisiones activas y requiere un ID de revisión.', ['cms', 'recordRevisions'])])
  if (cms.recordRevisions[revisionId]) return failure([diagnostic('revision-id-conflict', 'Ya existe una revisión con ese ID.', ['cms', 'recordRevisions', revisionId])])
  const parsed = ContentRecordRevisionSchema.safeParse(revisionFor(record, revisionId, createdAt))
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-revision', issue.message, ['cms', 'recordRevisions', revisionId, ...issue.path.map(String)])))
  cms.recordRevisions[revisionId] = parsed.data
  return success(undefined)
}

export function listContentRecords(structure: ProjectStructure, contentTypeId?: string): readonly ContentRecord[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.records)
    .filter((record) => !contentTypeId || record.contentTypeId === contentTypeId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id))
}

export function createContentRecord(
  structure: ProjectStructure,
  input: ContentRecord,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const parsed = ContentRecordSchema.safeParse(input)
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-record', issue.message, ['cms', 'records', input.id, ...issue.path.map(String)])))
  const record: ContentRecord = { ...structuredClone(parsed.data), taxonomyTermIds: [...new Set(parsed.data.taxonomyTermIds)] }
  const cms = projectCmsBackend(structure.cms)
  if (cms.records[record.id]) return failure([diagnostic('record-id-conflict', 'Ya existe un registro con ese ID.', ['cms', 'records', record.id])])
  const diagnostics = validateRecord(cms, record)
  if (diagnostics.length > 0) return failure(diagnostics)
  cms.records[record.id] = record
  return validateCandidate(structure, cms)
}

export function updateContentRecord(
  structure: ProjectStructure,
  recordId: ContentRecordId,
  patch: ContentRecordEditablePatch,
  options: RecordUpdateOptions,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.records[recordId]
  if (!current) return failure([diagnostic('record-not-found', 'El registro ya no existe.', ['cms', 'records', recordId])])
  const parsed = ContentRecordSchema.safeParse({
    ...current,
    ...structuredClone(patch),
    id: recordId,
    contentTypeId: current.contentTypeId,
    createdAt: current.createdAt,
    updatedAt: options.now,
    taxonomyTermIds: patch.taxonomyTermIds ? [...new Set(patch.taxonomyTermIds)] : current.taxonomyTermIds,
  })
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-record', issue.message, ['cms', 'records', recordId, ...issue.path.map(String)])))
  const diagnostics = validateRecord(cms, parsed.data)
  if (diagnostics.length > 0) return failure(diagnostics)
  const revision = addRevision(cms, current, options.revisionId, options.now)
  if (!revision.ok) return revision
  cms.records[recordId] = parsed.data
  return validateCandidate(structure, cms)
}

export function listContentRecordRevisions(structure: ProjectStructure, recordId: ContentRecordId): readonly ContentRecordRevision[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.recordRevisions)
    .filter((revision) => revision.recordId === recordId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id))
}

export function restoreContentRecordRevision(
  structure: ProjectStructure,
  revisionId: ContentRecordRevisionId,
  options: RecordUpdateOptions,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const revision = cms.recordRevisions[revisionId]
  if (!revision) return failure([diagnostic('revision-not-found', 'La revisión ya no existe.', ['cms', 'recordRevisions', revisionId])])
  const current = cms.records[revision.recordId]
  if (!current) return failure([diagnostic('record-not-found', 'El registro de la revisión ya no existe.', ['cms', 'records', revision.recordId])])
  const restored: ContentRecord = {
    ...structuredClone(revision.snapshot),
    id: current.id,
    contentTypeId: current.contentTypeId,
    createdAt: current.createdAt,
    updatedAt: options.now,
  }
  const diagnostics = validateRecord(cms, restored)
  if (diagnostics.length > 0) return failure(diagnostics)
  const backup = addRevision(cms, current, options.revisionId, options.now)
  if (!backup.ok) return backup
  cms.records[current.id] = restored
  return validateCandidate(structure, cms)
}

export function deleteContentRecord(
  structure: ProjectStructure,
  recordId: ContentRecordId,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.records[recordId]
  if (!current) return failure([diagnostic('record-not-found', 'El registro ya no existe.', ['cms', 'records', recordId])])
  if (Object.values(cms.relationEntries).some((entry) => entry.sourceRecordId === recordId || entry.targetRecordId === recordId)) {
    return failure([diagnostic('record-in-use', 'No se puede eliminar un registro conectado por relaciones.', ['cms', 'records', recordId])])
  }
  delete cms.records[recordId]
  for (const revision of Object.values(cms.recordRevisions)) {
    if (revision.recordId === recordId) delete cms.recordRevisions[revision.id]
  }
  return validateCandidate(structure, cms)
}

function relationSlugOwner(cms: CmsBackend, slug: string, ignoredId?: RelationId): Relation | undefined {
  return Object.values(cms.relations).find((relation) => relation.slug === slug && relation.id !== ignoredId)
}

export function listRelations(structure: ProjectStructure): readonly Relation[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.relations).sort((left, right) => left.name.localeCompare(right.name, 'es') || left.id.localeCompare(right.id))
}

export function createRelation(
  structure: ProjectStructure,
  input: Relation,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const parsed = RelationSchema.safeParse(input)
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-relation', issue.message, ['cms', 'relations', input.id, ...issue.path.map(String)])))
  const cms = projectCmsBackend(structure.cms)
  if (cms.relations[parsed.data.id]) return failure([diagnostic('relation-id-conflict', 'Ya existe una relación con ese ID.', ['cms', 'relations', parsed.data.id])])
  if (relationSlugOwner(cms, parsed.data.slug)) return failure([diagnostic('relation-slug-conflict', `El slug ${parsed.data.slug} ya está en uso.`, ['cms', 'relations', parsed.data.id, 'slug'])])
  if (!cms.contentTypes[parsed.data.sourceContentTypeId] || !cms.contentTypes[parsed.data.targetContentTypeId]) {
    return failure([diagnostic('invalid-relation', 'Los dos endpoints de la relación deben ser CPT existentes.', ['cms', 'relations', parsed.data.id])])
  }
  cms.relations[parsed.data.id] = parsed.data
  return validateCandidate(structure, cms)
}

export function updateRelation(
  structure: ProjectStructure,
  relationId: RelationId,
  patch: RelationEditablePatch,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.relations[relationId]
  if (!current) return failure([diagnostic('relation-not-found', 'La relación ya no existe.', ['cms', 'relations', relationId])])
  const parsed = RelationSchema.safeParse({ ...current, ...structuredClone(patch), id: relationId })
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-relation', issue.message, ['cms', 'relations', relationId, ...issue.path.map(String)])))
  const slugOwner = relationSlugOwner(cms, parsed.data.slug, relationId)
  if (slugOwner) return failure([diagnostic('relation-slug-conflict', `El slug ${parsed.data.slug} ya pertenece a ${slugOwner.name}.`, ['cms', 'relations', relationId, 'slug'])])
  if (!cms.contentTypes[parsed.data.sourceContentTypeId] || !cms.contentTypes[parsed.data.targetContentTypeId]) {
    return failure([diagnostic('invalid-relation', 'Los dos endpoints de la relación deben existir.', ['cms', 'relations', relationId])])
  }
  cms.relations[relationId] = parsed.data
  return validateCandidate(structure, cms)
}

function relationDependencies(cms: CmsBackend, relationId: RelationId): readonly string[] {
  const dependencies: string[] = []
  if (Object.values(cms.relationEntries).some((entry) => entry.relationId === relationId)) dependencies.push('conexiones')
  if (Object.values(cms.fields).some((field) => field.relationId === relationId)) dependencies.push('campos')
  if (Object.values(cms.queries).some((query) => query.groups.some((group) => group.predicates.some((predicate) => predicate.relationId === relationId)))) dependencies.push('consultas')
  return [...new Set(dependencies)]
}

export function deleteRelation(
  structure: ProjectStructure,
  relationId: RelationId,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.relations[relationId]
  if (!current) return failure([diagnostic('relation-not-found', 'La relación ya no existe.', ['cms', 'relations', relationId])])
  const dependencies = relationDependencies(cms, relationId)
  if (dependencies.length > 0) return failure([diagnostic('relation-in-use', `No se puede eliminar ${current.name}: existen ${dependencies.join(', ')}.`, ['cms', 'relations', relationId])])
  delete cms.relations[relationId]
  return validateCandidate(structure, cms)
}

export function listRelationEntries(structure: ProjectStructure, relationId?: RelationId): readonly RelationEntry[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.relationEntries)
    .filter((entry) => !relationId || entry.relationId === relationId)
    .sort((left, right) => left.id.localeCompare(right.id))
}

export function createRelationEntry(
  structure: ProjectStructure,
  input: RelationEntry,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const parsed = RelationEntrySchema.safeParse(input)
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-relation-entry', issue.message, ['cms', 'relationEntries', input.id, ...issue.path.map(String)])))
  const cms = projectCmsBackend(structure.cms)
  if (cms.relationEntries[parsed.data.id]) return failure([diagnostic('relation-entry-id-conflict', 'Ya existe una conexión con ese ID.', ['cms', 'relationEntries', parsed.data.id])])
  cms.relationEntries[parsed.data.id] = parsed.data
  return validateCandidate(structure, cms)
}

export function updateRelationEntry(
  structure: ProjectStructure,
  entryId: RelationEntryId,
  patch: RelationEntryEditablePatch,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.relationEntries[entryId]
  if (!current) return failure([diagnostic('relation-entry-not-found', 'La conexión ya no existe.', ['cms', 'relationEntries', entryId])])
  const parsed = RelationEntrySchema.safeParse({ ...current, ...structuredClone(patch), id: entryId, relationId: current.relationId })
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-relation-entry', issue.message, ['cms', 'relationEntries', entryId, ...issue.path.map(String)])))
  cms.relationEntries[entryId] = parsed.data
  return validateCandidate(structure, cms)
}

export function deleteRelationEntry(
  structure: ProjectStructure,
  entryId: RelationEntryId,
): Result<ProjectStructure, readonly RecordRelationDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  if (!cms.relationEntries[entryId]) return failure([diagnostic('relation-entry-not-found', 'La conexión ya no existe.', ['cms', 'relationEntries', entryId])])
  delete cms.relationEntries[entryId]
  return validateCandidate(structure, cms)
}
