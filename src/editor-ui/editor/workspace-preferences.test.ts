import { beforeEach, describe, expect, it } from 'vitest'
import {
  BrowserWorkspacePreferencesStore,
  EDITOR_WORKSPACE_PREFERENCES_KEY,
  EDITOR_WORKSPACE_PREFERENCES_VERSION,
  EditorWorkspacePreferencesSchema,
  type EditorWorkspacePreferences,
} from './workspace-preferences'

const preferences: EditorWorkspacePreferences = {
  canvas: { breakpointId: null, orientation: 'landscape', panX: 48, panY: -24, tool: 'pan', viewport: 'tablet', zoom: 125 },
  schemaVersion: EDITOR_WORKSPACE_PREFERENCES_VERSION,
  railWidth: 144,
  libraryWidth: 232,
  inspectorWidth: 320,
  workspace: {
    library: {
      mode: 'floating',
      restoreMode: 'floating',
      dockSide: 'left',
      pinned: true,
      bounds: { x: 96, y: 72, width: 284, height: 520 },
    },
    inspector: {
      mode: 'minimized',
      restoreMode: 'docked',
      dockSide: 'right',
      pinned: false,
      bounds: { x: 720, y: 64, width: 304, height: 580 },
    },
  },
  panelOrder: ['inspector', 'library'],
}

describe('BrowserWorkspacePreferencesStore', () => {
  beforeEach(() => window.localStorage.clear())

  it('persiste y restaura un workspace v1 válido', () => {
    const store = new BrowserWorkspacePreferencesStore(window.localStorage)
    expect(store.save(preferences)).toBe(true)
    expect(store.load()).toEqual(preferences)
    expect(EditorWorkspacePreferencesSchema.safeParse(store.load()).success).toBe(true)
  })

  it('migra preferencias v1 anteriores al canvas usando defaults seguros', () => {
    const store = new BrowserWorkspacePreferencesStore(window.localStorage)
    const legacy = Object.fromEntries(Object.entries(preferences).filter(([key]) => key !== 'canvas'))
    window.localStorage.setItem(EDITOR_WORKSPACE_PREFERENCES_KEY, JSON.stringify(legacy))
    expect(store.load()?.canvas).toEqual({ breakpointId: null, orientation: 'portrait', panX: 0, panY: 0, tool: 'select', viewport: 'mobile', zoom: 90 })
  })

  it('ignora JSON corrupto, versiones desconocidas y orden inválido', () => {
    const store = new BrowserWorkspacePreferencesStore(window.localStorage)
    window.localStorage.setItem(EDITOR_WORKSPACE_PREFERENCES_KEY, '{')
    expect(store.load()).toBeNull()

    window.localStorage.setItem(EDITOR_WORKSPACE_PREFERENCES_KEY, JSON.stringify({ ...preferences, schemaVersion: 2 }))
    expect(store.load()).toBeNull()

    window.localStorage.setItem(EDITOR_WORKSPACE_PREFERENCES_KEY, JSON.stringify({ ...preferences, panelOrder: ['library', 'library'] }))
    expect(store.load()).toBeNull()
  })

  it('limpia preferencias sin afectar el funcionamiento del store', () => {
    const store = new BrowserWorkspacePreferencesStore(window.localStorage)
    store.save(preferences)
    store.clear()
    expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).toBeNull()
    expect(store.load()).toBeNull()
  })
})
