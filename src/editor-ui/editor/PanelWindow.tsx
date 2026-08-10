import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { Icon } from '../primitives'
import type { IconName } from '../primitives/Icon'

export type WorkspacePanel = 'library' | 'inspector'
export type PanelMode = 'docked' | 'floating' | 'minimized' | 'maximized' | 'closed'

export interface PanelBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

interface PanelWindowProps {
  readonly panel: WorkspacePanel
  readonly title: string
  readonly mode: Exclude<PanelMode, 'minimized' | 'closed'>
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
  readonly onDock: () => void
  readonly onMinimize: () => void
  readonly onMaximize: () => void
  readonly onRestore: () => void
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
      className={`grid size-7 cursor-pointer place-items-center rounded transition-[background-color,color] duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus ${active ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground'}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon name={icon} size={14} />
    </button>
  )
}

const modeLabels = {
  docked: 'Acoplado',
  floating: 'Flotante',
  maximized: 'Maximizado',
} as const

export function PanelWindow({ panel, title, mode, bounds, pinned, active, children, onActivate, onMovePointerDown, onMoveKeyDown, onResizePointerDown, onResizeKeyDown, onFloat, onDock, onMinimize, onMaximize, onRestore, onTogglePin, onClose }: PanelWindowProps) {
  const floatingStyle = mode === 'floating'
    ? { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height } satisfies CSSProperties
    : undefined
  const placement = mode === 'docked'
    ? 'relative h-full w-full'
    : mode === 'maximized'
      ? 'fixed bottom-6 left-11 right-0 top-10 z-40'
      : `fixed ${pinned ? 'z-40' : active ? 'z-30' : 'z-20'}`

  return (
    <section
      aria-label={`${title} · ${modeLabels[mode]}`}
      className={`panel-window panel-window--${panel} ${placement} flex min-h-0 flex-col overflow-hidden border border-border bg-surface shadow-sm transition-[box-shadow,border-color] duration-200 ${mode === 'docked' ? 'border-y-0' : 'rounded-md shadow-lg'} ${active ? 'panel-window--active' : ''}`}
      onFocusCapture={onActivate}
      onPointerDown={onActivate}
      style={floatingStyle}
    >
      <header className="panel-window__bar flex h-8 shrink-0 items-center gap-1 border-b border-border px-1">
        {mode === 'floating' ? (
          <button
            aria-label={`Mover ${title}. Usa las flechas para posicionar`}
            className="flex h-7 min-w-0 flex-1 cursor-move touch-none items-center gap-1 rounded px-1 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus"
            onKeyDown={onMoveKeyDown}
            onPointerDown={onMovePointerDown}
            title="Arrastrar o usar las flechas para mover"
            type="button"
          >
            <Icon className="shrink-0 text-[var(--panel-accent)]" name="move" size={14} />
            <span className="panel-window__dot size-1.5 shrink-0 rounded-full" />
            <span className="truncate text-[0.6875rem] font-semibold">{title}</span>
            <span className="truncate text-[0.5625rem] text-muted-foreground">{modeLabels[mode]}</span>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1 px-1">
            <span className="panel-window__dot size-1.5 shrink-0 rounded-full" />
            <span className="truncate text-[0.6875rem] font-semibold">{title}</span>
            <span className="truncate text-[0.5625rem] text-muted-foreground">{modeLabels[mode]}</span>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-px" role="toolbar" aria-label={`Controles de ${title}`}>
          {mode === 'docked' ? <WindowAction icon="window" label={`Desacoplar ${title}`} onClick={onFloat} /> : null}
          {mode === 'floating' ? <WindowAction icon={panel === 'library' ? 'dock-left' : 'dock-right'} label={`Acoplar ${title}`} onClick={onDock} /> : null}
          {mode === 'floating' ? <WindowAction active={pinned} icon="pin" label={pinned ? `Desfijar ${title}` : `Fijar ${title} sobre otras ventanas`} onClick={onTogglePin} /> : null}
          <WindowAction icon="minus" label={`Minimizar ${title}`} onClick={onMinimize} />
          {mode === 'maximized' ? <WindowAction icon="restore" label={`Restaurar ${title}`} onClick={onRestore} /> : <WindowAction icon="maximize" label={`Maximizar ${title}`} onClick={onMaximize} />}
          <WindowAction icon="close" label={`Cerrar ${title}`} onClick={onClose} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {mode === 'floating' ? (
        <button
          aria-label={`Redimensionar ventana ${title}. Usa las flechas`}
          className="absolute bottom-0 right-0 grid size-7 cursor-nwse-resize touch-none place-items-end p-1 text-muted-foreground hover:text-[var(--panel-accent)] focus-visible:ring-2 focus-visible:ring-focus"
          onKeyDown={onResizeKeyDown}
          onPointerDown={onResizePointerDown}
          title="Arrastrar o usar las flechas para redimensionar"
          type="button"
        >
          <Icon name="resize" size={14} />
        </button>
      ) : null}
    </section>
  )
}
