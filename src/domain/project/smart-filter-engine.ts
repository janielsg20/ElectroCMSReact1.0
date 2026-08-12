import { failure, success, type Result } from '../common/result'
import type { CmsBackend, Query } from './cms-schema'
import {
  FieldDefinitionIdSchema,
  QueryIdSchema,
  TaxonomyIdSchema,
  TaxonomyTermIdSchema,
  type FieldDefinitionId,
  type TaxonomyId,
} from './identity'
import type { JsonValue } from './project-envelope'
import { validateQueryDefinition } from './query-engine'

export type SmartFilterKind =
  | 'search'
  | 'select'
  | 'range'
  | 'checkboxes'
  | 'radio'
  | 'date'
  | 'taxonomy'
  | 'sort'

export type SmartFilterDiagnosticCode =
  | 'query-not-found'
  | 'invalid-filter'
  | 'invalid-filter-target'
  | 'invalid-filter-value'
  | 'invalid-filter-sort'
  | 'invalid-filtered-query'

export interface SmartFilterInput {
  readonly fieldId?: string | null
  readonly id: string
  readonly kind: SmartFilterKind
  readonly taxonomyId?: string | null
  readonly dateField?: 'createdAt' | 'updatedAt'
  readonly value: JsonValue
}

export interface SmartFilterDiagnostic {
  readonly code: SmartFilterDiagnosticCode
  readonly filterId?: string
  readonly message: string
  readonly path: readonly (string | number)[]
}

export interface SmartFilteredQuery {
  readonly activeCount: number
  readonly query: Query
}

type QueryPredicate = Query['groups'][number]['predicates'][number]
type QuerySort = Query['sorts'][number]

const SEARCHABLE_TYPES = new Set(['text', 'textarea', 'rich-text', 'email', 'phone', 'url'])
const RANGE_TYPES = new Set(['number', 'currency', 'calculated'])
const SYSTEM_SORTS = new Set<QuerySort['systemField']>(['createdAt', 'updatedAt', 'status', 'id'])

function diagnostic(
  code: SmartFilterDiagnosticCode,
  message: string,
  path: readonly (string | number)[],
  filterId?: string,
): SmartFilterDiagnostic {
  return { code, filterId, message, path }
}

function isObject(value: JsonValue): value is Readonly<Record<string, JsonValue>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isInactiveValue(kind: SmartFilterKind, value: JsonValue): boolean {
  if (kind === 'range') return false
  if (Array.isArray(value)) return value.length === 0
  if (value === null) return true
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

function fieldTarget(
  cms: CmsBackend,
  query: Query,
  input: SmartFilterInput,
  allowedTypes?: ReadonlySet<string>,
): Result<FieldDefinitionId, SmartFilterDiagnostic> {
  const parsed = FieldDefinitionIdSchema.safeParse(input.fieldId)
  if (!parsed.success) {
    return failure(diagnostic('invalid-filter-target', 'El filtro requiere un campo destino válido.', ['filters', input.id, 'fieldId'], input.id))
  }
  const field = cms.fields[parsed.data]
  if (!field || field.owner.kind !== 'content-type' || field.owner.contentTypeId !== query.contentTypeId) {
    return failure(diagnostic('invalid-filter-target', 'El campo destino no pertenece al tipo de contenido consultado.', ['filters', input.id, 'fieldId'], input.id))
  }
  if (allowedTypes && !allowedTypes.has(field.type)) {
    return failure(diagnostic('invalid-filter-target', `El campo ${field.label} no admite este tipo de filtro.`, ['filters', input.id, 'fieldId'], input.id))
  }
  return success(parsed.data)
}

function predicate(
  source: QueryPredicate['source'],
  operator: QueryPredicate['operator'],
  value: JsonValue,
  options: Pick<QueryPredicate, 'fieldId' | 'taxonomyId' | 'relationId'>,
): QueryPredicate {
  return { source, operator, value, ...options }
}

function rangeValue(input: SmartFilterInput): Result<readonly [number, number], SmartFilterDiagnostic> {
  const raw = input.value
  const values = Array.isArray(raw)
    ? raw
    : isObject(raw)
      ? [raw.min, raw.max]
      : []
  if (values.length !== 2 || values.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    return failure(diagnostic('invalid-filter-value', 'El rango requiere límites mínimo y máximo numéricos.', ['filters', input.id, 'value'], input.id))
  }
  const [first, second] = values as [number, number]
  return success(first <= second ? [first, second] : [second, first])
}

function taxonomyTarget(
  cms: CmsBackend,
  query: Query,
  input: SmartFilterInput,
): Result<TaxonomyId, SmartFilterDiagnostic> {
  const parsed = TaxonomyIdSchema.safeParse(input.taxonomyId)
  if (!parsed.success) {
    return failure(diagnostic('invalid-filter-target', 'El filtro requiere una taxonomía válida.', ['filters', input.id, 'taxonomyId'], input.id))
  }
  const taxonomy = cms.taxonomies[parsed.data]
  if (!taxonomy || !taxonomy.contentTypeIds.includes(query.contentTypeId)) {
    return failure(diagnostic('invalid-filter-target', 'La taxonomía no está asociada al tipo de contenido consultado.', ['filters', input.id, 'taxonomyId'], input.id))
  }
  return success(parsed.data)
}

function taxonomyValues(
  cms: CmsBackend,
  taxonomyId: TaxonomyId,
  input: SmartFilterInput,
): Result<readonly string[], SmartFilterDiagnostic> {
  if (!Array.isArray(input.value) || input.value.some((value) => typeof value !== 'string')) {
    return failure(diagnostic('invalid-filter-value', 'El filtro de taxonomía requiere una lista de términos.', ['filters', input.id, 'value'], input.id))
  }
  const ids: string[] = []
  for (const value of input.value) {
    const parsed = TaxonomyTermIdSchema.safeParse(value)
    if (!parsed.success || cms.taxonomyTerms[parsed.data]?.taxonomyId !== taxonomyId) {
      return failure(diagnostic('invalid-filter-value', 'Uno de los términos no pertenece a la taxonomía seleccionada.', ['filters', input.id, 'value'], input.id))
    }
    ids.push(parsed.data)
  }
  return success(ids)
}

function searchGroup(
  cms: CmsBackend,
  query: Query,
  input: SmartFilterInput,
): Result<Query['groups'][number], SmartFilterDiagnostic> {
  const term = typeof input.value === 'string' ? input.value.trim() : ''
  if (!term) {
    return failure(diagnostic('invalid-filter-value', 'La búsqueda requiere texto.', ['filters', input.id, 'value'], input.id))
  }

  if (input.fieldId) {
    const target = fieldTarget(cms, query, input, SEARCHABLE_TYPES)
    if (!target.ok) return target
    return success({
      operator: 'all',
      predicates: [predicate('field', 'contains', term, { fieldId: target.value, relationId: null, taxonomyId: null })],
    })
  }

  const fields = Object.values(cms.fields).filter((field) => (
    field.owner.kind === 'content-type'
    && field.owner.contentTypeId === query.contentTypeId
    && SEARCHABLE_TYPES.has(field.type)
  ))
  if (fields.length === 0) {
    return failure(diagnostic('invalid-filter-target', 'El tipo consultado no tiene campos de texto buscables.', ['filters', input.id, 'fieldId'], input.id))
  }
  return success({
    operator: 'any',
    predicates: fields.map((field) => predicate('field', 'contains', term, { fieldId: field.id, relationId: null, taxonomyId: null })),
  })
}

function dateGroup(input: SmartFilterInput): Result<Query['groups'][number], SmartFilterDiagnostic> {
  if (typeof input.value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
    return failure(diagnostic('invalid-filter-value', 'La fecha debe usar el formato YYYY-MM-DD.', ['filters', input.id, 'value'], input.id))
  }
  const start = `${input.value}T00:00:00.000Z`
  const end = `${input.value}T23:59:59.999Z`
  if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end))) {
    return failure(diagnostic('invalid-filter-value', 'La fecha indicada no es válida.', ['filters', input.id, 'value'], input.id))
  }
  return success({
    operator: 'all',
    predicates: [predicate('date', 'between', {
      field: input.dateField ?? 'createdAt',
      value: [start, end],
    }, { fieldId: null, relationId: null, taxonomyId: null })],
  })
}

function sortValue(
  cms: CmsBackend,
  query: Query,
  input: SmartFilterInput,
): Result<QuerySort, SmartFilterDiagnostic> {
  if (typeof input.value !== 'string') {
    return failure(diagnostic('invalid-filter-sort', 'El orden requiere un valor textual.', ['filters', input.id, 'value'], input.id))
  }
  const raw = input.value.includes('|') ? input.value.slice(input.value.lastIndexOf('|') + 1) : input.value
  const parts = raw.split(':')
  const direction = parts.at(-1)
  if (direction !== 'asc' && direction !== 'desc') {
    return failure(diagnostic('invalid-filter-sort', 'El orden debe terminar en :asc o :desc.', ['filters', input.id, 'value'], input.id))
  }

  if (parts[0] === 'field') {
    const target = fieldTarget(cms, query, { ...input, fieldId: parts[1] })
    if (!target.ok) return target
    return success({ direction, fieldId: target.value, systemField: null })
  }

  const systemField = parts[0] === 'system' ? parts[1] : parts[0]
  if (!SYSTEM_SORTS.has(systemField as QuerySort['systemField'])) {
    return failure(diagnostic('invalid-filter-sort', 'El orden del sistema no es compatible.', ['filters', input.id, 'value'], input.id))
  }
  return success({ direction, fieldId: null, systemField: systemField as Exclude<QuerySort['systemField'], null> })
}

/**
 * Compone filtros UI sobre una copia transitoria de una consulta guardada. No
 * modifica `cms.queries` y delega la semántica final al Query Engine canónico.
 */
export function composeSmartFilteredQuery(
  cms: CmsBackend,
  queryId: string,
  filters: readonly SmartFilterInput[],
): Result<SmartFilteredQuery, readonly SmartFilterDiagnostic[]> {
  const parsedQueryId = QueryIdSchema.safeParse(queryId)
  if (!parsedQueryId.success || !cms.queries[parsedQueryId.data]) {
    return failure([diagnostic('query-not-found', 'La consulta objetivo del filtro no existe.', ['queryId'])])
  }

  const base = cms.queries[parsedQueryId.data]
  const groups = [...base.groups]
  let sorts = [...base.sorts]
  let activeCount = 0
  const diagnostics: SmartFilterDiagnostic[] = []

  for (const input of filters) {
    if (isInactiveValue(input.kind, input.value)) continue

    if (input.kind === 'sort') {
      const sort = sortValue(cms, base, input)
      if (!sort.ok) diagnostics.push(sort.error)
      else {
        sorts = [sort.value]
        activeCount += 1
      }
      continue
    }

    if (input.kind === 'search') {
      const group = searchGroup(cms, base, input)
      if (!group.ok) diagnostics.push(group.error)
      else {
        groups.push(group.value)
        activeCount += 1
      }
      continue
    }

    if (input.kind === 'date') {
      const group = dateGroup(input)
      if (!group.ok) diagnostics.push(group.error)
      else {
        groups.push(group.value)
        activeCount += 1
      }
      continue
    }

    if (input.kind === 'taxonomy') {
      const target = taxonomyTarget(cms, base, input)
      if (!target.ok) {
        diagnostics.push(target.error)
        continue
      }
      const values = taxonomyValues(cms, target.value, input)
      if (!values.ok) {
        diagnostics.push(values.error)
        continue
      }
      if (values.value.length > 0) {
        groups.push({
          operator: 'all',
          predicates: [predicate('taxonomy', 'in', [...values.value], { fieldId: null, relationId: null, taxonomyId: target.value })],
        })
        activeCount += 1
      }
      continue
    }

    const target = fieldTarget(cms, base, input, input.kind === 'range' ? RANGE_TYPES : undefined)
    if (!target.ok) {
      diagnostics.push(target.error)
      continue
    }

    if (input.kind === 'range') {
      const range = rangeValue(input)
      if (!range.ok) diagnostics.push(range.error)
      else {
        groups.push({
          operator: 'all',
          predicates: [predicate('field', 'between', [...range.value], { fieldId: target.value, relationId: null, taxonomyId: null })],
        })
        activeCount += 1
      }
      continue
    }

    if (input.kind === 'checkboxes') {
      if (!Array.isArray(input.value)) {
        diagnostics.push(diagnostic('invalid-filter-value', 'Checkboxes requiere una lista de valores.', ['filters', input.id, 'value'], input.id))
      } else if (input.value.length > 0) {
        groups.push({
          operator: 'all',
          predicates: [predicate('field', 'in', [...input.value], { fieldId: target.value, relationId: null, taxonomyId: null })],
        })
        activeCount += 1
      }
      continue
    }

    groups.push({
      operator: 'all',
      predicates: [predicate('field', 'equals', input.value, { fieldId: target.value, relationId: null, taxonomyId: null })],
    })
    activeCount += 1
  }

  if (diagnostics.length > 0) return failure(diagnostics)

  const query: Query = { ...base, groups, sorts }
  const validated = validateQueryDefinition(cms, query)
  if (!validated.ok) {
    return failure(validated.error.map((item) => diagnostic(
      'invalid-filtered-query',
      item.message,
      item.path,
    )))
  }
  return success({ activeCount, query: validated.value })
}
