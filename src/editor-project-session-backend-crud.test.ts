import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  parseBackendScreenId,
  parseContentTypeId,
  parseMenuId,
  parseMenuItemId,
  parseQueryId,
  type ContentType,
  type Query,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import { requireBackendShellSession } from './editor-ui/editor/backend-shell-session-context'
import { requireContentTypeSession } from './editor-ui/editor/editor-project-context'
import { requireQuerySession } from './editor-ui/editor/query-session-context'

const articleTypeId = parseContentTypeId('c1111111-1111-4111-8111-111111111111')
const orderTypeId = parseContentTypeId('c2222222-2222-4222-8222-222222222222')
const publishedQueryId = parseQueryId('c3333333-3333-4333-8333-333333333333')
const orderQueryId = parseQueryId('c4444444-4444-4444-8444-444444444444')
const screenId = parseBackendScreenId('c5555555-5555-4555-8555-555555555555')
const menuId = parseMenuId('c6666666-6666-4666-8666-666666666666')
const menuItemId = parseMenuItemId('c7777777-7777-4777-8777-777777777777')

function contentType(id: typeof articleTypeId, singularName: string, pluralName: string, slug: string): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read', 'content.create', 'content.update', 'content.delete'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id,
    order: 10,
    pluralName,
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName,
    slug,
    supports: ['title', 'revisions'],
    taxonomyIds: [],
  }
}

function savedQuery(id: typeof publishedQueryId, contentTypeId: typeof articleTypeId, name: string): Query {
  return {
    contentTypeId,
    groups: [{
      operator: 'all',
      predicates: [{ fieldId: null, operator: 'equals', relationId: null, source: 'status', taxonomyId: null, value: 'published' }],
    }],
    id,
    limit: 100,
    name,
    offset: 0,
    pageSize: 20,
    sorts: [{ direction: 'desc', fieldId: null, systemField: 'updatedAt' }],
  }
}

describe('M12.2 persisted admin CRUD views', () => {
  it('enlaza CPT + saved view al BackendScreen mediante el mismo Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-admin-view-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const queries = requireQuerySession(session)
    const backend = requireBackendShellSession(session)

    expect((await contentTypes.createContentType(contentType(articleTypeId, 'Artículo', 'Artículos', 'articles'))).ok).toBe(true)
    expect((await queries.createSavedQuery(savedQuery(publishedQueryId, articleTypeId, 'Publicados'))).ok).toBe(true)
    expect((await backend.createAdminShell({
      documentId: session.documentId,
      menuId,
      menuItemId,
      menuLabel: 'Contenido',
      menuName: 'Administración',
      route: '/admin/content',
      screenId,
      screenKind: 'dashboard',
      screenName: 'Contenido',
    })).ok).toBe(true)

    const bound = await backend.updateAdminShell(screenId, {
      contentTypeId: articleTypeId,
      formId: null,
      queryId: publishedQueryId,
      screenKind: 'table',
    })
    expect(bound.ok).toBe(true)
    expect(session.store.structure.cms?.backendScreens[screenId]).toMatchObject({
      contentTypeId: articleTypeId,
      formId: null,
      kind: 'table',
      queryId: publishedQueryId,
    })

    expect((await session.undo()).ok).toBe(true)
    expect(session.store.structure.cms?.backendScreens[screenId]).toMatchObject({ contentTypeId: null, kind: 'dashboard', queryId: null })
    expect((await session.redo()).ok).toBe(true)
    expect(session.store.structure.cms?.backendScreens[screenId]?.kind).toBe('table')
  })

  it('rechaza saved views de otro CPT y conserva una vista estructurada al editar solo el shell', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-admin-view-guard-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const queries = requireQuerySession(session)
    const backend = requireBackendShellSession(session)

    expect((await contentTypes.createContentType(contentType(articleTypeId, 'Artículo', 'Artículos', 'articles'))).ok).toBe(true)
    expect((await contentTypes.createContentType(contentType(orderTypeId as typeof articleTypeId, 'Pedido', 'Pedidos', 'orders'))).ok).toBe(true)
    expect((await queries.createSavedQuery(savedQuery(orderQueryId as typeof publishedQueryId, orderTypeId as typeof articleTypeId, 'Pedidos publicados'))).ok).toBe(true)
    expect((await backend.createAdminShell({
      documentId: session.documentId,
      menuId,
      menuItemId,
      menuLabel: 'Contenido',
      menuName: 'Administración',
      route: '/admin/content',
      screenId,
      screenKind: 'dashboard',
      screenName: 'Contenido',
    })).ok).toBe(true)

    const mismatch = await backend.updateAdminShell(screenId, {
      contentTypeId: articleTypeId,
      formId: null,
      queryId: orderQueryId,
      screenKind: 'table',
    })
    expect(mismatch.ok).toBe(false)
    if (!mismatch.ok) expect(mismatch.error).toContain('La vista guardada debe consultar el mismo tipo de contenido.')

    expect((await backend.updateAdminShell(screenId, { contentTypeId: articleTypeId, formId: null, queryId: null, screenKind: 'kanban' })).ok).toBe(true)
    expect((await backend.updateAdminShell(screenId, { menuLabel: 'Contenido CMS', screenKind: 'dashboard', screenName: 'Gestión de contenido' })).ok).toBe(true)
    expect(session.store.structure.cms?.backendScreens[screenId]).toMatchObject({ kind: 'kanban', name: 'Gestión de contenido' })
  })
})
