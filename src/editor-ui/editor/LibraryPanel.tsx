import { useMemo, useState } from 'react'
import { createCompleteWidgetRegistry, type WidgetCategory } from '../../domain'
import { Icon, type IconName } from '../primitives'
import { CanonicalLayerTree } from './CanonicalLayerTree'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

export type LibraryTab = 'widgets' | 'layers'

interface LibraryPanelProps {
  readonly activeTab: LibraryTab
  readonly onTabChange: (tab: LibraryTab) => void
  readonly className?: string
}

const widgetDefinitions = createCompleteWidgetRegistry().list()

const categoryLabels: Record<WidgetCategory, string> = {
  structure: 'Estructura',
  basic: 'Básicos',
  content: 'Contenido',
  dynamic: 'Dinámicos',
  commerce: 'Comercio',
  forms: 'Formularios',
  filters: 'Filtros',
}

const categoryIcons: Record<WidgetCategory, IconName> = {
  structure: 'columns',
  basic: 'text',
  content: 'content',
  dynamic: 'code',
  commerce: 'button',
  forms: 'form',
  filters: 'search',
}

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const [query, setQuery] = useState('')
  const document = structure.documents[session.documentId]
  const filteredWidgets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    if (!normalizedQuery) return widgetDefinitions
    return widgetDefinitions.filter((widget) => `${widget.label} ${widget.description} ${widget.id} ${categoryLabels[widget.category]}`.toLocaleLowerCase('es').includes(normalizedQuery))
  }, [query])

  return (
    <aside aria-label="Biblioteca y capas" className={`library-panel flex min-h-0 flex-col border-r border-border bg-surface ${className}`}>
      <div className="grid shrink-0 grid-cols-2 border-b border-border bg-muted/60 p-1.5 lg:p-1" role="tablist" aria-label="Panel izquierdo">
        <button aria-controls="library-panel-layers" aria-selected={activeTab === 'layers'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors active:bg-primary/15 lg:min-h-9 ${activeTab === 'layers' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} id="library-tab-layers" onClick={() => onTabChange('layers')} role="tab" type="button"><Icon name="layers" size={14} />Capas</button>
        <button aria-controls="library-panel-widgets" aria-selected={activeTab === 'widgets'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors active:bg-primary/15 lg:min-h-9 ${activeTab === 'widgets' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} id="library-tab-widgets" onClick={() => onTabChange('widgets')} role="tab" type="button"><Icon name="columns" size={14} />Widgets</button>
      </div>

      {activeTab === 'widgets' ? (
        <div aria-labelledby="library-tab-widgets" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-1.5" id="library-panel-widgets" role="tabpanel">
          <div className="mb-2 lg:mb-1.5">
            <p className="text-xs font-bold leading-4 text-primary">Registro disponible</p>
            <p className="text-xs leading-4 text-muted-foreground">{widgetDefinitions.length} widgets con definición y renderer</p>
          </div>
          <label className="relative block">
            <span className="sr-only">Buscar widgets registrados</span>
            <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground lg:left-2.5" name="search" size={16} />
            <input aria-describedby="widget-search-status" className="min-h-11 w-full rounded-md border border-primary/30 bg-surface pl-9 pr-9 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, categoría o ID" type="search" value={query} />
            {query ? <button aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setQuery('')} type="button"><Icon name="close" size={12} /></button> : null}
          </label>
          <p aria-live="polite" className="sr-only" id="widget-search-status">{filteredWidgets.length} widgets encontrados</p>
          {filteredWidgets.length > 0 ? (
            <ul className="mt-2 grid gap-1.5 lg:mt-1.5">
              {filteredWidgets.map((widget) => (
                <li className="semantic-option rounded-md border border-border bg-surface p-1.5" key={widget.id}>
                  <div className="flex min-w-0 items-start gap-1.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name={categoryIcons[widget.category]} size={14} /></span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-foreground">{widget.label}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{categoryLabels[widget.category]} · {widget.id}</span></span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[0.625rem] leading-4 text-muted-foreground">{widget.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="widget-empty-state mt-2 grid place-items-center rounded-md border border-dashed border-border px-2 py-5 text-center">
              <Icon className="text-muted-foreground" name="search" size={18} />
              <p className="mt-2 text-xs font-semibold text-foreground">Sin resultados</p>
              <button className="mt-2 min-h-9 cursor-pointer rounded-md border border-border bg-surface px-2 text-xs font-semibold text-primary-strong hover:bg-primary-soft" onClick={() => setQuery('')} type="button">Limpiar filtro</button>
            </div>
          )}
        </div>
      ) : (
        <div aria-labelledby="library-tab-layers" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="library-panel-layers" role="tabpanel">
          <section className="border-b border-border p-2 lg:p-1.5" aria-labelledby="document-title">
            <h2 className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground" id="document-title">Documento actual</h2>
            <div className="mt-1 flex min-h-9 items-center gap-1.5 rounded-md bg-primary-soft px-2 text-xs font-semibold text-primary-strong"><Icon name="editor" size={14} /><span className="truncate">{document?.name ?? 'Documento no disponible'}</span></div>
          </section>
          <section className="p-1.5 lg:p-1" aria-labelledby="layers-title">
            <h2 className="flex min-h-9 items-center gap-1 px-1 text-xs font-bold text-primary" id="layers-title"><Icon name="layers" size={13} />Árbol canónico</h2>
            <CanonicalLayerTree />
          </section>
        </div>
      )}
    </aside>
  )
}
