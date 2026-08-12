import type { CmsBackend, Query } from './cms-schema'
import type { ContentRecordId, ContentTypeId, FieldDefinitionId, TaxonomyTermId } from './identity'
import type { JsonValue } from './project-envelope'

type QueryPredicate = Query['groups'][number]['predicates'][number]

export interface CmsQueryIndex {
  readonly source: CmsBackend
  readonly totalRecords: number
  readonly byContentType: ReadonlyMap<ContentTypeId, ReadonlySet<ContentRecordId>>
  readonly byAuthor: ReadonlyMap<string, ReadonlySet<ContentRecordId>>
  readonly byStatus: ReadonlyMap<string, ReadonlySet<ContentRecordId>>
  readonly byFieldValue: ReadonlyMap<FieldDefinitionId, ReadonlyMap<string, ReadonlySet<ContentRecordId>>>
  readonly byTaxonomyTerm: ReadonlyMap<TaxonomyTermId, ReadonlySet<ContentRecordId>>
}

export interface QueryCandidateSelection {
  readonly candidateIds: readonly ContentRecordId[]
  readonly indexUsed: boolean
  readonly sourceRecords: number
}

function scalarKey(value: JsonValue | undefined): string | null {
  if (value === undefined) return null
  if (value === null) return 'null:'
  if (typeof value === 'string') return `string:${value}`
  if (typeof value === 'number') return Number.isFinite(value) ? `number:${value}` : null
  if (typeof value === 'boolean') return `boolean:${value ? '1' : '0'}`
  return null
}

function authorKey(value: JsonValue): string | null {
  if (value === null) return 'null:'
  return typeof value === 'string' ? value : null
}

function addToNestedIndex<K>(map: Map<K, Set<ContentRecordId>>, key: K, recordId: ContentRecordId): void {
  const bucket = map.get(key) ?? new Set<ContentRecordId>()
  bucket.add(recordId)
  map.set(key, bucket)
}

export function buildCmsQueryIndex(cms: CmsBackend): CmsQueryIndex {
  const byContentType = new Map<ContentTypeId, Set<ContentRecordId>>()
  const byAuthor = new Map<string, Set<ContentRecordId>>()
  const byStatus = new Map<string, Set<ContentRecordId>>()
  const mutableFields = new Map<FieldDefinitionId, Map<string, Set<ContentRecordId>>>()
  const byTaxonomyTerm = new Map<TaxonomyTermId, Set<ContentRecordId>>()
  const records = Object.values(cms.records)

  for (const record of records) {
    addToNestedIndex(byContentType, record.contentTypeId, record.id)
    addToNestedIndex(byStatus, scalarKey(record.status) ?? record.status, record.id)
    addToNestedIndex(byAuthor, record.authorId ?? 'null:', record.id)
    for (const termId of record.taxonomyTermIds) addToNestedIndex(byTaxonomyTerm, termId, record.id)
    for (const [fieldId, value] of Object.entries(record.values)) {
      const key = scalarKey(value)
      if (key === null) continue
      const fieldMap = mutableFields.get(fieldId as FieldDefinitionId) ?? new Map<string, Set<ContentRecordId>>()
      addToNestedIndex(fieldMap, key, record.id)
      mutableFields.set(fieldId as FieldDefinitionId, fieldMap)
    }
  }

  return {
    byAuthor,
    byContentType,
    byFieldValue: mutableFields,
    byStatus,
    byTaxonomyTerm,
    source: cms,
    totalRecords: records.length,
  }
}

function union(sets: readonly ReadonlySet<ContentRecordId>[]): Set<ContentRecordId> {
  const result = new Set<ContentRecordId>()
  for (const set of sets) for (const id of set) result.add(id)
  return result
}

function intersect(sets: readonly ReadonlySet<ContentRecordId>[]): Set<ContentRecordId> {
  if (sets.length === 0) return new Set<ContentRecordId>()
  const [first, ...rest] = [...sets].sort((left, right) => left.size - right.size)
  const result = new Set<ContentRecordId>()
  for (const id of first ?? []) if (rest.every((set) => set.has(id))) result.add(id)
  return result
}

function bucketsForOperand(
  index: ReadonlyMap<string, ReadonlySet<ContentRecordId>>,
  operand: JsonValue,
): readonly ReadonlySet<ContentRecordId>[] | null {
  const values = Array.isArray(operand) ? operand : [operand]
  const buckets: ReadonlySet<ContentRecordId>[] = []
  for (const value of values) {
    const key = scalarKey(value)
    if (key === null) return null
    buckets.push(index.get(key) ?? new Set<ContentRecordId>())
  }
  return buckets
}

function predicateCandidates(index: CmsQueryIndex, predicate: QueryPredicate): ReadonlySet<ContentRecordId> | null {
  if (predicate.operator !== 'equals' && predicate.operator !== 'in') return null

  if (predicate.source === 'status') {
    const buckets = bucketsForOperand(index.byStatus, predicate.value)
    return buckets ? union(buckets) : null
  }
  if (predicate.source === 'author') {
    const values = Array.isArray(predicate.value) ? predicate.value : [predicate.value]
    const keys = values.map(authorKey)
    if (keys.some((key) => key === null)) return null
    return union(keys.map((key) => index.byAuthor.get(key ?? 'null:') ?? new Set<ContentRecordId>()))
  }
  if (predicate.source === 'field' && predicate.fieldId) {
    // Complex values are intentionally not indexed. Validate indexability before
    // interpreting a missing field bucket as "no matches", otherwise an object
    // equality predicate could be narrowed incorrectly to an empty result.
    const probe = bucketsForOperand(new Map<string, ReadonlySet<ContentRecordId>>(), predicate.value)
    if (probe === null) return null
    const fieldIndex = index.byFieldValue.get(predicate.fieldId)
    if (!fieldIndex) return new Set<ContentRecordId>()
    const buckets = bucketsForOperand(fieldIndex, predicate.value)
    return buckets ? union(buckets) : null
  }
  if (predicate.source === 'taxonomy' && predicate.taxonomyId) {
    const values = Array.isArray(predicate.value) ? predicate.value : [predicate.value]
    if (values.some((value) => typeof value !== 'string')) return null
    return union(values.map((value) => index.byTaxonomyTerm.get(value as TaxonomyTermId) ?? new Set<ContentRecordId>()))
  }
  return null
}

/**
 * Reduce el conjunto candidato sin decidir el resultado final. La semántica se
 * conserva en `query-engine`: el índice solo puede devolver un superconjunto
 * seguro que luego se valida con los mismos predicados canónicos.
 */
export function selectQueryCandidates(index: CmsQueryIndex, query: Query): QueryCandidateSelection {
  const contentTypeSet = index.byContentType.get(query.contentTypeId) ?? new Set<ContentRecordId>()
  const groupSets: ReadonlySet<ContentRecordId>[] = []
  let indexUsed = false

  for (const group of query.groups) {
    const candidates = group.predicates.map((item) => predicateCandidates(index, item))
    if (group.operator === 'all') {
      const indexable = candidates.filter((item): item is ReadonlySet<ContentRecordId> => item !== null)
      if (indexable.length > 0) {
        groupSets.push(intersect(indexable))
        indexUsed = true
      }
    } else if (candidates.length > 0 && candidates.every((item): item is ReadonlySet<ContentRecordId> => item !== null)) {
      groupSets.push(union(candidates))
      indexUsed = true
    }
  }

  const candidateSet = groupSets.length > 0 ? intersect([contentTypeSet, ...groupSets]) : contentTypeSet
  return {
    candidateIds: [...candidateSet],
    indexUsed,
    sourceRecords: contentTypeSet.size,
  }
}
