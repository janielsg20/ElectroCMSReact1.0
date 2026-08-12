import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from '../../domain/project/cms-defaults'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseQueryId,
  parseTimestamp,
  type CmsBackend,
  type Query,
} from '../../domain'
import { CmsListingRuntimeCache } from './listing-runtime-cache'

const contentTypeId = parseContentTypeId('51000000-0000-4000-8000-000000000001')
const queryId = parseQueryId('52000000-0000-4000-8000-000000000001')
const alphaId = parseContentRecordId('53000000-0000-4000-8000-000000000001')
const betaId = parseContentRecordId('53000000-0000-4000-8000-000000000002')
const gammaId = parseContentRecordId('53000000-0000-4000-8000-000000000003')

function fixture(): CmsBackend {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: contentTypeId,
    order: 1,
    pluralName: 'Entradas',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Entrada',
    slug: 'entries',
    supports: [],
    taxonomyIds: [],
  }
  const rows = [
    [alphaId, 'published'],
    [betaId, 'published'],
    [gammaId, 'draft'],
  ] as const
  rows.forEach(([id, status], index) => {
    const day = String(index + 1).padStart(2, '0')
    cms.records[id] = {
      authorId: null,
      contentTypeId,
      createdAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      id,
      status,
      taxonomyTermIds: [],
      updatedAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      values: {},
    }
  })
  return cms
}

function query(): Query {
  return {
    contentTypeId,
    groups: [{
      operator: 'all',
      predicates: [{ fieldId: null, operator: 'equals', relationId: null, source: 'status', taxonomyId: null, value: 'published' }],
    }],
    id: queryId,
    limit: 20,
    name: 'Publicadas',
    offset: 0,
    pageSize: 1,
    sorts: [{ direction: 'asc', fieldId: null, systemField: 'id' }],
  }
}

describe('M10.5 CmsListingRuntimeCache', () => {
  it('reutiliza el mismo resultado e índice para una ejecución idéntica', () => {
    let clock = 0
    const cache = new CmsListingRuntimeCache({ now: () => ++clock })
    const cms = fixture()

    const first = cache.execute(cms, query(), { page: 1, pageSize: 1 })
    const second = cache.execute(cms, query(), { page: 1, pageSize: 1 })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(first.value.listing.records.map((record) => record.id)).toEqual([alphaId])
    expect(first.value.performance).toMatchObject({ cacheHit: false, candidateRecords: 2, indexUsed: true, sourceRecords: 3 })
    expect(second.value.performance).toMatchObject({ cacheHit: true, candidateRecords: 2, indexUsed: true, sourceRecords: 3 })
    expect(second.value.listing).toBe(first.value.listing)
  })

  it('invalida índice y resultados al recibir una nueva identidad CMS', () => {
    const cache = new CmsListingRuntimeCache()
    const cms = fixture()
    const first = cache.execute(cms, query())
    const cloned = structuredClone(cms)
    const second = cache.execute(cloned, query())

    expect(first.ok && first.value.performance.cacheHit).toBe(false)
    expect(second.ok && second.value.performance.cacheHit).toBe(false)
  })

  it('mantiene la política LRU limitada', () => {
    const cache = new CmsListingRuntimeCache({ maxEntries: 1 })
    const cms = fixture()
    const first = cache.execute(cms, query(), { page: 1, pageSize: 1 })
    const alternate = cache.execute(cms, query(), { page: 1, pageSize: 2 })
    const again = cache.execute(cms, query(), { page: 1, pageSize: 1 })

    expect(first.ok && first.value.performance.cacheHit).toBe(false)
    expect(alternate.ok && alternate.value.performance.cacheHit).toBe(false)
    expect(again.ok && again.value.performance.cacheHit).toBe(false)
  })
})