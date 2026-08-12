import { failure, success, type Result } from '../common/result'
import { QuerySchema, type CmsBackend, type ContentRecord, type Query } from './cms-schema'
import type { ContentRecordId, QueryId } from './identity'
import type { JsonValue } from './project-envelope'

type QueryPredicate = Query['groups'][number]['predicates'][number]
type QuerySort = Query['sorts'][number]

export type QueryEngineDiagnosticCode =
  | 'query-not-found'
  | 'invalid-query'
  | 'missing-content-type'
  | 'invalid-predicate'
  | 'invalid-sort'

export interface QueryEngineDiagnostic {
  readonly code: QueryEngineDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export interface QueryExecutionResult {
  readonly queryId: QueryId
  readonly records: readonly ContentRecord[]
  readonly totalMatched: number
  readonly offset: number
  readonly limit: number
  readonly pageSize: number
}

interface PredicateValue {
  readonly candidate: JsonValue | undefined
  readonly operand: JsonValue
  readonly collection: boolean
}

const COMPLEX_SORT_TYPES = new Set(['checkbox', 'gallery', 'map', 'relation', 'taxonomy', 'repeater', 'group'])

function diagnostic(code: QueryEngineDiagnosticCode, message: string, path: readonly (string | number)[]): QueryEngineDiagnostic {
  return { code, message, path }
}

function isObject(value: JsonValue | undefined): value is Readonly<Record<string, JsonValue>> {
  return value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value)
}

function deepEqual(left: JsonValue | undefined, right: JsonValue | undefined): boolean {
  if (left === right) return true
  if (left === undefined || right === undefined || left === null || right === null) return false
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((item, index) => deepEqual(item, right[index]))
  }
  if (isObject(left) || isObject(right)) {
    if (!isObject(left) || !isObject(right)) return false
    const leftKeys = Object.keys(left).sort()
    const rightKeys = Object.keys(right).sort()
    if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false
    return leftKeys.every((key) => deepEqual(left[key], right[key]))
  }
  return false
}

function exists(value: JsonValue | undefined): boolean {
  return value !== undefined && value !== null
}

function orderedCompare(left: JsonValue | undefined, right: JsonValue | undefined): number | null {
  if (typeof left === 'number' && typeof right === 'number') return left === right ? 0 : left < right ? -1 : 1
  if (typeof left === 'string' && typeof right === 'string') return left === right ? 0 : left < right ? -1 : 1
  if (typeof left === 'boolean' && typeof right === 'boolean') return left === right ? 0 : left ? 1 : -1
  return null
}

function collectionContains(candidate: JsonValue | undefined, operand: JsonValue): boolean {
  return Array.isArray(candidate) && candidate.some((item) => deepEqual(item, operand))
}

function matchesOperator(candidate: JsonValue | undefined, operator: QueryPredicate['operator'], operand: JsonValue, collection: boolean): boolean {
  if (operator === 'exists') return collection ? Array.isArray(candidate) && candidate.length > 0 : exists(candidate)

  if (collection && (operator === 'equals' || operator === 'contains')) return collectionContains(candidate, operand)
  if (collection && operator === 'not-equals') return !collectionContains(candidate, operand)

  if (operator === 'equals') return deepEqual(candidate, operand)
  if (operator === 'not-equals') return !deepEqual(candidate, operand)
  if (operator === 'contains') {
    if (typeof candidate === 'string' && typeof operand === 'string') return candidate.includes(operand)
    return collectionContains(candidate, operand)
  }
  if (operator === 'in' || operator === 'not-in') {
    if (!Array.isArray(operand)) return false
    const included = Array.isArray(candidate)
      ? candidate.some((item) => operand.some((allowed) => deepEqual(item, allowed)))
      : operand.some((allowed) => deepEqual(candidate, allowed))
    return operator === 'in' ? included : !included
  }
  if (operator === 'between') {
    if (!Array.isArray(operand) || operand.length !== 2) return false
    const lower = orderedCompare(candidate, operand[0])
    const upper = orderedCompare(candidate, operand[1])
    return lower !== null && upper !== null && lower >= 0 && upper <= 0
  }

  const compared = orderedCompare(candidate, operand)
  if (compared === null) return false
  if (operator === 'greater-than') return compared > 0
  if (operator === 'greater-or-equal') return compared >= 0
  if (operator === 'less-than') return compared < 0
  if (operator === 'less-or-equal') return compared <= 0
  return false
}

function datePredicateValue(record: ContentRecord, raw: JsonValue): PredicateValue {
  if (isObject(raw) && (raw.field === 'createdAt' || raw.field === 'updatedAt') && 'value' in raw) {
    const field = raw.field
    return { candidate: record[field], operand: raw.value, collection: false }
  }
  return { candidate: record.createdAt, operand: raw, collection: false }
}

function valueAtPath(value: JsonValue | undefined, path: readonly string[]): JsonValue | undefined {
  let current = value
  for (const segment of path) {
    if (!isObject(current)) return undefined
    current = current[segment]
  }
  return current
}

function repeaterPredicateValue(record: ContentRecord, predicate: QueryPredicate): PredicateValue {
  const raw = predicate.fieldId ? record.values[predicate.fieldId] : undefined
  if (isObject(predicate.value) && Array.isArray(predicate.value.path) && predicate.value.path.every((part) => typeof part === 'string') && 'value' in predicate.value) {
    const path = predicate.value.path as string[]
    const extracted = Array.isArray(raw)
      ? raw.flatMap((row) => {
          const item = valueAtPath(row, path)
          return item === undefined ? [] : [item]
        })
      : []
    return { candidate: extracted, operand: predicate.value.value, collection: true }
  }
  return { candidate: raw, operand: predicate.value, collection: Array.isArray(raw) }
}

function relationRecordIds(cms: CmsBackend, query: Query, record: ContentRecord, predicate: QueryPredicate): readonly ContentRecordId[] {
  if (!predicate.relationId) return []
  const relation = cms.relations[predicate.relationId]
  if (!relation) return []

  const related: ContentRecordId[] = []
  for (const entry of Object.values(cms.relationEntries)) {
    if (entry.relationId !== relation.id) continue
    if (relation.sourceContentTypeId === query.contentTypeId && entry.sourceRecordId === record.id) related.push(entry.targetRecordId)
    if (relation.targetContentTypeId === query.contentTypeId && entry.targetRecordId === record.id) related.push(entry.sourceRecordId)
  }
  return [...new Set(related)]
}

function predicateValue(cms: CmsBackend, query: Query, record: ContentRecord, predicate: QueryPredicate): PredicateValue {
  if (predicate.source === 'status') return { candidate: record.status, operand: predicate.value, collection: false }
  if (predicate.source === 'author') return { candidate: record.authorId, operand: predicate.value, collection: false }
  if (predicate.source === 'date') return datePredicateValue(record, predicate.value)
  if (predicate.source === 'field') return { candidate: predicate.fieldId ? record.values[predicate.fieldId] : undefined, operand: predicate.value, collection: false }
  if (predicate.source === 'repeater') return repeaterPredicateValue(record, predicate)
  if (predicate.source === 'taxonomy') {
    const termIds = predicate.taxonomyId
      ? record.taxonomyTermIds.filter((termId) => cms.taxonomyTerms[termId]?.taxonomyId === predicate.taxonomyId)
      : []
    return { candidate: termIds, operand: predicate.value, collection: true }
  }
  return { candidate: relationRecordIds(cms, query, record, predicate), operand: predicate.value, collection: true }
}

function queryPredicateMatches(cms: CmsBackend, query: Query, record: ContentRecord, predicate: QueryPredicate): boolean {
  const resolved = predicateValue(cms, query, record, predicate)
  return matchesOperator(resolved.candidate, predicate.operator, resolved.operand, resolved.collection)
}

function queryMatches(cms: CmsBackend, query: Query, record: ContentRecord): boolean {
  if (record.contentTypeId !== query.contentTypeId) return false
  return query.groups.every((group) => group.operator === 'all'
    ? group.predicates.every((predicate) => queryPredicateMatches(cms, query, record, predicate))
    : group.predicates.some((predicate) => queryPredicateMatches(cms, query, record, predicate)))
}

function sortValue(record: ContentRecord, sort: QuerySort): JsonValue | undefined {
  if (sort.fieldId) return record.values[sort.fieldId]
  if (!sort.systemField) return undefined
  return record[sort.systemField]
}

function compareSortValues(left: JsonValue | undefined, right: JsonValue | undefined, direction: QuerySort['direction']): number {
  if (left === undefined || left === null) return right === undefined || right === null ? 0 : 1
  if (right === undefined || right === null) return -1
  const compared = orderedCompare(left, right)
  if (compared !== null) return direction === 'asc' ? compared : -compared
  const leftText = JSON.stringify(left)
  const rightText = JSON.stringify(right)
  const fallback = leftText.localeCompare(rightText)
  return direction === 'asc' ? fallback : -fallback
}

function compareRecords(query: Query, left: ContentRecord, right: ContentRecord): number {
  for (const sort of query.sorts) {
    const compared = compareSortValues(sortValue(left, sort), sortValue(right, sort), sort.direction)
    if (compared !== 0) return compared
  }
  return left.id.localeCompare(right.id)
}

function validateOperandShape(predicate: QueryPredicate, path: readonly (string | number)[]): readonly QueryEngineDiagnostic[] {
  const raw = predicate.source === 'date' && isObject(predicate.value) && 'value' in predicate.value
    ? predicate.value.value
    : predicate.source === 'repeater' && isObject(predicate.value) && 'value' in predicate.value
      ? predicate.value.value
      : predicate.value

  if ((predicate.operator === 'in' || predicate.operator === 'not-in') && !Array.isArray(raw)) {
    return [diagnostic('invalid-predicate', `${predicate.operator} requiere una lista como valor.`, path)]
  }
  if (predicate.operator === 'between' && (!Array.isArray(raw) || raw.length !== 2)) {
    return [diagnostic('invalid-predicate', 'between requiere exactamente dos límites.', path)]
  }
  return []
}

export function validateQueryDefinition(cms: CmsBackend, input: unknown): Result<Query, readonly QueryEngineDiagnostic[]> {
  const parsed = QuerySchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-query',
      issue.message,
      ['query', ...issue.path.map((segment) => typeof segment === 'symbol' ? (segment.description ?? segment.toString()) : segment)],
    )))
  }

  const query = parsed.data
  const diagnostics: QueryEngineDiagnostic[] = []
  if (!cms.contentTypes[query.contentTypeId]) diagnostics.push(diagnostic('missing-content-type', `El tipo ${query.contentTypeId} no existe.`, ['query', 'contentTypeId']))

  query.groups.forEach((group, groupIndex) => group.predicates.forEach((predicate, predicateIndex) => {
    const path = ['query', 'groups', groupIndex, 'predicates', predicateIndex] as const
    diagnostics.push(...validateOperandShape(predicate, path))

    const field = predicate.fieldId ? cms.fields[predicate.fieldId] : undefined
    if (predicate.source === 'field' || predicate.source === 'repeater') {
      if (!field || field.owner.kind !== 'content-type' || field.owner.contentTypeId !== query.contentTypeId) {
        diagnostics.push(diagnostic('invalid-predicate', `${predicate.source} requiere un campo del tipo consultado.`, [...path, 'fieldId']))
      } else if (predicate.source === 'repeater' && field.type !== 'repeater') {
        diagnostics.push(diagnostic('invalid-predicate', 'El predicado repeater requiere un campo de tipo repeater.', [...path, 'fieldId']))
      }
    } else if (predicate.fieldId !== null) {
      diagnostics.push(diagnostic('invalid-predicate', `${predicate.source} no debe declarar fieldId.`, [...path, 'fieldId']))
    }

    if (predicate.source === 'taxonomy') {
      const taxonomy = predicate.taxonomyId ? cms.taxonomies[predicate.taxonomyId] : undefined
      if (!taxonomy || !taxonomy.contentTypeIds.includes(query.contentTypeId)) diagnostics.push(diagnostic('invalid-predicate', 'La taxonomía debe estar asociada al tipo consultado.', [...path, 'taxonomyId']))
    } else if (predicate.taxonomyId !== null) {
      diagnostics.push(diagnostic('invalid-predicate', `${predicate.source} no debe declarar taxonomyId.`, [...path, 'taxonomyId']))
    }

    if (predicate.source === 'relation') {
      const relation = predicate.relationId ? cms.relations[predicate.relationId] : undefined
      if (!relation || (relation.sourceContentTypeId !== query.contentTypeId && relation.targetContentTypeId !== query.contentTypeId)) diagnostics.push(diagnostic('invalid-predicate', 'La relación debe conectar el tipo consultado.', [...path, 'relationId']))
    } else if (predicate.relationId !== null) {
      diagnostics.push(diagnostic('invalid-predicate', `${predicate.source} no debe declarar relationId.`, [...path, 'relationId']))
    }

    if (predicate.source === 'date' && isObject(predicate.value) && 'field' in predicate.value && predicate.value.field !== 'createdAt' && predicate.value.field !== 'updatedAt') {
      diagnostics.push(diagnostic('invalid-predicate', 'El predicado date solo admite createdAt o updatedAt.', [...path, 'value', 'field']))
    }
  }))

  query.sorts.forEach((sort, sortIndex) => {
    const path = ['query', 'sorts', sortIndex] as const
    if ((sort.fieldId === null) === (sort.systemField === null)) {
      diagnostics.push(diagnostic('invalid-sort', 'Cada orden debe elegir exactamente fieldId o systemField.', path))
      return
    }
    if (sort.fieldId) {
      const field = cms.fields[sort.fieldId]
      if (!field || field.owner.kind !== 'content-type' || field.owner.contentTypeId !== query.contentTypeId) {
        diagnostics.push(diagnostic('invalid-sort', 'El campo de orden debe pertenecer al tipo consultado.', [...path, 'fieldId']))
      } else if (COMPLEX_SORT_TYPES.has(field.type)) {
        diagnostics.push(diagnostic('invalid-sort', `El campo ${field.label} no tiene un orden escalar determinista.`, [...path, 'fieldId']))
      }
    }
  })

  return diagnostics.length > 0 ? failure(diagnostics) : success(query)
}

export function executeCmsQuery(cms: CmsBackend, input: unknown): Result<QueryExecutionResult, readonly QueryEngineDiagnostic[]> {
  const validated = validateQueryDefinition(cms, input)
  if (!validated.ok) return validated
  const query = validated.value
  const matched = Object.values(cms.records)
    .filter((record) => queryMatches(cms, query, record))
    .sort((left, right) => compareRecords(query, left, right))
  const records = matched.slice(query.offset, query.offset + query.limit)
  return success({
    limit: query.limit,
    offset: query.offset,
    pageSize: query.pageSize,
    queryId: query.id,
    records,
    totalMatched: matched.length,
  })
}

export function executeSavedCmsQuery(cms: CmsBackend, queryId: QueryId): Result<QueryExecutionResult, readonly QueryEngineDiagnostic[]> {
  const query = cms.queries[queryId]
  if (!query) return failure([diagnostic('query-not-found', `La consulta ${queryId} no existe.`, ['queries', queryId])])
  return executeCmsQuery(cms, query)
}
