import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

function assignViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

function setViewportWidth(width: number): void {
  assignViewportWidth(width)
  fireEvent(window, new Event('resize'))
}

function builderDock() {
  return screen.getByRole('navigation', { name: /navegación del builder/i })
}

describe('M04.3 shell móvil reducido', () => {
  beforeEach(() => {
    window.localStorage.clear()
    assignViewportWidth(320)
  })

  afterEach(() => {
    assignViewportWidth(1024)
    window.localStorage.clear()
  })

  it('prioriza canvas y muestra solo cuatro destinos implementados', async () => {
    const { container } = render(<App />)
    await waitFor(() => expect(container.querySelector('[data-mobile-shell="active"]')).toBeInTheDocument())

    const labels = within(builderDock()).getAllByRole('button').map((button) => button.getAttribute('aria-label'))
    expect(labels).toEqual(['Widgets', 'Capas', 'Canvas', 'Inspector'])
    expect(within(builderDock()).getByRole('button', { name: 'Canvas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
  })

  it('abre widgets, cierra con Escape y restaura foco', async () => {
    assignViewportWidth(375)
    render(<App />)
    const trigger = within(builderDock()).getByRole('button', { name: 'Widgets' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Biblioteca' })
    const sheet = dialog.querySelector<HTMLElement>('.mobile-sheet')
    await waitFor(() => expect(sheet).toHaveFocus())
    expect(within(dialog).getByRole('heading', { name: 'Widgets' })).toBeInTheDocument()
    fireEvent.keyDown(sheet as HTMLElement, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Biblioteca' })).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('ofrece capas e inspector sin un menú de módulos futuros', async () => {
    render(<App />)
    const dock = builderDock()

    fireEvent.click(within(dock).getByRole('button', { name: 'Capas' }))
    expect(await screen.findByRole('dialog', { name: 'Biblioteca' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }))
    fireEvent.click(within(dock).getByRole('button', { name: 'Inspector' }))
    expect(await screen.findByRole('dialog', { name: 'Inspector' })).toBeInTheDocument()
    expect(within(dock).queryByRole('button', { name: 'Más' })).not.toBeInTheDocument()
  })

  it('cierra una sheet al cruzar a tablet y activa el panel persistente', async () => {
    const { container } = render(<App />)
    fireEvent.click(within(builderDock()).getByRole('button', { name: 'Inspector' }))
    expect(await screen.findByRole('dialog', { name: 'Inspector' })).toBeInTheDocument()

    setViewportWidth(768)
    await waitFor(() => expect(container.querySelector('[data-mobile-shell="inactive"]')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inspector' })).not.toBeInTheDocument())
    expect(await screen.findByRole('complementary', { name: /panel contextual persistente de tablet/i })).toBeInTheDocument()
  })
})
