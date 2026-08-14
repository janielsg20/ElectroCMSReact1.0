import type { MediaKind } from './media-library'

export const MAX_MEDIA_FILE_BYTES = 8 * 1024 * 1024
export const MAX_MEDIA_LIBRARY_BYTES = 40 * 1024 * 1024

export interface MediaImportInspection {
  readonly declaredMimeType: string
  readonly fileName: string
  readonly bytes: Uint8Array
  readonly libraryBytes: number
}

export interface AcceptedMediaImport {
  readonly kind: MediaKind
  readonly mimeType: string
}

export type MediaImportInspectionResult =
  | { readonly ok: true; readonly value: AcceptedMediaImport }
  | { readonly ok: false; readonly error: string }

const MIME_KIND: Readonly<Record<string, MediaKind>> = {
  'application/pdf': 'document',
  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'font/otf': 'font',
  'font/ttf': 'font',
  'font/woff': 'font',
  'font/woff2': 'font',
  'image/avif': 'image',
  'image/gif': 'image',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/svg+xml': 'icon',
  'image/webp': 'image',
  'text/plain': 'document',
  'video/mp4': 'video',
  'video/ogg': 'video',
  'video/webm': 'video',
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value)
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length))
}

/** Detecta formatos admitidos por su encabezado; no confía en `File.type`. */
export function detectMediaMimeType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') return 'image/gif'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'image/webp'
  if (ascii(bytes, 4, 4) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 4))) return 'image/avif'
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'
  if (ascii(bytes, 0, 4) === 'wOFF') return 'font/woff'
  if (ascii(bytes, 0, 4) === 'wOF2') return 'font/woff2'
  if (ascii(bytes, 0, 4) === 'OTTO') return 'font/otf'
  if (startsWith(bytes, [0x00, 0x01, 0x00, 0x00])) return 'font/ttf'
  if (ascii(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0)) return 'audio/mpeg'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE') return 'audio/wav'
  if (ascii(bytes, 0, 4) === 'OggS') return 'audio/ogg'
  if (ascii(bytes, 0, 4) === 'fLaC') return null
  if (ascii(bytes, 4, 4) === 'ftyp') return 'video/mp4'
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm'
  const head = new TextDecoder().decode(bytes.slice(0, 2_048)).trimStart().toLowerCase()
  if (head.startsWith('<svg') || head.startsWith('<?xml') && head.includes('<svg')) return 'image/svg+xml'
  if (!bytes.includes(0) && /^[\t\n\r\x20-\x7e]*$/.test(new TextDecoder().decode(bytes.slice(0, 8_192)))) return 'text/plain'
  return null
}

export function inspectMediaImport({ bytes, declaredMimeType, fileName, libraryBytes }: MediaImportInspection): MediaImportInspectionResult {
  if (bytes.byteLength === 0) return { ok: false, error: 'El archivo está vacío.' }
  if (bytes.byteLength > MAX_MEDIA_FILE_BYTES) return { ok: false, error: `El archivo supera el límite de ${MAX_MEDIA_FILE_BYTES / 1024 / 1024} MB.` }
  if (libraryBytes + bytes.byteLength > MAX_MEDIA_LIBRARY_BYTES) return { ok: false, error: 'La biblioteca local no tiene espacio suficiente para este archivo.' }
  const detectedMimeType = detectMediaMimeType(bytes)
  if (!detectedMimeType || !MIME_KIND[detectedMimeType]) return { ok: false, error: 'El tipo real del archivo no está admitido.' }
  const declared = declaredMimeType.trim().toLowerCase()
  if (declared && declared !== 'application/octet-stream' && declared !== detectedMimeType) return { ok: false, error: `El tipo declarado no coincide con el contenido de ${fileName}.` }
  return { ok: true, value: { kind: MIME_KIND[detectedMimeType], mimeType: detectedMimeType } }
}
