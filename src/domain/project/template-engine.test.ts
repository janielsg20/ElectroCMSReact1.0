import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { parseDocumentId } from './identity'
import { ProjectStructureSchema, type Document } from './structure-schema'
import { addDocument, resolveTemplateComposition, updateDocumentConditions } from './template-engine'
import { validateProjectStructure } from './validate-structure'

const ids = {
  archive: parseDocumentId('11111111-1111-4111-8111-111111111111'),
  footer: parseDocumentId('22222222-2222-4222-8222-222222222222'),
  header: parseDocumentId('33333333-3333-4333-8333-333333333333'),
  page: parseDocumentId('44444444-4444-4444-8444-444444444444'),
  productHeader: parseDocumentId('55555555-5555-4555-8555-555555555555'),
  single: parseDocumentId('66666666-6666-4666-8666-666666666666'),
  template: parseDocumentId('77777777-7777-4777-8777-777777777777'),
} as const

function document(id: Document['id'], kind: Document['kind'], name: string, extras: Partial<Document> = {}): Document {
  return {
    conditions: [],
    id,
    kind,
    name,
    nodes: {},
    rootNodeIds: [],
    ...extras,
  }
}

function structure() {
  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS,
    documents: {
      [ids.page]: document(ids.page, 'page', 'Tienda', { routePath: '/shop/item' }),
      [ids.header]: document(ids.header, 'header', 'Cabecera general', { conditions: [{ target: 'page', priority: 0 }] }),
      [ids.productHeader]: document(ids.productHeader, 'header', 'Cabecera tienda', { conditions: [{ target: 'page', pathPrefix: '/shop', priority: 1 }] }),
      [ids.footer]: document(ids.footer, 'footer', 'Pie general', { conditions: [{ target: 'page', priority: 0 }] }),
      [ids.single]: document(ids.single, 'single', 'Entrada', { conditions: [{ target: 'single', priority: 1 }] }),
      [ids.template]: document(ids.template, 'template', 'Plantilla producto', { conditions: [{ target: 'single', contentType: 'product', priority: 1 }] }),
      [ids.archive]: document(ids.archive, 'archive', 'Archivo', { conditions: [{ target: 'archive', priority: 0 }] }),
    },
    globalComponents: {},
  })
}

describe('motor canónico de plantillas', () => {
  it('resuelve página, cabecera y pie por ruta sin duplicar árboles', () => {
    const result = resolveTemplateComposition(structure(), { path: '/shop/item', target: 'page' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.main?.id).toBe(ids.page)
    expect(result.value.header?.id).toBe(ids.productHeader)
    expect(result.value.footer?.id).toBe(ids.footer)
  })

  it('prioriza condiciones específicas y usa un desempate estable', () => {
    const result = resolveTemplateComposition(structure(), { contentType: 'product', path: '/products/a', target: 'single' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.main?.id).toBe(ids.template)
  })

  it('crea y actualiza documentos mediante operaciones validadas', () => {
    const initial = structure()
    const added = addDocument(initial, document(parseDocumentId('88888888-8888-4888-8888-888888888888'), 'not-found', 'No encontrado', {
      conditions: [{ target: 'not-found', priority: 0 }],
    }))
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const updated = updateDocumentConditions(added.value, ids.archive, [{ target: 'archive', pathPrefix: '/news', priority: 10 }])
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.documents[ids.archive]?.conditions[0]?.pathPrefix).toBe('/news')
  })

  it('rechaza condiciones para páginas y rutas duplicadas', () => {
    const initial = structure()
    expect(updateDocumentConditions(initial, ids.page, [{ target: 'page', priority: 0 }]).ok).toBe(false)
    const duplicated = structuredClone(initial)
    duplicated.documents[parseDocumentId('99999999-9999-4999-8999-999999999999')] = document(parseDocumentId('99999999-9999-4999-8999-999999999999'), 'page', 'Duplicada', { routePath: '/shop/item' })
    const validated = validateProjectStructure(duplicated)
    expect(validated.ok).toBe(false)
    if (!validated.ok) expect(validated.error.map((item) => item.code)).toContain('duplicate-page-route')
  })
})
