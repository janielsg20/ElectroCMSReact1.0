import { useMemo, useState, type CSSProperties } from 'react'
import { Icon } from '../primitives'
import { layerItems, widgets } from './editor-data'

export type LibraryTab = 'widgets' | 'layers'

interface LibraryPanelProps {
  readonly activeTab: LibraryTab
  readonly onTabChange: (tab: LibraryTab) => void
  readonly className?: string
}

const pages = [
  { label: 'Inicio', icon: 'editor' as const, accent: 'var(--color-primary)' },
  { label: 'Artículos', icon: 'content' as const, accent: 'var(--color-accent-data)' },
  { label: 'Acerca de', icon: 'users' as const, accent: 'var(--color-accent-ai)' },
  { label: 'Contacto', icon: 'form' as const, accent: 'var(--color-accent-form)' },
] as const

const categoryAccents = {
  Estructura: 'var(--color-primary)',
  Básicos: 'var(--color-accent-data)',
  Dinámicos: 'var(--color-accent-ai)',
  Formularios: 'var(--color-accent-form)',
} as const

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const filteredWidgets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return normalizedQuery ? widgets.filter((widget) => widget.label.toLocaleLowerCase('es').includes(normalizedQuery)) : widgets
  }, [query])

  return (
    <aside aria-label="Biblioteca y capas" className={`min-h-0 border-r border-border bg-surface ${className}`}>
      <div className="grid grid-cols-2 border-b border-border bg-muted/60 p-1.5 lg:p-1" role="tablist" aria-label="Panel izquierdo">
        <button aria-selected={activeTab === 'layers'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-[0.6875rem] font-bold text-[var(--color-accent-data)] transition-colors lg:min-h-8 lg:text-[0.625rem] ${activeTab === 'layers' ? 'bg-[color-mix(in_srgb,var(--color-accent-data)_14%,var(--color-surface))] shadow-sm' : 'hover:bg-[color-mix(in_srgb,var(--color-accent-data)_9%,var(--color-surface))]'}`} onClick={() => onTabChange('layers')} role="tab" type="button"><Icon name="layers" size={13} />Páginas</button>
        <button aria-selected={activeTab === 'widgets'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-1 text-[0.6875rem] font-bold text-[var(--color-accent-form)] transition-colors lg:min-h-8 lg:text-[0.625rem] ${activeTab === 'widgets' ? 'bg-[color-mix(in_srgb,var(--color-accent-form)_14%,var(--color-surface))] shadow-sm' : 'hover:bg-[color-mix(in_srgb,var(--color-accent-form)_9%,var(--color-surface))]'}`} onClick={() => onTabChange('widgets')} role="tab" type="button"><Icon name="plus" size={13} />Componentes</button>
      </div>

      {activeTab === 'widgets' ? (
        <div className="h-full overflow-y-auto p-2 lg:p-1.5" role="tabpanel">
          <div className="mb-2 flex items-center justify-between lg:mb-1"><div><p className="text-[0.6875rem] font-bold leading-4 text-[var(--color-accent-form)] lg:text-[0.625rem]">Componentes</p><p className="text-[0.5625rem] leading-3 text-muted-foreground">Selecciona para insertar</p></div><button aria-label="Crear componente" className="grid size-11 cursor-pointer place-items-center rounded-md text-[var(--color-accent-form)] hover:bg-[color-mix(in_srgb,var(--color-accent-form)_12%,transparent)] lg:size-8" type="button"><Icon name="plus" size={14} /></button></div>
          <label className="relative block">
            <span className="sr-only">Buscar elementos</span>
            <Icon className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground lg:left-2 lg:top-2" name="search" size={16} />
            <input className="min-h-11 w-full rounded-md border border-[var(--color-accent-data)]/35 bg-[color-mix(in_srgb,var(--color-accent-data)_5%,var(--color-surface))] pl-9 pr-2 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 lg:pl-7 lg:text-[0.625rem]" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar elementos" type="search" value={query} />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-1 lg:mt-1.5">
            {filteredWidgets.map((widget) => (
              <button className="semantic-option group min-h-20 cursor-pointer rounded border p-1.5 text-left transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-focus lg:min-h-14 lg:p-1" key={widget.label} style={{ '--option-accent': categoryAccents[widget.category] } as CSSProperties} type="button">
                <span className="grid size-7 place-items-center rounded-sm bg-[color-mix(in_srgb,var(--option-accent)_18%,var(--color-surface))] text-[var(--option-accent)] shadow-sm lg:size-6"><Icon name={widget.icon} size={13} /></span>
                <span className="mt-0.5 block text-[0.6875rem] font-semibold leading-3 lg:text-[0.625rem]">{widget.label}</span>
                <span className="block text-[0.5625rem] text-[var(--option-accent)]">{widget.category}</span>
              </button>
            ))}
          </div>
          {filteredWidgets.length === 0 ? <p className="mt-3 text-center text-xs text-muted-foreground">No hay elementos con ese nombre.</p> : null}
        </div>
      ) : (
        <div className="h-full overflow-y-auto" role="tabpanel">
          <section className="border-b border-border p-1.5 lg:p-1" aria-labelledby="pages-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-8"><h2 className="text-[0.6875rem] font-bold text-[var(--color-accent-data)] lg:text-[0.625rem]" id="pages-title">Páginas <span className="font-normal text-muted-foreground">· 4</span></h2><button aria-label="Añadir página" className="grid size-11 cursor-pointer place-items-center rounded text-[var(--color-accent-data)] hover:bg-[color-mix(in_srgb,var(--color-accent-data)_12%,transparent)] lg:size-8" type="button"><Icon name="plus" size={14} /></button></div>
            <ul className="grid gap-px">
              {pages.map((page) => <li key={page.label}><button className={`semantic-option flex min-h-11 w-full cursor-pointer items-center gap-1 rounded px-1 text-left text-[0.6875rem] transition-colors lg:min-h-8 lg:text-[0.625rem] ${page.label === 'Inicio' ? 'font-bold' : ''}`} style={{ '--option-accent': page.accent } as CSSProperties} type="button"><Icon className="text-[var(--option-accent)]" name={page.icon} size={13} /><span className="flex-1 text-foreground">{page.label}</span><Icon className="text-[var(--option-accent)]" name="more" size={12} /></button></li>)}
            </ul>
          </section>
          <section className="p-1.5 lg:p-1" aria-labelledby="layers-title">
            <div className="flex min-h-11 items-center justify-between px-1 lg:min-h-8"><h2 className="flex items-center gap-1 text-[0.6875rem] font-bold text-[var(--color-accent-ai)] lg:text-[0.625rem]" id="layers-title"><Icon name="layers" size={12} />Árbol de widgets</h2><button aria-label="Opciones de capas" className="grid size-11 cursor-pointer place-items-center rounded text-[var(--color-accent-ai)] hover:bg-[color-mix(in_srgb,var(--color-accent-ai)_12%,transparent)] lg:size-8" type="button"><Icon name="more" size={14} /></button></div>
            <ul aria-label="Árbol de capas" role="tree">
              {layerItems.map((layer) => (
                <li aria-level={layer.depth + 1} key={layer.id} role="treeitem">
                  <button className={`flex min-h-11 w-full cursor-pointer items-center gap-1 rounded pr-1 text-left text-[0.6875rem] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-surface))] lg:min-h-8 lg:text-[0.625rem] ${layer.id === 'hero-content' ? 'bg-primary-soft font-semibold text-primary-strong' : 'text-muted-foreground'}`} style={{ paddingLeft: `${4 + layer.depth * 9}px` }} type="button">
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
