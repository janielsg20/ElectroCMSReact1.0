import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { parseFormId, type CmsBackend, type Form } from '../../domain'
import { formDraftKey, writeFormDraft } from '../../domain/project/form-draft-storage'
import { FormValidationPreview } from './FormValidationPreview'

const formId = parseFormId('77000000-0000-4000-8000-000000000001')
const nameControlId = '78000000-0000-4000-8000-000000000001'
const messageControlId = '78000000-0000-4000-8000-000000000002'
const firstStepId = '79000000-0000-4000-8000-000000000001'
const secondStepId = '79000000-0000-4000-8000-000000000002'

const cms: CmsBackend = {
  backendScreens: {}, contentTypes: {}, fields: {}, forms: {}, menus: {}, queries: {},
  records: {}, recordRevisions: {}, relationEntries: {}, relations: {}, roles: {},
  taxonomies: {}, taxonomyTerms: {}, users: {},
}

function form(): Form {
  return {
    actions: [], contentTypeId: null, csrfProtection: true, draftSaving: true,
    errorMessage: 'Revisa los campos.', id: formId, name: 'Contacto', successMessage: 'Todo correcto.',
    controls: {
      [nameControlId]: { conditions: [], id: nameControlId, label: 'Nombre', mappedFieldId: null, name: 'name', required: true, type: 'text' },
      [messageControlId]: { conditions: [], id: messageControlId, label: 'Mensaje', mappedFieldId: null, name: 'message', required: true, type: 'text' },
    },
    steps: [
      { controlIds: [nameControlId], id: firstStepId, name: 'Datos' },
      { controlIds: [messageControlId], id: secondStepId, name: 'Mensaje' },
    ],
  }
}

function completeTwoSteps(): void {
  fireEvent.change(screen.getByRole('textbox', { name: /Nombre/ }), { target: { value: 'Ada' } })
  fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
  fireEvent.change(screen.getByRole('textbox', { name: /Mensaje/ }), { target: { value: 'Hola' } })
}

beforeEach(() => localStorage.clear())

describe('M11.3/M11.4 FormValidationPreview', () => {
  it('valida el paso actual antes de avanzar y permite volver atrás', () => {
    render(<FormValidationPreview cms={cms} form={form()} />)
    expect(screen.getByText(/Paso 1 de 2/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText('Nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText(/Paso 1 de 2/)).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: /Nombre/ }), { target: { value: 'Ada' } })
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText(/Paso 2 de 2/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Mensaje/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Atrás/ }))
    expect(screen.getByText(/Paso 1 de 2/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Nombre/ })).toHaveValue('Ada')
  })

  it('recupera el último paso y exige confirmación antes de descartar', () => {
    const current = form()
    expect(writeFormDraft(localStorage, current, secondStepId, { [nameControlId]: 'Ada', [messageControlId]: 'Hola' }).ok).toBe(true)
    render(<FormValidationPreview cms={cms} form={current} />)

    expect(screen.getByText(/Borrador recuperado/)).toBeInTheDocument()
    expect(screen.getByText(/Paso 2 de 2/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Mensaje/ })).toHaveValue('Hola')

    fireEvent.click(screen.getByRole('button', { name: 'Descartar respuestas' }))
    expect(localStorage.getItem(formDraftKey(formId))).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar descarte' }))

    expect(localStorage.getItem(formDraftKey(formId))).toBeNull()
    expect(screen.getByText(/Paso 1 de 2/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Nombre/ })).toHaveValue('')
  })

  it('ejecuta acciones seguras en orden y muestra su resultado sin salir del editor', async () => {
    const current = form()
    current.actions = [
      { config: { message: 'Gracias por completar el formulario.' }, id: 'action-message', kind: 'show-message' },
      { config: { url: '/gracias' }, id: 'action-redirect', kind: 'redirect' },
    ]
    render(<FormValidationPreview cms={cms} form={current} />)
    completeTwoSteps()

    fireEvent.click(screen.getByRole('button', { name: /Comprobar y ejecutar/ }))

    expect(await screen.findByText('Todo correcto.')).toBeInTheDocument()
    expect(screen.getByText(/Mostrar mensaje: completada/)).toBeInTheDocument()
    expect(screen.getByText(/Gracias por completar el formulario/)).toBeInTheDocument()
    expect(screen.getByText(/Redirigir: completada/)).toBeInTheDocument()
    expect(screen.getByText(/La vista previa no navega fuera del editor/)).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem(formDraftKey(formId))).toBeNull())
  })

  it('no simula éxito para integraciones externas sin adapter y conserva el borrador', async () => {
    const current = form()
    current.actions = [{ config: { url: 'https://example.invalid/hook' }, id: 'action-webhook', kind: 'webhook' }]
    render(<FormValidationPreview cms={cms} form={current} />)
    completeTwoSteps()
    expect(writeFormDraft(localStorage, current, secondStepId, { [nameControlId]: 'Ada', [messageControlId]: 'Hola' }).ok).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Comprobar y ejecutar/ }))

    expect(await screen.findByText(/necesita una capacidad que no está disponible/i)).toBeInTheDocument()
    expect(screen.getByText(/no simula integraciones/i)).toBeInTheDocument()
    expect(screen.queryByText('Todo correcto.')).not.toBeInTheDocument()
    expect(localStorage.getItem(formDraftKey(formId))).not.toBeNull()
  })
})
