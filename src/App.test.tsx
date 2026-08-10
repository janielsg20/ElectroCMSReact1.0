import { fireEvent, render, screen, within } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('presenta el editor visual sin habilitar la ejecución de la app', () => {
    render(<App />)

    expect(screen.getByText(/ElectroCMS/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ejecutar app/i })).toBeDisabled()
  })

  it('expone navegación, canvas y paneles con regiones semánticas', () => {
    render(<App />)

    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
    expect(screen.getByRole('complementary', { name: /inspector de propiedades/i })).toBeInTheDocument()
  })

  it('expone una biblioteca de widgets filtrable', () => {
    render(<App />)

    const library = screen.getByRole('complementary', { name: /biblioteca y capas/i })
    fireEvent.click(within(library).getByRole('tab', { name: /componentes/i }))
    const search = within(library).getByRole('searchbox', { name: /buscar elementos/i })
    expect(search).toBeInTheDocument()
    expect(within(library).getByRole('button', { name: /contenedor/i })).toBeInTheDocument()
    fireEvent.change(search, { target: { value: 'Formulario' } })
    expect(within(library).queryByRole('button', { name: /contenedor/i })).not.toBeInTheDocument()
    expect(within(library).getByRole('button', { name: /formulario/i })).toBeInTheDocument()
  })

  it('permite colapsar y restaurar los paneles laterales en escritorio', () => {
    const originalMatchMedia = window.matchMedia ? window.matchMedia.bind(window) : undefined
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /alternar páginas y capas/i }))
    expect(screen.queryByRole('complementary', { name: /biblioteca y capas/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /alternar páginas y capas/i }))
    expect(screen.getByRole('complementary', { name: /biblioteca y capas/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /alternar inspector/i }))
    expect(screen.queryByRole('complementary', { name: /inspector de propiedades/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /alternar inspector/i }))
    expect(screen.getByRole('complementary', { name: /inspector de propiedades/i })).toBeInTheDocument()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else Reflect.deleteProperty(window, 'matchMedia')
  })

  it('redimensiona los paneles con teclado y límites accesibles', () => {
    render(<App />)

    const librarySeparator = screen.getByRole('separator', { name: /páginas y capas/i })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '192')
    fireEvent.keyDown(librarySeparator, { key: 'ArrowRight' })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '208')
    fireEvent.keyDown(librarySeparator, { key: 'Home' })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '168')

    const inspectorSeparator = screen.getByRole('separator', { name: /inspector/i })
    fireEvent.keyDown(inspectorSeparator, { key: 'ArrowLeft' })
    expect(inspectorSeparator).toHaveAttribute('aria-valuenow', '240')
    fireEvent.keyDown(inspectorSeparator, { key: 'End' })
    expect(inspectorSeparator).toHaveAttribute('aria-valuenow', '320')
  })
})
