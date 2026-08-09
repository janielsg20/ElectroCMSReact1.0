import { describe, expect, it } from 'vitest'
import { createServiceWorkerSource } from './pwa-service-worker'

describe('generador del Service Worker', () => {
  it('incluye el shell generado y excluye artefactos ajenos', () => {
    const source = createServiceWorkerSource([
      'index.html',
      'assets/index-abc.js',
      'assets/index-def.css',
      'assets/source.map',
    ])

    expect(source).toContain('/assets/index-abc.js')
    expect(source).toContain('/assets/index-def.css')
    expect(source).toContain('/manifest.webmanifest')
    expect(source).not.toContain('/assets/source.map')
    expect(source).toContain("request.mode === 'navigate'")
    expect(source).toContain('{ ignoreVary: true }')
  })

  it('cambia la versión del caché cuando cambia el bundle', () => {
    const first = createServiceWorkerSource(['assets/index-first.js'])
    const second = createServiceWorkerSource(['assets/index-second.js'])

    expect(first.match(/electrocms-shell-[a-f0-9]+/)?.[0]).not.toBe(
      second.match(/electrocms-shell-[a-f0-9]+/)?.[0],
    )
  })
})
