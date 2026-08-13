import { describe, expect, it } from 'vitest'
import { parseFormId } from './identity'
import type { Form } from './cms-schema'
import { mergeFormStepBackward, moveFormStep, renameFormStep, splitFormStep } from './form-step-runtime'

const formId = parseFormId('71000000-0000-4000-8000-000000000001')
const firstControlId = '72000000-0000-4000-8000-000000000001'
const secondControlId = '72000000-0000-4000-8000-000000000002'
const thirdControlId = '72000000-0000-4000-8000-000000000003'
const firstStepId = '73000000-0000-4000-8000-000000000001'
const secondStepId = '73000000-0000-4000-8000-000000000002'

function control(id: string, name: string): Form['controls'][string] {
  return { conditions: [], id, label: name, mappedFieldId: null, name: name.toLowerCase(), required: false, type: 'text' }
}

function form(): Form {
  return {
    actions: [],
    contentTypeId: null,
    controls: {
      [firstControlId]: control(firstControlId, 'Nombre'),
      [secondControlId]: control(secondControlId, 'Correo'),
      [thirdControlId]: control(thirdControlId, 'Mensaje'),
    },
    csrfProtection: true,
    draftSaving: false,
    errorMessage: 'Revisa los campos.',
    id: formId,
    name: 'Contacto',
    steps: [{ controlIds: [firstControlId, secondControlId, thirdControlId], id: firstStepId, name: 'Datos' }],
    successMessage: 'Listo.',
  }
}

describe('M11.3 form step planner', () => {
  it('divide un paso sin dejar pasos vacíos', () => {
    const result = splitFormStep(form(), firstStepId, secondControlId, secondStepId, 'Mensaje')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.steps).toEqual([
      { controlIds: [firstControlId], id: firstStepId, name: 'Datos' },
      { controlIds: [secondControlId, thirdControlId], id: secondStepId, name: 'Mensaje' },
    ])
  })

  it('rechaza dividir antes del primer campo', () => {
    const result = splitFormStep(form(), firstStepId, firstControlId, secondStepId, 'Segundo')
    expect(result).toMatchObject({ ok: false })
  })

  it('renombra, mueve y vuelve a fusionar pasos preservando el orden de controles', () => {
    const split = splitFormStep(form(), firstStepId, secondControlId, secondStepId, 'Segundo')
    expect(split.ok).toBe(true)
    if (!split.ok) return
    const splitForm = { ...form(), steps: [...split.steps] }

    const renamed = renameFormStep(splitForm, secondStepId, 'Confirmación')
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    expect(renamed.steps[1]?.name).toBe('Confirmación')

    const renamedForm = { ...splitForm, steps: [...renamed.steps] }
    const moved = moveFormStep(renamedForm, secondStepId, -1)
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.steps.map((step) => step.id)).toEqual([secondStepId, firstStepId])

    const mergedForm = { ...renamedForm, steps: [...renamed.steps] }
    const merged = mergeFormStepBackward(mergedForm, secondStepId)
    expect(merged.ok).toBe(true)
    if (!merged.ok) return
    expect(merged.steps).toEqual([{ controlIds: [firstControlId, secondControlId, thirdControlId], id: firstStepId, name: 'Datos' }])
  })
})
