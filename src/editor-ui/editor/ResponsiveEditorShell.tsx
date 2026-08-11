import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Button, Icon } from '../primitives'
import { EditorShell } from './EditorShell'
import { InspectorPanel, type InspectorTab } from './InspectorPanel'
import { LibraryPanel, type LibraryTab } from './LibraryPanel'
import './responsive-mobile-shell.css'
import './responsive-tablet-shell.css'

type TabletPanel = 'library' | 'inspector'

interface OverlayResizeState {
  readonly startX: number
  readonly startWidth: number
}

const TABLET_MIN_WIDTH = 768
const DESKTOP_MIN_WIDTH = 1024
const TABLET_OVERLAY_MIN = 280
const TABLET_OVERLAY_MAX = 420

function isMobileViewport(): boolean {
  return window.innerWidth < TABLET_MIN_WIDTH
}

function isTabletViewport(): boolean {
  return window.innerWidth >= TABLET_MIN_WIDTH && window.innerWidth < DESKTOP_MIN_WIDTH
}

function clampOverlayWidth(width: number): number {
  const available = Math.max(TABLET_OVERLAY_MIN, window.innerWidth - 44 - 160)
  return Math.min(Math.max(width, TABLET_OVERLAY_MIN), Math.min(TABLET_OVERLAY_MAX, available))
}

function panelTitle(panel: TabletPanel): string {
  return panel === 'library' ? 'Páginas y capas' : 'Inspector'
}

export function ResponsiveEditorShell() {
  const [mobileViewport, setMobileViewport] = useState(() => isMobileViewport())
  const [tabletViewport, setTabletViewport] = useState(() => isTabletViewport())
  const [editorVisible, setEditorVisible] = useState(true)
  const [persistentPanel, setPersistentPanel] = useState<TabletPanel>('library')
  const [overlayPanel, setOverlayPanel] = useState<TabletPanel | null>(null)
  const [overlayWidth, setOverlayWidth] = useState(320)
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('style')
  const frameRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const overlayResizeRef = useRef<OverlayResizeState | null>(null)

  const tabletActive = tabletViewport && editorVisible
  const persistentWidth = window.innerWidth >= 900 ? 248 : 232
  const secondaryPanel: TabletPanel = persistentPanel === 'library' ? 'inspector' : 'library'
  const secondaryTitle = panelTitle(secondaryPanel)

  const closeOverlay = useCallback((): void => {
    setOverlayPanel(null)
    requestAnimationFrame(() => previousFocusRef.current?.focus())
  }, [])

  useEffect(() => {
    function handleResize(): void {
      const nextMobile = isMobileViewport()
      const nextTablet = isTabletViewport()
      setMobileViewport(nextMobile)
      setTabletViewport(nextTablet)
      setOverlayWidth((current) => clampOverlayWidth(current))
      if (!nextTablet && overlayPanel) closeOverlay()
      if (!nextMobile) {
        frameRef.current?.querySelector<HTMLButtonElement>('.mobile-sheet button[aria-label="Cerrar panel"]')?.click()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [closeOverlay, overlayPanel])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    function updateEditorVisibility(): void {
      const nextVisible = Boolean(frame?.querySelector('#editor-canvas'))
      setEditorVisible(nextVisible)
      if (!nextVisible && overlayPanel) closeOverlay()
    }

    const observer = new MutationObserver(updateEditorVisibility)
    observer.observe(frame, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [closeOverlay, overlayPanel])

  useEffect(() => {
    if (!overlayPanel || !tabletActive) return
    requestAnimationFrame(() => overlayRef.current?.focus())
  }, [overlayPanel, tabletActive])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent): void {
      const resize = overlayResizeRef.current
      if (!resize) return
      setOverlayWidth(clampOverlayWidth(resize.startWidth + resize.startX - event.clientX))
    }

    function finishResize(): void {
      overlayResizeRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishResize)
    window.addEventListener('pointercancel', finishResize)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishResize)
      window.removeEventListener('pointercancel', finishResize)
    }
  }, [])

  function openOverlay(panel: TabletPanel): void {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOverlayPanel(panel)
  }

  function promoteOverlay(): void {
    if (!overlayPanel) return
    setPersistentPanel(overlayPanel)
    closeOverlay()
  }

  function changePersistentPanel(panel: TabletPanel): void {
    setPersistentPanel(panel)
    if (overlayPanel === panel) closeOverlay()
  }

  function startOverlayResize(event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    overlayResizeRef.current = { startX: event.clientX, startWidth: overlayWidth }
  }

  function resizeOverlayWithKeyboard(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setOverlayWidth(event.key === 'Home' ? TABLET_OVERLAY_MIN : clampOverlayWidth(TABLET_OVERLAY_MAX))
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setOverlayWidth((current) => clampOverlayWidth(current + (event.key === 'ArrowLeft' ? 16 : -16)))
  }

  function trapOverlayFocus(event: KeyboardEvent<HTMLElement>): void {
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

    if (document.activeElement === overlayRef.current) {
      event.preventDefault()
      const target = event.shiftKey ? last : first
      target.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function renderPanel(panel: TabletPanel) {
    return panel === 'library'
      ? <LibraryPanel activeTab={libraryTab} className="h-full border-0" onTabChange={setLibraryTab} />
      : <InspectorPanel activeTab={inspectorTab} className="h-full border-0" onTabChange={setInspectorTab} />
  }

  return (
    <div
      className="m04-tablet-shell"
      data-mobile-shell={mobileViewport ? 'active' : 'inactive'}
      data-tablet-shell={tabletActive ? 'active' : 'inactive'}
      ref={frameRef}
      style={{ '--tablet-context-width': `${persistentWidth}px` } as CSSProperties}
    >
      <EditorShell />

      {tabletActive ? (
        <aside aria-label="Panel contextual persistente de tablet" className="tablet-context-panel">
          <div className="tablet-context-panel__header">
            <div className="min-w-0">
              <span className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Tablet</span>
              <h2 className="truncate text-xs font-bold text-foreground">{panelTitle(persistentPanel)}</h2>
            </div>
            <Button aria-label={`Abrir ${secondaryTitle} como panel secundario`} onClick={() => openOverlay(secondaryPanel)} size="icon" variant="ghost"><Icon name={secondaryPanel === 'library' ? 'layers' : 'settings'} size={15} /></Button>
          </div>
          <div aria-label="Elegir panel persistente" className="tablet-context-panel__switcher" role="group">
            <button aria-pressed={persistentPanel === 'library'} onClick={() => changePersistentPanel('library')} type="button"><Icon name="layers" size={13} /><span>Capas</span></button>
            <button aria-pressed={persistentPanel === 'inspector'} onClick={() => changePersistentPanel('inspector')} type="button"><Icon name="settings" size={13} /><span>Props</span></button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{renderPanel(persistentPanel)}</div>
        </aside>
      ) : null}

      {tabletActive && overlayPanel ? (
        <div className="tablet-secondary-overlay">
          <button aria-label="Cerrar panel secundario" className="tablet-secondary-overlay__backdrop" onClick={closeOverlay} tabIndex={-1} type="button" />
          <section
            aria-label={`${panelTitle(overlayPanel)} · panel secundario`}
            aria-modal="true"
            className="tablet-secondary-overlay__panel"
            onKeyDown={trapOverlayFocus}
            ref={overlayRef}
            role="dialog"
            style={{ width: `${overlayWidth}px` }}
            tabIndex={-1}
          >
            <button
              aria-label={`Redimensionar ${panelTitle(overlayPanel)} secundario`}
              aria-orientation="vertical"
              aria-valuemax={clampOverlayWidth(TABLET_OVERLAY_MAX)}
              aria-valuemin={TABLET_OVERLAY_MIN}
              aria-valuenow={overlayWidth}
              className="tablet-secondary-overlay__resize"
              onKeyDown={resizeOverlayWithKeyboard}
              onPointerDown={startOverlayResize}
              role="separator"
              title="Arrastrar o usar flechas; Inicio/Fin para límites"
              type="button"
            ><span /></button>
            <div className="tablet-secondary-overlay__header">
              <div className="min-w-0 flex-1"><span className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Panel secundario</span><h2 className="truncate text-xs font-bold">{panelTitle(overlayPanel)}</h2></div>
              <Button aria-label={`Fijar ${panelTitle(overlayPanel)} como panel persistente`} onClick={promoteOverlay} size="small" variant="secondary"><Icon name="pin" size={13} />Fijar</Button>
              <Button aria-label="Cerrar panel secundario" onClick={closeOverlay} size="icon" variant="ghost"><Icon name="close" size={15} /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{renderPanel(overlayPanel)}</div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
