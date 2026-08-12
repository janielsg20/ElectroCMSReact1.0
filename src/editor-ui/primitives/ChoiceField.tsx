import { createPortal } from 'react-dom'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './Icon'

export interface ChoiceFieldOption {
  readonly description?: string
  readonly label: string
  readonly value: string
}

export interface ChoiceFieldProps {
  readonly compact?: boolean
  readonly disabled?: boolean
  readonly help?: ReactNode
  readonly label: string
  readonly labelHidden?: boolean
  readonly onChange: (value: string) => void
  readonly options: readonly ChoiceFieldOption[]
  readonly placeholder?: string
  readonly value: string
}

interface MenuPosition {
  readonly left: number
  readonly maxHeight: number
  readonly top: number
  readonly width: number
}

const VIEWPORT_PADDING = 8
const MENU_GAP = 4
const MENU_MAX_HEIGHT = 240
const MENU_MIN_HEIGHT = 96

export function ChoiceField({ compact = false, disabled = false, help, label, labelHidden = false, onChange, options, placeholder = 'Seleccionar', value }: ChoiceFieldProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selected = options.find((option) => option.value === value)

  const updatePosition = useCallback((): void => {
    const trigger = triggerRef.current
    if (!trigger || typeof window === 'undefined') return
    const rect = trigger.getBoundingClientRect()
    const below = Math.max(0, window.innerHeight - rect.bottom - VIEWPORT_PADDING - MENU_GAP)
    const above = Math.max(0, rect.top - VIEWPORT_PADDING - MENU_GAP)
    const measuredHeight = Math.min(menuRef.current?.scrollHeight ?? MENU_MAX_HEIGHT, MENU_MAX_HEIGHT)
    const openAbove = below < Math.min(measuredHeight, 160) && above > below
    const available = Math.max(MENU_MIN_HEIGHT, openAbove ? above : below)
    const maxHeight = Math.min(MENU_MAX_HEIGHT, available)
    const desiredWidth = Math.max(rect.width, compact ? 200 : rect.width)
    const width = Math.min(desiredWidth, Math.max(160, window.innerWidth - VIEWPORT_PADDING * 2))
    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - VIEWPORT_PADDING - width)
    const left = Math.min(Math.max(VIEWPORT_PADDING, rect.left), maxLeft)
    const rawTop = openAbove ? rect.top - MENU_GAP - Math.min(measuredHeight, maxHeight) : rect.bottom + MENU_GAP
    const maxTop = Math.max(VIEWPORT_PADDING, window.innerHeight - VIEWPORT_PADDING - maxHeight)
    const top = Math.min(Math.max(VIEWPORT_PADDING, rawTop), maxTop)
    setPosition({ left, maxHeight, top, width })
  }, [compact])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, options.length, updatePosition, value])

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePointer(event: globalThis.PointerEvent): void {
      const target = event.target
      if (!(target instanceof Node)) return
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
    }
  }, [open, updatePosition])

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

  const menuStyle: CSSProperties | undefined = position ? {
    left: position.left,
    maxHeight: position.maxHeight,
    top: position.top,
    width: position.width,
  } : undefined

  return (
    <div className={`relative grid min-w-0 ${compact ? 'gap-0' : 'gap-1'}`}>
      <div className={labelHidden ? 'sr-only' : 'flex min-h-8 items-center gap-1'}>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{label}</span>
        {help}
      </div>
      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 text-left text-xs text-foreground outline-none transition-colors hover:border-primary/35 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'min-h-11 lg:min-h-8' : 'min-h-11 lg:min-h-9'}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <Icon className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} name="chevron-down" size={13} />
      </button>
      {open && typeof document !== 'undefined' ? createPortal(
        <div
          aria-label={label}
          className="fixed z-[110] overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-1 shadow-xl"
          id={listboxId}
          ref={menuRef}
          role="listbox"
          style={menuStyle}
        >
          {options.length ? options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${option.value === value ? 'bg-primary-soft text-primary-strong' : 'text-foreground'}`}
              key={option.value || '__empty'}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                requestAnimationFrame(() => triggerRef.current?.focus())
              }}
              role="option"
              type="button"
            >
              <span className="min-w-0 flex-1"><strong className="block truncate font-semibold">{option.label}</strong>{option.description ? <span className="block truncate text-[0.625rem] font-normal text-muted-foreground">{option.description}</span> : null}</span>
              {option.value === value ? <Icon name="check" size={13} /> : null}
            </button>
          )) : <p className="px-2 py-3 text-xs text-muted-foreground">No hay opciones disponibles.</p>}
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
