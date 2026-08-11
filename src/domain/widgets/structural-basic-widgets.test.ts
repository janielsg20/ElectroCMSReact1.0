import { describe, expect, it } from 'vitest'
import {
  BASIC_WIDGET_DEFINITIONS,
  STRUCTURAL_BASIC_WIDGET_DEFINITIONS,
  STRUCTURAL_WIDGET_DEFINITIONS,
  createStructuralBasicWidgetRegistry,
} from './structural-basic-widgets'

describe('M06.2 catálogo estructural y básico', () => {
  it('registra los 15 estructurales y 20 básicos exigidos sin IDs duplicados', () => {
    expect(STRUCTURAL_WIDGET_DEFINITIONS).toHaveLength(15)
    expect(BASIC_WIDGET_DEFINITIONS).toHaveLength(20)
    expect(STRUCTURAL_BASIC_WIDGET_DEFINITIONS).toHaveLength(35)
    expect(new Set(STRUCTURAL_BASIC_WIDGET_DEFINITIONS.map((item) => item.id))).toHaveProperty('size', 35)

    const registry = createStructuralBasicWidgetRegistry()
    expect(registry.list()).toHaveLength(35)
    expect(registry.list().filter((item) => item.category === 'structure')).toHaveLength(15)
    expect(registry.list().filter((item) => item.category === 'basic')).toHaveLength(20)
  })

  it('valida defaults y expone en el inspector cada propiedad editable', () => {
    for (const definition of STRUCTURAL_BASIC_WIDGET_DEFINITIONS) {
      expect(definition.propertySchema.safeParse(definition.defaults).success, definition.id).toBe(true)
      const inspectorKeys = new Set(definition.inspector.map((item) => item.key))
      expect([...Object.keys(definition.defaults)].filter((key) => !inspectorKeys.has(key)), definition.id).toEqual([])
    }
  })

  it('declara soporte de los cuatro exportadores y diagnostica los adapters condicionados', () => {
    const registry = createStructuralBasicWidgetRegistry()
    for (const definition of STRUCTURAL_BASIC_WIDGET_DEFINITIONS) {
      expect(Object.keys(definition.exporterSupport).sort(), definition.id).toEqual(['lamp', 'local', 'react', 'wordpress'])
      expect(registry.diagnoseExporter(definition.id, 'local'), definition.id).toEqual([])
      expect(registry.diagnoseExporter(definition.id, 'react'), definition.id).toEqual([])
    }

    expect(registry.diagnoseExporter('embed.iframe', 'wordpress')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('layout.modal', 'lamp')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('content.heading', 'wordpress')).toEqual([])
  })

  it('conserva metadatos accesibles en widgets cuyo nombre es obligatorio', () => {
    const named = STRUCTURAL_BASIC_WIDGET_DEFINITIONS.filter((item) => item.accessibility.requiresAccessibleName)
    expect(named.length).toBeGreaterThan(0)
    for (const definition of named) {
      expect(definition.inspector.some((item) => item.section === 'accessibility'), definition.id).toBe(true)
    }
  })
})
