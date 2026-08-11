import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import {
  createTaxonomy,
  createTaxonomyTerm,
  deleteTaxonomy,
  deleteTaxonomyTerm,
  listTaxonomies,
  listTaxonomyTerms,
  updateTaxonomy,
  updateTaxonomyTerm,
} from './taxonomy-engine'
import {
  parseContentTypeId,
  parseDocumentId,
  parseTaxonomyId,
  parseTaxonomyTermId,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import type { ContentType, Taxonomy, TaxonomyTerm } from './cms-schema'

const contentTypeId = parseContentTypeId('11111111-1111-4111-8111-111111111111')
const secondContentTypeId = parseContentTypeId('22222222-2222-4222-8222-222222222222')
const taxonomyId = parseTaxonomyId('33333333-3333-4333-8333-333333333333')
const secondTaxonomyId = parseTaxonomyId('44444444-4444-4444-8444-444444444444')
const archiveDocumentId = parseDocumentId('55555555-5555-4555-8555-555555555555')
const pageDocumentId = parseDocumentId('66666666-6666-4666-8666-666666666666')
const parentTermId = parseTaxonomyTermId('77777777-7777-4777-8777-777777777777')
const childTermId = parseTaxonomyTermId('88888888-8888-4888-8888-888888888888')

function contentType(id: typeof contentTypeId, slug: string, pluralName: string): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id,
    order: 10,
    pluralName,
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: pluralName.slice(0, -1),
    slug,
    supports: ['title'],
    taxonomyIds: [],
  }
}

function taxonomy(id = taxonomyId, slug = 'category'): Taxonomy {
  return {
    contentTypeIds: [contentTypeId],
    fieldIds: [],
    hierarchical: true,
    id,
    order: 10,
    pluralName: 'Categorías',
    public: true,
    singularName: 'Categoría',
    slug,
  }
}

function term(id: typeof parentTermId, name: string, slug: string, parentId: typeof parentTermId | typeof childTermId | null = null): TaxonomyTerm {
  return {
    id,
    name,
    parentId,
    slug,
    taxonomyId,
    values: {},
  }
}

function structure(): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = contentType(contentTypeId, 'articles', 'Artículos')
  cms.contentTypes[secondContentTypeId] = contentType(secondContentTypeId, 'products', 'Productos')
  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms,
    documents: {
      [archiveDocumentId]: {
        conditions: [],
        id: archiveDocumentId,
        kind: 'archive',
        name: 'Archivo de taxonomía',
        nodes: {},
        rootNodeIds: [],
      },
      [pageDocumentId]: {
        conditions: [],
        id: pageDocumentId,
        kind: 'page',
        name: 'Página normal',
        nodes: {},
        rootNodeIds: [],
        routePath: '/page',
      },
    },
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

describe('M09.2 taxonomy engine', () => {
  it('crea una taxonomía, sincroniza asociaciones y enlaza archive mediante condiciones canónicas', () => {
    const created = createTaxonomy(structure(), {
      archiveTemplateId: archiveDocumentId,
      taxonomy: taxonomy(),
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    expect(created.value.cms?.contentTypes[contentTypeId]?.taxonomyIds).toContain(taxonomyId)
    expect(created.value.documents[archiveDocumentId]?.conditions).toContainEqual({
      contentType: `taxonomy:${taxonomyId}`,
      priority: 0,
      target: 'archive',
    })
    expect(listTaxonomies(created.value)[0]?.archiveTemplateId).toBe(archiveDocumentId)
  })

  it('rechaza slug duplicado, CPT inexistente y documentos archive incompatibles', () => {
    const first = createTaxonomy(structure(), { taxonomy: taxonomy() })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const duplicate = createTaxonomy(first.value, { taxonomy: taxonomy(secondTaxonomyId, 'category') })
    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) expect(duplicate.error[0]?.code).toBe('taxonomy-slug-conflict')

    const missingCpt = createTaxonomy(first.value, {
      taxonomy: {
        ...taxonomy(secondTaxonomyId, 'tag'),
        contentTypeIds: [parseContentTypeId('99999999-9999-4999-8999-999999999999')],
      },
    })
    expect(missingCpt.ok).toBe(false)
    if (!missingCpt.ok) expect(missingCpt.error[0]?.code).toBe('missing-content-type')

    const invalidArchive = updateTaxonomy(first.value, taxonomyId, {
      archiveTemplateId: pageDocumentId,
      patch: {},
    })
    expect(invalidArchive.ok).toBe(false)
    if (!invalidArchive.ok) expect(invalidArchive.error[0]?.code).toBe('invalid-archive-template')
  })

  it('actualiza asociaciones múltiples de forma bidireccional', () => {
    const created = createTaxonomy(structure(), { taxonomy: taxonomy() })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const updated = updateTaxonomy(created.value, taxonomyId, {
      patch: { contentTypeIds: [secondContentTypeId] },
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.cms?.contentTypes[contentTypeId]?.taxonomyIds).not.toContain(taxonomyId)
    expect(updated.value.cms?.contentTypes[secondContentTypeId]?.taxonomyIds).toContain(taxonomyId)
  })

  it('gestiona términos jerárquicos, evita ciclos y bloquea cambio a no jerárquica mientras existan padres', () => {
    const createdTaxonomy = createTaxonomy(structure(), { taxonomy: taxonomy() })
    expect(createdTaxonomy.ok).toBe(true)
    if (!createdTaxonomy.ok) return

    const parent = createTaxonomyTerm(createdTaxonomy.value, term(parentTermId, 'Arte', 'arte'))
    expect(parent.ok).toBe(true)
    if (!parent.ok) return
    const child = createTaxonomyTerm(parent.value, term(childTermId, 'Tatuaje', 'tatuaje', parentTermId))
    expect(child.ok).toBe(true)
    if (!child.ok) return
    expect(listTaxonomyTerms(child.value, taxonomyId)).toHaveLength(2)

    const cycle = updateTaxonomyTerm(child.value, parentTermId, { parentId: childTermId })
    expect(cycle.ok).toBe(false)
    if (!cycle.ok) expect(cycle.error[0]?.code).toBe('term-cycle')

    const flat = updateTaxonomy(child.value, taxonomyId, { patch: { hierarchical: false } })
    expect(flat.ok).toBe(false)
    if (!flat.ok) expect(flat.error[0]?.code).toBe('term-parent-forbidden')
  })

  it('rechaza padres en taxonomía plana y protege borrados con dependencias', () => {
    const flatTaxonomy = { ...taxonomy(), hierarchical: false }
    const createdTaxonomy = createTaxonomy(structure(), { taxonomy: flatTaxonomy })
    expect(createdTaxonomy.ok).toBe(true)
    if (!createdTaxonomy.ok) return

    const root = createTaxonomyTerm(createdTaxonomy.value, term(parentTermId, 'Rojo', 'rojo'))
    expect(root.ok).toBe(true)
    if (!root.ok) return
    const child = createTaxonomyTerm(root.value, term(childTermId, 'Oscuro', 'oscuro', parentTermId))
    expect(child.ok).toBe(false)
    if (!child.ok) expect(child.error[0]?.code).toBe('term-parent-forbidden')

    const blockedTaxonomy = deleteTaxonomy(root.value, taxonomyId)
    expect(blockedTaxonomy.ok).toBe(false)
    if (!blockedTaxonomy.ok) expect(blockedTaxonomy.error[0]?.code).toBe('taxonomy-in-use')

    const removedTerm = deleteTaxonomyTerm(root.value, parentTermId)
    expect(removedTerm.ok).toBe(true)
    if (!removedTerm.ok) return
    const removedTaxonomy = deleteTaxonomy(removedTerm.value, taxonomyId)
    expect(removedTaxonomy.ok).toBe(true)
    if (removedTaxonomy.ok) expect(removedTaxonomy.value.cms?.taxonomies[taxonomyId]).toBeUndefined()
  })
})
