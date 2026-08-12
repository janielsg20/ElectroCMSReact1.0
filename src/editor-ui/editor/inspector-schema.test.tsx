import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { failure, success, type JsonValue, type NodeId, type NodePlacement, type ProjectStructure, type Result } from '../../domain'
import { ProjectStructureRenderStore } from '../../renderers'
import { EditorProjectProvider } from './EditorProjectProvider'
import { InspectorPanel } from './InspectorPanel'
import { STARTER_DOCUMENT_ID, STARTER_PROJECT_STRUCTURE, STARTER_SELECTED_NODE_ID } from './starter-project-structure'
import { INSPECTOR_SECTION_LABELS, INSPECTOR_SECTION_ORDER } from './inspector-schema-model'

function renderInspector() {
  const store = new ProjectStructureRenderStore(STARTER_PROJECT_STRUCTURE)
  const unchanged = () => Promise.resolve(success(store.structure))
  const resetWidgetProperty = vi.fn(unchanged)
  const resetNodeVisualStyles = vi.fn(unchanged)
  const resetNodeDataSettings = vi.fn(unchanged)
  const updateNodeVisualStyles = vi.fn(unchanged)
  const updateNodeDataSettings = vi.fn(unchanged)
  const updateWidgetProperty = vi.fn<(_nodeId: NodeId, _key: string, _value: JsonValue) => Promise<Result<ProjectStructure, string>>>(unchanged)
  render(
    <EditorProjectProvider session={{
      createBreakpoint: () => Promise.resolve(success({ breakpointId: store.structure.breakpoints[0].id, structure: store.structure })),
      documentId: STARTER_DOCUMENT_ID,
      initialSelectedNodeId: STARTER_SELECTED_NODE_ID,
      insertWidget: () => Promise.resolve(success({ nodeId: STARTER_SELECTED_NODE_ID, structure: store.structure })),
      moveNodes: vi.fn<(_nodeIds: readonly NodeId[], _placement: NodePlacement) => Promise<ReturnType<typeof success<ProjectStructure>>>>(unchanged),
      reorderBreakpoint: unchanged,
      redo: unchanged,
      resetNodeVisualStyles,
      resetProjectTheme: unchanged,
      resetNodeBreakpointOverride: unchanged,
      resetNodeDataSettings,
      resetWidgetProperty,
      resizeNode: unchanged,
      store,
      undo: unchanged,
      updateNodeSpacing: unchanged,
      updateNodeDataSettings,
      updateBreakpoint: unchanged,
      updateNodeVisualStyles,
      updateProjectTheme: unchanged,
      updateWidgetProperty,
    }}>
      <InspectorPanel activeTab="properties" onTabChange={() => undefined} />
    </EditorProjectProvider>,
  )
  return { resetNodeDataSettings, resetNodeVisualStyles, resetWidgetProperty, updateNodeDataSettings, updateNodeVisualStyles, updateWidgetProperty }
}

describe('M07.1 inspector declarativo', () => {
  it('muestra las nueve secciones y abre la primera que tiene campos', () => {
    renderInspector()
    const generated = screen.getByTestId('generated-inspector-sections')
    for (const section of INSPECTOR_SECTION_ORDER) expect(within(generated).getByText(INSPECTOR_SECTION_LABELS[section])).toBeInTheDocument()
    const details = document.querySelectorAll('[data-testid="generated-inspector-sections"] details')
    expect(details).toHaveLength(9)
    expect(details[2]).toHaveAttribute('open')
  })

  it('presenta descriptor, valor efectivo y control tipado conectado a la sesión', async () => {
    const { resetWidgetProperty, updateWidgetProperty } = renderInspector()
    expect(screen.getByText('Ancho máximo')).toBeInTheDocument()
    expect(screen.getByText('Número')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Ancho máximo: 1200' })).toHaveTextContent('1200')
    expect(screen.getByText('Personalizado')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'Ancho máximo Número' })
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveValue('1200')
    fireEvent.change(input, { target: { value: '960' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(updateWidgetProperty).toHaveBeenCalledWith(STARTER_SELECTED_NODE_ID, 'maxWidth', 960))
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    await waitFor(() => expect(resetWidgetProperty).toHaveBeenCalledWith(STARTER_SELECTED_NODE_ID, 'maxWidth'))
  })

  it('muestra el error de validación junto al campo y lo anuncia', async () => {
    const { updateWidgetProperty } = renderInspector()
    updateWidgetProperty.mockResolvedValueOnce(failure('El ancho máximo debe ser mayor que cero.'))
    fireEvent.change(screen.getByRole('textbox', { name: 'Ancho máximo Número' }), { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El ancho máximo debe ser mayor que cero.')
  })

  it('edita estilos canónicos y rechaza CSS inseguro antes de llamar a la sesión', async () => {
    const { updateNodeVisualStyles } = renderInspector()
    const declarations = screen.getByRole('textbox', { name: 'Declaraciones seguras (JSON)' })
    fireEvent.change(declarations, { target: { value: '{"backgroundColor":"url(javascript:alert(1))"}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar estilos' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no es seguro')
    expect(updateNodeVisualStyles).not.toHaveBeenCalled()

    fireEvent.change(declarations, { target: { value: '{"borderRadius":{"$token":"radius.md"},"color":"#111827"}' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Clases' }), { target: { value: 'card featured' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar estilos' }))
    await waitFor(() => expect(updateNodeVisualStyles).toHaveBeenCalledWith(STARTER_SELECTED_NODE_ID, {
      $classes: ['card', 'featured'],
      borderRadius: { $token: 'radius.md' },
      color: '#111827',
    }))
  })

  it('valida y aplica bindings, condiciones y atributos ARIA en una sola mutación', async () => {
    const { updateNodeDataSettings } = renderInspector()
    fireEvent.change(screen.getByRole('textbox', { name: 'Bindings' }), { target: { value: '{"maxWidth":{"kind":"literal","value":960}}' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Condiciones de visibilidad' }), { target: { value: '[{"operator":"all","negate":false,"predicates":[{"source":{"kind":"literal","value":true},"operator":"equals","value":true}]}]' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Accesibilidad ARIA' }), { target: { value: '{"label":"Contenido principal","role":"region","tabIndex":0}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar datos' }))
    await waitFor(() => expect(updateNodeDataSettings).toHaveBeenCalledWith(STARTER_SELECTED_NODE_ID, {
      accessibility: { label: 'Contenido principal', role: 'region', tabIndex: 0 },
      bindings: { maxWidth: { kind: 'literal', value: 960 } },
      conditions: [{ negate: false, operator: 'all', predicates: [{ operator: 'equals', source: { kind: 'literal', value: true }, value: true }] }],
    }))
  })

  it('rechaza JSON inválido junto al control sin llamar a la sesión', async () => {
    const { updateNodeDataSettings } = renderInspector()
    fireEvent.change(screen.getByRole('textbox', { name: 'Bindings' }), { target: { value: '{' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar datos' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bindings debe contener JSON válido')
    expect(updateNodeDataSettings).not.toHaveBeenCalled()
  })
})
