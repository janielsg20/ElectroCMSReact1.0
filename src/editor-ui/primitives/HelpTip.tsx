import { createPortal } from 'react-dom'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Icon } from './Icon'

export interface HelpTipProps {
  readonly description: string
  readonly example?: string
  readonly label: string
  readonly reference?: string
}

interface TipPosition {
  readonly left: number
  readonly maxHeight: number
  readonly top: number
  readonly width: number
}

const VIEWPORT_PADDING = 8
const TIP_GAP = 6
const TIP_MAX_WIDTH = 304

export function HelpTip({ description, example, label, reference }: HelpTipProps) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [position, setPosition] = useState<TipPosition>({ left: VIEWPORT_PADDING, maxHeight: 320, top: VIEWPORT_PADDING, width: 240 })
  const contentId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  function clearCloseTimer(): void {
    if (closeTimerRef.current === null) return
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  function close(): void {
    clearCloseTimer()
    setPinned(false)
    setOpen(false)
  }

  function scheduleHoverClose(): void {
    if (pinned) return
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 100)
  }

  function openOnHover(): void {
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches === false) return
    clearCloseTimer()
    setOpen(true)
  }

  function updatePosition(): void {
    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return
    const bounds = trigger.getBoundingClientRect()
    const width = Math.min(TIP_MAX_WIDTH, Math.max(220, window.innerWidth - VIEWPORT_PADDING * 2))
    const maxHeight = Math.max(120, window.innerHeight - VIEWPORT_PADDING * 2)
    const height = Math.min(content.scrollHeight || content.getBoundingClientRect().height || 188, maxHeight)
    const spaceBelow = window.innerHeight - bounds.bottom - TIP_GAP - VIEWPORT_PADDING
    const spaceAbove = bounds.top - TIP_GAP - VIEWPORT_PADDING
    const spaceRight = window.innerWidth - bounds.right - TIP_GAP - VIEWPORT_PADDING
    const spaceLeft = bounds.left - TIP_GAP - VIEWPORT_PADDING
    const clampLeft = (value: number) => Math.max(VIEWPORT_PADDING, Math.min(value, window.innerWidth - width - VIEWPORT_PADDING))
    const clampTop = (value: number) => Math.max(VIEWPORT_PADDING, Math.min(value, window.innerHeight - height - VIEWPORT_PADDING))

    let left = clampLeft(bounds.left)
    let top: number
    if (spaceBelow >= height) top = bounds.bottom + TIP_GAP
    else if (spaceAbove >= height) top = bounds.top - TIP_GAP - height
    else if (spaceRight >= width) {
      left = bounds.right + TIP_GAP
      top = clampTop(bounds.top)
    } else if (spaceLeft >= width) {
      left = bounds.left - TIP_GAP - width
      top = clampTop(bounds.top)
    } else {
      top = spaceBelow >= spaceAbove ? clampTop(bounds.bottom + TIP_GAP) : clampTop(bounds.top - TIP_GAP - height)
    }
    const availableHeight = Math.max(120, window.innerHeight - top - VIEWPORT_PADDING)
    setPosition({ left, maxHeight: Math.min(maxHeight, availableHeight), top, width })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePointer(event: globalThis.PointerEvent): void {
      const target = event.target
      if (!(target instanceof Node)) return
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return
      close()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => () => clearCloseTimer(), [])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key !== 'Escape') return
    event.preventDefault()
    close()
    event.currentTarget.focus()
  }

  const style: CSSProperties = {
    left: position.left,
    maxHeight: position.maxHeight,
    top: position.top,
    width: position.width,
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        aria-controls={open ? contentId : undefined}
        aria-describedby={open ? contentId : undefined}
        aria-expanded={open}
        aria-label={`Información: ${label}`}
        className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:size-8"
        onClick={() => setPinned((current) => {
          const next = !current
          setOpen(next)
          return next
        })}
        onKeyDown={handleKeyDown}
        onMouseEnter={openOnHover}
        onMouseLeave={scheduleHoverClose}
        ref={triggerRef}
        title={`¿Qué hace ${label}?`}
        type="button"
      >
        <Icon name="info" size={14} />
      </button>
      {open && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed z-[120] overflow-y-auto overscroll-contain rounded-lg border border-border bg-elevated p-2 text-left shadow-xl"
          id={contentId}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleHoverClose}
          ref={contentRef}
          role="tooltip"
          style={style}
        >
          <strong className="block text-xs text-foreground">{label}</strong>
          <p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground">{description}</p>
          {reference ? (
            <p className="mt-1.5 rounded bg-primary-soft px-1.5 py-1 text-[0.625rem] leading-4 text-primary-strong">
              <strong>Relacionado:</strong> {reference}
            </p>
          ) : null}
          {example ? <p className="mt-1 text-[0.625rem] leading-4 text-muted-foreground"><strong>Ejemplo:</strong> {example}</p> : null}
        </div>,
        document.body,
      ) : null}
    </span>
  )
}
