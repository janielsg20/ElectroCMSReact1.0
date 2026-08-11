import { describe, expect, it } from 'vitest'
import {
  CONTENT_DYNAMIC_WIDGET_DEFINITIONS,
  CONTENT_WIDGET_DEFINITIONS,
  DYNAMIC_WIDGET_DEFINITIONS,
  createCoreWidgetRegistry,
} from './content-dynamic-widgets'

describe('M06.3 catálogo de contenido y dinámicos', () => {
  it('registra 20 widgets de contenido y 14 dinámicos en el catálogo acumulado', () => {
    expect(CONTENT_WIDGET_DEFINITIONS).toHaveLength(20)
    expect(DYNAMIC_WIDGET_DEFINITIONS).toHaveLength(14)
    expect(CONTENT_DYNAMIC_WIDGET_DEFINITIONS).toHaveLength(34)
    expect(new Set(CONTENT_DYNAMIC_WIDGET_DEFINITIONS.map((item) => item.id))).toHaveProperty('size', 34)
    expect(createCoreWidgetRegistry().list()).toHaveLength(69)
  })

  it('valida defaults y representa cada propiedad mediante inspector declarativo', () => {
    for (const definition of CONTENT_DYNAMIC_WIDGET_DEFINITIONS) {
      expect(definition.propertySchema.safeParse(definition.defaults).success, definition.id).toBe(true)
      const fields = new Set(definition.inspector.map((item) => item.key))
      expect(Object.keys(definition.defaults).filter((key) => !fields.has(key)), definition.id).toEqual([])
    }
  })

  it('declara los cuatro destinos y diagnostica funciones que dependen de runtime futuro', () => {
    const registry = createCoreWidgetRegistry()
    for (const definition of CONTENT_DYNAMIC_WIDGET_DEFINITIONS) {
      expect(Object.keys(definition.exporterSupport).sort(), definition.id).toEqual(['lamp', 'local', 'react', 'wordpress'])
      expect(registry.diagnoseExporter(definition.id, 'local'), definition.id).toEqual([])
      expect(registry.diagnoseExporter(definition.id, 'react'), definition.id).toEqual([])
    }
    expect(registry.diagnoseExporter('dynamic.query-result', 'wordpress')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('content.carousel', 'lamp')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('content.article', 'wordpress')).toEqual([])
  })

  it('mantiene bindings y expresiones como datos declarativos', () => {
    const registry = createCoreWidgetRegistry()
    expect(registry.get('dynamic.field')?.inspector).toEqual(expect.arrayContaining([expect.objectContaining({ control: 'binding', section: 'data' })]))
    expect(registry.get('dynamic.calculated-field')?.defaults).toEqual({ expression: '', fallback: 'Sin cálculo' })
  })
})
