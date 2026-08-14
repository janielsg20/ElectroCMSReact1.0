import { describe, expect, it } from 'vitest'
import { MAX_MEDIA_FILE_BYTES, MAX_MEDIA_LIBRARY_BYTES, detectMediaMimeType, inspectMediaImport } from './media-import-policy'

function bytes(...values: number[]): Uint8Array { return new Uint8Array(values) }
function text(value: string): Uint8Array { return new TextEncoder().encode(value) }

describe('M13.2 política de importación multimedia', () => {
  it('detecta formatos admitidos por contenido, incluido WebP y AVIF', () => {
    expect(detectMediaMimeType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(detectMediaMimeType(text('RIFFxxxxWEBP'))).toBe('image/webp')
    expect(detectMediaMimeType(bytes(0, 0, 0, 0, ...text('ftypavif')))).toBe('image/avif')
  })

  it('rechaza MIME declarado inconsistente, binarios desconocidos y excedentes', () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    const mismatch = inspectMediaImport({ bytes: png, declaredMimeType: 'image/jpeg', fileName: 'logo.jpg', libraryBytes: 0 })
    const unsupported = inspectMediaImport({ bytes: bytes(0, 255, 1), declaredMimeType: 'application/octet-stream', fileName: 'archivo.bin', libraryBytes: 0 })
    const tooLarge = inspectMediaImport({ bytes: new Uint8Array(MAX_MEDIA_FILE_BYTES + 1), declaredMimeType: 'image/png', fileName: 'grande.png', libraryBytes: 0 })
    const fullLibrary = inspectMediaImport({ bytes: png, declaredMimeType: 'image/png', fileName: 'logo.png', libraryBytes: MAX_MEDIA_LIBRARY_BYTES })
    expect(mismatch.ok).toBe(false); if (!mismatch.ok) expect(mismatch.error).toContain('no coincide')
    expect(unsupported.ok).toBe(false); if (!unsupported.ok) expect(unsupported.error).toContain('no está admitido')
    expect(tooLarge.ok).toBe(false); if (!tooLarge.ok) expect(tooLarge.error).toContain('supera')
    expect(fullLibrary.ok).toBe(false); if (!fullLibrary.ok) expect(fullLibrary.error).toContain('espacio')
  })

  it('acepta contenido real aunque el navegador no haya informado un MIME', () => {
    expect(inspectMediaImport({ bytes: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), declaredMimeType: '', fileName: 'logo', libraryBytes: 0 })).toEqual({ ok: true, value: { kind: 'image', mimeType: 'image/png' } })
  })
})
