import { useMemo, useState } from 'react'
import { Icon } from '../primitives'
import { layerItems, widgets } from './editor-data'

export type LibraryTab = 'widgets' | 'layers'

interface LibraryPanelProps {
  readonly activeTab: LibraryTab
  readonly onTabChange: (tab: LibraryTab) => void
  readonly className?: string
}

const pages = [
  { label: 'Inicio', icon: 'editor' as const },
  { label: 'Artículos', icon: 'content' as const },
  { label: 'Acerca de', icon: 'users' as const },
  { label: 'Contacto', icon: 'form' as const },
] as const

type PageLabel = (typeof pages)[number]['label']
type LayerId = (typeof layerItems)[number]['id']

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const [activePage, setActivePage] = useState<PageLabel>('Inicio')
  const [activeLayer, setActiveLayer] = useState<LayerId>('hero-content')
  const filteredWidgets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return normalizedQuery ? widgets.filter((widget) => widget.label.toLocaleLowerCase('es').includes(normalizedQuery)) : widgets
  }, [query])

  return (
    <aside aria-label="Biblioteca y capas" className={`library-panel flex min-h-0 flex-col border-r border-border bg-surface ${className}`}>
      <div className="grid shrink-0 grid-cols-2 border-b border-border bg-muted/60 p-1.5 lg:p-1" role="tablist" aria-label="Panel izquierdo">
        <button aria-controls="library-panel-layers" aria-selected={activeTab === 'layers'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors active:bg-primary/15 lg:min-h-9 ${activeTab === 'layers' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} id="library-tab-layers" onClick={() => onTabChange('layers')} role="tab" type="button"><Icon name="layers" size={14} />Páginas</button>
        <button aria-controls="library-panel-widgets" aria-selected={activeTab === 'widgets'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors active:bg-primary/15 lg:min-h-9 ${activeTab === 'widgets' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} id="library-tab-widgets" onClick={() => onTabChange('widgets')} role="tab" type="button"><Icon name="plus" size={14} />Componentes</button>
      </div>

      {activeTab === 'widgets' ? (
        <div aria-labelledby="library-tab-widgets" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-1.5" id="library-panel-widgets" role="tabpanel">
          <div className="mb-2 flex items-center justify-between lg:mb-1.5"><div><p className="text-xs font-bold leading-4 text-primary">Componentes</p><p className="text-xs leading-4 text-muted-foreground">Biblioteca visual del proyecto</p></div><button aria-label="Crear componente, planificado" className="grid size-11 cursor-not-allowed place-items-center rounded-md text-muted-foreground opacity-50 lg:size-9" data-tooltip="Crear componente · planificado" disabled type="button"><Icon name="plus" size={14} /></button></div>
          <label className="relative block">
            <span className="sr-only">Buscar elementos</span>
            <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground lg:left-2.5" name="search" size={16} />
            <input aria-describedby="widget-search-status" className="min-h-11 w-full rounded-md border border-primary/30 bg-surface pl-9 pr-9 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar elementos" type="search" value={query} />
            {query ? <button aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" data-tooltip="Limpiar búsqueda" onClick={() => setQuery('')} type="button"><Icon name="close" size={12} /></button> : null}
          </label>
          <p aria-live="polite" className="sr-only" id="widget-search-status">{query ? `${filteredWidgets.length} componentes encontrados` : `${widgets.length} componentes disponibles`}</p>
          {filteredWidgets.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-1.5 lg:mt-1.5">
              {filteredWidgets.map((widget) => (
                <button aria-label={`${widget.label}, inserción planificada`} className="semantic-option group min-h-20 cursor-not-allowed rounded border p-1.5 text-left opacity-75 lg:min-h-16" data-tooltip="Inserción disponible en una fase posterior" disabled key={widget.label} type="button">
                  <span className="grid size-8 place-items-center rounded-md bg-[color-mix(in_srgb,var(--option-accent)_18%,var(--color-surface))] text-[var(--option-accent)] shadow-sm"><Icon name={widget.icon} size={14} /></span>
                  <span className="mt-1 block text-xs font-semibold leading-4">{widget.label}</span>
                  <span className="block text-xs text-muted-foreground">{widget.category}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="widget-empty-state mt-2 grid place-items-center rounded-md border border-dashed border-border px-2 py-5 text-center">
              <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground"><Icon name="search" size={14} /></span>
              <p className="mt-2 text-xs font-semibold text-foreground">Sin resultados</p>
              <p className="mt-0.5 max-w-40 text-xs leading-4 text-muted-foreground">No encontramos componentes para “{query.trim()}”.</p>
              <button className="mt-2 min-h-9 cursor-pointer rounded-md border border-border bg-surface px-2 text-xs font-semibold text-primary-strong hover:bg-primary-soft" onClick={() => setQuery('')} type="button">Limpiar filtro</button>
            </div>
          )}
        </div>
      ) : (
        <div aria-labelledby="library-tab-layers" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="library-panel-layers" role="tabpanel">
          <section className="border-b border-border p-1.5 lg:p-1" aria-labelledby="pages-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-9"><h2 className="text-xs font-bold text-primary" id="pages-title">Páginas <span className="font-normal text-muted-foreground">· 4</span></h2><button aria-label="Añadir página, planificado" className="grid size-11 cursor-not-allowed place-items-center rounded text-muted-foreground opacity-50 lg:size-9" data-tooltip="Añadir página · planificado" disabled type="button"><Icon name="plus" size={14} /></button></div>
            <ul className="grid gap-0.5">
              {pages.map((page) => {
                const selected = page.label === activePage
                return (
                  <li key={page.label}>
                    <button aria-current={selected ? 'page' : undefined} className={`semantic-option page-option flex min-h-11 w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-left text-xs transition-[background-color,color,box-shadow] active:bg-primary/15 focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected ? 'page-option--selected font-bold text-primary-strong' : 'text-foreground'}`} data-selected={selected ? 'true' : 'false'} onClick={() => setActivePage(page.label)} type="button"><Icon className={selected ? 'text-primary-strong' : 'text-primary'} name={page.icon} size={14} /><span className="flex-1 truncate">{page.label}</span>{selected ? <Icon className="text-primary" name="check" size={13} /> : null}</button>
                  </li>
                )
              })}
            </ul>
          </section>
          <section className="p-1.5 lg:p-1" aria-labelledby="layers-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-9"><h2 className="flex items-center gap-1 text-xs font-bold text-primary" id="layers-title"><Icon name="layers" size={13} />Árbol de widgets</h2><button aria-label="Opciones de capas, planificado" className="grid size-11 cursor-not-allowed place-items-center rounded text-muted-foreground opacity-50 lg:size-9" data-tooltip="Opciones de capas · planificado" disabled type="button"><Icon name="more" size={14} /></button></div>
            <ul aria-label="Árbol de capas" role="tree">
              {layerItems.map((layer) => {
                const selected = layer.id === activeLayer
                return (
                  <li aria-level={layer.depth + 1} aria-selected={selected} key={layer.id} role="treeitem">
                    <button className={`layer-option flex min-h-11 w-full cursor-pointer items-center gap-1.5 rounded-md pr-1.5 text-left text-xs transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected ? 'layer-option--selected bg-primary-soft font-semibold text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-selected={selected ? 'true' : 'false'} onClick={() => setActiveLayer(layer.id)} style={{ paddingLeft: `${6 + layer.depth * 10}px` }} type="button">
                      <span className="h-3 border-l border-border" aria-hidden="true" /><Icon name={layer.icon} size={14} /><span className="truncate">{layer.label}</span>{selected ? <Icon className="ml-auto text-primary" name="check" size={13} /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
    </aside>
  )
}
