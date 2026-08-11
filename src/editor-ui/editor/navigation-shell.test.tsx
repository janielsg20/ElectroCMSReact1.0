import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

describe('shell reducido al editor construido', () => {
  beforeEach(() => window.localStorage.clear())

  it('expone un único destino principal y conserva el canvas como contenido', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: /navegación principal/i })
    expect(within(navigation).getByLabelText('Editor')).toHaveAttribute('aria-current', 'page')
    expect(within(navigation).queryByText(/inicio|páginas|contenido|backend|exportar/i)).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
  })

  it('mantiene el ajuste real de anchura del rail sin cambiar de superficie', () => {
    render(<App />)

    const separator = screen.getByRole('separator', { name: /redimensionar menú lateral/i })
    fireEvent.keyDown(separator, { key: 'End' })
    expect(separator).toHaveAttribute('aria-valuenow', '168')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
  })

  it('no ofrece paleta, rutas ni módulos que todavía no existen', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: /abrir paleta de comandos/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/módulos del producto|demo final|próxima fase/i)).not.toBeInTheDocument()
  })
})
