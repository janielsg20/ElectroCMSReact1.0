import { useId, useState, type FocusEvent } from 'react'
import { Icon } from './Icon'

export interface HelpTipProps {
  readonly description: string
  readonly example?: string
  readonly label: string
  readonly reference?: string
}

export function HelpTip({ description, example, label, reference }: HelpTipProps) {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  function handleBlur(event: FocusEvent<HTMLDivElement>): void {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }

  return (
    <div className="relative inline-flex shrink-0" onBlur={handleBlur}>
      <button
        aria-controls={contentId}
        aria-expanded={open}
        aria-label={`Información: ${label}`}
        className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:size-8"
        onClick={() => setOpen((current) => !current)}
        title={`¿Qué hace ${label}?`}
        type="button"
      >
        <Icon name="info" size={14} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.25rem)] z-[90] w-[min(19rem,calc(100vw-1rem))] rounded-md border border-border bg-elevated p-2 text-left shadow-lg"
          id={contentId}
          role="tooltip"
        >
          <strong className="block text-xs text-foreground">{label}</strong>
          <p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground">{description}</p>
          {reference ? (
            <p className="mt-1.5 rounded bg-primary-soft px-1.5 py-1 text-[0.625rem] leading-4 text-primary-strong">
              <strong>Equivalente conocido:</strong> {reference}
            </p>
          ) : null}
          {example ? <p className="mt-1 text-[0.625rem] leading-4 text-muted-foreground"><strong>Ejemplo:</strong> {example}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
