import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { parseContentTypeId, type ContentType } from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import { requireContentTypeSession } from './editor-ui/editor/editor-project-context'

const contentTypeId = parseContentTypeId('71717171-7171-4717-8717-717171717171')

function articleType(): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read', 'content.edit'],
    description: 'Artículos del proyecto',
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
    supports: ['title', 'editor', 'thumbnail'],
    taxonomyIds: [],
  }
}

describe('M09.1 editor content type session', () => {
  it('persiste create/update/delete y reutiliza undo/redo canónico', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-cpt-session-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)

    const created = await contentTypes.createContentType(articleType())
    expect(created.ok).toBe(true)
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.slug).toBe('articles')

    const updated = await contentTypes.updateContentType(contentTypeId, {
      pluralName: 'Publicaciones',
      public: false,
    })
    expect(updated.ok).toBe(true)
    expect(session.store.structure.cms?.contentTypes[contentTypeId]).toMatchObject({
      pluralName: 'Publicaciones',
      public: false,
    })

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    expect(session.store.structure.cms?.contentTypes[contentTypeId]).toMatchObject({
      pluralName: 'Artículos',
      public: true,
    })

    const redone = await session.redo()
    expect(redone.ok).toBe(true)
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.pluralName).toBe('Publicaciones')

    const removed = await contentTypes.deleteContentType(contentTypeId)
    expect(removed.ok).toBe(true)
    expect(session.store.structure.cms?.contentTypes[contentTypeId]).toBeUndefined()

    const restoreRemoved = await session.undo()
    expect(restoreRemoved.ok).toBe(true)
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.pluralName).toBe('Publicaciones')
  })
})
