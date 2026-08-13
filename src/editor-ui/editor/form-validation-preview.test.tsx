import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from '../../domain/project/cms-defaults'
import { parseContentTypeId, parseFieldDefinitionId, parseFormId, type CmsBackend, type Form } from '../../domain'
import { FormValidationPreview } from './FormValidationPreview'

const contentTypeId = parseContentTypeId('91000000-0000-4000-8000-000000000001')
const ageFieldId = parseFieldDefinitionId('92000000-0000-4000-8000-000000000001')
const formId = parseFormId('93000000-0000-4000-8000-000000000001')
const ageControlId = '94000000-0000-4000-8000-000000000001'
const experienceControlId = '94000000-0000-4000-8000-000000000002'

function cms(): CmsBackend {
  const backend = structuredClone(EMPTY_CMS_BACKEND)
  backend.fields[ageFieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: 0, description: '', group: '', id: ageFieldId,
    key: 'age', label: 'Edad CMS', options: [], order: 1, owner: { contentTypeId, kind: 'content-type' }, placeholder: '', relationId: null,
    required: true, taxonomyId: null, type: 'number', validation: { max: 100, maxLength: null, min: 18, minLength: null, pattern: null },
  }
  return backend
}

function form(): Form {
  return {
    actions: [],
    contentTypeId,
    controls: {
      [ageControlId]: { conditions: [], id: ageControlId, label: 'Edad', mappedFieldId: ageFieldId, name: 'age', required: true, type: 'number' },
      [experienceControlId]: {
        conditions: [{ conditions: [{ fieldId: ageFieldId, operator: 'greater-than', value: 20 }], operator: 'all' }],
        id: experienceControlId,
        label: 'Experiencia',
        mappedFieldId: null,
        name: 'experience',
        required: true,
        type: 'textarea',
      },
    },
    csrfProtection: true,
    draftSaving: false,
    errorMessage: 'Corrige los campos marcados.',
    id: formId,
    name: 'Solicitud',
    steps: [{ controlIds: [ageControlId, experienceControlId], id: '95000000-0000-4000-8000-000000000001', name: 'Campos' }],
    successMessage: 'Todo está correcto.',
  }
}

describe('M11.2 FormValidationPreview', () => {
  it('muestra errores inline y enfoca el primer control inválido', async () => {
    render(<FormValidationPreview cms={cms()} form={form()} />)

    expect(screen.queryByRole('textbox', { name: /Experiencia/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar formulario' }))

    const age = screen.getByRole('spinbutton', { name: 'Edad' })
    await waitFor(() => expect(age).toHaveFocus())
    expect(screen.getByRole('status')).toHaveTextContent('Corrige los campos marcados.')
    expect(screen.getByRole('alert')).toHaveTextContent('Edad es obligatorio.')
  })

  it('activa campos condicionales en vivo y usa el mensaje canónico de éxito', async () => {
    render(<FormValidationPreview cms={cms()} form={form()} />)

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Edad' }), { target: { value: '21' } })
    const experience = screen.getByRole('textbox', { name: /Experiencia/ })
    expect(experience).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar formulario' }))
    await waitFor(() => expect(experience).toHaveFocus())
    expect(screen.getByRole('alert')).toHaveTextContent('Experiencia es obligatorio.')

    fireEvent.change(experience, { target: { value: 'Cinco años' } })
    expect(screen.getByRole('status')).toHaveTextContent('Todo está correcto.')
  })
})
