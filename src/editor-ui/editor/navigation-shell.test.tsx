import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

describe('arquitectura de navegación CMS/builder', () => {
  beforeEach(() => window.localStorage.clear())

  it('reserva Capas para estructura y Widgets para inserción', () => {
    render(<App />)
    const library = screen.getByRole('complementary', { name: /biblioteca y capas/i })
    expect(within(library).getByRole('tab', { name: 'Capas' })).toBeInTheDocument()
    expect(within(library).getByRole('tab', { name: 'Widgets' })).toBeInTheDocument()
    expect(within(library).queryByRole('tab', { name: /documentos|datos|diseño|contenido/i })).not.toBeInTheDocument()
  })

  it('expone las funciones de proyecto desde la navegación principal', () => {
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: /navegación principal/i })
    expect(within(navigation).getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-current', 'page')
    expect(within(navigation).getByRole('button', { name: 'Documentos' })).toBeInTheDocument()
    expect(within(navigation).getByRole('button', { name: 'Contenido' })).toBeInTheDocument()
    expect(within(navigation).getByRole('button', { name: 'Diseño' })).toBeInTheDocument()
  })

  it('abre Contenido como módulo principal sin contaminar el panel de capas', () => {
    render(<App />)
    const library = screen.getByRole('complementary', { name: /biblioteca y capas/i })
    expect(within(library).queryByRole('tab', { name: /datos|contenido/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Contenido' }))
    const cms = screen.getByRole('region', { name: /contenido cms · módulo principal/i })
    expect(cms).toBeInTheDocument()
    expect(within(cms).getByRole('tablist', { name: /datos del proyecto/i })).toBeInTheDocument()
    expect(within(cms).getByRole('tab', { name: 'Tipos' })).toBeInTheDocument()
    expect(within(cms).getByRole('tab', { name: 'Campos' })).toBeInTheDocument()
    expect(within(cms).getByRole('tab', { name: /registros y relaciones/i })).toBeInTheDocument()
  })

  it('mantiene el ajuste real de anchura del rail', () => {
    render(<App />)
    const separator = screen.getByRole('separator', { name: /redimensionar menú lateral/i })
    fireEvent.keyDown(separator, { key: 'End' })
    expect(separator).toHaveAttribute('aria-valuenow', '168')
  })
})
