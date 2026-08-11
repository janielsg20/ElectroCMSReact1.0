import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Button, Icon } from '../primitives'
import type { WorkspacePanel } from './PanelWindow'
import './tablet-workspace.css'

interface TabletWorkspacePanelProps {
  readonly primaryPanel: WorkspacePanel
  readonly overlayPanel: WorkspacePanel | null
  readonly primaryContent: ReactNode
  readonly overlayContent: ReactNode
  readonly onOpenSecondary: (panel: WorkspacePanel) => void
  readonly onCloseOverlay: () => void
  readonly onPromoteOverlay: (panel: WorkspacePanel) => void
}

function panelTitle(panel: WorkspacePanel): string {
  return panel === 'library' ? 'Páginas y capas' : 'Inspector'
}

function panelIcon(panel: WorkspacePanel): 'layers' | 'settings' {
  return panel === 'library' ? 'layers' : 'settings'
}

export function TabletWorkspacePanel({ primaryPanel, overlayPanel, primaryContent, overlayContent, onOpenSecondary, onCloseOverlay, onPromoteOverlay }: TabletWorkspacePanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const secondaryPanel: WorkspacePanel = primaryPanel === 'library' ? 'inspector' : 'library'

  useEffect(() => {
    if (!overlayPanel) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    overlayRef.current?.focus()
  }, [overlayPanel])

  function closeOverlay(): void {
    onCloseOverlay()
    requestAnimationFrame(() => previousFocusRef.current?.focus())
  }

  function promoteOverlay(): void {
    if (!overlayPanel) return
    onPromoteOverlay(overlayPanel)
    requestAnimationFrame(() => previousFocusRef.current?.focus())
  }

  function trapOverlayFocus(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeOverlay()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = overlayRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <aside aria-label={`${panelTitle(primaryPanel)} · panel persistente tablet`} className="tablet-primary-panel col-start-3 row-start-2 hidden min-h-0 min-w-0 flex-col border-l border-border bg-surface md:flex lg:hidden">
        <div className="flex min-h-11 shrink-0 items-center gap-1 border-b border-border bg-primary-soft/45 px-1.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name={panelIcon(primaryPanel)} size={14} /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Panel persistente</p><h2 className="truncate text-xs font-bold">{panelTitle(primaryPanel)}</h2></div>
          <Button aria-label={`Abrir ${panelTitle(secondaryPanel)} como panel secundario`} data-tooltip={`Abrir ${panelTitle(secondaryPanel)}`} onClick={() => onOpenSecondary(secondaryPanel)} size="icon" variant="ghost"><Icon name={panelIcon(secondaryPanel)} size={15} /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{primaryContent}</div>
      </aside>

      {overlayPanel ? (
        <div aria-label={`${panelTitle(overlayPanel)} · panel secundario tablet`} aria-modal="true" className="tablet-panel-overlay fixed inset-0 z-50 hidden md:block lg:hidden" role="dialog">
          <button aria-label="Cerrar panel secundario" className="absolute inset-0 cursor-pointer bg-slate-950/35 backdrop-blur-[1px]" onClick={closeOverlay} tabIndex={-1} type="button" />
          <div className="tablet-panel-overlay__surface absolute bottom-6 right-2 top-12 flex w-[min(23rem,calc(100vw-4rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg outline-none" onKeyDown={trapOverlayFocus} ref={overlayRef} tabIndex={-1}>
            <div className="flex min-h-12 shrink-0 items-center gap-1 border-b border-border bg-primary-soft px-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface text-primary shadow-sm"><Icon name={panelIcon(overlayPanel)} size={14} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Panel secundario</p><h2 className="truncate text-xs font-bold">{panelTitle(overlayPanel)}</h2></div>
              <Button aria-label={`Mantener ${panelTitle(overlayPanel)} como panel persistente`} data-tooltip="Mantener panel" onClick={promoteOverlay} size="icon" variant="ghost"><Icon name="pin" size={14} /></Button>
              <Button aria-label="Cerrar panel secundario" onClick={closeOverlay} size="icon" variant="ghost"><Icon name="close" size={15} /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{overlayContent}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
