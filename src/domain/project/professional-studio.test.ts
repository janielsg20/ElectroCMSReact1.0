import { describe, expect, it } from 'vitest'
import { professionalStudioManifest, withProfessionalStudioManifest } from './professional-studio'

describe('M13.5 professionalStudio', () => {
  it('declara estados honestos para cada destino', () => {
    expect(professionalStudioManifest('local').capabilities.export).toBe('interactive-demo')
    expect(professionalStudioManifest('wordpress').capabilities.export).toBe('planned')
  })

  it('adjunta el manifiesto sin modificar el paquete del destino', () => {
    expect(withProfessionalStudioManifest('react', { revision: 'r1' })).toMatchObject({ revision: 'r1', professionalStudio: { destination: 'react', version: 1 } })
  })
})
