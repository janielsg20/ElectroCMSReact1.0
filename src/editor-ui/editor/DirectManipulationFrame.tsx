import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { readCanonicalNodeSize, type NodeSize } from '../../domain'
import type { CanonicalNodeFrameProps } from '../../renderers'
import { Icon } from '../primitives'
import { useEditorProject, useEditorSelection, useNodeSelected } from './editor-project-context'
import { useDirectManipulation } from './direct-manipulation-context'
import { resizePreview, type ResizeCorner, type ResizePreview } from './direct-manipulation-model'

const corners = ['north-west', 'north-east', 'south-east', 'south-west'] as const satisfies readonly ResizeCorner[]

const cornerLabels: Record<ResizeCorner, string> = {
  'north-east': 'superior derecha',
  'north-west': 'superior izquierda',
  'south-east': 'inferior derecha',
  'south-west': 'inferior izquierda',
}

interface PointerResizeState {
  readonly corner: ResizeCorner
  readonly heightGuides: readonly number[]
  readonly origin: NodeSize
  readonly pointerId: number
  readonly startX: number
  readonly startY: number
  readonly widthGuides: readonly number[]
}

function elementSize(element: HTMLElement | null, styles: Readonly<Record<string, unknown>>): NodeSize {
  const bounds = element?.getBoundingClientRect()
  return readCanonicalNodeSize(styles, {
    height: Math.max(24, Math.round(bounds?.height || 120)),
    width: Math.max(24, Math.round(bounds?.width || 320)),
  })
}

function parentGuides(element: HTMLElement | null): { readonly heights: readonly number[]; readonly widths: readonly number[] } {
  const parentNode = element?.parentElement?.closest<HTMLElement>('[data-node-id]')
  const bounds = parentNode?.getBoundingClientRect()
  return {
    heights: bounds?.height ? [Math.round(bounds.height)] : [],
    widths: bounds?.width ? [Math.round(bounds.width)] : [],
  }
}

function safeCoordinate(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

export function DirectManipulationFrame({ children, className, snapshot, style, styleScope, styleSheet }: CanonicalNodeFrameProps) {
  const session = useEditorProject()
  const selection = useEditorSelection()
  const selected = useNodeSelected(snapshot.node.id)
  const manipulation = useDirectManipulation()
  const frameRef = useRef<HTMLDivElement>(null)
  const pointerResizeRef = useRef<PointerResizeState | null>(null)
  const [preview, setPreview] = useState<ResizePreview | null>(null)
  const locked = snapshot.node.locked
  const renderedStyle = preview
    ? { ...style, height: preview.size.height, width: preview.size.width }
    : style

  async function commitResize(size: NodeSize): Promise<void> {
    manipulation.announce(`Redimensionando ${snapshot.node.name}…`)
    const result = await session.resizeNode(snapshot.node.id, size, manipulation.breakpointId)
    manipulation.announce(result.ok
      ? `${snapshot.node.name}: ${size.width} por ${size.height} píxeles.`
      : `No se pudo redimensionar: ${result.error}`)
  }

  function beginPointerResize(event: ReactPointerEvent<HTMLButtonElement>, corner: ResizeCorner): void {
    if (locked) return
    event.preventDefault()
    event.stopPropagation()
    selection.selectNode(snapshot.node.id)
    const guides = parentGuides(frameRef.current)
    const origin = elementSize(frameRef.current, snapshot.responsive.styles)
    pointerResizeRef.current = {
      corner,
      heightGuides: guides.heights,
      origin,
      pointerId: event.pointerId,
      startX: safeCoordinate(event.clientX, 0),
      startY: safeCoordinate(event.clientY, 0),
      widthGuides: guides.widths,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setPreview({ horizontalGuide: 'grid', size: origin, verticalGuide: 'grid' })
  }

  function continuePointerResize(event: ReactPointerEvent<HTMLButtonElement>): void {
    const current = pointerResizeRef.current
    if (!current || current.pointerId !== event.pointerId) return
    setPreview(resizePreview(
      current.origin,
      safeCoordinate(event.clientX, current.startX) - current.startX,
      safeCoordinate(event.clientY, current.startY) - current.startY,
      current.corner,
      current.widthGuides,
      current.heightGuides,
    ))
  }

  function finishPointerResize(event: ReactPointerEvent<HTMLButtonElement>): void {
    const current = pointerResizeRef.current
    if (!current || current.pointerId !== event.pointerId) return
    const finalPreview = resizePreview(
      current.origin,
      safeCoordinate(event.clientX, current.startX) - current.startX,
      safeCoordinate(event.clientY, current.startY) - current.startY,
      current.corner,
      current.widthGuides,
      current.heightGuides,
    )
    pointerResizeRef.current = null
    setPreview(null)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    void commitResize(finalPreview.size)
  }

  function cancelPointerResize(): void {
    pointerResizeRef.current = null
    setPreview(null)
    manipulation.announce('Redimensionamiento cancelado.')
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    const current = elementSize(frameRef.current, snapshot.responsive.styles)
    const step = event.shiftKey ? 32 : 8
    const next = {
      height: Math.max(24, current.height + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0)),
      width: Math.max(24, current.width + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0)),
    }
    void commitResize(next)
  }

  function openMenu(x: number, y: number): void {
    selection.selectNode(snapshot.node.id)
    manipulation.openContextMenu(snapshot.node.id, { x, y })
  }

  function handleFrameKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      selection.selectNode(snapshot.node.id)
      return
    }
    if (event.key === 'F10' && event.shiftKey) {
      event.preventDefault()
      event.stopPropagation()
      const bounds = frameRef.current?.getBoundingClientRect()
      openMenu(bounds?.left ?? 24, bounds?.top ?? 64)
    }
  }

  return (
    <div
      aria-label={`${snapshot.node.name}${locked ? ', bloqueado' : ''}`}
      className={`direct-node-frame relative ${className}`.trim()}
      data-node-id={snapshot.node.id}
      data-node-locked={locked ? 'true' : 'false'}
      data-node-name={snapshot.node.name}
      data-selected={selected ? 'true' : 'false'}
      data-style-scope={styleScope}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        selection.selectNode(snapshot.node.id)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        openMenu(event.clientX, event.clientY)
      }}
      onKeyDown={handleFrameKeyDown}
      ref={frameRef}
      role="group"
      style={renderedStyle}
      tabIndex={selected ? 0 : -1}
    >
      {styleSheet ? <style data-node-state-styles={snapshot.node.id}>{styleSheet}</style> : null}
      {children}
      {selected ? (
        <>
          <span className="absolute -top-7 left-0 z-[5] flex h-6 max-w-full items-center gap-1 rounded bg-primary px-1.5 text-[0.625rem] font-bold text-on-primary shadow-sm">
            <span className="truncate">{snapshot.node.name}</span>
            {preview ? <span className="tabular-nums">{preview.size.width}×{preview.size.height}</span> : null}
            <button
              aria-label={`Abrir menú contextual de ${snapshot.node.name}`}
              className="grid size-5 shrink-0 place-items-center rounded hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                const bounds = frameRef.current?.getBoundingClientRect()
                openMenu(bounds?.left ?? 24, (bounds?.top ?? 64) + 24)
              }}
              type="button"
            >
              <Icon name="more" size={11} />
            </button>
          </span>
          {preview ? (
            <>
              <span className="direct-guide direct-guide--horizontal" data-guide-source={preview.verticalGuide} />
              <span className="direct-guide direct-guide--vertical" data-guide-source={preview.horizontalGuide} />
            </>
          ) : null}
          {!locked ? corners.map((corner) => (
            <button
              aria-label={`Redimensionar ${snapshot.node.name} desde ${cornerLabels[corner]}`}
              className="direct-resize-handle focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              data-corner={corner}
              key={corner}
              onKeyDown={resizeWithKeyboard}
              onPointerCancel={cancelPointerResize}
              onPointerDown={(event) => beginPointerResize(event, corner)}
              onPointerMove={continuePointerResize}
              onPointerUp={finishPointerResize}
              type="button"
            />
          )) : null}
        </>
      ) : null}
    </div>
  )
}
