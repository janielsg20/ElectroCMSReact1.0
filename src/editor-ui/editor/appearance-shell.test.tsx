import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'
import { EDITOR_APPEARANCE_PREFERENCES_KEY } from './appearance-preferences'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

const originalMatchMedia = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined

function installColorScheme(initialDark: boolean) {
  let dark = initialDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQuery = {
    get matches() { return dark },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { listeners.add(listener) },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { listeners.delete(listener) },
    addListener: (listener: (event: MediaQueryListEvent) => void) => { listeners.add(listener) },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => { listeners.delete(listener) },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList

  window.matchMedia = vi.fn(() => mediaQuery)

  return async (nextDark: boolean): Promise<void> => {
    await act(async () => {
      dark = nextDark
      const event = { matches: dark, media: mediaQuery.media } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
      await Promise.resolve()
    })
  }
}

function openAppearance() {
  fireEvent.click(screen.getByRole('button', { name: /ajustes de apariencia/i }))
  return screen.getByRole('dialog', { name: /apariencia de la interfaz/i })
}

function resetDocumentAppearance(): void {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.colorMode
  delete document.documentElement.dataset.uiTheme
  document.documentElement.style.removeProperty('color-scheme')
}

describe('M04.5 temas del editor', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', window.location.pathname)
    resetDocumentAppearance()
    installColorScheme(false)
  })

  afterEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', window.location.pathname)
    resetDocumentAppearance()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else Reflect.deleteProperty(window, 'matchMedia')
  })

  it('separa preset visual y modo de color en dos radiogroups accesibles', () => {
    render(<App />)
    const appearance = openAppearance()

    expect(within(appearance).getByRole('radiogroup', { name: 'Preset visual' })).toBeInTheDocument()
    const colors = within(appearance).getByRole('radiogroup', { name: 'Modo de color' })
    expect(within(colors).getByRole('radio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'true')
    expect(within(colors).getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'false')
    expect(within(colors).getByRole('radio', { name: 'Automático' })).toHaveAttribute('aria-checked', 'false')
  })

  it('cambia color por teclado, preserva el preset y persiste appearance.v1', async () => {
    render(<App />)
    let appearance = openAppearance()
    const colors = within(appearance).getByRole('radiogroup', { name: 'Modo de color' })
    const light = within(colors).getByRole('radio', { name: 'Claro' })

    fireEvent.keyDown(light, { key: 'ArrowRight' })
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'))
    expect(document.documentElement).toHaveAttribute('data-color-mode', 'dark')
    expect(within(colors).getByRole('radio', { name: 'Oscuro' })).toHaveFocus()

    fireEvent.click(within(appearance).getByRole('radio', { name: /flow builder/i }))
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-ui-theme', 'flow'))

    const saved = JSON.parse(window.localStorage.getItem(EDITOR_APPEARANCE_PREFERENCES_KEY) ?? '{}') as Record<string, unknown>
    expect(saved).toEqual({ version: 1, uiTheme: 'flow', colorMode: 'dark' })

    appearance = openAppearance()
    expect(within(appearance).getByRole('radio', { name: /flow builder/i })).toHaveAttribute('aria-checked', 'true')
    expect(within(appearance).getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
  })

  it('Automático sigue cambios de prefers-color-scheme sin recargar', async () => {
    const changeSystemScheme = installColorScheme(false)
    render(<App />)
    const appearance = openAppearance()

    fireEvent.click(within(appearance).getByRole('radio', { name: 'Automático' }))
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-color-mode', 'system'))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    await changeSystemScheme(true)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'))
    expect(document.documentElement).toHaveAttribute('data-ui-theme', 'studio')

    await changeSystemScheme(false)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'))
  })

  it('restaura preset y modo persistidos al remontar el shell', async () => {
    window.localStorage.setItem(EDITOR_APPEARANCE_PREFERENCES_KEY, JSON.stringify({ version: 1, uiTheme: 'bento', colorMode: 'system' }))
    installColorScheme(true)

    render(<App />)

    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-ui-theme', 'bento'))
    expect(document.documentElement).toHaveAttribute('data-color-mode', 'system')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: /preset: bento motion · color: automático/i })).toBeInTheDocument()
  })

  it('recupera defaults seguros cuando appearance.v1 está corrupto', async () => {
    window.localStorage.setItem(EDITOR_APPEARANCE_PREFERENCES_KEY, '{')
    render(<App />)

    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-ui-theme', 'studio'))
    expect(document.documentElement).toHaveAttribute('data-color-mode', 'light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})
