import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { ContentRecord, ContentType, FieldDefinition, Relation, Taxonomy, TaxonomyTerm } from './cms-schema'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseContentRecordId,
  parseContentRecordRevisionId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseRelationEntryId,
  parseRelationId,
  parseTaxonomyId,
  parseTaxonomyTermId,
  parseTimestamp,
} from './identity'
import {
  createContentRecord,
  createRelation,
  createRelationEntry,
  deleteContentRecord,
  deleteRelation,
  deleteRelationEntry,
  listContentRecordRevisions,
  restoreContentRecordRevision,
  updateContentRecord,
  updateRelation,
} from './record-relation-engine'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'

const articleTypeId = parseContentTypeId('11111111-aaaa-4111-8111-111111111111')
const authorTypeId = parseContentTypeId('22222222-aaaa-4222-8222-222222222222')
const titleFieldId = parseFieldDefinitionId('33333333-aaaa-4333-8333-333333333333')
const priceFieldId = parseFieldDefinitionId('44444444-aaaa-4444-8444-444444444444')
const categoryTaxonomyId = parseTaxonomyId('55555555-aaaa-4555-8555-555555555555')
const categoryTermId = parseTaxonomyTermId('66666666-aaaa-4666-8666-666666666666')
const articleId = parseContentRecordId('77777777-aaaa-4777-8777-777777777777')
const secondArticleId = parseContentRecordId('88888888-aaaa-4888-8888-888888888888')
const authorId = parseContentRecordId('99999999-aaaa-4999-8999-999999999999')
const relationId = parseRelationId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const entryId = parseRelationEntryId('bbbbbbbb-aaaa-4bbb-8bbb-bbbbbbbbbbbb')
const revisionId = parseContentRecordRevisionId('cccccccc-aaaa-4ccc-8ccc-cccccccccccc')
const restoreBackupId = parseContentRecordRevisionId('dddddddd-aaaa-4ddd-8ddd-dddddddddddd')
const createdAt = parseTimestamp('2026-08-11T20:00:00.000Z')
const updatedAt = parseTimestamp('2026-08-11T20:10:00.000Z')
const restoredAt = parseTimestamp('2026-08-11T20:20:00.000Z')

function contentType(id: typeof articleTypeId, slug: string, revisions: boolean): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: id === articleTypeId ? [titleFieldId, priceFieldId] : [],
    icon: 'content',
    id,
    order: 10,
    pluralName: slug === 'articles' ? 'Artículos' : 'Autores',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: slug === 'articles' ? 'Artículo' : 'Autor',
    slug,
    supports: revisions ? ['title', 'custom-fields', 'revisions'] : ['title'],
    taxonomyIds: id === articleTypeId ? [categoryTaxonomyId] : [],
  }
}

function field(id: typeof titleFieldId, key: string, type: FieldDefinition['type'], required: boolean): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: type === 'number' ? 0 : '',
    description: '',
    group: '',
    id,
    key,
    label: key === 'title' ? 'Título' : 'Precio',
    options: [],
    order: 10,
    owner: { contentTypeId: articleTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required,
    taxonomyId: null,
    type,
    validation: type === 'number'
      ? { max: 1000, maxLength: null, min: 0, minLength: null, pattern: null }
      : { max: null, maxLength: 120, min: null, minLength: 2, pattern: null },
  }
}

function taxonomy(): Taxonomy {
  return {
    archiveTemplateId: null,
    contentTypeIds: [articleTypeId],
    description: '',
    fieldIds: [],
    hierarchical: true,
    id: categoryTaxonomyId,
    pluralName: 'Categorías',
    singularName: 'Categoría',
    slug: 'categories',
  }
}

function term(): TaxonomyTerm {
  return {
    description: '',
    id: categoryTermId,
    name: 'Arte',
    parentId: null,
    slug: 'arte',
    taxonomyId: categoryTaxonomyId,
    values: {},
  }
}

function structure(): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[articleTypeId] = contentType(articleTypeId, 'articles', true)
  cms.contentTypes[authorTypeId] = contentType(authorTypeId, 'authors', false)
  cms.fields[titleFieldId] = field(titleFieldId, 'title', 'text', true)
  cms.fields[priceFieldId] = field(priceFieldId, 'price', 'number', false)
  cms.taxonomies[categoryTaxonomyId] = taxonomy()
  cms.taxonomyTerms[categoryTermId] = term()
  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms,
    documents: {},
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

function article(
  id = articleId,
  status: ContentRecord['status'] = 'draft',
  values: ContentRecord['values'] = {},
): ContentRecord {
  return {
    authorId: null,
    contentTypeId: articleTypeId,
    createdAt,
    id,
    status,
    taxonomyTermIds: [categoryTermId],
    updatedAt: createdAt,
    values,
  }
}

function authorRecord(): ContentRecord {
  return {
    authorId: null,
    contentTypeId: authorTypeId,
    createdAt,
    id: authorId,
    status: 'published',
    taxonomyTermIds: [],
    updatedAt: createdAt,
    values: {},
  }
}

function articleAuthorRelation(cardinality: Relation['cardinality'] = 'one-to-one'): Relation {
  return {
    cardinality,
    id: relationId,
    name: 'Autor del artículo',
    slug: 'article-author',
    sourceContentTypeId: articleTypeId,
    targetContentTypeId: authorTypeId,
  }
}

describe('M09.4 records and relations engine', () => {
  it('mantiene retrocompatibilidad de CmsBackend sin recordRevisions', () => {
    const legacy = structuredClone(EMPTY_CMS_BACKEND) as unknown as Record<string, unknown>
    delete legacy.recordRevisions
    const parsed = ProjectStructureSchema.safeParse({
      breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
      cms: legacy,
      documents: {},
      globalComponents: {},
      themes: structuredClone(DEFAULT_PROJECT_THEMES),
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.cms?.recordRevisions).toEqual({})
  })

  it('permite borradores incompletos pero exige required y tipos al publicar', () => {
    const draft = createContentRecord(structure(), article())
    expect(draft.ok).toBe(true)
    if (!draft.ok) return

    const invalidPublish = updateContentRecord(draft.value, articleId, { status: 'published' }, { now: updatedAt, revisionId })
    expect(invalidPublish.ok).toBe(false)
    if (!invalidPublish.ok) expect(invalidPublish.error[0]?.code).toBe('missing-required-field')

    const invalidPrice = updateContentRecord(draft.value, articleId, {
      status: 'published',
      values: { [titleFieldId]: 'Artículo válido', [priceFieldId]: -2 },
    }, { now: updatedAt, revisionId })
    expect(invalidPrice.ok).toBe(false)
    if (!invalidPrice.ok) expect(invalidPrice.error.some((item) => item.code === 'invalid-field-value')).toBe(true)

    const published = updateContentRecord(draft.value, articleId, {
      status: 'published',
      values: { [titleFieldId]: 'Artículo válido', [priceFieldId]: 25 },
    }, { now: updatedAt, revisionId })
    expect(published.ok).toBe(true)
    if (published.ok) expect(published.value.cms?.records[articleId]?.status).toBe('published')
  })

  it('crea revisiones portables en update y permite restaurar un snapshot', () => {
    const created = createContentRecord(structure(), article(articleId, 'published', { [titleFieldId]: 'Primera versión' }))
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const updated = updateContentRecord(created.value, articleId, {
      values: { [titleFieldId]: 'Segunda versión' },
    }, { now: updatedAt, revisionId })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(listContentRecordRevisions(updated.value, articleId)).toHaveLength(1)
    expect(updated.value.cms?.recordRevisions[revisionId]?.snapshot.values[titleFieldId]).toBe('Primera versión')

    const restored = restoreContentRecordRevision(updated.value, revisionId, { now: restoredAt, revisionId: restoreBackupId })
    expect(restored.ok).toBe(true)
    if (!restored.ok) return
    expect(restored.value.cms?.records[articleId]?.values[titleFieldId]).toBe('Primera versión')
    expect(restored.value.cms?.records[articleId]?.updatedAt).toBe(restoredAt)
    expect(listContentRecordRevisions(restored.value, articleId)).toHaveLength(2)
  })

  it('valida términos del CPT y deduplica taxonomyTermIds', () => {
    const duplicated = article(articleId, 'draft')
    duplicated.taxonomyTermIds = [categoryTermId, categoryTermId]
    const created = createContentRecord(structure(), duplicated)
    expect(created.ok).toBe(true)
    if (created.ok) expect(created.value.cms?.records[articleId]?.taxonomyTermIds).toEqual([categoryTermId])
  })

  it('crea relaciones y hace cumplir cardinalidad/referencias mediante el validador canónico', () => {
    const source = createContentRecord(structure(), article(articleId, 'draft'))
    expect(source.ok).toBe(true)
    if (!source.ok) return
    const secondSource = createContentRecord(source.value, article(secondArticleId, 'draft'))
    expect(secondSource.ok).toBe(true)
    if (!secondSource.ok) return
    const target = createContentRecord(secondSource.value, authorRecord())
    expect(target.ok).toBe(true)
    if (!target.ok) return

    const relation = createRelation(target.value, articleAuthorRelation('one-to-one'))
    expect(relation.ok).toBe(true)
    if (!relation.ok) return

    const firstEntry = createRelationEntry(relation.value, {
      id: entryId,
      relationId,
      sourceRecordId: articleId,
      targetRecordId: authorId,
    })
    expect(firstEntry.ok).toBe(true)
    if (!firstEntry.ok) return

    const duplicateTarget = createRelationEntry(firstEntry.value, {
      id: parseRelationEntryId('eeeeeeee-aaaa-4eee-8eee-eeeeeeeeeeee'),
      relationId,
      sourceRecordId: secondArticleId,
      targetRecordId: authorId,
    })
    expect(duplicateTarget.ok).toBe(false)
    if (!duplicateTarget.ok) expect(duplicateTarget.error.some((item) => item.code === 'invalid-cms')).toBe(true)
  })

  it('protege borrado de records/relations conectados y permite limpieza ordenada', () => {
    const source = createContentRecord(structure(), article(articleId, 'draft'))
    expect(source.ok).toBe(true)
    if (!source.ok) return
    const target = createContentRecord(source.value, authorRecord())
    expect(target.ok).toBe(true)
    if (!target.ok) return
    const relation = createRelation(target.value, articleAuthorRelation())
    expect(relation.ok).toBe(true)
    if (!relation.ok) return
    const entry = createRelationEntry(relation.value, { id: entryId, relationId, sourceRecordId: articleId, targetRecordId: authorId })
    expect(entry.ok).toBe(true)
    if (!entry.ok) return

    const blockedRecord = deleteContentRecord(entry.value, articleId)
    expect(blockedRecord.ok).toBe(false)
    if (!blockedRecord.ok) expect(blockedRecord.error[0]?.code).toBe('record-in-use')
    const blockedRelation = deleteRelation(entry.value, relationId)
    expect(blockedRelation.ok).toBe(false)
    if (!blockedRelation.ok) expect(blockedRelation.error[0]?.code).toBe('relation-in-use')

    const withoutEntry = deleteRelationEntry(entry.value, entryId)
    expect(withoutEntry.ok).toBe(true)
    if (!withoutEntry.ok) return
    const withoutRecord = deleteContentRecord(withoutEntry.value, articleId)
    expect(withoutRecord.ok).toBe(true)
    if (!withoutRecord.ok) return
    const withoutRelation = deleteRelation(withoutRecord.value, relationId)
    expect(withoutRelation.ok).toBe(true)
  })

  it('impide cambiar cardinalidad si las conexiones existentes quedarían inválidas', () => {
    let current = structure()
    for (const record of [article(articleId), article(secondArticleId), authorRecord()]) {
      const created = createContentRecord(current, record)
      expect(created.ok).toBe(true)
      if (!created.ok) return
      current = created.value
    }
    const relation = createRelation(current, articleAuthorRelation('many-to-many'))
    expect(relation.ok).toBe(true)
    if (!relation.ok) return
    const first = createRelationEntry(relation.value, { id: entryId, relationId, sourceRecordId: articleId, targetRecordId: authorId })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = createRelationEntry(first.value, {
      id: parseRelationEntryId('ffffffff-aaaa-4fff-8fff-ffffffffffff'),
      relationId,
      sourceRecordId: secondArticleId,
      targetRecordId: authorId,
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return

    const narrowed = updateRelation(second.value, relationId, { cardinality: 'one-to-one' })
    expect(narrowed.ok).toBe(false)
    if (!narrowed.ok) expect(narrowed.error.some((item) => item.code === 'invalid-cms')).toBe(true)
  })
})
