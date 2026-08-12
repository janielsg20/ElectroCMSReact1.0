import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { success, type NodeId, type NodePlacement, type ProjectStructure } from '../../domain'
import { ProjectStructureRenderStore } from '../../renderers'
import { CanvasPreview, type ViewportMode } from './CanvasPreview'
import { TEST_DOCUMENT_ID, TEST_SELECTED_NODE_ID, TEST_PROJECT_STRUCTURE } from './test-project-structure'
import { EditorProjectProvider } from './EditorProjectProvider'
import { DEFAULT_CANVAS_WORKSPACE, type CanvasWorkspaceState } from './workspace-preferences'

function firePointer(target: Element, type: string, clientX: number, clientY: number, pointerId: number) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerId: { value: pointerId },
  })
  fireEvent(target, event)
}

function session() {
  const store = new ProjectStructureRenderStore(TEST_PROJECT_STRUCTURE)
  const result = () => Promise.resolve(success(store.structure))
  return {
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
    resizeNode: result,
    store,
    undo: result,
    updateNodeSpacing: result,
    updateNodeDataSettings: result,
    updateBreakpoint: result,
    updateNodeVisualStyles: result,
    updateProjectTheme: result,
    updateWidgetProperty: result,
  }
}

function CanvasHarness() {
  const [viewport, setViewport] = useState<ViewportMode>('mobile')
  const [canvas, setCanvas] = useState<CanvasWorkspaceState>(DEFAULT_CANVAS_WORKSPACE)
  return (
    <EditorProjectProvider session={session()}>
      <aside aria-label="Biblioteca y capas"><button type="button">Destino capas</button></aside>
      <CanvasPreview canvasWorkspace={canvas} inspectorOpen libraryOpen onCanvasWorkspaceChange={setCanvas} onToggleInspector={() => undefined} onToggleLibrary={() => undefined} onViewportChange={setViewport} viewport={viewport} />
      <aside aria-label="Inspector de propiedades"><button type="button">Destino inspector</button></aside>
    </EditorProjectProvider>
  )
}

describe('M05.5 zoom, pan, orientación y foco', () => {
  it('aplica zoom, pan por teclado y fit sin sacar el viewport de su región', () => {
    render(<CanvasHarness />)
    const region = screen.getByRole('region', { name: 'Viewport interactivo del canvas' })

    fireEvent.click(screen.getByRole('button', { name: 'Acercar canvas' }))
    expect(region.querySelector('[data-canvas-zoom]')).toHaveAttribute('data-canvas-zoom', '100')
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(region.querySelector('[data-canvas-pan-x]')).toHaveAttribute('data-canvas-pan-x', '32')
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar canvas a la vista' }))
    expect(region.querySelector('[data-canvas-pan-x]')).toHaveAttribute('data-canvas-pan-x', '0')
    expect(region.querySelector('[data-canvas-zoom]')).toHaveAttribute('data-canvas-zoom', '90')
  })

  it('rota el device frame y permite pan por puntero con herramienta explícita', () => {
    render(<CanvasHarness />)
    const rotate = screen.getByRole('button', { name: 'Cambiar orientación del dispositivo' })
    fireEvent.click(rotate)
    expect(rotate).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: 'Viewport del documento' })).toContainElement(rotate)
    expect(screen.getByLabelText('Zoom del canvas: 90 por ciento')).toBeInTheDocument()
    expect(screen.queryByText(/Horizontal · 90%/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Herramienta de desplazamiento' }))
    const region = screen.getByRole('region', { name: 'Viewport interactivo del canvas' })
    firePointer(region, 'pointerdown', 20, 20, 7)
    firePointer(region, 'pointermove', 52, 44, 7)
    firePointer(region, 'pointerup', 52, 44, 7)
    expect(region.querySelector('[data-canvas-pan-x]')).toHaveAttribute('data-canvas-pan-x', '32')
    expect(region.querySelector('[data-canvas-pan-y]')).toHaveAttribute('data-canvas-pan-y', '24')
  })

  it('elige el breakpoint representativo de cada modo sin anunciar un ancho ficticio', () => {
    render(<CanvasHarness />)
    const breakpointSelect = screen.getByLabelText('Breakpoint activo')
    const mobile = TEST_PROJECT_STRUCTURE.breakpoints.find((item) => item.name === 'Móvil pequeño')
    const tablet = TEST_PROJECT_STRUCTURE.breakpoints.find((item) => item.name === 'Tablet vertical')
    const desktop = TEST_PROJECT_STRUCTURE.breakpoints.find((item) => item.name === 'Desktop')
    expect(mobile && tablet && desktop).toBeTruthy()

    expect(screen.getByRole('button', { name: 'Móvil' })).toHaveAttribute('aria-pressed', 'true')
    expect(breakpointSelect).toHaveValue(mobile?.id)

    fireEvent.click(screen.getByRole('button', { name: 'Tablet' }))
    expect(breakpointSelect).toHaveValue(tablet?.id)

    fireEvent.click(screen.getByRole('button', { name: 'Escritorio' }))
    expect(breakpointSelect).toHaveValue(desktop?.id)
  })

  it('mueve el foco de forma explícita entre capas, canvas e inspector', async () => {
    render(<CanvasHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Enfocar panel de capas' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Destino capas' })).toHaveFocus())
    fireEvent.click(screen.getByRole('button', { name: 'Enfocar canvas' }))
    expect(screen.getByRole('region', { name: 'Viewport interactivo del canvas' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Enfocar inspector' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Destino inspector' })).toHaveFocus())
  })
})
