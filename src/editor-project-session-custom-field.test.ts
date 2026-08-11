import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  parseContentTypeId,
  parseFieldDefinitionId,
  type ContentType,
  type FieldDefinition,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import {
  requireContentTypeSession,
  requireCustomFieldSession,
} from './editor-ui/editor/editor-project-context'

const contentTypeId = parseContentTypeId('71717171-7171-4717-8717-717171717171')
const fieldId = parseFieldDefinitionId('72727272-7272-4727-8727-727272727272')

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
    supports: ['title', 'custom-fields'],
    taxonomyIds: [],
  }
}

function subtitleField(): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: '',
    description: 'Subtítulo editorial',
    group: 'Contenido',
    id: fieldId,
    key: 'subtitle',
    label: 'Subtítulo',
    options: [],
    order: 10,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: 'Escribe un subtítulo',
    relationId: null,
    required: false,
    taxonomyId: null,
    type: 'text',
    validation: { max: null, maxLength: 160, min: null, minLength: 0, pattern: null },
  }
}

describe('M09.3 editor custom field session', () => {
  it('persiste create/update/delete y participa del undo/redo canónico', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-field-session-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const fields = requireCustomFieldSession(session)

    expect((await contentTypes.createContentType(articleType())).ok).toBe(true)

    const created = await fields.createCustomField(subtitleField())
    expect(created.ok).toBe(true)
    expect(session.store.structure.cms?.fields[fieldId]?.label).toBe('Subtítulo')
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).toContain(fieldId)

    const updated = await fields.updateCustomField(fieldId, { label: 'Bajada', order: 4, required: true })
    expect(updated.ok).toBe(true)
    expect(session.store.structure.cms?.fields[fieldId]).toMatchObject({ label: 'Bajada', order: 4, required: true })

    const undoneUpdate = await session.undo()
    expect(undoneUpdate.ok).toBe(true)
    expect(session.store.structure.cms?.fields[fieldId]).toMatchObject({ label: 'Subtítulo', order: 10, required: false })

    const redoneUpdate = await session.redo()
    expect(redoneUpdate.ok).toBe(true)
    expect(session.store.structure.cms?.fields[fieldId]?.label).toBe('Bajada')

    const deleted = await fields.deleteCustomField(fieldId)
    expect(deleted.ok).toBe(true)
    expect(session.store.structure.cms?.fields[fieldId]).toBeUndefined()
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).not.toContain(fieldId)

    const undoneDelete = await session.undo()
    expect(undoneDelete.ok).toBe(true)
    expect(session.store.structure.cms?.fields[fieldId]?.label).toBe('Bajada')
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).toContain(fieldId)
  })
})
