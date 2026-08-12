import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { CmsBackend } from './cms-schema'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseQueryId,
  parseTimestamp,
} from './identity'
import { executeCmsListing } from './listing-engine'

const contentTypeId = parseContentTypeId('11000000-0000-4000-8000-000000000001')
const queryId = parseQueryId('12000000-0000-4000-8000-000000000001')
const recordIds = [
  parseContentRecordId('13000000-0000-4000-8000-000000000001'),
  parseContentRecordId('13000000-0000-4000-8000-000000000002'),
  parseContentRecordId('13000000-0000-4000-8000-000000000003'),
  parseContentRecordId('13000000-0000-4000-8000-000000000004'),
  parseContentRecordId('13000000-0000-4000-8000-000000000005'),
] as const

function cmsFixture(): CmsBackend {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: contentTypeId,
    order: 10,
    pluralName: 'Entradas',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Entrada',
    slug: 'entries',
    supports: [],
    taxonomyIds: [],
  }

  recordIds.forEach((id, index) => {
    const day = String(index + 1).padStart(2, '0')
    cms.records[id] = {
      authorId: null,
      contentTypeId,
      createdAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      id,
      status: 'published',
      taxonomyTermIds: [],
      updatedAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      values: {},
    }
  })

  cms.queries[queryId] = {
    contentTypeId,
    groups: [],
    id: queryId,
    limit: 3,
    name: 'Últimas entradas',
    offset: 1,
    pageSize: 2,
    sorts: [{ direction: 'asc', fieldId: null, systemField: 'id' }],
  }
  return cms
}

describe('M10.3 listing engine', () => {
  it('pagina dentro de la ventana offset/limit de la query guardada', () => {
    const cms = cmsFixture()
    const first = executeCmsListing(cms, { page: 1, queryId })
    const second = executeCmsListing(cms, { page: 2, queryId })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) throw new Error('Los listings deberían ser válidos.')

    expect(first.value.records.map((record) => record.id)).toEqual([recordIds[1], recordIds[2]])
    expect(second.value.records.map((record) => record.id)).toEqual([recordIds[3]])
    expect(first.value).toMatchObject({
      availableCount: 3,
      hasNextPage: true,
      hasPreviousPage: false,
      page: 1,
      pageCount: 2,
      pageSize: 2,
      totalMatched: 5,
    })
    expect(second.value).toMatchObject({ hasNextPage: false, hasPreviousPage: true, page: 2 })
  })

  it('permite pageSize de presentación sin modificar la query persistida', () => {
    const cms = cmsFixture()
    const result = executeCmsListing(cms, { page: 2, pageSize: 1, queryId })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('El listing debería ser válido.')
    expect(result.value.records.map((record) => record.id)).toEqual([recordIds[2]])
    expect(result.value.pageCount).toBe(3)
    expect(cms.queries[queryId]?.pageSize).toBe(2)
  })

  it('devuelve estado vacío determinista para una página fuera de rango', () => {
    const result = executeCmsListing(cmsFixture(), { page: 4, queryId })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Una página fuera de rango no corrompe la query.')
    expect(result.value.records).toEqual([])
    expect(result.value.pageCount).toBe(2)
    expect(result.value.hasPreviousPage).toBe(true)
  })

  it('diagnostica query, página y tamaño inválidos', () => {
    const cms = cmsFixture()
    const missing = executeCmsListing(cms, { queryId: 'not-a-query-id' })
    const invalidPage = executeCmsListing(cms, { page: 0, queryId })
    const invalidPageSize = executeCmsListing(cms, { pageSize: 1_001, queryId })

    expect(missing.ok).toBe(false)
    expect(invalidPage.ok).toBe(false)
    expect(invalidPageSize.ok).toBe(false)
    if (!missing.ok) expect(missing.error[0]?.code).toBe('query-not-found')
    if (!invalidPage.ok) expect(invalidPage.error[0]?.code).toBe('invalid-page')
    if (!invalidPageSize.ok) expect(invalidPageSize.error[0]?.code).toBe('invalid-page-size')
  })
})
