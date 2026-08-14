import { describe, expect, it } from 'vitest'
import { mediaAssetUrl, parseMediaAssetId, type ProjectStructure } from '../../domain'
import { STARTER_PROJECT_STRUCTURE } from './starter-project-structure'
import { referencedMediaAssetUrls } from './media-preview-sources'

describe('referencedMediaAssetUrls', () => {
  it('extrae únicamente referencias locales válidas y sin duplicados', () => {
    const first = parseMediaAssetId('11111111-1111-4111-8111-111111111111')
    const second = parseMediaAssetId('22222222-2222-4222-8222-222222222222')
    const structure: ProjectStructure = structuredClone(STARTER_PROJECT_STRUCTURE)
    const document = Object.values(structure.documents)[0]
    if (!document) throw new Error('Falta documento inicial.')
    const node = Object.values(document.nodes).find((candidate) => candidate.kind === 'widget')
    if (!node) throw new Error('Falta widget inicial.')
    document.nodes[node.id] = {
      ...node,
      properties: {
        ...node.properties,
        description: `Externa asset://invalida y locales ${mediaAssetUrl(first)} ${mediaAssetUrl(first)}`,
        src: mediaAssetUrl(second),
      },
    }

    expect(referencedMediaAssetUrls(structure)).toEqual([mediaAssetUrl(first), mediaAssetUrl(second)].sort())
  })
})
