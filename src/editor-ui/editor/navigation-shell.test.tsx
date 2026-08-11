import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

function setDesktopViewport(): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 800 })
}

function navButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label} ·`, 'i') })
}

function replaceHash(hash = ''): void {
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}${hash}`)
}

describe('M04.4 navegación, rutas y shortcuts', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setDesktopViewport()
    replaceHash()
  })

  afterEach(() => {
    replaceHash()
    window.localStorage.clear()
  })

  it('restaura una URL profunda y conserva el contexto visible de navegación', async () => {
    replaceHash('#/pages')
    render(<App />)

    await waitFor(() => expect(navButton('Páginas')).toHaveAttribute('aria-current', 'page'))
    expect(window.location.hash).toBe('#/pages')
    const breadcrumb = screen.getByLabelText('Sección actual')
    expect(breadcrumb).toHaveTextContent('Producto')
    expect(breadcrumb).toHaveTextContent('Páginas')
  })

  it('sincroniza navegación del shell con hash canónico sin crear entradas duplicadas', async () => {
    render(<App />)
    await waitFor(() => expect(window.location.hash).toBe('#/editor'))

    fireEvent.click(navButton('Inicio'))
    await waitFor(() => expect(window.location.hash).toBe('#/dashboard'))
    expect(navButton('Inicio')).toHaveAttribute('aria-current', 'page')

    fireEvent.click(navButton('Inicio'))
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    expect(window.location.hash).toBe('#/dashboard')
  })

  it('restaura back/popstate y mantiene el workspace en la misma instancia', async () => {
    render(<App />)
    await waitFor(() => expect(window.location.hash).toBe('#/editor'))

    const railSeparator = screen.getByRole('separator', { name: /redimensionar menú lateral/i })
    fireEvent.keyDown(railSeparator, { key: 'End' })
    expect(railSeparator).toHaveAttribute('aria-valuenow', '168')

    fireEvent.click(navButton('Inicio'))
    await waitFor(() => expect(navButton('Inicio')).toHaveAttribute('aria-current', 'page'))

    replaceHash('#/editor')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => expect(navButton('Editor')).toHaveAttribute('aria-current', 'page'))
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
    expect(screen.getByRole('separator', { name: /redimensionar menú lateral/i })).toHaveAttribute('aria-valuenow', '168')
  })

  it('abre la paleta desde control visible y Ctrl+K, navega con teclado y restaura foco con Escape', async () => {
    render(<App />)
    const trigger = screen.getByRole('button', { name: /abrir paleta de comandos/i })

    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: /paleta de comandos/i })
    const search = within(dialog).getByRole('combobox', { name: /buscar comando/i })
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.change(search, { target: { value: 'Entradas' } })
    fireEvent.keyDown(search, { key: 'Enter' })

    await waitFor(() => expect(window.location.hash).toBe('#/content'))
    expect(navButton('Contenido')).toHaveAttribute('aria-current', 'page')

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const reopened = await screen.findByRole('dialog', { name: /paleta de comandos/i })
    fireEvent.keyDown(reopened, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /paleta de comandos/i })).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('documenta y ejecuta shortcuts directos sin depender de la paleta', async () => {
    replaceHash('#/dashboard')
    render(<App />)
    await waitFor(() => expect(navButton('Inicio')).toHaveAttribute('aria-current', 'page'))

    fireEvent.keyDown(window, { key: 'e', altKey: true, shiftKey: true })
    await waitFor(() => expect(navButton('Editor')).toHaveAttribute('aria-current', 'page'))
    await waitFor(() => expect(window.location.hash).toBe('#/editor'))

    fireEvent.keyDown(window, { key: 'p', altKey: true, shiftKey: true })
    await waitFor(() => expect(navButton('Páginas')).toHaveAttribute('aria-current', 'page'))
    expect(window.location.hash).toBe('#/pages')
  })
})
