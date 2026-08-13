import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { CmsBackend, FieldDefinition, Form } from './cms-schema'
import { parseContentTypeId, parseFieldDefinitionId, parseFormId } from './identity'
import { isFormControlVisible, validateFormSubmission } from './form-runtime'

const contentTypeId = parseContentTypeId('71000000-0000-4000-8000-000000000001')
const ageFieldId = parseFieldDefinitionId('72000000-0000-4000-8000-000000000001')
const nameFieldId = parseFieldDefinitionId('72000000-0000-4000-8000-000000000002')
const emailFieldId = parseFieldDefinitionId('72000000-0000-4000-8000-000000000003')
const formId = parseFormId('73000000-0000-4000-8000-000000000001')

const ageControlId = '74000000-0000-4000-8000-000000000001'
const nameControlId = '74000000-0000-4000-8000-000000000002'
const emailControlId = '74000000-0000-4000-8000-000000000003'
const conditionalControlId = '74000000-0000-4000-8000-000000000004'
const stepId = '75000000-0000-4000-8000-000000000001'

function field(id: typeof ageFieldId, type: FieldDefinition['type'], key: string, label: string, validation: FieldDefinition['validation']): FieldDefinition {
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
    order: 1,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type,
    validation,
  }
}

function cms(): CmsBackend {
  const backend = structuredClone(EMPTY_CMS_BACKEND)
  backend.fields[ageFieldId] = field(ageFieldId, 'number', 'age', 'Edad', { max: 100, maxLength: null, min: 18, minLength: null, pattern: null })
  backend.fields[nameFieldId] = field(nameFieldId, 'text', 'name', 'Nombre', { max: null, maxLength: 12, min: null, minLength: 3, pattern: '^[A-Za-z ]+$' })
  backend.fields[emailFieldId] = field(emailFieldId, 'email', 'email', 'Correo', { max: null, maxLength: null, min: null, minLength: null, pattern: null })
  return backend
}

function form(): Form {
  return {
    actions: [],
    contentTypeId,
    controls: {
      [ageControlId]: {
        conditions: [],
        id: ageControlId,
        label: 'Edad',
        mappedFieldId: ageFieldId,
        name: 'age',
        required: true,
        type: 'number',
      },
      [nameControlId]: {
        conditions: [],
        id: nameControlId,
        label: 'Nombre',
        mappedFieldId: nameFieldId,
        name: 'name',
        required: true,
        type: 'text',
      },
      [emailControlId]: {
        conditions: [],
        id: emailControlId,
        label: 'Correo',
        mappedFieldId: emailFieldId,
        name: 'email',
        required: false,
        type: 'email',
      },
      [conditionalControlId]: {
        conditions: [{
          conditions: [{ fieldId: ageFieldId, operator: 'greater-than', value: 20 }],
          operator: 'all',
        }],
        id: conditionalControlId,
        label: 'Experiencia',
        mappedFieldId: null,
        name: 'experience',
        required: true,
        type: 'textarea',
      },
    },
    csrfProtection: true,
    draftSaving: false,
    errorMessage: 'Revisa los campos.',
    id: formId,
    name: 'Solicitud',
    steps: [{ controlIds: [ageControlId, nameControlId, emailControlId, conditionalControlId], id: stepId, name: 'Campos' }],
    successMessage: 'Guardado.',
  }
}

describe('M11.2 form runtime', () => {
  it('valida required, tipo y reglas del Custom Field mapeado en orden canónico', () => {
    const result = validateFormSubmission(form(), cms(), {
      [ageControlId]: 16,
      [nameControlId]: 'Al',
      [emailControlId]: 'correo-invalido',
    })

    expect(result.valid).toBe(false)
    expect(result.firstInvalidControlId).toBe(ageControlId)
    expect(result.errors.map((item) => item.code)).toEqual(['min', 'min-length', 'invalid-format'])
    expect(result.controlStates[ageControlId]?.errors[0]?.message).toContain('igual o mayor que 18')
  })

  it('omite la validación de un control condicional mientras permanece oculto', () => {
    const current = form()
    const values = {
      [ageControlId]: 20,
      [nameControlId]: 'Alfredo',
      [emailControlId]: 'a@example.com',
    }

    expect(isFormControlVisible(current, current.controls[conditionalControlId]!, values)).toBe(false)
    const result = validateFormSubmission(current, cms(), values)
    expect(result.valid).toBe(true)
    expect(result.visibleControlIds).not.toContain(conditionalControlId)
    expect(result.controlStates[conditionalControlId]).toMatchObject({ errors: [], visible: false })
  })

  it('activa el control condicional y lo valida cuando una regla coincide', () => {
    const current = form()
    const values = {
      [ageControlId]: 21,
      [nameControlId]: 'Alfredo',
      [emailControlId]: 'a@example.com',
    }

    expect(isFormControlVisible(current, current.controls[conditionalControlId]!, values)).toBe(true)
    const result = validateFormSubmission(current, cms(), values)
    expect(result.valid).toBe(false)
    expect(result.visibleControlIds).toContain(conditionalControlId)
    expect(result.errors).toEqual([{ code: 'required', controlId: conditionalControlId, message: 'Experiencia es obligatorio.' }])
  })

  it('trata varios grupos como alternativas y respeta all/any dentro de cada grupo', () => {
    const current = form()
    current.controls[conditionalControlId]!.conditions = [
      {
        conditions: [
          { fieldId: ageFieldId, operator: 'greater-than', value: 50 },
          { fieldId: nameFieldId, operator: 'equals', value: 'No coincide' },
        ],
        operator: 'all',
      },
      {
        conditions: [
          { fieldId: ageFieldId, operator: 'greater-than', value: 20 },
          { fieldId: nameFieldId, operator: 'equals', value: 'Alternativa' },
        ],
        operator: 'any',
      },
    ]

    expect(isFormControlVisible(current, current.controls[conditionalControlId]!, {
      [ageControlId]: 30,
      [nameControlId]: 'Alfredo',
    })).toBe(true)
  })

  it('acepta valores válidos y no crea errores para campos opcionales vacíos', () => {
    const result = validateFormSubmission(form(), cms(), {
      [ageControlId]: 22,
      [nameControlId]: 'Alfredo',
      [emailControlId]: '',
      [conditionalControlId]: 'Cinco años',
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.firstInvalidControlId).toBeNull()
  })
})
