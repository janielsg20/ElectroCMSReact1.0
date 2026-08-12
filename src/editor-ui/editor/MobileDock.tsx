import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '../primitives'
import type { LibraryTab } from './LibraryPanel'
import { MobileModuleMenu } from './MobileModuleMenu'
import { useAppSection } from './app-section-context'

export type MobilePanel = LibraryTab | 'inspector' | null

type DockItemId = 'widgets' | 'layers' | 'canvas' | 'inspector' | 'more'

interface MobileDockProps {
  readonly activePanel: MobilePanel
  readonly onPanelChange: (panel: MobilePanel) => void
}

const dockItems = [
  { id: 'widgets' as const, label: 'Widgets', icon: 'plus' as const },
  { id: 'layers' as const, label: 'Capas', icon: 'layers' as const },
  { id: 'canvas' as const, label: 'Canvas', icon: 'cursor' as const },
  { id: 'inspector' as const, label: 'Props', icon: 'settings' as const },
  { id: 'more' as const, label: 'Más', icon: 'more' as const },
]

export function MobileDock({ activePanel, onPanelChange }: MobileDockProps) {
  const { section, setSection } = useAppSection()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)
  const moreSheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    requestAnimationFrame(() => moreSheetRef.current?.focus())
  }, [moreOpen])

  function closeMore(restoreFocus = true): void {
    setMoreOpen(false)
    if (restoreFocus) requestAnimationFrame(() => moreTriggerRef.current?.focus())
  }

  function selectItem(id: DockItemId): void {
    if (id === 'more') {
      setMoreOpen((current) => !current)
      return
    }

    if (moreOpen) closeMore(false)
    setSection('editor')
    if (id === 'canvas') {
      onPanelChange(null)
      return
    }

    const panel: Exclude<MobilePanel, null> = id
    onPanelChange(activePanel === panel && section === 'editor' ? null : panel)
  }

  function trapMoreFocus(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeMore()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = moreSheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return

    if (document.activeElement === moreSheetRef.current) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <nav aria-label="Navegación del builder" className="mobile-dock fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid h-14 grid-cols-5 items-stretch">
          {dockItems.map((item) => {
            const active = item.id === 'more'
              ? moreOpen || section !== 'editor'
              : item.id === 'canvas'
                ? section === 'editor' && activePanel === null
                : section === 'editor' && activePanel === item.id

            return (
              <li className="min-w-0" key={item.id}>
                <button
                  aria-current={active ? 'page' : undefined}
                  aria-expanded={item.id === 'more' ? moreOpen : undefined}
                  aria-haspopup={item.id === 'more' ? 'dialog' : undefined}
                  aria-label={item.label}
                  className={`mobile-dock-option relative flex h-full min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-0.5 text-[0.625rem] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus ${active ? 'mobile-dock-option--active text-primary-strong' : 'text-muted-foreground'}`}
                  onClick={() => selectItem(item.id)}
                  ref={item.id === 'more' ? moreTriggerRef : undefined}
                  title={item.label}
                  type="button"
                >
                  <span aria-hidden="true" className={`absolute inset-x-[28%] top-0 h-0.5 rounded-b-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
                  <span className={`mobile-dock-option__icon grid size-7 place-items-center rounded ${active ? 'bg-primary-soft text-primary-strong' : 'bg-transparent text-muted-foreground'}`}>
                    <Icon name={item.icon} size={15} />
                  </span>
                  <span className="max-w-full truncate">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {moreOpen ? (
        <div aria-label="Más módulos" aria-modal="true" className="fixed inset-0 z-50 md:hidden" role="dialog">
          <button aria-label="Ocultar menú de módulos" className="absolute inset-0 cursor-pointer bg-slate-950/45 backdrop-blur-[2px]" onClick={() => closeMore()} tabIndex={-1} type="button" />
          <div className="mobile-sheet absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-hidden rounded-t-xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg outline-none" onKeyDown={trapMoreFocus} ref={moreSheetRef} tabIndex={-1}>
            <header className="flex min-h-12 items-center justify-between border-b border-primary/25 bg-primary-soft px-2">
              <div><span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-primary/35" /><h2 className="mt-1 text-xs font-bold text-primary-strong">Módulos</h2></div>
              <button aria-label="Cerrar panel" className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus" onClick={() => closeMore()} type="button"><Icon name="close" size={16} /></button>
            </header>
            <div className="max-h-[calc(82dvh-3rem)] overflow-y-auto overscroll-contain">
              <MobileModuleMenu onNavigate={() => closeMore()} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
