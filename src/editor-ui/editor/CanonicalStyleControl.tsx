import { useState, type FormEvent } from 'react'
import {
  JsonValueSchema,
  type JsonValue,
} from '../../domain/project/project-envelope'
import {
  STYLE_CLASSES_KEY,
  STYLE_STATES_KEY,
  editableVisualStyles,
  validateCanonicalStyles,
} from '../../domain/project/style-engine'
import type { Node } from '../../domain/project/structure-schema'
import { useEditorProject } from './editor-project-context'

interface CanonicalStyleControlProps {
  readonly node: Node
}

interface StyleDraft {
  readonly classes: string
  readonly declarations: string
  readonly states: string
}

function isJsonObject(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stableObject(value: Readonly<Record<string, JsonValue>>): Record<string, JsonValue> {
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]))
}

function serializeObject(value: Readonly<Record<string, JsonValue>>): string {
  return JSON.stringify(stableObject(value), null, 2)
}

function draftFromNode(node: Node): StyleDraft {
  const editable = editableVisualStyles(node.styles)
  const classes = Array.isArray(editable[STYLE_CLASSES_KEY])
    ? editable[STYLE_CLASSES_KEY].filter((value): value is string => typeof value === 'string').join(' ')
    : ''
  const states = isJsonObject(editable[STYLE_STATES_KEY]) ? editable[STYLE_STATES_KEY] : {}
  const declarations = Object.fromEntries(Object.entries(editable).filter(([key]) => !key.startsWith('$')))
  return { classes, declarations: serializeObject(declarations), states: serializeObject(states) }
}

function parseObject(source: string, label: string): { readonly ok: true; readonly value: Record<string, JsonValue> } | { readonly error: string; readonly ok: false } {
  let value: unknown
  try {
    value = JSON.parse(source) as unknown
  } catch {
    return { error: `${label} debe usar JSON válido.`, ok: false }
  }
  const parsed = JsonValueSchema.safeParse(value)
  if (!parsed.success || !isJsonObject(parsed.data)) return { error: `${label} debe ser un objeto JSON.`, ok: false }
  return { ok: true, value: parsed.data }
}

export function CanonicalStyleControl({ node }: CanonicalStyleControlProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState<StyleDraft>(() => draftFromNode(node))
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const hasEditableStyles = Object.keys(editableVisualStyles(node.styles)).length > 0

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError('')
    setStatus('')
    const declarations = parseObject(draft.declarations, 'Declaraciones')
    if (!declarations.ok) {
      setError(declarations.error)
      return
    }
    const states = parseObject(draft.states, 'Estados')
    if (!states.ok) {
      setError(states.error)
      return
    }
    const classes = [...new Set(draft.classes.split(/\s+/).map((item) => item.trim()).filter(Boolean))]
    const styles: Record<string, JsonValue> = {
      ...declarations.value,
      ...(classes.length > 0 ? { [STYLE_CLASSES_KEY]: classes } : {}),
      ...(Object.keys(states.value).length > 0 ? { [STYLE_STATES_KEY]: states.value } : {}),
    }
    const safe = validateCanonicalStyles(styles)
    if (!safe.ok) {
      setError(safe.error[0]?.message ?? 'Los estilos no son válidos.')
      return
    }
    setPending(true)
    const updated = await session.updateNodeVisualStyles(node.id, safe.value)
    setPending(false)
    if (!updated.ok) setError(updated.error)
    else setStatus('Estilos visuales actualizados.')
  }

  async function reset(): Promise<void> {
    setError('')
    setStatus('')
    setPending(true)
    const updated = await session.resetNodeVisualStyles(node.id)
    setPending(false)
    if (!updated.ok) setError(updated.error)
    else {
      setDraft({ classes: '', declarations: '{}', states: '{}' })
      setStatus('Estilos visuales restablecidos.')
    }
  }

  return (
    <form className="rounded-md border border-border bg-surface px-2 py-1.5" data-canonical-style-control onSubmit={(event) => { void submit(event) }}>
      <div>
        <strong className="block text-xs text-foreground">Estilos canónicos</strong>
        <p className="text-[0.625rem] leading-4 text-muted-foreground">Tokens, clases y estados seguros. El tamaño y espaciado se editan en el canvas.</p>
      </div>
      <label className="mt-1 block text-[0.625rem] font-semibold text-foreground" htmlFor={`style-classes-${node.id}`}>Clases</label>
      <input
        className="mt-0.5 min-h-9 w-full rounded-md border border-border bg-surface px-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-focus"
        disabled={node.locked || pending}
        id={`style-classes-${node.id}`}
        onChange={(event) => setDraft((current) => ({ ...current, classes: event.target.value }))}
        placeholder="card featured"
        value={draft.classes}
      />
      <label className="mt-1 block text-[0.625rem] font-semibold text-foreground" htmlFor={`style-declarations-${node.id}`}>Declaraciones seguras (JSON)</label>
      <textarea
        className="mt-0.5 min-h-24 w-full resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-focus"
        disabled={node.locked || pending}
        id={`style-declarations-${node.id}`}
        onChange={(event) => setDraft((current) => ({ ...current, declarations: event.target.value }))}
        value={draft.declarations}
      />
      <label className="mt-1 block text-[0.625rem] font-semibold text-foreground" htmlFor={`style-states-${node.id}`}>Estados hover/focus/focusVisible/active/disabled (JSON)</label>
      <textarea
        className="mt-0.5 min-h-20 w-full resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-focus"
        disabled={node.locked || pending}
        id={`style-states-${node.id}`}
        onChange={(event) => setDraft((current) => ({ ...current, states: event.target.value }))}
        value={draft.states}
      />
      {error ? <p className="mt-1 rounded bg-danger-soft px-1.5 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
      <div className="mt-1.5 flex gap-1">
        <button className="min-h-9 flex-1 rounded-md bg-primary px-2 text-[0.625rem] font-bold text-on-primary hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50" disabled={node.locked || pending} type="submit">{pending ? 'Guardando…' : 'Aplicar estilos'}</button>
        <button className="min-h-9 rounded-md border border-border px-2 text-[0.625rem] font-bold text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50" disabled={!hasEditableStyles || node.locked || pending} onClick={() => { void reset() }} type="button">Reset estilos</button>
      </div>
    </form>
  )
}
