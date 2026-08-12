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
import { ChoiceField, HelpTip } from '../primitives'
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

const recordProperties: readonly { readonly value: CmsRecordProperty; readonly label: string }[] = [
  { label: 'ID', value: 'id' },
  { label: 'Estado', value: 'status' },
  { label: 'Tipo de contenido', value: 'contentTypeId' },
  { label: 'Autor', value: 'authorId' },
  { label: 'Creado', value: 'createdAt' },
  { label: 'Actualizado', value: 'updatedAt' },
  { label: 'Términos', value: 'taxonomyTermIds' },
]

const sourceKindOptions = [
  { label: 'Campo personalizado', value: 'field', description: 'Usa el valor de un campo del contenido seleccionado.' },
  { label: 'Dato del contenido', value: 'property', description: 'Usa estado, autor, fecha u otra propiedad del registro.' },
] as const

const previewModeOptions = [
  { label: 'Automático', value: 'auto', description: 'Muestra los datos reales disponibles.' },
  { label: 'Cargando', value: 'loading', description: 'Simula el estado de carga solo en esta sesión.' },
  { label: 'Sin datos', value: 'empty', description: 'Simula un resultado vacío solo en esta sesión.' },
  { label: 'Error', value: 'error', description: 'Simula un error solo en esta sesión.' },
] as const

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
  const parsed = parseJson(source, 'Conexiones')
  if (!parsed.ok || !parsed.value || Array.isArray(parsed.value) || typeof parsed.value !== 'object') return null
  const result = NodeDataSettingsSchema.shape.bindings.safeParse(parsed.value)
  return result.success ? result.data : null
}

function bindingSourceLabel(source: BindingSource, structure: ProjectStructure): string {
  if (source.kind === 'literal') return 'Valor fijo'
  if (source.kind === 'project-path') return `Proyecto · ${source.path.join('.')}`
  if (source.kind === 'node-property') return `Otro elemento · ${source.path.join('.')}`
  const record = structure.cms?.records[source.recordId]
  const typeName = record ? structure.cms?.contentTypes[record.contentTypeId]?.singularName : undefined
  const recordLabel = typeName ?? 'Contenido'
  if (source.kind === 'cms-record-property') return `${recordLabel} · ${recordProperties.find((item) => item.value === source.property)?.label ?? source.property}`
  const field = structure.cms?.fields[source.fieldId]
  return `${recordLabel} · ${field?.label ?? 'Campo'}`
}

function resolvedStateLabel(state: string): string {
  if (state === 'ready') return 'Listo'
  if (state === 'loading') return 'Cargando'
  if (state === 'empty') return 'Sin datos'
  if (state === 'error') return 'Error'
  return state
}

export function DataConditionAccessibilityControl({ definition, node, structure }: DataConditionAccessibilityControlProps) {
  const session = useEditorProject()
  const [draft, setDraft] = useState<Draft>(() => draftFromNode(node))
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const targetKeys = useMemo(() => [...new Set(definition?.inspector.map((field) => field.key) ?? [])], [definition])
  const targetOptions = useMemo(() => targetKeys.map((key) => {
    const descriptor = definition?.inspector.find((field) => field.key === key)
    return { label: descriptor?.label ?? key, value: key, description: 'Propiedad que recibirá el contenido dinámico.' }
  }), [definition, targetKeys])
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
  const selectedRecord = useMemo(() => records.find((record) => record.id === recordId), [recordId, records])
  const recordFields = useMemo(() => selectedRecord
    ? fields.filter((field) => field.owner.kind === 'content-type' && field.owner.contentTypeId === selectedRecord.contentTypeId)
    : [], [fields, selectedRecord])
  const hasSettings = Object.keys(node.bindings).length > 0 || node.conditions.length > 0 || Object.keys(node.accessibility ?? {}).length > 0
  const recordOptions = useMemo(() => [
    { label: 'Selecciona contenido', value: '', description: 'Elige un registro existente.' },
    ...records.map((record) => ({
      description: `Estado: ${record.status}`,
      label: structure.cms?.contentTypes[record.contentTypeId]?.singularName ?? 'Contenido',
      value: record.id,
    })),
  ], [records, structure.cms?.contentTypes])
  const fieldOptions = useMemo(() => [
    { label: 'Selecciona un campo', value: '', description: 'Campo del contenido elegido.' },
    ...recordFields.map((field) => ({ label: field.label, value: field.id, description: field.type })),
  ], [recordFields])
  const propertyOptions = recordProperties.map((item) => ({ label: item.label, value: item.value }))

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
      setError('Selecciona qué propiedad quieres conectar.')
      return
    }
    if (!selectedRecord) {
      setError('Selecciona un contenido existente.')
      return
    }
    if (sourceKind === 'field' && !fieldId) {
      setError('Selecciona un campo del contenido.')
      return
    }
    const current = bindings ?? {}
    const source: BindingSource = sourceKind === 'field'
      ? { fieldId: fieldId as Extract<BindingSource, { kind: 'cms-record-field' }>['fieldId'], kind: 'cms-record-field', recordId: selectedRecord.id }
      : { kind: 'cms-record-property', property: recordProperty, recordId: selectedRecord.id }
    setDraft((value) => ({ ...value, bindings: JSON.stringify({ ...current, [bindingTarget]: source }, null, 2) }))
    const targetLabel = targetOptions.find((item) => item.value === bindingTarget)?.label ?? bindingTarget
    setStatus(`Conexión preparada para ${targetLabel}. Pulsa Aplicar cambios para guardarla.`)
  }

  function removeBinding(key: string): void {
    const current = bindings
    if (!current) return
    const next = { ...current }
    delete next[key]
    setDraft((value) => ({ ...value, bindings: JSON.stringify(next, null, 2) }))
    setStatus('Conexión retirada del borrador. Pulsa Aplicar cambios para guardar.')
  }

  function changePreviewMode(mode: NodeDataPreviewMode): void {
    setPreviewMode(mode)
    session.store.setNodeDataPreviewMode(node.id, mode)
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError('')
    setStatus('')
    const parsedBindings = parseJson(draft.bindings, 'Conexiones')
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
    else setStatus('Datos, visibilidad y accesibilidad actualizados.')
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
      setStatus('Datos, visibilidad y accesibilidad restablecidos.')
    }
  }

  return (
    <details className="group border-t border-border" data-data-condition-control open={hasSettings || undefined}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-2 text-xs font-bold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus lg:min-h-9 lg:px-1.5">
        <span className="min-w-0 flex-1">Datos dinámicos y opciones avanzadas</span>
        {hasSettings ? <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[0.5625rem] font-semibold text-primary-strong">Configurado</span> : null}
        <HelpTip description="Conecta propiedades del elemento con contenido del CMS y configura visibilidad o accesibilidad. Las opciones técnicas quedan apartadas para no complicar el flujo principal." example="Conecta el texto de un título con un campo personalizado del contenido actual." label="Datos dinámicos" reference="JetEngine — Dynamic Field / Dynamic Visibility" />
      </summary>
      <form className="grid gap-2 px-2 pb-2 lg:px-1.5 lg:pb-1.5" onSubmit={(event) => { void submit(event) }}>
        <section aria-labelledby={`cms-binding-title-${node.id}`} className="grid gap-1.5 border-b border-border/70 pb-2">
          <div className="flex items-center justify-between gap-2"><strong className="text-xs" id={`cms-binding-title-${node.id}`}>Contenido dinámico</strong><span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{Object.keys(bindings ?? {}).length}</span></div>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Elige qué propiedad del elemento recibirá información del contenido. Similar a los campos dinámicos de JetEngine.</p>
          {definition && targetKeys.length > 0 ? (
            <>
              <ChoiceField label="Qué quieres conectar" onChange={setBindingTarget} options={targetOptions} value={bindingTarget} />
              <ChoiceField label="Contenido" onChange={selectRecord} options={recordOptions} value={recordId} />
              <div className="grid gap-1.5 sm:grid-cols-2">
                <ChoiceField label="Origen del dato" onChange={(value) => setSourceKind(value as CmsSourceKind)} options={sourceKindOptions} value={sourceKind} />
                {sourceKind === 'field'
                  ? <ChoiceField label="Campo" onChange={setFieldId} options={fieldOptions} value={fieldId} />
                  : <ChoiceField label="Dato" onChange={(value) => setRecordProperty(value as CmsRecordProperty)} options={propertyOptions} value={recordProperty} />}
              </div>
              <button className="min-h-11 rounded-md border border-primary/35 bg-primary-soft px-2 text-[0.625rem] font-bold text-primary-strong focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 lg:min-h-9" disabled={!recordId || (sourceKind === 'field' && !fieldId)} onClick={applyCmsBinding} type="button">Preparar conexión</button>
            </>
          ) : <p className="rounded border border-dashed border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">Este elemento no expone propiedades conectables. Las opciones avanzadas de visibilidad y accesibilidad siguen disponibles.</p>}

          {bindings && Object.keys(bindings).length > 0 ? <div aria-label="Conexiones configuradas" className="grid gap-1">{Object.entries(bindings).map(([key, source]) => {
            const targetLabel = targetOptions.find((item) => item.value === key)?.label ?? key
            return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded bg-muted/20 p-1.5" key={key}><span className="min-w-0"><strong className="block truncate text-[0.625rem]">{targetLabel}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{bindingSourceLabel(source, structure)}</span></span><button aria-label={`Quitar conexión ${targetLabel}`} className="min-h-9 rounded px-2 text-[0.625rem] font-bold text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus" onClick={() => removeBinding(key)} type="button">Quitar</button></div>
          })}</div> : null}
        </section>

        <section aria-labelledby={`preview-state-title-${node.id}`} className="grid gap-1.5 border-b border-border/70 pb-2">
          <div className="flex items-center justify-between gap-2"><strong className="text-[0.625rem]" id={`preview-state-title-${node.id}`}>Vista previa de datos</strong><span className={`rounded px-1.5 py-0.5 text-[0.625rem] font-bold ${resolved.state === 'error' ? 'bg-danger-soft text-danger' : 'bg-muted text-muted-foreground'}`}>{resolvedStateLabel(resolved.state)}</span></div>
          <ChoiceField label="Estado de vista previa" onChange={(value) => changePreviewMode(value as NodeDataPreviewMode)} options={previewModeOptions} value={previewMode} />
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Los estados de prueba solo cambian el lienzo durante esta sesión y no alteran el proyecto guardado.</p>
        </section>

        <details className="rounded-md bg-muted/15 p-1.5">
          <summary className="min-h-9 cursor-pointer py-2 text-xs font-bold">Opciones avanzadas (JSON)</summary>
          <p className="pb-1 text-[0.625rem] leading-4 text-muted-foreground">Para usuarios avanzados: edita directamente conexiones, condiciones y atributos de accesibilidad.</p>
          <div className="grid gap-1.5 pt-1">
            <label className="grid gap-1 text-[0.625rem] font-semibold" htmlFor={`bindings-${node.id}`}>Conexiones
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

        {resolved.diagnostics.length > 0 ? <div className="rounded border border-border bg-muted/20 px-2 py-1 text-[0.625rem] text-foreground" role="status"><strong>Revisa esta configuración</strong><ul className="list-disc pl-4">{resolved.diagnostics.map((item, index) => <li key={`${item.code}-${item.path.join('.')}-${index}`}>{item.message}</li>)}</ul></div> : null}
        {error ? <p className="rounded bg-danger-soft px-2 py-1 text-[0.625rem] text-danger" role="alert">{error}</p> : null}
        <p aria-live="polite" className="sr-only">{status}</p>
        <div className="flex gap-1">
          <button className="min-h-11 flex-1 rounded-md bg-primary px-2 text-[0.625rem] font-bold text-on-primary disabled:opacity-50 lg:min-h-9" disabled={node.locked || pending} type="submit">{pending ? 'Guardando…' : 'Aplicar cambios'}</button>
          <button className="min-h-11 rounded-md border border-border px-2 text-[0.625rem] font-bold disabled:opacity-50 lg:min-h-9" disabled={!hasSettings || node.locked || pending} onClick={() => { void reset() }} type="button">Restablecer</button>
        </div>
      </form>
    </details>
  )
}
