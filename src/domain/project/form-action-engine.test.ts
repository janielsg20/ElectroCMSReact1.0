import { describe, expect, it, vi } from 'vitest'
import { parseContentTypeId, parseFieldDefinitionId, parseFormId } from './identity'
import type { CmsBackend, FieldDefinition, Form } from './cms-schema'
import { executeFormActionPipeline, mapFormValuesToFields } from './form-action-engine'

const contentTypeId = parseContentTypeId('81000000-0000-4000-8000-000000000001')
const fieldId = parseFieldDefinitionId('82000000-0000-4000-8000-000000000001')
const formId = parseFormId('83000000-0000-4000-8000-000000000001')
const firstControlId = '84000000-0000-4000-8000-000000000001'
const secondControlId = '84000000-0000-4000-8000-000000000002'
const stepId = '85000000-0000-4000-8000-000000000001'

function field(): FieldDefinition {
  return {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: '', description: '', group: '',
    id: fieldId, key: 'name', label: 'Nombre CMS', options: [], order: 10,
    owner: { contentTypeId, kind: 'content-type' }, placeholder: '', relationId: null, required: false, taxonomyId: null, type: 'text',
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
}

function cms(): CmsBackend {
  return {
    backendScreens: {}, contentTypes: {}, fields: { [fieldId]: field() }, forms: {}, menus: {}, queries: {}, records: {}, recordRevisions: {},
    relationEntries: {}, relations: {}, roles: {}, taxonomies: {}, taxonomyTerms: {}, users: {},
  }
}

function form(actions: Form['actions'] = []): Form {
  return {
    actions, contentTypeId, csrfProtection: true, draftSaving: false, errorMessage: 'Revisa el formulario.', id: formId, name: 'Contacto',
    controls: {
      [firstControlId]: { conditions: [], id: firstControlId, label: 'Nombre', mappedFieldId: fieldId, name: 'name', required: true, type: 'text' },
    },
    steps: [{ controlIds: [firstControlId], id: stepId, name: 'Datos' }], successMessage: 'Listo.',
  }
}

function action(id: string, kind: Form['actions'][number]['kind']): Form['actions'][number] {
  return { config: {}, id, kind }
}

describe('M11.4 form action pipeline', () => {
  it('valida antes de ejecutar y no llama handlers si el formulario es inválido', async () => {
    const handler = vi.fn(() => ({ ok: true as const }))
    const current = form([action('86000000-0000-4000-8000-000000000001', 'show-message')])
    const result = await executeFormActionPipeline(current, cms(), {}, { 'show-message': handler })

    expect(result.completed).toBe(false)
    expect(result.error?.code).toBe('validation-failed')
    expect(handler).not.toHaveBeenCalled()
  })

  it('mapea una sola vez y ejecuta acciones secuencialmente', async () => {
    const firstAction = action('86000000-0000-4000-8000-000000000002', 'show-message')
    const secondAction = action('86000000-0000-4000-8000-000000000003', 'redirect')
    const order: string[] = []
    const current = form([firstAction, secondAction])

    const result = await executeFormActionPipeline(current, cms(), { [firstControlId]: 'Ada' }, {
      'show-message': (_action, context) => {
        order.push('message')
        expect(context.mappedValues[fieldId]).toBe('Ada')
        return { ok: true, output: 'shown' }
      },
      redirect: (_action, context) => {
        order.push('redirect')
        expect(context.actionIndex).toBe(1)
        return { ok: true, output: '/gracias' }
      },
    })

    expect(result.completed).toBe(true)
    expect(result.mappedValues).toEqual({ [fieldId]: 'Ada' })
    expect(order).toEqual(['message', 'redirect'])
    expect(result.records.map((record) => record.status)).toEqual(['success', 'success'])
  })

  it('se detiene si falta el adapter o una acción falla', async () => {
    const firstAction = action('86000000-0000-4000-8000-000000000004', 'show-message')
    const externalAction = action('86000000-0000-4000-8000-000000000005', 'webhook')
    const after = vi.fn(() => ({ ok: true as const }))
    const missing = await executeFormActionPipeline(form([firstAction, externalAction]), cms(), { [firstControlId]: 'Ada' }, {
      'show-message': () => ({ ok: true }),
      redirect: after,
    })
    expect(missing.error?.code).toBe('adapter-missing')
    expect(missing.records).toHaveLength(1)
    expect(after).not.toHaveBeenCalled()

    const failed = await executeFormActionPipeline(form([firstAction, action('86000000-0000-4000-8000-000000000006', 'redirect')]), cms(), { [firstControlId]: 'Ada' }, {
      'show-message': () => ({ ok: false, message: 'No se pudo mostrar.' }),
      redirect: after,
    })
    expect(failed.error?.code).toBe('action-failed')
    expect(failed.records[0]).toMatchObject({ status: 'failed' })
    expect(after).not.toHaveBeenCalled()
  })

  it('rechaza mappings ambiguos con valores distintos', () => {
    const current = form()
    current.controls[secondControlId] = { conditions: [], id: secondControlId, label: 'Alias', mappedFieldId: fieldId, name: 'alias', required: false, type: 'text' }
    current.steps[0]?.controlIds.push(secondControlId)
    const result = mapFormValuesToFields(current, { [firstControlId]: 'Ada', [secondControlId]: 'Grace' })
    expect(result).toMatchObject({ ok: false })
  })
})
