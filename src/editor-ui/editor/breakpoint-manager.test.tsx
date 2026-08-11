import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { success, type BreakpointId, type NodeId, type NodePlacement, type ProjectStructure } from '../../domain'
import { ProjectStructureRenderStore } from '../../renderers'
import { EditorProjectProvider } from './EditorProjectProvider'
import { BreakpointManager } from './BreakpointManager'
import { TEST_DOCUMENT_ID, TEST_PROJECT_STRUCTURE, TEST_SELECTED_NODE_ID } from './test-project-structure'

function setup() {
  const structure = structuredClone(TEST_PROJECT_STRUCTURE)
  const activeId = structure.breakpoints[4]?.id
  if (!activeId) throw new Error('Falta breakpoint móvil.')
  const selected = structure.documents[TEST_DOCUMENT_ID]?.nodes[TEST_SELECTED_NODE_ID]
  if (selected) selected.responsive[activeId] = { properties: {}, styles: { gap: 8 } }
  const store = new ProjectStructureRenderStore(structure)
  const unchanged = () => Promise.resolve(success(store.structure))
  const createBreakpoint = vi.fn(() => Promise.resolve(success({ breakpointId: activeId, structure: store.structure })))
  const reorderBreakpoint = vi.fn(unchanged)
  const resetNodeBreakpointOverride = vi.fn(unchanged)
  const updateBreakpoint = vi.fn(unchanged)
  const session = {
    createBreakpoint,
    documentId: TEST_DOCUMENT_ID,
    initialSelectedNodeId: TEST_SELECTED_NODE_ID,
    insertWidget: () => Promise.resolve(success({ nodeId: TEST_SELECTED_NODE_ID, structure: store.structure })),
    moveNodes: vi.fn<(_nodeIds: readonly NodeId[], _placement: NodePlacement) => Promise<ReturnType<typeof success<ProjectStructure>>>>(unchanged),
    redo: unchanged,
    reorderBreakpoint,
    resetNodeBreakpointOverride,
    resetNodeDataSettings: unchanged,
    resetNodeVisualStyles: unchanged,
    resetProjectTheme: unchanged,
    resetWidgetProperty: unchanged,
    resizeNode: unchanged,
    store,
    undo: unchanged,
    updateBreakpoint,
    updateNodeSpacing: unchanged,
    updateNodeDataSettings: unchanged,
    updateNodeVisualStyles: unchanged,
    updateProjectTheme: unchanged,
    updateWidgetProperty: unchanged,
  }

  function Harness() {
    const [active, setActive] = useState<BreakpointId>(activeId)
    return <EditorProjectProvider session={session}><BreakpointManager activeBreakpointId={active} onActiveBreakpointChange={setActive} /></EditorProjectProvider>
  }
  render(<Harness />)
  return { activeId, createBreakpoint, reorderBreakpoint, resetNodeBreakpointOverride, updateBreakpoint }
}

describe('M07.4 administrador de breakpoints', () => {
  it('selecciona cualquier breakpoint canónico y edita sus metadatos', async () => {
    const { activeId, updateBreakpoint } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Administrar breakpoints' }))
    const dialog = screen.getByRole('dialog', { name: 'Administrador de breakpoints' })
    expect(within(dialog).getByRole('list', { name: 'Orden de breakpoints' })).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'Móvil UI' } })
    fireEvent.change(within(dialog).getByLabelText('Ancho (px)'), { target: { value: '520' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(updateBreakpoint).toHaveBeenCalledWith(activeId, expect.objectContaining({ name: 'Móvil UI', width: 520 })))
  })

  it('crea, reordena y restablece el override activo con alternativas por botón', async () => {
    const { activeId, createBreakpoint, reorderBreakpoint, resetNodeBreakpointOverride } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Administrar breakpoints' }))
    const dialog = screen.getByRole('dialog', { name: 'Administrador de breakpoints' })

    fireEvent.click(within(dialog).getByRole('button', { name: '+ Nuevo breakpoint' }))
    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'Custom' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear breakpoint' }))
    await waitFor(() => expect(createBreakpoint).toHaveBeenCalledWith(expect.objectContaining({ name: 'Custom', width: 900 })))

    fireEvent.click(within(dialog).getByRole('button', { name: /Móvil grande/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: '↑ Subir' }))
    await waitFor(() => expect(reorderBreakpoint).toHaveBeenCalledWith(activeId, 3))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reset override activo' }))
    await waitFor(() => expect(resetNodeBreakpointOverride).toHaveBeenCalledWith(TEST_SELECTED_NODE_ID, activeId))
  })
})
