import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  parseContentTypeId,
  parseTaxonomyId,
  parseTaxonomyTermId,
  type ContentType,
  type Taxonomy,
  type TaxonomyTerm,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import {
  requireContentTypeSession,
  requireTaxonomySession,
} from './editor-ui/editor/editor-project-context'

const contentTypeId = parseContentTypeId('91919191-9191-4919-8919-919191919191')
const taxonomyId = parseTaxonomyId('92929292-9292-4929-8929-929292929292')
const termId = parseTaxonomyTermId('93939393-9393-4939-8939-939393939393')

function articleType(): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: contentTypeId,
    order: 10,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: ['title'],
    taxonomyIds: [],
  }
}

function categoryTaxonomy(): Taxonomy {
  return {
    archiveTemplateId: null,
    contentTypeIds: [contentTypeId],
    description: 'Clasificación editorial',
    fieldIds: [],
    hierarchical: true,
    id: taxonomyId,
    pluralName: 'Categorías',
    singularName: 'Categoría',
    slug: 'categories',
  }
}

function rootTerm(): TaxonomyTerm {
  return {
    description: '',
    id: termId,
    name: 'Arte',
    parentId: null,
    slug: 'arte',
    taxonomyId,
    values: {},
  }
}

describe('M09.2 editor taxonomy session', () => {
  it('persiste taxonomías y términos usando el undo/redo canónico', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-taxonomy-session-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const taxonomies = requireTaxonomySession(session)

    expect((await contentTypes.createContentType(articleType())).ok).toBe(true)

    const created = await taxonomies.createTaxonomy(categoryTaxonomy())
    expect(created.ok).toBe(true)
    expect(session.store.structure.cms?.taxonomies[taxonomyId]?.slug).toBe('categories')
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.taxonomyIds).toContain(taxonomyId)

    const createdTerm = await taxonomies.createTaxonomyTerm(rootTerm())
    expect(createdTerm.ok).toBe(true)
    expect(session.store.structure.cms?.taxonomyTerms[termId]?.name).toBe('Arte')

    const updatedTerm = await taxonomies.updateTaxonomyTerm(termId, { name: 'Arte visual' })
    expect(updatedTerm.ok).toBe(true)
    expect(session.store.structure.cms?.taxonomyTerms[termId]?.name).toBe('Arte visual')

    const undoTerm = await session.undo()
    expect(undoTerm.ok).toBe(true)
    expect(session.store.structure.cms?.taxonomyTerms[termId]?.name).toBe('Arte')

    const redoTerm = await session.redo()
    expect(redoTerm.ok).toBe(true)
    expect(session.store.structure.cms?.taxonomyTerms[termId]?.name).toBe('Arte visual')

    expect((await taxonomies.deleteTaxonomyTerm(termId)).ok).toBe(true)
    expect(session.store.structure.cms?.taxonomyTerms[termId]).toBeUndefined()
    expect((await taxonomies.deleteTaxonomy(taxonomyId)).ok).toBe(true)
    expect(session.store.structure.cms?.taxonomies[taxonomyId]).toBeUndefined()
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.taxonomyIds).not.toContain(taxonomyId)

    const restoreTaxonomy = await session.undo()
    expect(restoreTaxonomy.ok).toBe(true)
    expect(session.store.structure.cms?.taxonomies[taxonomyId]?.pluralName).toBe('Categorías')
  })
})
