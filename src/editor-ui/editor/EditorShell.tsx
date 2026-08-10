import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AppNavigation } from './AppNavigation'
import { CanvasPreview, type ViewportMode } from './CanvasPreview'
import { InspectorPanel, type InspectorTab } from './InspectorPanel'
import { LibraryPanel, type LibraryTab } from './LibraryPanel'
import { MobileDock, type MobilePanel } from './MobileDock'
import { TopBar } from './TopBar'
import { Button, Icon } from '../primitives'

export function EditorShell() {
  const [darkMode, setDarkMode] = useState(false)
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('style')
  const [viewport, setViewport] = useState<ViewportMode>('mobile')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    return () => { delete document.documentElement.dataset.theme }
  }, [darkMode])

  useEffect(() => {
    if (!mobilePanel) return
    sheetRef.current?.focus()
  }, [mobilePanel])

  function changeMobilePanel(panel: MobilePanel): void {
    if (panel) previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setMobilePanel(panel)
    if (panel === 'widgets' || panel === 'layers') setLibraryTab(panel)
  }

  function closeMobilePanel(): void {
    setMobilePanel(null)
    requestAnimationFrame(() => previousFocusRef.current?.focus())
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
    <div className="editor-shell h-dvh overflow-hidden bg-canvas text-foreground">
      <TopBar darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} />
      <AppNavigation />
      <LibraryPanel activeTab={libraryTab} className="hidden xl:block" onTabChange={setLibraryTab} />
      <CanvasPreview onOpenPanel={changeMobilePanel} onViewportChange={setViewport} viewport={viewport} />
      <InspectorPanel activeTab={inspectorTab} className="hidden lg:block" onTabChange={setInspectorTab} />

      <footer className="col-span-full hidden min-h-7 items-center gap-4 border-t border-border bg-surface px-3 text-[0.6875rem] text-muted-foreground md:flex">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Guardado localmente</span>
        <span>Inicio / Hero / Encabezado</span>
        <span className="ml-auto">Sin errores · 2 sugerencias</span>
        <span className="font-heading">390 × 844 · 90%</span>
      </footer>

      <MobileDock activePanel={mobilePanel} onPanelChange={changeMobilePanel} />
      {mobilePanel ? (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-label={mobilePanel === 'inspector' ? 'Inspector' : 'Biblioteca'} aria-modal="true">
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
