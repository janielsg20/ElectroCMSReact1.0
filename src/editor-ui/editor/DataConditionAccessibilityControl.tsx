import { useMemo, useState, type FormEvent } from 'react'
import {
  NodeDataSettingsSchema,
  listContentRecords,
  resolveNodeDataState,
  type BindingSource,
  type CmsRecordProperty,
  type Node,
  type NodeDataPreviewMode,
  type ProjectStructure,
  type WidgetDefinition,
} from '../../domain'
import { listCustomFields } from '../../domain/project/custom-field-engine'
import { useEditorProject } from './editor-project-context'

interface DataConditionAccessibilityControlProps {
  readonly definition?: WidgetDefinition
  readonly node: Node
  readonly structure: ProjectStructure
}

interface Draft {
  readonly accessibility: string
  readonly bindings: string
  readonly conditions: string
}

type CmsSourceKind = 'field' | 'property'

const inputClass = 'min-h-11 rounded-md border border-border bg-surface px-2 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9'
const recordProperties: readonly { readonly value: CmsRecordProperty; readonly label: string }[] = [
  { label: 'ID', value: 'id' },
  { label: 'Estado', value: 'status' },
  { label: 'Tipo de contenido', value: 'contentTypeId' },
  { label: 'Autor', value: 'authorId' },
  { label: 'Creado', value: 'createdAt' },
  { label: 'Actualizado', value: 'updatedAt' },
  { label: 'Términos', value: 'taxonomyTermIds' },
]

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

function parseBindingMap(source: string): Readonly<Record<string, BindingSource>> | null {
  const parsed = parseJson(source, 'Bindings')
  if (!parsed.ok || !parsed.value || Array.isArray(parsed.value) || typeof parsed.value !== 'object') return null
  const result = NodeDataSettingsSchema.shape.bindings.safeParse(parsed.value)
  return result.success ? result.data : null
}

function bindingSourceLabel(source: BindingSource, structure: ProjectStructure): string {
  if (source.kind === 'literal') return 'Literal'
  if (source.kind === 'project-path') return `Proyecto · ${source.path.join('.')}`
  if (source.kind === 'node-property') return `Nodo · ${source.nodeId.slice(0, 8)} · ${source.path.join('.')}`
  const record = structure.cms?.records[source.recordId]
  const recordLabel = record ? `${record.contentTypeId.slice(0, 8)} · ${record.id.slice(0, 8)}` : source.recordId.slice(0, 8)
  if (source.kind === 'cms-record-property') return `Registro ${recordLabel} · ${source.property}`
  const field = structure.cms?.fields[source.fieldId]
  return `Registro ${recordLabel} · ${field?.label ?? source.fieldId.slice(0, 8)}`
}

export function DataConditionAccessibilityControl({ definition, node, structure }: DataConditionAccessibilityControlProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState<Draft>(() => draftFromNode(node))
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const targetKeys = useMemo(() => [...new Set(definition?.inspector.map((field) => field.key) ?? [])], [definition])
  const records = useMemo(() => listContentRecords(structure), [structure])
  const fields = useMemo(() => listCustomFields(structure), [structure])
  const [bindingTarget, setBindingTarget] = useState(() => targetKeys[0] ?? '')
  const [recordId, setRecordId] = useState<string>(() => records[0]?.id ?? '')
  const [sourceKind, setSourceKind] = useState<CmsSourceKind>('field')
  const [fieldId, setFieldId] = useState('')
  const [recordProperty, setRecordProperty] = useState<CmsRecordProperty>('status')
  const [previewMode, setPreviewMode] = useState<NodeDataPreviewMode>(() => session.store.getNodeDataPreviewMode(node.id))
  const resolved = resolveNodeDataState(structure, node, node.properties)
  const bindings = parseBindingMap(draft.bindings)
  const selectedRecord = records.find((record) => record.id === recordId)
  const recordFields = selectedRecord
    ? fields.filter((field) => field.owner.kind === 'content-type' && field.owner.contentTypeId === selectedRecord.contentTypeId)
    : []
  const hasSettings = Object.keys(node.bindings).length > 0 || node.conditions.length > 0 || Object.keys(node.accessibility ?? {}).length > 0

  function selectRecord(nextRecordId: string): void {
    setRecordId(nextRecordId)
    const record = records.find((candidate) => candidate.id === nextRecordId)
    const firstField = record
      ? fields.find((field) => field.owner.kind === 'content-type' && field.owner.contentTypeId === record.contentTypeId)
      : undefined
    setFieldId(firstField?.id ?? '')
  }

  function applyCmsBinding(): void {
    setError('')
    setStatus('')
    if (!bindingTarget) {
      setError('Selecciona una propiedad declarada del widget.')
      return
    }
    if (!selectedRecord) {
      setError('Selecciona un registro existente.')
      return
    }
    if (sourceKind === 'field' && !fieldId) {
      setError('Selecciona un campo del registro.')
      return
    }
    const current = bindings ?? {}
    const source: BindingSource = sourceKind === 'field'
      ? { fieldId: fieldId as Extract<BindingSource, { kind: 'cms-record-field' }>['fieldId'], kind: 'cms-record-field', recordId: selectedRecord.id }
      : { kind: 'cms-record-property', property: recordProperty, recordId: selectedRecord.id }
    setDraft((value) => ({ ...value, bindings: JSON.stringify({ ...current, [bindingTarget]: source }, null, 2) }))
    setStatus(`Binding preparado para ${bindingTarget}. Pulsa Aplicar datos para guardarlo.`)
  }

  function removeBinding(key: string): void {
    const current = bindings
    if (!current) return
    const next = { ...current }
    delete next[key]
    setDraft((value) => ({ ...value, bindings: JSON.stringify(next, null, 2) }))
    setStatus(`Binding de ${key} retirado del borrador. Pulsa Aplicar datos para guardar.`)
  }

  function changePreviewMode(mode: NodeDataPreviewMode): void {
    setPreviewMode(mode)
    session.store.setNodeDataPreviewMode(node.id, mode)
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError('')
    setStatus('')
    const parsedBindings = parseJson(draft.bindings, 'Bindings')
    const conditions = parseJson(draft.conditions, 'Condiciones')
    const accessibility = parseJson(draft.accessibility, 'Accesibilidad')
    const parseError = [parsedBindings, conditions, accessibility].find((item) => !item.ok)
    if (parseError && !parseError.ok) {
      setError(parseError.error)
      return
    }
    if (!parsedBindings.ok || !conditions.ok || !accessibility.ok) return
    const parsed = NodeDataSettingsSchema.safeParse({
      accessibility: accessibility.value,
      bindings: parsedBindings.value,
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
      changePreviewMode('auto')
      setStatus('Datos, condiciones y accesibilidad restablecidos.')
    }
  }

  return (
    <form className="grid gap-2 border-t border-border p-2 lg:p-1.5" data-data-condition-control onSubmit={(event) => { void submit(event) }}>
      <div><h2 className="text-xs font-bold">Datos, visibilidad y ARIA</h2><p className="text-[0.625rem] leading-4 text-muted-foreground">Bindings CMS estructurados sobre el contrato de F07; JSON permanece disponible para condiciones y casos avanzados.</p></div>

      <section aria-labelledby={`cms-binding-title-${node.id}`} className="grid gap-1.5 rounded-md border border-border bg-muted/15 p-1.5">
        <div className="flex items-center justify-between gap-2"><strong className="text-xs" id={`cms-binding-title-${node.id}`}>Contenido dinámico</strong><span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{Object.keys(bindings ?? {}).length}</span></div>
        {definition && targetKeys.length > 0 ? (
          <>
            <label className="grid gap-1 text-[0.625rem] font-semibold">Propiedad destino<select aria-label="Propiedad destino" className={inputClass} onChange={(event) => setBindingTarget(event.target.value)} value={bindingTarget}>{targetKeys.map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
            <label className="grid gap-1 text-[0.625rem] font-semibold">Registro<select aria-label="Registro de contenido" className={inputClass} onChange={(event) => selectRecord(event.target.value)} value={recordId}><option value="">Selecciona un registro</option>{records.map((record) => <option key={record.id} value={record.id}>{structure.cms?.contentTypes[record.contentTypeId]?.pluralName ?? 'Contenido'} · {record.status} · {record.id.slice(0, 8)}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-1.5">
              <label className="grid min-w-0 gap-1 text-[0.625rem] font-semibold">Fuente<select aria-label="Fuente del binding" className={inputClass} onChange={(event) => setSourceKind(event.target.value as CmsSourceKind)} value={sourceKind}><option value="field">Campo</option><option value="property">Propiedad del registro</option></select></label>
              {sourceKind === 'field' ? <label className="grid min-w-0 gap-1 text-[0.625rem] font-semibold">Campo<select aria-label="Campo del registro" className={inputClass} onChange={(event) => setFieldId(event.target.value)} value={fieldId}><option value="">Selecciona</option>{recordFields.map((field) => <option key={field.id} value={field.id}>{field.label} · {field.type}</option>)}</select></label> : <label className="grid min-w-0 gap-1 text-[0.625rem] font-semibold">Propiedad<select aria-label="Propiedad del registro" className={inputClass} onChange={(event) => setRecordProperty(event.target.value as CmsRecordProperty)} value={recordProperty}>{recordProperties.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
            </div>
            <button className="min-h-11 rounded-md border border-primary/35 bg-primary-soft px-2 text-[0.625rem] font-bold text-primary-strong focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 lg:min-h-9" disabled={!recordId || (sourceKind === 'field' && !fieldId)} onClick={applyCmsBinding} type="button">Preparar binding CMS</button>
          </>
        ) : <p className="rounded border border-dashed border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">Esta selección no expone propiedades de widget declaradas; usa el contrato avanzado solo para condiciones o accesibilidad.</p>}

        {bindings && Object.keys(bindings).length > 0 ? <div aria-label="Bindings configurados" className="grid gap-1">{Object.entries(bindings).map(([key, source]) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded border border-border bg-surface p-1.5" key={key}><span className="min-w-0"><strong className="block truncate text-[0.625rem]">{key}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{bindingSourceLabel(source, structure)}</span></span><button aria-label={`Quitar binding ${key}`} className="min-h-9 rounded px-2 text-[0.625rem] font-bold text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus" onClick={() => removeBinding(key)} type="button">Quitar</button></div>)}</div> : null}
      </section>

      <section aria-labelledby={`preview-state-title-${node.id}`} className="grid gap-1 rounded-md border border-border p-1.5">
        <div className="flex items-center justify-between gap-2"><strong className="text-[0.625rem]" id={`preview-state-title-${node.id}`}>Estado de datos</strong><span className={`rounded px-1.5 py-0.5 text-[0.625rem] font-bold ${resolved.state === 'error' ? 'bg-danger-soft text-danger' : 'bg-muted text-muted-foreground'}`}>{resolved.state}</span></div>
        <label className="grid gap-1 text-[0.625rem] font-semibold">Preview transitorio<select aria-label="Estado de preview" className={inputClass} onChange={(event) => changePreviewMode(event.target.value as NodeDataPreviewMode)} value={previewMode}><option value="auto">Automático · datos reales</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select></label>
        <p className="text-[0.625rem] leading-4 text-muted-foreground">Loading/Empty/Error solo alteran el canvas de esta sesión; nunca se guardan en ProjectStructure.</p>
      </section>

      <details className="rounded-md border border-border bg-muted/10 p-1.5">
        <summary className="min-h-9 cursor-pointer py-2 text-xs font-bold">Contrato avanzado JSON</summary>
        <div className="grid gap-1.5 pt-1">
          <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`bindings-${node.id}`}>Bindings
            <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs" disabled={node.locked || pending} id={`bindings-${node.id}`} onChange={(event) => setDraft((current) => ({ ...current, bindings: event.target.value }))} value={draft.bindings} />
          </label>
          <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`conditions-${node.id}`}>Condiciones de visibilidad
            <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs" disabled={node.locked || pending} id={`conditions-${node.id}`} onChange={(event) => setDraft((current) => ({ ...current, conditions: event.target.value }))} value={draft.conditions} />
          </label>
          <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`accessibility-${node.id}`}>Accesibilidad ARIA
            <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs" disabled={node.locked || pending} id={`accessibility-${node.id}`} onChange={(event) => setDraft((current) => ({ ...current, accessibility: event.target.value }))} value={draft.accessibility} />
          </label>
        </div>
      </details>

      {resolved.diagnostics.length > 0 ? <div className="rounded border border-warning/35 bg-warning/10 px-2 py-1 text-[0.625rem] text-foreground" role="status"><strong>Diagnósticos</strong><ul className="list-disc pl-4">{resolved.diagnostics.map((item, index) => <li key={`${item.code}-${item.path.join('.')}-${index}`}>{item.message}</li>)}</ul></div> : null}
      {error ? <p className="rounded bg-danger-soft px-2 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
      <div className="flex gap-1">
        <button className="min-h-11 flex-1 rounded-md bg-primary px-2 text-[0.625rem] font-bold text-on-primary disabled:opacity-50 lg:min-h-9" disabled={node.locked || pending} type="submit">{pending ? 'Guardando…' : 'Aplicar datos'}</button>
        <button className="min-h-11 rounded-md border border-border px-2 text-[0.625rem] font-bold disabled:opacity-50 lg:min-h-9" disabled={!hasSettings || node.locked || pending} onClick={() => { void reset() }} type="button">Reset datos</button>
      </div>
    </form>
  )
}
