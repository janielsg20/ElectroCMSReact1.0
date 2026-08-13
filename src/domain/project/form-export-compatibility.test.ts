import { describe, expect, it } from 'vitest'
import { parseFormId } from './identity'
import type { Form } from './cms-schema'
import { FORM_ACTION_KINDS } from './form-action-catalog'
import { formExportCompatibility, formExportCompatibilityMatrix } from './form-export-compatibility'

const formId = parseFormId('c1000000-0000-4000-8000-000000000001')

function form(csrfProtection = true): Form {
  return {
    actions: [],
    contentTypeId: null,
    controls: {
      control: { conditions: [], id: 'control', label: 'Campo', mappedFieldId: null, name: 'field', required: false, type: 'text' },
    },
    csrfProtection,
    draftSaving: false,
    errorMessage: 'Error',
    id: formId,
    name: 'Compatibilidad',
    steps: [{ controlIds: ['control'], id: 'step', name: 'Datos' }],
    successMessage: 'Correcto',
  }
}

describe('M11.5 form export compatibility', () => {
  it('mantiene Local como vista previa y no declara exportadores futuros como listos', () => {
    const matrix = formExportCompatibilityMatrix(form())
    expect(matrix.map((item) => [item.target, item.availability, item.ownerPhase])).toEqual([
      ['local', 'editor-preview-only', 'F14'],
      ['react', 'planned', 'F14'],
      ['lamp', 'planned', 'F15'],
      ['wordpress', 'planned', 'F16'],
    ])
    expect(matrix.filter((item) => item.target !== 'local').every((item) => item.actions.every((action) => action.status === 'exporter-pending'))).toBe(true)
  })

  it('declara las 12 acciones canónicas y distingue preview local de adapters', () => {
    const local = formExportCompatibility(form(), 'local')
    expect(local.actions).toHaveLength(FORM_ACTION_KINDS.length)
    expect(local.actions).toHaveLength(12)
    expect(local.actions.find((item) => item.kind === 'show-message')?.status).toBe('contract-ready')
    expect(local.actions.find((item) => item.kind === 'redirect')?.status).toBe('contract-ready')
    expect(local.actions.find((item) => item.kind === 'save-record')?.status).toBe('adapter-required')
    expect(local.actions.find((item) => item.kind === 'webhook')?.status).toBe('adapter-required')
  })

  it('marca CSRF como no aplicable cuando el formulario lo desactiva y pendiente cuando se requiere', () => {
    expect(formExportCompatibility(form(false), 'lamp').security.csrf).toBe('not-applicable')
    expect(formExportCompatibility(form(true), 'lamp').security.csrf).toBe('exporter-pending')
    expect(formExportCompatibility(form(true), 'local').security.csrf).toBe('adapter-required')
  })
})
