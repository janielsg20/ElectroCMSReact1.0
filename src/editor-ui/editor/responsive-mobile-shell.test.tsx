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

describe('M04.3 shell móvil CMS/builder', () => {
  beforeEach(() => {
    window.localStorage.clear()
    assignViewportWidth(320)
  })

  afterEach(() => {
    assignViewportWidth(1024)
    window.localStorage.clear()
  })

  it('prioriza canvas y conserva cinco destinos responsive', async () => {
    const { container } = render(<App />)
    await waitFor(() => expect(container.querySelector('[data-mobile-shell="active"]')).toBeInTheDocument())

    const labels = within(builderDock()).getAllByRole('button').map((button) => button.getAttribute('aria-label'))
    expect(labels).toEqual(['Widgets', 'Capas', 'Canvas', 'Props', 'Más'])
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

  it('mantiene Capas e Inspector contextuales y abre los módulos globales desde Más', async () => {
    render(<App />)
    const dock = builderDock()

    fireEvent.click(within(dock).getByRole('button', { name: 'Capas' }))
    expect(await screen.findByRole('dialog', { name: 'Biblioteca' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }))

    fireEvent.click(within(dock).getByRole('button', { name: 'Props' }))
    expect(await screen.findByRole('dialog', { name: 'Inspector' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }))

    const more = within(dock).getByRole('button', { name: 'Más' })
    fireEvent.click(more)
    const modules = await screen.findByRole('dialog', { name: 'Más módulos' })
    expect(within(modules).getByRole('button', { name: 'Administración' })).toBeInTheDocument()
    expect(within(modules).getByRole('navigation', { name: 'Módulos principales' })).toBeInTheDocument()
    fireEvent.click(within(modules).getByRole('button', { name: /Contenido/i }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Más módulos' })).not.toBeInTheDocument())
    expect(await screen.findByRole('region', { name: /contenido dinámico · módulo principal/i })).toBeInTheDocument()
    expect(within(dock).getByRole('button', { name: 'Más' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(within(dock).getByRole('button', { name: 'Canvas' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: /contenido dinámico · módulo principal/i })).not.toBeInTheDocument())
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
  })

  it('cierra una sheet contextual al cruzar a tablet y activa el panel persistente', async () => {
    const { container } = render(<App />)
    fireEvent.click(within(builderDock()).getByRole('button', { name: 'Props' }))
    expect(await screen.findByRole('dialog', { name: 'Inspector' })).toBeInTheDocument()

    setViewportWidth(768)
    await waitFor(() => expect(container.querySelector('[data-mobile-shell="inactive"]')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inspector' })).not.toBeInTheDocument())
    expect(await screen.findByRole('complementary', { name: /panel contextual persistente de tablet/i })).toBeInTheDocument()
  })
})
