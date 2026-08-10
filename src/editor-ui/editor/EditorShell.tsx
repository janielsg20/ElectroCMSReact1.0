import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { AppNavigation } from './AppNavigation'
import { CanvasPreview, type ViewportMode } from './CanvasPreview'
import { InspectorPanel, type InspectorTab } from './InspectorPanel'
import { LibraryPanel, type LibraryTab } from './LibraryPanel'
import { MobileDock, type MobilePanel } from './MobileDock'
import { PanelWindow, type PanelBounds, type PanelMode, type WorkspacePanel } from './PanelWindow'
import { TopBar } from './TopBar'
import { Button, Icon } from '../primitives'

type RestorableMode = 'docked' | 'floating'

interface WorkspacePanelState {
  readonly mode: PanelMode
  readonly restoreMode: RestorableMode
  readonly pinned: boolean
  readonly bounds: PanelBounds
}

type WorkspaceState = Record<WorkspacePanel, WorkspacePanelState>

type PointerInteraction =
  | { readonly kind: 'dock-resize'; readonly panel: WorkspacePanel; readonly startX: number; readonly startWidth: number }
  | { readonly kind: 'move' | 'window-resize'; readonly panel: WorkspacePanel; readonly startX: number; readonly startY: number; readonly startBounds: PanelBounds }

const panelLimits = {
  library: { min: 168, max: 280 },
  inspector: { min: 216, max: 320 },
} as const

const floatingLimits = {
  library: { minWidth: 220, minHeight: 260 },
  inspector: { minWidth: 240, minHeight: 280 },
} as const

const initialWorkspace: WorkspaceState = {
  library: {
    mode: 'docked',
    restoreMode: 'docked',
    pinned: false,
    bounds: { x: 60, y: 64, width: 252, height: 540 },
  },
  inspector: {
    mode: 'docked',
    restoreMode: 'docked',
    pinned: false,
    bounds: { x: 748, y: 64, width: 288, height: 580 },
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function clampPanelWidth(panel: WorkspacePanel, width: number): number {
  return clamp(width, panelLimits[panel].min, panelLimits[panel].max)
}

interface PanelContentProps {
  readonly panel: WorkspacePanel
  readonly libraryTab: LibraryTab
  readonly inspectorTab: InspectorTab
  readonly onLibraryTabChange: (tab: LibraryTab) => void
  readonly onInspectorTabChange: (tab: InspectorTab) => void
}

function PanelContent({ panel, libraryTab, inspectorTab, onLibraryTabChange, onInspectorTabChange }: PanelContentProps) {
  return panel === 'library'
    ? <LibraryPanel activeTab={libraryTab} className="h-full border-0" onTabChange={onLibraryTabChange} />
    : <InspectorPanel activeTab={inspectorTab} className="h-full border-0" onTabChange={onInspectorTabChange} />
}

export function EditorShell() {
  const [darkMode, setDarkMode] = useState(false)
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('style')
  const [viewport, setViewport] = useState<ViewportMode>('mobile')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace)
  const [libraryWidth, setLibraryWidth] = useState(192)
  const [inspectorWidth, setInspectorWidth] = useState(224)
  const [activePanel, setActivePanel] = useState<WorkspacePanel>('inspector')
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const interactionRef = useRef<PointerInteraction | null>(null)

  const libraryDocked = workspace.library.mode === 'docked'
  const inspectorDocked = workspace.inspector.mode === 'docked'
  const libraryVisible = workspace.library.mode !== 'closed' && workspace.library.mode !== 'minimized'
  const inspectorVisible = workspace.inspector.mode !== 'closed' && workspace.inspector.mode !== 'minimized'

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
      const interaction = interactionRef.current
      if (!interaction) return

      if (interaction.kind === 'dock-resize') {
        const movement = event.clientX - interaction.startX
        const nextWidth = clampPanelWidth(interaction.panel, interaction.startWidth + (interaction.panel === 'library' ? movement : -movement))
        if (interaction.panel === 'library') setLibraryWidth(nextWidth)
        else setInspectorWidth(nextWidth)
        return
      }

      setWorkspace((current) => {
        const panelState = current[interaction.panel]
        const deltaX = event.clientX - interaction.startX
        const deltaY = event.clientY - interaction.startY
        const { minWidth, minHeight } = floatingLimits[interaction.panel]
        let bounds: PanelBounds

        if (interaction.kind === 'move') {
          const maxX = window.innerWidth - interaction.startBounds.width - 8
          const maxY = window.innerHeight - interaction.startBounds.height - 28
          bounds = {
            ...interaction.startBounds,
            x: clamp(interaction.startBounds.x + deltaX, 48, maxX),
            y: clamp(interaction.startBounds.y + deltaY, 44, maxY),
          }
        } else {
          bounds = {
            ...interaction.startBounds,
            width: clamp(interaction.startBounds.width + deltaX, minWidth, window.innerWidth - interaction.startBounds.x - 8),
            height: clamp(interaction.startBounds.height + deltaY, minHeight, window.innerHeight - interaction.startBounds.y - 28),
          }
        }

        return { ...current, [interaction.panel]: { ...panelState, bounds } }
      })
    }

    function handlePointerUp(): void {
      interactionRef.current = null
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

  function updatePanel(panel: WorkspacePanel, update: (current: WorkspacePanelState) => WorkspacePanelState): void {
    setWorkspace((current) => ({ ...current, [panel]: update(current[panel]) }))
  }

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

  function togglePanel(panel: WorkspacePanel): void {
    if (!isDesktopWorkspace()) {
      changeMobilePanel(panel === 'library' ? 'layers' : 'inspector')
      return
    }
    updatePanel(panel, (current) => current.mode === 'closed' || current.mode === 'minimized'
      ? { ...current, mode: 'docked', restoreMode: 'docked' }
      : { ...current, mode: 'closed' })
  }

  function setPanelWidth(panel: WorkspacePanel, width: number): void {
    const nextWidth = clampPanelWidth(panel, width)
    if (panel === 'library') setLibraryWidth(nextWidth)
    else setInspectorWidth(nextWidth)
  }

  function startDockResize(panel: WorkspacePanel, event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    interactionRef.current = { kind: 'dock-resize', panel, startX: event.clientX, startWidth: panel === 'library' ? libraryWidth : inspectorWidth }
  }

  function resizeDockWithKeyboard(panel: WorkspacePanel, event: KeyboardEvent<HTMLButtonElement>): void {
    const currentWidth = panel === 'library' ? libraryWidth : inspectorWidth
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setPanelWidth(panel, event.key === 'Home' ? panelLimits[panel].min : panelLimits[panel].max)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    setPanelWidth(panel, currentWidth + direction * (panel === 'library' ? 16 : -16))
  }

  function fitFloatingBounds(panel: WorkspacePanel, bounds: PanelBounds): PanelBounds {
    const { minWidth, minHeight } = floatingLimits[panel]
    const width = clamp(bounds.width, minWidth, window.innerWidth - 64)
    const height = clamp(bounds.height, minHeight, window.innerHeight - 80)
    return {
      width,
      height,
      x: clamp(bounds.x, 48, window.innerWidth - width - 8),
      y: clamp(bounds.y, 44, window.innerHeight - height - 28),
    }
  }

  function floatPanel(panel: WorkspacePanel): void {
    setActivePanel(panel)
    updatePanel(panel, (current) => ({ ...current, mode: 'floating', restoreMode: 'floating', bounds: fitFloatingBounds(panel, current.bounds) }))
  }

  function dockPanel(panel: WorkspacePanel): void {
    updatePanel(panel, (current) => ({ ...current, mode: 'docked', restoreMode: 'docked', pinned: false }))
  }

  function minimizePanel(panel: WorkspacePanel): void {
    updatePanel(panel, (current) => ({
      ...current,
      mode: 'minimized',
      restoreMode: current.mode === 'floating' ? 'floating' : current.mode === 'docked' ? 'docked' : current.restoreMode,
    }))
  }

  function maximizePanel(panel: WorkspacePanel): void {
    setActivePanel(panel)
    updatePanel(panel, (current) => ({
      ...current,
      mode: 'maximized',
      restoreMode: current.mode === 'floating' ? 'floating' : current.mode === 'docked' ? 'docked' : current.restoreMode,
    }))
  }

  function restorePanel(panel: WorkspacePanel): void {
    setActivePanel(panel)
    updatePanel(panel, (current) => ({ ...current, mode: current.restoreMode }))
  }

  function closePanel(panel: WorkspacePanel): void {
    updatePanel(panel, (current) => ({ ...current, mode: 'closed', pinned: false }))
  }

  function togglePin(panel: WorkspacePanel): void {
    updatePanel(panel, (current) => ({ ...current, pinned: !current.pinned }))
  }

  function startWindowInteraction(panel: WorkspacePanel, kind: 'move' | 'window-resize', event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    event.stopPropagation()
    setActivePanel(panel)
    interactionRef.current = { kind, panel, startX: event.clientX, startY: event.clientY, startBounds: workspace[panel].bounds }
  }

  function moveWindowWithKeyboard(panel: WorkspacePanel, event: KeyboardEvent<HTMLButtonElement>): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    updatePanel(panel, (current) => {
      const step = event.shiftKey ? 32 : 16
      let { x, y } = current.bounds
      if (event.key === 'Home') ({ x, y } = { x: 48, y: 44 })
      else if (event.key === 'End') ({ x, y } = { x: window.innerWidth - current.bounds.width - 8, y: window.innerHeight - current.bounds.height - 28 })
      else if (event.key === 'ArrowLeft') x -= step
      else if (event.key === 'ArrowRight') x += step
      else if (event.key === 'ArrowUp') y -= step
      else y += step
      return { ...current, bounds: fitFloatingBounds(panel, { ...current.bounds, x, y }) }
    })
  }

  function resizeWindowWithKeyboard(panel: WorkspacePanel, event: KeyboardEvent<HTMLButtonElement>): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    updatePanel(panel, (current) => {
      const { minWidth, minHeight } = floatingLimits[panel]
      const step = event.shiftKey ? 32 : 16
      let { width, height } = current.bounds
      if (event.key === 'Home') ({ width, height } = { width: minWidth, height: minHeight })
      else if (event.key === 'End') ({ width, height } = { width: window.innerWidth - current.bounds.x - 8, height: window.innerHeight - current.bounds.y - 28 })
      else if (event.key === 'ArrowLeft') width -= step
      else if (event.key === 'ArrowRight') width += step
      else if (event.key === 'ArrowUp') height -= step
      else height += step
      return { ...current, bounds: fitFloatingBounds(panel, { ...current.bounds, width, height }) }
    })
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

  function renderPanelWindow(panel: WorkspacePanel, mode: 'docked' | 'floating' | 'maximized') {
    const panelState = workspace[panel]
    const title = panel === 'library' ? 'Páginas y capas' : 'Inspector'
    return (
      <PanelWindow
        active={activePanel === panel}
        bounds={panelState.bounds}
        mode={mode}
        onActivate={() => setActivePanel(panel)}
        onClose={() => closePanel(panel)}
        onDock={() => dockPanel(panel)}
        onFloat={() => floatPanel(panel)}
        onMaximize={() => maximizePanel(panel)}
        onMinimize={() => minimizePanel(panel)}
        onMoveKeyDown={(event) => moveWindowWithKeyboard(panel, event)}
        onMovePointerDown={(event) => startWindowInteraction(panel, 'move', event)}
        onResizeKeyDown={(event) => resizeWindowWithKeyboard(panel, event)}
        onResizePointerDown={(event) => startWindowInteraction(panel, 'window-resize', event)}
        onRestore={() => restorePanel(panel)}
        onTogglePin={() => togglePin(panel)}
        panel={panel}
        pinned={panelState.pinned}
        title={title}
      >
        <PanelContent inspectorTab={inspectorTab} libraryTab={libraryTab} onInspectorTabChange={setInspectorTab} onLibraryTabChange={setLibraryTab} panel={panel} />
      </PanelWindow>
    )
  }

  return (
    <div
      className="editor-shell h-dvh overflow-hidden bg-canvas text-foreground"
      style={{ '--library-width': libraryDocked ? `${libraryWidth}px` : '0px', '--inspector-width': inspectorDocked ? `${inspectorWidth}px` : '0px' } as CSSProperties}
    >
      <TopBar darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} />
      <AppNavigation />

      {libraryDocked ? (
        <div className="relative col-start-2 row-start-2 hidden min-h-0 lg:block">
          {renderPanelWindow('library', 'docked')}
          <button aria-label="Redimensionar panel de páginas y capas" aria-orientation="vertical" aria-valuemax={panelLimits.library.max} aria-valuemin={panelLimits.library.min} aria-valuenow={libraryWidth} className="group absolute -right-[1.375rem] inset-y-0 z-20 hidden w-11 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizeDockWithKeyboard('library', event)} onPointerDown={(event) => startDockResize('library', event)} role="separator" title="Arrastrar o usar las flechas" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-[var(--color-accent-data)] group-focus-visible:bg-[var(--color-accent-data)]" /></button>
        </div>
      ) : null}

      <CanvasPreview inspectorOpen={inspectorVisible} libraryOpen={libraryVisible} onToggleInspector={() => togglePanel('inspector')} onToggleLibrary={() => togglePanel('library')} onViewportChange={setViewport} viewport={viewport} />

      {inspectorDocked ? (
        <div className="relative col-start-4 row-start-2 hidden min-h-0 lg:block">
          {renderPanelWindow('inspector', 'docked')}
          <button aria-label="Redimensionar inspector" aria-orientation="vertical" aria-valuemax={panelLimits.inspector.max} aria-valuemin={panelLimits.inspector.min} aria-valuenow={inspectorWidth} className="group absolute -left-[1.375rem] inset-y-0 z-20 hidden w-11 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizeDockWithKeyboard('inspector', event)} onPointerDown={(event) => startDockResize('inspector', event)} role="separator" title="Arrastrar o usar las flechas" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-[var(--color-accent-ai)] group-focus-visible:bg-[var(--color-accent-ai)]" /></button>
        </div>
      ) : null}

      <div className="hidden lg:contents">
        {(['library', 'inspector'] as const).map((panel) => {
          const mode = workspace[panel].mode
          return mode === 'floating' || mode === 'maximized' ? <div className="contents" key={panel}>{renderPanelWindow(panel, mode)}</div> : null
        })}
      </div>

      <div aria-label="Paneles minimizados" className="panel-minimized-shelf fixed bottom-7 right-2 z-40 hidden items-center gap-1 lg:flex" role="toolbar">
        {workspace.library.mode === 'minimized' ? <button aria-label="Restaurar Páginas y capas" className="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-[var(--color-accent-data)]/40 bg-surface px-2 text-xs font-semibold text-[var(--color-accent-data)] shadow-md hover:bg-muted" onClick={() => restorePanel('library')} title="Restaurar Páginas y capas" type="button"><Icon name="layers" size={14} />Páginas</button> : null}
        {workspace.inspector.mode === 'minimized' ? <button aria-label="Restaurar Inspector" className="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-[var(--color-accent-ai)]/40 bg-surface px-2 text-xs font-semibold text-[var(--color-accent-ai)] shadow-md hover:bg-muted" onClick={() => restorePanel('inspector')} title="Restaurar Inspector" type="button"><Icon name="settings" size={14} />Inspector</button> : null}
      </div>

      <footer className="col-span-full hidden min-h-6 items-center gap-2 border-t border-border bg-surface px-2 text-[0.625rem] text-muted-foreground md:flex">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Guardado localmente</span>
        <span>Inicio / Hero / Encabezado</span>
        <span className="ml-auto">Ventanas personalizables · Sin errores</span>
        <span className="font-heading">390 × 844 · 90%</span>
      </footer>

      <MobileDock activePanel={mobilePanel} onPanelChange={changeMobilePanel} />
      {mobilePanel ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label={mobilePanel === 'inspector' ? 'Inspector' : 'Biblioteca'} aria-modal="true">
          <button aria-label="Cerrar panel" className="absolute inset-0 cursor-pointer bg-slate-950/45 backdrop-blur-[2px]" onClick={closeMobilePanel} tabIndex={-1} type="button" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] min-h-[18rem] overflow-hidden rounded-t-2xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg outline-none" onKeyDown={trapSheetFocus} ref={sheetRef} tabIndex={-1}>
            <div className="flex min-h-12 items-center justify-between border-b border-border px-2"><div><span className="mx-auto block h-1 w-8 rounded-full bg-border" /><h2 className="mt-0.5 font-heading text-xs font-bold">{mobilePanel === 'inspector' ? 'Inspector' : libraryTab === 'widgets' ? 'Elementos' : 'Capas'}</h2></div><Button aria-label="Cerrar panel" onClick={closeMobilePanel} size="icon" variant="ghost"><Icon name="close" /></Button></div>
            {mobilePanel === 'inspector' ? <InspectorPanel activeTab={inspectorTab} className="h-[calc(82dvh-3rem)] border-0" onTabChange={setInspectorTab} /> : <LibraryPanel activeTab={libraryTab} className="h-[calc(82dvh-3rem)] border-0" onTabChange={setLibraryTab} />}
          </div>
        </div>
      ) : null}
    </div>
  )
}
