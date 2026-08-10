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
})
