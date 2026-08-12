import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Button } from './Button'
import { Checkbox, Select } from './FormControls'
import { Icon } from './Icon'
import { TextField } from './TextField'

describe('primitives accesibles', () => {
  it('expone un botón semántico operable y evita dobles acciones durante carga', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Guardar</Button>)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<Button isLoading onClick={onClick} loadingLabel="Guardando">Guardar</Button>)
    const loadingButton = screen.getByRole('button', { name: 'Guardando' })
    expect(loadingButton).toBeDisabled()
    expect(loadingButton).toHaveAttribute('aria-busy', 'true')
  })

  it('asocia etiqueta, ayuda y error con el campo', () => {
    render(<TextField error="El nombre es obligatorio" hint="Usa un nombre descriptivo" label="Nombre" required />)

    const input = screen.getByRole('textbox', { name: 'Nombre' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Usa un nombre descriptivo El nombre es obligatorio')
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre es obligatorio')
  })

  it('usa un listbox ElectroCMS en lugar de un select visual nativo', () => {
    const onValueChange = vi.fn()
    const { container } = render(<Select label="Orientación" onValueChange={onValueChange} options={[{ label: 'Vertical', value: 'portrait' }, { label: 'Horizontal', value: 'landscape' }]} value="portrait" />)

    const select = screen.getByRole('combobox', { name: 'Orientación' })
    fireEvent.click(select)
    fireEvent.click(screen.getByRole('option', { name: 'Horizontal' }))

    expect(onValueChange).toHaveBeenCalledWith('landscape')
    expect(container.querySelector('select')).toBeNull()
    expect(select).toHaveAttribute('data-electrocms-control', 'select')
  })

  it('renderiza checkbox ElectroCMS sin checkbox visual nativo', () => {
    const onCheckedChange = vi.fn()
    const { container } = render(<Checkbox checked={false} label="Visible" onCheckedChange={onCheckedChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Visible' }))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()
  })

  it('oculta iconos decorativos y etiqueta los informativos', () => {
    const { rerender } = render(<Icon name="check" />)
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

    rerender(<Icon label="Operación completada" name="check" />)
    expect(screen.getByRole('img', { name: 'Operación completada' })).toBeInTheDocument()
  })
})
