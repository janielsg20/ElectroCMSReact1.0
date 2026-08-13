import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { ContentRecord, ContentType, FieldDefinition, Form, Relation } from './cms-schema'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { executeFormActionPipeline } from './form-action-engine'
import { createProjectFormActionAdapter } from './form-project-action-adapter'
import {
  parseContentRecordId,
  parseContentRecordRevisionId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseFormId,
  parseRelationEntryId,
  parseRelationId,
  parseTimestamp,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'

const articleTypeId = parseContentTypeId('91000000-0000-4000-8000-000000000001')
const authorTypeId = parseContentTypeId('91000000-0000-4000-8000-000000000002')
const titleFieldId = parseFieldDefinitionId('92000000-0000-4000-8000-000000000001')
const formId = parseFormId('93000000-0000-4000-8000-000000000001')
const authorRecordId = parseContentRecordId('94000000-0000-4000-8000-000000000001')
const existingArticleId = parseContentRecordId('94000000-0000-4000-8000-000000000002')
const createdArticleId = parseContentRecordId('94000000-0000-4000-8000-000000000003')
const revisionId = parseContentRecordRevisionId('95000000-0000-4000-8000-000000000001')
const relationId = parseRelationId('96000000-0000-4000-8000-000000000001')
const relationEntryId = parseRelationEntryId('97000000-0000-4000-8000-000000000001')
const now = parseTimestamp('2026-08-13T04:00:00.000Z')
const titleControlId = '98000000-0000-4000-8000-000000000001'
const relatedControlId = '98000000-0000-4000-8000-000000000002'
const stepId = '99000000-0000-4000-8000-000000000001'

function contentType(id: typeof articleTypeId, name: string, fieldIds: ContentType['fieldIds']): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds,
    icon: 'content',
    id,
    order: 10,
    pluralName: `${name}s`,
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: name,
    slug: name.toLowerCase(),
    supports: fieldIds.length ? ['custom-fields'] : [],
    taxonomyIds: [],
  }
}

function titleField(): FieldDefinition {
  return {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: '', description: '', group: '',
    id: titleFieldId, key: 'title', label: 'Título', options: [], order: 10,
    owner: { contentTypeId: articleTypeId, kind: 'content-type' }, placeholder: '', relationId: null, required: true, taxonomyId: null, type: 'text',
    validation: { max: null, maxLength: 120, min: null, minLength: 1, pattern: null },
  }
}

function relation(): Relation {
  return {
    cardinality: 'many-to-many',
    id: relationId,
    name: 'Autor del artículo',
    slug: 'article-author',
    sourceContentTypeId: articleTypeId,
    targetContentTypeId: authorTypeId,
  }
}

function record(id: typeof authorRecordId, contentTypeId: typeof articleTypeId, values: ContentRecord['values'] = {}): ContentRecord {
  return { authorId: null, contentTypeId, createdAt: now, id, status: 'draft', taxonomyTermIds: [], updatedAt: now, values }
}

function structure(includeExistingArticle = false): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[articleTypeId] = contentType(articleTypeId, 'Article', [titleFieldId])
  cms.contentTypes[authorTypeId] = contentType(authorTypeId, 'Author', [])
  cms.fields[titleFieldId] = titleField()
  cms.relations[relationId] = relation()
  cms.records[authorRecordId] = record(authorRecordId, authorTypeId)
  if (includeExistingArticle) cms.records[existingArticleId] = record(existingArticleId, articleTypeId, { [titleFieldId]: 'Anterior' })
  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms,
    documents: {},
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

function form(actions: Form['actions']): Form {
  return {
    actions,
    contentTypeId: articleTypeId,
    controls: {
      [titleControlId]: { conditions: [], id: titleControlId, label: 'Título', mappedFieldId: titleFieldId, name: 'title', required: true, type: 'text' },
      [relatedControlId]: { conditions: [], id: relatedControlId, label: 'Autor', mappedFieldId: null, name: 'author', required: false, type: 'relation' },
    },
    csrfProtection: true,
    draftSaving: false,
    errorMessage: 'Revisa los campos.',
    id: formId,
    name: 'Artículo',
    steps: [{ controlIds: [titleControlId, relatedControlId], id: stepId, name: 'Datos' }],
    successMessage: 'Guardado.',
  }
}

function identity() {
  return {
    now: () => now,
    recordId: () => createdArticleId,
    relationEntryId: () => relationEntryId,
    revisionId: () => revisionId,
  }
}

describe('M11.4 project form action adapter', () => {
  it('crea contenido y encadena una relación usando los motores canónicos', async () => {
    const currentForm = form([
      { config: { contentTypeId: articleTypeId }, id: 'a1000000-0000-4000-8000-000000000001', kind: 'create-content' },
      { config: { relatedRecordControl: relatedControlId, relationId }, id: 'a1000000-0000-4000-8000-000000000002', kind: 'update-relation' },
    ])
    const adapter = createProjectFormActionAdapter({ identity: identity(), structure: structure() })
    const result = await executeFormActionPipeline(currentForm, adapter.getStructure().cms ?? EMPTY_CMS_BACKEND, {
      [titleControlId]: 'Nuevo artículo',
      [relatedControlId]: authorRecordId,
    }, adapter.handlers)

    expect(result.completed).toBe(true)
    const next = adapter.getStructure()
    expect(next.cms?.records[createdArticleId]?.values[titleFieldId]).toBe('Nuevo artículo')
    expect(next.cms?.relationEntries[relationEntryId]).toMatchObject({
      relationId,
      sourceRecordId: createdArticleId,
      targetRecordId: authorRecordId,
    })
    expect(adapter.getCurrentRecordId()).toBe(createdArticleId)
  })

  it('guardar registro actualiza sin borrar valores no mapeados', async () => {
    const current = structure(true)
    const currentForm = form([{ config: {}, id: 'a1000000-0000-4000-8000-000000000003', kind: 'save-record' }])
    const adapter = createProjectFormActionAdapter({ currentRecordId: existingArticleId, identity: identity(), structure: current })
    const result = await executeFormActionPipeline(currentForm, current.cms ?? EMPTY_CMS_BACKEND, { [titleControlId]: 'Actualizado' }, adapter.handlers)

    expect(result.completed).toBe(true)
    expect(adapter.getStructure().cms?.records[existingArticleId]?.values[titleFieldId]).toBe('Actualizado')
    expect(adapter.getCurrentRecordId()).toBe(existingArticleId)
  })

  it('actualizar contenido falla explícitamente sin contexto de registro', async () => {
    const current = structure()
    const currentForm = form([{ config: {}, id: 'a1000000-0000-4000-8000-000000000004', kind: 'update-content' }])
    const adapter = createProjectFormActionAdapter({ identity: identity(), structure: current })
    const result = await executeFormActionPipeline(currentForm, current.cms ?? EMPTY_CMS_BACKEND, { [titleControlId]: 'Sin contexto' }, adapter.handlers)

    expect(result.completed).toBe(false)
    expect(result.error).toMatchObject({ code: 'action-failed' })
    expect(result.records[0]?.message).toMatch(/contenido actual/i)
  })
})
