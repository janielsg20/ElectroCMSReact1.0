import { Icon } from '../primitives'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId } from './editor-project-context'

export type InspectorTab = 'properties'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value || 'Vacío'
  return JSON.stringify(value)
}

export function InspectorPanel({ className = '' }: InspectorPanelProps) {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const selectedNodeId = useEditorSelectedNodeId()
  const document = structure.documents[session.documentId]
  const node = selectedNodeId ? document?.nodes[selectedNodeId] : undefined
  const propertyEntries = node ? Object.entries(node.properties) : []
  const styleEntries = node ? Object.entries(node.styles) : []
  const responsiveOverrides = node ? Object.keys(node.responsive).length : 0

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
          <div className="divide-y divide-border">
            <section className="grid gap-1.5 p-2 lg:p-1.5" aria-labelledby="node-state-title">
              <h2 className="flex items-center gap-1 text-xs font-bold" id="node-state-title"><Icon className="text-muted-foreground" name="eye" size={12} />Estado</h2>
              <dl className="grid grid-cols-2 gap-1.5 text-[0.625rem]">
                <div className="rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Visible</dt><dd className="mt-0.5 font-semibold text-foreground">{node.hidden ? 'No' : 'Sí'}</dd></div>
                <div className="rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Bloqueado</dt><dd className="mt-0.5 font-semibold text-foreground">{node.locked ? 'Sí' : 'No'}</dd></div>
                <div className="col-span-2 rounded-md border border-border bg-muted/35 p-1.5"><dt className="text-muted-foreground">Overrides responsive</dt><dd className="mt-0.5 font-semibold text-foreground">{responsiveOverrides}</dd></div>
              </dl>
            </section>

            <section className="grid gap-1.5 p-2 lg:p-1.5" aria-labelledby="node-properties-title">
              <h2 className="flex items-center gap-1 text-xs font-bold" id="node-properties-title"><Icon className="text-muted-foreground" name="code" size={12} />Propiedades canónicas</h2>
              {propertyEntries.length > 0 ? <dl className="grid gap-1">{propertyEntries.map(([key, value]) => <div className="rounded-md border border-border bg-surface px-2 py-1.5" key={key}><dt className="text-[0.625rem] font-semibold text-muted-foreground">{key}</dt><dd className="mt-0.5 break-words text-xs text-foreground">{displayValue(value)}</dd></div>)}</dl> : <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">Este nodo no tiene propiedades declaradas.</p>}
            </section>

            <section className="grid gap-1.5 p-2 lg:p-1.5" aria-labelledby="node-styles-title">
              <h2 className="flex items-center gap-1 text-xs font-bold" id="node-styles-title"><Icon className="text-muted-foreground" name="palette" size={12} />Estilos persistidos</h2>
              {styleEntries.length > 0 ? <dl className="grid gap-1">{styleEntries.map(([key, value]) => <div className="flex items-start justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-xs" key={key}><dt className="font-semibold text-muted-foreground">{key}</dt><dd className="break-words text-right text-foreground">{displayValue(value)}</dd></div>)}</dl> : <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">Sin estilos persistidos en el breakpoint base.</p>}
            </section>

            <section className="p-2 lg:p-1.5">
              <p className="rounded-md border border-primary/25 bg-primary-soft p-2 text-[0.625rem] leading-4 text-primary-strong">La edición de tamaño y espaciado está disponible desde el botón de geometría del canvas o el menú contextual del elemento.</p>
            </section>
          </div>
        ) : (
          <div className="grid place-items-center p-6 text-center"><Icon className="text-muted-foreground" name="cursor" size={20} /><p className="mt-2 text-xs font-semibold">Sin selección</p><p className="mt-1 text-xs leading-4 text-muted-foreground">El inspector muestra únicamente datos reales del nodo seleccionado.</p></div>
        )}
      </div>
    </aside>
  )
}
