import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Breakpoint, BreakpointId, BreakpointInput } from '../../domain'
import { Button, Icon, Select, TextField } from '../primitives'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId } from './editor-project-context'

interface BreakpointManagerProps {
  readonly activeBreakpointId: BreakpointId
  readonly onActiveBreakpointChange: (breakpointId: BreakpointId) => void
}

interface BreakpointFormProps {
  readonly breakpoint?: Breakpoint
  readonly breakpoints: readonly Breakpoint[]
  readonly onCreated: (breakpointId: BreakpointId) => void
  readonly onStatus: (message: string) => void
}

interface BreakpointDraft {
  readonly inheritsFrom: string
  readonly name: string
  readonly orientation: Breakpoint['orientation']
  readonly width: string
}

function draftFromBreakpoint(breakpoint?: Breakpoint): BreakpointDraft {
  return breakpoint
    ? { inheritsFrom: breakpoint.inheritsFrom ?? '', name: breakpoint.name, orientation: breakpoint.orientation, width: String(breakpoint.width) }
    : { inheritsFrom: '', name: 'Nuevo breakpoint', orientation: 'any', width: '900' }
}

function BreakpointForm({ breakpoint, breakpoints, onCreated, onStatus }: BreakpointFormProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState<BreakpointDraft>(() => draftFromBreakpoint(breakpoint))
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError('')
    onStatus('')
    const width = Number(draft.width)
    if (!Number.isInteger(width) || width < 240 || width > 10_000) {
      setError('El ancho debe ser un entero entre 240 y 10000 px.')
      return
    }
    const input: BreakpointInput = {
      inheritsFrom: draft.inheritsFrom ? draft.inheritsFrom as BreakpointId : null,
      name: draft.name.trim(),
      orientation: draft.orientation,
      width,
    }
    setPending(true)
    if (breakpoint) {
      const result = await session.updateBreakpoint(breakpoint.id, input)
      setPending(false)
      if (!result.ok) setError(result.error)
      else onStatus('Breakpoint actualizado.')
      return
    }
    const result = await session.createBreakpoint(input)
    setPending(false)
    if (!result.ok) setError(result.error)
    else {
      onCreated(result.value.breakpointId)
      onStatus('Breakpoint creado.')
    }
  }

  return (
    <form className="grid gap-2" data-electrocms-surface="breakpoint-form" onSubmit={(event) => { void submit(event) }}>
      <TextField disabled={pending} label="Nombre" maxLength={160} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required value={draft.name} />
      <div className="grid grid-cols-2 gap-2">
        <TextField disabled={pending} inputMode="numeric" label="Ancho (px)" onChange={(event) => setDraft((current) => ({ ...current, width: event.target.value }))} pattern="[0-9]*" required value={draft.width} />
        <Select
          controlSize="compact"
          disabled={pending}
          label="Orientación"
          onValueChange={(value) => setDraft((current) => ({ ...current, orientation: value as Breakpoint['orientation'] }))}
          options={[
            { label: 'Cualquiera', value: 'any' },
            { label: 'Vertical', value: 'portrait' },
            { label: 'Horizontal', value: 'landscape' },
          ]}
          value={draft.orientation}
        />
      </div>
      <Select
        controlSize="compact"
        disabled={pending}
        label="Hereda de"
        onValueChange={(value) => setDraft((current) => ({ ...current, inheritsFrom: value }))}
        options={[
          { label: 'Sin padre', value: '' },
          ...breakpoints.filter((item) => item.id !== breakpoint?.id).map((item) => ({ label: `${item.name} · ${item.width}px`, value: item.id })),
        ]}
        value={draft.inheritsFrom}
      />
      {error ? <p className="rounded bg-danger-soft px-2 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <Button disabled={pending} isLoading={pending} loadingLabel="Guardando…" size="small" type="submit">{breakpoint ? 'Guardar cambios' : 'Crear breakpoint'}</Button>
    </form>
  )
}

export function BreakpointManager({ activeBreakpointId, onActiveBreakpointChange }: BreakpointManagerProps) {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const selectedNodeId = useEditorSelectedNodeId()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<BreakpointId | 'new'>(activeBreakpointId)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const breakpoints = structure.breakpoints
  const activeIndex = breakpoints.findIndex((item) => item.id === activeBreakpointId)
  const active = breakpoints[activeIndex] ?? breakpoints[0]
  const editing = editingId === 'new' ? undefined : breakpoints.find((item) => item.id === editingId)
  const selectedNode = selectedNodeId ? structure.documents[session.documentId]?.nodes[selectedNodeId] : undefined
  const hasOverride = Boolean(selectedNode?.responsive[activeBreakpointId])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => dialogRef.current?.focus())
  }, [open])

  function close(): void {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function trapFocus(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (document.activeElement === dialogRef.current) {
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

  async function move(direction: -1 | 1): Promise<void> {
    if (!editing) return
    const index = breakpoints.findIndex((item) => item.id === editing.id)
    const target = index + direction
    if (target < 0 || target >= breakpoints.length) return
    setError('')
    const result = await session.reorderBreakpoint(editing.id, target)
    if (!result.ok) setError(result.error)
    else setStatus('Orden de breakpoints actualizado.')
  }

  async function resetOverride(): Promise<void> {
    if (!selectedNodeId || !hasOverride) return
    setError('')
    const result = await session.resetNodeBreakpointOverride(selectedNodeId, activeBreakpointId)
    if (!result.ok) setError(result.error)
    else setStatus(`Override de ${active?.name ?? 'breakpoint'} restablecido.`)
  }

  function created(breakpointId: BreakpointId): void {
    setEditingId(breakpointId)
    onActiveBreakpointChange(breakpointId)
  }

  return (
    <>
      <div className="hidden w-44 sm:block">
        <Select
          controlSize="compact"
          label="Breakpoint activo"
          labelHidden
          onValueChange={(value) => onActiveBreakpointChange(value as BreakpointId)}
          options={breakpoints.map((item) => ({ label: `${item.name} · ${item.width}px`, value: item.id }))}
          value={activeBreakpointId}
        />
      </div>
      <button aria-label="Administrar breakpoints" className="grid size-11 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:size-8" onClick={() => { setEditingId(activeBreakpointId); setOpen(true) }} ref={triggerRef} type="button"><Icon name="settings" size={14} /></button>
      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-3" role="presentation">
          <section aria-label="Administrador de breakpoints" aria-modal="true" className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface text-left shadow-2xl" data-electrocms-surface="dialog" onKeyDown={trapFocus} ref={dialogRef} role="dialog" tabIndex={-1}>
            <header className="flex min-h-12 items-center justify-between border-b border-border px-3">
              <div><h2 className="text-sm font-bold">Breakpoints</h2><p className="text-[0.625rem] text-muted-foreground">Orden, herencia y preview canónicos.</p></div>
              <Button aria-label="Cerrar administrador de breakpoints" onClick={close} size="icon" variant="ghost"><Icon name="close" size={15} /></Button>
            </header>
            <div className="grid min-h-0 flex-1 md:grid-cols-[15rem_1fr]">
              <div className="min-h-0 overflow-y-auto border-b border-border p-2 md:border-b-0 md:border-r">
                <button className={`mb-1 min-h-11 w-full cursor-pointer rounded-md border px-2 text-left text-xs font-semibold transition-colors lg:min-h-9 ${editingId === 'new' ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border hover:bg-muted'}`} onClick={() => setEditingId('new')} type="button">+ Nuevo breakpoint</button>
                <div className="grid gap-1" aria-label="Orden de breakpoints" role="list">
                  {breakpoints.map((item, index) => (
                    <div key={item.id} role="listitem"><button aria-current={editingId === item.id ? 'true' : undefined} className={`min-h-11 w-full cursor-pointer rounded-md border px-2 text-left transition-colors ${editingId === item.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-muted'}`} onClick={() => { setEditingId(item.id); onActiveBreakpointChange(item.id) }} type="button"><span className="block truncate text-xs font-bold">{index + 1}. {item.name}</span><span className="text-[0.625rem] text-muted-foreground">{item.width}px · {item.orientation}</span></button></div>
                  ))}
                </div>
              </div>
              <div className="min-h-0 overflow-y-auto p-3">
                <div className="mb-2 flex flex-wrap gap-1">
                  <Button disabled={!editing || breakpoints.indexOf(editing) === 0} onClick={() => { void move(-1) }} size="small" variant="secondary">↑ Subir</Button>
                  <Button disabled={!editing || breakpoints.indexOf(editing) === breakpoints.length - 1} onClick={() => { void move(1) }} size="small" variant="secondary">↓ Bajar</Button>
                  <Button disabled={!selectedNodeId || !hasOverride} onClick={() => { void resetOverride() }} size="small" variant="secondary">Reset override activo</Button>
                </div>
                <BreakpointForm breakpoint={editing} breakpoints={breakpoints} key={editing?.id ?? 'new'} onCreated={created} onStatus={setStatus} />
                {error ? <p className="mt-2 rounded bg-danger-soft px-2 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
                <p aria-live="polite" className="mt-2 text-[0.625rem] text-success">{status}</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
