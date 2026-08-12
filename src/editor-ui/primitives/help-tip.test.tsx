import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HelpTip } from './HelpTip'

describe('HelpTip', () => {
  it('mantiene la ayuda dentro del viewport y permite cerrarla con Escape', () => {
    render(<HelpTip description="Explicación breve." label="Opción de prueba" reference="WordPress — Ajuste" />)
    const trigger = screen.getByRole('button', { name: 'Información: Opción de prueba' })
    fireEvent.click(trigger)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveClass('fixed')
    expect(tooltip).toHaveStyle({ left: '8px' })
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
