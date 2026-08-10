import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { Icon } from '../primitives'
import type { IconName } from '../primitives/Icon'

export type WorkspacePanel = 'library' | 'inspector'
export type PanelMode = 'docked' | 'floating' | 'minimized'
export type DockSide = 'left' | 'right' | 'rail'

export interface PanelBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

interface PanelWindowProps {
  readonly panel: WorkspacePanel
  readonly title: string
  readonly mode: 'docked' | 'floating'
  readonly dockSide: Exclude<DockSide, 'rail'>
  readonly bounds: PanelBounds
  readonly pinned: boolean
  readonly active: boolean
  readonly children: ReactNode
  readonly onActivate: () => void
  readonly onMovePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  readonly onMoveKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  readonly onResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  readonly onResizeKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  readonly onFloat: () => void
  readonly onDock: (side: DockSide) => void
  readonly onMinimize: () => void
  readonly onTogglePin: () => void
}

interface WindowActionProps {
  readonly label: string
  readonly icon: IconName
  readonly onClick: () => void
  readonly active?: boolean
}

function WindowAction({ label, icon, onClick, active = false }: WindowActionProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active || undefined}
      className={`panel-window__action grid size-7 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:size-6 ${active ? 'bg-primary-soft text-primary-strong' : ''}`}
      data-tooltip={label}
      onClick={onClick}
      type="button"
    >
      <Icon name={icon} size={12} />
    </button>
  )
}

export function PanelWindow({ panel, title, mode, dockSide, bounds, pinned, active, children, onActivate, onMovePointerDown, onMoveKeyDown, onResizePointerDown, onResizeKeyDown, onFloat, onDock, onMinimize, onTogglePin }: PanelWindowProps) {
  const floatingStyle = mode === 'floating'
    ? { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height } satisfies CSSProperties
    : undefined
  const placement = mode === 'docked' ? 'relative h-full w-full' : `fixed ${pinned ? 'z-40' : active ? 'z-30' : 'z-20'}`
  const panelIcon: IconName = panel === 'library' ? 'layers' : 'settings'
  const status = mode === 'floating' ? 'Floating' : dockSide === 'left' ? 'Left' : 'Right'

  return (
    <section
      aria-label={`${title} · ${mode === 'floating' ? 'Flotante' : 'Acoplado'}`}
      className={`panel-window panel-window--${panel} ${placement} flex min-h-0 flex-col overflow-hidden border border-border bg-surface transition-[box-shadow,border-color] duration-150 ${mode === 'docked' ? 'border-y-0 shadow-none' : 'rounded-lg shadow-xl'} ${active ? 'panel-window--active' : ''}`}
      onFocusCapture={onActivate}
      onPointerDown={onActivate}
      style={floatingStyle}
    >
      <header className={`panel-window__bar flex h-8 min-h-8 shrink-0 items-center gap-0.5 border-b border-border bg-surface px-1 ${mode === 'floating' ? 'cursor-default' : ''}`}>
        {mode === 'floating' ? (
          <button
            aria-label={`Mover ${title}. Flechas para mover; Alt más flecha para acoplar`}
            className="flex h-7 min-w-0 flex-1 cursor-move touch-none items-center gap-1 rounded px-1 text-left text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus"
            onKeyDown={onMoveKeyDown}
            onPointerDown={onMovePointerDown}
            type="button"
          >
            <Icon className="shrink-0" name="move" size={11} />
            <Icon className="shrink-0 text-primary" name={panelIcon} size={12} />
            <span className="truncate text-xs font-semibold text-foreground">{title}</span>
            <span className="ml-1 truncate text-[0.625rem] text-muted-foreground">{status}</span>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1 px-1">
            <Icon className="shrink-0 text-primary" name={panelIcon} size={12} />
            <span className="truncate text-xs font-semibold text-foreground">{title}</span>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-px" role="toolbar" aria-label={`Controles de ${title}`}>
          {mode === 'docked' ? <WindowAction icon="window" label={`Desacoplar ${title}`} onClick={onFloat} /> : null}
          {mode === 'floating' ? <WindowAction icon="dock-left" label={`Acoplar ${title} a la izquierda`} onClick={() => onDock('left')} /> : null}
          {mode === 'floating' ? <WindowAction icon="dock-right" label={`Acoplar ${title} a la derecha`} onClick={() => onDock('right')} /> : null}
          {mode === 'floating' ? <WindowAction icon="panel-left" label={`Acoplar ${title} a la barra lateral`} onClick={() => onDock('rail')} /> : null}
          {mode === 'floating' ? <WindowAction active={pinned} icon="pin" label={pinned ? `Desfijar ${title}` : `Fijar ${title} sobre otras ventanas`} onClick={onTogglePin} /> : null}
          <WindowAction icon="minus" label={`Minimizar ${title}`} onClick={onMinimize} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {mode === 'floating' ? (
        <button
          aria-label={`Redimensionar ventana ${title}. Usa las flechas`}
          className="absolute bottom-0 right-0 grid size-7 cursor-nwse-resize touch-none place-items-end rounded-tl p-1 text-muted-foreground hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-focus"
          onKeyDown={onResizeKeyDown}
          onPointerDown={onResizePointerDown}
          type="button"
        >
          <Icon name="resize" size={12} />
        </button>
      ) : null}
    </section>
  )
}
