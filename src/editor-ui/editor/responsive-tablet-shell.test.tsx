import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../../App'
import { EDITOR_WORKSPACE_PREFERENCES_KEY } from './workspace-preferences'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  fireEvent(window, new Event('resize'))
}

function restoreDesktopWidth(): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 })
}

describe('M04.2 shell tablet', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setViewportWidth(768)
  })

  afterEach(() => {
    restoreDesktopWidth()
    window.localStorage.clear()
  })

  it('mantiene rail compacto, canvas prioritario y un único panel persistente en portrait', async () => {
    render(<App />)

    const persistent = await screen.findByRole('complementary', { name: /panel contextual persistente de tablet/i })
    expect(persistent).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Capas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Props' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
    expect(document.querySelector('[data-tablet-shell="active"]')).toBeInTheDocument()
  })

  it('abre el panel secundario como dialog lateral, atrapa Escape y restaura foco', async () => {
    render(<App />)

    const trigger = await screen.findByRole('button', { name: /abrir inspector como panel secundario/i })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: /inspector · panel secundario/i })
    await waitFor(() => expect(dialog).toHaveFocus())

    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /inspector · panel secundario/i })).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('permite fijar el secundario como único panel persistente', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /abrir inspector como panel secundario/i }))
    fireEvent.click(await screen.findByRole('button', { name: /fijar inspector como panel persistente/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Props' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Capas' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /abrir páginas y capas como panel secundario/i })).toBeInTheDocument()
  })

  it('redimensiona el overlay sin escribir geometría tablet en workspace.v1', async () => {
    render(<App />)

    await waitFor(() => expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).not.toBeNull())
    const before = window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)

    fireEvent.click(await screen.findByRole('button', { name: /abrir inspector como panel secundario/i }))
    const separator = await screen.findByRole('separator', { name: /redimensionar inspector secundario/i })
    expect(separator).toHaveAttribute('aria-valuenow', '320')
    fireEvent.keyDown(separator, { key: 'ArrowLeft' })
    expect(separator).toHaveAttribute('aria-valuenow', '336')

    expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).toBe(before)
  })

  it('mantiene el shell tablet en landscape y lo desmonta al entrar en desktop', async () => {
    setViewportWidth(1023)
    render(<App />)

    const frame = document.querySelector<HTMLElement>('[data-tablet-shell="active"]')
    expect(frame).toBeInTheDocument()
    expect(frame?.style.getPropertyValue('--tablet-context-width')).toBe('248px')

    fireEvent.click(await screen.findByRole('button', { name: /abrir inspector como panel secundario/i }))
    expect(await screen.findByRole('dialog', { name: /inspector · panel secundario/i })).toBeInTheDocument()

    setViewportWidth(1024)
    await waitFor(() => expect(screen.queryByRole('complementary', { name: /panel contextual persistente de tablet/i })).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog', { name: /panel secundario/i })).not.toBeInTheDocument()
  })
})
