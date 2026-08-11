import { cleanup, render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  STRUCTURAL_BASIC_WIDGET_DEFINITIONS,
  createStructuralBasicWidgetRegistry,
  parseNodeId,
  type JsonValue,
  type Node,
  type ResolvedNodeResponsiveState,
} from '../../domain'
import type { CanonicalWidgetRenderer, CanonicalWidgetViewProps } from './canonical-widget-view'
import {
  ReactWidgetAdapterRegistry,
  createRegistryBackedWidgetRenderer,
  createStructuralBasicReactAdapterRegistry,
} from './registered-widget-adapters'

const nodeId = parseNodeId('12121212-1212-4121-8121-121212121212')
function widgetNode(widgetType: string, properties: Readonly<Record<string, JsonValue>> = {}): Node {
  return {
    bindings: {}, conditions: [], hidden: false, id: nodeId, kind: 'widget', locked: false,
    name: widgetType, properties, responsive: {}, slots: {}, styles: {}, widgetType,
  }
}

function props(widgetType: string, properties: Readonly<Record<string, JsonValue>> = {}): CanonicalWidgetViewProps {
  const responsive: ResolvedNodeResponsiveState = { hidden: false, properties, styles: {} }
  return { node: widgetNode(widgetType, properties), responsive, slots: {} }
}

function createRenderer(fallback: CanonicalWidgetRenderer = ({ node }) => createElement('div', { 'data-fallback': node.name })): CanonicalWidgetRenderer {
  const widgetRegistry = createStructuralBasicWidgetRegistry()
  return createRegistryBackedWidgetRenderer({
    adapterRegistry: createStructuralBasicReactAdapterRegistry(widgetRegistry),
    fallback,
    widgetRegistry,
  })
}

afterEach(cleanup)

describe('M06.2 adapters React registrados', () => {
  it('mantiene correspondencia completa entre definición y adapter externo', () => {
    const widgetRegistry = createStructuralBasicWidgetRegistry()
    const adapters = createStructuralBasicReactAdapterRegistry(widgetRegistry)
    for (const definition of STRUCTURAL_BASIC_WIDGET_DEFINITIONS) {
      expect(adapters.get(definition.rendererId), definition.id).toBeTypeOf('function')
    }
  })

  it('renderiza los defaults de las 35 definiciones sin usar el fallback provisional', () => {
    const fallback = vi.fn<CanonicalWidgetRenderer>(() => null)
    const renderer = createRenderer(fallback)

    for (const definition of STRUCTURAL_BASIC_WIDGET_DEFINITIONS) {
      const view = renderer(props(definition.id))
      const mounted = render(<>{view}</>)
      expect(mounted.container.firstElementChild, definition.id).not.toBeNull()
      mounted.unmount()
    }
    expect(fallback).not.toHaveBeenCalled()
  })

  it('aplica propiedades validadas a layout, heading, tabla y accesibilidad', () => {
    const renderer = createRenderer()
    const child: ReactNode = <span key="child">Contenido hijo</span>

    const flex = render(<>{renderer({ ...props('layout.flex', { align: 'center', direction: 'column', gap: 24, justify: 'between', wrap: false }), slots: { content: [child] } })}</>)
    expect(screen.getByText('Contenido hijo').parentElement).toHaveStyle({ alignItems: 'center', flexDirection: 'column', gap: '24px', justifyContent: 'space-between' })
    flex.unmount()

    render(<>{renderer(props('content.heading', { level: 4, text: 'Título registrado' }))}</>)
    expect(screen.getByRole('heading', { level: 4, name: 'Título registrado' })).toBeInTheDocument()
    cleanup()

    render(<>{renderer(props('content.table', { caption: 'Datos', headers: ['Nombre'], rows: [['ElectroCMS']] }))}</>)
    expect(screen.getByRole('table', { name: 'Datos' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'ElectroCMS' })).toBeInTheDocument()
  })

  it('aísla embeds inseguros y no interpreta HTML del usuario', () => {
    const renderer = createRenderer()
    const { container } = render(<>{renderer(props('embed.iframe', { src: 'javascript:alert(1)', title: 'Demo externa' }))}</>)
    expect(container.querySelector('iframe')).toHaveAttribute('src', 'about:blank')
    expect(container.querySelector('iframe')).toHaveAttribute('sandbox', '')
    expect(screen.getByTitle('Demo externa')).toBeInTheDocument()
    cleanup()

    const html = render(<>{renderer(props('embed.html', { html: '<img src=x onerror=alert(1)>' }))}</>)
    expect(html.container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })

  it('delega widgets de futuras microfases y rechaza adapters registrados ausentes', () => {
    const fallback = vi.fn<CanonicalWidgetRenderer>(() => <div>Fallback</div>)
    const renderer = createRenderer(fallback)
    render(<>{renderer(props('content.card'))}</>)
    expect(screen.getByText('Fallback')).toBeInTheDocument()
    expect(fallback).toHaveBeenCalledOnce()

    const definitions = createStructuralBasicWidgetRegistry()
    const emptyAdapters = new ReactWidgetAdapterRegistry()
    const missingRenderer = createRegistryBackedWidgetRenderer({ adapterRegistry: emptyAdapters, fallback, widgetRegistry: definitions })
    expect(() => missingRenderer(props('content.heading'))).toThrow(/adapter React/)

    const adapters = createStructuralBasicReactAdapterRegistry(definitions)
    const headingRendererId = definitions.get('content.heading')?.rendererId
    if (!headingRendererId) throw new Error('Falta renderer de heading.')
    expect(() => adapters.register(headingRendererId, () => null)).toThrow(/ya está registrado/)
  })
})
