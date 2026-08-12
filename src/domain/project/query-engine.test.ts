import { describe, expect, it } from 'vitest'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseQueryId,
  parseRelationEntryId,
  parseRelationId,
  parseRoleId,
  parseTaxonomyId,
  parseTaxonomyTermId,
  parseTimestamp,
  parseUserId,
} from './identity'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { CmsBackend, Query } from './cms-schema'
import { executeCmsQuery, executeSavedCmsQuery, validateQueryDefinition } from './query-engine'
import type { JsonValue } from './project-envelope'

const articleTypeId = parseContentTypeId('10000000-0000-4000-8000-000000000001')
const brandTypeId = parseContentTypeId('10000000-0000-4000-8000-000000000002')
const titleFieldId = parseFieldDefinitionId('20000000-0000-4000-8000-000000000001')
const priceFieldId = parseFieldDefinitionId('20000000-0000-4000-8000-000000000002')
const specsFieldId = parseFieldDefinitionId('20000000-0000-4000-8000-000000000003')
const colorFieldId = parseFieldDefinitionId('20000000-0000-4000-8000-000000000004')
const categoryTaxonomyId = parseTaxonomyId('30000000-0000-4000-8000-000000000001')
const newsTermId = parseTaxonomyTermId('40000000-0000-4000-8000-000000000001')
const sportTermId = parseTaxonomyTermId('40000000-0000-4000-8000-000000000002')
const articleAId = parseContentRecordId('50000000-0000-4000-8000-000000000001')
const articleBId = parseContentRecordId('50000000-0000-4000-8000-000000000002')
const articleCId = parseContentRecordId('50000000-0000-4000-8000-000000000003')
const brandRecordId = parseContentRecordId('50000000-0000-4000-8000-000000000004')
const relationId = parseRelationId('60000000-0000-4000-8000-000000000001')
const relationEntryAId = parseRelationEntryId('70000000-0000-4000-8000-000000000001')
const relationEntryCId = parseRelationEntryId('70000000-0000-4000-8000-000000000002')
const roleId = parseRoleId('80000000-0000-4000-8000-000000000001')
const authorAId = parseUserId('90000000-0000-4000-8000-000000000001')
const authorBId = parseUserId('90000000-0000-4000-8000-000000000002')
const queryId = parseQueryId('a0000000-0000-4000-8000-000000000001')

function field(id: typeof titleFieldId, key: string, label: string, type: 'text' | 'number', order: number) {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: null,
    description: '',
    group: '',
    id,
    key,
    label,
    options: [],
    order,
    owner: { contentTypeId: articleTypeId, kind: 'content-type' as const },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type,
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
}

function cmsFixture(): CmsBackend {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[articleTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [titleFieldId, priceFieldId, specsFieldId, colorFieldId],
    icon: 'content',
    id: articleTypeId,
    order: 10,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: ['custom-fields'],
    taxonomyIds: [categoryTaxonomyId],
  }
  cms.contentTypes[brandTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: brandTypeId,
    order: 20,
    pluralName: 'Marcas',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Marca',
    slug: 'brands',
    supports: [],
    taxonomyIds: [],
  }
  cms.fields[titleFieldId] = field(titleFieldId, 'title', 'Título', 'text', 10)
  cms.fields[priceFieldId] = field(priceFieldId, 'price', 'Precio', 'number', 20)
  cms.fields[colorFieldId] = field(colorFieldId, 'color', 'Color', 'text', 40)
  cms.fields[specsFieldId] = {
    ...field(specsFieldId, 'specs', 'Especificaciones', 'text', 30),
    childFieldIds: [colorFieldId],
    type: 'repeater',
  }
  cms.taxonomies[categoryTaxonomyId] = {
    archiveTemplateId: null,
    contentTypeIds: [articleTypeId],
    description: '',
    fieldIds: [],
    hierarchical: false,
    id: categoryTaxonomyId,
    pluralName: 'Categorías',
    singularName: 'Categoría',
    slug: 'categories',
  }
  cms.taxonomyTerms[newsTermId] = {
    description: '', id: newsTermId, name: 'Noticias', parentId: null, slug: 'news', taxonomyId: categoryTaxonomyId, values: {},
  }
  cms.taxonomyTerms[sportTermId] = {
    description: '', id: sportTermId, name: 'Deporte', parentId: null, slug: 'sport', taxonomyId: categoryTaxonomyId, values: {},
  }
  cms.roles[roleId] = {
    capabilities: ['content.read'], contentTypes: {}, dashboardIds: [], fields: {}, id: roleId, name: 'Editor', routes: [], slug: 'editor',
  }
  cms.users[authorAId] = { displayName: 'Ana', email: 'ana@example.com', id: authorAId, roleIds: [roleId], status: 'active' }
  cms.users[authorBId] = { displayName: 'Bruno', email: 'bruno@example.com', id: authorBId, roleIds: [roleId], status: 'active' }

  const row = (color: string): JsonValue => ({ [colorFieldId]: color })
  cms.records[articleAId] = {
    authorId: authorAId,
    contentTypeId: articleTypeId,
    createdAt: parseTimestamp('2026-01-10T00:00:00.000Z'),
    id: articleAId,
    status: 'published',
    taxonomyTermIds: [newsTermId],
    updatedAt: parseTimestamp('2026-01-15T00:00:00.000Z'),
    values: { [priceFieldId]: 30, [specsFieldId]: [row('red')], [titleFieldId]: 'Pro Alpha' },
  }
  cms.records[articleBId] = {
    authorId: authorBId,
    contentTypeId: articleTypeId,
    createdAt: parseTimestamp('2026-02-10T00:00:00.000Z'),
    id: articleBId,
    status: 'published',
    taxonomyTermIds: [sportTermId],
    updatedAt: parseTimestamp('2026-02-11T00:00:00.000Z'),
    values: { [priceFieldId]: 20, [specsFieldId]: [row('blue')], [titleFieldId]: 'Beta' },
  }
  cms.records[articleCId] = {
    authorId: authorAId,
    contentTypeId: articleTypeId,
    createdAt: parseTimestamp('2026-03-10T00:00:00.000Z'),
    id: articleCId,
    status: 'draft',
    taxonomyTermIds: [newsTermId],
    updatedAt: parseTimestamp('2026-03-12T00:00:00.000Z'),
    values: { [priceFieldId]: 50, [specsFieldId]: [row('red'), row('blue')], [titleFieldId]: 'Gamma' },
  }
  cms.records[brandRecordId] = {
    authorId: null,
    contentTypeId: brandTypeId,
    createdAt: parseTimestamp('2026-01-01T00:00:00.000Z'),
    id: brandRecordId,
    status: 'published',
    taxonomyTermIds: [],
    updatedAt: parseTimestamp('2026-01-01T00:00:00.000Z'),
    values: {},
  }
  cms.relations[relationId] = {
    cardinality: 'many-to-many', id: relationId, name: 'Marca', slug: 'brand', sourceContentTypeId: articleTypeId, targetContentTypeId: brandTypeId,
  }
  cms.relationEntries[relationEntryAId] = { id: relationEntryAId, relationId, sourceRecordId: articleAId, targetRecordId: brandRecordId }
  cms.relationEntries[relationEntryCId] = { id: relationEntryCId, relationId, sourceRecordId: articleCId, targetRecordId: brandRecordId }
  return cms
}

type Predicate = Query['groups'][number]['predicates'][number]

function predicate(
  source: Predicate['source'],
  operator: Predicate['operator'],
  value: JsonValue,
  references: Partial<Pick<Predicate, 'fieldId' | 'taxonomyId' | 'relationId'>> = {},
): Predicate {
  return {
    fieldId: null,
    relationId: null,
    taxonomyId: null,
    ...references,
    operator,
    source,
    value,
  }
}

function query(
  groups: Query['groups'],
  sorts: Query['sorts'] = [],
  pagination: Partial<Pick<Query, 'limit' | 'offset' | 'pageSize'>> = {},
): Query {
  return {
    contentTypeId: articleTypeId,
    groups,
    id: queryId,
    limit: 100,
    name: 'Consulta de artículos',
    offset: 0,
    pageSize: 20,
    sorts,
    ...pagination,
  }
}

function resultIds(result: ReturnType<typeof executeCmsQuery>): readonly string[] {
  if (!result.ok) throw new Error(result.error.map((item) => item.message).join(' '))
  return result.value.records.map((record) => record.id)
}

describe('M10.1 query engine', () => {
  it('combina grupos AND y predicados OR con campos y taxonomía', () => {
    const cms = cmsFixture()
    const executed = executeCmsQuery(cms, query([
      {
        operator: 'all',
        predicates: [
          predicate('status', 'equals', 'published'),
          predicate('field', 'greater-than', 15, { fieldId: priceFieldId }),
        ],
      },
      {
        operator: 'any',
        predicates: [
          predicate('field', 'contains', 'Pro', { fieldId: titleFieldId }),
          predicate('taxonomy', 'equals', newsTermId, { taxonomyId: categoryTaxonomyId }),
        ],
      },
    ]))

    expect(resultIds(executed)).toEqual([articleAId])
  })

  it('filtra autor y fechas createdAt/updatedAt con between', () => {
    const cms = cmsFixture()
    const executed = executeCmsQuery(cms, query([{
      operator: 'all',
      predicates: [
        predicate('author', 'equals', authorAId),
        predicate('date', 'between', {
          field: 'updatedAt',
          value: ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'],
        }),
      ],
    }]))

    expect(resultIds(executed)).toEqual([articleAId])
  })

  it('consulta relaciones y rutas dentro de repeaters', () => {
    const cms = cmsFixture()
    const executed = executeCmsQuery(cms, query([{
      operator: 'all',
      predicates: [
        predicate('relation', 'equals', brandRecordId, { relationId }),
        predicate('repeater', 'contains', { path: [colorFieldId], value: 'red' }, { fieldId: specsFieldId }),
      ],
    }]))

    expect(resultIds(executed)).toEqual([articleAId, articleCId])
  })

  it('ordena de forma estable y aplica offset/limit después del filtrado', () => {
    const cms = cmsFixture()
    const executed = executeCmsQuery(cms, query([], [
      { direction: 'desc', fieldId: priceFieldId, systemField: null },
    ], { limit: 1, offset: 1, pageSize: 1 }))

    expect(resultIds(executed)).toEqual([articleAId])
    if (!executed.ok) throw new Error('La consulta debería ser válida.')
    expect(executed.value.totalMatched).toBe(3)
    expect(executed.value).toMatchObject({ limit: 1, offset: 1, pageSize: 1 })
  })

  it('valida referencias exclusivas, tipos repeater y formas de operadores', () => {
    const cms = cmsFixture()
    const invalid = validateQueryDefinition(cms, query([{
      operator: 'all',
      predicates: [
        predicate('repeater', 'contains', 'red', { fieldId: titleFieldId }),
        predicate('status', 'in', 'published'),
        predicate('field', 'equals', 'x', { fieldId: titleFieldId, taxonomyId: categoryTaxonomyId }),
      ],
    }]))

    expect(invalid.ok).toBe(false)
    if (!invalid.ok) {
      expect(invalid.error.some((item) => item.message.includes('tipo repeater'))).toBe(true)
      expect(invalid.error.some((item) => item.message.includes('requiere una lista'))).toBe(true)
      expect(invalid.error.some((item) => item.message.includes('no debe declarar taxonomyId'))).toBe(true)
    }
  })

  it('ejecuta consultas guardadas por QueryId y diagnostica IDs ausentes', () => {
    const cms = cmsFixture()
    cms.queries[queryId] = query([{
      operator: 'all',
      predicates: [predicate('taxonomy', 'in', [newsTermId], { taxonomyId: categoryTaxonomyId })],
    }])

    expect(resultIds(executeSavedCmsQuery(cms, queryId))).toEqual([articleAId, articleCId])
    const missing = executeSavedCmsQuery(cms, parseQueryId('a0000000-0000-4000-8000-000000000099'))
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.error[0]?.code).toBe('query-not-found')
  })
})
