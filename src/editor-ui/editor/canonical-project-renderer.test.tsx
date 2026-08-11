import { act, render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_BREAKPOINTS,
  parseGlobalComponentId,
  parseNodeId,
  type NodeId,
  type ProjectStructure,
} from '../../domain'
import {
  CanonicalProjectRenderer,
  ProjectStructureRenderStore,
  type CanonicalWidgetViewProps,
} from '../../renderers'
import {
  TEST_DOCUMENT_ID,
  TEST_PROJECT_STRUCTURE,
} from './test-project-structure'

function breakpoint(index: number) {
  const item = DEFAULT_BREAKPOINTS[index]
  if (!item) throw new Error(`Falta breakpoint ${index}.`)
  return item.id
}

function findNodeId(structure: ProjectStructure, name: string): NodeId {
  const document = structure.documents[TEST_DOCUMENT_ID]
  const node = document && Object.values(document.nodes).find((candidate) => candidate.name === name)
  if (!node) throw new Error(`Falta el nodo ${name}.`)
  return node.id
}

function cloneStructure(structure: ProjectStructure): ProjectStructure {
  return structuredClone(structure)
}

function diagnosticRenderer({ node, responsive, slots }: CanonicalWidgetViewProps): ReactNode {
  const value = responsive.properties.value
  return createElement(
    'section',
    {
      'data-rendered-name': node.name,
      'data-rendered-value': typeof value === 'string' || typeof value === 'number' ? String(value) : undefined,
    },
    node.name,
    ...Object.values(slots).flat(),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CanonicalProjectRenderer', () => {
  it('renderiza el documento canónico respetando roots, slots y orden', () => {
    const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
    const { container } = render(
      <CanonicalProjectRenderer
        breakpointId={breakpoint(0)}
        documentId={TEST_DOCUMENT_ID}
        renderWidget={diagnosticRenderer}
        store={store}
      />,
    )

    expect(screen.getByLabelText('Vista previa de Inicio')).toBeInTheDocument()
    const rootNames = Array.from(
      container.querySelector(`[data-canonical-document="${TEST_DOCUMENT_ID}"]`)?.children ?? [],
    ).map((element) => element.getAttribute('data-node-name'))
    expect(rootNames).toEqual(['Header', 'Hero principal', 'Métricas', 'Últimas historias'])

    const metrics = container.querySelector('[data-node-name="Métricas"]')
    const metricNames = Array.from(metrics?.querySelectorAll(':scope > section > [data-node-name]') ?? [])
      .map((element) => element.getAttribute('data-node-name'))
    expect(metricNames).toEqual(['Historias', 'Lectores', 'Países'])
  })

  it('aplica hidden responsive y conserva locked en la representación', () => {
    const structure = cloneStructure(TEST_PROJECT_STRUCTURE)
    const lockedNodeId = findNodeId(structure, 'Países')
    const document = structure.documents[TEST_DOCUMENT_ID]
    if (!document) throw new Error('Falta documento demo.')
    document.nodes[lockedNodeId] = { ...document.nodes[lockedNodeId], locked: true }
    const store = new ProjectStructureRenderStore(structure)
    const { container } = render(
      <CanonicalProjectRenderer
        breakpointId={breakpoint(4)}
        documentId={TEST_DOCUMENT_ID}
        renderWidget={diagnosticRenderer}
        store={store}
      />,
    )

    expect(container.querySelector('[data-node-name="Navegación"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-node-name="Países"]')).toHaveAttribute('data-node-locked', 'true')
  })

  it('aísla el error de un nodo sin derribar ramas hermanas', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
    const failingRenderer = (props: CanonicalWidgetViewProps): ReactNode => {
      if (props.node.name === 'Lectores') throw new Error('Fallo local de prueba')
      return diagnosticRenderer(props)
    }

    render(
      <CanonicalProjectRenderer
        breakpointId={breakpoint(0)}
        documentId={TEST_DOCUMENT_ID}
        renderWidget={failingRenderer}
        store={store}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo renderizar “Lectores”')
    expect(screen.getByText('Países')).toBeInTheDocument()
    expect(screen.getAllByText('Historias')).not.toHaveLength(0)
    expect(consoleError).toHaveBeenCalled()
  })

  it('actualiza solo el nodo modificado y no repinta ancestros o hermanos', () => {
    const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
    const renderCounts = new Map<NodeId, number>()
    const measuredRenderer = (props: CanonicalWidgetViewProps): ReactNode => {
      renderCounts.set(props.node.id, (renderCounts.get(props.node.id) ?? 0) + 1)
      return diagnosticRenderer(props)
    }
    render(
      <CanonicalProjectRenderer
        breakpointId={breakpoint(0)}
        documentId={TEST_DOCUMENT_ID}
        renderWidget={measuredRenderer}
        store={store}
      />,
    )

    const targetId = findNodeId(store.structure, 'Lectores')
    const siblingId = findNodeId(store.structure, 'Países')
    const ancestorId = findNodeId(store.structure, 'Métricas')
    const before = new Map(renderCounts)
    const next = cloneStructure(store.structure)
    const document = next.documents[TEST_DOCUMENT_ID]
    if (!document) throw new Error('Falta documento demo.')
    document.nodes[targetId] = {
      ...document.nodes[targetId],
      properties: { ...document.nodes[targetId]?.properties, value: '13k' },
    }

    act(() => {
      expect(store.replaceStructure(next).ok).toBe(true)
    })

    expect(renderCounts.get(targetId)).toBe((before.get(targetId) ?? 0) + 1)
    expect(renderCounts.get(siblingId)).toBe(before.get(siblingId))
    expect(renderCounts.get(ancestorId)).toBe(before.get(ancestorId))
    expect(screen.getByText('Lectores')).toHaveAttribute('data-rendered-value', '13k')
  })

  it('rechaza estructuras inválidas sin reemplazar el snapshot vigente', () => {
    const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
    const previous = store.structure
    const broken = cloneStructure(previous)
    const document = broken.documents[TEST_DOCUMENT_ID]
    if (!document) throw new Error('Falta documento demo.')
    const firstRootId = document.rootNodeIds[0]
    if (!firstRootId) throw new Error('Falta nodo raíz demo.')
    document.rootNodeIds.push(firstRootId)

    const result = store.replaceStructure(broken)

    expect(result.ok).toBe(false)
    expect(store.structure).toBe(previous)
  })

  it('expande instancias globales y reacciona si cambia la lista de raíces del componente', () => {
    const structure = cloneStructure(TEST_PROJECT_STRUCTURE)
    const componentId = parseGlobalComponentId('cccccccc-cccc-4ccc-8ccc-cccccccccc01')
    const instanceId = parseNodeId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01')
    const componentRootId = parseNodeId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02')
    const nextComponentRootId = parseNodeId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03')
    const document = structure.documents[TEST_DOCUMENT_ID]
    if (!document) throw new Error('Falta documento demo.')
    document.nodes[instanceId] = {
      bindings: {},
      componentId,
      conditions: [],
      hidden: false,
      id: instanceId,
      kind: 'component-instance',
      locked: false,
      name: 'Instancia global',
      properties: {},
      responsive: {},
      slots: {},
      styles: {},
    }
    document.rootNodeIds.push(instanceId)
    structure.globalComponents[componentId] = {
      id: componentId,
      name: 'Componente editorial',
      nodes: {
        [componentRootId]: {
          bindings: {},
          conditions: [],
          hidden: false,
          id: componentRootId,
          kind: 'widget',
          locked: false,
          name: 'Raíz global',
          properties: {},
          responsive: {},
          slots: {},
          styles: {},
          widgetType: 'layout.container',
        },
      },
      rootNodeIds: [componentRootId],
    }
    const store = new ProjectStructureRenderStore(structure)
    const { container } = render(
      <CanonicalProjectRenderer
        breakpointId={breakpoint(0)}
        documentId={TEST_DOCUMENT_ID}
        renderWidget={diagnosticRenderer}
        store={store}
      />,
    )
    expect(container.querySelector('[data-node-name="Raíz global"]')).toBeInTheDocument()

    const next = cloneStructure(store.structure)
    const component = next.globalComponents[componentId]
    if (!component) throw new Error('Falta componente global.')
    component.nodes[nextComponentRootId] = {
      ...component.nodes[componentRootId],
      id: nextComponentRootId,
      name: 'Segunda raíz global',
    }
    component.rootNodeIds.push(nextComponentRootId)

    act(() => {
      expect(store.replaceStructure(next).ok).toBe(true)
    })
    expect(container.querySelector('[data-node-name="Segunda raíz global"]')).toBeInTheDocument()
  })
})
