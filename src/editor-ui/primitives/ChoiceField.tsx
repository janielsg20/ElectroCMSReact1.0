import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './Icon'

export interface ChoiceFieldOption {
  readonly description?: string
  readonly label: string
  readonly value: string
}

export interface ChoiceFieldProps {
  readonly disabled?: boolean
  readonly help?: ReactNode
  readonly label: string
  readonly onChange: (value: string) => void
  readonly options: readonly ChoiceFieldOption[]
  readonly placeholder?: string
  readonly value: string
}

export function ChoiceField({ disabled = false, help, label, onChange, options, placeholder = 'Seleccionar', value }: ChoiceFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if ((event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') && !open) {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className="relative grid min-w-0 gap-1">
      <div className="flex min-h-8 items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{label}</span>
        {help}
      </div>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 text-left text-xs text-foreground outline-none transition-colors hover:border-primary/35 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <Icon className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} name="chevron-down" size={13} />
      </button>
      {open ? (
        <div aria-label={label} className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl" role="listbox">
          {options.length ? options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${option.value === value ? 'bg-primary-soft text-primary-strong' : 'text-foreground'}`}
              key={option.value || '__empty'}
              onClick={() => { onChange(option.value); setOpen(false) }}
              role="option"
              type="button"
            >
              <span className="min-w-0 flex-1"><strong className="block truncate font-semibold">{option.label}</strong>{option.description ? <span className="block truncate text-[0.625rem] font-normal text-muted-foreground">{option.description}</span> : null}</span>
              {option.value === value ? <Icon name="check" size={13} /> : null}
            </button>
          )) : <p className="px-2 py-3 text-xs text-muted-foreground">No hay opciones disponibles.</p>}
        </div>
      ) : null}
    </div>
  )
}
