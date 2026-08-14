import { useEffect, useMemo, useState } from 'react'
import { MediaAssetIdSchema, mediaAssetUrl, type MediaAssetId, type ProjectStructure } from '../../domain'
import type { EditorProjectSession } from './editor-project-context'

const ASSET_REFERENCE = /asset:\/\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/gi

/** Recoge referencias locales válidas sin interpretar el resto de datos del proyecto. */
export function referencedMediaAssetUrls(structure: ProjectStructure): readonly string[] {
  const values = new Set<string>()
  const serialized = JSON.stringify({ documents: structure.documents, globalComponents: structure.globalComponents })
  for (const match of serialized.matchAll(ASSET_REFERENCE)) {
    const assetId = MediaAssetIdSchema.safeParse(match[1])
    if (assetId.success) values.add(mediaAssetUrl(assetId.data))
  }
  return [...values].sort()
}

/** Carga sólo los binarios a los que apunta el proyecto para el preview local. */
export function useMediaPreviewSources(session: EditorProjectSession, structure: ProjectStructure): Readonly<Record<string, string>> {
  const references = useMemo(() => referencedMediaAssetUrls(structure), [structure])
  const referenceKey = references.join('|')
  const [sourceCache, setSourceCache] = useState<Readonly<Record<string, string>>>({})
  const sources = useMemo(
    () => Object.fromEntries(Object.entries(sourceCache).filter(([reference]) => references.includes(reference))),
    [references, sourceCache],
  )

  useEffect(() => {
    let active = true
    if (typeof session.readMediaAssetData !== 'function' || references.length === 0) {
      return () => { active = false }
    }
    const readMediaAssetData = (assetId: MediaAssetId) => session.readMediaAssetData?.(assetId)
    void Promise.all(references.map(async (reference) => {
      const assetId = MediaAssetIdSchema.parse(reference.slice('asset://'.length))
      const result = await readMediaAssetData(assetId)
      if (!result || !result.ok || !result.value) return null
      return [reference, result.value] as const
    })).then((entries) => {
      if (!active) return
      setSourceCache(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)))
    })
    return () => { active = false }
  }, [referenceKey, references, session])

  return sources
}
