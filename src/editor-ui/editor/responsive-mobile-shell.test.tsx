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

describe('M04.3 shell móvil', () => {
  beforeEach(() => {
    window.localStorage.clear()
    assignViewportWidth(320)
  })

  afterEach(() => {
    assignViewportWidth(1024)
    window.localStorage.clear()
  })

  it('prioriza canvas y conserva cinco destinos compactos a 320 px', async () => {
    const { container } = render(<App />)

    await waitFor(() => expect(container.querySelector('[data-mobile-shell="active"]')).toBeInTheDocument())
    const dock = builderDock()
    const labels = within(dock).getAllByRole('button').map((button) => button.getAttribute('aria-label'))

    expect(labels).toEqual(['Widgets', 'Páginas', 'Canvas', 'Props', 'Más'])
    expect(within(dock).getByRole('button', { name: 'Canvas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
    expect(container.querySelector('.editor-shell')).toHaveClass('h-dvh', 'overflow-hidden')
  })

  it('abre sheets accesibles a 375 px, cierra con Escape y restaura foco', async () => {
    assignViewportWidth(375)
    render(<App />)

    const trigger = within(builderDock()).getByRole('button', { name: 'Widgets' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Biblioteca' })
    const sheet = dialog.querySelector<HTMLElement>('.mobile-sheet')
    expect(sheet).not.toBeNull()
    await waitFor(() => expect(sheet).toHaveFocus())
    expect(within(dialog).getByRole('heading', { name: 'Componentes' })).toBeInTheDocument()

    fireEvent.keyDown(sheet as HTMLElement, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Biblioteca' })).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('mantiene Páginas, Props y Más disponibles sin depender de drag', async () => {
    render(<App />)
    const dock = builderDock()

    fireEvent.click(within(dock).getByRole('button', { name: 'Páginas' }))
    expect(await screen.findByRole('dialog', { name: 'Biblioteca' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }))

    fireEvent.click(within(dock).getByRole('button', { name: 'Props' }))
    expect(await screen.findByRole('dialog', { name: 'Inspector' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }))

    fireEvent.click(within(dock).getByRole('button', { name: 'Más' }))
    const modules = await screen.findByRole('dialog', { name: 'Módulos del producto' })
    expect(within(modules).getByRole('button', { name: /^Editor\b/i })).toBeInTheDocument()
    expect(within(modules).getByRole('button', { name: /^Inicio\b/i })).toBeInTheDocument()
  })

  it('evita un Canvas muerto fuera del editor y conserva el camino de regreso', async () => {
    render(<App />)
    const dock = builderDock()

    fireEvent.click(within(dock).getByRole('button', { name: 'Más' }))
    const modules = await screen.findByRole('dialog', { name: 'Módulos del producto' })
    fireEvent.click(within(modules).getByRole('button', { name: /^Inicio\b/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(dock).getByRole('button', { name: 'Más' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(within(dock).getByRole('button', { name: 'Canvas' }))
    const navigation = await screen.findByRole('dialog', { name: 'Módulos del producto' })
    fireEvent.click(within(navigation).getByRole('button', { name: /^Editor\b/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(dock).getByRole('button', { name: 'Canvas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
  })

  it('cierra una sheet móvil al cruzar a tablet y activa M04.2 sin arrastrar estado temporal', async () => {
    const { container } = render(<App />)

    fireEvent.click(within(builderDock()).getByRole('button', { name: 'Props' }))
    expect(await screen.findByRole('dialog', { name: 'Inspector' })).toBeInTheDocument()

    setViewportWidth(768)

    await waitFor(() => expect(container.querySelector('[data-mobile-shell="inactive"]')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inspector' })).not.toBeInTheDocument())
    expect(await screen.findByRole('complementary', { name: /panel contextual persistente de tablet/i })).toBeInTheDocument()
  })
})
