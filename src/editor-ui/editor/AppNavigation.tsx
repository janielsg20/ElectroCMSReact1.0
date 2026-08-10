import type { KeyboardEvent, PointerEvent } from 'react'
import { Icon } from '../primitives'
import { navigationItems, type DeliveryState, type NavigationGroup, type NavigationSectionId } from './editor-data'

interface AppNavigationProps {
  readonly activeSection: NavigationSectionId
  readonly expanded: boolean
  readonly width: number
  readonly onSectionChange: (section: NavigationSectionId) => void
  readonly onToggleExpanded: () => void
  readonly onResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  readonly onResizeKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

const groups: readonly NavigationGroup[] = ['Construir', 'Datos', 'Operación', 'Publicar']

const stateLabel: Record<DeliveryState, string> = {
  active: 'Activo',
  development: 'En desarrollo',
  planned: 'Próxima fase',
}

function stateDotClass(state: DeliveryState): string {
  if (state === 'active') return 'bg-success'
  if (state === 'development') return 'bg-warning'
  return 'bg-muted-foreground/45'
}

export function AppNavigation({ activeSection, expanded, width, onSectionChange, onToggleExpanded, onResizePointerDown, onResizeKeyDown }: AppNavigationProps) {
  return (
    <nav aria-label="Navegación principal" className="app-navigation relative hidden min-h-0 border-r border-border bg-surface md:block">
      <div className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className={`builder-rail-head flex h-12 shrink-0 items-center lg:h-7 lg:px-1 ${expanded ? 'justify-between' : 'justify-center'}`}>
          {expanded ? <span className="truncate text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Producto</span> : null}
          <button aria-label={expanded ? 'Contraer menú lateral' : 'Expandir menú lateral'} aria-pressed={expanded} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:size-6" data-tooltip={expanded ? 'Contraer navegación' : 'Expandir navegación'} onClick={onToggleExpanded} type="button"><Icon name="panel-left" size={12} /></button>
        </div>

        {groups.map((group) => {
          const items = navigationItems.filter((item) => item.group === group)
          return (
            <div className="mb-1" key={group}>
              {expanded ? <p className="px-2 pb-0.5 pt-1 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">{group}</p> : <div aria-hidden="true" className="mx-2 my-1 h-px bg-border" />}
              <ul className="grid w-full gap-px px-0.5">
                {items.map((item) => {
                  const current = item.id === activeSection
                  const status = stateLabel[item.state]
                  return (
                    <li key={item.id}>
                      <button
                        aria-current={current ? 'page' : undefined}
                        aria-label={`${item.label} · ${status}`}
                        className={`nav-option group relative flex min-h-11 w-full cursor-pointer items-center rounded-sm border-l-2 px-0.5 text-xs transition-[background-color,color,border-color] duration-150 lg:min-h-8 ${expanded ? 'justify-start gap-1' : 'justify-center'} ${current ? 'border-primary bg-primary-soft text-primary-strong' : 'border-transparent hover:border-primary/50 hover:bg-muted/70'}`}
                        data-tooltip={!expanded ? `${item.label} · ${status}` : undefined}
                        onClick={() => onSectionChange(item.id)}
                        title={`${item.label} · ${status} · ${item.description}`}
                        type="button"
                      >
                        <span className="nav-accent-icon relative grid size-7 shrink-0 place-items-center rounded-sm transition-[color,background-color] duration-150">
                          <Icon name={item.icon} size={14} />
                          <span aria-hidden="true" className={`absolute bottom-0.5 right-0.5 size-1.5 rounded-full ring-1 ring-surface ${stateDotClass(item.state)}`} />
                        </span>
                        {expanded ? (
                          <span className="flex min-w-0 flex-1 items-center gap-1">
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.label}</span>
                            {item.state !== 'active' ? <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">{item.state === 'development' ? 'DEV' : 'NEXT'}</span> : null}
                          </span>
                        ) : <span className="sr-only">{item.label}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        <div className={`builder-profile mt-auto flex h-8 shrink-0 items-center border-t border-border px-1 ${expanded ? 'gap-1' : 'justify-center'}`}>
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem] font-bold text-foreground" aria-label="Perfil de Janiel">JG</div>
          {expanded ? <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">Janiel</span> : null}
          {expanded ? <span className="rounded bg-success/10 px-1 py-0.5 text-[0.5rem] font-bold uppercase text-success">Local</span> : null}
        </div>
      </div>
      <button aria-label="Redimensionar menú lateral" aria-orientation="vertical" aria-valuemax={168} aria-valuemin={44} aria-valuenow={width} className="group absolute -right-3 inset-y-0 z-30 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={onResizeKeyDown} onPointerDown={onResizePointerDown} role="separator" title="Arrastrar o usar flechas; Inicio/Fin para límites" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
    </nav>
  )
}
