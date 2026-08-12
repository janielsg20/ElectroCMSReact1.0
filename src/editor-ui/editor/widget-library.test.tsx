import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { success, type NodeId, type NodePlacement, type ProjectStructure } from '../../domain'
import { ProjectStructureRenderStore } from '../../renderers'
import { EditorProjectProvider } from './EditorProjectProvider'
import { LibraryPanel } from './LibraryPanel'
import { STARTER_DOCUMENT_ID, STARTER_PROJECT_STRUCTURE, STARTER_SELECTED_NODE_ID } from './starter-project-structure'
import { WIDGET_LIBRARY_DRAG_POLICY } from './widget-library-context'
import { WIDGET_LIBRARY_PREFERENCES_KEY } from './widget-library-preferences'

function setup() {
  const store = new ProjectStructureRenderStore(STARTER_PROJECT_STRUCTURE)
  const insertedNodeId = '11111111-1111-4111-8111-111111111111' as NodeId
  const insertWidget = vi.fn(() => Promise.resolve(success({ nodeId: insertedNodeId, structure: store.structure })))
  const unchanged = () => Promise.resolve(success(store.structure))
  const session = {
    createBreakpoint: () => Promise.resolve(success({ breakpointId: store.structure.breakpoints[0].id, structure: store.structure })),
    documentId: STARTER_DOCUMENT_ID,
    initialSelectedNodeId: STARTER_SELECTED_NODE_ID,
    insertWidget,
    moveNodes: vi.fn<(_nodeIds: readonly NodeId[], _placement: NodePlacement) => Promise<ReturnType<typeof success<ProjectStructure>>>>(unchanged),
    reorderBreakpoint: unchanged,
    redo: unchanged,
    resetNodeVisualStyles: unchanged,
    resetProjectTheme: unchanged,
    resetNodeBreakpointOverride: unchanged,
    resetNodeDataSettings: unchanged,
    resetWidgetProperty: unchanged,
    resizeNode: unchanged,
    store,
    undo: unchanged,
    updateNodeSpacing: unchanged,
    updateNodeDataSettings: unchanged,
    updateBreakpoint: unchanged,
    updateNodeVisualStyles: unchanged,
    updateProjectTheme: unchanged,
    updateWidgetProperty: unchanged,
  }
  render(<EditorProjectProvider session={session}><LibraryPanel activeTab="widgets" onTabChange={() => undefined} /></EditorProjectProvider>)
  return { insertWidget }
}

describe('M06.5 UX de biblioteca', () => {
  it('configura DnD independiente para pointer y touch y conserva alternativa por clic', () => {
    setup()
    expect(WIDGET_LIBRARY_DRAG_POLICY).toEqual({ pointerDistance: 6, touchDelay: 180, touchTolerance: 6 })
    expect(screen.getByRole('button', { name: 'Arrastrar Título H1–H6 al canvas' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('button', { name: 'Insertar Título H1–H6' })).toBeInTheDocument()
  })

  it('filtra por búsqueda, categoría y favoritos con miniaturas declarativas', () => {
    setup()
    expect(screen.getByRole('img', { name: 'Miniatura de Contenedor' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por categoría' }), { target: { value: 'forms' } })
    expect(screen.queryByText('Contenedor')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Formulario/i).length).toBeGreaterThan(0)
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por categoría' }), { target: { value: 'all' } })

    fireEvent.click(screen.getByRole('button', { name: 'Añadir Contenedor a favoritos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Favoritos' }))
    expect(screen.getByText('Contenedor')).toBeInTheDocument()
    expect(screen.queryByText('Título H1–H6')).not.toBeInTheDocument()
  })

  it('inserta por clic, registra recientes y persiste preferencias fuera del documento', async () => {
    const { insertWidget } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Insertar Título H1–H6' }))
    await waitFor(() => expect(insertWidget).toHaveBeenCalledWith('content.heading', STARTER_SELECTED_NODE_ID, undefined))
    fireEvent.click(screen.getByRole('button', { name: 'Recientes' }))
    expect(screen.getByText('Título H1–H6')).toBeInTheDocument()
    const saved = JSON.parse(window.localStorage.getItem(WIDGET_LIBRARY_PREFERENCES_KEY) ?? '{}') as Record<string, unknown>
    expect(saved).toMatchObject({ recentWidgetIds: ['content.heading'], schemaVersion: 1 })
  })

  it('guarda la selección como preset, la reinserta y permite eliminarla', async () => {
    const { insertWidget } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar widget seleccionado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardados' }))
    expect(screen.getByText('Contenedor guardado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Insertar Contenedor guardado' }))
    await waitFor(() => expect(insertWidget).toHaveBeenCalledWith('layout.container', STARTER_SELECTED_NODE_ID, expect.objectContaining({ name: 'Contenedor guardado', properties: { maxWidth: 1200 } })))

    const library = screen.getByRole('complementary', { name: 'Capas y widgets del editor' })
    fireEvent.click(within(library).getByRole('button', { name: 'Eliminar Contenedor guardado de guardados' }))
    expect(screen.queryByText('Contenedor guardado')).not.toBeInTheDocument()
  })
})