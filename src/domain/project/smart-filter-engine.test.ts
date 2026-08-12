import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseQueryId,
  parseTaxonomyId,
  parseTaxonomyTermId,
  parseTimestamp,
} from './identity'
import { executeCmsQuery } from './query-engine'
import { composeSmartFilteredQuery } from './smart-filter-engine'

const contentTypeId = parseContentTypeId('31000000-0000-4000-8000-000000000001')
const titleFieldId = parseFieldDefinitionId('32000000-0000-4000-8000-000000000001')
const priceFieldId = parseFieldDefinitionId('32000000-0000-4000-8000-000000000002')
const taxonomyId = parseTaxonomyId('33000000-0000-4000-8000-000000000001')
const newsTermId = parseTaxonomyTermId('34000000-0000-4000-8000-000000000001')
const guideTermId = parseTaxonomyTermId('34000000-0000-4000-8000-000000000002')
const queryId = parseQueryId('35000000-0000-4000-8000-000000000001')
const alphaId = parseContentRecordId('36000000-0000-4000-8000-000000000001')
const betaId = parseContentRecordId('36000000-0000-4000-8000-000000000002')
const gammaId = parseContentRecordId('36000000-0000-4000-8000-000000000003')

function fixture() {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [titleFieldId, priceFieldId],
    icon: 'content',
    id: contentTypeId,
    order: 1,
    pluralName: 'Entradas',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Entrada',
    slug: 'entries',
    supports: ['custom-fields'],
    taxonomyIds: [taxonomyId],
  }
  cms.fields[titleFieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: '', description: '', group: '', id: titleFieldId, key: 'title', label: 'Título', options: [], order: 1,
    owner: { contentTypeId, kind: 'content-type' }, placeholder: '', relationId: null, required: false, taxonomyId: null, type: 'text', validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  cms.fields[priceFieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: 0, description: '', group: '', id: priceFieldId, key: 'price', label: 'Precio', options: [], order: 2,
    owner: { contentTypeId, kind: 'content-type' }, placeholder: '', relationId: null, required: false, taxonomyId: null, type: 'number', validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  cms.taxonomies[taxonomyId] = { archiveTemplateId: null, contentTypeIds: [contentTypeId], description: '', fieldIds: [], hierarchical: false, id: taxonomyId, name: 'Categorías', slug: 'categories' }
  cms.taxonomyTerms[newsTermId] = { description: '', id: newsTermId, name: 'Noticias', parentId: null, slug: 'news', taxonomyId, values: {} }
  cms.taxonomyTerms[guideTermId] = { description: '', id: guideTermId, name: 'Guías', parentId: null, slug: 'guides', taxonomyId, values: {} }
  const records = [
    [alphaId, 'Alpha', 10, newsTermId, '2026-08-01T10:00:00.000Z'],
    [betaId, 'Beta', 20, newsTermId, '2026-08-02T10:00:00.000Z'],
    [gammaId, 'Gamma', 30, guideTermId, '2026-08-03T10:00:00.000Z'],
  ] as const
  for (const [id, title, price, termId, createdAt] of records) {
    cms.records[id] = { authorId: null, contentTypeId, createdAt: parseTimestamp(createdAt), id, status: 'published', taxonomyTermIds: [termId], updatedAt: parseTimestamp(createdAt), values: { [priceFieldId]: price, [titleFieldId]: title } }
  }
  cms.queries[queryId] = { contentTypeId, groups: [], id: queryId, limit: 10, name: 'Entradas', offset: 0, pageSize: 2, sorts: [{ direction: 'asc', fieldId: null, systemField: 'id' }] }
  return cms
}

describe('M10.4 smart filter engine', () => {
  it('busca en campos textuales sin exigir un campo explícito', () => {
    const cms = fixture()
    const composed = composeSmartFilteredQuery(cms, queryId, [{ id: 'search', kind: 'search', value: 'Beta' }])
    expect(composed.ok).toBe(true)
    if (!composed.ok) return
    const result = executeCmsQuery(cms, composed.value.query)
    expect(result.ok && result.value.records.map((record) => record.id)).toEqual([betaId])
  })

  it('combina rango y taxonomía sobre la query guardada', () => {
    const cms = fixture()
    const composed = composeSmartFilteredQuery(cms, queryId, [
      { fieldId: priceFieldId, id: 'range', kind: 'range', value: { max: 25, min: 15 } },
      { id: 'taxonomy', kind: 'taxonomy', taxonomyId, value: [newsTermId] },
    ])
    expect(composed.ok).toBe(true)
    if (!composed.ok) return
    expect(composed.value.activeCount).toBe(2)
    const result = executeCmsQuery(cms, composed.value.query)
    expect(result.ok && result.value.records.map((record) => record.id)).toEqual([betaId])
  })

  it('aplica fecha y orden transitorios sin mutar la query base', () => {
    const cms = fixture()
    const before = structuredClone(cms.queries[queryId])
    const byDate = composeSmartFilteredQuery(cms, queryId, [{ dateField: 'createdAt', id: 'date', kind: 'date', value: '2026-08-03' }])
    expect(byDate.ok).toBe(true)
    if (byDate.ok) {
      const result = executeCmsQuery(cms, byDate.value.query)
      expect(result.ok && result.value.records.map((record) => record.id)).toEqual([gammaId])
    }
    const sorted = composeSmartFilteredQuery(cms, queryId, [{ id: 'sort', kind: 'sort', value: `field:${priceFieldId}:desc` }])
    expect(sorted.ok).toBe(true)
    if (sorted.ok) {
      const result = executeCmsQuery(cms, sorted.value.query)
      expect(result.ok && result.value.records.map((record) => record.id)).toEqual([gammaId, betaId, alphaId])
    }
    expect(cms.queries[queryId]).toEqual(before)
  })

  it('diagnostica destinos inválidos antes de ejecutar', () => {
    const cms = fixture()
    const composed = composeSmartFilteredQuery(cms, queryId, [{ fieldId: 'not-a-field', id: 'range', kind: 'range', value: [0, 20] }])
    expect(composed).toMatchObject({ ok: false, error: [{ code: 'invalid-filter-target', filterId: 'range' }] })
  })
})
