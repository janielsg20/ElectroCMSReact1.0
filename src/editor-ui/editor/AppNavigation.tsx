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
      <div className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className={`builder-rail-head flex h-12 shrink-0 items-center px-1 lg:h-9 ${expanded ? 'justify-between' : 'justify-center'}`}>
          {expanded ? <span className="truncate px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Producto</span> : null}
          <button aria-label={expanded ? 'Contraer menú lateral' : 'Expandir menú lateral'} aria-pressed={expanded} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:size-8" data-tooltip={expanded ? 'Contraer navegación' : 'Expandir navegación'} onClick={onToggleExpanded} type="button"><Icon name="panel-left" size={14} /></button>
        </div>

        {groups.map((group) => {
          const items = navigationItems.filter((item) => item.group === group)
          return (
            <div className="mb-1.5" key={group}>
              {expanded ? <p className="px-2 pb-1 pt-1.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground/75">{group}</p> : <div aria-hidden="true" className="mx-2 my-1.5 h-px bg-border" />}
              <ul className="grid w-full gap-0.5 px-1">
                {items.map((item) => {
                  const current = item.id === activeSection
                  const status = stateLabel[item.state]
                  return (
                    <li key={item.id}>
                      <button
                        aria-current={current ? 'page' : undefined}
                        aria-label={`${item.label} · ${status}`}
                        className={`nav-option group relative flex min-h-11 w-full cursor-pointer items-center rounded-md px-1 text-xs transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${expanded ? 'justify-start gap-1.5' : 'justify-center'} ${current ? 'bg-primary-soft text-primary-strong' : 'text-foreground hover:bg-muted/80'}`}
                        data-active={current ? 'true' : 'false'}
                        data-tooltip={!expanded ? `${item.label} · ${status}` : undefined}
                        onClick={(event) => {
                          event.currentTarget.focus()
                          onSectionChange(item.id)
                        }}
                        title={`${item.label} · ${status} · ${item.description}`}
                        type="button"
                      >
                        <span className="nav-accent-icon relative grid size-8 shrink-0 place-items-center rounded-md transition-[color,background-color,box-shadow] duration-150 lg:size-8">
                          <Icon name={item.icon} size={15} />
                          <span aria-hidden="true" className={`absolute bottom-0.5 right-0.5 size-1.5 rounded-full ring-1 ring-surface ${stateDotClass(item.state)}`} />
                        </span>
                        {expanded ? (
                          <span className="flex min-w-0 flex-1 items-center gap-1.5">
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.label}</span>
                            {item.state !== 'active' ? <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.05em] text-muted-foreground">{item.state === 'development' ? 'DEV' : 'NEXT'}</span> : null}
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

        <div className={`builder-profile mt-auto flex h-11 shrink-0 items-center border-t border-border px-1.5 lg:h-9 ${expanded ? 'gap-1.5' : 'justify-center'}`}>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem] font-bold text-foreground" aria-label="Perfil de Janiel">JG</div>
          {expanded ? <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">Janiel</span> : null}
          {expanded ? <span className="rounded bg-success/10 px-1 py-0.5 text-[0.5625rem] font-bold uppercase text-success">Local</span> : null}
        </div>
      </div>
      <button aria-label="Redimensionar menú lateral" aria-orientation="vertical" aria-valuemax={168} aria-valuemin={44} aria-valuenow={width} className="group absolute -right-3 inset-y-0 z-30 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={onResizeKeyDown} onPointerDown={onResizePointerDown} role="separator" title="Arrastrar o usar flechas; Inicio/Fin para límites" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
    </nav>
  )
}
