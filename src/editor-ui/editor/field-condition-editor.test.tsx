import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseContentTypeId, parseFieldDefinitionId, type FieldDefinition } from '../../domain'
import { FieldConditionEditor } from './FieldConditionEditor'

const contentTypeId = parseContentTypeId('81000000-0000-4000-8000-000000000001')
const ageFieldId = parseFieldDefinitionId('82000000-0000-4000-8000-000000000001')
const typeFieldId = parseFieldDefinitionId('82000000-0000-4000-8000-000000000002')

function field(id: typeof ageFieldId, type: FieldDefinition['type'], key: string, label: string, order: number): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: type === 'number' ? 0 : '',
    description: '',
    group: '',
    id,
    key,
    label,
    options: type === 'select' ? [{ label: 'Empresa', value: 'company' }, { label: 'Persona', value: 'person' }] : [],
    order,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type,
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
}

const fields = [
  field(ageFieldId, 'number', 'age', 'Edad', 10),
  field(typeFieldId, 'select', 'customer_type', 'Tipo de cliente', 20),
]

function Harness() {
  const [conditions, setConditions] = useState<FieldDefinition['conditions']>([])
  return (
    <>
      <FieldConditionEditor fields={fields} onChange={setConditions} value={conditions} />
      <output aria-label="Condiciones actuales">{JSON.stringify(conditions)}</output>
    </>
  )
}

describe('M11.2 FieldConditionEditor', () => {
  it('crea reglas visuales sin exponer JSON editable', () => {
    render(<Harness />)

    expect(screen.queryByRole('textbox', { name: /condiciones técnicas/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }))
    expect(screen.getByRole('group', { name: 'Grupo 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Campo' })).toHaveTextContent('Edad')
    expect(screen.getByRole('button', { name: 'Condición' })).toHaveTextContent('Es igual a')
    expect(screen.getByRole('spinbutton', { name: 'Valor' })).toHaveValue(0)
  })

  it('cambia campo, operador y valor usando controles ElectroCMS', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }))

    fireEvent.click(screen.getByRole('button', { name: 'Campo' }))
    fireEvent.click(screen.getByRole('option', { name: /Tipo de cliente/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Condición' }))
    fireEvent.click(screen.getByRole('option', { name: 'No es igual a' }))
    fireEvent.click(screen.getByRole('button', { name: 'Valor' }))
    fireEvent.click(screen.getByRole('option', { name: 'Empresa' }))

    const output = screen.getByRole('status', { name: 'Condiciones actuales' })
    expect(output).toHaveTextContent(typeFieldId)
    expect(output).toHaveTextContent('not-equals')
    expect(output).toHaveTextContent('company')
  })

  it('permite elegir todas/cualquiera y añadir o quitar reglas', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }))

    fireEvent.click(screen.getByRole('button', { name: 'Cumplir' }))
    fireEvent.click(screen.getByRole('option', { name: 'Cualquiera de las reglas' }))
    const group = screen.getByRole('group', { name: 'Grupo 1' })
    fireEvent.click(within(group).getByRole('button', { name: 'Añadir regla' }))
    expect(within(group).getAllByRole('button', { name: 'Campo' })).toHaveLength(2)

    fireEvent.click(within(group).getByRole('button', { name: 'Eliminar regla 2 del grupo 1' }))
    expect(within(group).getAllByRole('button', { name: 'Campo' })).toHaveLength(1)
    expect(screen.getByRole('status', { name: 'Condiciones actuales' })).toHaveTextContent('any')
  })
})
