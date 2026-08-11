import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Button, Icon } from '../primitives'
import { DEFAULT_BREAKPOINTS, type BreakpointId, type NodeId } from '../../domain'
import { CanonicalProjectRenderer } from '../../renderers'
import { DirectManipulationFrame } from './DirectManipulationFrame'
import { DirectManipulationMenu } from './DirectManipulationMenu'
import { DirectManipulationContext, type MenuPosition } from './direct-manipulation-context'
import { selectionBreadcrumbs } from './direct-manipulation-model'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId, useEditorSelection } from './editor-project-context'
import { fitCanvas, stepCanvasZoom, updateCanvasPan } from './canvas-viewport'
import { DEFAULT_CANVAS_WORKSPACE, type CanvasWorkspaceState } from './workspace-preferences'
import './direct-manipulation.css'

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

interface CanvasPreviewProps {
  readonly canvasWorkspace?: CanvasWorkspaceState
  readonly viewport: ViewportMode
  readonly onViewportChange: (viewport: ViewportMode) => void
  readonly onToggleLibrary: () => void
  readonly onToggleInspector: () => void
  readonly libraryOpen: boolean
  readonly inspectorOpen: boolean
  readonly onCanvasWorkspaceChange?: (state: CanvasWorkspaceState) => void
}

interface DeviceProfile {
  readonly height: number
  readonly width: number
}

const portraitProfiles: Record<ViewportMode, DeviceProfile> = {
  desktop: { height: 720, width: 940 },
  tablet: { height: 920, width: 700 },
  mobile: { height: 844, width: 390 },
}

function deviceProfile(viewport: ViewportMode, orientation: CanvasWorkspaceState['orientation']): DeviceProfile {
  const profile = portraitProfiles[viewport]
  return orientation === 'landscape' && viewport !== 'desktop'
    ? { height: profile.width, width: profile.height }
    : profile
}

const viewportLabels: Record<ViewportMode, string> = {
  desktop: 'Escritorio · 1440',
  tablet: 'Tablet · 768',
  mobile: 'Móvil · 390',
}

function breakpointIdAt(index: number): BreakpointId {
  const breakpoint = DEFAULT_BREAKPOINTS[index]
  if (!breakpoint) throw new Error(`Falta el breakpoint predeterminado ${index}.`)
  return breakpoint.id
}

const viewportBreakpoints: Record<ViewportMode, BreakpointId> = {
  desktop: breakpointIdAt(0),
  tablet: breakpointIdAt(3),
  mobile: breakpointIdAt(4),
}

interface PanInteraction {
  readonly originX: number
  readonly originY: number
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
}

export function CanvasPreview({ canvasWorkspace: controlledCanvasWorkspace, viewport, onCanvasWorkspaceChange, onViewportChange, onToggleLibrary, onToggleInspector, libraryOpen, inspectorOpen }: CanvasPreviewProps) {
  const { documentId, store } = useEditorProject()
  const structure = useEditorProjectStructure()
  const selection = useEditorSelection()
  const selectedNodeId = useEditorSelectedNodeId()
  const [contextMenu, setContextMenu] = useState<{ readonly nodeId: NodeId; readonly position: MenuPosition } | null>(null)
  const [status, setStatus] = useState('')
  const [localCanvasWorkspace, setLocalCanvasWorkspace] = useState<CanvasWorkspaceState>(DEFAULT_CANVAS_WORKSPACE)
  const panInteractionRef = useRef<PanInteraction | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasWorkspace = controlledCanvasWorkspace ?? localCanvasWorkspace
  const isDevice = viewport !== 'desktop'
  const profile = deviceProfile(viewport, canvasWorkspace.orientation)
  const scale = canvasWorkspace.zoom / 100
  const breakpointId = viewportBreakpoints[viewport]
  const activeDocument = structure.documents[documentId]
  const breadcrumbs = useMemo(
    () => activeDocument ? selectionBreadcrumbs(activeDocument, selectedNodeId) : [],
    [activeDocument, selectedNodeId],
  )
  const manipulation = useMemo(() => ({
    announce: setStatus,
    breakpointId,
    openContextMenu(nodeId: NodeId, position: MenuPosition) {
      setContextMenu({ nodeId, position })
    },
  }), [breakpointId])

  function commitCanvasWorkspace(next: CanvasWorkspaceState): void {
    if (onCanvasWorkspaceChange) onCanvasWorkspaceChange(next)
    else setLocalCanvasWorkspace(next)
  }

  function changeViewport(mode: ViewportMode): void {
    onViewportChange(mode)
    commitCanvasWorkspace({ ...canvasWorkspace, panX: 0, panY: 0, viewport: mode })
  }

  function focusEditorRegion(region: 'layers' | 'canvas' | 'inspector'): void {
    if (region === 'canvas') {
      viewportRef.current?.focus()
      setStatus('Foco en el viewport del canvas.')
      return
    }
    const panelLabel = region === 'layers' ? 'Biblioteca y capas' : 'Inspector de propiedades'
    const open = region === 'layers' ? libraryOpen : inspectorOpen
    if (!open) (region === 'layers' ? onToggleLibrary : onToggleInspector)()
    requestAnimationFrame(() => {
      const panel = document.querySelector<HTMLElement>(`[aria-label="${panelLabel}"]`)
      const target = panel?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])') ?? panel
      target?.focus()
      setStatus(`Foco en ${region === 'layers' ? 'Capas' : 'Inspector'}.`)
    })
  }

  function handleViewportKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.altKey && ['1', '2', '3'].includes(event.key)) {
      event.preventDefault()
      focusEditorRegion(event.key === '1' ? 'layers' : event.key === '2' ? 'canvas' : 'inspector')
      return
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      commitCanvasWorkspace({ ...canvasWorkspace, zoom: stepCanvasZoom(canvasWorkspace.zoom, 1) })
      return
    }
    if (event.key === '-') {
      event.preventDefault()
      commitCanvasWorkspace({ ...canvasWorkspace, zoom: stepCanvasZoom(canvasWorkspace.zoom, -1) })
      return
    }
    if (event.key === '0') {
      event.preventDefault()
      commitCanvasWorkspace(fitCanvas(canvasWorkspace))
      return
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      const step = event.shiftKey ? 96 : 32
      commitCanvasWorkspace(updateCanvasPan(
        canvasWorkspace,
        event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
        event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
      ))
    }
  }

  function beginPan(event: ReactPointerEvent<HTMLDivElement>): void {
    if (canvasWorkspace.tool !== 'pan' || event.button !== 0) return
    const target = event.target
    if (target instanceof Element && target.closest('button, input, select, textarea, a')) return
    event.preventDefault()
    panInteractionRef.current = {
      originX: canvasWorkspace.panX,
      originY: canvasWorkspace.panY,
      pointerId: event.pointerId,
      startX: Number.isFinite(event.clientX) ? event.clientX : 0,
      startY: Number.isFinite(event.clientY) ? event.clientY : 0,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function continuePan(event: ReactPointerEvent<HTMLDivElement>): void {
    const interaction = panInteractionRef.current
    if (!interaction || interaction.pointerId !== event.pointerId) return
    commitCanvasWorkspace(updateCanvasPan(
      { ...canvasWorkspace, panX: interaction.originX, panY: interaction.originY },
      (Number.isFinite(event.clientX) ? event.clientX : interaction.startX) - interaction.startX,
      (Number.isFinite(event.clientY) ? event.clientY : interaction.startY) - interaction.startY,
    ))
  }

  function finishPan(event: ReactPointerEvent<HTMLDivElement>): void {
    if (panInteractionRef.current?.pointerId !== event.pointerId) return
    panInteractionRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setStatus(`Pan ${canvasWorkspace.panX}, ${canvasWorkspace.panY}.`)
  }

  function openSelectedMenu(): void {
    if (!selectedNodeId) return
    setContextMenu({ nodeId: selectedNodeId, position: { x: window.innerWidth / 2, y: 72 } })
  }

  return (
    <main className="canvas-workspace relative row-start-2 min-h-0 min-w-0 overflow-hidden bg-editor-grid md:col-start-2 lg:col-start-3" id="editor-canvas" tabIndex={-1}>
      <div className="canvas-toolbar absolute inset-x-0 top-0 z-10 flex min-h-12 items-center justify-between gap-1 border-b border-border bg-surface/95 px-1.5 backdrop-blur lg:min-h-10 lg:px-1">
        <div className="flex min-w-0 items-center gap-1" role="toolbar" aria-label="Herramientas del canvas">
          <span className="hidden md:block" data-tooltip="Páginas y capas"><Button aria-label="Alternar páginas y capas" className={libraryOpen ? 'bg-primary-soft text-primary-strong' : ''} onClick={onToggleLibrary} size="icon" variant="ghost"><Icon name="panel-left" /></Button></span>
          <span data-tooltip="Seleccionar"><Button aria-label="Herramienta de selección" aria-pressed={canvasWorkspace.tool === 'select'} className={canvasWorkspace.tool === 'select' ? 'bg-primary-soft text-primary-strong' : ''} onClick={() => commitCanvasWorkspace({ ...canvasWorkspace, tool: 'select' })} size="icon" variant="ghost"><Icon name="cursor" /></Button></span>
          <span data-tooltip="Desplazar"><Button aria-label="Herramienta de desplazamiento" aria-pressed={canvasWorkspace.tool === 'pan'} className={canvasWorkspace.tool === 'pan' ? 'bg-primary-soft text-primary-strong' : ''} onClick={() => commitCanvasWorkspace({ ...canvasWorkspace, tool: 'pan' })} size="icon" variant="ghost"><Icon name="move" /></Button></span>
          <nav aria-label="Ruta de selección" className="canvas-breadcrumb ml-1 hidden min-w-0 xl:flex">
            <ol className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              {breadcrumbs.map((breadcrumb, index) => {
                const current = index === breadcrumbs.length - 1
                return (
                  <li className="flex min-w-0 items-center gap-1" key={breadcrumb.id ?? 'document'}>
                    {index > 0 ? <span aria-hidden="true" className="text-border">/</span> : null}
                    {breadcrumb.id && !current ? (
                      <button className="max-w-28 truncate rounded px-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus" onClick={() => selection.selectNode(breadcrumb.id as NodeId)} type="button">{breadcrumb.label}</button>
                    ) : <span aria-current={current ? 'page' : undefined} className={`max-w-28 truncate ${current ? 'font-semibold text-foreground' : ''}`}>{breadcrumb.label}</span>}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-lg border border-border bg-canvas p-0.5 shadow-sm" role="group" aria-label="Viewport del documento">
          {(['mobile', 'tablet', 'desktop'] as const).map((mode) => (
            <button aria-label={viewportLabels[mode]} aria-pressed={viewport === mode} className={`grid size-11 cursor-pointer place-items-center rounded-md transition-colors lg:size-8 ${viewport === mode ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`} data-tooltip={viewportLabels[mode]} key={mode} onClick={() => changeViewport(mode)} type="button"><Icon name={mode} size={14} /></button>
          ))}
          <button aria-label="Cambiar orientación del dispositivo" aria-pressed={canvasWorkspace.orientation === 'landscape'} className="grid size-11 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted lg:size-8" data-tooltip="Rotar dispositivo" disabled={!isDevice} onClick={() => commitCanvasWorkspace({ ...canvasWorkspace, orientation: canvasWorkspace.orientation === 'portrait' ? 'landscape' : 'portrait', panX: 0, panY: 0 })} type="button"><Icon name="resize" size={14} /></button>
        </div>

        <div className="flex min-w-0 items-center gap-1">
          <div className="canvas-zoom-status hidden items-center rounded-md border border-border bg-surface sm:flex" role="group" aria-label="Zoom del canvas">
            <button aria-label="Alejar canvas" className="grid size-8 place-items-center rounded-l hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus" onClick={() => commitCanvasWorkspace({ ...canvasWorkspace, zoom: stepCanvasZoom(canvasWorkspace.zoom, -1) })} type="button">−</button>
            <output aria-label={`Zoom del canvas: ${canvasWorkspace.zoom} por ciento`} className="min-w-11 text-center font-heading text-[0.625rem] tabular-nums text-muted-foreground">{canvasWorkspace.zoom}%</output>
            <button aria-label="Acercar canvas" className="grid size-8 place-items-center rounded-r hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus" onClick={() => commitCanvasWorkspace({ ...canvasWorkspace, zoom: stepCanvasZoom(canvasWorkspace.zoom, 1) })} type="button">+</button>
            <button aria-label="Ajustar canvas a la vista" className="grid size-8 place-items-center border-l border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus" onClick={() => commitCanvasWorkspace(fitCanvas(canvasWorkspace))} type="button"><Icon name="window" size={13} /></button>
          </div>
          <div className="hidden items-center xl:flex" role="group" aria-label="Mover foco entre paneles">
            <Button aria-label="Enfocar panel de capas" onClick={() => focusEditorRegion('layers')} size="icon" variant="ghost"><Icon name="layers" size={13} /></Button>
            <Button aria-label="Enfocar canvas" onClick={() => focusEditorRegion('canvas')} size="icon" variant="ghost"><Icon name="editor" size={13} /></Button>
            <Button aria-label="Enfocar inspector" onClick={() => focusEditorRegion('inspector')} size="icon" variant="ghost"><Icon name="settings" size={13} /></Button>
          </div>
          <span className="hidden md:block" data-tooltip="Inspector"><Button aria-label="Alternar inspector" className={inspectorOpen ? 'bg-primary-soft text-primary-strong' : ''} onClick={onToggleInspector} size="icon" variant="ghost"><Icon name="settings" /></Button></span>
          <span className="hidden sm:block" data-tooltip="Geometría y espaciado"><Button aria-label="Editar geometría del nodo seleccionado" disabled={!selectedNodeId} onClick={openSelectedMenu} size="icon" variant="ghost"><Icon name="more" /></Button></span>
        </div>
      </div>

      <div
        aria-label="Viewport interactivo del canvas"
        className={`canvas-scroll h-full overflow-auto overscroll-contain px-2 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-4 sm:pb-10 sm:pt-16 lg:px-2 lg:pb-7 lg:pt-11 ${canvasWorkspace.tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onKeyDown={handleViewportKeyDown}
        onPointerCancel={() => { panInteractionRef.current = null }}
        onPointerDown={beginPan}
        onPointerMove={continuePan}
        onPointerUp={finishPan}
        ref={viewportRef}
        role="region"
        tabIndex={0}
      >
        <div className="relative mx-auto" data-canvas-pan-x={canvasWorkspace.panX} data-canvas-pan-y={canvasWorkspace.panY} data-canvas-zoom={canvasWorkspace.zoom} style={{ height: profile.height * scale, width: profile.width * scale }}>
          <div className="transition-transform duration-150 motion-reduce:transition-none" style={{ height: profile.height, transform: `translate(${canvasWorkspace.panX}px, ${canvasWorkspace.panY}px) scale(${scale})`, transformOrigin: 'top left', width: profile.width }}>
          <div className={isDevice ? `relative mx-auto h-full w-full border-slate-950 bg-slate-950 p-2 shadow-[0_24px_55px_rgba(30,20,50,.28)] ${viewport === 'mobile' ? 'rounded-[2.75rem] border-[5px]' : 'rounded-[2rem] border-[4px]'}` : 'h-full w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg'}>
            {isDevice ? <div className={`absolute left-1/2 top-3 z-20 -translate-x-1/2 bg-slate-950 ${viewport === 'mobile' ? 'h-6 w-24 rounded-full' : 'h-2 w-16 rounded-full'}`} aria-hidden="true" /> : null}
            <div className={`h-full overflow-auto bg-white text-slate-950 ${isDevice ? viewport === 'mobile' ? 'rounded-[2rem]' : 'rounded-[1.35rem]' : ''}`}>
              {isDevice ? <div className="flex h-8 items-end justify-between px-5 pb-1 text-[0.625rem] font-bold"><span>9:41</span><span className="flex items-end gap-1" aria-label="Señal, wifi y batería"><span className="h-2 w-2 rounded-full bg-slate-900" /><span className="h-2 w-3 rounded-t-full border-2 border-b-0 border-slate-900" /><span className="h-2 w-4 rounded-sm border-2 border-slate-900" /></span></div> : null}
              <div className="relative pl-[18px] pt-[18px]">
                <span aria-hidden="true" className="canvas-ruler canvas-ruler--horizontal" data-testid="canvas-horizontal-ruler" />
                <span aria-hidden="true" className="canvas-ruler canvas-ruler--vertical" data-testid="canvas-vertical-ruler" />
                <DirectManipulationContext value={manipulation}>
                  <CanonicalProjectRenderer breakpointId={breakpointId} documentId={documentId} NodeFrame={DirectManipulationFrame} store={store} />
                </DirectManipulationContext>
              </div>
            </div>
            {viewport === 'mobile' ? <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/90" aria-hidden="true" /> : null}
          </div>
          </div>
        </div>
        <div aria-live="polite" className="sticky bottom-0 mx-auto mt-1.5 flex w-fit items-center justify-center gap-1.5 rounded bg-canvas/90 px-2 py-0.5 text-center font-heading text-[0.625rem] text-muted-foreground"><span className="size-1.5 rounded-full bg-success" />{viewportLabels[viewport]} · {canvasWorkspace.orientation === 'landscape' ? 'Horizontal' : 'Vertical'} · {canvasWorkspace.zoom}%</div>
      </div>
      {contextMenu ? (
        <DirectManipulationMenu
          breakpointId={breakpointId}
          key={`${contextMenu.nodeId}-${breakpointId}`}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
          onStatus={setStatus}
          position={contextMenu.position}
        />
      ) : null}
      <p aria-live="polite" className="sr-only">{status}</p>
    </main>
  )
}
