import * as z from 'zod'
import { MediaAssetIdSchema, MediaFolderIdSchema, MediaTagIdSchema, TimestampSchema, type MediaAssetId, type Timestamp } from './identity'

const LabelSchema = z.string().trim().min(1).max(160)
const FileNameSchema = z.string().trim().min(1).max(300)
const HashSchema = z.string().trim().min(8).max(160)

export const MediaKindSchema = z.enum(['audio', 'document', 'font', 'icon', 'image', 'video'])
export const MediaAssetVariantNameSchema = z.enum(['thumbnail'])
export const MediaAssetVariantSchema = z.strictObject({ byteSize: z.number().int().nonnegative(), height: z.number().int().positive(), mimeType: z.string().trim().min(1).max(180), width: z.number().int().positive() })
export const MediaFolderSchema = z.strictObject({ id: MediaFolderIdSchema, name: LabelSchema, parentId: MediaFolderIdSchema.nullable() })
export const MediaTagSchema = z.strictObject({ id: MediaTagIdSchema, name: LabelSchema })
export const MediaAssetSchema = z.strictObject({
  altText: z.string().max(500), byteSize: z.number().int().nonnegative(), contentHash: HashSchema, createdAt: TimestampSchema,
  description: z.string().max(2_000), fileName: FileNameSchema, folderId: MediaFolderIdSchema.nullable(), height: z.number().int().positive().nullable(),
  id: MediaAssetIdSchema, kind: MediaKindSchema, mimeType: z.string().trim().min(1).max(180), name: LabelSchema, starred: z.boolean(), tagIds: z.array(MediaTagIdSchema), updatedAt: TimestampSchema, variants: z.partialRecord(MediaAssetVariantNameSchema, MediaAssetVariantSchema).default({}), width: z.number().int().positive().nullable(),
})
export const MediaLibrarySchema = z.strictObject({ assets: z.record(MediaAssetIdSchema, MediaAssetSchema), folders: z.record(MediaFolderIdSchema, MediaFolderSchema), recentAssetIds: z.array(MediaAssetIdSchema), tags: z.record(MediaTagIdSchema, MediaTagSchema) })
export const MediaBlobRecordSchema = z.strictObject({ assetId: MediaAssetIdSchema, dataUrl: z.string().min(1).max(16_000_000), schemaVersion: z.literal(1), variantData: z.partialRecord(MediaAssetVariantNameSchema, z.string().min(1).max(4_000_000)).default({}) })

export type MediaKind = z.infer<typeof MediaKindSchema>
export type MediaAssetVariantName = z.infer<typeof MediaAssetVariantNameSchema>
export type MediaAssetVariant = z.infer<typeof MediaAssetVariantSchema>
export type MediaAsset = z.infer<typeof MediaAssetSchema>
export type MediaFolder = z.infer<typeof MediaFolderSchema>
export type MediaTag = z.infer<typeof MediaTagSchema>
export type MediaLibrary = z.infer<typeof MediaLibrarySchema>
export type MediaBlobRecord = z.infer<typeof MediaBlobRecordSchema>

export const EMPTY_MEDIA_LIBRARY: MediaLibrary = { assets: {}, folders: {}, recentAssetIds: [], tags: {} }
export function projectMediaLibrary(library: MediaLibrary | undefined): MediaLibrary { return library ? structuredClone(library) : structuredClone(EMPTY_MEDIA_LIBRARY) }
export function mediaAssetUrl(assetId: MediaAssetId): string { return `asset://${assetId}` }

export type MediaAssetInput = Omit<MediaAsset, 'createdAt' | 'updatedAt' | 'variants'> & { readonly variants?: MediaAsset['variants'] }
export type MediaLibraryError = 'El recurso ya existe en la biblioteca.' | 'El recurso no existe.' | 'La carpeta no existe.' | 'Una o más etiquetas no existen.' | 'La carpeta no puede contenerse a sí misma.' | 'El recurso sigue usándose en el proyecto.'

type MediaProjectStructure = { readonly documents: unknown; readonly globalComponents: unknown; readonly media?: MediaLibrary }

function withLibrary<T extends MediaProjectStructure>(structure: T, library: MediaLibrary): T { return { ...structuredClone(structure), media: library } }
function containsAssetReference(value: unknown, assetId: MediaAssetId): boolean { return JSON.stringify(value).includes(mediaAssetUrl(assetId)) }

export function addMediaAsset<T extends MediaProjectStructure>(structure: T, input: MediaAssetInput, timestamp: Timestamp): { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: MediaLibraryError } {
  const library = projectMediaLibrary(structure.media)
  if (Object.values(library.assets).some((asset) => asset.contentHash === input.contentHash)) return { ok: false, error: 'El recurso ya existe en la biblioteca.' }
  if (input.folderId && !library.folders[input.folderId]) return { ok: false, error: 'La carpeta no existe.' }
  if (input.tagIds.some((tagId) => !library.tags[tagId])) return { ok: false, error: 'Una o más etiquetas no existen.' }
  const asset = MediaAssetSchema.parse({ ...input, createdAt: timestamp, updatedAt: timestamp })
  return { ok: true, value: withLibrary(structure, { ...library, assets: { ...library.assets, [asset.id]: asset }, recentAssetIds: [asset.id, ...library.recentAssetIds.filter((id) => id !== asset.id)].slice(0, 24) }) }
}

export function updateMediaAsset<T extends MediaProjectStructure>(structure: T, assetId: MediaAssetId, patch: Partial<Pick<MediaAsset, 'altText' | 'description' | 'folderId' | 'name' | 'starred' | 'tagIds'>>, timestamp: Timestamp): { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: MediaLibraryError } {
  const library = projectMediaLibrary(structure.media); const asset = library.assets[assetId]
  if (!asset) return { ok: false, error: 'El recurso no existe.' }
  if (patch.folderId && !library.folders[patch.folderId]) return { ok: false, error: 'La carpeta no existe.' }
  if (patch.tagIds?.some((tagId) => !library.tags[tagId])) return { ok: false, error: 'Una o más etiquetas no existen.' }
  return { ok: true, value: withLibrary(structure, { ...library, assets: { ...library.assets, [assetId]: MediaAssetSchema.parse({ ...asset, ...patch, updatedAt: timestamp }) } }) }
}

export function deleteMediaAsset<T extends MediaProjectStructure>(structure: T, assetId: MediaAssetId): { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: MediaLibraryError } {
  const library = projectMediaLibrary(structure.media)
  if (!library.assets[assetId]) return { ok: false, error: 'El recurso no existe.' }
  if (containsAssetReference({ documents: structure.documents, globalComponents: structure.globalComponents }, assetId)) return { ok: false, error: 'El recurso sigue usándose en el proyecto.' }
  const assets = { ...library.assets }; delete assets[assetId]
  return { ok: true, value: withLibrary(structure, { ...library, assets, recentAssetIds: library.recentAssetIds.filter((id) => id !== assetId) }) }
}

export function createMediaFolder<T extends MediaProjectStructure>(structure: T, folder: MediaFolder): { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: MediaLibraryError } {
  const library = projectMediaLibrary(structure.media)
  if (folder.parentId && !library.folders[folder.parentId]) return { ok: false, error: 'La carpeta no existe.' }
  if (folder.parentId === folder.id) return { ok: false, error: 'La carpeta no puede contenerse a sí misma.' }
  return { ok: true, value: withLibrary(structure, { ...library, folders: { ...library.folders, [folder.id]: MediaFolderSchema.parse(folder) } }) }
}

export function createMediaTag<T extends MediaProjectStructure>(structure: T, tag: MediaTag): { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: MediaLibraryError } {
  const library = projectMediaLibrary(structure.media)
  return { ok: true, value: withLibrary(structure, { ...library, tags: { ...library.tags, [tag.id]: MediaTagSchema.parse(tag) } }) }
}
