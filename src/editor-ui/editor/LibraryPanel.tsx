import { useMemo, useState } from 'react'
import { Icon } from '../primitives'
import { layerItems, widgets } from './editor-data'

export type LibraryTab = 'widgets' | 'layers'

interface LibraryPanelProps {
  readonly activeTab: LibraryTab
  readonly onTabChange: (tab: LibraryTab) => void
  readonly className?: string
}

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const filteredWidgets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return normalizedQuery ? widgets.filter((widget) => widget.label.toLocaleLowerCase('es').includes(normalizedQuery)) : widgets
  }, [query])

  return (
    <aside aria-label="Biblioteca y capas" className={`min-h-0 border-r border-border bg-surface ${className}`}>
      <div className="grid grid-cols-2 border-b border-border p-2" role="tablist" aria-label="Panel izquierdo">
        <button aria-selected={activeTab === 'widgets'} className={`min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors ${activeTab === 'widgets' ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => onTabChange('widgets')} role="tab" type="button"><span className="inline-flex items-center gap-2"><Icon name="plus" size={16} />Elementos</span></button>
        <button aria-selected={activeTab === 'layers'} className={`min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors ${activeTab === 'layers' ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => onTabChange('layers')} role="tab" type="button"><span className="inline-flex items-center gap-2"><Icon name="layers" size={16} />Capas</span></button>
      </div>

      {activeTab === 'widgets' ? (
        <div className="h-full overflow-y-auto p-3" role="tabpanel">
          <label className="relative block">
            <span className="sr-only">Buscar elementos</span>
            <Icon className="pointer-events-none absolute left-3 top-3 text-muted-foreground" name="search" size={20} />
            <input className="min-h-11 w-full rounded-lg border border-border bg-canvas pl-10 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar elementos" type="search" value={query} />
          </label>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Arrastra o selecciona para insertar</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {filteredWidgets.map((widget) => (
              <button className="group min-h-24 cursor-pointer rounded-xl border border-border bg-canvas p-3 text-left transition-[border-color,background-color,box-shadow] hover:border-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus" key={widget.label} type="button">
                <span className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-primary shadow-sm transition-colors group-hover:border-primary/40"><Icon name={widget.icon} size={20} /></span>
                <span className="mt-2 block text-sm font-semibold">{widget.label}</span>
                <span className="block text-[0.6875rem] text-muted-foreground">{widget.category}</span>
              </button>
            ))}
          </div>
          {filteredWidgets.length === 0 ? <p className="mt-6 text-center text-sm text-muted-foreground">No hay elementos con ese nombre.</p> : null}
        </div>
      ) : (
        <div className="h-full overflow-y-auto p-2" role="tabpanel">
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Estructura</p>
            <button aria-label="Opciones de capas" className="grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-muted" type="button"><Icon name="more" size={20} /></button>
          </div>
          <ul aria-label="Árbol de capas" role="tree">
            {layerItems.map((layer) => (
              <li aria-level={layer.depth + 1} key={layer.id} role="treeitem">
                <button className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg pr-2 text-left text-sm transition-colors hover:bg-muted ${layer.id === 'hero-content' ? 'bg-primary-soft font-semibold text-primary-strong' : ''}`} style={{ paddingLeft: `${8 + layer.depth * 16}px` }} type="button">
                  <Icon name={layer.icon} size={16} />
                  <span className="truncate">{layer.label}</span>
                  {layer.id === 'hero-content' ? <Icon className="ml-auto" name="eye" size={16} /> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
