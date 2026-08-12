import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  parseContentTypeId,
  parseQueryId,
  type ContentType,
  type Query,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import { requireContentTypeSession } from './editor-ui/editor/editor-project-context'
import { requireQuerySession } from './editor-ui/editor/query-session-context'

const contentTypeId = parseContentTypeId('a1111111-1111-4111-8111-111111111111')
const queryId = parseQueryId('a2222222-2222-4222-8222-222222222222')

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

function publishedQuery(): Query {
  return {
    contentTypeId,
    groups: [{
      operator: 'all',
      predicates: [{
        fieldId: null,
        operator: 'equals',
        relationId: null,
        source: 'status',
        taxonomyId: null,
        value: 'published',
      }],
    }],
    id: queryId,
    limit: 30,
    name: 'Publicados',
    offset: 0,
    pageSize: 15,
    sorts: [{ direction: 'desc', fieldId: null, systemField: 'updatedAt' }],
  }
}

describe('M10.2 saved query session', () => {
  it('persiste create/update/delete y conserva undo/redo canónico', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-query-session-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const queries = requireQuerySession(session)

    expect((await contentTypes.createContentType(articleType())).ok).toBe(true)

    const created = await queries.createSavedQuery(publishedQuery())
    expect(created.ok).toBe(true)
    expect(session.store.structure.cms?.queries[queryId]).toMatchObject({ name: 'Publicados', limit: 30 })

    const updated = await queries.updateSavedQuery(queryId, { limit: 12, name: 'Publicados recientes', offset: 2 })
    expect(updated.ok).toBe(true)
    expect(session.store.structure.cms?.queries[queryId]).toMatchObject({ name: 'Publicados recientes', limit: 12, offset: 2 })

    expect((await session.undo()).ok).toBe(true)
    expect(session.store.structure.cms?.queries[queryId]).toMatchObject({ name: 'Publicados', limit: 30, offset: 0 })

    expect((await session.redo()).ok).toBe(true)
    expect(session.store.structure.cms?.queries[queryId]?.name).toBe('Publicados recientes')

    const deleted = await queries.deleteSavedQuery(queryId)
    expect(deleted.ok).toBe(true)
    expect(session.store.structure.cms?.queries[queryId]).toBeUndefined()

    expect((await session.undo()).ok).toBe(true)
    expect(session.store.structure.cms?.queries[queryId]?.name).toBe('Publicados recientes')
  })
})
