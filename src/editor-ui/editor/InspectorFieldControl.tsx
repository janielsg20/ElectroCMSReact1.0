import { useState, type FormEvent } from 'react'
import { JsonValueSchema, type JsonValue, type Node, type WidgetDefinition } from '../../domain'
import { Button, Checkbox, ControlInput, Select, TextArea } from '../primitives'
import { useEditorProject } from './editor-project-context'
import { formatInspectorValue, type GeneratedInspectorField } from './inspector-schema-model'

interface InspectorFieldControlProps {
  readonly definition: WidgetDefinition
  readonly field: GeneratedInspectorField
  readonly node: Node
}

const controlLabels = {
  asset: 'Recurso',
  binding: 'Binding',
  boolean: 'Booleano',
  color: 'Color',
  number: 'Número',
  select: 'Selección',
  spacing: 'Espaciado',
  text: 'Texto',
  textarea: 'Texto largo',
} as const

function serializeDraft(value: JsonValue | undefined): string {
  if (value === undefined) return ''
  return typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value, null, 2)
}

function parseDraft(field: GeneratedInspectorField, source: string): { readonly ok: true; readonly value: JsonValue } | { readonly ok: false; readonly error: string } {
  const current = field.value
  let candidate: unknown = source
  if (field.control === 'boolean') candidate = source === 'true'
  else if (field.control === 'number' || (field.control === 'select' && typeof current === 'number')) {
    const number = Number(source)
    if (!Number.isFinite(number)) return { error: 'Introduce un número válido.', ok: false }
    candidate = number
  } else if (Array.isArray(current) || (typeof current === 'object' && current !== null)) {
    try {
      candidate = JSON.parse(source) as unknown
    } catch {
      return { error: 'El valor debe usar JSON válido.', ok: false }
    }
  }
  const parsed = JsonValueSchema.safeParse(candidate)
  return parsed.success ? { ok: true, value: parsed.data } : { error: parsed.error.issues[0]?.message ?? 'Valor no válido.', ok: false }
}

export function InspectorFieldControl({ definition, field, node }: InspectorFieldControlProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState(() => serializeDraft(field.value))
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const isComplex = Array.isArray(field.value) || (typeof field.value === 'object' && field.value !== null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')
    const parsed = parseDraft(field, draft)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setPending(true)
    const updated = await session.updateWidgetProperty(node.id, field.key, parsed.value)
    setPending(false)
    if (!updated.ok) setError(updated.error)
    else setStatus(`${field.label} actualizado.`)
  }

  async function reset() {
    setError('')
    setStatus('')
    setPending(true)
    const updated = await session.resetWidgetProperty(node.id, field.key)
    setPending(false)
    if (!updated.ok) setError(updated.error)
    else setStatus(`${field.label} restablecido.`)
  }

  const inputId = `inspector-${node.id}-${field.key}`
  const controlDisabled = node.locked || pending
  return (
    <form className="rounded-md border border-border bg-surface px-2 py-1.5 shadow-sm" data-electrocms-surface="inspector-field" data-inspector-field={field.key} onSubmit={(event) => { void submit(event) }}>
      <div className="flex items-start justify-between gap-2">
        <label className="min-w-0 flex-1" htmlFor={inputId}><strong className="block truncate text-xs text-foreground">{field.label}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{field.key} · {controlLabels[field.control]}</span></label>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide ${field.source === 'node' ? 'bg-primary-soft text-primary-strong' : 'bg-muted text-muted-foreground'}`}>{field.source === 'node' ? 'Nodo' : 'Predeterminado'}</span>
      </div>

      <div className="mt-1">
        {field.control === 'boolean' ? (
          <Checkbox
            checked={draft === 'true'}
            className="bg-muted/30"
            disabled={controlDisabled}
            id={inputId}
            label={draft === 'true' ? 'Activado' : 'Desactivado'}
            onCheckedChange={(checked) => setDraft(String(checked))}
          />
        ) : field.control === 'select' && field.options ? (
          <Select
            controlSize="compact"
            disabled={controlDisabled}
            id={inputId}
            label={field.label}
            labelHidden
            onValueChange={setDraft}
            options={field.options.map((option) => ({ label: option, value: option }))}
            required={field.required}
            value={draft}
          />
        ) : isComplex || field.control === 'textarea' || field.control === 'spacing' ? (
          <TextArea
            className="min-h-20 font-mono"
            controlSize="compact"
            disabled={controlDisabled}
            id={inputId}
            label={field.label}
            labelHidden
            onChange={(event) => setDraft(event.target.value)}
            required={field.required}
            value={draft}
          />
        ) : field.control === 'color' ? (
          <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-muted/20 p-1">
            <span aria-hidden="true" className="size-6 shrink-0 rounded border border-border shadow-sm" style={{ backgroundColor: draft || 'transparent' }} />
            <ControlInput
              aria-label={field.label}
              className="flex-1 font-mono"
              controlSize="compact"
              disabled={controlDisabled}
              id={inputId}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="#2563EB, rgb(…), var(…)"
              required={field.required}
              type="text"
              value={draft}
            />
          </div>
        ) : (
          <ControlInput
            aria-label={field.label}
            className="w-full"
            controlSize="compact"
            disabled={controlDisabled}
            id={inputId}
            inputMode={field.control === 'number' ? 'decimal' : undefined}
            onChange={(event) => setDraft(event.target.value)}
            required={field.required}
            type="text"
            value={draft}
          />
        )}
      </div>

      {field.options && field.control !== 'select' ? <p className="mt-1 truncate text-[0.5625rem] text-muted-foreground">Opciones: {field.options.join(', ')}</p> : null}
      {field.required ? <p className="mt-1 text-[0.5625rem] font-semibold text-primary-strong">Campo obligatorio</p> : null}
      {error ? <p className="mt-1 rounded bg-danger-soft px-1.5 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
      <div className="mt-1.5 flex gap-1">
        <Button className="flex-1" disabled={node.locked} isLoading={pending} loadingLabel="Guardando…" size="small" type="submit">Aplicar</Button>
        <Button disabled={field.source === 'default' || node.locked || pending} onClick={() => { void reset() }} size="small" variant="secondary">Reset</Button>
      </div>
      <output className="sr-only" aria-label={`${field.label}: ${formatInspectorValue(field.value)}`}>{formatInspectorValue(field.value)}</output>
      <span className="sr-only">Schema: {definition.id}</span>
    </form>
  )
}
