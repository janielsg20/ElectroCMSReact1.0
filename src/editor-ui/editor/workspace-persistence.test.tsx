import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from '../../App'
import {
  EDITOR_WORKSPACE_PREFERENCES_KEY,
  EditorWorkspacePreferencesSchema,
} from './workspace-preferences'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

describe('persistencia del workspace desktop', () => {
  it('restaura anchuras, posición, visibilidad y orden de paneles después de remontar', async () => {
    const firstRender = render(<App />)
    await waitFor(() => expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).not.toBeNull())

    const railSeparator = screen.getByRole('separator', { name: /redimensionar menú lateral/i })
    fireEvent.keyDown(railSeparator, { key: 'End' })

    const librarySeparator = screen.getByRole('separator', { name: /páginas y capas/i })
    fireEvent.keyDown(librarySeparator, { key: 'ArrowRight' })

    fireEvent.click(screen.getByRole('button', { name: /desacoplar páginas y capas/i }))
    fireEvent.keyDown(screen.getByRole('button', { name: /mover páginas y capas/i }), { key: 'ArrowRight' })
    fireEvent.click(screen.getByRole('button', { name: /minimizar inspector/i }))

    await waitFor(() => {
      const source = window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)
      expect(source).not.toBeNull()
      if (!source) return
      const stored = EditorWorkspacePreferencesSchema.parse(JSON.parse(source) as unknown)
      expect(stored.railWidth).toBe(168)
      expect(stored.libraryWidth).toBe(376)
      expect(stored.workspace.library).toMatchObject({ mode: 'floating', bounds: { x: 192 } })
      expect(stored.workspace.inspector.mode).toBe('minimized')
      expect(stored.panelOrder).toEqual(['inspector', 'library'])
    })

    firstRender.unmount()
    render(<App />)

    await waitFor(() => expect(screen.getByRole('separator', { name: /redimensionar menú lateral/i })).toHaveAttribute('aria-valuenow', '168'))
    const floatingLibrary = await screen.findByRole('region', { name: /páginas y capas · flotante/i })
    expect(floatingLibrary).toHaveStyle({ left: '192px' })
    expect(screen.getByRole('button', { name: /restaurar inspector/i })).toBeInTheDocument()
  })

  it('descarta preferencias corruptas y conserva el workspace desktop seguro por defecto', async () => {
    window.localStorage.setItem(EDITOR_WORKSPACE_PREFERENCES_KEY, JSON.stringify({ schemaVersion: 1, railWidth: 'roto' }))
    render(<App />)

    await waitFor(() => expect(screen.getByRole('separator', { name: /redimensionar menú lateral/i })).toHaveAttribute('aria-valuenow', '44'))
    expect(screen.getByRole('separator', { name: /páginas y capas/i })).toHaveAttribute('aria-valuenow', '360')
    expect(screen.getByRole('complementary', { name: /inspector de propiedades/i })).toBeInTheDocument()
  })

  it('migra únicamente el ancho predeterminado antiguo de la biblioteca', async () => {
    const firstRender = render(<App />)
    await waitFor(() => expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).not.toBeNull())
    const source = window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)
    expect(source).not.toBeNull()
    if (!source) return
    window.localStorage.setItem(EDITOR_WORKSPACE_PREFERENCES_KEY, JSON.stringify({ ...JSON.parse(source), libraryWidth: 216 }))

    firstRender.unmount()
    render(<App />)

    await waitFor(() => expect(screen.getByRole('separator', { name: /páginas y capas/i })).toHaveAttribute('aria-valuenow', '360'))
  })
  it('restaura la geometría inicial de una ventana flotante cuando el puntero se cancela', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /desacoplar páginas y capas/i }))
    const floatingLibrary = await screen.findByRole('region', { name: /páginas y capas · flotante/i })
    expect(floatingLibrary).toHaveStyle({ left: '60px', top: '64px', width: '360px' })

    fireEvent.pointerDown(screen.getByRole('button', { name: /mover páginas y capas/i }), { clientX: 80, clientY: 80 })
    fireEvent.pointerMove(window, { clientX: 220, clientY: 170 })
    fireEvent.pointerCancel(window)

    await waitFor(() => expect(floatingLibrary).toHaveStyle({ left: '60px', top: '64px' }))
  })
})
