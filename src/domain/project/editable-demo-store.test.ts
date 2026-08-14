import { describe, expect, it } from 'vitest'
import { STARTER_PROJECT_STRUCTURE } from '../../editor-ui/editor/starter-project-structure'
import { editableDemoStore, updateEditableDemoStore } from './editable-demo-store'

describe('M13.4 tienda demo editable', () => {
  it('guarda identidad, producto y panel en la misma estructura canónica', () => {
    const updated = updateEditableDemoStore(STARTER_PROJECT_STRUCTURE, {
      dashboard: { metricOrder: ['orders', 'sales', 'stock'], visibleMetrics: ['orders', 'sales'] },
      featuredProduct: { callToAction: 'Reservar ahora', mediaUrl: 'asset://product', name: 'Lámpara Arc', price: '€89', stock: 4 },
      identity: { claim: 'Luz para lo cotidiano', contact: 'hola@luz.local', logoUrl: 'asset://logo', name: 'Luz local' },
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(editableDemoStore(updated.value)).toMatchObject({
      identity: { name: 'Luz local' },
      featuredProduct: { name: 'Lámpara Arc', stock: 4 },
      dashboard: { visibleMetrics: ['orders', 'sales'] },
    })
  })

  it('rechaza colores que no cumplen el contrato en vez de persistirlos', () => {
    const updated = updateEditableDemoStore(STARTER_PROJECT_STRUCTURE, { colors: { primary: 'blue', surface: '#ffffff' } })
    expect(updated).toMatchObject({ ok: false })
  })
})
