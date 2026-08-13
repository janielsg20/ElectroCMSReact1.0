import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { success, type NodeId, type NodePlacement, type ProjectStructure } from '../../domain'
import { ProjectStructureRenderStore } from '../../renderers'
import { CanonicalLayerTree } from './CanonicalLayerTree'
import { TEST_DOCUMENT_ID, TEST_PROJECT_STRUCTURE, TEST_SELECTED_NODE_ID } from './test-project-structure'
import { EditorProjectProvider } from './EditorProjectProvider'
import {
  buildLayerTreeEntries,
  dragPlacement,
  LAYER_DRAG_POLICY,
  placementRelativeTo,
  visibleLayerTreeEntries,
} from './layer-tree-model'

function createSession() {
  const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
  const move = vi.fn<(
    nodeIds: readonly NodeId[],
    placement: NodePlacement,
  ) => Promise<ReturnType<typeof success<ProjectStructure>>>>(() => Promise.resolve(success(store.structure)))
  return {
    move,
    session: {
      createBreakpoint: () => Promise.resolve(success({ breakpointId: store.structure.breakpoints[0].id, structure: store.structure })),
      documentId: TEST_DOCUMENT_ID,
      insertWidget: () => Promise.resolve(success({ nodeId: TEST_SELECTED_NODE_ID, structure: store.structure })),
      moveNodes: move,
      reorderBreakpoint: () => Promise.resolve(success(store.structure)),
      redo: () => Promise.resolve(success(store.structure)),
      resetNodeVisualStyles: () => Promise.resolve(success(store.structure)),
      resetProjectTheme: () => Promise.resolve(success(store.structure)),
      resetNodeBreakpointOverride: () => Promise.resolve(success(store.structure)),
      resetNodeDataSettings: () => Promise.resolve(success(store.structure)),
      resetWidgetProperty: () => Promise.resolve(success(store.structure)),
      resizeNode: () => Promise.resolve(success(store.structure)),
      store,
      undo: () => Promise.resolve(success(store.structure)),
      updateNodeSpacing: () => Promise.resolve(success(store.structure)),
      updateNodeDataSettings: () => Promise.resolve(success(store.structure)),
      updateBreakpoint: () => Promise.resolve(success(store.structure)),
      updateNodeVisualStyles: () => Promise.resolve(success(store.structure)),
      updateProjectTheme: () => Promise.resolve(success(store.structure)),
      updateWidgetProperty: () => Promise.resolve(success(store.structure)),
    },
  }
}

function entries(structure: ProjectStructure = TEST_PROJECT_STRUCTURE) {
  const document = structure.documents[TEST_DOCUMENT_ID]
  if (!document) throw new Error('Falta el documento demo.')
  return buildLayerTreeEntries(document)
}

describe('M05.3 CanonicalLayerTree', () => {
  it('configura el sensor pointer con umbral independiente de cuatro píxeles', () => {
    expect(LAYER_DRAG_POLICY.pointerDistance).toBe(4)
  })

  it('configura el sensor touch con espera y tolerancia independientes', () => {
    expect(LAYER_DRAG_POLICY.touchDelay).toBe(180)
    expect(LAYER_DRAG_POLICY.touchTolerance).toBe(6)
  })

  it('calcula el destino de teclado sortable hacia abajo después del objetivo', () => {
    const roots = entries().filter((entry) => entry.depth === 0)
    const first = roots[0]
    const second = roots[1]
    if (!first || !second) throw new Error('Faltan raíces para la prueba.')
    expect(dragPlacement(first, second)).toEqual({ index: 2, parentId: null, slot: null })
  })

  it('oculta descendientes cuando un ancestro está contraído', () => {
    const treeEntries = entries()
    const header = treeEntries.find((entry) => entry.node.name === 'Header')
    if (!header) throw new Error('Falta Header.')
    const visible = visibleLayerTreeEntries(treeEntries, new Set([header.node.id]))
    expect(visible.some((entry) => entry.node.name === 'Header')).toBe(true)
    expect(visible.some((entry) => entry.node.name === 'Marca')).toBe(false)
    expect(visible.some((entry) => entry.node.name === 'Hero principal')).toBe(true)
  })

  it('expande y contrae visualmente ramas del árbol sin perder su jerarquía', () => {
    const { session } = createSession()
    render(<EditorProjectProvider session={session}><CanonicalLayerTree /></EditorProjectProvider>)

    expect(screen.getByRole('button', { name: 'Header' })).toHaveClass('min-w-11')
    expect(screen.getByText('Marca')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Contraer Header' }))
    expect(screen.queryByText('Marca')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expandir Header' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Header' }))
    expect(screen.getByText('Marca')).toBeInTheDocument()
  })

  it('ofrece mover antes, después o dentro mediante controles ElectroCMS accesibles', async () => {
    const { move, session } = createSession()
    render(<EditorProjectProvider session={session}><CanonicalLayerTree /></EditorProjectProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Mover Header mediante menú' }))
    expect(screen.getByRole('group', { name: 'Mover capa sin arrastrar' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Destino' }))
    const heroOption = screen.getByRole('option', { name: /Hero principal/ })
    fireEvent.click(heroOption)

    fireEvent.click(screen.getByRole('button', { name: 'Posición' }))
    expect(screen.getByRole('option', { name: 'Antes' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Después' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dentro de' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Después' }))
    fireEvent.click(screen.getByRole('button', { name: /^Mover$/ }))

    const hero = entries().find((entry) => entry.node.name === 'Hero principal')
    if (!hero) throw new Error('Falta Hero principal.')
    await waitFor(() => expect(move).toHaveBeenCalledTimes(1))
    expect(move).toHaveBeenCalledWith(
      [entries()[0]?.node.id],
      placementRelativeTo(hero, 'after'),
    )
  })

  it('expone activadores de teclado y bloquea el arrastre de capas locked', () => {
    const structure = structuredClone(TEST_PROJECT_STRUCTURE)
    const document = structure.documents[TEST_DOCUMENT_ID]
    const header = document && Object.values(document.nodes).find((node) => node.name === 'Header')
    if (!header) throw new Error('Falta Header.')
    header.locked = true
    const store = new ProjectStructureRenderStore(structure)
    render(
      <EditorProjectProvider session={{
        createBreakpoint: () => Promise.resolve(success({ breakpointId: store.structure.breakpoints[0].id, structure: store.structure })),
        documentId: TEST_DOCUMENT_ID,
        insertWidget: () => Promise.resolve(success({ nodeId: TEST_SELECTED_NODE_ID, structure: store.structure })),
        moveNodes: () => Promise.resolve(success(store.structure)),
        reorderBreakpoint: () => Promise.resolve(success(store.structure)),
        redo: () => Promise.resolve(success(store.structure)),
        resetNodeVisualStyles: () => Promise.resolve(success(store.structure)),
        resetProjectTheme: () => Promise.resolve(success(store.structure)),
        resetNodeBreakpointOverride: () => Promise.resolve(success(store.structure)),
        resetNodeDataSettings: () => Promise.resolve(success(store.structure)),
        resetWidgetProperty: () => Promise.resolve(success(store.structure)),
        resizeNode: () => Promise.resolve(success(store.structure)),
        store,
        undo: () => Promise.resolve(success(store.structure)),
        updateNodeSpacing: () => Promise.resolve(success(store.structure)),
        updateNodeDataSettings: () => Promise.resolve(success(store.structure)),
        updateBreakpoint: () => Promise.resolve(success(store.structure)),
        updateNodeVisualStyles: () => Promise.resolve(success(store.structure)),
        updateProjectTheme: () => Promise.resolve(success(store.structure)),
        updateWidgetProperty: () => Promise.resolve(success(store.structure)),
      }}>
        <CanonicalLayerTree />
      </EditorProjectProvider>,
    )

    expect(screen.getByRole('button', { name: 'Header, bloqueada' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Arrastrar Hero principal' })).toHaveAttribute('tabindex', '0')
  })
})
