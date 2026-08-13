import { describe, expect, it } from 'vitest'
import { parseFormId } from './identity'
import type { Form } from './cms-schema'
import { clearFormDraft, formDraftKey, readFormDraft, writeFormDraft, type FormDraftStorage } from './form-draft-storage'

class MemoryStorage implements FormDraftStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const formId = parseFormId('74000000-0000-4000-8000-000000000001')
const controlId = '75000000-0000-4000-8000-000000000001'
const stepId = '76000000-0000-4000-8000-000000000001'

function form(): Form {
  return {
    actions: [],
    contentTypeId: null,
    controls: {
      [controlId]: { conditions: [], id: controlId, label: 'Nombre', mappedFieldId: null, name: 'name', required: false, type: 'text' },
    },
    csrfProtection: true,
    draftSaving: true,
    errorMessage: 'Error',
    id: formId,
    name: 'Borrador',
    steps: [{ controlIds: [controlId], id: stepId, name: 'Datos' }],
    successMessage: 'Correcto',
  }
}

describe('M11.3 form draft storage', () => {
  it('guarda y recupera valores del formulario y paso actuales', () => {
    const storage = new MemoryStorage()
    const written = writeFormDraft(storage, form(), stepId, { [controlId]: 'Ada', desconocido: 'ignorar' }, () => '2026-08-13T03:00:00.000Z')
    expect(written.ok).toBe(true)
    expect(readFormDraft(storage, form())).toMatchObject({
      formId,
      stepId,
      updatedAt: '2026-08-13T03:00:00.000Z',
      values: { [controlId]: 'Ada' },
      version: 1,
    })
  })

  it('ignora borradores corruptos o con pasos que ya no existen', () => {
    const storage = new MemoryStorage()
    storage.setItem(formDraftKey(formId), '{ roto')
    expect(readFormDraft(storage, form())).toBeNull()

    storage.setItem(formDraftKey(formId), JSON.stringify({ version: 1, formId, stepId: crypto.randomUUID(), updatedAt: 'hoy', values: {} }))
    expect(readFormDraft(storage, form())).toBeNull()
  })

  it('elimina el borrador sin afectar la definición del formulario', () => {
    const storage = new MemoryStorage()
    expect(writeFormDraft(storage, form(), stepId, { [controlId]: 'Ada' }).ok).toBe(true)
    expect(clearFormDraft(storage, formId)).toBe(true)
    expect(readFormDraft(storage, form())).toBeNull()
  })
})
