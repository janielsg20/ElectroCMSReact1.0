import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Button } from './Button'
import { ChoiceField } from './ChoiceField'
import { Icon } from './Icon'
import { TextField } from './TextField'

describe('primitives accesibles', () => {
  it('expone un botón nativo operable y evita dobles acciones durante carga', () => {
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

  it('oculta iconos decorativos y etiqueta los informativos', () => {
    const { rerender } = render(<Icon name="check" />)
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

    rerender(<Icon label="Operación completada" name="check" />)
    expect(screen.getByRole('img', { name: 'Operación completada' })).toBeInTheDocument()
  })

  it('opera ChoiceField con flechas, Home, End y devuelve el foco con Escape', async () => {
    render(
      <ChoiceField
        label="Tipo de campo"
        onChange={() => undefined}
        options={[
          { label: 'Texto', value: 'text' },
          { label: 'Número', value: 'number' },
          { label: 'Fecha', value: 'date' },
        ]}
        value="number"
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Tipo de campo' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const number = screen.getByRole('option', { name: 'Número' })
    await waitFor(() => expect(number).toHaveFocus())

    fireEvent.keyDown(number, { key: 'ArrowDown' })
    const date = screen.getByRole('option', { name: 'Fecha' })
    await waitFor(() => expect(date).toHaveFocus())

    fireEvent.keyDown(date, { key: 'Home' })
    const text = screen.getByRole('option', { name: 'Texto' })
    await waitFor(() => expect(text).toHaveFocus())

    fireEvent.keyDown(text, { key: 'End' })
    await waitFor(() => expect(date).toHaveFocus())
    fireEvent.keyDown(date, { key: 'Escape' })
    expect(screen.queryByRole('listbox', { name: 'Tipo de campo' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('selecciona una opción de ChoiceField y cierra el menú portado', async () => {
    const onChange = vi.fn()
    render(
      <ChoiceField
        label="Destino"
        onChange={onChange}
        options={[
          { label: 'Página', value: 'page' },
          { label: 'Entrada', value: 'post' },
        ]}
        value="page"
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Destino' })
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox', { name: 'Destino' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Entrada' }))
    expect(onChange).toHaveBeenCalledWith('post')
    expect(screen.queryByRole('listbox', { name: 'Destino' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
