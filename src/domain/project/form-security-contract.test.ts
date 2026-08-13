import { describe, expect, it } from 'vitest'
import { parseFormId } from './identity'
import type { Form } from './cms-schema'
import {
  DEFAULT_FORM_FILE_POLICY,
  formSecurityRequirements,
  prepareSecureFormPayload,
  validatePortableFileDescriptor,
} from './form-security-contract'

const formId = parseFormId('b1000000-0000-4000-8000-000000000001')
const controlId = 'b2000000-0000-4000-8000-000000000001'
const stepId = 'b3000000-0000-4000-8000-000000000001'

function form(csrfProtection = true): Form {
  return {
    actions: [],
    contentTypeId: null,
    controls: {
      [controlId]: { conditions: [], id: controlId, label: 'Mensaje', mappedFieldId: null, name: 'message', required: false, type: 'text' },
    },
    csrfProtection,
    draftSaving: false,
    errorMessage: 'Error',
    id: formId,
    name: 'Seguro',
    steps: [{ controlIds: [controlId], id: stepId, name: 'Datos' }],
    successMessage: 'Correcto',
  }
}

describe('M11.5 form security contract', () => {
  it('normaliza texto portable sin aplicar HTML escaping irreversible', () => {
    const result = prepareSecureFormPayload(form(), { [controlId]: '<strong>Hola</strong>\r\n\u0000Mundo' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.values[controlId]).toBe('<strong>Hola</strong>\nMundo')
  })

  it('rechaza controles desconocidos y valores que exceden la política', () => {
    const unknown = prepareSecureFormPayload(form(), { intruder: 'x' })
    expect(unknown.ok).toBe(false)
    if (unknown.ok) return
    expect(unknown.diagnostics[0]).toMatchObject({ code: 'unknown-control', controlId: 'intruder' })

    const oversized = prepareSecureFormPayload(form(), { [controlId]: 'abcdef' }, {
      maxArrayItems: 2,
      maxDepth: 2,
      maxObjectProperties: 2,
      maxPayloadBytes: 4,
      maxStringLength: 3,
    })
    expect(oversized.ok).toBe(false)
    if (oversized.ok) return
    expect(oversized.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining(['value-too-large', 'payload-too-large']))
  })

  it('limita colecciones y profundidad antes de entregar el payload a adapters', () => {
    const result = prepareSecureFormPayload(form(), { [controlId]: { nested: { again: { value: 'x' } } } }, {
      maxArrayItems: 1,
      maxDepth: 1,
      maxObjectProperties: 1,
      maxPayloadBytes: 4096,
      maxStringLength: 100,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.diagnostics.some((item) => item.code === 'value-too-deep')).toBe(true)
  })

  it('valida tamaño, MIME y extensión como contrato portable de archivos', () => {
    const valid = validatePortableFileDescriptor({ extension: '.PNG', mime: 'IMAGE/PNG', name: 'foto.png', size: 1024 })
    expect(valid).toMatchObject({ ok: true, file: { extension: 'png', mime: 'image/png' } })

    const invalid = validatePortableFileDescriptor({ extension: 'exe', mime: 'application/octet-stream', name: 'payload.exe', size: DEFAULT_FORM_FILE_POLICY.maxBytes + 1 })
    expect(invalid.ok).toBe(false)
    if (invalid.ok) return
    expect(invalid.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining([
      'invalid-file-size',
      'invalid-file-mime',
      'invalid-file-extension',
    ]))
  })

  it('declara protección de servidor sin inventar tokens en el editor', () => {
    expect(formSecurityRequirements(form(true))).toEqual({
      captcha: 'optional',
      csrf: true,
      honeypot: true,
      outputEscaping: true,
      rateLimit: true,
      serverFileRevalidation: true,
      serverInputValidation: true,
    })
    expect(formSecurityRequirements(form(false)).csrf).toBe(false)
  })
})
