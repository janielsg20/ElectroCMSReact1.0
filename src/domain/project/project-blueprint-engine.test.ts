import { describe, expect, it } from 'vitest'
import { STARTER_PROJECT_STRUCTURE } from '../../editor-ui/editor/starter-project-structure'
import { applyProjectBlueprint } from './project-blueprint-engine'
import { getProjectBlueprint } from './project-blueprints'

function ids() {
  let index = 0
  return () => `00000000-0000-4000-8000-${String(++index).padStart(12, '0')}`
}

describe('M13.3 aplicación de blueprints', () => {
  it('crea recursos CMS, páginas y contenido editable mediante una sola estructura válida', () => {
    const blueprint = getProjectBlueprint('tattoo-studio')
    if (!blueprint) throw new Error('Falta el blueprint de estudio de tatuajes.')

    const applied = applyProjectBlueprint(STARTER_PROJECT_STRUCTURE, blueprint, {
      createId: ids(),
      now: '2026-08-14T00:00:00.000Z',
    })

    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    expect(applied.value.report.created).toEqual({ backendScreens: 1, contentTypes: 1, documents: 3, fields: 1, forms: 1, queries: 1, records: 1, relations: 1, roles: 1, taxonomies: 1 })
    expect(Object.values(applied.value.structure.cms?.contentTypes ?? {}).map((item) => item.slug)).toContain('tattoo-booking')
    expect(Object.values(applied.value.structure.documents).map((item) => item.routePath)).toContain('/tattoo-booking')
    expect(Object.values(applied.value.structure.cms?.backendScreens ?? {})[0]).toMatchObject({ kind: 'table', route: '/admin/tattoo-booking' })
  })

  it('no sobrescribe recursos existentes cuando se intenta aplicar dos veces', () => {
    const blueprint = getProjectBlueprint('blog')
    if (!blueprint) throw new Error('Falta el blueprint de blog.')
    const first = applyProjectBlueprint(STARTER_PROJECT_STRUCTURE, blueprint, { createId: ids(), now: '2026-08-14T00:00:00.000Z' })
    if (!first.ok) throw new Error(first.error.join(' '))
    const second = applyProjectBlueprint(first.value.structure, blueprint, { createId: ids(), now: '2026-08-14T00:00:00.000Z' })
    expect(second).toMatchObject({ ok: false })
  })
})
