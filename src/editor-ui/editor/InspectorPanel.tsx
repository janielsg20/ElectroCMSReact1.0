import { createCompleteWidgetRegistry } from '../../domain'
import { HelpTip, Icon } from '../primitives'
import { InspectorSchemaSections } from './InspectorSchemaSections'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId } from './editor-project-context'
import { DataConditionAccessibilityControl } from './DataConditionAccessibilityControl'

export type InspectorTab = 'properties'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

const widgetRegistry = createCompleteWidgetRegistry()

export function InspectorPanel({ className = '' }: InspectorPanelProps) {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const selectedNodeId = useEditorSelectedNodeId()
  const document = structure.documents[session.documentId]
  const node = selectedNodeId ? document?.nodes[selectedNodeId] : undefined
  const definition = node?.kind === 'widget' ? widgetRegistry.get(node.widgetType) : undefined
  const responsiveOverrides = node ? Object.keys(node.responsive).length : 0
  const persistedStyles = node ? Object.keys(node.styles).length : 0

  return (
    <aside aria-label="Inspector de propiedades" className={`inspector-panel flex min-h-0 flex-col border-l border-border bg-surface ${className}`}>
      <div className="shrink-0 border-b border-border px-2 py-2 lg:px-1.5 lg:py-1.5">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Elemento seleccionado</p>
        {node ? (
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name={node.kind === 'component-instance' ? 'columns' : 'settings'} size={14} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{node.name}</p>
              <p className="truncate text-[0.625rem] text-muted-foreground">{definition?.label ?? (node.kind === 'component-instance' ? 'Componente reutilizable' : 'Elemento visual')}</p>
            </div>
            <HelpTip description="Edita aquí el contenido, diseño, estilo y comportamiento del elemento seleccionado. Solo se muestran las opciones que este elemento puede utilizar." example="Selecciona un botón para cambiar su texto, tamaño, estilo y comportamiento responsive." label="Inspector" reference="Elementor — Panel de edición" />
          </div>
        ) : <p className="mt-1 text-xs text-muted-foreground">Selecciona un elemento del lienzo o desde Capas para editarlo aquí.</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-16 lg:pb-6">
        {node ? (
          <div>
            <section className="border-b border-border px-2 py-1.5 lg:px-1.5" aria-labelledby="node-state-title">
              <div className="flex items-center gap-1.5">
                <h2 className="min-w-0 flex-1 text-[0.625rem] font-bold text-muted-foreground" id="node-state-title">Estado del elemento</h2>
                <span className={`rounded px-1.5 py-0.5 text-[0.5625rem] font-semibold ${node.hidden ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'}`}>{node.hidden ? 'Oculto' : 'Visible'}</span>
                {node.locked ? <span className="rounded bg-muted px-1.5 py-0.5 text-[0.5625rem] font-semibold text-muted-foreground">Bloqueado</span> : null}
                {responsiveOverrides > 0 ? <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[0.5625rem] font-semibold text-primary-strong">{responsiveOverrides} responsive</span> : null}
                {persistedStyles > 0 ? <span className="rounded bg-muted px-1.5 py-0.5 text-[0.5625rem] font-semibold text-muted-foreground">{persistedStyles} estilos</span> : null}
              </div>
            </section>

            {definition ? <InspectorSchemaSections definition={definition} node={node} /> : (
              <section className="grid gap-2 p-2 lg:p-1.5" aria-labelledby="missing-inspector-title">
                <h2 className="text-xs font-bold" id="missing-inspector-title">Opciones no disponibles</h2>
                <p className="rounded-md border border-dashed border-border p-2 text-xs leading-4 text-muted-foreground">Este elemento no tiene opciones editables registradas todavía. Su contenido actual se conserva sin crear configuraciones ficticias.</p>
              </section>
            )}

            <DataConditionAccessibilityControl definition={definition} key={node.id} node={node} structure={structure} />

            <section className="border-t border-border px-2 py-2 lg:px-1.5">
              <p className="text-[0.625rem] leading-4 text-muted-foreground">Tus cambios quedan en el historial del editor para que puedas deshacerlos o rehacerlos. Tamaño y espaciado también pueden ajustarse directamente en el lienzo.</p>
            </section>
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center p-6 text-center"><div><Icon className="mx-auto text-muted-foreground" name="cursor" size={20} /><p className="mt-2 text-xs font-semibold">No hay elemento seleccionado</p><p className="mt-1 text-xs leading-4 text-muted-foreground">Selecciona algo en el lienzo o en Capas para ver únicamente las opciones que puedes modificar.</p></div></div>
        )}
      </div>
    </aside>
  )
}
