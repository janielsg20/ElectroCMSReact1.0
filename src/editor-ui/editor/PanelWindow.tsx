import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { Icon } from '../primitives'
import type { IconName } from '../primitives/Icon'

export type WorkspacePanel = 'library' | 'inspector'
export type PanelMode = 'docked' | 'floating' | 'minimized' | 'closed'
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
  readonly onClose: () => void
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
      className={`panel-window__action grid size-6 cursor-pointer place-items-center rounded-sm transition-[background-color,color] duration-200 hover:bg-[color-mix(in_srgb,var(--panel-accent)_16%,transparent)] focus-visible:ring-2 focus-visible:ring-focus active:bg-[color-mix(in_srgb,var(--panel-accent)_24%,transparent)] ${active ? 'bg-[color-mix(in_srgb,var(--panel-accent)_18%,transparent)] text-[var(--panel-accent)]' : 'text-[var(--panel-accent)]'}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon name={icon} size={13} />
    </button>
  )
}

export function PanelWindow({ panel, title, mode, dockSide, bounds, pinned, active, children, onActivate, onMovePointerDown, onMoveKeyDown, onResizePointerDown, onResizeKeyDown, onFloat, onDock, onMinimize, onTogglePin, onClose }: PanelWindowProps) {
  const floatingStyle = mode === 'floating'
    ? { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height } satisfies CSSProperties
    : undefined
  const placement = mode === 'docked' ? 'relative h-full w-full' : `fixed ${pinned ? 'z-40' : active ? 'z-30' : 'z-20'}`
  const panelIcon: IconName = panel === 'library' ? 'layers' : 'settings'
  const status = mode === 'floating' ? 'Flotante' : dockSide === 'left' ? 'Izquierda' : 'Derecha'

  return (
    <section
      aria-label={`${title} · ${mode === 'floating' ? 'Flotante' : 'Acoplado'}`}
      className={`panel-window panel-window--${panel} ${placement} flex min-h-0 flex-col overflow-hidden border border-border bg-surface shadow-sm transition-[box-shadow,border-color] duration-200 ${mode === 'docked' ? 'border-y-0' : 'rounded shadow-lg'} ${active ? 'panel-window--active' : ''}`}
      onFocusCapture={onActivate}
      onPointerDown={onActivate}
      style={floatingStyle}
    >
      <header className="panel-window__bar flex h-7 shrink-0 items-center gap-0.5 border-b border-border px-0.5">
        {mode === 'floating' ? (
          <button
            aria-label={`Mover ${title}. Flechas para mover; Alt más flecha para acoplar`}
            className="flex h-6 min-w-0 flex-1 cursor-move touch-none items-center gap-1 rounded-sm px-1 text-left hover:bg-[color-mix(in_srgb,var(--panel-accent)_10%,transparent)] focus-visible:ring-2 focus-visible:ring-focus"
            onKeyDown={onMoveKeyDown}
            onPointerDown={onMovePointerDown}
            title="Arrastrar para mover o acoplar; usa flechas con el teclado"
            type="button"
          >
            <Icon className="shrink-0 text-[var(--panel-accent)]" name="move" size={12} />
            <Icon className="shrink-0 text-[var(--panel-accent)]" name={panelIcon} size={12} />
            <span className="truncate text-[0.625rem] font-semibold">{title}</span>
            <span className="truncate text-[0.5rem] text-[var(--panel-accent)]">{status}</span>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1 px-1">
            <Icon className="shrink-0 text-[var(--panel-accent)]" name={panelIcon} size={12} />
            <span className="truncate text-[0.625rem] font-semibold">{title}</span>
            <span className="truncate text-[0.5rem] text-[var(--panel-accent)]">{status}</span>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-px" role="toolbar" aria-label={`Controles de ${title}`}>
          {mode === 'docked' ? <WindowAction icon="window" label={`Desacoplar ${title}`} onClick={onFloat} /> : null}
          {mode === 'floating' ? <WindowAction icon="dock-left" label={`Acoplar ${title} a la izquierda`} onClick={() => onDock('left')} /> : null}
          {mode === 'floating' ? <WindowAction icon="dock-right" label={`Acoplar ${title} a la derecha`} onClick={() => onDock('right')} /> : null}
          {mode === 'floating' ? <WindowAction icon="panel-left" label={`Acoplar ${title} a la barra lateral`} onClick={() => onDock('rail')} /> : null}
          {mode === 'floating' ? <WindowAction active={pinned} icon="pin" label={pinned ? `Desfijar ${title}` : `Fijar ${title} sobre otras ventanas`} onClick={onTogglePin} /> : null}
          <WindowAction icon="minus" label={`Minimizar ${title}`} onClick={onMinimize} />
          <WindowAction icon="close" label={`Cerrar ${title}`} onClick={onClose} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {mode === 'floating' ? (
        <button
          aria-label={`Redimensionar ventana ${title}. Usa las flechas`}
          className="absolute bottom-0 right-0 grid size-6 cursor-nwse-resize touch-none place-items-end p-0.5 text-[var(--panel-accent)] hover:bg-[color-mix(in_srgb,var(--panel-accent)_12%,transparent)] focus-visible:ring-2 focus-visible:ring-focus"
          onKeyDown={onResizeKeyDown}
          onPointerDown={onResizePointerDown}
          title="Arrastrar o usar las flechas para redimensionar"
          type="button"
        >
          <Icon name="resize" size={13} />
        </button>
      ) : null}
    </section>
  )
}
