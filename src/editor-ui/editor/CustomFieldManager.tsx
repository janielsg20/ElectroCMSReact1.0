import { useMemo, useState } from 'react'
import {
  FieldDefinitionSchema,
  parseFieldDefinitionId,
  type FieldDefinition,
  type JsonValue,
} from '../../domain'
import { listCustomFields } from '../../domain/project/custom-field-engine'
import { Button, Icon } from '../primitives'
import { useCustomFieldSession, useEditorProjectStructure } from './editor-project-context'

type FieldType = FieldDefinition['type']
type OwnerKind = FieldDefinition['owner']['kind']

interface FieldDraft {
  readonly allowedRoleIds: readonly string[]
  readonly calculatedExpression: string
  readonly childFieldIds: readonly string[]
  readonly conditionsJson: string
  readonly defaultValue: string
  readonly description: string
  readonly group: string
  readonly key: string
  readonly label: string
  readonly max: string
  readonly maxLength: string
  readonly min: string
  readonly minLength: string
  readonly optionsText: string
  readonly order: string
  readonly ownerId: string
  readonly ownerKind: OwnerKind
  readonly pattern: string
  readonly placeholder: string
  readonly relationId: string
  readonly required: boolean
  readonly taxonomyId: string
  readonly type: FieldType
}

const EMPTY_DRAFT: FieldDraft = {
  allowedRoleIds: [], calculatedExpression: '', childFieldIds: [], conditionsJson: '[]', defaultValue: '',
  description: '', group: '', key: '', label: '', max: '', maxLength: '', min: '', minLength: '', optionsText: '',
  order: '10', ownerId: '', ownerKind: 'content-type', pattern: '', placeholder: '', relationId: '', required: false,
  taxonomyId: '', type: 'text',
}

const fieldGroups: ReadonlyArray<readonly [string, readonly FieldType[]]> = [
  ['Texto', ['text', 'textarea', 'rich-text', 'email', 'phone', 'url']],
  ['Numérico', ['number', 'currency']],
  ['Fecha y formato', ['date', 'time', 'datetime', 'color']],
  ['Selección', ['select', 'radio', 'checkbox', 'switch']],
  ['Media', ['image', 'gallery', 'file', 'map']],
  ['Dinámico', ['relation', 'user', 'taxonomy', 'repeater', 'group', 'calculated', 'conditional']],
]

const typeLabels: Record<FieldType, string> = {
  text: 'Texto', textarea: 'Textarea', 'rich-text': 'Rich text', number: 'Número', currency: 'Moneda', email: 'Email',
  phone: 'Teléfono', url: 'URL', date: 'Fecha', time: 'Hora', datetime: 'Fecha y hora', color: 'Color', select: 'Selector',
  radio: 'Radio', checkbox: 'Checkbox', switch: 'Switch', image: 'Imagen', gallery: 'Galería', file: 'Archivo', map: 'Mapa',
  relation: 'Relación', user: 'Usuario', taxonomy: 'Taxonomía', repeater: 'Repeater', group: 'Grupo', calculated: 'Calculado', conditional: 'Condicional',
}

const inputClass = 'min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9'

function serializedDefault(value: JsonValue): string {
  if (value === null) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function optionsText(field: FieldDefinition): string {
  return field.options.map((option) => `${option.label} | ${JSON.stringify(option.value)}`).join('\n')
}

function draftFromField(field: FieldDefinition): FieldDraft {
  return {
    allowedRoleIds: [...field.allowedRoleIds], calculatedExpression: field.calculatedExpression ?? '', childFieldIds: [...field.childFieldIds],
    conditionsJson: JSON.stringify(field.conditions, null, 2), defaultValue: serializedDefault(field.defaultValue), description: field.description,
    group: field.group, key: field.key, label: field.label, max: field.validation.max?.toString() ?? '', maxLength: field.validation.maxLength?.toString() ?? '',
    min: field.validation.min?.toString() ?? '', minLength: field.validation.minLength?.toString() ?? '', optionsText: optionsText(field), order: field.order.toString(),
    ownerId: field.owner.kind === 'content-type' ? field.owner.contentTypeId : field.owner.taxonomyId, ownerKind: field.owner.kind,
    pattern: field.validation.pattern ?? '', placeholder: field.placeholder, relationId: field.relationId ?? '', required: field.required,
    taxonomyId: field.taxonomyId ?? '', type: field.type,
  }
}

function parseNullableNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function parseNullableInteger(value: string): number | null {
  const parsed = parseNullableNumber(value)
  return parsed === null ? null : Number.isInteger(parsed) ? parsed : Number.NaN
}

function parseOptions(input: string): unknown[] {
  return input.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf('|')
    if (separator < 1) throw new Error('Cada opción debe usar “Etiqueta | valor JSON”.')
    const label = line.slice(0, separator).trim()
    const raw = line.slice(separator + 1).trim()
    if (!label || !raw) throw new Error('Cada opción requiere etiqueta y valor.')
    let value: unknown
    try { value = JSON.parse(raw) } catch { value = raw }
    return { label, value }
  })
}

function parseDefault(type: FieldType, input: string): unknown {
  if (!input.trim()) return null
  if (type === 'number' || type === 'currency') return Number(input)
  if (type === 'switch') {
    if (input === 'true') return true
    if (input === 'false') return false
    return input
  }
  if (type === 'checkbox' || type === 'gallery' || type === 'group' || type === 'repeater' || type === 'map') {
    try { return JSON.parse(input) } catch { return input }
  }
  return input
}

function ownerLabel(field: FieldDefinition, contentTypeNames: ReadonlyMap<string, string>, taxonomyNames: ReadonlyMap<string, string>): string {
  return field.owner.kind === 'content-type'
    ? contentTypeNames.get(field.owner.contentTypeId) ?? 'CPT eliminado'
    : taxonomyNames.get(field.owner.taxonomyId) ?? 'Taxonomía eliminada'
}

export function CustomFieldManager() {
  const session = useCustomFieldSession()
  const structure = useEditorProjectStructure()
  const fields = useMemo(() => listCustomFields(structure), [structure])
  const contentTypes = useMemo(() => Object.values(structure.cms?.contentTypes ?? {}).sort((a, b) => a.pluralName.localeCompare(b.pluralName, 'es')), [structure.cms?.contentTypes])
  const taxonomies = useMemo(() => Object.values(structure.cms?.taxonomies ?? {}).sort((a, b) => a.pluralName.localeCompare(b.pluralName, 'es')), [structure.cms?.taxonomies])
  const roles = useMemo(() => Object.values(structure.cms?.roles ?? {}).sort((a, b) => a.name.localeCompare(b.name, 'es')), [structure.cms?.roles])
  const contentTypeNames = useMemo(() => new Map(contentTypes.map((item) => [item.id, item.pluralName])), [contentTypes])
  const taxonomyNames = useMemo(() => new Map(taxonomies.map((item) => [item.id, item.pluralName])), [taxonomies])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<FieldDraft>(() => ({
    ...EMPTY_DRAFT,
    ownerId: contentTypes[0]?.id ?? taxonomies[0]?.id ?? '',
    ownerKind: contentTypes.length > 0 ? 'content-type' : 'taxonomy',
  }))
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)

  const selected = selectedId ? fields.find((field) => field.id === selectedId) ?? null : null
  const selectedOwner = draft.ownerKind === 'content-type'
    ? contentTypes.find((item) => item.id === draft.ownerId)
    : taxonomies.find((item) => item.id === draft.ownerId)
  const ownerFields = fields.filter((field) => (
    field.id !== selected?.id
    && field.owner.kind === draft.ownerKind
    && (field.owner.kind === 'content-type' ? field.owner.contentTypeId : field.owner.taxonomyId) === draft.ownerId
  ))
  const availableTaxonomies = draft.ownerKind === 'content-type' && selectedOwner && 'taxonomyIds' in selectedOwner
    ? taxonomies.filter((taxonomy) => selectedOwner.taxonomyIds.includes(taxonomy.id))
    : taxonomies
  const availableRelations = draft.ownerKind === 'content-type' && selectedOwner && 'taxonomyIds' in selectedOwner
    ? Object.values(structure.cms?.relations ?? {}).filter((relation) => relation.sourceContentTypeId === selectedOwner.id || relation.targetContentTypeId === selectedOwner.id)
    : []

  function patchDraft(patch: Partial<FieldDraft>): void { setDraft((current) => ({ ...current, ...patch })) }

  function beginNew(): void {
    const ownerKind: OwnerKind = contentTypes.length > 0 ? 'content-type' : 'taxonomy'
    setSelectedId(null)
    setDeleteArmedId(null)
    setDraft({ ...EMPTY_DRAFT, ownerKind, ownerId: ownerKind === 'content-type' ? contentTypes[0]?.id ?? '' : taxonomies[0]?.id ?? '' })
    setMessage('Nuevo campo. El propietario no puede cambiar después de crear el campo.')
  }

  function selectField(field: FieldDefinition): void {
    setSelectedId(field.id)
    setDeleteArmedId(null)
    setDraft(draftFromField(field))
    setMessage('')
  }

  function setOwnerKind(ownerKind: OwnerKind): void {
    patchDraft({ ownerKind, ownerId: ownerKind === 'content-type' ? contentTypes[0]?.id ?? '' : taxonomies[0]?.id ?? '', childFieldIds: [], relationId: '', taxonomyId: '', conditionsJson: '[]' })
  }

  function toggleStringList(key: 'allowedRoleIds' | 'childFieldIds', value: string): void {
    patchDraft({ [key]: draft[key].includes(value) ? draft[key].filter((id) => id !== value) : [...draft[key], value] })
  }

  function buildCandidate(): ReturnType<typeof FieldDefinitionSchema.safeParse> {
    let conditions: unknown
    try { conditions = JSON.parse(draft.conditionsJson || '[]') } catch { return FieldDefinitionSchema.safeParse({ invalid: 'conditions-json' }) }
    let options: unknown[]
    try { options = parseOptions(draft.optionsText) } catch { return FieldDefinitionSchema.safeParse({ invalid: 'options-text' }) }
    const owner = draft.ownerKind === 'content-type' ? contentTypes.find((item) => item.id === draft.ownerId) : taxonomies.find((item) => item.id === draft.ownerId)
    if (!owner) return FieldDefinitionSchema.safeParse({ invalid: 'owner' })
    return FieldDefinitionSchema.safeParse({
      allowedRoleIds: draft.allowedRoleIds,
      calculatedExpression: draft.type === 'calculated' ? draft.calculatedExpression : null,
      childFieldIds: draft.type === 'group' || draft.type === 'repeater' ? draft.childFieldIds : [],
      conditions,
      defaultValue: parseDefault(draft.type, draft.defaultValue),
      description: draft.description,
      group: draft.group,
      id: selected?.id ?? parseFieldDefinitionId(crypto.randomUUID()),
      key: draft.key,
      label: draft.label,
      options: draft.type === 'select' || draft.type === 'radio' || draft.type === 'checkbox' ? options : [],
      order: Number(draft.order),
      owner: draft.ownerKind === 'content-type' ? { contentTypeId: owner.id, kind: 'content-type' } : { kind: 'taxonomy', taxonomyId: owner.id },
      placeholder: draft.placeholder,
      relationId: draft.type === 'relation' ? draft.relationId || null : null,
      required: draft.required,
      taxonomyId: draft.type === 'taxonomy' ? draft.taxonomyId || null : null,
      type: draft.type,
      validation: {
        max: parseNullableNumber(draft.max), maxLength: parseNullableInteger(draft.maxLength), min: parseNullableNumber(draft.min), minLength: parseNullableInteger(draft.minLength), pattern: draft.pattern.trim() || null,
      },
    })
  }

  async function saveField(): Promise<void> {
    if (pending) return
    const parsed = buildCandidate()
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? 'Revisa la configuración del campo.'); return }
    setPending(true)
    if (selected) {
      const value = parsed.data
      const updated = await session.updateCustomField(selected.id, {
        allowedRoleIds: value.allowedRoleIds, calculatedExpression: value.calculatedExpression, childFieldIds: value.childFieldIds,
        conditions: value.conditions, defaultValue: value.defaultValue, description: value.description, group: value.group, key: value.key,
        label: value.label, options: value.options, order: value.order, placeholder: value.placeholder, relationId: value.relationId,
        required: value.required, taxonomyId: value.taxonomyId, type: value.type, validation: value.validation,
      })
      setMessage(updated.ok ? `${value.label} actualizado.` : updated.error)
    } else {
      const created = await session.createCustomField(parsed.data)
      if (created.ok) { setSelectedId(parsed.data.id); setMessage(`${parsed.data.label} creado y vinculado a su propietario.`) }
      else setMessage(created.error)
    }
    setPending(false)
  }

  async function removeField(): Promise<void> {
    if (!selected || pending) return
    if (deleteArmedId !== selected.id) {
      setDeleteArmedId(selected.id)
      setMessage('Pulsa Confirmar eliminación. Los campos usados por datos, revisiones, composición, condiciones, queries, formularios o roles quedan protegidos.')
      return
    }
    setPending(true)
    const removed = await session.deleteCustomField(selected.id)
    if (removed.ok) {
      setSelectedId(null)
      setDeleteArmedId(null)
      setDraft({ ...EMPTY_DRAFT, ownerKind: contentTypes.length > 0 ? 'content-type' : 'taxonomy', ownerId: contentTypes[0]?.id ?? taxonomies[0]?.id ?? '' })
      setMessage(`${selected.label} eliminado.`)
    } else setMessage(removed.error)
    setPending(false)
  }

  const hasOwners = contentTypes.length > 0 || taxonomies.length > 0
  const usesOptions = draft.type === 'select' || draft.type === 'radio' || draft.type === 'checkbox'
  const usesChildren = draft.type === 'group' || draft.type === 'repeater'
  const numeric = draft.type === 'number' || draft.type === 'currency'

  return (
    <section aria-labelledby="custom-fields-title" className="grid gap-2 p-2 lg:p-1.5">
      <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="flex min-w-0 items-start gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="form" size={15} /></span><div className="min-w-0"><h2 className="text-xs font-bold" id="custom-fields-title">Campos personalizados</h2><p className="text-[0.625rem] leading-4 text-muted-foreground">27 tipos canónicos para CPT y taxonomías, con validación e integridad.</p></div></div>
        <Button disabled={pending || !hasOwners} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nuevo</Button>
      </div>

      {!hasOwners ? <p className="rounded-md border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">Crea primero un CPT o una taxonomía real. Los campos siempre pertenecen a una entidad canónica.</p> : null}

      <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
        <div className="flex items-center justify-between gap-2 px-1"><strong className="text-xs">Registrados</strong><span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{fields.length}</span></div>
        {fields.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Sin campos personalizados.</p> : <div aria-label="Campos personalizados registrados" className="grid gap-1" role="listbox">{fields.map((field) => <button aria-selected={selected?.id === field.id} className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === field.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={field.id} onClick={() => selectField(field)} role="option" type="button"><span className="min-w-0"><strong className="block truncate text-xs">{field.label}</strong><span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{field.key} · {typeLabels[field.type]}</span></span><span className="max-w-24 truncate text-[0.625rem] font-semibold text-muted-foreground">{ownerLabel(field, contentTypeNames, taxonomyNames)}</span></button>)}</div>}
      </div>

      <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void saveField() }}>
        <div className="flex items-center justify-between gap-2"><div><strong className="block text-xs">{selected ? `Editar ${selected.label}` : 'Nuevo campo'}</strong><span className="text-[0.625rem] text-muted-foreground">Schema único; el propietario queda fijo tras crear.</span></div>{selected ? <span className="max-w-28 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">{selected.id}</span> : null}</div>
        <fieldset className="grid grid-cols-2 gap-1.5 rounded-md border border-border p-1.5" disabled={Boolean(selected)}><legend className="px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Propietario</legend><label className="grid gap-1 text-xs font-semibold">Tipo de propietario<select className={inputClass} onChange={(event) => setOwnerKind(event.target.value as OwnerKind)} value={draft.ownerKind}><option disabled={contentTypes.length === 0} value="content-type">CPT</option><option disabled={taxonomies.length === 0} value="taxonomy">Taxonomía</option></select></label><label className="grid gap-1 text-xs font-semibold">Entidad<select className={inputClass} onChange={(event) => patchDraft({ ownerId: event.target.value, childFieldIds: [], conditionsJson: '[]', relationId: '', taxonomyId: '' })} value={draft.ownerId}>{draft.ownerKind === 'content-type' ? contentTypes.map((item) => <option key={item.id} value={item.id}>{item.pluralName}</option>) : taxonomies.map((item) => <option key={item.id} value={item.id}>{item.pluralName}</option>)}</select></label></fieldset>
        <div className="grid grid-cols-2 gap-1.5"><label className="grid gap-1 text-xs font-semibold">Etiqueta<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ label: event.target.value })} value={draft.label} /></label><label className="grid gap-1 text-xs font-semibold">Clave<input autoCapitalize="none" className={`${inputClass} font-mono`} maxLength={160} onChange={(event) => patchDraft({ key: event.target.value })} value={draft.key} /></label></div>
        <label className="grid gap-1 text-xs font-semibold">Tipo<select className={inputClass} onChange={(event) => patchDraft({ type: event.target.value as FieldType, relationId: '', taxonomyId: '', childFieldIds: [], calculatedExpression: '', optionsText: '', defaultValue: '' })} value={draft.type}>{fieldGroups.map(([label, types]) => <optgroup key={label} label={label}>{types.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</optgroup>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold">Descripción<textarea className="min-h-16 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchDraft({ description: event.target.value })} value={draft.description} /></label>
        <label className="grid gap-1 text-xs font-semibold">Placeholder<input className={inputClass} maxLength={500} onChange={(event) => patchDraft({ placeholder: event.target.value })} value={draft.placeholder} /></label>
        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-1.5"><label className="grid gap-1 text-xs font-semibold">Grupo / pestaña<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ group: event.target.value })} value={draft.group} /></label><label className="grid gap-1 text-xs font-semibold">Orden<input className={inputClass} min="0" onChange={(event) => patchDraft({ order: event.target.value })} type="number" value={draft.order} /></label></div>
        <label className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs font-semibold lg:min-h-9"><span><strong className="block">Requerido</strong><span className="font-normal text-muted-foreground">Valida presencia al salir del estado borrador.</span></span><input checked={draft.required} className="size-4 accent-primary" onChange={(event) => patchDraft({ required: event.target.checked })} type="checkbox" /></label>

        <details className="rounded-md border border-border bg-muted/15 p-1.5"><summary className="min-h-9 cursor-pointer select-none py-2 text-xs font-bold">Validación</summary><div className="grid grid-cols-2 gap-1.5 pt-1"><label className="grid gap-1 text-[0.625rem] font-semibold">Min length<input className={inputClass} min="0" onChange={(event) => patchDraft({ minLength: event.target.value })} type="number" value={draft.minLength} /></label><label className="grid gap-1 text-[0.625rem] font-semibold">Max length<input className={inputClass} min="0" onChange={(event) => patchDraft({ maxLength: event.target.value })} type="number" value={draft.maxLength} /></label><label className="grid gap-1 text-[0.625rem] font-semibold">Mínimo<input className={inputClass} onChange={(event) => patchDraft({ min: event.target.value })} type="number" value={draft.min} /></label><label className="grid gap-1 text-[0.625rem] font-semibold">Máximo<input className={inputClass} onChange={(event) => patchDraft({ max: event.target.value })} type="number" value={draft.max} /></label><label className="col-span-2 grid gap-1 text-[0.625rem] font-semibold">Pattern<input className={`${inputClass} font-mono`} maxLength={500} onChange={(event) => patchDraft({ pattern: event.target.value })} value={draft.pattern} /></label></div></details>

        {usesOptions ? <label className="grid gap-1 text-xs font-semibold">Opciones<span className="font-normal text-muted-foreground">Una por línea: <code>Etiqueta | valor JSON</code></span><textarea className="min-h-24 resize-y rounded-md border border-border bg-surface p-2 font-mono text-[0.6875rem] font-normal focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchDraft({ optionsText: event.target.value })} placeholder={'Principal | "main"\nSecundaria | "secondary"'} value={draft.optionsText} /></label> : null}
        {usesChildren ? <fieldset className="grid gap-1 rounded-md border border-border p-1.5"><legend className="px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Campos hijos</legend>{ownerFields.length === 0 ? <p className="p-1 text-[0.625rem] text-muted-foreground">Crea primero campos simples bajo el mismo propietario.</p> : ownerFields.map((field) => <label className="flex min-h-11 items-center gap-2 rounded px-1.5 text-xs hover:bg-muted lg:min-h-9" key={field.id}><input checked={draft.childFieldIds.includes(field.id)} className="size-4 accent-primary" onChange={() => toggleStringList('childFieldIds', field.id)} type="checkbox" /><span><strong className="block">{field.label}</strong><span className="font-mono text-[0.625rem] text-muted-foreground">{field.key}</span></span></label>)}</fieldset> : null}
        {draft.type === 'relation' ? <label className="grid gap-1 text-xs font-semibold">Relación<select className={inputClass} onChange={(event) => patchDraft({ relationId: event.target.value })} value={draft.relationId}><option value="">Selecciona una relación existente</option>{availableRelations.map((relation) => <option key={relation.id} value={relation.id}>{relation.name}</option>)}</select>{availableRelations.length === 0 ? <span className="font-normal text-muted-foreground">No hay relaciones compatibles. Créala en Datos → Registros y relaciones → Relaciones.</span> : null}</label> : null}
        {draft.type === 'taxonomy' ? <label className="grid gap-1 text-xs font-semibold">Taxonomía<select className={inputClass} onChange={(event) => patchDraft({ taxonomyId: event.target.value })} value={draft.taxonomyId}><option value="">Selecciona una taxonomía existente</option>{availableTaxonomies.map((taxonomy) => <option key={taxonomy.id} value={taxonomy.id}>{taxonomy.pluralName}</option>)}</select></label> : null}
        {draft.type === 'calculated' ? <label className="grid gap-1 text-xs font-semibold">Expresión calculada<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={2000} onChange={(event) => patchDraft({ calculatedExpression: event.target.value })} placeholder="price * quantity" value={draft.calculatedExpression} /></label> : null}
        <label className="grid gap-1 text-xs font-semibold">Valor predeterminado<span className="font-normal text-muted-foreground">{numeric ? 'Número' : draft.type === 'switch' ? 'true / false' : usesChildren || draft.type === 'checkbox' || draft.type === 'gallery' || draft.type === 'map' ? 'JSON cuando corresponda' : 'Valor del tipo seleccionado'}</span>{usesChildren || draft.type === 'checkbox' || draft.type === 'gallery' || draft.type === 'map' ? <textarea className="min-h-16 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchDraft({ defaultValue: event.target.value })} value={draft.defaultValue} /> : <input className={inputClass} onChange={(event) => patchDraft({ defaultValue: event.target.value })} type={numeric ? 'number' : 'text'} value={draft.defaultValue} />}</label>

        <details className="rounded-md border border-border bg-muted/15 p-1.5"><summary className="min-h-9 cursor-pointer select-none py-2 text-xs font-bold">Condiciones y roles</summary><div className="grid gap-2 pt-1"><label className="grid gap-1 text-xs font-semibold">Condiciones JSON<span className="font-normal text-muted-foreground">Usa exactamente el contrato canónico de grupos all/any y fieldId.</span><textarea className="min-h-28 resize-y rounded-md border border-border bg-surface p-2 font-mono text-[0.6875rem] font-normal focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchDraft({ conditionsJson: event.target.value })} value={draft.conditionsJson} /></label><fieldset className="grid gap-1"><legend className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Visibilidad por rol</legend>{roles.length === 0 ? <p className="text-[0.625rem] text-muted-foreground">Sin roles canónicos disponibles; F12 formalizará su gestión.</p> : roles.map((role) => <label className="flex min-h-11 items-center gap-2 rounded px-1.5 text-xs hover:bg-muted lg:min-h-9" key={role.id}><input checked={draft.allowedRoleIds.includes(role.id)} className="size-4 accent-primary" onChange={() => toggleStringList('allowedRoleIds', role.id)} type="checkbox" />{role.name}</label>)}</fieldset></div></details>

        <div className="flex flex-wrap justify-between gap-1"><div>{selected ? <Button disabled={pending} onClick={() => { void removeField() }} size="small" variant={deleteArmedId === selected.id ? 'destructive' : 'ghost'}>{deleteArmedId === selected.id ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div><Button disabled={pending || !hasOwners} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selected ? 'Guardar cambios' : 'Crear campo'}</Button></div>
        <p aria-live="polite" className="min-h-4 text-[0.625rem] leading-4 text-muted-foreground">{message}</p>
      </form>

      <p className="rounded-md border border-dashed border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">Registros, revisiones y relaciones ya se gestionan en Datos. El binding dinámico y sus estados de preview se incorporan en M09.5.</p>
    </section>
  )
}
