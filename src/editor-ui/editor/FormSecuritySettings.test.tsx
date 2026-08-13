import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseFormId, type Form } from '../../domain'
import { FormSecuritySettings } from './FormSecuritySettings'

const { updateForm } = vi.hoisted(() => ({ updateForm: vi.fn() }))

vi.mock('./form-session-context', () => ({
  useFormSession: () => ({ updateForm }),
}))

const formId = parseFormId('d1000000-0000-4000-8000-000000000001')

function form(): Form {
  return {
    actions: [],
    contentTypeId: null,
    controls: {
      control: { conditions: [], id: 'control', label: 'Campo', mappedFieldId: null, name: 'field', required: false, type: 'text' },
    },
    csrfProtection: true,
    draftSaving: false,
    errorMessage: 'Error',
    id: formId,
    name: 'Seguro',
    steps: [{ controlIds: ['control'], id: 'step', name: 'Datos' }],
    successMessage: 'Correcto',
  }
}

beforeEach(() => {
  updateForm.mockReset()
  updateForm.mockResolvedValue({ ok: true, value: {} })
})

describe('M11.5 FormSecuritySettings', () => {
  it('persiste el requisito CSRF usando la mutación canónica del formulario', async () => {
    render(<FormSecuritySettings form={form()} />)
    const toggle = screen.getByRole('switch', { name: 'Exigir protección CSRF en destinos con servidor' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)
    await waitFor(() => expect(updateForm).toHaveBeenCalledWith(formId, { csrfProtection: false }))
    expect(screen.getByRole('status')).toHaveTextContent(/CSRF desactivada/i)
  })

  it('explica requisitos de seguridad sin presentar middleware inexistente como configuración activa', () => {
    render(<FormSecuritySettings form={form()} />)
    expect(screen.getByText('Validar de nuevo en servidor')).toBeInTheDocument()
    expect(screen.getByText('Limitar solicitudes abusivas')).toBeInTheDocument()
    expect(screen.getByText('Honeypot antispam')).toBeInTheDocument()
    expect(screen.getByText('Revalidar archivos en servidor')).toBeInTheDocument()
    expect(screen.getByText(/10 MB/)).toBeInTheDocument()
  })

  it('muestra una matriz honesta sin exponer fases internas como lenguaje del producto', () => {
    render(<FormSecuritySettings form={form()} />)
    expect(screen.getByText('Local')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('LAMP')).toBeInTheDocument()
    expect(screen.getByText('WordPress')).toBeInTheDocument()
    expect(screen.getByText(/Vista previa disponible; exportación pendiente/)).toBeInTheDocument()
    expect(screen.getAllByText('Exportador aún no disponible').length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText(/F14|F15|F16/)).not.toBeInTheDocument()
  })
})
