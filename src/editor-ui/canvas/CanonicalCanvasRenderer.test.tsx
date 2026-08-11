import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NodeId } from '../../domain/project/identity'
import type { ProjectStructure } from '../../domain/project/structure-schema'
import {
  CanonicalCanvasRenderer,
  compileCanvasDocument,
  type CanvasNodeRenderer,
  type CanvasRenderNode,
} from './CanonicalCanvasRenderer'
import {
  PREVIEW_BREAKPOINTS,
  PREVIEW_DOCUMENT_ID,
  PREVIEW_HEADER_ID,
  PREVIEW_HERO_ID,
  PREVIEW_PROJECT_STRUCTURE,
  PREVIEW_ROOT_ID,
  PREVIEW_STATS_ID,
  PREVIEW_STORIES_ID,
} from '../editor/preview-project'

function findNode(roots: readonly CanvasRenderNode[], nodeId: NodeId): CanvasRenderNode | null {
  for (const node of roots) {
    if (node.id === nodeId) return node
    for (const slot of node.slots) {
      const child = findNode(slot.children, nodeId)
      if (child) return child
    }
  }
  return null
}

const basicRenderer: CanvasNodeRenderer = ({ node, children }) => (
  <section data-testid={`node-${node.id}`}>
    <span>{typeof node.properties.title === 'string' ? node.properties.title : node.name}</span>
    {children}
  </section>
)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('M05.2 Canvas canónico', () => {
  it('compila el documento por breakpoint usando la resolución responsive existente', () => {
    const desktop = compileCanvasDocument(PREVIEW_PROJECT_STRUCTURE, PREVIEW_DOCUMENT_ID, PREVIEW_BREAKPOINTS.desktop)
    const mobile = compileCanvasDocument(PREVIEW_PROJECT_STRUCTURE, PREVIEW_DOCUMENT_ID, PREVIEW_BREAKPOINTS.mobile)
    expect(desktop.ok).toBe(true)
    expect(mobile.ok).toBe(true)
    if (!desktop.ok || !mobile.ok) return

    expect(findNode(desktop.value.roots, PREVIEW_STORIES_ID)?.properties.title).toBe('Últimas historias')
    expect(findNode(mobile.value.roots, PREVIEW_STORIES_ID)?.properties.title).toBe('Historias')
    expect(desktop.value.documentName).toBe('Inicio')
  })

  it('rechaza una estructura inválida antes de intentar pintar nodos', () => {
    const invalid = structuredClone(PREVIEW_PROJECT_STRUCTURE)
    delete invalid.documents[PREVIEW_DOCUMENT_ID]?.nodes[PREVIEW_HERO_ID]

    const compiled = compileCanvasDocument(invalid, PREVIEW_DOCUMENT_ID, PREVIEW_BREAKPOINTS.desktop)
    expect(compiled).toMatchObject({ ok: false, error: { kind: 'structure-invalid' } })
  })

  it('respeta hidden base sin eliminar el nodo del modelo canónico', () => {
    const hidden = structuredClone(PREVIEW_PROJECT_STRUCTURE)
    const stories = hidden.documents[PREVIEW_DOCUMENT_ID]?.nodes[PREVIEW_STORIES_ID]
    if (!stories) throw new Error('Falta nodo stories.')
    stories.hidden = true

    render(
      <CanonicalCanvasRenderer
        breakpointId={PREVIEW_BREAKPOINTS.desktop}
        documentId={PREVIEW_DOCUMENT_ID}
        renderNode={basicRenderer}
        structure={hidden}
      />,
    )

    expect(screen.queryByTestId(`node-${PREVIEW_STORIES_ID}`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`node-${PREVIEW_HERO_ID}`)).toBeInTheDocument()
  })

  it('aísla una excepción de un nodo y conserva el resto del canvas disponible', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const throwingRenderer: CanvasNodeRenderer = ({ node, children }) => {
      if (node.id === PREVIEW_HERO_ID) throw new Error('Fallo controlado de Hero')
      return <section data-testid={`safe-${node.id}`}>{node.name}{children}</section>
    }

    render(
      <CanonicalCanvasRenderer
        breakpointId={PREVIEW_BREAKPOINTS.desktop}
        documentId={PREVIEW_DOCUMENT_ID}
        renderNode={throwingRenderer}
        structure={PREVIEW_PROJECT_STRUCTURE}
      />,
    )

    expect(document.querySelector(`[data-canvas-node-error="${PREVIEW_HERO_ID}"]`)).toBeInTheDocument()
    expect(screen.getByTestId(`safe-${PREVIEW_HEADER_ID}`)).toBeInTheDocument()
    expect(screen.getByTestId(`safe-${PREVIEW_STATS_ID}`)).toBeInTheDocument()
    expect(screen.getByTestId(`safe-${PREVIEW_STORIES_ID}`)).toBeInTheDocument()
  })

  it('no rerenderiza ramas hermanas cuando cambia solo un nodo local', () => {
    const counts = new Map<NodeId, number>()
    const onNodeRender = (nodeId: NodeId): void => counts.set(nodeId, (counts.get(nodeId) ?? 0) + 1)
    const { rerender } = render(
      <CanonicalCanvasRenderer
        breakpointId={PREVIEW_BREAKPOINTS.desktop}
        documentId={PREVIEW_DOCUMENT_ID}
        onNodeRender={onNodeRender}
        renderNode={basicRenderer}
        structure={PREVIEW_PROJECT_STRUCTURE}
      />,
    )

    expect(counts.get(PREVIEW_ROOT_ID)).toBe(1)
    expect(counts.get(PREVIEW_HEADER_ID)).toBe(1)
    expect(counts.get(PREVIEW_HERO_ID)).toBe(1)
    expect(counts.get(PREVIEW_STATS_ID)).toBe(1)
    expect(counts.get(PREVIEW_STORIES_ID)).toBe(1)

    const updated: ProjectStructure = structuredClone(PREVIEW_PROJECT_STRUCTURE)
    const stories = updated.documents[PREVIEW_DOCUMENT_ID]?.nodes[PREVIEW_STORIES_ID]
    if (!stories) throw new Error('Falta nodo stories.')
    stories.properties = { ...stories.properties, title: 'Historias actualizadas' }

    rerender(
      <CanonicalCanvasRenderer
        breakpointId={PREVIEW_BREAKPOINTS.desktop}
        documentId={PREVIEW_DOCUMENT_ID}
        onNodeRender={onNodeRender}
        renderNode={basicRenderer}
        structure={updated}
      />,
    )

    expect(counts.get(PREVIEW_ROOT_ID)).toBe(2)
    expect(counts.get(PREVIEW_STORIES_ID)).toBe(2)
    expect(counts.get(PREVIEW_HEADER_ID)).toBe(1)
    expect(counts.get(PREVIEW_HERO_ID)).toBe(1)
    expect(counts.get(PREVIEW_STATS_ID)).toBe(1)
    expect(screen.getByText('Historias actualizadas')).toBeInTheDocument()
  })
})
