import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS,
  createCompleteWidgetRegistry,
} from '../../domain/widgets/commerce-form-filter-widgets'
import { parseNodeId, type JsonValue, type Node, type ResolvedNodeResponsiveState } from '../../domain/project'
import type { CanonicalWidgetRenderer, CanonicalWidgetViewProps } from './canonical-widget-contract'
import { completeReactAdapterRegistry } from './commerce-form-filter-widget-adapters'
import { createRegistryBackedWidgetRenderer } from './registered-widget-adapters'

const nodeId = parseNodeId('56565656-5656-4565-8565-565656565656')

function props(widgetType: string, properties: Readonly<Record<string, JsonValue>> = {}, slots: CanonicalWidgetViewProps['slots'] = {}): CanonicalWidgetViewProps {
  const node: Node = { bindings: {}, conditions: [], hidden: false, id: nodeId, kind: 'widget', locked: false, name: widgetType, properties, responsive: {}, slots: {}, styles: {}, widgetType }
  const responsive: ResolvedNodeResponsiveState = { hidden: false, properties, styles: {} }
  return { node, responsive, slots }
}

function renderer(fallback: CanonicalWidgetRenderer): CanonicalWidgetRenderer {
  return createRegistryBackedWidgetRenderer({ adapterRegistry: completeReactAdapterRegistry, fallback, widgetRegistry: createCompleteWidgetRegistry() })
}

afterEach(cleanup)

describe('M06.4 adapters de comercio, formularios y filtros', () => {
  it('mantiene correspondencia 1:1 y renderiza los 46 defaults sin fallback', () => {
    const fallback = vi.fn<CanonicalWidgetRenderer>(() => null)
    const renderWidget = renderer(fallback)
    for (const definition of COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS) {
      expect(completeReactAdapterRegistry.has(definition.rendererId), definition.id).toBe(true)
      const mounted = render(<>{renderWidget(props(definition.id))}</>)
      expect(mounted.container.firstElementChild, definition.id).not.toBeNull()
      mounted.unmount()
    }
    expect(fallback).not.toHaveBeenCalled()
  })

  it('muestra checkout, CAPTCHA y carga progresiva como estados honestos', () => {
    const renderWidget = renderer(() => null)
    render(<>{renderWidget(props('commerce.checkout'))}</>)
    expect(screen.getByText('Checkout no ejecutado')).toBeInTheDocument()
    cleanup()

    render(<>{renderWidget(props('form.captcha', { enabled: true, provider: 'turnstile' }))}</>)
    expect(screen.getByText('CAPTCHA turnstile requiere runtime')).toBeInTheDocument()
    cleanup()

    render(<>{renderWidget(props('filter.load-more', { disabled: false, label: 'Más', state: 'idle' }))}</>)
    expect(screen.getByRole('button', { name: /Más/ })).toBeDisabled()
  })

  it('bloquea protocolos inseguros y no envía formularios en preview', () => {
    const renderWidget = renderer(() => null)
    render(<>{renderWidget(props('commerce.buy-button', { disabled: false, href: 'javascript:alert(1)', label: 'Comprar' }))}</>)
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeDisabled()
    cleanup()

    const child = <button key="submit" type="submit">Enviar hijo</button>
    const mounted = render(<>{renderWidget(props('form.container', { action: 'https://example.com', label: 'Contacto', method: 'post' }, { content: [child] }))}</>)
    const form = screen.getByRole('form', { name: 'Contacto' })
    expect(fireEvent.submit(form)).toBe(false)
    expect(mounted.container.querySelector('form')).toHaveAttribute('data-action', 'https://example.com')
  })

  it('conserva controles nativos locales y estados accesibles', () => {
    const renderWidget = renderer(() => null)
    render(<>{renderWidget(props('form.email', { label: 'Correo', name: 'email', required: true, value: 'a@example.com' }))}</>)
    expect(screen.getByRole('textbox', { name: 'Correo' })).toBeRequired()
    cleanup()

    render(<>{renderWidget(props('filter.pagination', { page: 2, totalPages: 3 }))}</>)
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page')
    cleanup()

    render(<>{renderWidget(props('form.status-message', { message: 'No se pudo enviar', state: 'error' }))}</>)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo enviar')
  })

  it('conserva fallback únicamente para familias posteriores', () => {
    const fallback = vi.fn<CanonicalWidgetRenderer>(({ node }) => createElement('div', {}, node.name))
    const renderWidget = renderer(fallback)
    render(<>{renderWidget(props('navigation.menu'))}</>)
    expect(fallback).toHaveBeenCalledOnce()
  })
})
