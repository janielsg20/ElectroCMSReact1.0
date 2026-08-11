import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import {
  EDITOR_APPEARANCE_PREFERENCES_KEY,
  resetAppearancePreferenceSnapshot,
} from './appearance-preferences'

function openAppearance() {
  fireEvent.click(screen.getByRole('button', { name: 'Apariencia' }))
  return screen.getByRole('dialog', { name: 'Apariencia del editor' })
}

beforeEach(() => {
  window.localStorage.clear()
  resetAppearancePreferenceSnapshot()
  document.documentElement.removeAttribute('data-color-mode')
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-ui-preset')
})

describe('M04.5 temas del editor', () => {
  it('expone presets visuales y color como decisiones separadas', () => {
    render(<App />)
    const appearance = openAppearance()

    const presets = within(appearance).getByRole('radiogroup', { name: 'Preset visual' })
    expect(within(presets).getByRole('radio', { name: /high density/i })).toHaveAttribute('aria-checked', 'true')
    expect(within(presets).getByRole('radio', { name: /google bento grid/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /minimal clean/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /elegant editorial/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /sophisticated dark/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /saas glassmorphism/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /material neutral/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /neobrutalist modern/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(presets).getByRole('radio', { name: /corporate pro/i })).toHaveAttribute('aria-checked', 'false')

    const colors = within(appearance).getByRole('radiogroup', { name: 'Modo de color' })
    expect(within(colors).getByRole('radio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'true')
    expect(within(colors).getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'false')
    expect(within(colors).getByRole('radio', { name: 'Automático' })).toHaveAttribute('aria-checked', 'false')
  })

  it('mantiene la apariencia local del editor fuera de los temas exportables del proyecto', () => {
    render(<App />)
    const appearance = openAppearance()

    expect(within(appearance).getByRole('heading', { name: 'Apariencia del editor' })).toBeInTheDocument()
    expect(within(appearance).queryByRole('group', { name: 'Ámbito de tema' })).not.toBeInTheDocument()
    expect(within(appearance).getByRole('radiogroup', { name: 'Preset visual' })).toBeInTheDocument()
    expect(window.localStorage.getItem(EDITOR_APPEARANCE_PREFERENCES_KEY)).toBeNull()
  })

  it('ubica temas y paquetes exportables en Diseño, separados de la apariencia local', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: 'Diseño' }))

    expect(screen.getByRole('heading', { name: 'Diseño del proyecto' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tema' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Paquetes' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Frontend' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'Tema del frontend generado' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Paquetes' }))
    expect(screen.getByRole('heading', { name: 'Paquetes reutilizables' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tema del frontend generado' })).not.toBeInTheDocument()
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

    fireEvent.click(within(appearance).getByRole('radio', { name: /minimal clean/i }))
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-ui-preset', 'minimal-clean'))

    const saved = JSON.parse(window.localStorage.getItem(EDITOR_APPEARANCE_PREFERENCES_KEY) ?? '{}') as Record<string, unknown>
    expect(saved).toMatchObject({ colorMode: 'dark', presetId: 'minimal-clean', version: 1 })

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar apariencia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apariencia' }))
    appearance = screen.getByRole('dialog', { name: 'Apariencia del editor' })
    expect(within(appearance).getByRole('radio', { name: /minimal clean/i })).toHaveAttribute('aria-checked', 'true')
    expect(within(appearance).getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
  })
})
