import { describe, expect, it } from 'vitest'
import { STARTER_DOCUMENT_ID, STARTER_PROJECT_STRUCTURE, STARTER_SELECTED_NODE_ID } from './starter-project-structure'
import {
  addSavedWidget,
  BrowserWidgetLibraryPreferencesStore,
  createSavedWidgetPreset,
  DEFAULT_WIDGET_LIBRARY_PREFERENCES,
  MAX_RECENT_WIDGETS,
  recordRecentWidget,
  removeSavedWidget,
  toggleFavoriteWidget,
  WIDGET_LIBRARY_PREFERENCES_KEY,
} from './widget-library-preferences'

describe('M06.5 preferencias de biblioteca', () => {
  it('persiste un schema versionado y recupera defaults ante datos corruptos', () => {
    const store = new BrowserWidgetLibraryPreferencesStore(window.localStorage)
    const favorite = toggleFavoriteWidget(DEFAULT_WIDGET_LIBRARY_PREFERENCES, 'content.heading')
    expect(store.save(favorite)).toBe(true)
    expect(store.load().favoriteWidgetIds).toEqual(['content.heading'])

    window.localStorage.setItem(WIDGET_LIBRARY_PREFERENCES_KEY, '{')
    expect(store.load()).toEqual(DEFAULT_WIDGET_LIBRARY_PREFERENCES)
  })

  it('mantiene favoritos únicos y recientes ordenados con límite', () => {
    const favorite = toggleFavoriteWidget(DEFAULT_WIDGET_LIBRARY_PREFERENCES, 'content.heading')
    expect(toggleFavoriteWidget(favorite, 'content.heading').favoriteWidgetIds).toEqual([])

    let preferences = DEFAULT_WIDGET_LIBRARY_PREFERENCES
    for (let index = 0; index < MAX_RECENT_WIDGETS + 3; index += 1) preferences = recordRecentWidget(preferences, `content.widget-${index}`)
    preferences = recordRecentWidget(preferences, 'content.widget-10')
    expect(preferences.recentWidgetIds).toHaveLength(MAX_RECENT_WIDGETS)
    expect(preferences.recentWidgetIds[0]).toBe('content.widget-10')
    expect(new Set(preferences.recentWidgetIds).size).toBe(MAX_RECENT_WIDGETS)
  })

  it('guarda un preset reutilizable sin copiar hijos ni referencias del árbol', () => {
    const structure = structuredClone(STARTER_PROJECT_STRUCTURE)
    const document = structure.documents[STARTER_DOCUMENT_ID]
    const node = document?.nodes[STARTER_SELECTED_NODE_ID]
    if (!node) throw new Error('Falta el nodo inicial para la prueba.')
    node.bindings = { sample: { kind: 'node-property', nodeId: STARTER_SELECTED_NODE_ID, path: ['text'] } }
    node.slots = { content: [STARTER_SELECTED_NODE_ID] }

    const preset = createSavedWidgetPreset(node, 'Contenedor guardado', () => '11111111-1111-4111-8111-111111111111', () => '2026-08-11T12:00:00.000Z')
    expect(preset).toMatchObject({ label: 'Contenedor guardado', widgetType: 'layout.container' })
    expect(preset).not.toHaveProperty('slots')
    expect(preset).not.toHaveProperty('bindings')
    if (!preset) return
    const saved = addSavedWidget(DEFAULT_WIDGET_LIBRARY_PREFERENCES, preset)
    expect(saved.savedWidgets).toHaveLength(1)
    expect(removeSavedWidget(saved, preset.id).savedWidgets).toEqual([])
  })
})
