import { describe, expect, it } from 'vitest'
import {
  COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS,
  COMMERCE_WIDGET_DEFINITIONS,
  FILTER_WIDGET_DEFINITIONS,
  FORM_WIDGET_DEFINITIONS,
  createCompleteWidgetRegistry,
} from './commerce-form-filter-widgets'

describe('M06.4 catálogo de comercio, formularios y filtros', () => {
  it('registra 15 widgets de comercio, 20 de formularios y 11 filtros', () => {
    expect(COMMERCE_WIDGET_DEFINITIONS).toHaveLength(15)
    expect(FORM_WIDGET_DEFINITIONS).toHaveLength(20)
    expect(FILTER_WIDGET_DEFINITIONS).toHaveLength(11)
    expect(COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS).toHaveLength(46)
    expect(new Set(COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS.map((item) => item.id))).toHaveProperty('size', 46)
    expect(createCompleteWidgetRegistry().list()).toHaveLength(115)
  })

  it('valida defaults y representa todas las propiedades en el inspector', () => {
    for (const definition of COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS) {
      expect(definition.propertySchema.safeParse(definition.defaults).success, definition.id).toBe(true)
      const fields = new Set(definition.inspector.map((item) => item.key))
      expect(Object.keys(definition.defaults).filter((key) => !fields.has(key)), definition.id).toEqual([])
    }
  })

  it('declara matriz completa y diagnostica capacidades dependientes de runtime', () => {
    const registry = createCompleteWidgetRegistry()
    for (const definition of COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS) {
      expect(Object.keys(definition.exporterSupport).sort(), definition.id).toEqual(['lamp', 'local', 'react', 'wordpress'])
      expect(registry.diagnoseExporter(definition.id, 'local'), definition.id).toEqual([])
      expect(registry.diagnoseExporter(definition.id, 'react'), definition.id).toEqual([])
    }
    expect(registry.diagnoseExporter('commerce.checkout', 'wordpress')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('form.submit', 'lamp')).toMatchObject([{ code: 'diagnostic-only-exporter', severity: 'warning' }])
    expect(registry.diagnoseExporter('commerce.price', 'wordpress')).toEqual([])
  })

  it('mantiene acciones sensibles como contratos declarativos', () => {
    const registry = createCompleteWidgetRegistry()
    expect(registry.get('commerce.checkout')?.defaults).toEqual({ message: 'Checkout no ejecutado', state: 'idle' })
    expect(registry.get('form.submit')?.defaults).toEqual({ disabled: true, label: 'Enviar' })
    expect(registry.get('form.captcha')?.defaults).toEqual({ enabled: false, provider: 'none' })
    expect(registry.get('filter.load-more')?.defaults).toEqual({ disabled: true, label: 'Cargar más', state: 'idle' })
  })
})
