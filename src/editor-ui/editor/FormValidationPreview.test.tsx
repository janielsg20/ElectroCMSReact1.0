import { fireEvent, render, screen } from '@testing-library/react'
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

beforeEach(() => localStorage.clear())

describe('M11.3 FormValidationPreview', () => {
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
})
