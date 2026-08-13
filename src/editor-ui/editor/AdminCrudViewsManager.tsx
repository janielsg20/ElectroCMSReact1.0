import { useMemo, useState } from 'react'
import {
  deleteContentRecord,
  executeSavedCmsQuery,
  listContentRecords,
  parseContentRecordId,
  parseContentRecordRevisionId,
  parseTimestamp,
  updateContentRecord,
  type BackendScreen,
  type BackendScreenId,
  type CmsBackend,
  type ContentRecord,
  type ContentRecordId,
  type ContentStatus,
  type ContentTypeId,
  type FieldDefinition,
  type Form,
  type FormId,
  type JsonValue,
  type QueryId,
} from '../../domain'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import { Button, ChoiceField, HelpTip, Icon, TextField } from '../primitives'
import { useBackendShellSession } from './backend-shell-session-context'
import { useEditorProjectStructure, useRecordRelationSession } from './editor-project-context'

type AdminViewKind = Extract<BackendScreen['kind'], 'table' | 'form' | 'detail' | 'calendar' | 'kanban' | 'chart' | 'metrics' | 'listing'>
type EditorTarget = 'new' | ContentRecordId | null

interface EditableField {
  readonly field: FieldDefinition
  readonly label: string
}

const viewKinds: readonly { readonly label: string; readonly description: string; readonly value: AdminViewKind }[] = [
  { label: 'Tabla', description: 'Filas compactas con selección, acciones y columnas dinámicas.', value: 'table' },
  { label: 'Formulario', description: 'Alta y edición usando el formulario o los campos del CPT.', value: 'form' },
  { label: 'Detalle', description: 'Ficha de un registro con edición contextual.', value: 'detail' },
  { label: 'Calendario', description: 'Agrupa registros por campo fecha o por creación.', value: 'calendar' },
  { label: 'Kanban', description: 'Columnas por estado editorial con acceso al registro.', value: 'kanban' },
  { label: 'Métricas', description: 'Resumen de totales y distribución por estado.', value: 'metrics' },
  { label: 'Gráfico', description: 'Distribución visual simple basada en los datos actuales.', value: 'chart' },
  { label: 'Listado', description: 'Tarjetas compactas para recorrer registros.', value: 'listing' },
]

const statuses: readonly ContentStatus[] = ['draft', 'pending', 'published', 'private', 'archived']
const statusLabels: Record<ContentStatus, string> = {
  archived: 'Archivado',
  draft: 'Borrador',
  pending: 'Pendiente',
  private: 'Privado',
  published: 'Publicado',
}
const stringFieldTypes = new Set<FieldDefinition['type']>([
  'text', 'email', 'phone', 'url', 'date', 'time', 'datetime', 'color', 'image', 'file',
])

function isAdminViewKind(kind: BackendScreen['kind']): kind is AdminViewKind {
  return viewKinds.some((item) => item.value === kind)
}

function scalarLabel(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value)) return value.map((item) => scalarLabel(item)).join(', ')
  return JSON.stringify(value)
}

function contentTypeFields(cms: CmsBackend, contentTypeId: ContentTypeId): readonly FieldDefinition[] {
  const type = cms.contentTypes[contentTypeId]
  return (type?.fieldIds ?? [])
    .flatMap((id) => cms.fields[id] ? [cms.fields[id]] : [])
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, 'es'))
}

function recordLabel(record: ContentRecord, fields: readonly FieldDefinition[]): string {
  const preferred = fields.find((field) => ['title', 'name', 'label'].includes(field.key))
    ?? fields.find((field) => field.type === 'text')
    ?? fields[0]
  const value = preferred ? record.values[preferred.id] : undefined
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : `${statusLabels[record.status]} · ${record.id.slice(0, 8)}`
}

function recordSearchText(record: ContentRecord, fields: readonly FieldDefinition[]): string {
  return [recordLabel(record, fields), record.status, ...Object.values(record.values).map((value) => scalarLabel(value))]
    .join(' ')
    .toLocaleLowerCase('es')
}

function mappedEditableFields(cms: CmsBackend, contentTypeId: ContentTypeId, form: Form | null): readonly EditableField[] {
  const fallback = contentTypeFields(cms, contentTypeId).map((field) => ({ field, label: field.label }))
  if (!form) return fallback
  const orderedControlIds = form.steps.flatMap((step) => step.controlIds)
  const seen = new Set<string>()
  const mapped = orderedControlIds.flatMap((controlId) => {
    const control = form.controls[controlId]
    if (!control?.mappedFieldId || seen.has(control.mappedFieldId)) return []
    const field = cms.fields[control.mappedFieldId]
    if (!field || field.owner.kind !== 'content-type' || field.owner.contentTypeId !== contentTypeId) return []
    seen.add(field.id)
    return [{ field, label: control.label }]
  })
  return mapped.length > 0 ? mapped : fallback
}

function JsonAdminField({ field, label, onChange, value }: {
  readonly field: FieldDefinition
  readonly label: string
  readonly onChange: (value: JsonValue | undefined) => void
  readonly value: JsonValue | undefined
}) {
  const [text, setText] = useState(() => value === undefined ? '' : JSON.stringify(value, null, 2))
  const [error, setError] = useState('')
  return (
    <details className="rounded-md border border-border bg-muted/10">
      <summary className="min-h-11 cursor-pointer px-2 py-2 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:py-1.5">{label} <span className="font-normal text-muted-foreground">· opciones avanzadas</span></summary>
      <div className="grid gap-1 border-t border-border p-2">
      <label className="text-xs font-semibold text-muted-foreground" htmlFor={`admin-json-${field.id}`}>Valor estructurado</label>
      <textarea
        aria-invalid={Boolean(error)}
        className="min-h-24 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-focus"
        id={`admin-json-${field.id}`}
        onBlur={() => {
          if (!text.trim()) {
            setError('')
            onChange(undefined)
            return
          }
          try {
            onChange(JSON.parse(text) as JsonValue)
            setError('')
          } catch {
            setError('El valor estructurado no es JSON válido.')
          }
        }}
        onChange={(event) => setText(event.target.value)}
        value={text}
      />
      {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : <p className="text-[0.625rem] text-muted-foreground">Usa esta opción solo si el tipo de campo requiere una estructura compleja.</p>}
      </div>
    </details>
  )
}

function AdminFieldControl({ cms, descriptor, onChange, value }: {
  readonly cms: CmsBackend
  readonly descriptor: EditableField
  readonly onChange: (value: JsonValue | undefined) => void
  readonly value: JsonValue | undefined
}) {
  const { field, label } = descriptor
  if (field.type === 'calculated') {
    return <div className="rounded-md border border-dashed border-border bg-muted/20 px-2 py-2 text-xs text-muted-foreground"><strong className="text-foreground">{label}</strong><span className="ml-1">se calcula automáticamente.</span></div>
  }
  if (field.type === 'switch') {
    const checked = value === true
    return (
      <div className="grid gap-1">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <button aria-checked={checked} className={`flex min-h-11 items-center justify-between rounded-md border px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${checked ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground'}`} onClick={() => onChange(!checked)} role="switch" type="button">
          <span>{checked ? 'Activo' : 'Inactivo'}</span><span aria-hidden="true" className={`h-5 w-9 rounded-full p-0.5 ${checked ? 'bg-primary' : 'bg-muted'}`}><span className={`block size-4 rounded-full bg-surface shadow-sm transition-transform ${checked ? 'translate-x-4' : ''}`} /></span>
        </button>
      </div>
    )
  }
  if ((field.type === 'select' || field.type === 'radio') && field.options.length > 0) {
    const selected = field.options.findIndex((option) => JSON.stringify(option.value) === JSON.stringify(value))
    return <ChoiceField label={label} onChange={(next) => onChange(next === '' ? undefined : structuredClone(field.options[Number(next)]?.value))} options={[{ label: 'Sin valor', value: '' }, ...field.options.map((option, index) => ({ label: option.label, value: String(index) }))]} value={selected >= 0 ? String(selected) : ''} />
  }
  if (field.type === 'checkbox' && field.options.length > 0) {
    const selected = Array.isArray(value) ? value : []
    return (
      <fieldset className="grid gap-1 rounded-md border border-border p-2">
        <legend className="px-1 text-xs font-semibold text-muted-foreground">{label}</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {field.options.map((option, index) => {
            const checked = selected.some((item) => JSON.stringify(item) === JSON.stringify(option.value))
            return <button aria-checked={checked} className={`min-h-11 rounded-md border px-2 text-left text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${checked ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface'}`} key={`${field.id}-${index}`} onClick={() => onChange(checked ? selected.filter((item) => JSON.stringify(item) !== JSON.stringify(option.value)) : [...selected, structuredClone(option.value)])} role="checkbox" type="button">{option.label}</button>
          })}
        </div>
      </fieldset>
    )
  }
  if (field.type === 'user') {
    return <ChoiceField label={label} onChange={(next) => onChange(next || undefined)} options={[{ label: 'Sin usuario', value: '' }, ...Object.values(cms.users).map((user) => ({ label: user.displayName, value: user.id }))]} value={typeof value === 'string' ? value : ''} />
  }
  if (field.type === 'taxonomy' && field.taxonomyId) {
    const terms = Object.values(cms.taxonomyTerms).filter((term) => term.taxonomyId === field.taxonomyId)
    return <ChoiceField label={label} onChange={(next) => onChange(next || undefined)} options={[{ label: 'Sin término', value: '' }, ...terms.map((term) => ({ label: term.name, value: term.id }))]} value={typeof value === 'string' ? value : ''} />
  }
  if (field.type === 'relation' && field.relationId) {
    const relation = cms.relations[field.relationId]
    const ownerId = field.owner.kind === 'content-type' ? field.owner.contentTypeId : null
    const targetId = relation?.sourceContentTypeId === ownerId ? relation.targetContentTypeId : relation?.sourceContentTypeId
    const targetFields = targetId ? contentTypeFields(cms, targetId) : []
    const records = targetId ? Object.values(cms.records).filter((record) => record.contentTypeId === targetId) : []
    return <ChoiceField label={label} onChange={(next) => onChange(next || undefined)} options={[{ label: 'Sin relación', value: '' }, ...records.map((record) => ({ label: recordLabel(record, targetFields), value: record.id }))]} value={typeof value === 'string' ? value : ''} />
  }
  if (field.type === 'number' || field.type === 'currency') {
    return <TextField label={label} max={field.validation.max ?? undefined} min={field.validation.min ?? undefined} onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))} required={field.required} step={field.type === 'currency' ? '0.01' : 'any'} type="number" value={typeof value === 'number' ? value : ''} />
  }
  if (field.type === 'textarea' || field.type === 'rich-text') {
    return (
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor={`admin-text-${field.id}`}>{label}{field.required ? ' *' : ''}</label>
        <textarea className="min-h-24 resize-y rounded-md border border-border bg-surface p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus lg:text-xs" id={`admin-text-${field.id}`} onChange={(event) => onChange(event.target.value || undefined)} placeholder={field.placeholder} required={field.required} value={typeof value === 'string' ? value : ''} />
      </div>
    )
  }
  if (stringFieldTypes.has(field.type)) {
    const htmlType = field.type === 'datetime' ? 'datetime-local' : field.type === 'phone' ? 'tel' : field.type === 'image' || field.type === 'file' ? 'text' : field.type
    return <TextField label={label} onChange={(event) => onChange(event.target.value || undefined)} placeholder={field.placeholder} required={field.required} type={htmlType} value={typeof value === 'string' ? value : ''} />
  }
  return <JsonAdminField field={field} label={label} onChange={onChange} value={value} />
}

function AdminRecordEditor({ cms, contentTypeId, form, record, onClose }: {
  readonly cms: CmsBackend
  readonly contentTypeId: ContentTypeId
  readonly form: Form | null
  readonly record: ContentRecord | null
  readonly onClose: () => void
}) {
  const session = useRecordRelationSession()
  const descriptors = useMemo(() => mappedEditableFields(cms, contentTypeId, form), [cms, contentTypeId, form])
  const [status, setStatus] = useState<ContentStatus>(record?.status ?? 'draft')
  const [values, setValues] = useState<Record<string, JsonValue>>(() => record ? structuredClone(record.values) : Object.fromEntries(descriptors.flatMap(({ field }) => field.defaultValue === null ? [] : [[field.id, structuredClone(field.defaultValue)]])))
  const [termIds, setTermIds] = useState<readonly string[]>(record?.taxonomyTermIds ?? [])
  const [pending, setPending] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [notice, setNotice] = useState('')
  const type = cms.contentTypes[contentTypeId]
  const terms = type ? Object.values(cms.taxonomyTerms).filter((term) => type.taxonomyIds.includes(term.taxonomyId)) : []

  function setField(fieldId: string, value: JsonValue | undefined): void {
    setValues((current) => {
      const next = { ...current }
      if (value === undefined) delete next[fieldId]
      else next[fieldId] = value
      return next
    })
  }

  async function save(): Promise<void> {
    if (pending) return
    setPending(true)
    const timestamp = parseTimestamp(new Date().toISOString())
    const result = record
      ? await session.updateContentRecord(record.id, { status, taxonomyTermIds: termIds as ContentRecord['taxonomyTermIds'], values: structuredClone(values) })
      : await session.createContentRecord({
        authorId: null,
        contentTypeId,
        createdAt: timestamp,
        id: parseContentRecordId(crypto.randomUUID()),
        status,
        taxonomyTermIds: termIds as ContentRecord['taxonomyTermIds'],
        updatedAt: timestamp,
        values: structuredClone(values),
      })
    setPending(false)
    setNotice(result.ok ? (record ? 'Registro actualizado.' : 'Registro creado.') : result.error)
    if (result.ok) onClose()
  }

  async function remove(): Promise<void> {
    if (!record || pending) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      setNotice('Pulsa de nuevo para confirmar la eliminación.')
      return
    }
    setPending(true)
    const result = await session.deleteContentRecord(record.id)
    setPending(false)
    setNotice(result.ok ? 'Registro eliminado.' : result.error)
    if (result.ok) onClose()
  }

  return (
    <section aria-label={record ? 'Editar registro administrativo' : 'Crear registro administrativo'} className="grid gap-2 rounded-lg border border-primary/20 bg-surface p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div><strong className="text-xs text-foreground">{record ? 'Editar registro' : `Nuevo ${type?.singularName ?? 'registro'}`}</strong><p className="text-[0.625rem] text-muted-foreground">{form ? `Formulario adaptable: ${form.name}` : 'Campos del tipo de contenido'}</p></div>
        <Button onClick={onClose} size="small" variant="ghost"><Icon name="close" size={12} />Cerrar</Button>
      </div>
      {notice ? <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground" role="status">{notice}</p> : null}
      <ChoiceField label="Estado" onChange={(value) => setStatus(value as ContentStatus)} options={statuses.map((item) => ({ label: statusLabels[item], value: item }))} value={status} />
      <div className="grid gap-2 md:grid-cols-2">
        {descriptors.map((descriptor) => <AdminFieldControl cms={cms} descriptor={descriptor} key={descriptor.field.id} onChange={(value) => setField(descriptor.field.id, value)} value={values[descriptor.field.id]} />)}
      </div>
      {terms.length > 0 ? (
        <fieldset className="grid gap-1 rounded-md border border-border p-2"><legend className="px-1 text-xs font-semibold text-muted-foreground">Clasificaciones</legend><div className="grid gap-1 sm:grid-cols-2">{terms.map((term) => {
          const checked = termIds.includes(term.id)
          return <button aria-checked={checked} className={`min-h-11 rounded-md border px-2 text-left text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${checked ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface'}`} key={term.id} onClick={() => setTermIds((current) => checked ? current.filter((id) => id !== term.id) : [...current, term.id])} role="checkbox" type="button">{term.name}</button>
        })}</div></fieldset>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <div>{record ? <Button disabled={pending} onClick={() => { void remove() }} size="small" variant={deleteArmed ? 'destructive' : 'ghost'}>{deleteArmed ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div>
        <Button isLoading={pending} loadingLabel="Guardando" onClick={() => { void save() }} size="small"><Icon name="check" size={12} />{record ? 'Guardar cambios' : 'Crear registro'}</Button>
      </div>
    </section>
  )
}

function MetricsView({ records }: { readonly records: readonly ContentRecord[] }) {
  const counts = Object.fromEntries(statuses.map((status) => [status, records.filter((record) => record.status === status).length])) as Record<ContentStatus, number>
  const max = Math.max(1, ...Object.values(counts))
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {statuses.map((status) => <div className="grid gap-1 rounded-lg border border-border bg-surface p-2" key={status}><span className="text-[0.625rem] font-semibold text-muted-foreground">{statusLabels[status]}</span><strong className="text-xl text-foreground">{counts[status]}</strong><span className="h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((counts[status] / max) * 100)}%` }} /></span></div>)}
    </div>
  )
}

function StatusChartView({ records }: { readonly records: readonly ContentRecord[] }) {
  const counts = Object.fromEntries(statuses.map((status) => [status, records.filter((record) => record.status === status).length])) as Record<ContentStatus, number>
  const max = Math.max(1, ...Object.values(counts))
  return <div aria-label="Gráfico de registros por estado" className="grid min-h-44 grid-cols-5 items-end gap-2 rounded-lg border border-border bg-surface p-3">
    {statuses.map((status) => <div className="grid h-full grid-rows-[minmax(7rem,1fr)_auto] items-end gap-2 text-center" key={status}><span aria-label={`${statusLabels[status]}: ${counts[status]}`} className="mx-auto w-full max-w-12 rounded-t-md bg-primary/80" style={{ height: `${Math.max(6, Math.round((counts[status] / max) * 100))}%` }} title={`${statusLabels[status]}: ${counts[status]}`} /><span className="text-[0.625rem] font-semibold text-muted-foreground">{statusLabels[status]}<br />{counts[status]}</span></div>)}
  </div>
}

export function AdminCrudViewsManager({ screenId }: { readonly screenId: BackendScreenId }) {
  const backend = useBackendShellSession()
  const recordsSession = useRecordRelationSession()
  const structure = useEditorProjectStructure()
  const cms = useMemo(() => projectCmsBackend(structure.cms), [structure.cms])
  const screen = cms.backendScreens[screenId]
  const contentTypes = useMemo(() => Object.values(cms.contentTypes).sort((a, b) => a.order - b.order || a.pluralName.localeCompare(b.pluralName, 'es')), [cms.contentTypes])
  const initialContentTypeId = screen?.contentTypeId ?? contentTypes[0]?.id ?? null
  const [contentTypeId, setContentTypeId] = useState<ContentTypeId | null>(initialContentTypeId)
  const [kind, setKind] = useState<AdminViewKind>(screen && isAdminViewKind(screen.kind) ? screen.kind : 'table')
  const [queryId, setQueryId] = useState<QueryId | null>(screen?.queryId ?? null)
  const [formId, setFormId] = useState<FormId | null>(screen?.formId ?? null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all')
  const [selectedIds, setSelectedIds] = useState<readonly ContentRecordId[]>([])
  const [bulkAction, setBulkAction] = useState(`status:published`)
  const [bulkDeleteArmed, setBulkDeleteArmed] = useState(false)
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')

  const queries = useMemo(() => contentTypeId ? Object.values(cms.queries).filter((query) => query.contentTypeId === contentTypeId).sort((a, b) => a.name.localeCompare(b.name, 'es')) : [], [cms.queries, contentTypeId])
  const forms = useMemo(() => contentTypeId ? Object.values(cms.forms).filter((form) => form.contentTypeId === null || form.contentTypeId === contentTypeId).sort((a, b) => a.name.localeCompare(b.name, 'es')) : [], [cms.forms, contentTypeId])
  const persistedContentTypeId = screen?.contentTypeId ?? null
  const persistedContentType = persistedContentTypeId ? cms.contentTypes[persistedContentTypeId] : undefined
  const fields = useMemo(() => persistedContentTypeId ? contentTypeFields(cms, persistedContentTypeId) : [], [cms, persistedContentTypeId])
  const configuredFormId = screen?.formId ?? null
  const configuredForm = configuredFormId ? cms.forms[configuredFormId] ?? null : null
  const persistedQueryId = screen?.queryId ?? null
  const queried = useMemo(() => persistedQueryId ? executeSavedCmsQuery(cms, persistedQueryId) : null, [cms, persistedQueryId])
  const sourceRecords = useMemo(() => {
    if (queried?.ok) return queried.value.records
    return persistedContentTypeId ? listContentRecords(structure, persistedContentTypeId) : []
  }, [persistedContentTypeId, queried, structure])
  const visibleRecords = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('es')
    return sourceRecords.filter((record) => (statusFilter === 'all' || record.status === statusFilter) && (!needle || recordSearchText(record, fields).includes(needle)))
  }, [fields, search, sourceRecords, statusFilter])
  const editorRecord = editorTarget && editorTarget !== 'new' ? cms.records[editorTarget] ?? null : null
  const tableFields = fields.filter((field) => !['repeater', 'group', 'gallery'].includes(field.type)).slice(0, 4)

  async function saveView(): Promise<void> {
    if (!screen || !contentTypeId || pending) return
    setPending(true)
    const result = await backend.updateAdminShell(screen.id, {
      contentTypeId,
      formId,
      queryId,
      screenKind: kind,
    })
    setPending(false)
    setNotice(result.ok ? 'Vista administrativa guardada y enlazada a los datos canónicos.' : result.error)
    setSelectedIds([])
  }

  function toggleSelected(recordId: ContentRecordId): void {
    setSelectedIds((current) => current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId])
    setBulkDeleteArmed(false)
  }

  function preflightBulk(): string | null {
    if (selectedIds.length === 0) return 'Selecciona al menos un registro.'
    let candidate = structure
    const now = parseTimestamp(new Date().toISOString())
    for (const recordId of selectedIds) {
      const result = bulkAction === 'delete'
        ? deleteContentRecord(candidate, recordId)
        : updateContentRecord(candidate, recordId, { status: bulkAction.replace('status:', '') as ContentStatus }, { now, revisionId: parseContentRecordRevisionId(crypto.randomUUID()) })
      if (!result.ok) return result.error[0]?.message ?? 'La acción masiva no es válida.'
      candidate = result.value
    }
    return null
  }

  async function applyBulk(): Promise<void> {
    if (pending) return
    const error = preflightBulk()
    if (error) {
      setNotice(error)
      return
    }
    if (bulkAction === 'delete' && !bulkDeleteArmed) {
      setBulkDeleteArmed(true)
      setNotice(`Confirma la eliminación de ${selectedIds.length} registros.`)
      return
    }
    setPending(true)
    let failureMessage = ''
    for (const recordId of selectedIds) {
      const result = bulkAction === 'delete'
        ? await recordsSession.deleteContentRecord(recordId)
        : await recordsSession.updateContentRecord(recordId, { status: bulkAction.replace('status:', '') as ContentStatus })
      if (!result.ok) {
        failureMessage = result.error
        break
      }
    }
    setPending(false)
    setNotice(failureMessage || `Acción aplicada a ${selectedIds.length} registros.`)
    if (!failureMessage) setSelectedIds([])
    setBulkDeleteArmed(false)
  }

  function openRecord(record: ContentRecord): void {
    setEditorTarget(record.id)
  }

  if (!screen) return <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">La pantalla administrativa ya no existe.</p>

  return (
    <section aria-labelledby="admin-crud-views-title" className="grid gap-3 rounded-lg border border-border bg-muted/10 p-2.5 lg:p-3">
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="database" size={16} /></span>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-1"><h3 className="text-sm font-bold text-foreground" id="admin-crud-views-title">Vistas administrativas</h3><HelpTip description="Conecta esta pantalla a un tipo de contenido, una consulta guardada y un formulario. Los datos siguen siendo los mismos registros del proyecto." example="Crea una tabla de pedidos con una vista guardada de Pendientes y usa un formulario para editar solo los campos necesarios." label="Vistas administrativas" reference="WordPress Admin list tables · JetEngine admin columns" /></div><p className="text-xs leading-4 text-muted-foreground">Tabla, formulario, detalle, calendario, kanban, métricas, gráfico y listados reutilizan el contenido, las consultas guardadas y los formularios del proyecto.</p></div>
      </div>

      {notice ? <p className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-muted-foreground" role="status">{notice}</p> : null}

      {contentTypes.length === 0 ? <p className="rounded-md border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">Crea primero un tipo de contenido para construir su administración.</p> : (
        <div className="grid gap-2 rounded-lg border border-border bg-surface p-2.5 md:grid-cols-2 xl:grid-cols-4">
          <ChoiceField label="Tipo de vista" onChange={(value) => setKind(value as AdminViewKind)} options={viewKinds} value={kind} />
          <ChoiceField label="Contenido" onChange={(value) => { setContentTypeId(value as ContentTypeId); setQueryId(null); setFormId(null) }} options={contentTypes.map((type) => ({ label: type.pluralName, description: type.description || type.singularName, value: type.id }))} value={contentTypeId ?? ''} />
          <ChoiceField label="Vista guardada / filtro" onChange={(value) => setQueryId(value ? value as QueryId : null)} options={[{ label: 'Todos los registros', value: '' }, ...queries.map((query) => ({ label: query.name, description: `${query.groups.length} grupos · ${query.sorts.length} órdenes`, value: query.id }))]} value={queryId ?? ''} />
          <ChoiceField label="Formulario de edición" onChange={(value) => setFormId(value ? value as FormId : null)} options={[{ label: 'Campos del CPT', value: '' }, ...forms.map((form) => ({ label: form.name, description: `${form.steps.length} pasos`, value: form.id }))]} value={formId ?? ''} />
          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2"><p className="text-[0.625rem] text-muted-foreground">Las consultas creadas en Contenido → Consultas funcionan como vistas guardadas reutilizables; no se duplica el motor de filtros.</p><Button disabled={!contentTypeId || pending} isLoading={pending} loadingLabel="Guardando" onClick={() => { void saveView() }} size="small"><Icon name="check" size={12} />Guardar vista administrativa</Button></div>
        </div>
      )}

      {persistedContentType && isAdminViewKind(screen.kind) ? (
        <div className="grid gap-2">
          <div className="grid gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.5fr)_auto]">
            <TextField label="Buscar en esta vista" onChange={(event) => setSearch(event.target.value)} placeholder="Título, campo o estado…" type="search" value={search} />
            <ChoiceField label="Estado" onChange={(value) => setStatusFilter(value as 'all' | ContentStatus)} options={[{ label: 'Todos los estados', value: 'all' }, ...statuses.map((status) => ({ label: statusLabels[status], value: status }))]} value={statusFilter} />
            <div className="flex items-end"><Button onClick={() => setEditorTarget('new')} size="small"><Icon name="plus" size={12} />Nuevo</Button></div>
          </div>

          {queried && !queried.ok ? <p className="rounded-md bg-destructive/10 px-2 py-2 text-xs text-destructive" role="alert">{queried.error[0]?.message ?? 'La vista guardada no se pudo ejecutar.'}</p> : null}

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-2">
            <div className="min-w-[12rem] flex-1"><ChoiceField label="Acción masiva" onChange={(value) => { setBulkAction(value); setBulkDeleteArmed(false) }} options={[...statuses.map((status) => ({ label: `Cambiar a ${statusLabels[status]}`, value: `status:${status}` })), { label: 'Eliminar seleccionados', value: 'delete' }]} value={bulkAction} /></div>
            <Button disabled={selectedIds.length === 0 || pending} onClick={() => { void applyBulk() }} size="small" variant={bulkAction === 'delete' && bulkDeleteArmed ? 'destructive' : 'secondary'}>{bulkAction === 'delete' && bulkDeleteArmed ? 'Confirmar eliminación' : `Aplicar a ${selectedIds.length}`}</Button>
            <Button disabled={visibleRecords.length === 0} onClick={() => setSelectedIds(selectedIds.length === visibleRecords.length ? [] : visibleRecords.map((record) => record.id))} size="small" variant="ghost">{selectedIds.length === visibleRecords.length && visibleRecords.length > 0 ? 'Quitar selección' : 'Seleccionar visibles'}</Button>
          </div>

          {editorTarget ? <AdminRecordEditor cms={cms} contentTypeId={persistedContentType.id} form={configuredForm} key={editorTarget} onClose={() => setEditorTarget(null)} record={editorRecord} /> : null}

          {screen.kind === 'metrics' ? <MetricsView records={visibleRecords} /> : null}
          {screen.kind === 'chart' ? <StatusChartView records={visibleRecords} /> : null}

          {screen.kind === 'kanban' ? (
            <div className="grid auto-cols-[minmax(13rem,1fr)] grid-flow-col gap-2 overflow-x-auto pb-1">
              {statuses.map((status) => <section className="grid content-start gap-1 rounded-lg border border-border bg-muted/20 p-2" key={status}><div className="flex items-center justify-between"><strong className="text-xs">{statusLabels[status]}</strong><span className="rounded bg-surface px-1.5 text-[0.625rem] font-bold">{visibleRecords.filter((record) => record.status === status).length}</span></div>{visibleRecords.filter((record) => record.status === status).map((record) => <button className="min-h-11 rounded-md border border-border bg-surface p-2 text-left text-xs hover:border-primary/35 hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus" key={record.id} onClick={() => openRecord(record)} type="button"><strong className="block truncate">{recordLabel(record, fields)}</strong><span className="text-[0.625rem] text-muted-foreground">{new Date(record.updatedAt).toLocaleDateString()}</span></button>)}</section>)}
            </div>
          ) : null}

          {screen.kind === 'calendar' ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(visibleRecords.reduce<Record<string, ContentRecord[]>>((groups, record) => {
              const dateField = fields.find((field) => field.type === 'date' || field.type === 'datetime')
              const raw = dateField ? record.values[dateField.id] : undefined
              const date = typeof raw === 'string' && raw ? raw.slice(0, 10) : record.createdAt.slice(0, 10)
              ;(groups[date] ??= []).push(record)
              return groups
            }, {})).sort(([left], [right]) => right.localeCompare(left)).map(([date, records]) => <section className="grid gap-1 rounded-lg border border-border bg-surface p-2" key={date}><strong className="text-xs">{new Date(`${date}T00:00:00`).toLocaleDateString()}</strong>{records.map((record) => <button className="min-h-11 rounded-md bg-muted/30 px-2 text-left text-xs hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus" key={record.id} onClick={() => openRecord(record)} type="button">{recordLabel(record, fields)}</button>)}</section>)}</div>
          ) : null}

          {screen.kind === 'listing' ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleRecords.map((record) => <button className="grid min-h-20 gap-1 rounded-lg border border-border bg-surface p-2 text-left hover:border-primary/35 hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus" key={record.id} onClick={() => openRecord(record)} type="button"><strong className="truncate text-xs">{recordLabel(record, fields)}</strong><span className="text-[0.625rem] text-muted-foreground">{statusLabels[record.status]} · {new Date(record.updatedAt).toLocaleString()}</span>{tableFields.slice(0, 2).map((field) => <span className="truncate text-[0.625rem]" key={field.id}><span className="text-muted-foreground">{field.label}: </span>{scalarLabel(record.values[field.id])}</span>)}</button>)}</div> : null}

          {screen.kind === 'detail' ? (
            <div className="grid gap-2">{visibleRecords.map((record) => <button className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-surface px-2 text-left hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus" key={record.id} onClick={() => openRecord(record)} type="button"><span><strong className="block truncate text-xs">{recordLabel(record, fields)}</strong><span className="text-[0.625rem] text-muted-foreground">{statusLabels[record.status]}</span></span><Icon name="arrow-right" size={13} /></button>)}</div>
          ) : null}

          {screen.kind === 'table' ? (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[42rem] border-collapse text-left text-xs"><thead className="bg-muted/40 text-[0.625rem] uppercase tracking-wide text-muted-foreground"><tr><th className="w-12 px-2 py-2">Sel.</th><th className="px-2 py-2">Registro</th>{tableFields.map((field) => <th className="px-2 py-2" key={field.id}>{field.label}</th>)}<th className="px-2 py-2">Estado</th><th className="w-20 px-2 py-2">Acción</th></tr></thead><tbody>{visibleRecords.map((record) => { const checked = selectedIds.includes(record.id); return <tr className="border-t border-border" key={record.id}><td className="px-2 py-1.5"><button aria-checked={checked} aria-label={`Seleccionar ${recordLabel(record, fields)}`} className={`grid size-11 place-items-center rounded-md border focus-visible:ring-2 focus-visible:ring-focus lg:size-8 ${checked ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-muted-foreground'}`} onClick={() => toggleSelected(record.id)} role="checkbox" type="button">{checked ? <Icon name="check" size={12} /> : null}</button></td><td className="max-w-48 px-2 py-1.5 font-semibold"><span className="block truncate">{recordLabel(record, fields)}</span></td>{tableFields.map((field) => <td className="max-w-40 px-2 py-1.5" key={field.id}><span className="block truncate">{scalarLabel(record.values[field.id])}</span></td>)}<td className="px-2 py-1.5"><span className="rounded-md bg-muted px-1.5 py-1 text-[0.625rem] font-bold">{statusLabels[record.status]}</span></td><td className="px-2 py-1.5"><Button onClick={() => openRecord(record)} size="small" variant="ghost">Editar</Button></td></tr>})}</tbody></table>
            </div>
          ) : null}

          {screen.kind === 'form' && !editorTarget ? <AdminRecordEditor cms={cms} contentTypeId={persistedContentType.id} form={configuredForm} key="new-form" onClose={() => setEditorTarget(null)} record={null} /> : null}

          {visibleRecords.length === 0 && screen.kind !== 'form' ? <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground">No hay registros para los filtros actuales.</p> : null}
        </div>
      ) : <p className="rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">Guarda la configuración para activar el CRUD de esta pantalla. El dashboard visual actual se conserva hasta entonces.</p>}
    </section>
  )
}
