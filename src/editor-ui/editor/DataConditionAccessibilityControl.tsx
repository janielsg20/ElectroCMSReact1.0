import { useState, type FormEvent } from 'react'
import { NodeDataSettingsSchema, resolveNodeDataState, type Node, type ProjectStructure } from '../../domain'
import { useEditorProject } from './editor-project-context'

interface DataConditionAccessibilityControlProps {
  readonly node: Node
  readonly structure: ProjectStructure
}

interface Draft {
  readonly accessibility: string
  readonly bindings: string
  readonly conditions: string
}

function draftFromNode(node: Node): Draft {
  return {
    accessibility: JSON.stringify(node.accessibility ?? {}, null, 2),
    bindings: JSON.stringify(node.bindings, null, 2),
    conditions: JSON.stringify(node.conditions, null, 2),
  }
}

function parseJson(source: string, label: string): { readonly ok: true; readonly value: unknown } | { readonly error: string; readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(source) as unknown }
  } catch {
    return { error: `${label} debe contener JSON válido.`, ok: false }
  }
}

export function DataConditionAccessibilityControl({ node, structure }: DataConditionAccessibilityControlProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState<Draft>(() => draftFromNode(node))
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const resolved = resolveNodeDataState(structure, node, node.properties)
  const hasSettings = Object.keys(node.bindings).length > 0 || node.conditions.length > 0 || Object.keys(node.accessibility ?? {}).length > 0

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError('')
    setStatus('')
    const bindings = parseJson(draft.bindings, 'Bindings')
    const conditions = parseJson(draft.conditions, 'Condiciones')
    const accessibility = parseJson(draft.accessibility, 'Accesibilidad')
    const parseError = [bindings, conditions, accessibility].find((item) => !item.ok)
    if (parseError && !parseError.ok) {
      setError(parseError.error)
      return
    }
    if (!bindings.ok || !conditions.ok || !accessibility.ok) return
    const parsed = NodeDataSettingsSchema.safeParse({
      accessibility: accessibility.value,
      bindings: bindings.value,
      conditions: conditions.value,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'La configuración no es válida.')
      return
    }
    setPending(true)
    const updated = await session.updateNodeDataSettings(node.id, parsed.data)
    setPending(false)
    if (!updated.ok) setError(updated.error)
    else setStatus('Datos, condiciones y accesibilidad actualizados.')
  }

  async function reset(): Promise<void> {
    setError('')
    setStatus('')
    setPending(true)
    const updated = await session.resetNodeDataSettings(node.id)
    setPending(false)
    if (!updated.ok) setError(updated.error)
    else {
      setDraft({ accessibility: '{}', bindings: '{}', conditions: '[]' })
      setStatus('Datos, condiciones y accesibilidad restablecidos.')
    }
  }

  return (
    <form className="grid gap-1.5 border-t border-border p-2 lg:p-1.5" data-data-condition-control onSubmit={(event) => { void submit(event) }}>
      <div><h2 className="text-xs font-bold">Datos, visibilidad y ARIA</h2><p className="text-[0.625rem] leading-4 text-muted-foreground">JSON estructurado. Admite literales, rutas del proyecto y propiedades de nodos; no ejecuta consultas ni acciones.</p></div>
      <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`bindings-${node.id}`}>Bindings
        <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs" disabled={node.locked || pending} id={`bindings-${node.id}`} onChange={(event) => setDraft((current) => ({ ...current, bindings: event.target.value }))} value={draft.bindings} />
      </label>
      <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`conditions-${node.id}`}>Condiciones de visibilidad
        <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs" disabled={node.locked || pending} id={`conditions-${node.id}`} onChange={(event) => setDraft((current) => ({ ...current, conditions: event.target.value }))} value={draft.conditions} />
      </label>
      <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`accessibility-${node.id}`}>Accesibilidad ARIA
        <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs" disabled={node.locked || pending} id={`accessibility-${node.id}`} onChange={(event) => setDraft((current) => ({ ...current, accessibility: event.target.value }))} value={draft.accessibility} />
      </label>
      {resolved.diagnostics.length > 0 ? <div className="rounded border border-warning/35 bg-warning/10 px-2 py-1 text-[0.625rem] text-foreground" role="status"><strong>Diagnósticos</strong><ul className="list-disc pl-4">{resolved.diagnostics.map((item, index) => <li key={`${item.code}-${item.path.join('.')}-${index}`}>{item.message}</li>)}</ul></div> : null}
      {error ? <p className="rounded bg-danger-soft px-2 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
      <div className="flex gap-1">
        <button className="min-h-9 flex-1 rounded-md bg-primary px-2 text-[0.625rem] font-bold text-on-primary disabled:opacity-50" disabled={node.locked || pending} type="submit">{pending ? 'Guardando…' : 'Aplicar datos'}</button>
        <button className="min-h-9 rounded-md border border-border px-2 text-[0.625rem] font-bold disabled:opacity-50" disabled={!hasSettings || node.locked || pending} onClick={() => { void reset() }} type="button">Reset datos</button>
      </div>
    </form>
  )
}
