import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createCompleteWidgetRegistry,
  parseContentRecordId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseTimestamp,
  type ContentRecord,
  type ContentType,
  type FieldDefinition,
} from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import {
  EditorProjectContext,
  requireContentTypeSession,
  requireCustomFieldSession,
  requireRecordRelationSession,
} from './editor-project-context'
import { DataConditionAccessibilityControl } from './DataConditionAccessibilityControl'

const contentTypeId = parseContentTypeId('70707070-aaaa-4070-8070-707070707070')
const fieldId = parseFieldDefinitionId('80808080-aaaa-4080-8080-808080808080')
const recordId = parseContentRecordId('90909090-aaaa-4090-8090-909090909090')
const timestamp = parseTimestamp('2026-08-12T00:00:00.000Z')
const registry = createCompleteWidgetRegistry()

function contentType(): ContentType {
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

function titleField(): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: null,
    description: '',
    group: '',
    id: fieldId,
    key: 'title',
    label: 'Título CMS',
    options: [],
    order: 10,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type: 'text',
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
}

function record(): ContentRecord {
  return {
    authorId: null,
    contentTypeId,
    createdAt: timestamp,
    id: recordId,
    status: 'draft',
    taxonomyTermIds: [],
    updatedAt: timestamp,
    values: { [fieldId]: 'Texto dinámico' },
  }
}

describe('M09.5 controles de binding dinámico', () => {
  it('prepara y persiste un binding CMS estructurado y cambia preview sin persistirlo', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-bindings-ui-${crypto.randomUUID()}`)
    expect((await requireContentTypeSession(session).createContentType(contentType())).ok).toBe(true)
    expect((await requireCustomFieldSession(session).createCustomField(titleField())).ok).toBe(true)
    expect((await requireRecordRelationSession(session).createContentRecord(record())).ok).toBe(true)

    const document = session.store.structure.documents[session.documentId]
    const node = document && Object.values(document.nodes).find((candidate) => candidate.kind === 'widget' && candidate.widgetType === 'content.paragraph')
    if (!node || node.kind !== 'widget') throw new Error('Falta paragraph del starter.')
    const definition = registry.get(node.widgetType)
    if (!definition) throw new Error('Falta definición del paragraph.')

    render(
      <EditorProjectContext value={session}>
        <DataConditionAccessibilityControl definition={definition} node={node} structure={session.store.structure} />
      </EditorProjectContext>,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Propiedad destino' }), { target: { value: 'text' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Registro de contenido' }), { target: { value: recordId } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Campo del registro' }), { target: { value: fieldId } })
    fireEvent.click(screen.getByRole('button', { name: 'Preparar binding CMS' }))
    const configuredBindings = screen.getByLabelText('Bindings configurados')
    expect(within(configuredBindings).getByText(/Registro .* Título CMS/i)).toBeInTheDocument()
    expect(within(configuredBindings).getByRole('button', { name: 'Quitar binding text' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar datos' }))
    await waitFor(() => expect(session.store.structure.documents[session.documentId]?.nodes[node.id]?.bindings.text).toEqual({
      fieldId,
      kind: 'cms-record-field',
      recordId,
    }))

    const beforePreview = structuredClone(session.store.structure)
    fireEvent.change(screen.getByRole('combobox', { name: 'Estado de preview' }), { target: { value: 'loading' } })
    expect(session.store.getNodeDataPreviewMode(node.id)).toBe('loading')
    expect(session.store.structure).toEqual(beforePreview)
    expect(screen.getByText(/nunca se guardan en ProjectStructure/i)).toBeInTheDocument()
  })
})
