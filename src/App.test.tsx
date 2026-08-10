import { fireEvent, render, screen, within } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('presenta el editor como prototipo visual sin habilitar publicación', () => {
    render(<App />)

    expect(screen.getByText(/prototipo UI/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publicar/i })).toBeDisabled()
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
