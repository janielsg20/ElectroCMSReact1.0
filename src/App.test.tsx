import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('identifica la pantalla como una fundación técnica sin simular módulos terminados', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /base verificable de ElectroCMS/i })).toBeInTheDocument()
    expect(screen.getByText(/no se presentan aquí como funciones terminadas/i)).toBeInTheDocument()
  })

  it('declara que el producto se construye desde sus contratos canónicos', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 2, name: /desarrollo desde cero/i })).toBeInTheDocument()
    expect(screen.getByText(/exclusivamente desde sus contratos y requisitos canónicos/i)).toBeInTheDocument()
  })

  it('expone las capacidades de calidad y despliegue como una lista semántica', () => {
    render(<App />)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Cloudflare Pages' })).toBeInTheDocument()
  })
})
