import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { success, type BreakpointId, type NodeId, type NodePlacement, type NodeSize, type NodeSpacing, type ProjectStructure } from '../../domain'
import { ProjectStructureRenderStore } from '../../renderers'
import { CanvasPreview } from './CanvasPreview'
import { TEST_DOCUMENT_ID, TEST_SELECTED_NODE_ID, TEST_PROJECT_STRUCTURE } from './test-project-structure'
import { EditorProjectProvider } from './EditorProjectProvider'

function firePointer(target: Element, type: string, clientX: number, clientY: number, pointerId: number) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerId: { value: pointerId },
  })
  fireEvent(target, event)
}

function createSession() {
  const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
  const result = () => Promise.resolve(success(store.structure))
  const resize = vi.fn<(nodeId: NodeId, size: NodeSize, breakpointId?: BreakpointId) => Promise<ReturnType<typeof success<ProjectStructure>>>>(result)
  const spacing = vi.fn<(nodeId: NodeId, value: NodeSpacing, breakpointId?: BreakpointId) => Promise<ReturnType<typeof success<ProjectStructure>>>>(result)
  return {
    resize,
    session: {
      createBreakpoint: () => Promise.resolve(success({ breakpointId: store.structure.breakpoints[0].id, structure: store.structure })),
      documentId: TEST_DOCUMENT_ID,
      initialSelectedNodeId: TEST_SELECTED_NODE_ID,
      insertWidget: () => Promise.resolve(success({ nodeId: TEST_SELECTED_NODE_ID, structure: store.structure })),
      moveNodes: vi.fn<(_nodeIds: readonly NodeId[], _placement: NodePlacement) => Promise<ReturnType<typeof success<ProjectStructure>>>>(result),
      reorderBreakpoint: result,
      redo: result,
      resetNodeVisualStyles: result,
      resetProjectTheme: result,
      resetNodeBreakpointOverride: result,
      resetNodeDataSettings: result,
      resetWidgetProperty: result,
      resizeNode: resize,
      store,
      undo: result,
      updateNodeSpacing: spacing,
      updateNodeDataSettings: result,
      updateBreakpoint: result,
      updateNodeVisualStyles: result,
      updateProjectTheme: result,
      updateWidgetProperty: result,
    },
    spacing,
  }
}

function renderCanvas() {
  const setup = createSession()
  render(
    <EditorProjectProvider session={setup.session}>
      <CanvasPreview
        inspectorOpen
        libraryOpen
        onToggleInspector={() => undefined}
        onToggleLibrary={() => undefined}
        onViewportChange={() => undefined}
        viewport="desktop"
      />
    </EditorProjectProvider>,
  )
  return setup
}

describe('M05.4 direct manipulation UI', () => {
  it('muestra reglas, breadcrumbs canónicos y handles accesibles', () => {
    renderCanvas()

    expect(screen.getByTestId('canvas-horizontal-ruler')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-vertical-ruler')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Ruta de selección' })).toHaveTextContent('Inicio/Hero principal/Contenido hero')
    expect(screen.getAllByRole('button', { name: /Redimensionar Contenido hero desde/ })).toHaveLength(4)
  })

  it('redimensiona por teclado y por puntero con snapping y guías visibles', async () => {
    const { resize } = renderCanvas()
    const handle = screen.getByRole('button', { name: 'Redimensionar Contenido hero desde inferior derecha' })

    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    await waitFor(() => expect(resize).toHaveBeenCalledWith(TEST_SELECTED_NODE_ID, { height: 120, width: 328 }, expect.any(String)))

    firePointer(handle, 'pointerdown', 10, 10, 1)
    firePointer(handle, 'pointermove', 23, 23, 1)
    expect(document.querySelectorAll('[data-guide-source="grid"]')).toHaveLength(2)
    firePointer(handle, 'pointerup', 23, 23, 1)
    await waitFor(() => expect(resize).toHaveBeenLastCalledWith(TEST_SELECTED_NODE_ID, { height: 136, width: 336 }, expect.any(String)))
  })

  it('abre el menú contextual sin arrastre y aplica tamaño y espaciado mediante la sesión', async () => {
    const { resize, spacing } = renderCanvas()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú contextual de Contenido hero' }))
    const menu = screen.getByRole('dialog', { name: 'Menú contextual de Contenido hero' })
    expect(menu).toBeInTheDocument()

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ancho del nodo' }), { target: { value: '480' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Padding Superior' }), { target: { value: '16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))

    await waitFor(() => expect(resize).toHaveBeenCalledWith(TEST_SELECTED_NODE_ID, expect.objectContaining({ width: 480 }), expect.any(String)))
    await waitFor(() => expect(spacing).toHaveBeenCalledTimes(1))
    expect(spacing.mock.calls[0]?.[0]).toBe(TEST_SELECTED_NODE_ID)
    expect(spacing.mock.calls[0]?.[1].padding.top).toBe(16)
    expect(screen.queryByTestId('direct-manipulation-menu')).not.toBeInTheDocument()
  })
})
