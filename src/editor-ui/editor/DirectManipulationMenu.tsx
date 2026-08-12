import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { readCanonicalNodeSize, readCanonicalNodeSpacing, type BoxSpacing, type BreakpointId, type NodeId, type NodeSize, type NodeSpacing } from '../../domain'
import { Button, ControlInput, Icon } from '../primitives'
import { useEditorProject } from './editor-project-context'
import type { MenuPosition } from './direct-manipulation-context'

interface DirectManipulationMenuProps {
  readonly breakpointId: BreakpointId
  readonly nodeId: NodeId
  readonly onClose: () => void
  readonly onStatus: (message: string) => void
  readonly position: MenuPosition
}

interface SpacingFieldsProps {
  readonly label: string
  readonly onChange: (spacing: BoxSpacing) => void
  readonly value: BoxSpacing
}

const sides = [
  ['top', 'Superior'],
  ['right', 'Derecho'],
  ['bottom', 'Inferior'],
  ['left', 'Izquierdo'],
] as const

function SpacingFields({ label, onChange, value }: SpacingFieldsProps) {
  return (
    <fieldset className="min-w-0 rounded-md border border-border bg-muted/15 p-1.5">
      <legend className="px-1 text-[0.625rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {sides.map(([side, sideLabel]) => (
          <label className="grid gap-0.5 text-[0.625rem] font-semibold text-muted-foreground" key={side}>
            {sideLabel}
            <ControlInput
              aria-label={`${label} ${sideLabel}`}
              className="w-full tabular-nums"
              controlSize="compact"
              inputMode="numeric"
              onChange={(event) => onChange({ ...value, [side]: Math.max(0, Math.min(1000, Number(event.target.value) || 0)) })}
              pattern="[0-9]*"
              type="text"
              value={value[side]}
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function fallbackSize(nodeId: NodeId): NodeSize {
  const element = document.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)
  const bounds = element?.getBoundingClientRect()
  return {
    height: Math.max(24, Math.round(bounds?.height || 120)),
    width: Math.max(24, Math.round(bounds?.width || 320)),
  }
}

export function DirectManipulationMenu({ breakpointId, nodeId, onClose, onStatus, position }: DirectManipulationMenuProps) {
  const session = useEditorProject()
  const snapshot = session.store.getNodeSnapshot(nodeId, breakpointId)
  const [size, setSize] = useState<NodeSize>(() => readCanonicalNodeSize(snapshot?.responsive.styles ?? {}, fallbackSize(nodeId)))
  const [spacing, setSpacing] = useState<NodeSpacing>(() => readCanonicalNodeSpacing(snapshot?.responsive.styles ?? {}))
  const panelRef = useRef<HTMLDivElement>(null)
  const left = Math.max(8, Math.min(position.x, window.innerWidth - 352))
  const top = Math.max(48, Math.min(position.y, window.innerHeight - 420))

  useEffect(() => {
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus()
  }, [])

  if (!snapshot) return null

  async function applyLayout(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    onStatus(`Aplicando geometría de ${snapshot?.node.name ?? 'nodo'}…`)
    const resized = await session.resizeNode(nodeId, size, breakpointId)
    if (!resized.ok) {
      onStatus(`No se pudo aplicar el tamaño: ${resized.error}`)
      return
    }
    const spaced = await session.updateNodeSpacing(nodeId, spacing, breakpointId)
    if (!spaced.ok) {
      onStatus(`El tamaño se guardó, pero el espaciado falló: ${spaced.error}`)
      return
    }
    onStatus(`${snapshot?.node.name ?? 'Nodo'} actualizado mediante comandos reversibles.`)
    onClose()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'Escape') return
    event.preventDefault()
    onClose()
  }

  function updateSize(key: keyof NodeSize, source: string): void {
    const next = Math.max(24, Math.min(10_000, Number(source) || 24))
    setSize((current) => ({ ...current, [key]: next }))
  }

  return (
    <div
      aria-label={`Menú contextual de ${snapshot.node.name}`}
      className="fixed z-50 w-[min(21.5rem,calc(100vw-1rem))] rounded-lg border border-border bg-surface p-2 text-foreground shadow-xl"
      data-electrocms-surface="direct-manipulation"
      data-testid="direct-manipulation-menu"
      onKeyDown={handleKeyDown}
      ref={panelRef}
      role="dialog"
      style={{ left, top }}
    >
      <div className="mb-1.5 flex min-h-9 items-center gap-1.5 border-b border-border pb-1.5">
        <span className="grid size-8 place-items-center rounded bg-primary-soft text-primary"><Icon name="resize" size={14} /></span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-xs font-bold">{snapshot.node.name}</h2><p className="text-[0.625rem] text-muted-foreground">Geometría · retícula 8 px · {snapshot.node.locked ? 'bloqueado' : 'editable'}</p></div>
        <Button aria-label="Cerrar menú contextual" onClick={onClose} size="icon" variant="ghost"><Icon name="close" size={13} /></Button>
      </div>

      {snapshot.node.locked ? <p className="rounded border border-warning/40 bg-warning/10 p-2 text-xs" role="alert">Desbloquea esta capa para cambiar su geometría.</p> : (
        <form className="grid gap-1.5" data-electrocms-surface="geometry-form" onSubmit={(event) => void applyLayout(event)}>
          <fieldset className="min-w-0 rounded-md border border-border bg-muted/15 p-1.5">
            <legend className="px-1 text-[0.625rem] font-bold uppercase tracking-wide text-muted-foreground">Tamaño</legend>
            <div className="grid grid-cols-2 gap-1">
              <label className="grid gap-0.5 text-[0.625rem] font-semibold text-muted-foreground">Ancho
                <ControlInput aria-label="Ancho del nodo" className="w-full tabular-nums" controlSize="compact" inputMode="numeric" onChange={(event) => updateSize('width', event.target.value)} pattern="[0-9]*" type="text" value={size.width} />
              </label>
              <label className="grid gap-0.5 text-[0.625rem] font-semibold text-muted-foreground">Alto
                <ControlInput aria-label="Alto del nodo" className="w-full tabular-nums" controlSize="compact" inputMode="numeric" onChange={(event) => updateSize('height', event.target.value)} pattern="[0-9]*" type="text" value={size.height} />
              </label>
            </div>
          </fieldset>
          <SpacingFields label="Padding" onChange={(padding) => setSpacing((current) => ({ ...current, padding }))} value={spacing.padding} />
          <SpacingFields label="Margen" onChange={(margin) => setSpacing((current) => ({ ...current, margin }))} value={spacing.margin} />
          <div className="flex items-center justify-between gap-1 pt-0.5">
            <span className="text-[0.625rem] text-muted-foreground">Undo/redo conserva cada cambio</span>
            <div className="flex gap-1">
              <Button onClick={onClose} size="small" variant="ghost">Cancelar</Button>
              <Button size="small" type="submit">Aplicar</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
