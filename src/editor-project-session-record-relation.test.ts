import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseRelationEntryId,
  parseRelationId,
  parseTimestamp,
  type ContentRecord,
  type ContentType,
  type Relation,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import {
  requireContentTypeSession,
  requireRecordRelationSession,
} from './editor-ui/editor/editor-project-context'

const articleTypeId = parseContentTypeId('81818181-8181-4818-8818-818181818181')
const authorTypeId = parseContentTypeId('82828282-8282-4828-8828-828282828282')
const articleId = parseContentRecordId('83838383-8383-4838-8838-838383838383')
const authorId = parseContentRecordId('84848484-8484-4848-8848-848484848484')
const relationId = parseRelationId('85858585-8585-4858-8858-858585858585')
const entryId = parseRelationEntryId('86868686-8686-4868-8868-868686868686')
const placeholderTimestamp = parseTimestamp('2026-08-11T20:00:00.000Z')

function contentType(id: typeof articleTypeId, slug: string, revisions: boolean): ContentType {
  const article = id === articleTypeId
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id,
    order: article ? 10 : 20,
    pluralName: article ? 'Artículos' : 'Autores',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: article ? 'Artículo' : 'Autor',
    slug,
    supports: revisions ? ['title', 'revisions'] : ['title'],
    taxonomyIds: [],
  }
}

function record(id: typeof articleId, contentTypeId: typeof articleTypeId): ContentRecord {
  return {
    authorId: null,
    contentTypeId,
    createdAt: placeholderTimestamp,
    id,
    status: 'draft',
    taxonomyTermIds: [],
    updatedAt: placeholderTimestamp,
    values: {},
  }
}

function relation(): Relation {
  return {
    cardinality: 'one-to-one',
    id: relationId,
    name: 'Autor del artículo',
    slug: 'article-author',
    sourceContentTypeId: articleTypeId,
    targetContentTypeId: authorTypeId,
  }
}

describe('M09.4 editor records and relations session', () => {
  it('persiste revisiones y relaciones usando el undo/redo canónico', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-record-session-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const records = requireRecordRelationSession(session)

    expect((await contentTypes.createContentType(contentType(articleTypeId, 'articles', true))).ok).toBe(true)
    expect((await contentTypes.createContentType(contentType(authorTypeId, 'authors', false))).ok).toBe(true)

    expect((await records.createContentRecord(record(articleId, articleTypeId))).ok).toBe(true)
    expect((await records.createContentRecord(record(authorId, authorTypeId))).ok).toBe(true)

    const updated = await records.updateContentRecord(articleId, { status: 'pending' })
    expect(updated.ok).toBe(true)
    expect(session.store.structure.cms?.records[articleId]?.status).toBe('pending')
    expect(Object.values(session.store.structure.cms?.recordRevisions ?? {})).toHaveLength(1)

    const undoneUpdate = await session.undo()
    expect(undoneUpdate.ok).toBe(true)
    expect(session.store.structure.cms?.records[articleId]?.status).toBe('draft')
    expect(Object.values(session.store.structure.cms?.recordRevisions ?? {})).toHaveLength(0)

    const redoneUpdate = await session.redo()
    expect(redoneUpdate.ok).toBe(true)
    expect(session.store.structure.cms?.records[articleId]?.status).toBe('pending')
    expect(Object.values(session.store.structure.cms?.recordRevisions ?? {})).toHaveLength(1)

    expect((await records.createRelation(relation())).ok).toBe(true)
    expect((await records.createRelationEntry({
      id: entryId,
      relationId,
      sourceRecordId: articleId,
      targetRecordId: authorId,
    })).ok).toBe(true)

    const blocked = await records.deleteContentRecord(articleId)
    expect(blocked.ok).toBe(false)
    expect(session.store.structure.cms?.records[articleId]).toBeDefined()

    expect((await records.deleteRelationEntry(entryId)).ok).toBe(true)
    expect(session.store.structure.cms?.relationEntries[entryId]).toBeUndefined()

    const undoneEntryDelete = await session.undo()
    expect(undoneEntryDelete.ok).toBe(true)
    expect(session.store.structure.cms?.relationEntries[entryId]).toBeDefined()
  })
})
