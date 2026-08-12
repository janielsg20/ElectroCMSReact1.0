import { useMemo, useState, type ChangeEvent, type UIEvent } from 'react'
import {
  executeCmsQuery,
  parseQueryId,
  type CmsBackend,
  type ContentRecord,
  type FieldDefinition,
  type JsonValue,
  type Query,
} from '../../domain'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import { Icon } from '../primitives'
import { useEditorProjectStructure } from './editor-project-context'
import { useQuerySession } from './query-session-context'

type QueryGroup = Query['groups'][number]
type QueryPredicate = QueryGroup['predicates'][number]
type QuerySource = QueryPredicate['source']
type QueryOperator = QueryPredicate['operator']
type QuerySort = Query['sorts'][number]

const sources: readonly { readonly id: QuerySource; readonly label: string }[] = [
  { id: 'status', label: 'Estado' },
  { id: 'field', label: 'Campo' },
  { id: 'taxonomy', label: 'Taxonomía' },
  { id: 'author', label: 'Autor' },
  { id: 'date', label: 'Fecha' },
  { id: 'relation', label: 'Relación' },
  { id: 'repeater', label: 'Repeater' },
]

const operators: readonly { readonly id: QueryOperator; readonly label: string }[] = [
  { id: 'equals', label: 'es igual a' },
  { id: 'not-equals', label: 'no es igual a' },
  { id: 'contains', label: 'contiene' },
  { id: 'in', label: 'está en' },
  { id: 'not-in', label: 'no está en' },
  { id: 'greater-than', label: 'mayor que' },
  { id: 'greater-or-equal', label: 'mayor o igual' },
  { id: 'less-than', label: 'menor que' },
  { id: 'less-or-equal', label: 'menor o igual' },
  { id: 'between', label: 'entre' },
  { id: 'exists', label: 'existe' },
]

const contentStatuses = ['draft', 'pending', 'published', 'private', 'archived'] as const
const complexSortTypes = new Set(['checkbox', 'gallery', 'map', 'relation', 'taxonomy', 'repeater', 'group'])
const rowHeight = 54
const previewHeight = 300
const overscan = 4

function lexicalCompare(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1
}

function isJsonObject(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value)
}

function scalarText(value: JsonValue | undefined): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function listText(value: JsonValue | undefined): string {
  return Array.isArray(value) ? value.map((entry) => scalarText(entry)).join(', ') : scalarText(value)
}

function operandValue(value: JsonValue): JsonValue {
  return isJsonObject(value) && 'value' in value ? value.value : value
}

function replaceOperand(current: JsonValue, next: JsonValue): JsonValue {
  return isJsonObject(current) && 'value' in current ? { ...current, value: next } : next
}

function parseTextValue(text: string, field?: FieldDefinition): JsonValue {
  if (field?.type === 'number' || field?.type === 'currency') {
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : text
  }
  if (field?.type === 'switch') return text === 'true'
  return text
}

function selectableFields(cms: CmsBackend, contentTypeId: Query['contentTypeId']): FieldDefinition[] {
  return (cms.contentTypes[contentTypeId]?.fieldIds ?? []).flatMap((id) => cms.fields[id] ? [cms.fields[id]] : [])
}

function newQuery(cms: CmsBackend): Query | null {
  const contentType = Object.values(cms.contentTypes).sort((left, right) => left.order - right.order)[0]
  if (!contentType) return null
  return {
    contentTypeId: contentType.id,
    groups: [],
    id: parseQueryId(crypto.randomUUID()),
    limit: 100,
    name: 'Nueva consulta',
    offset: 0,
    pageSize: 20,
    sorts: [],
  }
}

function makePredicate(source: QuerySource, cms: CmsBackend, contentTypeId: Query['contentTypeId']): QueryPredicate {
  const contentType = cms.contentTypes[contentTypeId]
  const fields = selectableFields(cms, contentTypeId)
  const taxonomies = (contentType?.taxonomyIds ?? []).flatMap((id) => cms.taxonomies[id] ? [cms.taxonomies[id]] : [])
  const relations = Object.values(cms.relations).filter((relation) => relation.sourceContentTypeId === contentTypeId || relation.targetContentTypeId === contentTypeId)

  if (source === 'field') return { fieldId: fields[0]?.id ?? null, operator: 'equals', relationId: null, source, taxonomyId: null, value: '' }
  if (source === 'taxonomy') {
    const taxonomy = taxonomies[0]
    const term = taxonomy ? Object.values(cms.taxonomyTerms).find((candidate) => candidate.taxonomyId === taxonomy.id) : undefined
    return { fieldId: null, operator: 'equals', relationId: null, source, taxonomyId: taxonomy?.id ?? null, value: term?.id ?? '' }
  }
  if (source === 'author') {
    const user = Object.values(cms.users).sort((a, b) => lexicalCompare(a.displayName, b.displayName))[0]
    return { fieldId: null, operator: 'equals', relationId: null, source, taxonomyId: null, value: user?.id ?? '' }
  }
  if (source === 'date') return { fieldId: null, operator: 'greater-or-equal', relationId: null, source, taxonomyId: null, value: { field: 'createdAt', value: new Date(0).toISOString() } }
  if (source === 'relation') {
    const relation = relations[0]
    const targetTypeId = relation?.sourceContentTypeId === contentTypeId ? relation.targetContentTypeId : relation?.sourceContentTypeId
    const record = targetTypeId ? Object.values(cms.records).find((candidate) => candidate.contentTypeId === targetTypeId) : undefined
    return { fieldId: null, operator: 'equals', relationId: relation?.id ?? null, source, taxonomyId: null, value: record?.id ?? '' }
  }
  if (source === 'repeater') {
    const repeater = fields.find((field) => field.type === 'repeater')
    const childId = repeater?.childFieldIds[0]
    return { fieldId: repeater?.id ?? null, operator: 'contains', relationId: null, source, taxonomyId: null, value: childId ? { path: [childId], value: '' } : '' }
  }
  return { fieldId: null, operator: 'equals', relationId: null, source: 'status', taxonomyId: null, value: 'published' }
}

function queryRecordLabel(record: ContentRecord, cms: CmsBackend): string {
  const contentType = cms.contentTypes[record.contentTypeId]
  const fields = contentType?.fieldIds.flatMap((id) => cms.fields[id] ? [cms.fields[id]] : []) ?? []
  const titleField = fields.find((field) => ['title', 'name', 'label'].includes(field.key)) ?? fields.find((field) => field.type === 'text')
  const value = titleField ? record.values[titleField.id] : undefined
  return typeof value === 'string' && value.trim() ? value : `${contentType?.singularName ?? 'Registro'} · ${record.id.slice(0, 8)}`
}

function SelectOperand({ label, options, predicate, onChange }: {
  readonly label: string
  readonly options: readonly { readonly label: string; readonly value: string }[]
  readonly predicate: QueryPredicate
  readonly onChange: (next: QueryPredicate) => void
}) {
  const raw = operandValue(predicate.value)
  const listOperator = predicate.operator === 'in' || predicate.operator === 'not-in' || predicate.operator === 'between'
  const value = Array.isArray(raw) ? scalarText(raw[0]) : scalarText(raw)
  return (
    <select aria-label={label} className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => onChange({ ...predicate, value: listOperator ? [event.target.value] : event.target.value })} value={value}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}

function ValueEditor({ cms, predicate, onChange, contentTypeId }: {
  readonly cms: CmsBackend
  readonly predicate: QueryPredicate
  readonly onChange: (next: QueryPredicate) => void
  readonly contentTypeId: Query['contentTypeId']
}) {
  const field = predicate.fieldId ? cms.fields[predicate.fieldId] : undefined
  const listOperator = predicate.operator === 'in' || predicate.operator === 'not-in' || predicate.operator === 'between'
  const rawOperand = operandValue(predicate.value)

  if (predicate.operator === 'exists') return <span className="grid min-h-9 place-items-center rounded-md border border-dashed border-border px-2 text-[0.625rem] text-muted-foreground">Sin valor</span>

  if (predicate.source === 'status') {
    return <SelectOperand label="Valor de estado" onChange={onChange} options={contentStatuses.map((status) => ({ label: status, value: status }))} predicate={predicate} />
  }

  if (predicate.source === 'author') {
    const options = [{ label: 'Sin autor', value: '' }, ...Object.values(cms.users).sort((a, b) => lexicalCompare(a.displayName, b.displayName)).map((user) => ({ label: user.displayName, value: user.id }))]
    return <SelectOperand label="Valor de autor" onChange={onChange} options={options} predicate={predicate} />
  }

  if (predicate.source === 'taxonomy' && predicate.taxonomyId) {
    const options = [{ label: 'Selecciona término', value: '' }, ...Object.values(cms.taxonomyTerms).filter((term) => term.taxonomyId === predicate.taxonomyId).sort((a, b) => lexicalCompare(a.name, b.name)).map((term) => ({ label: term.name, value: term.id }))]
    return <SelectOperand label="Valor de término" onChange={onChange} options={options} predicate={predicate} />
  }

  if (predicate.source === 'relation' && predicate.relationId) {
    const relation = cms.relations[predicate.relationId]
    const targetTypeId = relation?.sourceContentTypeId === contentTypeId ? relation.targetContentTypeId : relation?.sourceContentTypeId
    const records = targetTypeId ? Object.values(cms.records).filter((record) => record.contentTypeId === targetTypeId) : []
    const options = [{ label: 'Selecciona registro', value: '' }, ...records.map((record) => ({ label: queryRecordLabel(record, cms), value: record.id }))]
    return <SelectOperand label="Valor de registro relacionado" onChange={onChange} options={options} predicate={predicate} />
  }

  if (predicate.source === 'date') {
    const current = isJsonObject(predicate.value) ? predicate.value : { field: 'createdAt', value: '' }
    const currentValue = current.value ?? ''
    const dateField = current.field === 'updatedAt' ? 'updatedAt' : 'createdAt'
    return (
      <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-1">
        <select aria-label="Campo de fecha" className="min-h-9 rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => onChange({ ...predicate, value: { field: event.target.value, value: currentValue } })} value={dateField}><option value="createdAt">Creado</option><option value="updatedAt">Actualizado</option></select>
        <input aria-label="Valor de fecha" className="min-h-9 min-w-0 rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => onChange({ ...predicate, value: { ...current, value: listOperator ? event.target.value.split(',').map((item) => item.trim()) : event.target.value } })} placeholder={listOperator ? 'inicio, fin' : '2026-08-12T00:00:00.000Z'} value={listText(currentValue)} />
      </div>
    )
  }

  return (
    <input
      aria-label="Valor del predicado"
      className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs"
      onChange={(event) => {
        const next = listOperator
          ? event.target.value.split(',').map((item) => parseTextValue(item.trim(), field))
          : parseTextValue(event.target.value, field)
        onChange({ ...predicate, value: replaceOperand(predicate.value, next) })
      }}
      placeholder={listOperator ? 'valor 1, valor 2' : 'Valor'}
      value={listText(rawOperand)}
    />
  )
}

function PredicateEditor({ cms, predicate, contentTypeId, onChange, onRemove }: {
  readonly cms: CmsBackend
  readonly predicate: QueryPredicate
  readonly contentTypeId: Query['contentTypeId']
  readonly onChange: (next: QueryPredicate) => void
  readonly onRemove: () => void
}) {
  const contentType = cms.contentTypes[contentTypeId]
  const fields = selectableFields(cms, contentTypeId)
  const repeaters = fields.filter((field) => field.type === 'repeater')
  const taxonomies = (contentType?.taxonomyIds ?? []).flatMap((id) => cms.taxonomies[id] ? [cms.taxonomies[id]] : [])
  const relations = Object.values(cms.relations).filter((relation) => relation.sourceContentTypeId === contentTypeId || relation.targetContentTypeId === contentTypeId)

  function changeSource(event: ChangeEvent<HTMLSelectElement>) {
    onChange(makePredicate(event.target.value as QuerySource, cms, contentTypeId))
  }

  return (
    <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
      <div className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(7rem,1fr)_2.25rem] gap-1">
        <select aria-label="Fuente del predicado" className="min-h-9 min-w-0 rounded-md border border-border bg-surface px-2 text-xs" onChange={changeSource} value={predicate.source}>{sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}</select>
        <select aria-label="Operador del predicado" className="min-h-9 min-w-0 rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => onChange({ ...predicate, operator: event.target.value as QueryOperator })} value={predicate.operator}>{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.label}</option>)}</select>
        <button aria-label="Eliminar predicado" className="grid min-h-9 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-focus" onClick={onRemove} type="button"><Icon name="close" size={13} /></button>
      </div>

      {predicate.source === 'field' ? <select aria-label="Campo del predicado" className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => onChange({ ...predicate, fieldId: fields.find((field) => field.id === event.target.value)?.id ?? null })} value={predicate.fieldId ?? ''}><option value="">Selecciona campo</option>{fields.map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</select> : null}
      {predicate.source === 'repeater' ? <select aria-label="Repeater del predicado" className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => {
        const repeater = repeaters.find((field) => field.id === event.target.value)
        const childId = repeater?.childFieldIds[0]
        onChange({ ...predicate, fieldId: repeater?.id ?? null, value: childId ? { path: [childId], value: '' } : '' })
      }} value={predicate.fieldId ?? ''}><option value="">Selecciona repeater</option>{repeaters.map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</select> : null}
      {predicate.source === 'taxonomy' ? <select aria-label="Taxonomía del predicado" className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => {
        const taxonomy = taxonomies.find((candidate) => candidate.id === event.target.value)
        const term = taxonomy ? Object.values(cms.taxonomyTerms).find((candidate) => candidate.taxonomyId === taxonomy.id) : undefined
        onChange({ ...predicate, taxonomyId: taxonomy?.id ?? null, value: term?.id ?? '' })
      }} value={predicate.taxonomyId ?? ''}><option value="">Selecciona taxonomía</option>{taxonomies.map((taxonomy) => <option key={taxonomy.id} value={taxonomy.id}>{taxonomy.pluralName}</option>)}</select> : null}
      {predicate.source === 'relation' ? <select aria-label="Relación del predicado" className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs" onChange={(event) => onChange({ ...predicate, relationId: relations.find((candidate) => candidate.id === event.target.value)?.id ?? null, value: '' })} value={predicate.relationId ?? ''}><option value="">Selecciona relación</option>{relations.map((relation) => <option key={relation.id} value={relation.id}>{relation.name}</option>)}</select> : null}

      <ValueEditor cms={cms} contentTypeId={contentTypeId} onChange={onChange} predicate={predicate} />
    </div>
  )
}

function VirtualResults({ cms, records }: { readonly cms: CmsBackend; readonly records: readonly ContentRecord[] }) {
  const [scrollTop, setScrollTop] = useState(0)
  const visibleCount = Math.ceil(previewHeight / rowHeight)
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(records.length, start + visibleCount + overscan * 2)
  const visible = records.slice(start, end)

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    setScrollTop(event.currentTarget.scrollTop)
  }

  if (records.length === 0) return <div className="grid h-[18.75rem] place-items-center rounded-md border border-dashed border-border text-center"><div><Icon className="mx-auto text-muted-foreground" name="search" size={20} /><p className="mt-2 text-xs font-semibold">Sin resultados</p><p className="mt-1 text-[0.625rem] text-muted-foreground">La consulta válida no encontró registros.</p></div></div>

  return (
    <div aria-label={`${records.length} resultados de consulta`} className="relative h-[18.75rem] overflow-y-auto rounded-md border border-border bg-surface" onScroll={handleScroll} role="list">
      <div style={{ height: `${records.length * rowHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {visible.map((record) => (
            <div className="flex h-[54px] items-center gap-2 border-b border-border px-2" key={record.id} role="listitem">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="content" size={13} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{queryRecordLabel(record, cms)}</p><p className="truncate text-[0.625rem] text-muted-foreground">{record.status} · {record.id.slice(0, 8)}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QueryEditor({ cms, initial, persisted, onSaved, onDeleted }: {
  readonly cms: CmsBackend
  readonly initial: Query
  readonly persisted: boolean
  readonly onSaved: (id: Query['id']) => void
  readonly onDeleted: () => void
}) {
  const session = useQuerySession()
  const [draft, setDraft] = useState<Query>(() => structuredClone(initial))
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const execution = useMemo(() => executeCmsQuery(cms, draft), [cms, draft])
  const contentTypes = Object.values(cms.contentTypes).sort((a, b) => a.order - b.order)
  const fields = selectableFields(cms, draft.contentTypeId)

  function updateGroup(index: number, next: QueryGroup) {
    setDraft((current) => ({ ...current, groups: current.groups.map((group, candidate) => candidate === index ? next : group) }))
  }

  function updatePredicate(groupIndex: number, predicateIndex: number, next: QueryPredicate) {
    const group = draft.groups[groupIndex]
    if (!group) return
    updateGroup(groupIndex, { ...group, predicates: group.predicates.map((predicate, candidate) => candidate === predicateIndex ? next : predicate) })
  }

  function addGroup() {
    setDraft((current) => ({ ...current, groups: [...current.groups, { operator: 'all', predicates: [makePredicate('status', cms, current.contentTypeId)] }] }))
  }

  function addSort() {
    const field = fields.find((candidate) => !complexSortTypes.has(candidate.type))
    const next: QuerySort = field ? { direction: 'asc', fieldId: field.id, systemField: null } : { direction: 'desc', fieldId: null, systemField: 'updatedAt' }
    setDraft((current) => ({ ...current, sorts: [...current.sorts, next] }))
  }

  async function save() {
    if (!execution.ok || saving) {
      setStatus(execution.ok ? '' : execution.error[0]?.message ?? 'La consulta contiene errores.')
      return
    }
    setSaving(true)
    const result = persisted
      ? await session.updateSavedQuery(draft.id, { contentTypeId: draft.contentTypeId, groups: draft.groups, limit: draft.limit, name: draft.name, offset: draft.offset, pageSize: draft.pageSize, sorts: draft.sorts })
      : await session.createSavedQuery(draft)
    setSaving(false)
    if (!result.ok) {
      setStatus(result.error)
      return
    }
    setStatus('Consulta guardada.')
    onSaved(draft.id)
  }

  async function remove() {
    if (!deleteArmed) {
      setDeleteArmed(true)
      setStatus('Pulsa de nuevo para confirmar la eliminación.')
      return
    }
    const result = await session.deleteSavedQuery(draft.id)
    if (!result.ok) {
      setStatus(result.error)
      setDeleteArmed(false)
      return
    }
    onDeleted()
  }

  function changeContentType(nextId: Query['contentTypeId']) {
    setDraft((current) => ({ ...current, contentTypeId: nextId, groups: [], sorts: [] }))
  }

  return (
    <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto p-2 xl:grid-cols-[minmax(26rem,1fr)_minmax(18rem,0.72fr)] xl:overflow-hidden">
      <section aria-labelledby="query-editor-title" className="min-h-0 rounded-lg border border-border bg-surface xl:overflow-y-auto">
        <header className="sticky top-0 z-10 flex min-h-11 items-center gap-2 border-b border-border bg-surface/95 px-2 backdrop-blur">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="database" size={14} /></span>
          <div className="min-w-0 flex-1"><h2 className="truncate text-xs font-bold" id="query-editor-title">Constructor visual</h2><p className="truncate text-[0.625rem] text-muted-foreground">AST canónico · preview local</p></div>
          <button className="min-h-11 rounded-md bg-primary px-3 text-xs font-bold text-on-primary disabled:opacity-50 lg:min-h-9" disabled={!execution.ok || saving} onClick={() => void save()} type="button">{saving ? 'Guardando…' : 'Guardar'}</button>
        </header>

        <div className="grid gap-2 p-2">
          <div className="grid gap-1 sm:grid-cols-2">
            <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground">Nombre<input aria-label="Nombre de consulta" className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs text-foreground lg:min-h-9" onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} /></label>
            <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground">Tipo de contenido<select aria-label="Tipo de contenido de consulta" className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs text-foreground lg:min-h-9" onChange={(event) => {
              const next = contentTypes.find((candidate) => candidate.id === event.target.value)
              if (next) changeContentType(next.id)
            }} value={draft.contentTypeId}>{contentTypes.map((type) => <option key={type.id} value={type.id}>{type.pluralName}</option>)}</select></label>
          </div>

          <section aria-labelledby="query-groups-title" className="grid gap-1.5">
            <div className="flex min-h-9 items-center justify-between"><h3 className="text-xs font-bold" id="query-groups-title">Condiciones</h3><button className="min-h-11 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted lg:min-h-9" onClick={addGroup} type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={12} />Grupo</span></button></div>
            {draft.groups.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">Sin condiciones: la consulta incluye todos los registros del tipo seleccionado.</p> : null}
            {draft.groups.map((group, groupIndex) => (
              <fieldset className="grid gap-1.5 rounded-lg border border-border bg-muted/25 p-1.5" key={groupIndex}>
                <legend className="sr-only">Grupo {groupIndex + 1}</legend>
                <div className="flex min-h-9 items-center gap-1">
                  <span className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Grupo {groupIndex + 1}</span>
                  <select aria-label={`Operador del grupo ${groupIndex + 1}`} className="ml-auto min-h-11 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9" onChange={(event) => updateGroup(groupIndex, { ...group, operator: event.target.value as QueryGroup['operator'] })} value={group.operator}><option value="all">Todas (AND)</option><option value="any">Alguna (OR)</option></select>
                  <button aria-label={`Añadir predicado al grupo ${groupIndex + 1}`} className="grid size-11 place-items-center rounded-md border border-border bg-surface hover:bg-muted lg:size-9" onClick={() => updateGroup(groupIndex, { ...group, predicates: [...group.predicates, makePredicate('status', cms, draft.contentTypeId)] })} type="button"><Icon name="plus" size={12} /></button>
                  <button aria-label={`Eliminar grupo ${groupIndex + 1}`} className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger lg:size-9" onClick={() => setDraft((current) => ({ ...current, groups: current.groups.filter((_, candidate) => candidate !== groupIndex) }))} type="button"><Icon name="close" size={12} /></button>
                </div>
                {group.predicates.map((predicate, predicateIndex) => <PredicateEditor cms={cms} contentTypeId={draft.contentTypeId} key={predicateIndex} onChange={(next) => updatePredicate(groupIndex, predicateIndex, next)} onRemove={() => updateGroup(groupIndex, { ...group, predicates: group.predicates.filter((_, candidate) => candidate !== predicateIndex) })} predicate={predicate} />)}
              </fieldset>
            ))}
          </section>

          <section aria-labelledby="query-sort-title" className="grid gap-1.5 border-t border-border pt-2">
            <div className="flex min-h-9 items-center justify-between"><h3 className="text-xs font-bold" id="query-sort-title">Orden</h3><button className="min-h-11 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted lg:min-h-9" onClick={addSort} type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={12} />Orden</span></button></div>
            {draft.sorts.map((sort, index) => (
              <div className="grid grid-cols-[minmax(0,1fr)_6rem_2.75rem] gap-1 lg:grid-cols-[minmax(0,1fr)_6rem_2.25rem]" key={index}>
                <select aria-label={`Campo de orden ${index + 1}`} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9" onChange={(event) => {
                  const value = event.target.value
                  const field = fields.find((candidate) => candidate.id === value)
                  setDraft((current) => ({ ...current, sorts: current.sorts.map((candidate, candidateIndex) => candidateIndex === index ? (field ? { direction: sort.direction, fieldId: field.id, systemField: null } : { direction: sort.direction, fieldId: null, systemField: value as QuerySort['systemField'] }) : candidate) }))
                }} value={sort.fieldId ?? sort.systemField ?? 'updatedAt'}><optgroup label="Sistema"><option value="createdAt">Creado</option><option value="updatedAt">Actualizado</option><option value="status">Estado</option><option value="id">ID</option></optgroup><optgroup label="Campos">{fields.filter((field) => !complexSortTypes.has(field.type)).map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</optgroup></select>
                <select aria-label={`Dirección de orden ${index + 1}`} className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9" onChange={(event) => setDraft((current) => ({ ...current, sorts: current.sorts.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, direction: event.target.value as QuerySort['direction'] } : candidate) }))} value={sort.direction}><option value="asc">Asc.</option><option value="desc">Desc.</option></select>
                <button aria-label={`Eliminar orden ${index + 1}`} className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger lg:size-9" onClick={() => setDraft((current) => ({ ...current, sorts: current.sorts.filter((_, candidate) => candidate !== index) }))} type="button"><Icon name="close" size={12} /></button>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-3 gap-1 border-t border-border pt-2">
            {(['limit', 'offset', 'pageSize'] as const).map((key) => <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground" key={key}>{key === 'pageSize' ? 'Página' : key === 'limit' ? 'Límite' : 'Offset'}<input aria-label={key === 'pageSize' ? 'Tamaño de página' : key === 'limit' ? 'Límite de resultados' : 'Offset de resultados'} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-2 text-xs text-foreground lg:min-h-9" min={key === 'offset' ? 0 : 1} onChange={(event) => setDraft((current) => ({ ...current, [key]: Number(event.target.value) }))} type="number" value={draft[key]} /></label>)}
          </div>

          {persisted ? <div className="flex items-center justify-end border-t border-border pt-2"><button className={`min-h-11 rounded-md px-3 text-xs font-semibold lg:min-h-9 ${deleteArmed ? 'bg-danger text-white' : 'border border-danger/30 text-danger hover:bg-danger-soft'}`} onClick={() => void remove()} type="button">{deleteArmed ? 'Confirmar eliminar' : 'Eliminar consulta'}</button></div> : null}
          <p aria-live="polite" className="min-h-4 text-[0.625rem] text-muted-foreground">{status}</p>
        </div>
      </section>

      <aside aria-labelledby="query-preview-title" className="min-h-0 rounded-lg border border-border bg-surface xl:overflow-y-auto">
        <header className="flex min-h-11 items-center gap-2 border-b border-border px-2"><span className="grid size-8 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="search" size={14} /></span><div className="min-w-0"><h2 className="text-xs font-bold" id="query-preview-title">Preview</h2><p className="text-[0.625rem] text-muted-foreground">Resultados windowed</p></div></header>
        <div className="grid gap-2 p-2">
          {execution.ok ? (
            <>
              <div className="grid grid-cols-3 gap-1 text-center"><div className="rounded-md border border-border bg-muted/30 p-1.5"><strong className="block text-sm">{execution.value.totalMatched}</strong><span className="text-[0.5625rem] text-muted-foreground">Coinciden</span></div><div className="rounded-md border border-border bg-muted/30 p-1.5"><strong className="block text-sm">{execution.value.records.length}</strong><span className="text-[0.5625rem] text-muted-foreground">Visibles</span></div><div className="rounded-md border border-border bg-muted/30 p-1.5"><strong className="block text-sm">{draft.offset}</strong><span className="text-[0.5625rem] text-muted-foreground">Offset</span></div></div>
              <VirtualResults cms={cms} records={execution.value.records} />
            </>
          ) : (
            <div className="rounded-md border border-danger/30 bg-danger-soft p-2"><p className="text-xs font-bold text-danger">Consulta inválida</p><ul className="mt-1 grid gap-1 text-[0.625rem] leading-4 text-danger">{execution.error.slice(0, 8).map((issue, index) => <li key={`${issue.code}-${index}`}>• {issue.message}</li>)}</ul></div>
          )}
        </div>
      </aside>
    </div>
  )
}

export function QueryManager() {
  const structure = useEditorProjectStructure()
  const cms = useMemo(() => projectCmsBackend(structure.cms), [structure.cms])
  const queries = useMemo(() => Object.values(cms.queries).sort((a, b) => lexicalCompare(a.name, b.name)), [cms.queries])
  const [selectedId, setSelectedId] = useState<Query['id'] | null>(() => queries[0]?.id ?? null)
  const [creating, setCreating] = useState<Query | null>(null)
  const selected = selectedId ? cms.queries[selectedId] : undefined
  const active = creating ?? selected ?? queries[0]
  const effectiveSelectedId = selected?.id ?? (!creating ? queries[0]?.id ?? null : null)

  function startNew() {
    const draft = newQuery(cms)
    if (!draft) return
    setCreating(draft)
    setSelectedId(null)
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-canvas">
      <header className="flex min-h-12 items-center gap-2 border-b border-border bg-surface px-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="database" size={14} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-xs font-bold">Consultas</h2><p className="truncate text-[0.625rem] text-muted-foreground">AST visual · {queries.length} guardadas</p></div>
        <button className="min-h-11 rounded-md bg-primary px-3 text-xs font-bold text-on-primary lg:min-h-9" disabled={Object.keys(cms.contentTypes).length === 0} onClick={startNew} type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={12} />Nueva</span></button>
      </header>

      <div className="grid min-h-0 md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside aria-label="Consultas guardadas" className="max-h-48 overflow-y-auto border-b border-border bg-surface p-1.5 md:max-h-none md:border-b-0 md:border-r">
          {queries.length === 0 ? <p className="rounded-md border border-dashed border-border p-2 text-xs leading-4 text-muted-foreground">No hay consultas guardadas.</p> : (
            <div className="grid gap-1" role="list">{queries.map((query) => <button aria-current={!creating && effectiveSelectedId === query.id ? 'true' : undefined} className={`min-h-11 rounded-md px-2 text-left lg:min-h-9 ${!creating && effectiveSelectedId === query.id ? 'bg-primary-soft text-primary-strong' : 'hover:bg-muted'}`} key={query.id} onClick={() => { setCreating(null); setSelectedId(query.id) }} type="button"><span className="block truncate text-xs font-semibold">{query.name}</span><span className="block truncate text-[0.5625rem] text-muted-foreground">{cms.contentTypes[query.contentTypeId]?.pluralName ?? 'CPT ausente'}</span></button>)}</div>
          )}
        </aside>

        {active ? <QueryEditor cms={cms} initial={active} key={creating ? `new-${creating.id}` : active.id} onDeleted={() => { setCreating(null); setSelectedId(null) }} onSaved={(id) => { setCreating(null); setSelectedId(id) }} persisted={!creating && Boolean(cms.queries[active.id])} /> : <div className="grid min-h-64 place-items-center p-6 text-center"><div><Icon className="mx-auto text-muted-foreground" name="database" size={24} /><p className="mt-2 text-sm font-bold">Crea un tipo de contenido primero</p><p className="mt-1 max-w-sm text-xs leading-4 text-muted-foreground">Las consultas necesitan un CPT real; no se generan fuentes de demostración.</p></div></div>}
      </div>
    </div>
  )
}
