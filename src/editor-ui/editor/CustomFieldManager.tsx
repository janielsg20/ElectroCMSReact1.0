import { useMemo, useState } from 'react'
import {
  FieldDefinitionSchema,
  parseFieldDefinitionId,
  type FieldDefinition,
  type JsonValue,
} from '../../domain'
import { listCustomFields } from '../../domain/project/custom-field-engine'
import { Button, ChoiceField, HelpTip, Icon } from '../primitives'
import { useCustomFieldSession, useEditorProjectStructure } from './editor-project-context'
import { DATA_HELP } from './feature-help'

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
  allowedRoleIds: [],
  calculatedExpression: '',
  childFieldIds: [],
  conditionsJson: '[]',
  defaultValue: '',
  description: '',
  group: '',
  key: '',
  label: '',
  max: '',
  maxLength: '',
  min: '',
  minLength: '',
  optionsText: '',
  order: '10',
  ownerId: '',
  ownerKind: 'content-type',
  pattern: '',
  placeholder: '',
  relationId: '',
  required: false,
  taxonomyId: '',
  type: 'text',
}

const fieldGroups: ReadonlyArray<readonly [string, readonly FieldType[]]> = [
  ['Texto', ['text', 'textarea', 'rich-text', 'email', 'phone', 'url']],
  ['Números', ['number', 'currency']],
  ['Fecha y formato', ['date', 'time', 'datetime', 'color']],
  ['Opciones', ['select', 'radio', 'checkbox', 'switch']],
  ['Archivos y ubicación', ['image', 'gallery', 'file', 'map']],
  ['Contenido dinámico', ['relation', 'user', 'taxonomy', 'repeater', 'group', 'calculated', 'conditional']],
]

const typeLabels: Record<FieldType, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  'rich-text': 'Texto enriquecido',
  number: 'Número',
  currency: 'Moneda',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  url: 'Enlace / URL',
  date: 'Fecha',
  time: 'Hora',
  datetime: 'Fecha y hora',
  color: 'Color',
  select: 'Lista de opciones',
  radio: 'Una opción',
  checkbox: 'Casillas de selección',
  switch: 'Interruptor',
  image: 'Imagen',
  gallery: 'Galería',
  file: 'Archivo',
  map: 'Ubicación / mapa',
  relation: 'Contenido relacionado',
  user: 'Usuario',
  taxonomy: 'Clasificación',
  repeater: 'Lista repetible',
  group: 'Grupo de campos',
  calculated: 'Valor calculado',
  conditional: 'Campo condicional',
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
    allowedRoleIds: [...field.allowedRoleIds],
    calculatedExpression: field.calculatedExpression ?? '',
    childFieldIds: [...field.childFieldIds],
    conditionsJson: JSON.stringify(field.conditions, null, 2),
    defaultValue: serializedDefault(field.defaultValue),
    description: field.description,
    group: field.group,
    key: field.key,
    label: field.label,
    max: field.validation.max?.toString() ?? '',
    maxLength: field.validation.maxLength?.toString() ?? '',
    min: field.validation.min?.toString() ?? '',
    minLength: field.validation.minLength?.toString() ?? '',
    optionsText: optionsText(field),
    order: field.order.toString(),
    ownerId: field.owner.kind === 'content-type' ? field.owner.contentTypeId : field.owner.taxonomyId,
    ownerKind: field.owner.kind,
    pattern: field.validation.pattern ?? '',
    placeholder: field.placeholder,
    relationId: field.relationId ?? '',
    required: field.required,
    taxonomyId: field.taxonomyId ?? '',
    type: field.type,
  }
}

function keyFromLabel(label: string): string {
  return label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '_').replace(/^[_\d.-]+/, '').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'field'
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
    if (separator < 1) throw new Error('Cada opción debe usar “Etiqueta | valor”.')
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

export function CustomFieldManager() {
  const session = useCustomFieldSession()
  const structure = useEditorProjectStructure()
  const help = DATA_HELP.fields
  const fields = useMemo(() => listCustomFields(structure), [structure])
  const contentTypes = useMemo(() => Object.values(structure.cms?.contentTypes ?? {}).sort((a, b) => a.pluralName.localeCompare(b.pluralName, 'es')), [structure.cms?.contentTypes])
  const taxonomies = useMemo(() => Object.values(structure.cms?.taxonomies ?? {}).sort((a, b) => a.pluralName.localeCompare(b.pluralName, 'es')), [structure.cms?.taxonomies])
  const roles = useMemo(() => Object.values(structure.cms?.roles ?? {}).sort((a, b) => a.name.localeCompare(b.name, 'es')), [structure.cms?.roles])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<FieldDraft>(() => ({ ...EMPTY_DRAFT, ownerId: contentTypes[0]?.id ?? taxonomies[0]?.id ?? '', ownerKind: contentTypes.length > 0 ? 'content-type' : 'taxonomy' }))
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const selected = selectedId ? fields.find((field) => field.id === selectedId) ?? null : null
  const selectedOwner = draft.ownerKind === 'content-type' ? contentTypes.find((item) => item.id === draft.ownerId) : taxonomies.find((item) => item.id === draft.ownerId)
  const ownerFields = fields.filter((field) => field.id !== selected?.id && field.owner.kind === draft.ownerKind && (field.owner.kind === 'content-type' ? field.owner.contentTypeId : field.owner.taxonomyId) === draft.ownerId)
  const availableTaxonomies = draft.ownerKind === 'content-type' && selectedOwner && 'taxonomyIds' in selectedOwner ? taxonomies.filter((taxonomy) => selectedOwner.taxonomyIds.includes(taxonomy.id)) : taxonomies
  const availableRelations = draft.ownerKind === 'content-type' && selectedOwner && 'taxonomyIds' in selectedOwner ? Object.values(structure.cms?.relations ?? {}).filter((relation) => relation.sourceContentTypeId === selectedOwner.id || relation.targetContentTypeId === selectedOwner.id) : []
  const hasOwners = contentTypes.length > 0 || taxonomies.length > 0
  const usesOptions = draft.type === 'select' || draft.type === 'radio' || draft.type === 'checkbox'
  const usesChildren = draft.type === 'group' || draft.type === 'repeater'
  const numeric = draft.type === 'number' || draft.type === 'currency'

  function patchDraft(patch: Partial<FieldDraft>) { setDraft((current) => ({ ...current, ...patch })) }

  function beginNew() {
    const ownerKind: OwnerKind = contentTypes.length > 0 ? 'content-type' : 'taxonomy'
    setSelectedId(null)
    setDeleteArmedId(null)
    setAdvancedOpen(false)
    setDraft({ ...EMPTY_DRAFT, ownerKind, ownerId: ownerKind === 'content-type' ? contentTypes[0]?.id ?? '' : taxonomies[0]?.id ?? '' })
    setMessage('Nuevo campo. Elige dónde se usará, su nombre y el tipo de información que guardará.')
  }

  function selectField(field: FieldDefinition) {
    setSelectedId(field.id)
    setDeleteArmedId(null)
    setAdvancedOpen(false)
    setDraft(draftFromField(field))
    setMessage('')
  }

  function setOwnerKind(ownerKind: OwnerKind) {
    patchDraft({ ownerKind, ownerId: ownerKind === 'content-type' ? contentTypes[0]?.id ?? '' : taxonomies[0]?.id ?? '', childFieldIds: [], relationId: '', taxonomyId: '', conditionsJson: '[]' })
  }

  function toggleStringList(key: 'allowedRoleIds' | 'childFieldIds', value: string) {
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
      key: draft.key.trim() || keyFromLabel(draft.label),
      label: draft.label,
      options: draft.type === 'select' || draft.type === 'radio' || draft.type === 'checkbox' ? options : [],
      order: Number(draft.order),
      owner: draft.ownerKind === 'content-type' ? { contentTypeId: owner.id, kind: 'content-type' } : { kind: 'taxonomy', taxonomyId: owner.id },
      placeholder: draft.placeholder,
      relationId: draft.type === 'relation' ? draft.relationId || null : null,
      required: draft.required,
      taxonomyId: draft.type === 'taxonomy' ? draft.taxonomyId || null : null,
      type: draft.type,
      validation: { max: parseNullableNumber(draft.max), maxLength: parseNullableInteger(draft.maxLength), min: parseNullableNumber(draft.min), minLength: parseNullableInteger(draft.minLength), pattern: draft.pattern.trim() || null },
    })
  }

  async function saveField() {
    if (pending) return
    const parsed = buildCandidate()
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? 'Revisa la configuración del campo.'); return }
    setPending(true)
    if (selected) {
      const value = parsed.data
      const updated = await session.updateCustomField(selected.id, {
        allowedRoleIds: value.allowedRoleIds,
        calculatedExpression: value.calculatedExpression,
        childFieldIds: value.childFieldIds,
        conditions: value.conditions,
        defaultValue: value.defaultValue,
        description: value.description,
        group: value.group,
        key: value.key,
        label: value.label,
        options: value.options,
        order: value.order,
        placeholder: value.placeholder,
        relationId: value.relationId,
        required: value.required,
        taxonomyId: value.taxonomyId,
        type: value.type,
        validation: value.validation,
      })
      setMessage(updated.ok ? `${value.label} actualizado.` : updated.error)
    } else {
      const created = await session.createCustomField(parsed.data)
      if (created.ok) { setSelectedId(parsed.data.id); setDraft(draftFromField(parsed.data)); setMessage(`${parsed.data.label} creado. Ya está disponible para tus entradas y formularios.`) } else setMessage(created.error)
    }
    setPending(false)
  }

  async function removeField() {
    if (!selected || pending) return
    if (deleteArmedId !== selected.id) { setDeleteArmedId(selected.id); setMessage('Pulsa Confirmar eliminación. ElectroCMS bloqueará el borrado si este campo todavía está en uso.'); return }
    setPending(true)
    const removed = await session.deleteCustomField(selected.id)
    if (removed.ok) {
      const ownerKind: OwnerKind = contentTypes.length > 0 ? 'content-type' : 'taxonomy'
      setSelectedId(null)
      setDeleteArmedId(null)
      setAdvancedOpen(false)
      setDraft({ ...EMPTY_DRAFT, ownerKind, ownerId: ownerKind === 'content-type' ? contentTypes[0]?.id ?? '' : taxonomies[0]?.id ?? '' })
      setMessage(`${selected.label} eliminado.`)
    } else setMessage(removed.error)
    setPending(false)
  }

  function ownerName(field: FieldDefinition): string {
    const owner = field.owner
    if (owner.kind === 'content-type') return contentTypes.find((item) => item.id === owner.contentTypeId)?.pluralName ?? 'Contenido no disponible'
    return taxonomies.find((item) => item.id === owner.taxonomyId)?.pluralName ?? 'Clasificación no disponible'
  }

  return (
    <section aria-labelledby="custom-fields-title" className="grid gap-2 p-2 lg:p-1.5">
      <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="form" size={15} /></span>
          <div className="min-w-0"><div className="flex items-center gap-1"><h2 className="text-xs font-bold" id="custom-fields-title">Campos personalizados</h2><HelpTip description={help.description} example={help.example} label={help.label} reference={help.reference} /></div><p className="text-[0.625rem] leading-4 text-muted-foreground">Añade información específica a tus contenidos, como precio, teléfono, galería o relación.</p></div>
        </div>
        <Button disabled={pending || !hasOwners} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nuevo</Button>
      </div>

      {!hasOwners ? <p className="rounded-md border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">Crea primero un <strong className="text-foreground">Tipo de contenido</strong> o una <strong className="text-foreground">Clasificación</strong>. Después podrás añadirle campos.</p> : null}

      <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
        <div className="flex items-center justify-between gap-2 px-1"><strong className="text-xs">Tus campos</strong><span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{fields.length}</span></div>
        {fields.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Todavía no hay campos personalizados.</p> : <div aria-label="Campos personalizados creados" className="grid gap-1" role="listbox">{fields.map((field) => <button aria-selected={selected?.id === field.id} className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === field.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={field.id} onClick={() => selectField(field)} role="option" type="button"><span className="min-w-0"><strong className="block truncate text-xs">{field.label}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{typeLabels[field.type]}</span></span><span className="max-w-28 truncate text-[0.625rem] font-semibold text-muted-foreground">{ownerName(field)}</span></button>)}</div>}
      </div>

      <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void saveField() }}>
        <div><strong className="block text-xs">{selected ? `Editar ${selected.label}` : 'Crear campo'}</strong><span className="text-[0.625rem] text-muted-foreground">Empieza por dónde se usará, el nombre visible y el tipo de información.</span></div>

        <div className="grid gap-2 md:grid-cols-2">
          <ChoiceField disabled={Boolean(selected)} label="Usar en" onChange={(value) => setOwnerKind(value === 'taxonomy' ? 'taxonomy' : 'content-type')} options={[...(contentTypes.length ? [{ label: 'Tipos de contenido', description: 'Como Productos, Propiedades o Artículos', value: 'content-type' }] : []), ...(taxonomies.length ? [{ label: 'Clasificaciones', description: 'Como Categorías, Marcas o Ciudades', value: 'taxonomy' }] : [])]} value={draft.ownerKind} />
          <ChoiceField disabled={Boolean(selected)} label={draft.ownerKind === 'content-type' ? 'Contenido' : 'Clasificación'} onChange={(value) => patchDraft({ ownerId: value, childFieldIds: [], conditionsJson: '[]', relationId: '', taxonomyId: '' })} options={(draft.ownerKind === 'content-type' ? contentTypes : taxonomies).map((item) => ({ label: item.pluralName, value: item.id }))} value={draft.ownerId} />
          <label className="grid gap-1 text-xs font-semibold">Nombre visible<input className={inputClass} maxLength={160} onChange={(event) => { const next = event.target.value; patchDraft({ label: next, key: !draft.key || draft.key === keyFromLabel(draft.label) ? keyFromLabel(next) : draft.key }) }} placeholder="Precio" value={draft.label} /></label>
          <ChoiceField help={<HelpTip description="Define qué clase de información guardará el campo y qué control utilizará ElectroCMS para editarla." example="Número para Precio, Imagen para Portada o Contenido relacionado para conectar entradas." label="Tipo de campo" reference="ACF — Field Type · JetEngine — Meta Field Type" />} label="Tipo de información" onChange={(value) => patchDraft({ type: value as FieldType, relationId: '', taxonomyId: '', childFieldIds: [], calculatedExpression: '', optionsText: '', defaultValue: '' })} options={fieldGroups.flatMap(([group, types]) => types.map((type) => ({ description: group, label: typeLabels[type], value: type })))} value={draft.type} />
          <label className="grid gap-1 text-xs font-semibold">Texto de ayuda<input className={inputClass} maxLength={500} onChange={(event) => patchDraft({ placeholder: event.target.value })} placeholder="Ej. Introduce el precio" value={draft.placeholder} /></label>
        </div>

        <label className="grid gap-1 text-xs font-semibold">Descripción opcional<textarea className="min-h-16 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchDraft({ description: event.target.value })} value={draft.description} /></label>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 p-2"><span><strong className="block text-xs">Campo obligatorio</strong><span className="text-[0.625rem] text-muted-foreground">No permite guardar una entrada completa sin este dato.</span></span><button aria-checked={draft.required} aria-label="Campo obligatorio" className={`relative h-6 w-10 shrink-0 rounded-full border focus-visible:ring-2 focus-visible:ring-focus ${draft.required ? 'border-primary bg-primary' : 'border-border bg-muted'}`} onClick={() => patchDraft({ required: !draft.required })} role="switch" type="button"><span className={`absolute top-0.5 size-4 rounded-full bg-surface shadow transition-transform ${draft.required ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div>

        {usesOptions ? <label className="grid gap-1 text-xs font-semibold">Opciones disponibles<span className="font-normal text-muted-foreground">Una por línea. Formato: Nombre | valor. El valor puede ser texto, número o JSON.</span><textarea className="min-h-24 resize-y rounded-md border border-border bg-surface p-2 font-mono text-[0.6875rem] font-normal focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchDraft({ optionsText: event.target.value })} placeholder={'Disponible | "available"\nReservado | "reserved"'} value={draft.optionsText} /></label> : null}

        {usesChildren ? <fieldset className="grid gap-1 rounded-md border border-border p-1.5"><legend className="flex items-center gap-1 px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Campos incluidos <HelpTip description="Selecciona campos simples del mismo contenido para agruparlos o permitir varias filas." label="Campos incluidos" reference="ACF — Group/Repeater · JetEngine — Repeater" /></legend>{ownerFields.length === 0 ? <p className="p-1 text-[0.625rem] text-muted-foreground">Crea primero campos simples en el mismo contenido.</p> : ownerFields.map((field) => { const checked = draft.childFieldIds.includes(field.id); return <button aria-checked={checked} className={`flex min-h-11 items-center gap-2 rounded-md border px-2 text-xs lg:min-h-9 ${checked ? 'border-primary/40 bg-primary-soft' : 'border-border bg-surface hover:bg-muted'}`} key={field.id} onClick={() => toggleStringList('childFieldIds', field.id)} role="checkbox" type="button"><span aria-hidden="true" className={`grid size-4 place-items-center rounded border ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border'}`}>{checked ? <Icon name="check" size={11} /> : null}</span><span>{field.label}</span></button> })}</fieldset> : null}

        {draft.type === 'relation' ? <ChoiceField help={<HelpTip description="Conecta este dato con una relación existente entre tipos de contenido." example="Una Propiedad pertenece a un Agente." label="Relación" reference="JetEngine — Relations" />} label="Relación a utilizar" onChange={(value) => patchDraft({ relationId: value })} options={availableRelations.map((relation) => ({ label: relation.name, value: relation.id }))} placeholder="Selecciona una relación" value={draft.relationId} /> : null}
        {draft.type === 'relation' && availableRelations.length === 0 ? <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">No hay relaciones compatibles. Créala en <strong>Contenido → Entradas → Relaciones</strong>.</p> : null}
        {draft.type === 'taxonomy' ? <ChoiceField help={<HelpTip description="Permite elegir una categoría o etiqueta asociada al contenido." label="Clasificación" reference="WordPress / JetEngine — Taxonomy Field" />} label="Clasificación a utilizar" onChange={(value) => patchDraft({ taxonomyId: value })} options={availableTaxonomies.map((taxonomy) => ({ label: taxonomy.pluralName, value: taxonomy.id }))} placeholder="Selecciona una clasificación" value={draft.taxonomyId} /> : null}
        {draft.type === 'calculated' ? <label className="grid gap-1 text-xs font-semibold">Cálculo<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={2000} onChange={(event) => patchDraft({ calculatedExpression: event.target.value })} placeholder="price * quantity" value={draft.calculatedExpression} /><span className="font-normal text-muted-foreground">Usa las claves de otros campos para calcular el resultado.</span></label> : null}

        <div className="rounded-md border border-border bg-muted/15">
          <button aria-expanded={advancedOpen} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs font-bold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={() => setAdvancedOpen((current) => !current)} type="button"><span><span className="block">Opciones avanzadas</span><span className="block text-[0.625rem] font-normal text-muted-foreground">Clave interna, orden, valores, validación, condiciones y permisos.</span></span><Icon className={advancedOpen ? 'rotate-180' : ''} name="chevron-down" size={14} /></button>
          {advancedOpen ? <div className="grid gap-2 border-t border-border p-2">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_6rem]"><div className="grid gap-1"><div className="flex items-center gap-1"><label className="text-xs font-semibold" htmlFor="custom-field-key">Clave interna</label><HelpTip description="Identificador estable usado por datos dinámicos, exportadores y acciones. ElectroCMS lo genera desde el nombre; solo cámbialo si sabes que lo necesitas." example="precio, telefono, gallery" label="Clave interna" reference="ACF — Field Name · JetEngine — Meta Field Name/ID" /></div><input autoCapitalize="none" className={`${inputClass} font-mono`} id="custom-field-key" maxLength={160} onChange={(event) => patchDraft({ key: event.target.value })} value={draft.key} /></div><label className="grid gap-1 text-xs font-semibold">Orden<input className={inputClass} min="0" onChange={(event) => patchDraft({ order: event.target.value })} type="number" value={draft.order} /></label></div>
            <label className="grid gap-1 text-xs font-semibold">Grupo / pestaña<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ group: event.target.value })} placeholder="Información principal" value={draft.group} /></label>
            <label className="grid gap-1 text-xs font-semibold">Valor predeterminado<span className="font-normal text-muted-foreground">{numeric ? 'Introduce un número.' : draft.type === 'switch' ? 'Usa true o false.' : usesChildren || draft.type === 'checkbox' || draft.type === 'gallery' || draft.type === 'map' ? 'Puede usar JSON cuando corresponda.' : 'Se usará si no hay un valor guardado.'}</span>{usesChildren || draft.type === 'checkbox' || draft.type === 'gallery' || draft.type === 'map' ? <textarea className="min-h-16 resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchDraft({ defaultValue: event.target.value })} value={draft.defaultValue} /> : <input className={inputClass} onChange={(event) => patchDraft({ defaultValue: event.target.value })} type={numeric ? 'number' : 'text'} value={draft.defaultValue} />}</label>
            <div className="grid gap-1 rounded-md border border-border p-2"><div className="flex items-center gap-1"><strong className="text-xs">Validación</strong><HelpTip description="Limita longitudes, valores o formatos aceptados antes de guardar." label="Validación avanzada" reference="ACF — Validation · JetEngine — Field Validation" /></div><div className="grid grid-cols-2 gap-1.5"><label className="grid gap-1 text-[0.625rem] font-semibold">Longitud mínima<input className={inputClass} min="0" onChange={(event) => patchDraft({ minLength: event.target.value })} type="number" value={draft.minLength} /></label><label className="grid gap-1 text-[0.625rem] font-semibold">Longitud máxima<input className={inputClass} min="0" onChange={(event) => patchDraft({ maxLength: event.target.value })} type="number" value={draft.maxLength} /></label><label className="grid gap-1 text-[0.625rem] font-semibold">Valor mínimo<input className={inputClass} onChange={(event) => patchDraft({ min: event.target.value })} type="number" value={draft.min} /></label><label className="grid gap-1 text-[0.625rem] font-semibold">Valor máximo<input className={inputClass} onChange={(event) => patchDraft({ max: event.target.value })} type="number" value={draft.max} /></label><label className="col-span-2 grid gap-1 text-[0.625rem] font-semibold">Patrón de formato<input className={`${inputClass} font-mono`} maxLength={500} onChange={(event) => patchDraft({ pattern: event.target.value })} value={draft.pattern} /></label></div></div>
            <div className="grid gap-1"><div className="flex items-center gap-1"><strong className="text-xs">Condiciones técnicas</strong><HelpTip description="Configuración avanzada de visibilidad/uso basada en otros campos. El editor visual de condiciones se consolidará en su fase correspondiente; este JSON mantiene el contrato completo disponible sin perder funcionalidad." label="Condiciones técnicas" reference="ACF — Conditional Logic · JetEngine — Conditional Logic" /></div><textarea aria-label="Condiciones técnicas" className="min-h-24 resize-y rounded-md border border-border bg-surface p-2 font-mono text-[0.6875rem] focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchDraft({ conditionsJson: event.target.value })} value={draft.conditionsJson} /></div>
            <fieldset className="grid gap-1"><legend className="flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Quién puede verlo <HelpTip description="Restringe este campo a roles concretos. Si no seleccionas ninguno se aplica la política general del contenido." label="Visibilidad por rol" reference="WordPress — Roles & Capabilities · JetEngine" /></legend>{roles.length === 0 ? <p className="text-[0.625rem] text-muted-foreground">Todavía no hay roles personalizados.</p> : roles.map((role) => { const checked = draft.allowedRoleIds.includes(role.id); return <button aria-checked={checked} className={`flex min-h-11 items-center gap-2 rounded-md border px-2 text-xs lg:min-h-9 ${checked ? 'border-primary/40 bg-primary-soft' : 'border-border bg-surface hover:bg-muted'}`} key={role.id} onClick={() => toggleStringList('allowedRoleIds', role.id)} role="checkbox" type="button"><span aria-hidden="true" className={`grid size-4 place-items-center rounded border ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border'}`}>{checked ? <Icon name="check" size={11} /> : null}</span>{role.name}</button> })}</fieldset>
            {selected ? <p className="rounded bg-muted px-1.5 py-1 font-mono text-[0.5625rem] text-muted-foreground">ID interno: {selected.id}</p> : null}
          </div> : null}
        </div>

        <div className="flex flex-wrap justify-between gap-1"><div>{selected ? <Button disabled={pending} onClick={() => { void removeField() }} size="small" variant={deleteArmedId === selected.id ? 'destructive' : 'ghost'}>{deleteArmedId === selected.id ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div><Button disabled={pending || !hasOwners || !draft.label.trim()} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selected ? 'Guardar cambios' : 'Crear campo'}</Button></div>
        <p aria-live="polite" className="min-h-4 text-[0.625rem] leading-4 text-muted-foreground">{message}</p>
      </form>
    </section>
  )
}
