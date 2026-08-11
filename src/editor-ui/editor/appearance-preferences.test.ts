import { describe, expect, it } from 'vitest'
import {
  applyAppearance,
  BrowserAppearancePreferencesStore,
  DEFAULT_APPEARANCE_PREFERENCES,
  EDITOR_APPEARANCE_PREFERENCES_KEY,
  resolveColorMode,
} from './appearance-preferences'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

describe('M04.5 preferencias de apariencia', () => {
  it('conserva Studio + claro como fallback compatible', () => {
    expect(DEFAULT_APPEARANCE_PREFERENCES).toEqual({ version: 1, uiTheme: 'studio', colorMode: 'light' })
  })

  it('persiste y restaura preset y modo de color como estado UI versionado', () => {
    const storage = createStorage()
    const store = new BrowserAppearancePreferencesStore(storage)
    const expected = { version: 1 as const, uiTheme: 'flow' as const, colorMode: 'system' as const }

    store.save(expected)
    expect(store.load()).toEqual(expected)
    expect(JSON.parse(storage.getItem(EDITOR_APPEARANCE_PREFERENCES_KEY) ?? '{}')).toEqual(expected)
  })

  it('ignora JSON corrupto, versiones desconocidas y campos extra', () => {
    const storage = createStorage()
    const store = new BrowserAppearancePreferencesStore(storage)

    storage.setItem(EDITOR_APPEARANCE_PREFERENCES_KEY, '{')
    expect(store.load()).toBeNull()
    storage.setItem(EDITOR_APPEARANCE_PREFERENCES_KEY, JSON.stringify({ version: 2, uiTheme: 'studio', colorMode: 'light' }))
    expect(store.load()).toBeNull()
    storage.setItem(EDITOR_APPEARANCE_PREFERENCES_KEY, JSON.stringify({ version: 1, uiTheme: 'studio', colorMode: 'light', projectData: true }))
    expect(store.load()).toBeNull()
  })

  it('resuelve Automático exclusivamente desde la preferencia de color del sistema', () => {
    expect(resolveColorMode('system', true)).toBe('dark')
    expect(resolveColorMode('system', false)).toBe('light')
    expect(resolveColorMode('dark', false)).toBe('dark')
    expect(resolveColorMode('light', true)).toBe('light')
  })

  it('aplica atributos separados para preset, preferencia y color resuelto', () => {
    const root = document.createElement('html')
    applyAppearance(root, { version: 1, uiTheme: 'bento', colorMode: 'system' }, true)

    expect(root).toHaveAttribute('data-ui-theme', 'bento')
    expect(root).toHaveAttribute('data-color-mode', 'system')
    expect(root).toHaveAttribute('data-theme', 'dark')
    expect(root.style.colorScheme).toBe('dark')
  })
})
