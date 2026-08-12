import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import {
  FieldDefinitionSchema,
  type CmsBackend,
  type FieldDefinition,
} from './cms-schema'
import type { FieldDefinitionId } from './identity'
import type { JsonValue } from './project-envelope'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type CustomFieldDiagnosticCode =
  | 'field-not-found'
  | 'field-id-conflict'
  | 'field-key-conflict'
  | 'field-in-use'
  | 'invalid-field'
  | 'invalid-owner'
  | 'invalid-options'
  | 'invalid-default-value'
  | 'invalid-child-field'
  | 'invalid-condition-field'
  | 'invalid-relation'
  | 'invalid-taxonomy'
  | 'invalid-role'
  | 'invalid-calculated-expression'
  | 'invalid-cms'
  | 'invalid-project'

export interface CustomFieldDiagnostic {
  readonly code: CustomFieldDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type FieldDefinitionEditablePatch = Partial<Pick<FieldDefinition,
  | 'key'
  | 'label'
  | 'type'
  | 'description'
  | 'placeholder'
  | 'defaultValue'
  | 'required'
  | 'validation'
  | 'options'
  | 'conditions'
  | 'childFieldIds'
  | 'relationId'
  | 'taxonomyId'
  | 'allowedRoleIds'
  | 'calculatedExpression'
  | 'group'
  | 'order'
>>

function diagnostic(
  code: CustomFieldDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): CustomFieldDiagnostic {
  return { code, message, path }
}

function sameOwner(left: FieldDefinition['owner'], right: FieldDefinition['owner']): boolean {
  return left.kind === right.kind && (
    left.kind === 'content-type'
      ? right.kind === 'content-type' && left.contentTypeId === right.contentTypeId
      : right.kind === 'taxonomy' && left.taxonomyId === right.taxonomyId
  )
}

function ownerExists(cms: CmsBackend, field: FieldDefinition): boolean {
  return field.owner.kind === 'content-type'
    ? Boolean(cms.contentTypes[field.owner.contentTypeId])
    : Boolean(cms.taxonomies[field.owner.taxonomyId])
}

function keyOwner(cms: CmsBackend, field: FieldDefinition, ignoredId?: FieldDefinitionId): FieldDefinition | undefined {
  return Object.values(cms.fields).find((candidate) => (
    candidate.id !== ignoredId
    && candidate.key === field.key
    && sameOwner(candidate.owner, field.owner)
  ))
}

function jsonKey(value: JsonValue): string {
  return JSON.stringify(value)
}

function optionContains(field: FieldDefinition, value: JsonValue): boolean {
  const candidate = jsonKey(value)
  return field.options.some((option) => jsonKey(option.value) === candidate)
}

function isStringOrNull(value: JsonValue): value is string | null {
  return value === null || typeof value === 'string'
}

function taxonomyTermMatches(cms: CmsBackend, value: JsonValue, taxonomyId: string): boolean {
  if (typeof value !== 'string') return false
  const term = Object.values(cms.taxonomyTerms).find((candidate) => candidate.id === value)
  return term?.taxonomyId === taxonomyId
}

function userExists(cms: CmsBackend, value: string): boolean {
  return Object.values(cms.users).some((user) => user.id === value)
}

function validateDefaultValue(cms: CmsBackend, field: FieldDefinition): readonly CustomFieldDiagnostic[] {
  const value = field.defaultValue
  const path = ['cms', 'fields', field.id, 'defaultValue'] as const
  if (value === null) return []

  if ((field.type === 'number' || field.type === 'currency') && typeof value !== 'number') {
    return [diagnostic('invalid-default-value', 'El valor predeterminado debe ser numérico.', path)]
  }
  if (field.type === 'switch' && typeof value !== 'boolean') {
    return [diagnostic('invalid-default-value', 'El valor predeterminado del switch debe ser booleano.', path)]
  }
  if ((field.type === 'select' || field.type === 'radio') && !optionContains(field, value)) {
    return [diagnostic('invalid-default-value', 'El valor predeterminado debe coincidir con una opción existente.', path)]
  }
  if (field.type === 'checkbox') {
    if (typeof value === 'boolean') return []
    if (!Array.isArray(value) || value.some((item) => !optionContains(field, item))) {
      return [diagnostic('invalid-default-value', 'Checkbox admite booleano o una lista de opciones existentes.', path)]
    }
  }

  const stringTypes = new Set<FieldDefinition['type']>([
    'text', 'textarea', 'rich-text', 'email', 'phone', 'url', 'date', 'time', 'datetime', 'color',
  ])
  if (stringTypes.has(field.type) && !isStringOrNull(value)) {
    return [diagnostic('invalid-default-value', `El valor predeterminado de ${field.type} debe ser texto.`, path)]
  }
  if (typeof value === 'string') {
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return [diagnostic('invalid-default-value', 'El email predeterminado no tiene formato válido.', path)]
    }
    if (field.type === 'url' && value) {
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
      } catch {
        return [diagnostic('invalid-default-value', 'La URL predeterminada debe usar http o https.', path)]
      }
    }
    if (field.type === 'color' && value && !/^#[0-9a-f]{6}$/i.test(value)) {
      return [diagnostic('invalid-default-value', 'El color predeterminado debe usar #RRGGBB.', path)]
    }
    if (field.type === 'date' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return [diagnostic('invalid-default-value', 'La fecha predeterminada debe usar YYYY-MM-DD.', path)]
    }
    if (field.type === 'time' && value && !/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
      return [diagnostic('invalid-default-value', 'La hora predeterminada debe usar HH:MM o HH:MM:SS.', path)]
    }
    if (field.type === 'datetime' && value && Number.isNaN(Date.parse(value))) {
      return [diagnostic('invalid-default-value', 'La fecha y hora predeterminada no es válida.', path)]
    }
  }

  if (field.type === 'user' && typeof value === 'string' && !userExists(cms, value)) {
    return [diagnostic('invalid-default-value', 'El usuario predeterminado no existe.', path)]
  }
  if (field.type === 'taxonomy' && field.taxonomyId) {
    const ids = Array.isArray(value) ? value : [value]
    if (ids.some((item) => !taxonomyTermMatches(cms, item, field.taxonomyId as string))) {
      return [diagnostic('invalid-default-value', 'El valor predeterminado debe usar términos de la taxonomía configurada.', path)]
    }
  }
  if (field.type === 'group' && (Array.isArray(value) || typeof value !== 'object')) {
    return [diagnostic('invalid-default-value', 'Un grupo debe usar un objeto JSON como valor predeterminado.', path)]
  }
  if (field.type === 'repeater' && !Array.isArray(value)) {
    return [diagnostic('invalid-default-value', 'Un repeater debe usar una lista JSON como valor predeterminado.', path)]
  }
  return []
}

function validateOptions(field: FieldDefinition): readonly CustomFieldDiagnostic[] {
  const usesOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
  if (!usesOptions && field.options.length > 0) {
    return [diagnostic(
      'invalid-options',
      `El tipo ${field.type} no admite una lista de opciones.`,
      ['cms', 'fields', field.id, 'options'],
    )]
  }
  if ((field.type === 'select' || field.type === 'radio') && field.options.length === 0) {
    return [diagnostic(
      'invalid-options',
      `${field.type} requiere al menos una opción.`,
      ['cms', 'fields', field.id, 'options'],
    )]
  }
  const labels = new Set<string>()
  const values = new Set<string>()
  for (const option of field.options) {
    const normalizedLabel = option.label.trim().toLocaleLowerCase('es')
    const valueKey = jsonKey(option.value)
    if (labels.has(normalizedLabel) || values.has(valueKey)) {
      return [diagnostic(
        'invalid-options',
        'Las etiquetas y valores de opciones deben ser únicos.',
        ['cms', 'fields', field.id, 'options'],
      )]
    }
    labels.add(normalizedLabel)
    values.add(valueKey)
  }
  return []
}

function validateFieldReferences(cms: CmsBackend, field: FieldDefinition): readonly CustomFieldDiagnostic[] {
  const diagnostics: CustomFieldDiagnostic[] = []
  const fieldPath = ['cms', 'fields', field.id] as const

  if (!ownerExists(cms, field)) {
    diagnostics.push(diagnostic('invalid-owner', 'El propietario del campo no existe.', [...fieldPath, 'owner']))
    return diagnostics
  }

  const composite = field.type === 'group' || field.type === 'repeater'
  if (!composite && field.childFieldIds.length > 0) {
    diagnostics.push(diagnostic('invalid-child-field', `El tipo ${field.type} no admite campos hijos.`, [...fieldPath, 'childFieldIds']))
  }
  for (const childId of field.childFieldIds) {
    const child = cms.fields[childId]
    if (!child || !sameOwner(field.owner, child.owner) || child.id === field.id) {
      diagnostics.push(diagnostic(
        'invalid-child-field',
        'Los campos hijos deben existir, compartir propietario y no referenciar al propio campo.',
        [...fieldPath, 'childFieldIds'],
      ))
    }
  }

  for (const group of field.conditions) {
    for (const condition of group.conditions) {
      const source = cms.fields[condition.fieldId]
      if (!source || !sameOwner(field.owner, source.owner) || source.id === field.id) {
        diagnostics.push(diagnostic(
          'invalid-condition-field',
          'Las condiciones deben referenciar otro campo del mismo propietario.',
          [...fieldPath, 'conditions'],
        ))
      }
    }
  }

  if (field.type === 'relation') {
    if (field.owner.kind !== 'content-type' || !field.relationId) {
      diagnostics.push(diagnostic('invalid-relation', 'Un campo relation requiere un CPT propietario y una relación existente.', [...fieldPath, 'relationId']))
    } else {
      const relation = cms.relations[field.relationId]
      if (!relation || (relation.sourceContentTypeId !== field.owner.contentTypeId && relation.targetContentTypeId !== field.owner.contentTypeId)) {
        diagnostics.push(diagnostic('invalid-relation', 'La relación debe existir e incluir al CPT propietario.', [...fieldPath, 'relationId']))
      }
    }
  } else if (field.relationId !== null) {
    diagnostics.push(diagnostic('invalid-relation', `El tipo ${field.type} no admite relationId.`, [...fieldPath, 'relationId']))
  }

  if (field.type === 'taxonomy') {
    const taxonomy = field.taxonomyId ? cms.taxonomies[field.taxonomyId] : undefined
    if (!taxonomy) {
      diagnostics.push(diagnostic('invalid-taxonomy', 'Un campo taxonomy requiere una taxonomía existente.', [...fieldPath, 'taxonomyId']))
    } else if (field.owner.kind === 'content-type' && !taxonomy.contentTypeIds.includes(field.owner.contentTypeId)) {
      diagnostics.push(diagnostic('invalid-taxonomy', 'La taxonomía debe estar asociada al CPT propietario.', [...fieldPath, 'taxonomyId']))
    }
  } else if (field.taxonomyId !== null) {
    diagnostics.push(diagnostic('invalid-taxonomy', `El tipo ${field.type} no admite taxonomyId.`, [...fieldPath, 'taxonomyId']))
  }

  if (field.type === 'calculated') {
    if (!field.calculatedExpression?.trim()) {
      diagnostics.push(diagnostic('invalid-calculated-expression', 'Un campo calculated requiere expresión.', [...fieldPath, 'calculatedExpression']))
    }
  } else if (field.calculatedExpression !== null) {
    diagnostics.push(diagnostic('invalid-calculated-expression', `El tipo ${field.type} no admite calculatedExpression.`, [...fieldPath, 'calculatedExpression']))
  }

  for (const roleId of field.allowedRoleIds) {
    if (!cms.roles[roleId]) diagnostics.push(diagnostic('invalid-role', `El rol ${roleId} no existe.`, [...fieldPath, 'allowedRoleIds']))
  }
  return diagnostics
}

function validateFieldDefinition(cms: CmsBackend, field: FieldDefinition): readonly CustomFieldDiagnostic[] {
  return [
    ...validateOptions(field),
    ...validateFieldReferences(cms, field),
    ...validateDefaultValue(cms, field),
  ]
}

function attachToOwner(cms: CmsBackend, field: FieldDefinition): void {
  if (field.owner.kind === 'content-type') {
    const owner = cms.contentTypes[field.owner.contentTypeId]
    if (owner && !owner.fieldIds.includes(field.id)) owner.fieldIds = [...owner.fieldIds, field.id]
  } else {
    const owner = cms.taxonomies[field.owner.taxonomyId]
    if (owner && !owner.fieldIds.includes(field.id)) owner.fieldIds = [...owner.fieldIds, field.id]
  }
}

function detachFromOwner(cms: CmsBackend, field: FieldDefinition): void {
  if (field.owner.kind === 'content-type') {
    const owner = cms.contentTypes[field.owner.contentTypeId]
    if (owner) owner.fieldIds = owner.fieldIds.filter((id) => id !== field.id)
  } else {
    const owner = cms.taxonomies[field.owner.taxonomyId]
    if (owner) owner.fieldIds = owner.fieldIds.filter((id) => id !== field.id)
  }
}

function validateCandidate(
  structure: ProjectStructure,
  cms: CmsBackend,
): Result<ProjectStructure, readonly CustomFieldDiagnostic[]> {
  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic('invalid-cms', issue.message, ['cms', ...issue.path])))
  }
  const candidate: ProjectStructure = { ...structuredClone(structure), cms: cmsValidation.value }
  const validated = validateProjectStructure(candidate)
  return validated.ok
    ? success(validated.value)
    : failure(validated.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}

export function listCustomFields(structure: ProjectStructure): readonly FieldDefinition[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.fields).sort((left, right) => (
    left.order - right.order
    || left.label.localeCompare(right.label, 'es')
    || left.id.localeCompare(right.id)
  ))
}

export function createCustomField(
  structure: ProjectStructure,
  input: FieldDefinition,
): Result<ProjectStructure, readonly CustomFieldDiagnostic[]> {
  const parsed = FieldDefinitionSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-field',
      issue.message,
      ['cms', 'fields', input.id, ...issue.path.map(String)],
    )))
  }
  const field: FieldDefinition = {
    ...structuredClone(parsed.data),
    allowedRoleIds: [...new Set(parsed.data.allowedRoleIds)],
    childFieldIds: [...new Set(parsed.data.childFieldIds)],
  }
  const cms = projectCmsBackend(structure.cms)
  if (cms.fields[field.id]) {
    return failure([diagnostic('field-id-conflict', 'Ya existe un campo con ese ID.', ['cms', 'fields', field.id])])
  }
  const existingKey = keyOwner(cms, field)
  if (existingKey) {
    return failure([diagnostic(
      'field-key-conflict',
      `La clave ${field.key} ya pertenece a ${existingKey.label} dentro del mismo propietario.`,
      ['cms', 'fields', field.id, 'key'],
    )])
  }
  const diagnostics = validateFieldDefinition(cms, field)
  if (diagnostics.length > 0) return failure(diagnostics)
  cms.fields[field.id] = field
  attachToOwner(cms, field)
  return validateCandidate(structure, cms)
}

function fieldHasStoredValues(cms: CmsBackend, fieldId: FieldDefinitionId): boolean {
  return Object.values(cms.records).some((record) => Object.hasOwn(record.values, fieldId))
    || Object.values(cms.recordRevisions).some((revision) => Object.hasOwn(revision.snapshot.values, fieldId))
    || Object.values(cms.taxonomyTerms).some((term) => Object.hasOwn(term.values, fieldId))
}

export function updateCustomField(
  structure: ProjectStructure,
  fieldId: FieldDefinitionId,
  patch: FieldDefinitionEditablePatch,
): Result<ProjectStructure, readonly CustomFieldDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.fields[fieldId]
  if (!current) return failure([diagnostic('field-not-found', 'El campo ya no existe.', ['cms', 'fields', fieldId])])
  if (patch.type && patch.type !== current.type && fieldHasStoredValues(cms, fieldId)) {
    return failure([diagnostic(
      'field-in-use',
      'No se puede cambiar el tipo mientras existan valores guardados para este campo.',
      ['cms', 'fields', fieldId, 'type'],
    )])
  }
  const parsed = FieldDefinitionSchema.safeParse({
    ...current,
    ...structuredClone(patch),
    id: fieldId,
    owner: current.owner,
  })
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-field',
      issue.message,
      ['cms', 'fields', fieldId, ...issue.path.map(String)],
    )))
  }
  const field: FieldDefinition = {
    ...structuredClone(parsed.data),
    allowedRoleIds: [...new Set(parsed.data.allowedRoleIds)],
    childFieldIds: [...new Set(parsed.data.childFieldIds)],
  }
  const existingKey = keyOwner(cms, field, fieldId)
  if (existingKey) {
    return failure([diagnostic(
      'field-key-conflict',
      `La clave ${field.key} ya pertenece a ${existingKey.label} dentro del mismo propietario.`,
      ['cms', 'fields', fieldId, 'key'],
    )])
  }
  const diagnostics = validateFieldDefinition(cms, field)
  if (diagnostics.length > 0) return failure(diagnostics)
  cms.fields[fieldId] = field
  return validateCandidate(structure, cms)
}

function fieldDependencies(cms: CmsBackend, fieldId: FieldDefinitionId): readonly string[] {
  const dependencies: string[] = []
  if (fieldHasStoredValues(cms, fieldId)) dependencies.push('valores guardados')
  if (Object.values(cms.fields).some((field) => (
    field.id !== fieldId && field.childFieldIds.includes(fieldId)
  ))) dependencies.push('campos compuestos')
  if (Object.values(cms.fields).some((field) => field.conditions.some((group) => (
    group.conditions.some((condition) => condition.fieldId === fieldId)
  )))) dependencies.push('condiciones de campos')
  if (Object.values(cms.queries).some((query) => (
    query.groups.some((group) => group.predicates.some((predicate) => predicate.fieldId === fieldId))
    || query.sorts.some((sort) => sort.fieldId === fieldId)
  ))) dependencies.push('consultas')
  if (Object.values(cms.forms).some((form) => (
    Object.values(form.controls).some((control) => control.mappedFieldId === fieldId)
  ))) dependencies.push('formularios')
  if (Object.values(cms.roles).some((role) => Object.hasOwn(role.fields, fieldId))) dependencies.push('permisos de rol')
  return [...new Set(dependencies)]
}

export function deleteCustomField(
  structure: ProjectStructure,
  fieldId: FieldDefinitionId,
): Result<ProjectStructure, readonly CustomFieldDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.fields[fieldId]
  if (!current) return failure([diagnostic('field-not-found', 'El campo ya no existe.', ['cms', 'fields', fieldId])])
  const dependencies = fieldDependencies(cms, fieldId)
  if (dependencies.length > 0) {
    return failure([diagnostic(
      'field-in-use',
      `No se puede eliminar ${current.label}: existen ${dependencies.join(', ')}.`,
      ['cms', 'fields', fieldId],
    )])
  }
  detachFromOwner(cms, current)
  delete cms.fields[fieldId]
  return validateCandidate(structure, cms)
}
