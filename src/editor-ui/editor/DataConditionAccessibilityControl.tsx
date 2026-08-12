import { useState, type FormEvent } from 'react'
import { NodeDataSettingsSchema, resolveNodeDataState, type Node, type ProjectStructure } from '../../domain'
import { Button, TextArea } from '../primitives'
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
    <form className="grid gap-1.5 border-t border-border p-2 lg:p-1.5" data-data-condition-control data-electrocms-surface="data-settings" onSubmit={(event) => { void submit(event) }}>
      <div><h2 className="text-xs font-bold">Datos, visibilidad y ARIA</h2><p className="text-[0.625rem] leading-4 text-muted-foreground">JSON estructurado. Admite literales, rutas del proyecto y propiedades de nodos; no ejecuta consultas ni acciones.</p></div>
      <TextArea className="min-h-20 font-mono" controlSize="compact" disabled={node.locked || pending} id={`bindings-${node.id}`} label="Bindings" onChange={(event) => setDraft((current) => ({ ...current, bindings: event.target.value }))} value={draft.bindings} />
      <TextArea className="min-h-20 font-mono" controlSize="compact" disabled={node.locked || pending} id={`conditions-${node.id}`} label="Condiciones de visibilidad" onChange={(event) => setDraft((current) => ({ ...current, conditions: event.target.value }))} value={draft.conditions} />
      <TextArea className="min-h-20 font-mono" controlSize="compact" disabled={node.locked || pending} id={`accessibility-${node.id}`} label="Accesibilidad ARIA" onChange={(event) => setDraft((current) => ({ ...current, accessibility: event.target.value }))} value={draft.accessibility} />
      {resolved.diagnostics.length > 0 ? (
        <div className="rounded-md border border-warning/35 bg-warning/10 px-2 py-1.5 text-[0.625rem] text-foreground" role="status">
          <strong className="block text-xs">Diagnósticos</strong>
          <div className="mt-1 grid gap-1" role="list">
            {resolved.diagnostics.map((item, index) => (
              <div className="flex items-start gap-1.5 rounded bg-surface/65 px-1.5 py-1" key={`${item.code}-${item.path.join('.')}-${index}`} role="listitem">
                <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />
                <span>{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="rounded bg-danger-soft px-2 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
      <div className="flex gap-1">
        <Button className="flex-1" disabled={node.locked} isLoading={pending} loadingLabel="Guardando…" size="small" type="submit">Aplicar datos</Button>
        <Button disabled={!hasSettings || node.locked || pending} onClick={() => { void reset() }} size="small" variant="secondary">Reset datos</Button>
      </div>
    </form>
  )
}
