import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { AppNavigation } from './AppNavigation'
import { CanvasPreview, type ViewportMode } from './CanvasPreview'
import { InspectorPanel, type InspectorTab } from './InspectorPanel'
import { LibraryPanel, type LibraryTab } from './LibraryPanel'
import { MobileDock, type MobilePanel } from './MobileDock'
import { TopBar } from './TopBar'
import { Button, Icon } from '../primitives'

type ResizablePanel = 'library' | 'inspector'

const panelLimits = {
  library: { min: 184, max: 320 },
  inspector: { min: 224, max: 360 },
} as const

function clampPanelWidth(panel: ResizablePanel, width: number): number {
  return Math.min(panelLimits[panel].max, Math.max(panelLimits[panel].min, width))
}

export function EditorShell() {
  const [darkMode, setDarkMode] = useState(false)
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('style')
  const [viewport, setViewport] = useState<ViewportMode>('mobile')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)
  const [libraryOpen, setLibraryOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [libraryWidth, setLibraryWidth] = useState(208)
  const [inspectorWidth, setInspectorWidth] = useState(248)
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const resizeRef = useRef<{ panel: ResizablePanel; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    return () => { delete document.documentElement.dataset.theme }
  }, [darkMode])

  useEffect(() => {
    if (!mobilePanel) return
    sheetRef.current?.focus()
  }, [mobilePanel])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent): void {
      const resize = resizeRef.current
      if (!resize) return
      const movement = event.clientX - resize.startX
      const nextWidth = clampPanelWidth(resize.panel, resize.startWidth + (resize.panel === 'library' ? movement : -movement))
      if (resize.panel === 'library') setLibraryWidth(nextWidth)
      else setInspectorWidth(nextWidth)
    }

    function handlePointerUp(): void {
      resizeRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [])

  function changeMobilePanel(panel: MobilePanel): void {
    if (panel) previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setMobilePanel(panel)
    if (panel === 'widgets' || panel === 'layers') setLibraryTab(panel)
  }

  function closeMobilePanel(): void {
    setMobilePanel(null)
    requestAnimationFrame(() => previousFocusRef.current?.focus())
  }

  function isDesktopWorkspace(): boolean {
    return window.matchMedia?.('(min-width: 64rem)').matches ?? false
  }

  function toggleLibrary(): void {
    if (isDesktopWorkspace()) setLibraryOpen((current) => !current)
    else changeMobilePanel('layers')
  }

  function toggleInspector(): void {
    if (isDesktopWorkspace()) setInspectorOpen((current) => !current)
    else changeMobilePanel('inspector')
  }

  function setPanelWidth(panel: ResizablePanel, width: number): void {
    const nextWidth = clampPanelWidth(panel, width)
    if (panel === 'library') setLibraryWidth(nextWidth)
    else setInspectorWidth(nextWidth)
  }

  function startPanelResize(panel: ResizablePanel, event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    resizeRef.current = { panel, startX: event.clientX, startWidth: panel === 'library' ? libraryWidth : inspectorWidth }
  }

  function resizePanelWithKeyboard(panel: ResizablePanel, event: KeyboardEvent<HTMLButtonElement>): void {
    const currentWidth = panel === 'library' ? libraryWidth : inspectorWidth
    if (event.key === 'Home') {
      event.preventDefault()
      setPanelWidth(panel, panelLimits[panel].min)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      setPanelWidth(panel, panelLimits[panel].max)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const physicalDirection = event.key === 'ArrowRight' ? 1 : -1
    setPanelWidth(panel, currentWidth + physicalDirection * (panel === 'library' ? 16 : -16))
  }

  function trapSheetFocus(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      closeMobilePanel()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')
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
    <div
      className="editor-shell h-dvh overflow-hidden bg-canvas text-foreground"
      style={{ '--library-width': libraryOpen ? `${libraryWidth}px` : '0px', '--inspector-width': inspectorOpen ? `${inspectorWidth}px` : '0px' } as CSSProperties}
    >
      <TopBar darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} />
      <AppNavigation />
      {libraryOpen ? (
        <div className="relative col-start-2 row-start-2 hidden min-h-0 lg:block">
          <LibraryPanel activeTab={libraryTab} className="h-full" onTabChange={setLibraryTab} />
          <button aria-label="Redimensionar panel de páginas y capas" aria-orientation="vertical" aria-valuemax={panelLimits.library.max} aria-valuemin={panelLimits.library.min} aria-valuenow={libraryWidth} className="group absolute -right-[1.375rem] inset-y-0 z-20 hidden w-11 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizePanelWithKeyboard('library', event)} onPointerDown={(event) => startPanelResize('library', event)} role="separator" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
        </div>
      ) : null}
      <CanvasPreview inspectorOpen={inspectorOpen} libraryOpen={libraryOpen} onToggleInspector={toggleInspector} onToggleLibrary={toggleLibrary} onViewportChange={setViewport} viewport={viewport} />
      {inspectorOpen ? (
        <div className="relative col-start-4 row-start-2 hidden min-h-0 lg:block">
          <InspectorPanel activeTab={inspectorTab} className="h-full" onTabChange={setInspectorTab} />
          <button aria-label="Redimensionar inspector" aria-orientation="vertical" aria-valuemax={panelLimits.inspector.max} aria-valuemin={panelLimits.inspector.min} aria-valuenow={inspectorWidth} className="group absolute -left-[1.375rem] inset-y-0 z-20 hidden w-11 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizePanelWithKeyboard('inspector', event)} onPointerDown={(event) => startPanelResize('inspector', event)} role="separator" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
        </div>
      ) : null}

      <footer className="col-span-full hidden min-h-7 items-center gap-4 border-t border-border bg-surface px-3 text-[0.6875rem] text-muted-foreground md:flex">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Guardado localmente</span>
        <span>Inicio / Hero / Encabezado</span>
        <span className="ml-auto">Sin errores · 2 sugerencias</span>
        <span className="font-heading">390 × 844 · 90%</span>
      </footer>

      <MobileDock activePanel={mobilePanel} onPanelChange={changeMobilePanel} />
      {mobilePanel ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label={mobilePanel === 'inspector' ? 'Inspector' : 'Biblioteca'} aria-modal="true">
          <button aria-label="Cerrar panel" className="absolute inset-0 cursor-pointer bg-slate-950/45 backdrop-blur-[2px]" onClick={closeMobilePanel} tabIndex={-1} type="button" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] min-h-[18rem] overflow-hidden rounded-t-2xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg outline-none" onKeyDown={trapSheetFocus} ref={sheetRef} tabIndex={-1}>
            <div className="flex min-h-14 items-center justify-between border-b border-border px-4"><div><span className="mx-auto block h-1 w-10 rounded-full bg-border" /><h2 className="mt-1 font-heading text-sm font-bold">{mobilePanel === 'inspector' ? 'Inspector' : libraryTab === 'widgets' ? 'Elementos' : 'Capas'}</h2></div><Button aria-label="Cerrar panel" onClick={closeMobilePanel} size="icon" variant="ghost"><Icon name="close" /></Button></div>
            {mobilePanel === 'inspector' ? <InspectorPanel activeTab={inspectorTab} className="h-[calc(82dvh-3.5rem)] border-0" onTabChange={setInspectorTab} /> : <LibraryPanel activeTab={libraryTab} className="h-[calc(82dvh-3.5rem)] border-0" onTabChange={setLibraryTab} />}
          </div>
        </div>
      ) : null}
    </div>
  )
}
