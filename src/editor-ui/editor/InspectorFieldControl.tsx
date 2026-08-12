import { useMemo, useState, type FormEvent } from 'react'
import { JsonValueSchema, type JsonValue, type Node, type WidgetDefinition } from '../../domain'
import { HelpTip } from '../primitives'
import { useEditorProject } from './editor-project-context'
import { getInspectorFieldHelp } from './feature-help'
import { formatInspectorValue, type GeneratedInspectorField } from './inspector-schema-model'

interface InspectorFieldControlProps {
  readonly definition: WidgetDefinition
  readonly field: GeneratedInspectorField
  readonly node: Node
}

const controlLabels = {
  asset: 'Recurso',
  binding: 'Dato dinámico',
  boolean: 'Activar / desactivar',
  color: 'Color',
  number: 'Número',
  select: 'Elegir opción',
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
      return { error: 'El valor debe usar un formato válido.', ok: false }
    }
  }
  const parsed = JsonValueSchema.safeParse(candidate)
  return parsed.success ? { ok: true, value: parsed.data } : { error: parsed.error.issues[0]?.message ?? 'Valor no válido.', ok: false }
}

function BindingChoice({
  active,
  disabled,
  label,
  onSelect,
  secondary,
}: {
  readonly active: boolean
  readonly disabled: boolean
  readonly label: string
  readonly onSelect: () => void
  readonly secondary: string
}) {
  return (
    <button
      aria-selected={active}
      className={`min-h-11 min-w-0 rounded-md border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${active ? 'border-primary/50 bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`}
      disabled={disabled}
      onClick={onSelect}
      role="option"
      type="button"
    >
      <strong className="block truncate text-[0.625rem]">{label}</strong>
      <span className="block truncate text-[0.5625rem] text-muted-foreground">{secondary}</span>
    </button>
  )
}

function EmptyBinding({ message, id }: { readonly id: string; readonly message: string }) {
  return <div className="mt-1 rounded-md border border-dashed border-border bg-muted/15 p-2 text-[0.625rem] leading-4 text-muted-foreground" id={id} role="status">{message}</div>
}

export function InspectorFieldControl({ definition, field, node }: InspectorFieldControlProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState(() => serializeDraft(field.value))
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const isComplex = Array.isArray(field.value) || (typeof field.value === 'object' && field.value !== null)
  const isQueryBinding = field.control === 'binding' && field.key === 'queryId'
  const isFieldBinding = field.control === 'binding' && field.key === 'fieldId'
  const isTaxonomyBinding = field.control === 'binding' && field.key === 'taxonomy'
  const help = getInspectorFieldHelp(field.key, field.control)
  const cms = session.store.structure.cms
  const queries = useMemo(
    () => Object.values(cms?.queries ?? {}).sort((left, right) => left.name === right.name ? 0 : left.name < right.name ? -1 : 1),
    [cms],
  )
  const queryId = node.kind === 'widget' && typeof node.properties.queryId === 'string' ? node.properties.queryId : ''
  const targetQuery = cms?.queries[queryId as keyof typeof cms.queries]
  const targetFields = useMemo(() => targetQuery
    ? Object.values(cms?.fields ?? {})
      .filter((item) => item.owner.kind === 'content-type' && item.owner.contentTypeId === targetQuery.contentTypeId)
      .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, 'es'))
    : [], [cms, targetQuery])
  const targetTaxonomies = useMemo(() => targetQuery
    ? Object.values(cms?.taxonomies ?? {})
      .filter((item) => item.contentTypeIds.includes(targetQuery.contentTypeId))
      .sort((left, right) => left.pluralName.localeCompare(right.pluralName, 'es'))
    : [], [cms, targetQuery])

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
  const disabled = node.locked || pending
  return (
    <form className="border-b border-border/70 py-2 last:border-b-0" data-inspector-field={field.key} onSubmit={(event) => { void submit(event) }}>
      <div className="flex items-start justify-between gap-1">
        <label className="min-w-0 flex-1" htmlFor={inputId}>
          <strong className="block truncate text-xs text-foreground">{field.label}</strong>
          <span className="block truncate text-[0.625rem] text-muted-foreground">{controlLabels[field.control]}</span>
        </label>
        <HelpTip description={help.description} example={help.example} label={help.label} reference={help.reference} />
        <span className={`mt-1 shrink-0 rounded px-1 py-0.5 text-[0.5625rem] font-bold ${field.source === 'node' ? 'bg-primary-soft text-primary-strong' : 'bg-muted text-muted-foreground'}`}>{field.source === 'node' ? 'Personalizado' : 'Predeterminado'}</span>
      </div>

      {field.control === 'boolean' ? (
        <button
          aria-checked={draft === 'true'}
          className="mt-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/25 px-2 text-left text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9"
          disabled={disabled}
          id={inputId}
          onClick={() => setDraft((current) => current === 'true' ? 'false' : 'true')}
          role="switch"
          type="button"
        >
          <span>{draft === 'true' ? 'Activado' : 'Desactivado'}</span>
          <span aria-hidden="true" className={`relative h-5 w-9 rounded-full border transition-colors ${draft === 'true' ? 'border-primary bg-primary' : 'border-border bg-muted'}`}>
            <span className={`absolute top-0.5 size-3.5 rounded-full bg-surface shadow-sm transition-transform ${draft === 'true' ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </span>
        </button>
      ) : isQueryBinding ? (
        queries.length > 0 ? (
          <div aria-label="Consultas guardadas" className="mt-1 grid max-h-44 gap-1 overflow-y-auto rounded-md border border-border bg-muted/10 p-1" id={inputId} role="listbox">
            {queries.map((query) => (
              <BindingChoice
                active={draft === query.id}
                disabled={disabled}
                key={query.id}
                label={query.name}
                onSelect={() => setDraft(query.id)}
                secondary={cms?.contentTypes[query.contentTypeId]?.pluralName ?? 'Tipo no disponible'}
              />
            ))}
          </div>
        ) : <EmptyBinding id={inputId} message="Todavía no hay una selección de contenido guardada. Créala en Contenido → Consultas." />
      ) : isFieldBinding ? (
        targetQuery ? (
          targetFields.length > 0 ? (
            <div aria-label="Campos del contenido" className="mt-1 grid max-h-44 gap-1 overflow-y-auto rounded-md border border-border bg-muted/10 p-1" id={inputId} role="listbox">
              {node.kind === 'widget' && node.widgetType === 'filter.search' ? <BindingChoice active={draft === ''} disabled={disabled} label="Todos los campos de texto" onSelect={() => setDraft('')} secondary="Buscar en todo el contenido" /> : null}
              {targetFields.map((item) => <BindingChoice active={draft === item.id} disabled={disabled} key={item.id} label={item.label} onSelect={() => setDraft(item.id)} secondary={item.type} />)}
            </div>
          ) : <EmptyBinding id={inputId} message="Este tipo de contenido todavía no tiene campos disponibles." />
        ) : <EmptyBinding id={inputId} message="Selecciona primero qué contenido utilizará este elemento." />
      ) : isTaxonomyBinding ? (
        targetQuery ? (
          targetTaxonomies.length > 0 ? (
            <div aria-label="Clasificaciones del contenido" className="mt-1 grid max-h-44 gap-1 overflow-y-auto rounded-md border border-border bg-muted/10 p-1" id={inputId} role="listbox">
              {targetTaxonomies.map((item) => <BindingChoice active={draft === item.id} disabled={disabled} key={item.id} label={item.pluralName} onSelect={() => setDraft(item.id)} secondary="Clasificación disponible" />)}
            </div>
          ) : <EmptyBinding id={inputId} message="Este contenido no tiene clasificaciones asociadas." />
        ) : <EmptyBinding id={inputId} message="Selecciona primero qué contenido utilizará este elemento." />
      ) : field.control === 'select' && field.options ? (
        <div aria-label={field.label} className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/10 p-1" id={inputId} role="listbox">
          {field.options.map((option) => (
            <button
              aria-selected={draft === String(option)}
              className={`min-h-11 rounded-md px-2 text-[0.625rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${draft === String(option) ? 'bg-primary text-on-primary' : 'bg-surface text-foreground hover:bg-muted'}`}
              disabled={disabled}
              key={option}
              onClick={() => setDraft(String(option))}
              role="option"
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      ) : isComplex || field.control === 'textarea' || field.control === 'spacing' ? (
        <textarea className="mt-1 min-h-20 w-full resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-focus" disabled={disabled} id={inputId} onChange={(event) => setDraft(event.target.value)} required={field.required} value={draft} />
      ) : (
        <div className="relative mt-1">
          {field.control === 'color' ? <span aria-hidden="true" className="absolute left-2 top-1/2 size-4 -translate-y-1/2 rounded border border-border" style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(draft) ? draft : 'transparent' }} /> : null}
          <input
            className={`min-h-11 w-full rounded-md border border-border bg-surface px-2 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${field.control === 'color' ? 'pl-8 font-mono' : ''}`}
            disabled={disabled}
            id={inputId}
            inputMode={field.control === 'number' ? 'decimal' : 'text'}
            onChange={(event) => setDraft(event.target.value)}
            required={field.required}
            type="text"
            value={draft}
          />
        </div>
      )}

      {field.options && field.control !== 'select' ? <p className="mt-1 truncate text-[0.5625rem] text-muted-foreground">Opciones disponibles: {field.options.join(', ')}</p> : null}
      {field.required ? <p className="mt-1 text-[0.5625rem] font-semibold text-primary-strong">Obligatorio</p> : null}
      {error ? <p className="mt-1 rounded bg-danger-soft px-1.5 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
      <div className="mt-1.5 flex gap-1">
        <button className="min-h-11 flex-1 rounded-md bg-primary px-2 text-[0.625rem] font-bold text-on-primary hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 lg:min-h-9" disabled={disabled} type="submit">{pending ? 'Guardando…' : 'Guardar'}</button>
        <button className="min-h-11 rounded-md border border-border px-2 text-[0.625rem] font-bold text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 lg:min-h-9" disabled={field.source === 'default' || disabled} onClick={() => { void reset() }} type="button">Restablecer</button>
      </div>
      <output className="sr-only" aria-label={`${field.label}: ${formatInspectorValue(field.value)}`}>{formatInspectorValue(field.value)}</output>
      <span className="sr-only">Opciones de {definition.label}</span>
    </form>
  )
}
