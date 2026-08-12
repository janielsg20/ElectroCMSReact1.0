import { useDraggable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import type { WidgetDefinition } from '../../domain'
import { Icon } from '../primitives'
import { widgetLibraryDragId, type WidgetLibrarySource } from './widget-library-context'

interface WidgetLibraryCardProps {
  readonly definition: WidgetDefinition
  readonly description: string
  readonly favorite: boolean
  readonly label: string
  readonly onInsert: () => void
  readonly onRemove?: () => void
  readonly onToggleFavorite?: () => void
  readonly source: WidgetLibrarySource
  readonly subtitle: string
}

export function WidgetLibraryCard({ definition, description, favorite, label, onInsert, onRemove, onToggleFavorite, source, subtitle }: WidgetLibraryCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    data: { source },
    id: widgetLibraryDragId(source),
  })
  const style: CSSProperties | undefined = transform ? {
    transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`,
  } : undefined

  return (
    <li className={`semantic-option widget-library-card rounded-md border border-border bg-surface p-1.5 ${isDragging ? 'opacity-40' : ''}`} ref={setNodeRef} style={style}>
      <div className="flex min-w-0 items-start gap-1.5">
        <span className="widget-thumbnail grid size-9 shrink-0 place-items-center rounded-md border border-border bg-primary-soft text-primary" role="img" aria-label={`Miniatura de ${label}`}>
          <svg aria-hidden="true" fill="none" focusable="false" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox={definition.icon.viewBox} width="20"><path d={definition.icon.path} /></svg>
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-xs text-foreground">{label}</strong>
          <span className="block truncate text-[0.625rem] text-muted-foreground">{subtitle}</span>
        </span>
        {onToggleFavorite ? (
          <button aria-label={favorite ? `Quitar ${label} de favoritos` : `Añadir ${label} a favoritos`} aria-pressed={favorite} className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded focus-visible:ring-2 focus-visible:ring-focus ${favorite ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted'}`} onClick={onToggleFavorite} type="button"><Icon name="pin" size={13} /></button>
        ) : null}
        {onRemove ? <button aria-label={`Eliminar ${label} de guardados`} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded text-muted-foreground hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-focus" onClick={onRemove} type="button"><Icon name="close" size={12} /></button> : null}
      </div>
      <p className="mt-1 line-clamp-2 text-[0.625rem] leading-4 text-muted-foreground">{description}</p>
      <div className="mt-1 flex items-center gap-1">
        <button aria-label={`Insertar ${label}`} className="min-h-9 flex-1 cursor-pointer rounded-md bg-primary px-2 text-xs font-bold text-on-primary hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-focus" onClick={onInsert} type="button">Insertar</button>
        <button {...attributes} {...listeners} aria-description="Control de cuatro direcciones: arrastra este widget al lienzo. También puedes usar Insertar sin arrastrar." aria-label={`Arrastrar ${label} al canvas`} className="grid size-9 touch-none cursor-grab place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing" type="button"><Icon name="move" size={13} /></button>
      </div>
    </li>
  )
}
