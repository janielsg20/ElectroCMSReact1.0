import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  parseContentTypeId,
  parseFieldDefinitionId,
  type ContentType,
  type FieldDefinition,
} from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import {
  EditorProjectContext,
  requireContentTypeSession,
  requireCustomFieldSession,
} from './editor-project-context'
import { ProjectDataPanel } from './ProjectDataPanel'

const contentTypeId = parseContentTypeId('61000000-0000-4000-8000-000000000001')
const textFieldId = parseFieldDefinitionId('62000000-0000-4000-8000-000000000001')
const numberFieldId = parseFieldDefinitionId('62000000-0000-4000-8000-000000000002')

function requestType(): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'form',
    id: contentTypeId,
    order: 10,
    pluralName: 'Solicitudes',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Solicitud',
    slug: 'requests',
    supports: ['custom-fields'],
    taxonomyIds: [],
  }
}

function field(id: typeof textFieldId, type: 'text' | 'number', key: string, label: string, order: number): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: type === 'number' ? 0 : '',
    description: '',
    group: '',
    id,
    key,
    label,
    options: [],
    order,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type,
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
}

async function renderForms() {
  const session = createBrowserEditorProjectSession(`electrocms-form-ui-${crypto.randomUUID()}`)
  expect((await requireContentTypeSession(session).createContentType(requestType())).ok).toBe(true)
  const fields = requireCustomFieldSession(session)
  expect((await fields.createCustomField(field(textFieldId, 'text', 'name', 'Nombre CMS', 10))).ok).toBe(true)
  expect((await fields.createCustomField(field(numberFieldId, 'number', 'quantity', 'Cantidad CMS', 20))).ok).toBe(true)

  render(
    <EditorProjectContext value={session}>
      <ProjectDataPanel />
    </EditorProjectContext>,
  )
  const formsTab = screen.getByRole('tab', { name: 'Formularios' })
  fireEvent.click(formsTab)
  await screen.findByRole('heading', { name: 'Crear formulario' })
  return { formsTab, session }
}

describe('M11.1 FormManager', () => {
  it('expone los 27 tipos mediante un menú ElectroCMS y solo mapea campos compatibles', async () => {
    const { formsTab } = await renderForms()
    expect(formsTab).toHaveClass('min-h-11', 'shrink-0')

    fireEvent.click(screen.getByRole('button', { name: 'Texto' }))
    const typeList = screen.getByRole('listbox', { name: 'Tipo del primer control' })
    expect(within(typeList).getAllByRole('option')).toHaveLength(27)
    expect(within(typeList).getByRole('option', { name: 'Repeater' })).toBeInTheDocument()
    fireEvent.click(within(typeList).getByRole('option', { name: 'Texto' }))

    fireEvent.click(screen.getByRole('button', { name: 'Sin mapear' }))
    const mappingList = screen.getByRole('listbox', { name: 'Mapear a Custom Field' })
    expect(within(mappingList).getByRole('option', { name: /Nombre CMS/ })).toBeInTheDocument()
    expect(within(mappingList).queryByRole('option', { name: /Cantidad CMS/ })).not.toBeInTheDocument()
  })

  it('crea un formulario real, añade un control y lo reordena sin depender de drag', async () => {
    const { session } = await renderForms()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del formulario' }), { target: { value: 'Solicitud web' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sin mapear' }))
    const mappingList = screen.getByRole('listbox', { name: 'Mapear a Custom Field' })
    fireEvent.click(within(mappingList).getByRole('option', { name: /Nombre CMS/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear formulario' }))

    await waitFor(() => expect(Object.values(session.store.structure.cms?.forms ?? {})).toHaveLength(1))
    const form = Object.values(session.store.structure.cms?.forms ?? {})[0]
    expect(form?.name).toBe('Solicitud web')
    const firstControlId = form?.steps[0]?.controlIds[0]
    expect(firstControlId ? form?.controls[firstControlId]?.mappedFieldId : null).toBe(textFieldId)

    expect(await screen.findByRole('heading', { name: 'Layout y orden' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Etiqueta' }), { target: { value: 'Mensaje' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Clave' }), { target: { value: 'message' } })
    fireEvent.click(screen.getByRole('button', { name: 'Añadir al formulario' }))

    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      expect(current?.steps[0]?.controlIds).toHaveLength(2)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Mover arriba Mensaje' }))
    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      const firstId = current?.steps[0]?.controlIds[0]
      expect(firstId ? current?.controls[firstId]?.label : null).toBe('Mensaje')
    })
  })
})
