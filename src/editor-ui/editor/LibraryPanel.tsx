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
    <aside aria-label="Biblioteca y capas" className={`min-h-0 border-r border-border bg-surface ${className}`}>
      <div className="grid grid-cols-2 border-b border-border bg-muted/60 p-1.5 lg:p-1" role="tablist" aria-label="Panel izquierdo">
        <button aria-selected={activeTab === 'layers'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors lg:min-h-8 ${activeTab === 'layers' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} onClick={() => onTabChange('layers')} role="tab" type="button"><Icon name="layers" size={13} />Páginas</button>
        <button aria-selected={activeTab === 'widgets'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-xs font-bold text-primary transition-colors lg:min-h-8 ${activeTab === 'widgets' ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`} onClick={() => onTabChange('widgets')} role="tab" type="button"><Icon name="plus" size={13} />Componentes</button>
      </div>

      {activeTab === 'widgets' ? (
        <div className="h-full overflow-y-auto p-2 lg:p-1.5" role="tabpanel">
          <div className="mb-2 flex items-center justify-between lg:mb-1"><div><p className="text-xs font-bold leading-4 text-primary">Componentes</p><p className="text-xs leading-4 text-muted-foreground">Selecciona para insertar</p></div><button aria-label="Crear componente" className="grid size-11 cursor-pointer place-items-center rounded-md text-primary hover:bg-primary-soft lg:size-8" type="button"><Icon name="plus" size={14} /></button></div>
          <label className="relative block">
            <span className="sr-only">Buscar elementos</span>
            <Icon className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground lg:left-2 lg:top-2" name="search" size={16} />
            <input className="min-h-11 w-full rounded-md border border-primary/30 bg-surface pl-9 pr-2 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 lg:pl-7" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar elementos" type="search" value={query} />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-1 lg:mt-1.5">
            {filteredWidgets.map((widget) => (
              <button className="semantic-option group min-h-20 cursor-pointer rounded border p-1.5 text-left transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-focus lg:min-h-14 lg:p-1" key={widget.label} type="button">
                <span className="grid size-7 place-items-center rounded-sm bg-[color-mix(in_srgb,var(--option-accent)_18%,var(--color-surface))] text-[var(--option-accent)] shadow-sm lg:size-6"><Icon name={widget.icon} size={13} /></span>
                <span className="mt-0.5 block text-xs font-semibold leading-4">{widget.label}</span>
                <span className="block text-xs text-muted-foreground">{widget.category}</span>
              </button>
            ))}
          </div>
          {filteredWidgets.length === 0 ? <p className="mt-3 text-center text-xs text-muted-foreground">No hay elementos con ese nombre.</p> : null}
        </div>
      ) : (
        <div className="h-full overflow-y-auto" role="tabpanel">
          <section className="border-b border-border p-1.5 lg:p-1" aria-labelledby="pages-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-8"><h2 className="text-xs font-bold text-primary" id="pages-title">Páginas <span className="font-normal text-muted-foreground">· 4</span></h2><button aria-label="Añadir página" className="grid size-11 cursor-pointer place-items-center rounded text-primary hover:bg-primary-soft lg:size-8" type="button"><Icon name="plus" size={14} /></button></div>
            <ul className="grid gap-px">
              {pages.map((page) => <li key={page.label}><button className={`semantic-option flex min-h-11 w-full cursor-pointer items-center gap-1 rounded px-1 text-left text-xs transition-colors lg:min-h-8 ${page.label === 'Inicio' ? 'font-bold' : ''}`} type="button"><Icon className="text-primary" name={page.icon} size={13} /><span className="flex-1 text-foreground">{page.label}</span><Icon className="text-primary" name="more" size={12} /></button></li>)}
            </ul>
          </section>
          <section className="p-1.5 lg:p-1" aria-labelledby="layers-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-8"><h2 className="flex items-center gap-1 text-xs font-bold text-primary" id="layers-title"><Icon name="layers" size={12} />Árbol de widgets</h2><button aria-label="Opciones de capas" className="grid size-11 cursor-pointer place-items-center rounded text-primary hover:bg-primary-soft lg:size-8" type="button"><Icon name="more" size={14} /></button></div>
            <ul aria-label="Árbol de capas" role="tree">
              {layerItems.map((layer) => (
                <li aria-level={layer.depth + 1} key={layer.id} role="treeitem">
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
