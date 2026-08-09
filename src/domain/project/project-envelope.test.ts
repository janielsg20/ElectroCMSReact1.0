import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import { deserializeCanonical, serializeCanonical } from './canonical-json'
import { parseProjectId, parseTimestamp } from './identity'
import {
  createProjectEnvelopeSchema,
  CURRENT_PROJECT_SCHEMA_VERSION,
  PROJECT_FORMAT,
} from './project-envelope'

const payloadSchema = z.strictObject({
  title: z.string(),
  flags: z.array(z.string()),
})

const envelopeSchema = createProjectEnvelopeSchema(payloadSchema)

const validEnvelope = {
  format: PROJECT_FORMAT,
  schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
  projectId: '01989d97-41f0-7d62-a0b3-7f30e657ea38',
  revision: 0,
  name: 'Proyecto base',
  createdAt: '2026-08-09T20:40:00.000Z',
  updatedAt: '2026-08-09T20:40:00.000Z',
  metadata: {
    locale: 'es',
    nested: { beta: true, count: 2 },
  },
  payload: {
    title: 'Inicio',
    flags: ['local-first'],
  },
}

describe('identidad y envelope de proyecto', () => {
  it('acepta UUID y timestamps UTC canónicos', () => {
    expect(parseProjectId(validEnvelope.projectId)).toBe(validEnvelope.projectId)
    expect(parseTimestamp(validEnvelope.createdAt)).toBe(validEnvelope.createdAt)

    expect(() => parseProjectId('project-1')).toThrow()
    expect(() => parseTimestamp('2026-08-09')).toThrow()
    expect(() => parseTimestamp('2026-08-09T20:40:00.000+01:00')).toThrow()
  })

  it('rechaza versiones, propiedades y cronología incompatibles', () => {
    expect(envelopeSchema.safeParse({ ...validEnvelope, schemaVersion: 2 }).success).toBe(false)
    expect(envelopeSchema.safeParse({ ...validEnvelope, unexpected: true }).success).toBe(false)
    expect(
      envelopeSchema.safeParse({
        ...validEnvelope,
        updatedAt: '2026-08-09T20:39:59.000Z',
      }).success,
    ).toBe(false)
  })

  it('serializa de forma determinista sin alterar el orden de arrays', () => {
    const first = serializeCanonical(envelopeSchema, validEnvelope)
    const second = serializeCanonical(envelopeSchema, {
      payload: validEnvelope.payload,
      metadata: {
        nested: { count: 2, beta: true },
        locale: 'es',
      },
      updatedAt: validEnvelope.updatedAt,
      createdAt: validEnvelope.createdAt,
      name: validEnvelope.name,
      revision: validEnvelope.revision,
      projectId: validEnvelope.projectId,
      schemaVersion: validEnvelope.schemaVersion,
      format: validEnvelope.format,
    })

    expect(first).toEqual(second)
    expect(first.ok && first.value).toContain('"flags":["local-first"]')
  })

  it('deserializa solo JSON que cumple el schema', () => {
    const serialized = serializeCanonical(envelopeSchema, validEnvelope)
    expect(serialized.ok).toBe(true)
    if (!serialized.ok) return

    const restored = deserializeCanonical(envelopeSchema, serialized.value)
    expect(restored).toEqual({ ok: true, value: envelopeSchema.parse(validEnvelope) })

    expect(deserializeCanonical(envelopeSchema, '{')).toEqual({
      ok: false,
      error: { kind: 'invalid-json', message: 'El documento no contiene JSON válido.' },
    })
    expect(deserializeCanonical(envelopeSchema, '{}').ok).toBe(false)
  })

  it('expone un JSON Schema estricto y versionado', () => {
    const jsonSchema = z.toJSONSchema(envelopeSchema)

    expect(jsonSchema).toMatchObject({
      type: 'object',
      additionalProperties: false,
      properties: {
        format: { const: PROJECT_FORMAT },
        schemaVersion: { const: CURRENT_PROJECT_SCHEMA_VERSION },
        projectId: { format: 'uuid' },
        createdAt: { format: 'date-time' },
      },
    })
  })
})
