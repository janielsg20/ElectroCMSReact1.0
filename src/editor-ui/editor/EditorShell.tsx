import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { AppNavigation } from './AppNavigation'
import { CanvasPreview, type ViewportMode } from './CanvasPreview'
import { InspectorPanel, type InspectorTab } from './InspectorPanel'
import { LibraryPanel, type LibraryTab } from './LibraryPanel'
import { MobileDock, type MobilePanel } from './MobileDock'
import { PanelWindow, type DockSide, type PanelBounds, type PanelMode, type WorkspacePanel } from './PanelWindow'
import { TopBar } from './TopBar'
import { Button, Icon } from '../primitives'

type RestorableMode = 'docked' | 'floating'

interface WorkspacePanelState {
  readonly mode: PanelMode
  readonly restoreMode: RestorableMode
  readonly dockSide: Exclude<DockSide, 'rail'>
  readonly pinned: boolean
  readonly bounds: PanelBounds
}

type WorkspaceState = Record<WorkspacePanel, WorkspacePanelState>

type PointerInteraction =
  | { readonly kind: 'nav-resize'; readonly startX: number; readonly startWidth: number }
  | { readonly kind: 'dock-resize'; readonly panel: WorkspacePanel; readonly side: Exclude<DockSide, 'rail'>; readonly startX: number; readonly startWidth: number }
  | { readonly kind: 'move' | 'window-resize'; readonly panel: WorkspacePanel; readonly startX: number; readonly startY: number; readonly startBounds: PanelBounds }

type DockTarget = DockSide | null

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
    dockSide: 'left',
    pinned: false,
    bounds: { x: 60, y: 64, width: 252, height: 540 },
  },
  inspector: {
    mode: 'docked',
    restoreMode: 'docked',
    dockSide: 'right',
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

function dockWorkspace(current: WorkspaceState, panel: WorkspacePanel, target: DockSide): WorkspaceState {
  const panelState = current[panel]
  if (target === 'rail') {
    return {
      ...current,
      [panel]: {
        ...panelState,
        mode: 'minimized',
        restoreMode: panelState.mode === 'floating' ? 'floating' : 'docked',
        pinned: false,
      },
    }
  }

  const occupant = (['library', 'inspector'] as const).find((candidate) => candidate !== panel && current[candidate].mode === 'docked' && current[candidate].dockSide === target)
  const next = { ...current }
  if (occupant) next[occupant] = { ...current[occupant], mode: 'floating', restoreMode: 'floating', pinned: false }
  next[panel] = { ...panelState, mode: 'docked', restoreMode: 'docked', dockSide: target, pinned: false }
  return next
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
  const [railWidth, setRailWidth] = useState(44)
  const [dockPreview, setDockPreview] = useState<DockTarget>(null)
  const [activePanel, setActivePanel] = useState<WorkspacePanel>('inspector')
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const interactionRef = useRef<PointerInteraction | null>(null)
  const dockTargetRef = useRef<DockTarget>(null)

  const leftDockPanel = (['library', 'inspector'] as const).find((panel) => workspace[panel].mode === 'docked' && workspace[panel].dockSide === 'left')
  const rightDockPanel = (['library', 'inspector'] as const).find((panel) => workspace[panel].mode === 'docked' && workspace[panel].dockSide === 'right')
  const leftDockWidth = leftDockPanel === 'library' ? libraryWidth : leftDockPanel === 'inspector' ? inspectorWidth : 0
  const rightDockWidth = rightDockPanel === 'library' ? libraryWidth : rightDockPanel === 'inspector' ? inspectorWidth : 0
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

      if (interaction.kind === 'nav-resize') {
        setRailWidth(clamp(interaction.startWidth + event.clientX - interaction.startX, 44, 168))
        return
      }

      if (interaction.kind === 'dock-resize') {
        const movement = event.clientX - interaction.startX
        const nextWidth = clampPanelWidth(interaction.panel, interaction.startWidth + (interaction.side === 'left' ? movement : -movement))
        if (interaction.panel === 'library') setLibraryWidth(nextWidth)
        else setInspectorWidth(nextWidth)
        return
      }

      if (interaction.kind === 'move') {
        const target: DockTarget = event.clientX <= railWidth + 34
          ? 'rail'
          : event.clientX <= Math.min(240, window.innerWidth * 0.22)
            ? 'left'
            : event.clientX >= window.innerWidth - Math.min(240, window.innerWidth * 0.22)
              ? 'right'
              : null
        dockTargetRef.current = target
        setDockPreview(target)
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
      const interaction = interactionRef.current
      const target = dockTargetRef.current
      if (interaction?.kind === 'move' && target) {
        setWorkspace((current) => dockWorkspace(current, interaction.panel, target))
      }
      interactionRef.current = null
      dockTargetRef.current = null
      setDockPreview(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [railWidth])

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
    setWorkspace((current) => current[panel].mode === 'closed' || current[panel].mode === 'minimized'
      ? dockWorkspace(current, panel, current[panel].dockSide)
      : { ...current, [panel]: { ...current[panel], mode: 'closed' } })
  }

  function setPanelWidth(panel: WorkspacePanel, width: number): void {
    const nextWidth = clampPanelWidth(panel, width)
    if (panel === 'library') setLibraryWidth(nextWidth)
    else setInspectorWidth(nextWidth)
  }

  function startDockResize(panel: WorkspacePanel, side: Exclude<DockSide, 'rail'>, event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    interactionRef.current = { kind: 'dock-resize', panel, side, startX: event.clientX, startWidth: panel === 'library' ? libraryWidth : inspectorWidth }
  }

  function resizeDockWithKeyboard(panel: WorkspacePanel, side: Exclude<DockSide, 'rail'>, event: KeyboardEvent<HTMLButtonElement>): void {
    const currentWidth = panel === 'library' ? libraryWidth : inspectorWidth
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setPanelWidth(panel, event.key === 'Home' ? panelLimits[panel].min : panelLimits[panel].max)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    setPanelWidth(panel, currentWidth + direction * (side === 'left' ? 16 : -16))
  }

  function startRailResize(event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    interactionRef.current = { kind: 'nav-resize', startX: event.clientX, startWidth: railWidth }
  }

  function resizeRailWithKeyboard(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setRailWidth(event.key === 'Home' ? 44 : 168)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setRailWidth((current) => clamp(current + (event.key === 'ArrowRight' ? 16 : -16), 44, 168))
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

  function dockPanel(panel: WorkspacePanel, side: DockSide): void {
    setWorkspace((current) => dockWorkspace(current, panel, side))
  }

  function minimizePanel(panel: WorkspacePanel): void {
    updatePanel(panel, (current) => ({
      ...current,
      mode: 'minimized',
      restoreMode: current.mode === 'floating' ? 'floating' : current.mode === 'docked' ? 'docked' : current.restoreMode,
    }))
  }

  function restorePanel(panel: WorkspacePanel): void {
    setActivePanel(panel)
    setWorkspace((current) => current[panel].restoreMode === 'docked'
      ? dockWorkspace(current, panel, current[panel].dockSide)
      : { ...current, [panel]: { ...current[panel], mode: 'floating' } })
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
    if (kind === 'move') {
      dockTargetRef.current = null
      setDockPreview(null)
    }
    interactionRef.current = { kind, panel, startX: event.clientX, startY: event.clientY, startBounds: workspace[panel].bounds }
  }

  function moveWindowWithKeyboard(panel: WorkspacePanel, event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      dockPanel(panel, event.key === 'ArrowLeft' ? 'left' : event.key === 'ArrowRight' ? 'right' : 'rail')
      return
    }
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

  function renderPanelWindow(panel: WorkspacePanel, mode: 'docked' | 'floating') {
    const panelState = workspace[panel]
    const title = panel === 'library' ? 'Páginas y capas' : 'Inspector'
    return (
      <PanelWindow
        active={activePanel === panel}
        bounds={panelState.bounds}
        dockSide={panelState.dockSide}
        mode={mode}
        onActivate={() => setActivePanel(panel)}
        onClose={() => closePanel(panel)}
        onDock={(side) => dockPanel(panel, side)}
        onFloat={() => floatPanel(panel)}
        onMinimize={() => minimizePanel(panel)}
        onMoveKeyDown={(event) => moveWindowWithKeyboard(panel, event)}
        onMovePointerDown={(event) => startWindowInteraction(panel, 'move', event)}
        onResizeKeyDown={(event) => resizeWindowWithKeyboard(panel, event)}
        onResizePointerDown={(event) => startWindowInteraction(panel, 'window-resize', event)}
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
      style={{ '--rail-width': `${railWidth}px`, '--left-panel-width': `${leftDockWidth}px`, '--right-panel-width': `${rightDockWidth}px` } as CSSProperties}
    >
      <TopBar darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} />
      <AppNavigation expanded={railWidth >= 96} onResizeKeyDown={resizeRailWithKeyboard} onResizePointerDown={startRailResize} onToggleExpanded={() => setRailWidth((current) => current >= 96 ? 44 : 144)} width={railWidth} />

      {leftDockPanel ? (
        <div className="relative col-start-2 row-start-2 hidden min-h-0 lg:block">
          {renderPanelWindow(leftDockPanel, 'docked')}
          <button aria-label={`Redimensionar ${leftDockPanel === 'library' ? 'panel de páginas y capas' : 'inspector'}`} aria-orientation="vertical" aria-valuemax={panelLimits[leftDockPanel].max} aria-valuemin={panelLimits[leftDockPanel].min} aria-valuenow={leftDockPanel === 'library' ? libraryWidth : inspectorWidth} className="group absolute -right-3 inset-y-0 z-20 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizeDockWithKeyboard(leftDockPanel, 'left', event)} onPointerDown={(event) => startDockResize(leftDockPanel, 'left', event)} role="separator" title="Arrastrar o usar las flechas" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
        </div>
      ) : null}

      <CanvasPreview inspectorOpen={inspectorVisible} libraryOpen={libraryVisible} onToggleInspector={() => togglePanel('inspector')} onToggleLibrary={() => togglePanel('library')} onViewportChange={setViewport} viewport={viewport} />

      {rightDockPanel ? (
        <div className="relative col-start-4 row-start-2 hidden min-h-0 lg:block">
          {renderPanelWindow(rightDockPanel, 'docked')}
          <button aria-label={`Redimensionar ${rightDockPanel === 'library' ? 'panel de páginas y capas' : 'inspector'}`} aria-orientation="vertical" aria-valuemax={panelLimits[rightDockPanel].max} aria-valuemin={panelLimits[rightDockPanel].min} aria-valuenow={rightDockPanel === 'library' ? libraryWidth : inspectorWidth} className="group absolute -left-3 inset-y-0 z-20 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizeDockWithKeyboard(rightDockPanel, 'right', event)} onPointerDown={(event) => startDockResize(rightDockPanel, 'right', event)} role="separator" title="Arrastrar o usar las flechas" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-[var(--color-accent-ai)] group-focus-visible:bg-[var(--color-accent-ai)]" /></button>
        </div>
      ) : null}

      <div className="hidden lg:contents">
        {(['library', 'inspector'] as const).map((panel) => {
          const mode = workspace[panel].mode
          return mode === 'floating' ? <div className="contents" key={panel}>{renderPanelWindow(panel, mode)}</div> : null
        })}
      </div>

      {workspace.library.mode === 'minimized' || workspace.inspector.mode === 'minimized' ? <div aria-label="Paneles minimizados" className="panel-minimized-shelf fixed bottom-6 right-0 top-10 z-40 hidden w-8 flex-col border-l border-border bg-surface shadow-lg lg:flex" role="toolbar">
        {workspace.library.mode === 'minimized' ? <button aria-label="Restaurar Páginas y capas" className="panel-edge-tab flex min-h-0 flex-1 cursor-pointer items-center justify-center gap-1 border-b border-[var(--color-accent-data)]/30 bg-[color-mix(in_srgb,var(--color-accent-data)_10%,var(--color-surface))] py-1 text-[0.5625rem] font-semibold text-[var(--color-accent-data)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-data)_18%,var(--color-surface))]" onClick={() => restorePanel('library')} title="Restaurar Páginas y capas" type="button"><Icon name="layers" size={13} /><span>Páginas y capas</span></button> : null}
        {workspace.inspector.mode === 'minimized' ? <button aria-label="Restaurar Inspector" className="panel-edge-tab flex min-h-0 flex-1 cursor-pointer items-center justify-center gap-1 bg-[color-mix(in_srgb,var(--color-accent-ai)_10%,var(--color-surface))] py-1 text-[0.5625rem] font-semibold text-[var(--color-accent-ai)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-ai)_18%,var(--color-surface))]" onClick={() => restorePanel('inspector')} title="Restaurar Inspector" type="button"><Icon name="settings" size={13} /><span>Inspector</span></button> : null}
      </div> : null}

      {dockPreview ? <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 hidden lg:block"><div className={`dock-preview-zone dock-preview-zone--${dockPreview}`}><Icon name={dockPreview === 'right' ? 'dock-right' : dockPreview === 'left' ? 'dock-left' : 'panel-left'} size={18} /><span>{dockPreview === 'rail' ? 'Minimizar en barra lateral' : `Acoplar a la ${dockPreview === 'left' ? 'izquierda' : 'derecha'}`}</span></div></div> : null}

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
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] min-h-[18rem] overflow-hidden rounded-t-xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg outline-none" onKeyDown={trapSheetFocus} ref={sheetRef} tabIndex={-1}>
            <div className={`flex min-h-12 items-center justify-between border-b px-2 ${mobilePanel === 'inspector' ? 'border-[var(--color-accent-ai)]/30 bg-[color-mix(in_srgb,var(--color-accent-ai)_9%,var(--color-surface))]' : 'border-[var(--color-accent-data)]/30 bg-[color-mix(in_srgb,var(--color-accent-data)_9%,var(--color-surface))]'}`}><div><span className={`mx-auto block h-1 w-8 rounded-full ${mobilePanel === 'inspector' ? 'bg-[var(--color-accent-ai)]' : 'bg-[var(--color-accent-data)]'}`} /><h2 className={`mt-0.5 flex items-center gap-1 font-heading text-[0.625rem] font-bold ${mobilePanel === 'inspector' ? 'text-[var(--color-accent-ai)]' : 'text-[var(--color-accent-data)]'}`}><Icon name={mobilePanel === 'inspector' ? 'settings' : libraryTab === 'widgets' ? 'plus' : 'layers'} size={13} />{mobilePanel === 'inspector' ? 'Inspector' : libraryTab === 'widgets' ? 'Elementos' : 'Capas'}</h2></div><Button aria-label="Cerrar panel" className={mobilePanel === 'inspector' ? 'text-[var(--color-accent-ai)]' : 'text-[var(--color-accent-data)]'} onClick={closeMobilePanel} size="icon" variant="ghost"><Icon name="close" size={16} /></Button></div>
            {mobilePanel === 'inspector' ? <InspectorPanel activeTab={inspectorTab} className="h-[calc(82dvh-3rem)] border-0" onTabChange={setInspectorTab} /> : <LibraryPanel activeTab={libraryTab} className="h-[calc(82dvh-3rem)] border-0" onTabChange={setLibraryTab} />}
          </div>
        </div>
      ) : null}
    </div>
  )
}
