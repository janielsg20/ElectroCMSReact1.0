import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { CmsBackend, Query } from './cms-schema'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseQueryId,
  parseTimestamp,
} from './identity'
import { executeCmsQuery } from './query-engine'
import { buildCmsQueryIndex } from './query-index'

const articleTypeId = parseContentTypeId('41000000-0000-4000-8000-000000000001')
const otherTypeId = parseContentTypeId('41000000-0000-4000-8000-000000000002')
const segmentFieldId = parseFieldDefinitionId('42000000-0000-4000-8000-000000000001')
const queryId = parseQueryId('43000000-0000-4000-8000-000000000001')
const alphaId = parseContentRecordId('44000000-0000-4000-8000-000000000001')
const betaId = parseContentRecordId('44000000-0000-4000-8000-000000000002')
const gammaId = parseContentRecordId('44000000-0000-4000-8000-000000000003')
const otherId = parseContentRecordId('44000000-0000-4000-8000-000000000004')

function fixture(): CmsBackend {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[articleTypeId] = {
    archiveTemplateId: null, capabilities: ['content.read'], description: '', fieldIds: [segmentFieldId], icon: 'content', id: articleTypeId, order: 1,
    pluralName: 'Artículos', public: true, showInMenu: true, singleTemplateId: null, singularName: 'Artículo', slug: 'articles', supports: ['custom-fields'], taxonomyIds: [],
  }
  cms.contentTypes[otherTypeId] = {
    archiveTemplateId: null, capabilities: ['content.read'], description: '', fieldIds: [], icon: 'content', id: otherTypeId, order: 2,
    pluralName: 'Otros', public: true, showInMenu: true, singleTemplateId: null, singularName: 'Otro', slug: 'others', supports: [], taxonomyIds: [],
  }
  cms.fields[segmentFieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: '', description: '', group: '', id: segmentFieldId,
    key: 'segment', label: 'Segmento', options: [], order: 1, owner: { contentTypeId: articleTypeId, kind: 'content-type' }, placeholder: '', relationId: null,
    required: false, taxonomyId: null, type: 'text', validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  const rows = [
    [alphaId, articleTypeId, 'published', 'alpha'],
    [betaId, articleTypeId, 'published', 'beta'],
    [gammaId, articleTypeId, 'draft', 'beta'],
    [otherId, otherTypeId, 'published', 'beta'],
  ] as const
  rows.forEach(([id, contentTypeId, status, segment], index) => {
    const day = String(index + 1).padStart(2, '0')
    cms.records[id] = {
      authorId: null,
      contentTypeId,
      createdAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      id,
      status,
      taxonomyTermIds: [],
      updatedAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      values: contentTypeId === articleTypeId ? { [segmentFieldId]: segment } : {},
    }
  })
  return cms
}

function query(operator: 'equals' | 'contains' = 'equals'): Query {
  return {
    contentTypeId: articleTypeId,
    groups: [{
      operator: 'all',
      predicates: [
        { fieldId: null, operator: 'equals', relationId: null, source: 'status', taxonomyId: null, value: 'published' },
        { fieldId: segmentFieldId, operator, relationId: null, source: 'field', taxonomyId: null, value: 'beta' },
      ],
    }],
    id: queryId,
    limit: 20,
    name: 'Artículos beta',
    offset: 0,
    pageSize: 20,
    sorts: [],
  }
}

function ids(result: ReturnType<typeof executeCmsQuery>): readonly string[] {
  if (!result.ok) throw new Error(result.error.map((item) => item.message).join(' '))
  return result.value.records.map((record) => record.id)
}

describe('M10.5 query index', () => {
  it('reduce candidatos medidos sin cambiar la semántica del Query Engine', () => {
    const cms = fixture()
    const input = query()
    const plain = executeCmsQuery(cms, input)
    const indexed = executeCmsQuery(cms, input, { index: buildCmsQueryIndex(cms) })

    expect(ids(indexed)).toEqual(ids(plain))
    expect(ids(indexed)).toEqual([betaId])
    if (!indexed.ok) throw new Error('La consulta indexada debería ser válida.')
    expect(indexed.value.metrics).toEqual({ candidateRecords: 1, indexUsed: true, sourceRecords: 3 })
  })

  it('usa el índice solo como prefiltro seguro cuando queda lógica no indexable', () => {
    const cms = fixture()
    const indexed = executeCmsQuery(cms, query('contains'), { index: buildCmsQueryIndex(cms) })

    expect(ids(indexed)).toEqual([betaId])
    if (!indexed.ok) throw new Error('La consulta debería ser válida.')
    expect(indexed.value.metrics).toMatchObject({ candidateRecords: 2, indexUsed: true, sourceRecords: 3 })
  })

  it('no produce falsos negativos para operandos complejos no indexables', () => {
    const cms = fixture()
    const beta = cms.records[betaId]
    if (!beta) throw new Error('Falta registro beta de prueba.')
    cms.records[betaId] = { ...beta, values: { ...beta.values, [segmentFieldId]: { code: 'beta' } } }
    const input: Query = {
      ...query(),
      groups: [{
        operator: 'all',
        predicates: [
          { fieldId: null, operator: 'equals', relationId: null, source: 'status', taxonomyId: null, value: 'published' },
          { fieldId: segmentFieldId, operator: 'equals', relationId: null, source: 'field', taxonomyId: null, value: { code: 'beta' } },
        ],
      }],
    }
    const plain = executeCmsQuery(cms, input)
    const indexed = executeCmsQuery(cms, input, { index: buildCmsQueryIndex(cms) })

    expect(ids(indexed)).toEqual(ids(plain))
    expect(ids(indexed)).toEqual([betaId])
    if (!indexed.ok) throw new Error('La consulta indexada debería ser válida.')
    expect(indexed.value.metrics).toMatchObject({ candidateRecords: 2, indexUsed: true, sourceRecords: 3 })
  })

  it('ignora índices construidos para otra instancia del backend', () => {
    const cms = fixture()
    const staleIndex = buildCmsQueryIndex(cms)
    const cloned = structuredClone(cms)
    const result = executeCmsQuery(cloned, query(), { index: staleIndex })

    expect(ids(result)).toEqual([betaId])
    if (!result.ok) throw new Error('La consulta debería ser válida.')
    expect(result.value.metrics).toEqual({ candidateRecords: 3, indexUsed: false, sourceRecords: 3 })
  })
})