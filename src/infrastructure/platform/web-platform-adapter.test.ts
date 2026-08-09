import { describe, expect, it } from 'vitest'
import { WebPlatformAdapter } from './web-platform-adapter'

describe('WebPlatformAdapter', () => {
  it('declara únicamente las capacidades detectadas por el límite web', () => {
    const adapter = new WebPlatformAdapter({
      serviceWorker: true,
      installPrompt: false,
    })

    expect(adapter.descriptor).toEqual({
      contractVersion: 1,
      id: 'electrocms.web',
      family: 'web',
      capabilities: ['offline-shell'],
    })
    expect(adapter.isAvailable()).toBe(true)
  })
})
