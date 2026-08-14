import { describe, expect, it } from 'vitest'
import { PROJECT_BLUEPRINTS, getProjectBlueprint } from './project-blueprints'

describe('M13.3 catálogo de blueprints', () => {
  it('declara los 20 tipos de proyecto requeridos y los versiona', () => {
    expect(PROJECT_BLUEPRINTS).toHaveLength(20)
    expect(new Set(PROJECT_BLUEPRINTS.map((blueprint) => blueprint.id)).size).toBe(20)
    expect(PROJECT_BLUEPRINTS.every((blueprint) => blueprint.version === 1)).toBe(true)
  })

  it('mantiene la cobertura obligatoria en cada modelo', () => {
    for (const blueprint of PROJECT_BLUEPRINTS) {
      expect(blueprint.coverage).toEqual({ backend: true, contentTypes: true, dashboard: true, demoContent: true, fields: true, filters: true, forms: true, pages: true, queries: true, relations: true, roles: true, taxonomies: true, templates: true })
    }
    expect(getProjectBlueprint('tattoo-studio')?.primaryContentSlug).toBe('tattoo-booking')
  })
})
