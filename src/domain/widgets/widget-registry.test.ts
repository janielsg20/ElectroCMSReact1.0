import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import type { JsonValue } from '../project/project-envelope'
import { WidgetRegistry, diagnoseWidgetDefinition, type WidgetDefinition } from './widget-registry'

const propertySchema: z.ZodType<Record<string, JsonValue>> = z.object({ text: z.string() })

function definition(overrides: Partial<WidgetDefinition> = {}): WidgetDefinition {
  return {
    accessibility: { requiresAccessibleName: false, semanticRole: 'heading' },
    category: 'basic',
    defaults: { text: 'Título' },
    description: 'Título semántico.',
    exporterSupport: { lamp: 'supported', local: 'supported', react: 'supported', wordpress: 'diagnostic-only' },
    icon: { path: 'M5 6h14M12 6v12', viewBox: '0 0 24 24' },
    id: 'content.heading',
    inspector: [{ control: 'text', key: 'text', label: 'Texto', required: true, section: 'content' }],
    label: 'Encabezado',
    migrations: [],
    propertySchema,
    rendererId: 'canonical.heading',
    schemaVersion: 1,
    version: '1.0.0',
    ...overrides,
  }
}

describe('M06.1 WidgetRegistry', () => {
  it('registra contratos completos y conserva orden determinista', () => {
    const registry = new WidgetRegistry()
    expect(registry.register(definition())).toMatchObject({ ok: true })
    expect(registry.get('content.heading')?.defaults).toEqual({ text: 'Título' })
    expect(registry.list().map((item) => item.id)).toEqual(['content.heading'])
  })

  it('rechaza defaults inválidos, renderer ausente e inspector incompleto', () => {
    const diagnostics = diagnoseWidgetDefinition(definition({ defaults: { text: 12 }, inspector: [], rendererId: '' }))
    expect(diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining(['invalid-defaults', 'missing-renderer', 'missing-inspector']))
  })

  it('rechaza duplicados y cadenas de migración incompletas', () => {
    const registry = new WidgetRegistry()
    registry.register(definition())
    expect(registry.register(definition())).toMatchObject({ ok: false, error: [{ code: 'duplicate-widget' }] })
    expect(diagnoseWidgetDefinition(definition({ schemaVersion: 3 }))).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'invalid-migrations' })]))
  })

  it('diagnostica soporte por exportador sin omitir incompatibilidades', () => {
    const registry = new WidgetRegistry()
    registry.register(definition({ exporterSupport: { lamp: 'unsupported', local: 'supported', react: 'supported', wordpress: 'diagnostic-only' } }))
    expect(registry.diagnoseExporter('content.heading', 'react')).toEqual([])
    expect(registry.diagnoseExporter('content.heading', 'wordpress')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('content.heading', 'lamp')).toMatchObject([{ code: 'unsupported-exporter', severity: 'error' }])
  })
})
