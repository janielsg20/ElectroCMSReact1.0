import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import {
  createContentType,
  deleteContentType,
  listContentTypes,
  updateContentType,
} from './content-type-engine'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseDocumentId,
  parseTimestamp,
} from './identity'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import type { ContentType } from './cms-schema'

const contentTypeId = parseContentTypeId('11111111-1111-4111-8111-111111111111')
const secondContentTypeId = parseContentTypeId('22222222-2222-4222-8222-222222222222')
const singleDocumentId = parseDocumentId('33333333-3333-4333-8333-333333333333')
const archiveDocumentId = parseDocumentId('44444444-4444-4444-8444-444444444444')
const pageDocumentId = parseDocumentId('55555555-5555-4555-8555-555555555555')

function contentType(id = contentTypeId, slug = 'article'): ContentType {
  return {
    archiveTemplateId: archiveDocumentId,
    capabilities: ['content.read', 'content.edit', 'content.read'],
    description: 'Contenido editorial',
    fieldIds: [],
    icon: 'content',
    id,
    order: 10,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: singleDocumentId,
    singularName: 'Artículo',
    slug,
    supports: ['title', 'editor', 'thumbnail', 'title'],
    taxonomyIds: [],
  }
}

function structure(): ProjectStructure {
  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms: structuredClone(EMPTY_CMS_BACKEND),
    documents: {
      [singleDocumentId]: {
        conditions: [],
        id: singleDocumentId,
        kind: 'single',
        name: 'Single base',
        nodes: {},
        rootNodeIds: [],
      },
      [archiveDocumentId]: {
        conditions: [],
        id: archiveDocumentId,
        kind: 'archive',
        name: 'Archive base',
        nodes: {},
        rootNodeIds: [],
      },
      [pageDocumentId]: {
        conditions: [],
        id: pageDocumentId,
        kind: 'page',
        name: 'Página',
        nodes: {},
        rootNodeIds: [],
        routePath: '/page',
      },
    },
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

describe('M09.1 content type engine', () => {
  it('mantiene retrocompatibilidad cuando cms aún no existe', () => {
    const parsed = ProjectStructureSchema.parse({
      breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
      documents: {},
      globalComponents: {},
      themes: structuredClone(DEFAULT_PROJECT_THEMES),
    })
    expect(parsed.cms).toBeUndefined()
    expect(listContentTypes(parsed)).toEqual([])
  })

  it('crea y ordena CPT, deduplicando capacidades y soportes', () => {
    const first = createContentType(structure(), contentType())
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.cms?.contentTypes[contentTypeId]?.capabilities).toEqual(['content.read', 'content.edit'])
    expect(first.value.cms?.contentTypes[contentTypeId]?.supports).toEqual(['title', 'editor', 'thumbnail'])

    const second = createContentType(first.value, {
      ...contentType(secondContentTypeId, 'news'),
      pluralName: 'Noticias',
      singularName: 'Noticia',
      order: 1,
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(listContentTypes(second.value).map((item) => item.slug)).toEqual(['news', 'article'])
  })

  it('rechaza slug duplicado e IDs duplicados sin alterar la estructura', () => {
    const created = createContentType(structure(), contentType())
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const duplicateSlug = createContentType(created.value, contentType(secondContentTypeId, 'article'))
    expect(duplicateSlug.ok).toBe(false)
    if (!duplicateSlug.ok) expect(duplicateSlug.error[0]?.code).toBe('content-type-slug-conflict')

    const duplicateId = createContentType(created.value, contentType())
    expect(duplicateId.ok).toBe(false)
    if (!duplicateId.ok) expect(duplicateId.error[0]?.code).toBe('content-type-id-conflict')
  })

  it('actualiza propiedades editables y valida el tipo de plantilla', () => {
    const created = createContentType(structure(), contentType())
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const updated = updateContentType(created.value, contentTypeId, {
      pluralName: 'Publicaciones',
      public: false,
      showInMenu: false,
      singleTemplateId: null,
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.cms?.contentTypes[contentTypeId]).toMatchObject({
      pluralName: 'Publicaciones',
      public: false,
      showInMenu: false,
      singleTemplateId: null,
    })

    const invalidTemplate = updateContentType(updated.value, contentTypeId, {
      singleTemplateId: pageDocumentId,
    })
    expect(invalidTemplate.ok).toBe(false)
    if (!invalidTemplate.ok) expect(invalidTemplate.error[0]?.code).toBe('invalid-single-template')
  })

  it('elimina un CPT vacío y bloquea borrado cuando existen registros dependientes', () => {
    const created = createContentType(structure(), contentType())
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const inUse = structuredClone(created.value)
    if (!inUse.cms) throw new Error('CMS esperado')
    const recordId = parseContentRecordId('66666666-6666-4666-8666-666666666666')
    inUse.cms.records[recordId] = {
      authorId: null,
      contentTypeId,
      createdAt: parseTimestamp('2026-08-11T22:00:00.000Z'),
      id: recordId,
      status: 'draft',
      taxonomyTermIds: [],
      updatedAt: parseTimestamp('2026-08-11T22:00:00.000Z'),
      values: {},
    }
    const blocked = deleteContentType(inUse, contentTypeId)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.error[0]?.code).toBe('content-type-in-use')

    const removed = deleteContentType(created.value, contentTypeId)
    expect(removed.ok).toBe(true)
    if (removed.ok) expect(removed.value.cms?.contentTypes[contentTypeId]).toBeUndefined()
  })
})
