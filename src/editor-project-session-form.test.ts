import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  parseContentTypeId,
  parseFieldDefinitionId,
  parseFormId,
  type ContentType,
  type FieldDefinition,
  type Form,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import {
  requireContentTypeSession,
  requireCustomFieldSession,
} from './editor-ui/editor/editor-project-context'
import { requireFormSession } from './editor-ui/editor/form-session-context'

const contentTypeId = parseContentTypeId('51000000-0000-4000-8000-000000000001')
const textFieldId = parseFieldDefinitionId('52000000-0000-4000-8000-000000000001')
const formId = parseFormId('53000000-0000-4000-8000-000000000001')
const firstControlId = '54000000-0000-4000-8000-000000000001'
const secondControlId = '54000000-0000-4000-8000-000000000002'
const stepId = '55000000-0000-4000-8000-000000000001'

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

function nameField(): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: '',
    description: '',
    group: '',
    id: textFieldId,
    key: 'name',
    label: 'Nombre',
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

function requestForm(): Form {
  return {
    actions: [],
    contentTypeId,
    controls: {
      [firstControlId]: {
        conditions: [],
        id: firstControlId,
        label: 'Nombre',
        mappedFieldId: textFieldId,
        name: 'name',
        required: false,
        type: 'text',
      },
    },
    csrfProtection: true,
    draftSaving: false,
    errorMessage: 'Revisa los campos.',
    id: formId,
    name: 'Solicitud de contacto',
    steps: [{ controlIds: [firstControlId], id: stepId, name: 'Campos' }],
    successMessage: 'Solicitud guardada.',
  }
}

describe('M11.1 editor form session', () => {
  it('persiste formulario, controles y orden con undo/redo canónico', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-form-session-${crypto.randomUUID()}`)
    const contentTypes = requireContentTypeSession(session)
    const fields = requireCustomFieldSession(session)
    const forms = requireFormSession(session)

    expect((await contentTypes.createContentType(requestType())).ok).toBe(true)
    expect((await fields.createCustomField(nameField())).ok).toBe(true)
    expect((await forms.createForm(requestForm())).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.name).toBe('Solicitud de contacto')

    expect((await forms.addFormControl(formId, stepId, {
      conditions: [],
      id: secondControlId,
      label: 'Mensaje',
      mappedFieldId: null,
      name: 'message',
      required: false,
      type: 'textarea',
    })).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.steps[0]?.controlIds).toEqual([firstControlId, secondControlId])

    expect((await forms.reorderFormControl(formId, secondControlId, 0)).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.steps[0]?.controlIds).toEqual([secondControlId, firstControlId])

    expect((await forms.updateFormControl(formId, secondControlId, { label: 'Detalle', name: 'details' })).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.controls[secondControlId]).toMatchObject({ label: 'Detalle', name: 'details' })

    expect((await session.undo()).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.controls[secondControlId]).toMatchObject({ label: 'Mensaje', name: 'message' })

    expect((await session.redo()).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.controls[secondControlId]?.label).toBe('Detalle')

    expect((await forms.removeFormControl(formId, firstControlId)).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.steps[0]?.controlIds).toEqual([secondControlId])

    expect((await forms.updateForm(formId, { name: 'Solicitud web' })).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.name).toBe('Solicitud web')

    expect((await forms.deleteForm(formId)).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]).toBeUndefined()
    expect((await session.undo()).ok).toBe(true)
    expect(session.store.structure.cms?.forms[formId]?.name).toBe('Solicitud web')
  })
})
