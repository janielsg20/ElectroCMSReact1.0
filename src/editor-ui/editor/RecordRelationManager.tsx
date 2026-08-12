import { useMemo, useState } from 'react'
import {
  listContentRecordRevisions,
  listContentRecords,
  listRelationEntries,
  listRelations,
  parseContentRecordId,
  parseRelationEntryId,
  parseRelationId,
  parseTimestamp,
  type ContentRecord,
  type ContentRecordId,
  type ContentStatus,
  type ContentTypeId,
  type FieldDefinition,
  type JsonValue,
  type Relation,
  type RelationEntry,
  type RelationEntryId,
  type RelationId,
  type TaxonomyTermId,
} from '../../domain'
import { Button, Icon } from '../primitives'
import { useEditorProjectStructure, useRecordRelationSession } from './editor-project-context'

type ManagerMode = 'records' | 'relations'

interface RelationDraft {
  readonly cardinality: Relation['cardinality']
  readonly name: string
  readonly slug: string
  readonly sourceContentTypeId: string
  readonly targetContentTypeId: string
}

const EMPTY_RELATION: RelationDraft = {
  cardinality: 'one-to-many',
  name: '',
  slug: '',
  sourceContentTypeId: '',
  targetContentTypeId: '',
}

const inputClass = 'min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9'
const statusOptions: readonly ContentStatus[] = ['draft', 'pending', 'published', 'private', 'archived']
const statusLabel: Record<ContentStatus, string> = {
  archived: 'Archivado',
  draft: 'Borrador',
  pending: 'Pendiente',
  private: 'Privado',
  published: 'Publicado',
}

function recordLabel(record: ContentRecord, fields: readonly FieldDefinition[]): string {
  const preferred = fields.find((field) => field.key === 'title' || field.key === 'name') ?? fields[0]
  const value = preferred ? record.values[preferred.id] : undefined
  if (typeof value === 'string' && value.trim()) return value.trim()
  return `${statusLabel[record.status]} · ${record.id.slice(0, 8)}`
}

function jsonEqual(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function FieldValueControl({
  field,
  recordKey,
  value,
  onChange,
}: {
  readonly field: FieldDefinition
  readonly recordKey: string
  readonly value: JsonValue | undefined
  readonly onChange: (value: JsonValue | undefined) => void
}) {
  if (field.type === 'calculated') {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 px-2 py-1.5 text-[0.625rem] leading-4 text-muted-foreground">
        Se calcula desde <code className="font-mono text-foreground">{field.calculatedExpression ?? 'expresión pendiente'}</code>; no se edita manualmente.
      </div>
    )
  }

  if (field.type === 'switch') {
    return (
      <label className="flex min-h-11 items-center justify-between rounded-md border border-border bg-muted/20 px-2 text-xs lg:min-h-9">
        <span>{Boolean(value) ? 'Activo' : 'Inactivo'}</span>
        <input checked={Boolean(value)} className="size-4 accent-primary" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      </label>
    )
  }

  if (field.type === 'number' || field.type === 'currency') {
    return (
      <input
        className={inputClass}
        max={field.validation.max ?? undefined}
        min={field.validation.min ?? undefined}
        onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        placeholder={field.placeholder}
        step={field.type === 'currency' ? '0.01' : 'any'}
        type="number"
        value={typeof value === 'number' ? value : ''}
      />
    )
  }

  if (field.type === 'select' || field.type === 'radio') {
    const selectedIndex = field.options.findIndex((option) => value !== undefined && jsonEqual(option.value, value))
    return (
      <select className={inputClass} onChange={(event) => {
        const index = Number(event.target.value)
        onChange(Number.isInteger(index) && index >= 0 ? structuredClone(field.options[index]?.value) : undefined)
      }} value={selectedIndex >= 0 ? String(selectedIndex) : ''}>
        <option value="">Sin valor</option>
        {field.options.map((option, index) => <option key={`${field.id}-${index}`} value={index}>{option.label}</option>)}
      </select>
    )
  }

  if (field.type === 'checkbox' && field.options.length > 0) {
    const selected = Array.isArray(value) ? value : []
    return (
      <fieldset className="grid gap-1 rounded-md border border-border p-1.5">
        <legend className="px-1 text-[0.625rem] font-bold text-muted-foreground">Opciones</legend>
        {field.options.map((option, index) => {
          const checked = selected.some((candidate) => jsonEqual(candidate, option.value))
          return (
            <label className="flex min-h-11 items-center gap-2 rounded px-1.5 text-xs hover:bg-muted/50 lg:min-h-9" key={`${field.id}-${index}`}>
              <input checked={checked} className="size-4 accent-primary" onChange={() => onChange(checked
                ? selected.filter((candidate) => !jsonEqual(candidate, option.value))
                : [...selected, structuredClone(option.value)])} type="checkbox" />
              {option.label}
            </label>
          )
        })}
      </fieldset>
    )
  }

  if (field.type === 'textarea' || field.type === 'rich-text') {
    return (
      <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => onChange(event.target.value || undefined)} placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} />
    )
  }

  const stringTypes = new Set<FieldDefinition['type']>(['text', 'email', 'phone', 'url', 'date', 'time', 'datetime', 'color'])
  if (stringTypes.has(field.type)) {
    const htmlType = field.type === 'datetime' ? 'datetime-local' : field.type === 'phone' ? 'tel' : field.type
    return (
      <input className={inputClass} onChange={(event) => onChange(event.target.value || undefined)} placeholder={field.placeholder} type={htmlType} value={typeof value === 'string' ? value : ''} />
    )
  }

  return <JsonValueEditor field={field} key={`${recordKey}-${field.id}`} onChange={onChange} value={value} />
}

function JsonValueEditor({ field, value, onChange }: {
  readonly field: FieldDefinition
  readonly value: JsonValue | undefined
  readonly onChange: (value: JsonValue | undefined) => void
}) {
  const [text, setText] = useState(value === undefined ? '' : JSON.stringify(value, null, 2))
  const [error, setError] = useState('')

  return (
    <div className="grid gap-1">
      <textarea
        aria-invalid={Boolean(error)}
        className="min-h-24 resize-y rounded-md border border-border bg-surface p-2 font-mono text-[0.625rem] leading-4 focus-visible:ring-2 focus-visible:ring-focus"
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
            setError('JSON inválido. Corrige el valor antes de guardar.')
          }
        }}
        onChange={(event) => setText(event.target.value)}
        placeholder={`Valor JSON para ${field.type}`}
        value={text}
      />
      {error ? <span className="text-[0.625rem] text-destructive" role="alert">{error}</span> : <span className="text-[0.625rem] text-muted-foreground">Editor estructurado para {field.type}.</span>}
    </div>
  )
}

export function RecordRelationManager() {
  const session = useRecordRelationSession()
  const structure = useEditorProjectStructure()
  const contentTypes = useMemo(
    () => Object.values(structure.cms?.contentTypes ?? {}).sort((a, b) => a.order - b.order || a.pluralName.localeCompare(b.pluralName, 'es')),
    [structure.cms?.contentTypes],
  )
  const [mode, setMode] = useState<ManagerMode>('records')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const [contentTypeId, setContentTypeId] = useState<string>('')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [recordStatus, setRecordStatus] = useState<ContentStatus>('draft')
  const [recordValues, setRecordValues] = useState<Record<string, JsonValue>>({})
  const [recordTerms, setRecordTerms] = useState<readonly TaxonomyTermId[]>([])
  const [deleteRecordArmed, setDeleteRecordArmed] = useState(false)
  const [restoreArmedId, setRestoreArmedId] = useState<string | null>(null)

  const currentContentType = contentTypeId ? structure.cms?.contentTypes[contentTypeId as ContentTypeId] : undefined
  const fields = useMemo(() => currentContentType
    ? currentContentType.fieldIds.map((id) => structure.cms?.fields[id]).filter((field): field is FieldDefinition => Boolean(field)).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'es'))
    : [], [currentContentType, structure.cms?.fields])
  const records = useMemo(() => currentContentType ? listContentRecords(structure, currentContentType.id) : [], [currentContentType, structure])
  const selectedRecord = selectedRecordId ? structure.cms?.records[selectedRecordId as ContentRecordId] : undefined
  const revisions = useMemo(() => selectedRecord ? listContentRecordRevisions(structure, selectedRecord.id) : [], [selectedRecord, structure])
  const terms = useMemo(() => currentContentType
    ? Object.values(structure.cms?.taxonomyTerms ?? {}).filter((term) => currentContentType.taxonomyIds.includes(term.taxonomyId)).sort((a, b) => a.name.localeCompare(b.name, 'es'))
    : [], [currentContentType, structure.cms?.taxonomyTerms])

  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null)
  const [relationDraft, setRelationDraft] = useState<RelationDraft>(EMPTY_RELATION)
  const [deleteRelationArmed, setDeleteRelationArmed] = useState(false)
  const [sourceRecordId, setSourceRecordId] = useState('')
  const [targetRecordId, setTargetRecordId] = useState('')
  const [deleteEntryArmedId, setDeleteEntryArmedId] = useState<string | null>(null)
  const relations = useMemo(() => listRelations(structure), [structure])
  const selectedRelation = selectedRelationId ? structure.cms?.relations[selectedRelationId as RelationId] : undefined
  const relationEntries = useMemo(() => selectedRelation ? listRelationEntries(structure, selectedRelation.id) : [], [selectedRelation, structure])
  const sourceRecords = selectedRelation ? listContentRecords(structure, selectedRelation.sourceContentTypeId) : []
  const targetRecords = selectedRelation ? listContentRecords(structure, selectedRelation.targetContentTypeId) : []

  function resetRecordDraft(nextContentTypeId = contentTypeId): void {
    setContentTypeId(nextContentTypeId)
    setSelectedRecordId(null)
    setRecordStatus('draft')
    setRecordValues({})
    setRecordTerms([])
    setDeleteRecordArmed(false)
    setRestoreArmedId(null)
    setMessage(nextContentTypeId ? 'Nuevo registro en borrador.' : 'Selecciona un tipo de contenido.')
  }

  function selectRecord(record: ContentRecord): void {
    setSelectedRecordId(record.id)
    setRecordStatus(record.status)
    setRecordValues(structuredClone(record.values))
    setRecordTerms([...record.taxonomyTermIds])
    setDeleteRecordArmed(false)
    setRestoreArmedId(null)
    setMessage('')
  }

  function setFieldValue(fieldId: string, value: JsonValue | undefined): void {
    setRecordValues((current) => {
      const next = { ...current }
      if (value === undefined) delete next[fieldId]
      else next[fieldId] = value
      return next
    })
  }

  async function saveRecord(): Promise<void> {
    if (!currentContentType || pending) return
    setPending(true)
    const result = selectedRecord
      ? await session.updateContentRecord(selectedRecord.id, {
        status: recordStatus,
        taxonomyTermIds: [...recordTerms],
        values: structuredClone(recordValues),
      })
      : await session.createContentRecord({
        authorId: null,
        contentTypeId: currentContentType.id,
        createdAt: parseTimestamp(new Date().toISOString()),
        id: parseContentRecordId(crypto.randomUUID()),
        status: recordStatus,
        taxonomyTermIds: [...recordTerms],
        updatedAt: parseTimestamp(new Date().toISOString()),
        values: structuredClone(recordValues),
      })
    if (result.ok) {
      if (!selectedRecord) {
        const newest = listContentRecords(result.value, currentContentType.id)[0]
        if (newest) setSelectedRecordId(newest.id)
      }
      setMessage(selectedRecord ? 'Registro actualizado y revisionado cuando corresponde.' : 'Registro creado en el proyecto.')
    } else {
      setMessage(result.error)
    }
    setPending(false)
  }

  async function removeRecord(): Promise<void> {
    if (!selectedRecord || pending) return
    if (!deleteRecordArmed) {
      setDeleteRecordArmed(true)
      setMessage('Confirma la eliminación. Registros conectados por relaciones se bloquean por integridad.')
      return
    }
    setPending(true)
    const removed = await session.deleteContentRecord(selectedRecord.id)
    if (removed.ok) resetRecordDraft(contentTypeId)
    setMessage(removed.ok ? 'Registro eliminado.' : removed.error)
    setPending(false)
  }

  async function restoreRevision(revisionId: string): Promise<void> {
    if (pending) return
    if (restoreArmedId !== revisionId) {
      setRestoreArmedId(revisionId)
      setMessage('Pulsa Restaurar otra vez para confirmar. La versión actual se guardará como revisión antes de volver atrás.')
      return
    }
    setPending(true)
    const restored = await session.restoreContentRecordRevision(revisionId as Parameters<typeof session.restoreContentRecordRevision>[0])
    setMessage(restored.ok ? 'Revisión restaurada; la versión reemplazada quedó preservada.' : restored.error)
    setRestoreArmedId(null)
    setPending(false)
    const next = restored.ok && selectedRecord ? restored.value.cms?.records[selectedRecord.id] : undefined
    if (next) selectRecord(next)
  }

  function beginRelation(): void {
    const first = contentTypes[0]?.id ?? ''
    const second = contentTypes[1]?.id ?? first
    setSelectedRelationId(null)
    setRelationDraft({ ...EMPTY_RELATION, sourceContentTypeId: first, targetContentTypeId: second })
    setDeleteRelationArmed(false)
    setMessage('Nueva relación.')
  }

  function selectRelation(relation: Relation): void {
    setSelectedRelationId(relation.id)
    setRelationDraft({
      cardinality: relation.cardinality,
      name: relation.name,
      slug: relation.slug,
      sourceContentTypeId: relation.sourceContentTypeId,
      targetContentTypeId: relation.targetContentTypeId,
    })
    setDeleteRelationArmed(false)
    setSourceRecordId('')
    setTargetRecordId('')
    setDeleteEntryArmedId(null)
    setMessage('')
  }

  async function saveRelation(): Promise<void> {
    if (pending || !relationDraft.name.trim() || !relationDraft.slug.trim() || !relationDraft.sourceContentTypeId || !relationDraft.targetContentTypeId) return
    setPending(true)
    const result = selectedRelation
      ? await session.updateRelation(selectedRelation.id, {
        cardinality: relationDraft.cardinality,
        name: relationDraft.name,
        slug: relationDraft.slug,
        sourceContentTypeId: relationDraft.sourceContentTypeId as ContentTypeId,
        targetContentTypeId: relationDraft.targetContentTypeId as ContentTypeId,
      })
      : await session.createRelation({
        cardinality: relationDraft.cardinality,
        id: parseRelationId(crypto.randomUUID()),
        name: relationDraft.name,
        slug: relationDraft.slug,
        sourceContentTypeId: relationDraft.sourceContentTypeId as ContentTypeId,
        targetContentTypeId: relationDraft.targetContentTypeId as ContentTypeId,
      })
    if (result.ok && !selectedRelation) {
      const created = listRelations(result.value).find((item) => item.slug === relationDraft.slug)
      if (created) setSelectedRelationId(created.id)
    }
    setMessage(result.ok ? 'Relación guardada.' : result.error)
    setPending(false)
  }

  async function removeRelation(): Promise<void> {
    if (!selectedRelation || pending) return
    if (!deleteRelationArmed) {
      setDeleteRelationArmed(true)
      setMessage('Confirma la eliminación. Conexiones, campos o consultas dependientes impedirán el borrado.')
      return
    }
    setPending(true)
    const removed = await session.deleteRelation(selectedRelation.id)
    if (removed.ok) {
      setSelectedRelationId(null)
      setRelationDraft(EMPTY_RELATION)
    }
    setMessage(removed.ok ? 'Relación eliminada.' : removed.error)
    setPending(false)
  }

  async function connectRecords(): Promise<void> {
    if (!selectedRelation || !sourceRecordId || !targetRecordId || pending) return
    setPending(true)
    const entry: RelationEntry = {
      id: parseRelationEntryId(crypto.randomUUID()),
      relationId: selectedRelation.id,
      sourceRecordId: sourceRecordId as ContentRecordId,
      targetRecordId: targetRecordId as ContentRecordId,
    }
    const created = await session.createRelationEntry(entry)
    setMessage(created.ok ? 'Registros conectados.' : created.error)
    if (created.ok) {
      setSourceRecordId('')
      setTargetRecordId('')
    }
    setPending(false)
  }

  async function removeEntry(entryId: RelationEntryId): Promise<void> {
    if (pending) return
    if (deleteEntryArmedId !== entryId) {
      setDeleteEntryArmedId(entryId)
      setMessage('Confirma la desconexión.')
      return
    }
    setPending(true)
    const removed = await session.deleteRelationEntry(entryId)
    setMessage(removed.ok ? 'Conexión eliminada.' : removed.error)
    setDeleteEntryArmedId(null)
    setPending(false)
  }

  return (
    <section aria-labelledby="records-relations-title" className="grid gap-2 p-2 lg:p-1.5">
      <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="content" size={15} /></span>
          <div className="min-w-0"><h2 className="text-xs font-bold" id="records-relations-title">Contenido</h2><p className="text-[0.625rem] leading-4 text-muted-foreground">Registros, borradores, revisiones y relaciones referenciales.</p></div>
        </div>
      </div>

      <div aria-label="Gestión de contenido" className="grid grid-cols-2 gap-0.5 rounded-md border border-border bg-muted/30 p-1" role="tablist">
        {(['records', 'relations'] as const).map((item) => (
          <button aria-selected={mode === item} className={`min-h-11 rounded px-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${mode === item ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted'}`} key={item} onClick={() => setMode(item)} role="tab" type="button">{item === 'records' ? 'Registros' : 'Relaciones'}</button>
        ))}
      </div>

      <div hidden={mode !== 'records'} role="tabpanel">
        <div className="grid gap-2">
          <label className="grid gap-1 text-xs font-semibold">Tipo de contenido
            <select className={inputClass} onChange={(event) => resetRecordDraft(event.target.value)} value={contentTypeId}>
              <option value="">Selecciona un tipo</option>
              {contentTypes.map((type) => <option key={type.id} value={type.id}>{type.pluralName}</option>)}
            </select>
          </label>

          {currentContentType ? (
            <>
              <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
                <div className="flex items-center justify-between gap-2 px-1"><strong className="text-xs">Registros</strong><Button onClick={() => resetRecordDraft(contentTypeId)} size="small" variant="secondary"><Icon name="plus" size={12} />Nuevo</Button></div>
                {records.length === 0 ? <p className="rounded border border-dashed border-border p-2 text-xs text-muted-foreground">Sin registros.</p> : (
                  <div aria-label={`Registros de ${currentContentType.pluralName}`} className="grid gap-1" role="listbox">
                    {records.map((record) => (
                      <button aria-selected={selectedRecord?.id === record.id} className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left lg:min-h-9 ${selectedRecord?.id === record.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={record.id} onClick={() => selectRecord(record)} role="option" type="button">
                        <span className="min-w-0"><strong className="block truncate text-xs">{recordLabel(record, fields)}</strong><span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{record.id.slice(0, 8)} · {new Date(record.updatedAt).toLocaleString()}</span></span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold">{statusLabel[record.status]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void saveRecord() }}>
                <div className="flex items-center justify-between gap-2"><strong className="text-xs">{selectedRecord ? 'Editar registro' : 'Nuevo registro'}</strong><span className="text-[0.625rem] text-muted-foreground">{fields.length} campos</span></div>
                <label className="grid gap-1 text-xs font-semibold">Estado<select className={inputClass} onChange={(event) => setRecordStatus(event.target.value as ContentStatus)} value={recordStatus}>{statusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>

                {fields.length === 0 ? <p className="rounded border border-dashed border-border p-2 text-xs text-muted-foreground">Este tipo no tiene campos personalizados. El registro aún puede usar estado y taxonomías.</p> : fields.map((field) => (
                  <label className="grid gap-1 rounded-md border border-border/70 bg-muted/10 p-1.5 text-xs font-semibold" key={field.id}>
                    <span className="flex items-center justify-between gap-2"><span>{field.label}{field.required ? ' *' : ''}</span><code className="font-mono text-[0.625rem] font-normal text-muted-foreground">{field.type}</code></span>
                    {field.description ? <span className="text-[0.625rem] font-normal text-muted-foreground">{field.description}</span> : null}
                    <FieldValueControl field={field} onChange={(value) => setFieldValue(field.id, value)} recordKey={selectedRecord?.id ?? 'new'} value={recordValues[field.id]} />
                  </label>
                ))}

                {terms.length > 0 ? (
                  <fieldset className="grid gap-1 rounded-md border border-border p-1.5"><legend className="px-1 text-[0.625rem] font-bold text-muted-foreground">Taxonomías</legend>{terms.map((term) => <label className="flex min-h-11 items-center gap-2 rounded px-1.5 text-xs hover:bg-muted/50 lg:min-h-9" key={term.id}><input checked={recordTerms.includes(term.id)} className="size-4 accent-primary" onChange={() => setRecordTerms((current) => current.includes(term.id) ? current.filter((id) => id !== term.id) : [...current, term.id])} type="checkbox" />{term.name}</label>)}</fieldset>
                ) : null}

                <div className="flex flex-wrap justify-between gap-1"><div>{selectedRecord ? <Button disabled={pending} onClick={() => { void removeRecord() }} size="small" variant={deleteRecordArmed ? 'destructive' : 'ghost'}>{deleteRecordArmed ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div><Button disabled={pending} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selectedRecord ? 'Guardar cambios' : 'Crear registro'}</Button></div>
              </form>

              {selectedRecord && currentContentType.supports.includes('revisions') ? (
                <section aria-labelledby="record-revisions-title" className="grid gap-1 rounded-md border border-border bg-surface p-2">
                  <div className="flex items-center justify-between"><strong className="text-xs" id="record-revisions-title">Revisiones</strong><span className="rounded bg-muted px-1.5 text-[0.625rem] font-bold">{revisions.length}</span></div>
                  {revisions.length === 0 ? <p className="text-xs text-muted-foreground">Se crea una revisión al modificar este registro.</p> : revisions.map((revision) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded border border-border bg-muted/20 p-1.5" key={revision.id}><span className="min-w-0"><strong className="block truncate text-xs">{statusLabel[revision.snapshot.status]}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{new Date(revision.createdAt).toLocaleString()}</span></span><Button disabled={pending} onClick={() => { void restoreRevision(revision.id) }} size="small" variant={restoreArmedId === revision.id ? 'destructive' : 'ghost'}>{restoreArmedId === revision.id ? 'Confirmar' : 'Restaurar'}</Button></div>)}
                </section>
              ) : null}
            </>
          ) : <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">Selecciona un CPT implementado para gestionar sus registros.</p>}
        </div>
      </div>

      <div hidden={mode !== 'relations'} role="tabpanel">
        <div className="grid gap-2">
          <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5"><div className="flex items-center justify-between px-1"><strong className="text-xs">Relaciones</strong><Button disabled={contentTypes.length === 0} onClick={beginRelation} size="small" variant="secondary"><Icon name="plus" size={12} />Nueva</Button></div>{relations.length === 0 ? <p className="rounded border border-dashed border-border p-2 text-xs text-muted-foreground">Sin relaciones.</p> : <div aria-label="Relaciones registradas" className="grid gap-1" role="listbox">{relations.map((relation) => <button aria-selected={selectedRelation?.id === relation.id} className={`min-h-11 rounded border px-2 text-left lg:min-h-9 ${selectedRelation?.id === relation.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={relation.id} onClick={() => selectRelation(relation)} role="option" type="button"><strong className="block truncate text-xs">{relation.name}</strong><span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{relation.slug} · {relation.cardinality}</span></button>)}</div>}</div>

          <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void saveRelation() }}>
            <strong className="text-xs">{selectedRelation ? 'Editar relación' : 'Nueva relación'}</strong>
            <label className="grid gap-1 text-xs font-semibold">Nombre<input className={inputClass} maxLength={160} onChange={(event) => setRelationDraft((current) => ({ ...current, name: event.target.value }))} value={relationDraft.name} /></label>
            <label className="grid gap-1 text-xs font-semibold">Slug<input autoCapitalize="none" className={`${inputClass} font-mono`} maxLength={120} onChange={(event) => setRelationDraft((current) => ({ ...current, slug: event.target.value.toLocaleLowerCase('en-US') }))} value={relationDraft.slug} /></label>
            <label className="grid gap-1 text-xs font-semibold">Cardinalidad<select className={inputClass} onChange={(event) => setRelationDraft((current) => ({ ...current, cardinality: event.target.value as Relation['cardinality'] }))} value={relationDraft.cardinality}><option value="one-to-one">1 : 1</option><option value="one-to-many">1 : N</option><option value="many-to-many">N : N</option></select></label>
            <div className="grid grid-cols-2 gap-1.5"><label className="grid min-w-0 gap-1 text-xs font-semibold">Origen<select className={inputClass} onChange={(event) => setRelationDraft((current) => ({ ...current, sourceContentTypeId: event.target.value }))} value={relationDraft.sourceContentTypeId}><option value="">Selecciona</option>{contentTypes.map((type) => <option key={type.id} value={type.id}>{type.pluralName}</option>)}</select></label><label className="grid min-w-0 gap-1 text-xs font-semibold">Destino<select className={inputClass} onChange={(event) => setRelationDraft((current) => ({ ...current, targetContentTypeId: event.target.value }))} value={relationDraft.targetContentTypeId}><option value="">Selecciona</option>{contentTypes.map((type) => <option key={type.id} value={type.id}>{type.pluralName}</option>)}</select></label></div>
            <div className="flex flex-wrap justify-between gap-1"><div>{selectedRelation ? <Button disabled={pending} onClick={() => { void removeRelation() }} size="small" variant={deleteRelationArmed ? 'destructive' : 'ghost'}>{deleteRelationArmed ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div><Button disabled={pending || contentTypes.length === 0} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selectedRelation ? 'Guardar relación' : 'Crear relación'}</Button></div>
          </form>

          {selectedRelation ? (
            <section aria-labelledby="relation-entries-title" className="grid gap-2 rounded-md border border-border bg-surface p-2"><div className="flex items-center justify-between"><strong className="text-xs" id="relation-entries-title">Conexiones</strong><span className="rounded bg-muted px-1.5 text-[0.625rem] font-bold">{relationEntries.length}</span></div><div className="grid gap-1.5"><label className="grid gap-1 text-xs font-semibold">Registro origen<select className={inputClass} onChange={(event) => setSourceRecordId(event.target.value)} value={sourceRecordId}><option value="">Selecciona</option>{sourceRecords.map((record) => <option key={record.id} value={record.id}>{recordLabel(record, Object.values(structure.cms?.fields ?? {}))}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold">Registro destino<select className={inputClass} onChange={(event) => setTargetRecordId(event.target.value)} value={targetRecordId}><option value="">Selecciona</option>{targetRecords.map((record) => <option key={record.id} value={record.id}>{recordLabel(record, Object.values(structure.cms?.fields ?? {}))}</option>)}</select></label><Button disabled={pending || !sourceRecordId || !targetRecordId} onClick={() => { void connectRecords() }} size="small" variant="secondary">Conectar registros</Button></div>{relationEntries.length === 0 ? <p className="text-xs text-muted-foreground">Sin conexiones.</p> : relationEntries.map((entry) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded border border-border bg-muted/20 p-1.5" key={entry.id}><span className="min-w-0 font-mono text-[0.625rem] text-muted-foreground"><span className="block truncate">{entry.sourceRecordId.slice(0, 8)} → {entry.targetRecordId.slice(0, 8)}</span></span><Button disabled={pending} onClick={() => { void removeEntry(entry.id) }} size="small" variant={deleteEntryArmedId === entry.id ? 'destructive' : 'ghost'}>{deleteEntryArmedId === entry.id ? 'Confirmar' : 'Desconectar'}</Button></div>)}</section>
          ) : null}
        </div>
      </div>

      <p aria-live="polite" className="min-h-4 rounded-md bg-muted/20 px-2 py-1 text-[0.625rem] leading-4 text-muted-foreground">{message}</p>
      <p className="rounded-md border border-dashed border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">Bindings dinámicos y estados de preview pertenecen a M09.5 y no se simulan aquí.</p>
    </section>
  )
}
