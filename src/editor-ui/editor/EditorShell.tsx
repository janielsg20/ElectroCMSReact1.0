import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { AppNavigation } from './AppNavigation'
import { CanvasPreview, type ViewportMode } from './CanvasPreview'
import { InspectorPanel, type InspectorTab } from './InspectorPanel'
import { LibraryPanel, type LibraryTab } from './LibraryPanel'
import { MobileDock, type MobilePanel } from './MobileDock'
import { PanelWindow, type DockSide, type PanelBounds, type WorkspacePanel } from './PanelWindow'
import { TopBar, type UiTheme } from './TopBar'
import {
  BrowserWorkspacePreferencesStore,
  DEFAULT_CANVAS_WORKSPACE,
  EDITOR_WORKSPACE_PREFERENCES_VERSION,
  type CanvasWorkspaceState,
  type WorkspacePanelState,
  type WorkspaceState,
} from './workspace-preferences'
import { Button, Icon } from '../primitives'
import { getEditorThemePreset } from '../theme/editor-presets'

type PointerInteraction =
  | { readonly kind: 'nav-resize'; readonly startX: number; readonly startWidth: number }
  | { readonly kind: 'dock-resize'; readonly panel: WorkspacePanel; readonly side: Exclude<DockSide, 'rail'>; readonly startX: number; readonly startWidth: number }
  | { readonly kind: 'move' | 'window-resize'; readonly panel: WorkspacePanel; readonly startX: number; readonly startY: number; readonly startBounds: PanelBounds }

type DockTarget = DockSide | null

const panelLimits = {
  library: { min: 184, max: 300 },
  inspector: { min: 248, max: 360 },
} as const

const floatingLimits = {
  library: { minWidth: 232, minHeight: 260 },
  inspector: { minWidth: 268, minHeight: 280 },
} as const

const initialWorkspace: WorkspaceState = {
  library: {
    mode: 'docked',
    restoreMode: 'docked',
    dockSide: 'left',
    pinned: false,
    bounds: { x: 60, y: 64, width: 268, height: 540 },
  },
  inspector: {
    mode: 'docked',
    restoreMode: 'docked',
    dockSide: 'right',
    pinned: false,
    bounds: { x: 748, y: 64, width: 304, height: 580 },
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function clampPanelWidth(panel: WorkspacePanel, width: number): number {
  return clamp(width, panelLimits[panel].min, panelLimits[panel].max)
}

function fitBoundsToViewport(panel: WorkspacePanel, bounds: PanelBounds, railWidth: number, viewportWidth: number, viewportHeight: number): PanelBounds {
  const { minWidth, minHeight } = floatingLimits[panel]
  const width = clamp(bounds.width, minWidth, viewportWidth - 64)
  const height = clamp(bounds.height, minHeight, viewportHeight - 80)
  return {
    width,
    height,
    x: clamp(bounds.x, railWidth + 8, viewportWidth - width - 8),
    y: clamp(bounds.y, 44, viewportHeight - height - 28),
  }
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
  const [uiTheme, setUiTheme] = useState<UiTheme>('high-density')
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('layers')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('properties')
  const [viewport, setViewport] = useState<ViewportMode>('mobile')
  const [canvasWorkspace, setCanvasWorkspace] = useState<CanvasWorkspaceState>(DEFAULT_CANVAS_WORKSPACE)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace)
  const [libraryWidth, setLibraryWidth] = useState(216)
  const [inspectorWidth, setInspectorWidth] = useState(288)
  const [railWidth, setRailWidth] = useState(44)
  const [panelOrder, setPanelOrder] = useState<readonly WorkspacePanel[]>(['library', 'inspector'])
  const [dockPreview, setDockPreview] = useState<DockTarget>(null)
  const [draggingPanel, setDraggingPanel] = useState<WorkspacePanel | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const interactionRef = useRef<PointerInteraction | null>(null)
  const dockTargetRef = useRef<DockTarget>(null)
  const workspacePreferencesRef = useRef<BrowserWorkspacePreferencesStore | null>(null)
  const workspacePreferencesHydratedRef = useRef(false)

  const activePanel = panelOrder[panelOrder.length - 1] ?? 'inspector'
  const leftDockPanel = (['library', 'inspector'] as const).find((panel) => workspace[panel].mode === 'docked' && workspace[panel].dockSide === 'left')
  const rightDockPanel = (['library', 'inspector'] as const).find((panel) => workspace[panel].mode === 'docked' && workspace[panel].dockSide === 'right')
  const leftDockWidth = leftDockPanel === 'library' ? libraryWidth : leftDockPanel === 'inspector' ? inspectorWidth : 0
  const rightDockWidth = rightDockPanel === 'library' ? libraryWidth : rightDockPanel === 'inspector' ? inspectorWidth : 0
  const libraryVisible = workspace.library.mode !== 'minimized'
  const inspectorVisible = workspace.inspector.mode !== 'minimized'

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    return () => { delete document.documentElement.dataset.theme }
  }, [darkMode])

  useLayoutEffect(() => {
    const preset = getEditorThemePreset(uiTheme)
    document.documentElement.dataset.uiPreset = preset.id
    document.documentElement.dataset.uiTheme = preset.layout
    return () => {
      delete document.documentElement.dataset.uiPreset
      delete document.documentElement.dataset.uiTheme
    }
  }, [uiTheme])

  useEffect(() => {
    const store = new BrowserWorkspacePreferencesStore(window.localStorage)
    workspacePreferencesRef.current = store
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return
      const saved = store.load()
      if (saved) {
        const restoredRailWidth = clamp(saved.railWidth, 44, 168)
        setRailWidth(restoredRailWidth)
        setLibraryWidth(clampPanelWidth('library', saved.libraryWidth))
        setInspectorWidth(clampPanelWidth('inspector', saved.inspectorWidth))
        setPanelOrder(saved.panelOrder)
        setCanvasWorkspace(saved.canvas)
        setViewport(saved.canvas.viewport)
        setWorkspace({
          library: {
            ...saved.workspace.library,
            pinned: saved.workspace.library.mode === 'floating' && saved.workspace.library.pinned,
            bounds: fitBoundsToViewport('library', saved.workspace.library.bounds, restoredRailWidth, window.innerWidth, window.innerHeight),
          },
          inspector: {
            ...saved.workspace.inspector,
            pinned: saved.workspace.inspector.mode === 'floating' && saved.workspace.inspector.pinned,
            bounds: fitBoundsToViewport('inspector', saved.workspace.inspector.bounds, restoredRailWidth, window.innerWidth, window.innerHeight),
          },
        })
      } else {
        store.save({
          schemaVersion: EDITOR_WORKSPACE_PREFERENCES_VERSION,
          canvas: DEFAULT_CANVAS_WORKSPACE,
          railWidth: 44,
          libraryWidth: 216,
          inspectorWidth: 288,
          workspace: initialWorkspace,
          panelOrder: ['library', 'inspector'],
        })
      }
      workspacePreferencesHydratedRef.current = true
    })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!workspacePreferencesHydratedRef.current) return
    workspacePreferencesRef.current?.save({
      schemaVersion: EDITOR_WORKSPACE_PREFERENCES_VERSION,
      railWidth,
      libraryWidth,
      inspectorWidth,
      workspace,
      panelOrder,
      canvas: { ...canvasWorkspace, viewport },
    })
  }, [railWidth, libraryWidth, inspectorWidth, workspace, panelOrder, canvasWorkspace, viewport])

  useEffect(() => {
    if (!mobilePanel) return
    sheetRef.current?.focus()
  }, [mobilePanel])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent): void {
      const interaction = interactionRef.current
      if (!interaction) return
      const clientX = Number.isFinite(event.clientX) ? event.clientX : interaction.startX
      const clientY = interaction.kind === 'nav-resize' || interaction.kind === 'dock-resize'
        ? 0
        : Number.isFinite(event.clientY) ? event.clientY : interaction.startY

      if (interaction.kind === 'nav-resize') {
        setRailWidth(clamp(interaction.startWidth + clientX - interaction.startX, 44, 168))
        return
      }

      if (interaction.kind === 'dock-resize') {
        const movement = clientX - interaction.startX
        const nextWidth = clampPanelWidth(interaction.panel, interaction.startWidth + (interaction.side === 'left' ? movement : -movement))
        if (interaction.panel === 'library') setLibraryWidth(nextWidth)
        else setInspectorWidth(nextWidth)
        return
      }

      if (interaction.kind === 'move') {
        const deltaX = clientX - interaction.startX
        const deltaY = clientY - interaction.startY
        if (Math.hypot(deltaX, deltaY) < 4) return
        setDraggingPanel(interaction.panel)
        const target: DockTarget = clientX <= railWidth + 34
          ? 'rail'
          : clientX <= Math.min(240, window.innerWidth * 0.22)
            ? 'left'
            : clientX >= window.innerWidth - Math.min(240, window.innerWidth * 0.22)
              ? 'right'
              : null
        dockTargetRef.current = target
        setDockPreview(target)
      }

      setWorkspace((current) => {
        const panelState = current[interaction.panel]
        const deltaX = clientX - interaction.startX
        const deltaY = clientY - interaction.startY
        const { minWidth, minHeight } = floatingLimits[interaction.panel]
        let bounds: PanelBounds

        if (interaction.kind === 'move') {
          const maxX = window.innerWidth - interaction.startBounds.width - 8
          const maxY = window.innerHeight - interaction.startBounds.height - 28
          bounds = {
            ...interaction.startBounds,
            x: clamp(interaction.startBounds.x + deltaX, railWidth + 8, maxX),
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
      setDraggingPanel(null)
    }

    function handlePointerCancel(): void {
      const interaction = interactionRef.current
      if (interaction?.kind === 'nav-resize') {
        setRailWidth(interaction.startWidth)
      } else if (interaction?.kind === 'dock-resize') {
        if (interaction.panel === 'library') setLibraryWidth(interaction.startWidth)
        else setInspectorWidth(interaction.startWidth)
      } else if (interaction) {
        setWorkspace((current) => ({
          ...current,
          [interaction.panel]: { ...current[interaction.panel], bounds: interaction.startBounds },
        }))
      }
      interactionRef.current = null
      dockTargetRef.current = null
      setDockPreview(null)
      setDraggingPanel(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [railWidth])

  function activatePanel(panel: WorkspacePanel): void {
    setPanelOrder((current) => [...current.filter((candidate) => candidate !== panel), panel])
  }

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
    activatePanel(panel)
    setWorkspace((current) => current[panel].mode === 'minimized'
      ? dockWorkspace(current, panel, current[panel].dockSide)
      : { ...current, [panel]: { ...current[panel], mode: 'minimized', restoreMode: current[panel].mode === 'floating' ? 'floating' : 'docked', pinned: false } })
  }

  function setPanelWidth(panel: WorkspacePanel, width: number): void {
    const nextWidth = clampPanelWidth(panel, width)
    if (panel === 'library') setLibraryWidth(nextWidth)
    else setInspectorWidth(nextWidth)
  }

  function startDockResize(panel: WorkspacePanel, side: Exclude<DockSide, 'rail'>, event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    interactionRef.current = { kind: 'dock-resize', panel, side, startX: Number.isFinite(event.clientX) ? event.clientX : 0, startWidth: panel === 'library' ? libraryWidth : inspectorWidth }
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
    interactionRef.current = { kind: 'nav-resize', startX: Number.isFinite(event.clientX) ? event.clientX : 0, startWidth: railWidth }
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
    return fitBoundsToViewport(panel, bounds, railWidth, window.innerWidth, window.innerHeight)
  }

  function floatPanel(panel: WorkspacePanel): void {
    activatePanel(panel)
    updatePanel(panel, (current) => ({ ...current, mode: 'floating', restoreMode: 'floating', bounds: fitFloatingBounds(panel, current.bounds) }))
  }

  function dockPanel(panel: WorkspacePanel, side: DockSide): void {
    activatePanel(panel)
    setWorkspace((current) => dockWorkspace(current, panel, side))
  }

  function minimizePanel(panel: WorkspacePanel): void {
    updatePanel(panel, (current) => ({
      ...current,
      mode: 'minimized',
      restoreMode: current.mode === 'floating' ? 'floating' : current.mode === 'docked' ? 'docked' : current.restoreMode,
      pinned: false,
    }))
  }

  function restorePanel(panel: WorkspacePanel): void {
    activatePanel(panel)
    setWorkspace((current) => current[panel].restoreMode === 'docked'
      ? dockWorkspace(current, panel, current[panel].dockSide)
      : { ...current, [panel]: { ...current[panel], mode: 'floating' } })
  }

  function togglePin(panel: WorkspacePanel): void {
    activatePanel(panel)
    updatePanel(panel, (current) => ({ ...current, pinned: !current.pinned }))
  }

  function startWindowInteraction(panel: WorkspacePanel, kind: 'move' | 'window-resize', event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault()
    event.stopPropagation()
    activatePanel(panel)
    if (kind === 'move') {
      dockTargetRef.current = null
      setDockPreview(null)
    }
    interactionRef.current = {
      kind,
      panel,
      startX: Number.isFinite(event.clientX) ? event.clientX : 0,
      startY: Number.isFinite(event.clientY) ? event.clientY : 0,
      startBounds: workspace[panel].bounds,
    }
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
      if (event.key === 'Home') ({ x, y } = { x: railWidth + 8, y: 44 })
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
        onActivate={() => activatePanel(panel)}
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
      <TopBar darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} onUiThemeChange={setUiTheme} uiTheme={uiTheme} />
      <AppNavigation expanded={railWidth >= 96} onResizeKeyDown={resizeRailWithKeyboard} onResizePointerDown={startRailResize} onToggleExpanded={() => setRailWidth((current) => current >= 96 ? 44 : 144)} width={railWidth} />

      <>
          {leftDockPanel ? (
            <div className="relative col-start-2 row-start-2 hidden min-h-0 lg:block">
              {renderPanelWindow(leftDockPanel, 'docked')}
              <button aria-label={`Redimensionar ${leftDockPanel === 'library' ? 'panel de páginas y capas' : 'inspector'}`} aria-orientation="vertical" aria-valuemax={panelLimits[leftDockPanel].max} aria-valuemin={panelLimits[leftDockPanel].min} aria-valuenow={leftDockPanel === 'library' ? libraryWidth : inspectorWidth} className="group absolute -right-3 inset-y-0 z-20 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizeDockWithKeyboard(leftDockPanel, 'left', event)} onPointerDown={(event) => startDockResize(leftDockPanel, 'left', event)} role="separator" title="Arrastrar o usar las flechas" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
            </div>
          ) : null}

          <CanvasPreview canvasWorkspace={canvasWorkspace} inspectorOpen={inspectorVisible} libraryOpen={libraryVisible} onCanvasWorkspaceChange={setCanvasWorkspace} onToggleInspector={() => togglePanel('inspector')} onToggleLibrary={() => togglePanel('library')} onViewportChange={setViewport} viewport={viewport} />

          {rightDockPanel ? (
            <div className="relative col-start-4 row-start-2 hidden min-h-0 lg:block">
              {renderPanelWindow(rightDockPanel, 'docked')}
              <button aria-label={`Redimensionar ${rightDockPanel === 'library' ? 'panel de páginas y capas' : 'inspector'}`} aria-orientation="vertical" aria-valuemax={panelLimits[rightDockPanel].max} aria-valuemin={panelLimits[rightDockPanel].min} aria-valuenow={rightDockPanel === 'library' ? libraryWidth : inspectorWidth} className="group absolute -left-3 inset-y-0 z-20 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={(event) => resizeDockWithKeyboard(rightDockPanel, 'right', event)} onPointerDown={(event) => startDockResize(rightDockPanel, 'right', event)} role="separator" title="Arrastrar o usar las flechas" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
            </div>
          ) : null}

          <div className="hidden lg:contents">
            {panelOrder.map((panel) => {
              const mode = workspace[panel].mode
              return mode === 'floating' ? <div className="contents" key={panel}>{renderPanelWindow(panel, mode)}</div> : null
            })}
          </div>

          {workspace.library.mode === 'minimized' || workspace.inspector.mode === 'minimized' ? <div aria-label="Paneles minimizados" className="panel-minimized-shelf fixed bottom-6 right-0 top-10 z-40 hidden w-8 flex-col border-l border-border bg-surface shadow-lg lg:flex" role="toolbar">
            {panelOrder.map((panel) => workspace[panel].mode === 'minimized' ? (
              <button aria-label={`Restaurar ${panel === 'library' ? 'Páginas y capas' : 'Inspector'}`} className="panel-edge-tab flex min-h-0 flex-1 cursor-pointer items-center justify-center gap-1 border-b border-primary/30 bg-primary-soft py-1 text-xs font-semibold text-primary-strong transition-colors last:border-b-0 hover:bg-primary hover:text-on-primary" key={panel} onClick={() => restorePanel(panel)} title={`Restaurar ${panel === 'library' ? 'Páginas y capas' : 'Inspector'}`} type="button"><Icon name={panel === 'library' ? 'layers' : 'settings'} size={13} /><span>{panel === 'library' ? 'Páginas y capas' : 'Inspector'}</span></button>
            ) : null)}
          </div> : null}

          {draggingPanel ? <div aria-live="polite" className="dock-guide pointer-events-none fixed inset-0 z-50 hidden lg:block"><div className={`dock-preview-zone dock-preview-zone--rail ${dockPreview === 'rail' ? 'dock-preview-zone--active' : ''}`}><Icon name="panel-left" size={18} /><span>Barra lateral</span></div><div className={`dock-preview-zone dock-preview-zone--left ${dockPreview === 'left' ? 'dock-preview-zone--active' : ''}`}><Icon name="dock-left" size={18} /><span>Acoplar a la izquierda</span></div><div className={`dock-preview-zone dock-preview-zone--right ${dockPreview === 'right' ? 'dock-preview-zone--active' : ''}`}><Icon name="dock-right" size={18} /><span>Acoplar a la derecha</span></div></div> : null}
      </>

      <footer className="app-statusbar col-span-full hidden min-h-6 items-center gap-2 border-t border-border bg-surface px-2 text-[0.625rem] text-muted-foreground md:flex">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Guardado localmente</span>
        <span>Editor / Página inicial</span>
        <span className="ml-auto">Workspace persistente</span>
        <span className="font-heading">Canvas local</span>
      </footer>

      <MobileDock activePanel={mobilePanel} onPanelChange={changeMobilePanel} />
      {mobilePanel ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label={mobilePanel === 'inspector' ? 'Inspector' : 'Biblioteca'} aria-modal="true">
          <button aria-label="Ocultar panel" className="absolute inset-0 cursor-pointer bg-slate-950/45 backdrop-blur-[2px]" onClick={closeMobilePanel} tabIndex={-1} type="button" />
          <div className="mobile-sheet absolute inset-x-0 bottom-0 max-h-[82dvh] min-h-[18rem] overflow-hidden rounded-t-xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg outline-none" onKeyDown={trapSheetFocus} ref={sheetRef} tabIndex={-1}>
            <div className="flex min-h-12 items-center justify-between border-b border-primary/25 bg-primary-soft px-2"><div><span className="mx-auto block h-1 w-10 rounded-full bg-primary/35" aria-hidden="true" /><h2 className="mt-1 text-xs font-bold text-primary-strong">{mobilePanel === 'inspector' ? 'Inspector' : mobilePanel === 'widgets' ? 'Widgets' : 'Capas'}</h2></div><Button aria-label="Cerrar panel" onClick={closeMobilePanel} size="icon" variant="ghost"><Icon name="close" size={16} /></Button></div>
            <div className="min-h-0 max-h-[calc(82dvh-3rem)] overflow-y-auto">
              {mobilePanel === 'inspector' ? <InspectorPanel activeTab={inspectorTab} className="h-full border-0" onTabChange={setInspectorTab} /> : <LibraryPanel activeTab={mobilePanel} className="h-full border-0" onTabChange={setLibraryTab} />}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
