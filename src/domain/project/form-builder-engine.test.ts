import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { Form } from './cms-schema'
import {
  addFormControl,
  createForm,
  deleteForm,
  listForms,
  removeFormControl,
  reorderFormControl,
  updateForm,
  updateFormControl,
} from './form-builder-engine'
import {
  parseBackendScreenId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseFormId,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'

const contentTypeId = parseContentTypeId('41000000-0000-4000-8000-000000000001')
const otherContentTypeId = parseContentTypeId('41000000-0000-4000-8000-000000000002')
const textFieldId = parseFieldDefinitionId('42000000-0000-4000-8000-000000000001')
const numberFieldId = parseFieldDefinitionId('42000000-0000-4000-8000-000000000002')
const formId = parseFormId('43000000-0000-4000-8000-000000000001')
const secondFormId = parseFormId('43000000-0000-4000-8000-000000000002')
const firstControlId = '44000000-0000-4000-8000-000000000001'
const secondControlId = '44000000-0000-4000-8000-000000000002'
const stepId = '45000000-0000-4000-8000-000000000001'
const documentId = parseDocumentId('46000000-0000-4000-8000-000000000001')
const screenId = parseBackendScreenId('47000000-0000-4000-8000-000000000001')

function structure(): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [textFieldId, numberFieldId],
    icon: 'form',
    id: contentTypeId,
    order: 1,
    pluralName: 'Solicitudes',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Solicitud',
    slug: 'requests',
    supports: ['custom-fields'],
    taxonomyIds: [],
  }
  cms.contentTypes[otherContentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: otherContentTypeId,
    order: 2,
    pluralName: 'Otros',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Otro',
    slug: 'others',
    supports: [],
    taxonomyIds: [],
  }
  cms.fields[textFieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: '', description: '', group: '', id: textFieldId,
    key: 'name', label: 'Nombre', options: [], order: 1, owner: { contentTypeId, kind: 'content-type' }, placeholder: '', relationId: null,
    required: false, taxonomyId: null, type: 'text', validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  cms.fields[numberFieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: 0, description: '', group: '', id: numberFieldId,
    key: 'quantity', label: 'Cantidad', options: [], order: 2, owner: { contentTypeId, kind: 'content-type' }, placeholder: '', relationId: null,
    required: false, taxonomyId: null, type: 'number', validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  return ProjectStructureSchema.parse({ breakpoints: DEFAULT_BREAKPOINTS, cms, documents: {}, globalComponents: {} })
}

function form(id = formId, name = 'Solicitud básica'): Form {
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
    id,
    name,
    steps: [{ controlIds: [firstControlId], id: stepId, name: 'Campos' }],
    successMessage: 'Guardado.',
  }
}

describe('M11.1/M11.2 form builder engine', () => {
  it('crea, lista y actualiza mensajes canónicos sin un store paralelo', () => {
    const created = createForm(structure(), form())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(listForms(created.value).map((item) => item.id)).toEqual([formId])
    expect(created.value.cms?.forms[formId]?.controls[firstControlId]?.mappedFieldId).toBe(textFieldId)

    const messaged = updateForm(created.value, formId, {
      errorMessage: 'Comprueba los datos marcados.',
      successMessage: 'Solicitud preparada correctamente.',
    })
    expect(messaged.ok).toBe(true)
    if (!messaged.ok) return
    expect(messaged.value.cms?.forms[formId]).toMatchObject({
      errorMessage: 'Comprueba los datos marcados.',
      successMessage: 'Solicitud preparada correctamente.',
    })

    const duplicateName = createForm(messaged.value, form(secondFormId, ' solicitud BÁSICA '))
    expect(duplicateName).toMatchObject({ ok: false, error: [{ code: 'form-name-conflict' }] })
  })

  it('añade, reordena, edita condiciones y elimina controles preservando el orden del paso', () => {
    const created = createForm(structure(), form())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const added = addFormControl(created.value, formId, stepId, {
      conditions: [],
      id: secondControlId,
      label: 'Cantidad',
      mappedFieldId: numberFieldId,
      name: 'quantity',
      required: false,
      type: 'number',
    })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(added.value.cms?.forms[formId]?.steps[0]?.controlIds).toEqual([firstControlId, secondControlId])

    const reordered = reorderFormControl(added.value, formId, secondControlId, 0)
    expect(reordered.ok).toBe(true)
    if (!reordered.ok) return
    expect(reordered.value.cms?.forms[formId]?.steps[0]?.controlIds).toEqual([secondControlId, firstControlId])

    const conditions: Form['controls'][string]['conditions'] = [{
      conditions: [{ fieldId: textFieldId, operator: 'exists', value: null }],
      operator: 'all',
    }]
    const updated = updateFormControl(reordered.value, formId, secondControlId, {
      conditions,
      label: 'Unidades',
      name: 'units',
      required: true,
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.cms?.forms[formId]?.controls[secondControlId]).toMatchObject({ label: 'Unidades', name: 'units', required: true })
    expect(updated.value.cms?.forms[formId]?.controls[secondControlId]?.conditions).toEqual(conditions)

    const removed = removeFormControl(updated.value, formId, firstControlId)
    expect(removed.ok).toBe(false)
    expect(removed).toMatchObject({ ok: false, error: [{ code: 'invalid-cms' }] })

    const conditionsCleared = updateFormControl(updated.value, formId, secondControlId, { conditions: [] })
    expect(conditionsCleared.ok).toBe(true)
    if (!conditionsCleared.ok) return
    const removedAfterClear = removeFormControl(conditionsCleared.value, formId, firstControlId)
    expect(removedAfterClear.ok).toBe(true)
    if (!removedAfterClear.ok) return
    expect(removedAfterClear.value.cms?.forms[formId]?.steps[0]?.controlIds).toEqual([secondControlId])
    expect(removedAfterClear.value.cms?.forms[formId]?.controls[firstControlId]).toBeUndefined()

    expect(removeFormControl(removedAfterClear.value, formId, secondControlId)).toMatchObject({ ok: false, error: [{ code: 'last-control-in-step' }] })
  })

  it('rechaza mapeos incompatibles y protege cambios de CPT que invalidarían campos', () => {
    const created = createForm(structure(), form())
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const incompatible = addFormControl(created.value, formId, stepId, {
      conditions: [],
      id: secondControlId,
      label: 'Cantidad',
      mappedFieldId: textFieldId,
      name: 'quantity',
      required: false,
      type: 'number',
    })
    expect(incompatible).toMatchObject({ ok: false, error: [{ code: 'invalid-field-mapping' }] })

    const wrongOwner = updateForm(created.value, formId, { contentTypeId: otherContentTypeId })
    expect(wrongOwner).toMatchObject({ ok: false, error: [{ code: 'invalid-field-mapping' }] })
  })

  it('impide borrar un formulario usado por una pantalla de backend', () => {
    const created = createForm(structure(), form())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const candidate = structuredClone(created.value)
    candidate.documents[documentId] = {
      conditions: [], id: documentId, kind: 'page', name: 'Administración', nodes: {}, rootNodeIds: [], routePath: '/admin',
    }
    if (!candidate.cms) throw new Error('Falta CMS de prueba.')
    candidate.cms.backendScreens[screenId] = {
      allowedRoleIds: [], contentTypeId, documentId, formId, id: screenId, kind: 'form', name: 'Editar solicitud', queryId: null, route: '/admin/request',
    }
    const validated = ProjectStructureSchema.parse(candidate)
    expect(deleteForm(validated, formId)).toMatchObject({ ok: false, error: [{ code: 'form-in-use' }] })
  })
})
