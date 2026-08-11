import type { KeyboardEvent, PointerEvent } from 'react'
import { Icon } from '../primitives'

interface AppNavigationProps {
  readonly expanded: boolean
  readonly width: number
  readonly onToggleExpanded: () => void
  readonly onResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  readonly onResizeKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function AppNavigation({ expanded, width, onToggleExpanded, onResizePointerDown, onResizeKeyDown }: AppNavigationProps) {
  return (
    <nav aria-label="Navegación principal" className="app-navigation relative hidden min-h-0 border-r border-border bg-surface md:block">
      <div className="flex h-full min-h-0 flex-col overflow-hidden py-1">
        <div className={`builder-rail-head flex h-12 shrink-0 items-center px-1 lg:h-9 ${expanded ? 'justify-between' : 'justify-center'}`}>
          {expanded ? <span className="truncate px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Espacio de trabajo</span> : null}
          <button aria-label={expanded ? 'Contraer menú lateral' : 'Expandir menú lateral'} aria-pressed={expanded} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:size-8" onClick={onToggleExpanded} type="button"><Icon name="panel-left" size={14} /></button>
        </div>

        <div className="px-1 pt-1">
          <div aria-current="page" aria-label="Editor" className={`nav-option relative flex min-h-11 items-center rounded-md bg-primary-soft px-1 text-xs text-primary-strong lg:min-h-9 ${expanded ? 'justify-start gap-1.5' : 'justify-center'}`} data-active="true" data-navigation-section="editor">
            <span className="nav-accent-icon grid size-8 shrink-0 place-items-center rounded-md"><Icon name="editor" size={15} /></span>
            {expanded ? <span className="truncate text-xs font-semibold">Editor</span> : <span className="sr-only">Editor</span>}
          </div>
        </div>

        <div className={`mt-auto flex min-h-10 items-center border-t border-border px-1.5 text-[0.625rem] text-muted-foreground ${expanded ? 'gap-1.5' : 'justify-center'}`}>
          <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          {expanded ? <span>Proyecto local</span> : <span className="sr-only">Proyecto local disponible</span>}
        </div>
      </div>
      <button aria-label="Redimensionar menú lateral" aria-orientation="vertical" aria-valuemax={168} aria-valuemin={44} aria-valuenow={width} className="group absolute -right-3 inset-y-0 z-30 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={onResizeKeyDown} onPointerDown={onResizePointerDown} role="separator" title="Arrastrar o usar flechas; Inicio/Fin para límites" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
    </nav>
  )
}
