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

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const filteredWidgets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return normalizedQuery ? widgets.filter((widget) => widget.label.toLocaleLowerCase('es').includes(normalizedQuery)) : widgets
  }, [query])

  return (
    <aside aria-label="Biblioteca y capas" className={`library-panel flex min-h-0 flex-col border-r border-border bg-surface ${className}`}>
      <div className="grid shrink-0 grid-cols-2 border-b border-border bg-muted/60 p-1.5 lg:p-1" role="tablist" aria-label="Panel izquierdo">
        <button aria-controls="library-panel-layers" aria-selected={activeTab === 'layers'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors active:bg-primary/15 lg:min-h-8 ${activeTab === 'layers' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} id="library-tab-layers" onClick={() => onTabChange('layers')} role="tab" type="button"><Icon name="layers" size={13} />Páginas</button>
        <button aria-controls="library-panel-widgets" aria-selected={activeTab === 'widgets'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors active:bg-primary/15 lg:min-h-8 ${activeTab === 'widgets' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} id="library-tab-widgets" onClick={() => onTabChange('widgets')} role="tab" type="button"><Icon name="plus" size={13} />Componentes</button>
      </div>

      {activeTab === 'widgets' ? (
        <div aria-labelledby="library-tab-widgets" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-1.5" id="library-panel-widgets" role="tabpanel">
          <div className="mb-2 flex items-center justify-between lg:mb-1"><div><p className="text-xs font-bold leading-4 text-primary">Componentes</p><p className="text-xs leading-4 text-muted-foreground">Selecciona para insertar</p></div><button aria-label="Crear componente" className="grid size-11 cursor-pointer place-items-center rounded-md text-primary hover:bg-primary-soft lg:size-8" data-tooltip="Crear componente" type="button"><Icon name="plus" size={14} /></button></div>
          <label className="relative block">
            <span className="sr-only">Buscar elementos</span>
            <Icon className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground lg:left-2 lg:top-2" name="search" size={16} />
            <input aria-describedby="widget-search-status" className="min-h-11 w-full rounded-md border border-primary/30 bg-surface pl-9 pr-8 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 lg:pl-7" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar elementos" type="search" value={query} />
            {query ? <button aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted-foreground hover:text-foreground" data-tooltip="Limpiar búsqueda" onClick={() => setQuery('')} type="button"><Icon name="close" size={12} /></button> : null}
          </label>
          <p aria-live="polite" className="sr-only" id="widget-search-status">{query ? `${filteredWidgets.length} componentes encontrados` : `${widgets.length} componentes disponibles`}</p>
          {filteredWidgets.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-1 lg:mt-1.5">
              {filteredWidgets.map((widget) => (
                <button className="semantic-option group min-h-20 cursor-pointer rounded border p-1.5 text-left transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-focus lg:min-h-14 lg:p-1" key={widget.label} type="button">
                  <span className="grid size-7 place-items-center rounded-sm bg-[color-mix(in_srgb,var(--option-accent)_18%,var(--color-surface))] text-[var(--option-accent)] shadow-sm lg:size-6"><Icon name={widget.icon} size={13} /></span>
                  <span className="mt-0.5 block text-xs font-semibold leading-4">{widget.label}</span>
                  <span className="block text-xs text-muted-foreground">{widget.category}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="widget-empty-state mt-2 grid place-items-center rounded-md border border-dashed border-border px-2 py-5 text-center">
              <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground"><Icon name="search" size={14} /></span>
              <p className="mt-2 text-xs font-semibold text-foreground">Sin resultados</p>
              <p className="mt-0.5 max-w-40 text-xs leading-4 text-muted-foreground">No encontramos componentes para “{query.trim()}”.</p>
              <button className="mt-2 min-h-8 rounded-md border border-border bg-surface px-2 text-xs font-semibold text-primary-strong hover:bg-primary-soft" onClick={() => setQuery('')} type="button">Limpiar filtro</button>
            </div>
          )}
        </div>
      ) : (
        <div aria-labelledby="library-tab-layers" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="library-panel-layers" role="tabpanel">
          <section className="border-b border-border p-1.5 lg:p-1" aria-labelledby="pages-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-8"><h2 className="text-xs font-bold text-primary" id="pages-title">Páginas <span className="font-normal text-muted-foreground">· 4</span></h2><button aria-label="Añadir página" className="grid size-11 cursor-pointer place-items-center rounded text-primary hover:bg-primary-soft lg:size-8" data-tooltip="Añadir página" type="button"><Icon name="plus" size={14} /></button></div>
            <ul className="grid gap-px">
              {pages.map((page) => <li key={page.label}><button aria-current={page.label === 'Inicio' ? 'page' : undefined} className={`semantic-option flex min-h-11 w-full cursor-pointer items-center gap-1 rounded px-1 text-left text-xs transition-colors active:bg-primary/15 lg:min-h-8 ${page.label === 'Inicio' ? 'font-bold' : ''}`} type="button"><Icon className="text-primary" name={page.icon} size={13} /><span className="flex-1 text-foreground">{page.label}</span><Icon className="text-primary" name="more" size={12} /></button></li>)}
            </ul>
          </section>
          <section className="p-1.5 lg:p-1" aria-labelledby="layers-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-8"><h2 className="flex items-center gap-1 text-xs font-bold text-primary" id="layers-title"><Icon name="layers" size={12} />Árbol de widgets</h2><button aria-label="Opciones de capas" className="grid size-11 cursor-pointer place-items-center rounded text-primary hover:bg-primary-soft lg:size-8" data-tooltip="Opciones de capas" type="button"><Icon name="more" size={14} /></button></div>
            <ul aria-label="Árbol de capas" role="tree">
              {layerItems.map((layer) => (
                <li aria-level={layer.depth + 1} aria-selected={layer.id === 'hero-content'} key={layer.id} role="treeitem">
                  <button className={`flex min-h-11 w-full cursor-pointer items-center gap-1 rounded pr-1 text-left text-xs transition-colors hover:bg-primary-soft lg:min-h-8 ${layer.id === 'hero-content' ? 'bg-primary-soft font-semibold text-primary-strong' : 'text-muted-foreground'}`} style={{ paddingLeft: `${4 + layer.depth * 9}px` }} type="button">
                    <span className="h-3 border-l border-border" aria-hidden="true" /><Icon name={layer.icon} size={14} /><span className="truncate">{layer.label}</span>{layer.id === 'hero-content' ? <Icon className="ml-auto" name="eye" size={14} /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </aside>
  )
}
