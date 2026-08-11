import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_NAVIGATION_SECTION, navigationHash, sectionFromHash, sectionFromLocation, writeNavigationHistory } from './navigation-routing'

afterEach(() => {
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
})

describe('M04.4 navigation routing contract', () => {
  it('genera hashes profundos estables para las secciones del producto', () => {
    expect(navigationHash('editor')).toBe('#/editor')
    expect(navigationHash('collections')).toBe('#/collections')
  })

  it('acepta únicamente secciones registradas y cae en Editor ante rutas desconocidas', () => {
    expect(sectionFromHash('#/pages')).toBe('pages')
    expect(sectionFromHash('#pages')).toBe('pages')
    expect(sectionFromHash('#/no-existe')).toBeNull()
    expect(sectionFromLocation({ hash: '#/no-existe' })).toBe(DEFAULT_NAVIGATION_SECTION)
  })

  it('escribe push/replace sin alterar pathname ni query actuales', () => {
    window.history.replaceState({}, '', `${window.location.pathname}?source=test#/editor`)
    writeNavigationHistory('content', 'push')
    expect(window.location.search).toBe('?source=test')
    expect(window.location.hash).toBe('#/content')
    expect(window.history.state).toEqual({ schemaVersion: 1, electrocmsSection: 'content' })

    writeNavigationHistory('dashboard', 'replace')
    expect(window.location.hash).toBe('#/dashboard')
    expect(window.history.state).toEqual({ schemaVersion: 1, electrocmsSection: 'dashboard' })
  })
})
