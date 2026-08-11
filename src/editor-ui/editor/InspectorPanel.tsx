import { createCompleteWidgetRegistry } from '../../domain'
import { Icon } from '../primitives'
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
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Selección actual</p>
        {node ? (
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-primary-soft text-primary"><Icon name={node.kind === 'component-instance' ? 'columns' : 'settings'} size={14} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-foreground">{node.name}</p><p className="truncate text-[0.625rem] text-muted-foreground">{node.kind === 'widget' ? node.widgetType : 'Instancia de componente'}</p></div>
          </div>
        ) : <p className="mt-1 text-xs text-muted-foreground">Selecciona una capa o un elemento del canvas.</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-16 lg:pb-6">
        {node ? (
          <div>
            <section className="grid gap-1.5 border-b border-border p-2 lg:p-1.5" aria-labelledby="node-state-title">
              <h2 className="flex items-center gap-1 text-xs font-bold" id="node-state-title"><Icon className="text-muted-foreground" name="eye" size={12} />Estado canónico</h2>
              <dl className="grid grid-cols-2 gap-1.5 text-[0.625rem]">
                <div className="rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Visible</dt><dd className="mt-0.5 font-semibold text-foreground">{node.hidden ? 'No' : 'Sí'}</dd></div>
                <div className="rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Bloqueado</dt><dd className="mt-0.5 font-semibold text-foreground">{node.locked ? 'Sí' : 'No'}</dd></div>
                <div className="rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Responsive</dt><dd className="mt-0.5 font-semibold text-foreground">{responsiveOverrides}</dd></div>
                <div className="rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Estilos</dt><dd className="mt-0.5 font-semibold text-foreground">{persistedStyles}</dd></div>
              </dl>
            </section>

            {definition ? <InspectorSchemaSections definition={definition} node={node} /> : (
              <section className="grid gap-2 p-2 lg:p-1.5" aria-labelledby="missing-inspector-title">
                <h2 className="text-xs font-bold" id="missing-inspector-title">Inspector no disponible</h2>
                <p className="rounded-md border border-dashed border-border p-2 text-xs leading-4 text-muted-foreground">La selección no tiene una definición de widget registrada; no se generan controles ni datos ficticios.</p>
              </section>
            )}

            <DataConditionAccessibilityControl key={node.id} node={node} structure={structure} />

            <section className="border-t border-border p-2 lg:p-1.5">
              <p className="rounded-md border border-primary/25 bg-primary-soft p-2 text-[0.625rem] leading-4 text-primary-strong">Propiedades y estilos se validan antes de crear una entrada reversible en el historial. Tamaño y espaciado continúan editándose desde el canvas.</p>
            </section>
          </div>
        ) : (
          <div className="grid place-items-center p-6 text-center"><Icon className="text-muted-foreground" name="cursor" size={20} /><p className="mt-2 text-xs font-semibold">Sin selección</p><p className="mt-1 text-xs leading-4 text-muted-foreground">El inspector se genera únicamente desde el schema del widget seleccionado.</p></div>
        )}
      </div>
    </aside>
  )
}
