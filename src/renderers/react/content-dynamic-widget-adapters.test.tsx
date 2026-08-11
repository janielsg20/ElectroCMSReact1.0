import { cleanup, render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONTENT_DYNAMIC_WIDGET_DEFINITIONS,
  createCoreWidgetRegistry,
  parseNodeId,
  type JsonValue,
  type Node,
  type ResolvedNodeResponsiveState,
} from '../../domain'
import type { CanonicalWidgetRenderer, CanonicalWidgetViewProps } from './canonical-widget-contract'
import { coreReactAdapterRegistry } from './content-dynamic-widget-adapters'
import { createRegistryBackedWidgetRenderer } from './registered-widget-adapters'

const nodeId = parseNodeId('34343434-3434-4343-8343-343434343434')

function props(widgetType: string, properties: Readonly<Record<string, JsonValue>> = {}, slots: CanonicalWidgetViewProps['slots'] = {}): CanonicalWidgetViewProps {
  const node: Node = { bindings: {}, conditions: [], hidden: false, id: nodeId, kind: 'widget', locked: false, name: widgetType, properties, responsive: {}, slots: {}, styles: {}, widgetType }
  const responsive: ResolvedNodeResponsiveState = { hidden: false, properties, styles: {} }
  return { node, responsive, slots }
}

function renderer(fallback: CanonicalWidgetRenderer): CanonicalWidgetRenderer {
  return createRegistryBackedWidgetRenderer({ adapterRegistry: coreReactAdapterRegistry, fallback, widgetRegistry: createCoreWidgetRegistry() })
}

afterEach(cleanup)

describe('M06.3 adapters de contenido y dinámicos', () => {
  it('mantiene correspondencia 1:1 y renderiza los 34 defaults sin fallback', () => {
    const fallback = vi.fn<CanonicalWidgetRenderer>(() => null)
    const renderWidget = renderer(fallback)
    for (const definition of CONTENT_DYNAMIC_WIDGET_DEFINITIONS) {
      expect(coreReactAdapterRegistry.has(definition.rendererId), definition.id).toBe(true)
      const mounted = render(<>{renderWidget(props(definition.id))}</>)
      expect(mounted.container.firstElementChild, definition.id).not.toBeNull()
      mounted.unmount()
    }
    expect(fallback).not.toHaveBeenCalled()
  })

  it('representa contenido semántico y bloquea destinos inseguros', () => {
    const renderWidget = renderer(() => null)
    render(<>{renderWidget(props('content.faq', { answer: 'Respuesta segura', open: true, question: '¿Pregunta?' }))}</>)
    expect(screen.getByText('¿Pregunta?').closest('details')).toHaveAttribute('open')
    expect(screen.getByText('Respuesta segura')).toBeInTheDocument()
    cleanup()

    render(<>{renderWidget(props('content.call-to-action', { buttonLabel: 'Ir', href: 'javascript:alert(1)', text: 'Texto', title: 'CTA' }))}</>)
    expect(screen.getByRole('link', { name: 'Ir' })).toHaveAttribute('href', '#')
  })

  it('muestra estados vacíos honestos y usa slots locales sin simular queries', () => {
    const renderWidget = renderer(() => null)
    render(<>{renderWidget(props('dynamic.query-result', { emptyMessage: 'Consulta sin ejecutar', queryId: 'posts.latest' }))}</>)
    expect(screen.getByText('Consulta sin ejecutar')).toHaveAttribute('data-dynamic-source', 'posts.latest')
    cleanup()

    const child: ReactNode = <article key="resultado">Resultado proporcionado</article>
    render(<>{renderWidget(props('dynamic.query-result', { emptyMessage: 'Vacío', queryId: 'posts.latest' }, { content: [child] }))}</>)
    expect(screen.getByText('Resultado proporcionado')).toBeInTheDocument()
    expect(screen.queryByText('Vacío')).not.toBeInTheDocument()
  })

  it('no evalúa expresiones calculadas ni condiciones falsas', () => {
    const renderWidget = renderer(() => null)
    const expression = 'globalThis.compromised = true'
    const calculated = render(<>{renderWidget(props('dynamic.calculated-field', { expression, fallback: 'Sin cálculo' }))}</>)
    expect(screen.getByText('Sin cálculo')).toHaveAttribute('data-expression', expression)
    expect(calculated.container.textContent).not.toContain('compromised')
    cleanup()

    const conditional = render(<>{renderWidget(props('dynamic.conditional-field', { condition: 'role == admin', matches: false, value: 'Secreto' }))}</>)
    expect(conditional.container).toBeEmptyDOMElement()
  })

  it('sustituye los casos provisionales card y metric y conserva fallback para familias futuras', () => {
    const fallback = vi.fn<CanonicalWidgetRenderer>(({ node }) => createElement('div', {}, node.name))
    const renderWidget = renderer(fallback)
    render(<>{renderWidget(props('content.card', { description: 'Descripción', title: 'Tarjeta real' }))}</>)
    expect(screen.getByRole('article')).toHaveTextContent('Tarjeta realDescripción')
    expect(fallback).not.toHaveBeenCalled()
    cleanup()

    render(<>{renderWidget(props('commerce.product-card'))}</>)
    expect(fallback).toHaveBeenCalledOnce()
  })
})
