import { useMemo, useState } from 'react'
import { Icon } from '../primitives'
import { layerItems, widgets } from './editor-data'

export type LibraryTab = 'widgets' | 'layers'

interface LibraryPanelProps {
  readonly activeTab: LibraryTab
  readonly onTabChange: (tab: LibraryTab) => void
  readonly className?: string
}

const pages = ['Inicio', 'Artículos', 'Acerca de', 'Contacto'] as const

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const filteredWidgets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return normalizedQuery ? widgets.filter((widget) => widget.label.toLocaleLowerCase('es').includes(normalizedQuery)) : widgets
  }, [query])

  return (
    <aside aria-label="Biblioteca y capas" className={`min-h-0 border-r border-border bg-surface ${className}`}>
      <div className="grid grid-cols-2 border-b border-border bg-muted/60 p-2 lg:p-1.5" role="tablist" aria-label="Panel izquierdo">
        <button aria-selected={activeTab === 'layers'} className={`min-h-11 cursor-pointer rounded-md px-2 text-xs font-bold transition-colors lg:min-h-9 ${activeTab === 'layers' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => onTabChange('layers')} role="tab" type="button">Páginas</button>
        <button aria-selected={activeTab === 'widgets'} className={`min-h-11 cursor-pointer rounded-md px-2 text-xs font-bold transition-colors lg:min-h-9 ${activeTab === 'widgets' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => onTabChange('widgets')} role="tab" type="button">Componentes</button>
      </div>

      {activeTab === 'widgets' ? (
        <div className="h-full overflow-y-auto p-3 lg:p-2" role="tabpanel">
          <div className="mb-3 flex items-center justify-between lg:mb-2"><div><p className="text-xs font-bold">Componentes</p><p className="text-[0.6875rem] text-muted-foreground">Selecciona para insertar</p></div><button aria-label="Crear componente" className="grid size-11 cursor-pointer place-items-center rounded-lg text-primary hover:bg-primary-soft lg:size-9" type="button"><Icon name="plus" size={18} /></button></div>
          <label className="relative block">
            <span className="sr-only">Buscar elementos</span>
            <Icon className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" name="search" size={18} />
            <input className="min-h-11 w-full rounded-lg border border-border bg-canvas pl-10 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:text-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar elementos" type="search" value={query} />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {filteredWidgets.map((widget) => (
              <button className="group min-h-20 cursor-pointer rounded-lg border border-border bg-canvas p-2.5 text-left transition-[border-color,background-color,box-shadow] hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus lg:min-h-16 lg:p-2" key={widget.label} type="button">
                <span className="grid size-8 place-items-center rounded-md border border-border bg-surface text-primary shadow-sm"><Icon name={widget.icon} size={18} /></span>
                <span className="mt-2 block text-xs font-semibold">{widget.label}</span>
                <span className="block text-[0.625rem] text-muted-foreground">{widget.category}</span>
              </button>
            ))}
          </div>
          {filteredWidgets.length === 0 ? <p className="mt-6 text-center text-sm text-muted-foreground">No hay elementos con ese nombre.</p> : null}
        </div>
      ) : (
        <div className="h-full overflow-y-auto" role="tabpanel">
          <section className="border-b border-border p-2" aria-labelledby="pages-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-9"><h2 className="text-sm font-bold lg:text-xs" id="pages-title">Páginas <span className="font-normal text-muted-foreground">· 4</span></h2><button aria-label="Añadir página" className="grid size-11 cursor-pointer place-items-center rounded-md text-primary hover:bg-primary-soft lg:size-9" type="button"><Icon name="plus" size={18} /></button></div>
            <ul className="mt-1 grid gap-0.5">
              {pages.map((page) => <li key={page}><button className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors hover:bg-muted lg:min-h-9 ${page === 'Inicio' ? 'bg-primary-soft font-bold text-primary-strong' : 'text-muted-foreground'}`} type="button"><Icon name="editor" size={16} /><span className="flex-1">{page}</span><Icon name="more" size={16} /></button></li>)}
            </ul>
          </section>
          <section className="p-2" aria-labelledby="layers-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-9"><h2 className="text-sm font-bold lg:text-xs" id="layers-title">Árbol de widgets</h2><button aria-label="Opciones de capas" className="grid size-11 cursor-pointer place-items-center rounded-md hover:bg-muted lg:size-9" type="button"><Icon name="more" size={18} /></button></div>
            <ul aria-label="Árbol de capas" className="mt-1" role="tree">
              {layerItems.map((layer) => (
                <li aria-level={layer.depth + 1} key={layer.id} role="treeitem">
                  <button className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md pr-2 text-left text-xs transition-colors hover:bg-muted lg:min-h-9 ${layer.id === 'hero-content' ? 'bg-primary-soft font-semibold text-primary-strong' : 'text-muted-foreground'}`} style={{ paddingLeft: `${6 + layer.depth * 12}px` }} type="button">
                    <span className="h-4 border-l border-border" aria-hidden="true" /><Icon name={layer.icon} size={16} /><span className="truncate">{layer.label}</span>{layer.id === 'hero-content' ? <Icon className="ml-auto" name="eye" size={16} /> : null}
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
