import { describe, expect, it } from 'vitest'
import { parseMediaAssetId, parseMediaFolderId, parseMediaTagId, parseTimestamp } from './identity'
import { addMediaAsset, createMediaFolder, createMediaTag, deleteMediaAsset, mediaAssetUrl, updateMediaAsset } from './media-library'
import { STARTER_PROJECT_STRUCTURE } from '../../editor-ui/editor/starter-project-structure'

const assetId = parseMediaAssetId('b1000000-0000-4000-8000-000000000001')
const time = parseTimestamp('2026-08-13T23:00:00.000Z')
const image = { altText: '', byteSize: 1200, contentHash: 'a'.repeat(64), description: '', fileName: 'logo.png', folderId: null, height: 120, id: assetId, kind: 'image' as const, mimeType: 'image/png', name: 'Logo', starred: false, tagIds: [], width: 240 }

describe('M13.1 biblioteca multimedia', () => {
  it('guarda metadatos, deduplica por huella y actualiza datos accesibles', () => {
    const added = addMediaAsset(STARTER_PROJECT_STRUCTURE, image, time)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(added.value.media?.assets[assetId]).toMatchObject({ altText: '', name: 'Logo', width: 240 })
    expect(addMediaAsset(added.value, { ...image, id: parseMediaAssetId('b1000000-0000-4000-8000-000000000002') }, time)).toMatchObject({ ok: false, error: 'El recurso ya existe en la biblioteca.' })
    expect(updateMediaAsset(added.value, assetId, { altText: 'Logotipo de ElectroCMS', starred: true }, time)).toMatchObject({ ok: true, value: { media: { assets: { [assetId]: { altText: 'Logotipo de ElectroCMS', starred: true } } } } })
  })

  it('impide eliminar un recurso referenciado por un documento', () => {
    const added = addMediaAsset(STARTER_PROJECT_STRUCTURE, image, time)
    if (!added.ok) throw new Error(added.error)
    const referenced = structuredClone(added.value)
    const document = referenced.documents[Object.keys(referenced.documents)[0] as never]
    if (!document) throw new Error('Documento inicial ausente.')
    const node = document.nodes[Object.keys(document.nodes)[0] as never]
    if (!node) throw new Error('Nodo inicial ausente.')
    node.properties.asset = mediaAssetUrl(assetId)
    expect(deleteMediaAsset(referenced, assetId)).toMatchObject({ ok: false, error: 'El recurso sigue usándose en el proyecto.' })
  })

  it('organiza recursos con carpetas y etiquetas canónicas', () => {
    const folderId = parseMediaFolderId('b4000000-0000-4000-8000-000000000001')
    const tagId = parseMediaTagId('b5000000-0000-4000-8000-000000000001')
    const folder = createMediaFolder(STARTER_PROJECT_STRUCTURE, { id: folderId, name: 'Marca', parentId: null })
    if (!folder.ok) throw new Error(folder.error)
    const tagged = createMediaTag(folder.value, { id: tagId, name: 'Principal' })
    if (!tagged.ok) throw new Error(tagged.error)
    const added = addMediaAsset(tagged.value, { ...image, folderId, tagIds: [tagId] }, time)
    expect(added).toMatchObject({ ok: true, value: { media: { folders: { [folderId]: { name: 'Marca' } }, tags: { [tagId]: { name: 'Principal' } }, assets: { [assetId]: { folderId, tagIds: [tagId] } } } } })
    expect(addMediaAsset(tagged.value, { ...image, id: parseMediaAssetId('b1000000-0000-4000-8000-000000000003'), tagIds: [parseMediaTagId('b5000000-0000-4000-8000-000000000009')] }, time)).toMatchObject({ ok: false, error: 'Una o más etiquetas no existen.' })
  })

  it('normaliza variantes opcionales sin alterar el recurso original', () => {
    const added = addMediaAsset(STARTER_PROJECT_STRUCTURE, {
      ...image,
      variants: { thumbnail: { byteSize: 128, height: 80, mimeType: 'image/png', width: 160 } },
    }, time)
    expect(added).toMatchObject({ ok: true, value: { media: { assets: { [assetId]: { variants: { thumbnail: { height: 80, width: 160 } } } } } } })
  })
})
