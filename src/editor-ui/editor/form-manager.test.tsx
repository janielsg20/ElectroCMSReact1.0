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
  await screen.findByRole('heading', { name: 'Crear formulario' }, { timeout: 5_000 })
  return { formsTab, session }
}

describe('M11 FormManager', () => {
  it('expone los 27 tipos mediante ChoiceField portado y solo mapea campos compatibles', async () => {
    const { formsTab } = await renderForms()
    expect(formsTab).toHaveClass('min-h-11', 'shrink-0')

    fireEvent.click(screen.getByRole('button', { name: 'Tipo del primer campo' }))
    const typeList = screen.getByRole('listbox', { name: 'Tipo del primer campo' })
    expect(typeList.parentElement).toBe(document.body)
    expect(within(typeList).getAllByRole('option')).toHaveLength(27)
    expect(within(typeList).getByRole('option', { name: 'Lista repetible' })).toBeInTheDocument()
    fireEvent.click(within(typeList).getByRole('option', { name: 'Texto corto' }))

    fireEvent.click(screen.getByRole('button', { name: 'Guardar su valor en' }))
    const mappingList = screen.getByRole('listbox', { name: 'Guardar su valor en' })
    expect(within(mappingList).getByRole('option', { name: /Nombre CMS/ })).toBeInTheDocument()
    expect(within(mappingList).queryByRole('option', { name: /Cantidad CMS/ })).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Campo obligatorio' })).toHaveAttribute('aria-checked', 'false')
  })

  it('crea un formulario real, añade un campo y lo reordena sin depender de drag', async () => {
    const { session } = await renderForms()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del formulario' }), { target: { value: 'Solicitud web' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar su valor en' }))
    const mappingList = screen.getByRole('listbox', { name: 'Guardar su valor en' })
    fireEvent.click(within(mappingList).getByRole('option', { name: /Nombre CMS/ }))
    fireEvent.click(screen.getByRole('switch', { name: 'Campo obligatorio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear formulario' }))

    await waitFor(() => expect(Object.values(session.store.structure.cms?.forms ?? {})).toHaveLength(1))
    const form = Object.values(session.store.structure.cms?.forms ?? {})[0]
    expect(form?.name).toBe('Solicitud web')
    const firstControlId = form?.steps[0]?.controlIds[0]
    expect(firstControlId ? form?.controls[firstControlId]?.mappedFieldId : null).toBe(textFieldId)
    expect(firstControlId ? form?.controls[firstControlId]?.required : null).toBe(true)

    expect(await screen.findByRole('heading', { name: 'Campos y orden' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1\. Nombre/ })).toHaveClass('min-w-11')
    const addHeading = screen.getByRole('heading', { name: 'Añadir campo' })
    const addSection = addHeading.closest('section')
    expect(addSection).not.toBeNull()
    if (!addSection) return
    const add = within(addSection)
    fireEvent.change(add.getByRole('textbox', { name: 'Texto que verá el usuario' }), { target: { value: 'Mensaje' } })
    fireEvent.click(add.getByRole('switch', { name: 'Campo obligatorio' }))
    fireEvent.click(add.getByRole('button', { name: 'Añadir al formulario' }))

    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      expect(current?.steps[0]?.controlIds).toHaveLength(2)
      const addedId = current?.steps[0]?.controlIds[1]
      expect(addedId ? current?.controls[addedId]?.required : null).toBe(true)
    })
    expect(screen.getByRole('button', { name: 'Arrastrar Mensaje para cambiar su orden' })).toHaveAttribute('aria-roledescription', 'sortable')

    const moveMessageUp = screen.getByRole('button', { name: 'Mover arriba Mensaje' })
    await waitFor(() => expect(moveMessageUp).toBeEnabled())
    fireEvent.click(moveMessageUp)
    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      const firstId = current?.steps[0]?.controlIds[0]
      expect(firstId ? current?.controls[firstId]?.label : null).toBe('Mensaje')
    })

    const editorHeading = screen.getByRole('heading', { name: 'Editar campo · Mensaje' })
    const editorSection = editorHeading.closest('section')
    expect(editorSection).not.toBeNull()
    if (!editorSection) return
    const editor = within(editorSection)
    fireEvent.click(editor.getByRole('switch', { name: 'Campo obligatorio' }))
    fireEvent.click(editor.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      const message = Object.values(current?.controls ?? {}).find((control) => control.label === 'Mensaje')
      expect(message?.required).toBe(false)
    })
  })

  it('configura y reordena el pipeline de 12 acciones mediante la UI', async () => {
    const { session } = await renderForms()
    fireEvent.click(screen.getByRole('button', { name: 'Crear formulario' }))
    const heading = await screen.findByRole('heading', { name: 'Qué ocurre al completar' })
    const section = heading.closest('section')
    expect(section).not.toBeNull()
    if (!section) return
    const actions = within(section)

    fireEvent.click(actions.getByRole('button', { name: 'Añadir acción' }))
    const choices = screen.getByRole('listbox', { name: 'Añadir acción' })
    expect(within(choices).getAllByRole('option')).toHaveLength(12)
    fireEvent.click(within(choices).getByRole('option', { name: /Mostrar mensaje/ }))
    fireEvent.click(actions.getByRole('button', { name: 'Añadir' }))

    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      expect(current?.actions).toHaveLength(1)
      expect(current?.actions[0]?.kind).toBe('show-message')
    })

    const messageInput = actions.getByRole('textbox', { name: /^Mensaje/ })
    fireEvent.change(messageInput, { target: { value: 'Gracias por enviar.' } })
    fireEvent.click(actions.getByRole('button', { name: 'Guardar acción' }))
    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      expect(current?.actions[0]?.config.message).toBe('Gracias por enviar.')
    })

    fireEvent.click(actions.getByRole('button', { name: 'Añadir acción' }))
    const nextChoices = screen.getByRole('listbox', { name: 'Añadir acción' })
    fireEvent.click(within(nextChoices).getByRole('option', { name: /Redirigir/ }))
    fireEvent.click(actions.getByRole('button', { name: 'Añadir' }))
    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      expect(current?.actions.map((action) => action.kind)).toEqual(['show-message', 'redirect'])
    })

    const moveRedirectUp = actions.getByRole('button', { name: 'Mover arriba Redirigir' })
    fireEvent.click(moveRedirectUp)
    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.forms ?? {})[0]
      expect(current?.actions.map((action) => action.kind)).toEqual(['redirect', 'show-message'])
    })
  })
})
