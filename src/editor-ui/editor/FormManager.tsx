import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  parseFormId,
  type CmsBackend,
  type ContentTypeId,
  type FieldDefinition,
  type Form,
  type FormId,
} from '../../domain'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import type { FormControl } from '../../domain/project/form-builder-engine'
import { Button, HelpTip, Icon, TextField } from '../primitives'
import { useEditorProjectStructure } from './editor-project-context'
import { FORM_HELP, type FeatureHelp } from './feature-help'
import { useFormSession } from './form-session-context'

type FieldType = FieldDefinition['type']

interface ChoiceOption {
  readonly description?: string
  readonly label: string
  readonly value: string
}

const fieldTypes: readonly { readonly id: FieldType; readonly label: string }[] = [
  { id: 'text', label: 'Texto corto' },
  { id: 'textarea', label: 'Texto largo' },
  { id: 'rich-text', label: 'Texto enriquecido' },
  { id: 'number', label: 'Número' },
  { id: 'currency', label: 'Moneda' },
  { id: 'email', label: 'Correo electrónico' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'url', label: 'Enlace / URL' },
  { id: 'date', label: 'Fecha' },
  { id: 'time', label: 'Hora' },
  { id: 'datetime', label: 'Fecha y hora' },
  { id: 'color', label: 'Color' },
  { id: 'select', label: 'Lista de opciones' },
  { id: 'radio', label: 'Una opción' },
  { id: 'checkbox', label: 'Casillas de selección' },
  { id: 'switch', label: 'Interruptor' },
  { id: 'image', label: 'Imagen' },
  { id: 'gallery', label: 'Galería' },
  { id: 'file', label: 'Archivo' },
  { id: 'map', label: 'Ubicación / mapa' },
  { id: 'relation', label: 'Contenido relacionado' },
  { id: 'user', label: 'Usuario' },
  { id: 'taxonomy', label: 'Clasificación' },
  { id: 'repeater', label: 'Lista repetible' },
  { id: 'group', label: 'Grupo de campos' },
  { id: 'calculated', label: 'Valor calculado' },
  { id: 'conditional', label: 'Campo condicional' },
]

function lexicalCompare(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1
}

function typeLabel(type: FieldType): string {
  return fieldTypes.find((option) => option.id === type)?.label ?? type
}

function fieldType(value: string): FieldType {
  return fieldTypes.find((option) => option.id === value)?.id ?? 'text'
}

function compatibleFields(cms: CmsBackend, contentTypeId: ContentTypeId | null, type: FieldType): readonly FieldDefinition[] {
  if (!contentTypeId) return []
  return (cms.contentTypes[contentTypeId]?.fieldIds ?? [])
    .flatMap((fieldId) => cms.fields[fieldId] ? [cms.fields[fieldId]] : [])
    .filter((field) => field.owner.kind === 'content-type' && field.owner.contentTypeId === contentTypeId && field.type === type)
    .sort((left, right) => left.order - right.order || lexicalCompare(left.label, right.label))
}

function keyFromLabel(label: string, fallback = 'field'): string {
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_.-]+/g, '_')
    .replace(/^[_\d.-]+/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return normalized || fallback
}

function ChoiceMenu({
  label,
  onChange,
  options,
  value,
  disabled = false,
  placeholder = 'Seleccionar',
  help,
}: {
  readonly disabled?: boolean
  readonly help?: FeatureHelp
  readonly label: string
  readonly onChange: (value: string) => void
  readonly options: readonly ChoiceOption[]
  readonly placeholder?: string
  readonly value: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
    if ((event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className="relative grid min-w-0 gap-1">
      <div className="flex min-h-8 items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold leading-4 text-muted-foreground">{label}</span>
        {help ? <HelpTip description={help.description} example={help.example} label={help.label} reference={help.reference} /> : null}
      </div>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 text-left text-sm text-foreground outline-none transition-colors hover:border-primary/35 hover:bg-muted/40 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 lg:min-h-8 lg:px-2 lg:text-xs"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <Icon className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} name="chevron-down" size={13} />
      </button>
      {open ? (
        <div aria-label={label} className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-1 shadow-xl" role="listbox">
          {options.length > 0 ? options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 ${option.value === value ? 'bg-primary-soft text-primary-strong' : 'text-foreground'}`}
              key={option.value || '__empty'}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              role="option"
              type="button"
            >
              <span className="min-w-0 flex-1">
                <strong className="block truncate font-semibold">{option.label}</strong>
                {option.description ? <span className="block truncate text-[0.625rem] font-normal text-muted-foreground">{option.description}</span> : null}
              </span>
              {option.value === value ? <Icon name="check" size={13} /> : null}
            </button>
          )) : <p className="px-2 py-3 text-xs text-muted-foreground">No hay opciones compatibles.</p>}
        </div>
      ) : null}
    </div>
  )
}

function StatusMessage({ kind, children }: { readonly kind: 'error' | 'success'; readonly children: ReactNode }) {
  return (
    <div className={`rounded-md border px-2.5 py-2 text-xs ${kind === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary-soft text-primary-strong'}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

function AdvancedOptions({ open, onToggle, children, label = 'Opciones avanzadas' }: {
  readonly children: ReactNode
  readonly label?: string
  readonly onToggle: () => void
  readonly open: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-muted/15">
      <button aria-expanded={open} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs font-bold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={onToggle} type="button">
        <span><span className="block">{label}</span><span className="block text-[0.625rem] font-normal text-muted-foreground">Normalmente no necesitas cambiar esto.</span></span>
        <Icon className={open ? 'rotate-180' : ''} name="chevron-down" size={14} />
      </button>
      {open ? <div className="grid gap-2 border-t border-border p-2">{children}</div> : null}
    </div>
  )
}

function InternalKeyField({ value, onChange }: { readonly onChange: (value: string) => void; readonly value: string }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-muted-foreground">Clave interna</span>
        <HelpTip description={FORM_HELP.fieldKey.description} example={FORM_HELP.fieldKey.example} label={FORM_HELP.fieldKey.label} reference={FORM_HELP.fieldKey.reference} />
      </div>
      <TextField hint="Letras, números, punto, guion o guion bajo. Debe empezar por una letra." label="Identificador" onChange={(event) => onChange(event.target.value)} required value={value} />
    </div>
  )
}

function RequiredFieldToggle({ checked, onChange }: { readonly checked: boolean; readonly onChange: (checked: boolean) => void }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/20 px-2 lg:min-h-9">
      <button
        aria-checked={checked}
        aria-label="Campo obligatorio"
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md focus-visible:ring-2 focus-visible:ring-focus lg:h-8 lg:w-11"
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span aria-hidden="true" className={`relative block h-6 w-11 rounded-full border transition-colors ${checked ? 'border-primary bg-primary' : 'border-border bg-surface'}`}>
          <span className={`absolute top-0.5 grid size-5 place-items-center rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[1.15rem] text-primary' : 'translate-x-0.5 text-muted-foreground'}`}>
            {checked ? <Icon name="check" size={11} /> : null}
          </span>
        </span>
      </button>
      <span className="min-w-0 flex-1">
        <strong className="block text-xs text-foreground">Campo obligatorio</strong>
        <span className="form-manager-responsive-copy block text-[0.625rem] leading-4 text-muted-foreground">Debe completarse antes de enviar.</span>
      </span>
      <HelpTip description={FORM_HELP.required.description} example={FORM_HELP.required.example} label={FORM_HELP.required.label} reference={FORM_HELP.required.reference} />
    </div>
  )
}

function CreationPanel({ cms, onCreated }: { readonly cms: CmsBackend; readonly onCreated: (formId: FormId) => void }) {
  const forms = useFormSession()
  const contentTypes = useMemo(() => Object.values(cms.contentTypes).sort((left, right) => left.order - right.order || lexicalCompare(left.pluralName, right.pluralName)), [cms])
  const [name, setName] = useState('Nuevo formulario')
  const [contentTypeId, setContentTypeId] = useState<ContentTypeId | null>(contentTypes[0]?.id ?? null)
  const [controlType, setControlType] = useState<FieldType>('text')
  const [controlLabel, setControlLabel] = useState('Nombre')
  const [controlName, setControlName] = useState('name')
  const [required, setRequired] = useState(false)
  const [mappedFieldId, setMappedFieldId] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const matchingFields = compatibleFields(cms, contentTypeId, controlType)

  async function create() {
    if (!name.trim()) {
      setNotice({ kind: 'error', text: 'Escribe un nombre para el formulario.' })
      return
    }
    if (!controlLabel.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(controlName.trim())) {
      setNotice({ kind: 'error', text: 'Revisa el nombre del primer campo. La clave interna debe empezar por una letra.' })
      return
    }
    const id = parseFormId(crypto.randomUUID())
    const controlId = crypto.randomUUID()
    const stepId = crypto.randomUUID()
    const mapped = matchingFields.find((field) => field.id === mappedFieldId)?.id ?? null
    const form: Form = {
      actions: [],
      contentTypeId,
      controls: {
        [controlId]: {
          conditions: [],
          id: controlId,
          label: controlLabel.trim(),
          mappedFieldId: mapped,
          name: controlName.trim(),
          required,
          type: controlType,
        },
      },
      csrfProtection: true,
      draftSaving: false,
      errorMessage: 'Revisa los campos e inténtalo de nuevo.',
      id,
      name: name.trim(),
      steps: [{ controlIds: [controlId], id: stepId, name: 'Campos' }],
      successMessage: 'Formulario guardado.',
    }
    setPending(true)
    const result = await forms.createForm(form)
    setPending(false)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error })
      return
    }
    setNotice({ kind: 'success', text: `${form.name} creado.` })
    onCreated(id)
  }

  return (
    <section aria-labelledby="new-form-heading" className="grid gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="form" size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h2 className="text-sm font-bold text-foreground" id="new-form-heading">Crear formulario</h2>
            <HelpTip description="Crea los campos que verá la persona y, si quieres, conecta cada respuesta con datos de tu contenido." example="Formulario de contacto, registro, solicitud o edición de contenido." label="Constructor de formularios" reference="JetFormBuilder · Elementor Forms" />
          </div>
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">Empieza por el nombre y el primer campo. Puedes añadir y ordenar más campos después.</p>
        </div>
      </div>

      {notice ? <StatusMessage kind={notice.kind}>{notice.text}</StatusMessage> : null}
      {contentTypes.length === 0 ? <StatusMessage kind="error">Crea primero un tipo de contenido en Contenido → Tipos para habilitar el guardado de respuestas.</StatusMessage> : null}

      <div className="grid gap-2 md:grid-cols-2">
        <TextField label="Nombre del formulario" onChange={(event) => setName(event.target.value)} required value={name} />
        <ChoiceMenu
          help={FORM_HELP.contentType}
          label="Guardar respuestas en"
          onChange={(value) => {
            const next = contentTypes.find((type) => type.id === value)?.id ?? null
            setContentTypeId(next)
            setMappedFieldId('')
          }}
          options={contentTypes.map((type) => ({ label: type.pluralName, description: type.description || 'Contenido disponible', value: type.id }))}
          value={contentTypeId ?? ''}
        />
        <ChoiceMenu
          help={FORM_HELP.fieldType}
          label="Tipo del primer campo"
          onChange={(value) => {
            setControlType(fieldType(value))
            setMappedFieldId('')
          }}
          options={fieldTypes.map((type) => ({ label: type.label, value: type.id }))}
          value={controlType}
        />
        <ChoiceMenu
          help={FORM_HELP.mappedField}
          label="Guardar su valor en"
          onChange={setMappedFieldId}
          options={[{ label: 'No guardar en un campo', value: '' }, ...matchingFields.map((field) => ({ label: field.label, description: typeLabel(field.type), value: field.id }))]}
          value={mappedFieldId}
        />
        <TextField label="Texto que verá el usuario" onChange={(event) => {
          const next = event.target.value
          setControlLabel(next)
          if (!controlName || controlName === keyFromLabel(controlLabel, 'field')) setControlName(keyFromLabel(next, 'field'))
        }} required value={controlLabel} />
        <RequiredFieldToggle checked={required} onChange={setRequired} />
      </div>

      <AdvancedOptions onToggle={() => setAdvancedOpen((current) => !current)} open={advancedOpen}>
        <InternalKeyField onChange={setControlName} value={controlName} />
      </AdvancedOptions>

      <div className="flex justify-end">
        <Button disabled={contentTypes.length === 0} isLoading={pending} loadingLabel="Creando" onClick={() => { void create() }}>
          <Icon name="plus" size={13} /> Crear formulario
        </Button>
      </div>
    </section>
  )
}

function ControlEditor({ cms, form, control, onDeleted }: {
  readonly cms: CmsBackend
  readonly control: FormControl
  readonly form: Form
  readonly onDeleted: () => void
}) {
  const forms = useFormSession()
  const [label, setLabel] = useState(control.label)
  const [name, setName] = useState(control.name)
  const [type, setType] = useState<FieldType>(control.type)
  const [mappedFieldId, setMappedFieldId] = useState(control.mappedFieldId ?? '')
  const [required, setRequired] = useState(control.required)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const matchingFields = compatibleFields(cms, form.contentTypeId, type)

  async function save() {
    if (!label.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(name.trim())) {
      setNotice({ kind: 'error', text: 'Revisa el nombre del campo y su clave interna.' })
      return
    }
    setPending(true)
    const result = await forms.updateFormControl(form.id, control.id, {
      label: label.trim(),
      mappedFieldId: matchingFields.find((field) => field.id === mappedFieldId)?.id ?? null,
      name: name.trim(),
      required,
      type,
    })
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: 'Campo actualizado.' } : { kind: 'error', text: result.error })
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setPending(true)
    const result = await forms.removeFormControl(form.id, control.id)
    setPending(false)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error })
      setConfirmDelete(false)
      return
    }
    onDeleted()
  }

  return (
    <section aria-labelledby={`control-editor-${control.id}`} className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-primary"><Icon name="settings" size={14} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-bold text-foreground" id={`control-editor-${control.id}`}>Editar campo · {control.label}</h3>
          <p className="text-[0.625rem] text-muted-foreground">{typeLabel(control.type)}</p>
        </div>
      </div>
      {notice ? <StatusMessage kind={notice.kind}>{notice.text}</StatusMessage> : null}
      <div className="grid gap-2 md:grid-cols-2">
        <TextField label="Texto que verá el usuario" onChange={(event) => setLabel(event.target.value)} required value={label} />
        <ChoiceMenu
          help={FORM_HELP.fieldType}
          label="Tipo de campo"
          onChange={(value) => {
            const next = fieldType(value)
            setType(next)
            if (!compatibleFields(cms, form.contentTypeId, next).some((field) => field.id === mappedFieldId)) setMappedFieldId('')
          }}
          options={fieldTypes.map((option) => ({ label: option.label, value: option.id }))}
          value={type}
        />
        <ChoiceMenu
          help={FORM_HELP.mappedField}
          label="Guardar su valor en"
          onChange={setMappedFieldId}
          options={[{ label: 'No guardar en un campo', value: '' }, ...matchingFields.map((field) => ({ label: field.label, description: typeLabel(field.type), value: field.id }))]}
          value={mappedFieldId}
        />
        <RequiredFieldToggle checked={required} onChange={setRequired} />
      </div>
      <AdvancedOptions onToggle={() => setAdvancedOpen((current) => !current)} open={advancedOpen}>
        <InternalKeyField onChange={setName} value={name} />
      </AdvancedOptions>
      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
        <Button disabled={pending || Object.keys(form.controls).length <= 1} onClick={() => { void remove() }} size="small" variant={confirmDelete ? 'destructive' : 'ghost'}>
          <Icon name="close" size={12} /> {confirmDelete ? 'Confirmar eliminación' : 'Eliminar campo'}
        </Button>
        <Button isLoading={pending} loadingLabel="Guardando" onClick={() => { void save() }} size="small"><Icon name="check" size={12} /> Guardar cambios</Button>
      </div>
    </section>
  )
}

interface SortableControlRowProps {
  readonly control: FormControl
  readonly field?: FieldDefinition
  readonly index: number
  readonly length: number
  readonly pending: boolean
  readonly selected: boolean
  readonly onMove: (controlId: string, target: number) => void
  readonly onSelect: (controlId: string) => void
}

function SortableControlRow({ control, field, index, length, pending, selected, onMove, onSelect }: SortableControlRowProps) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({ disabled: pending, id: control.id })

  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1 rounded-md border p-1 ${selected ? 'border-primary/40 bg-primary-soft/60' : 'border-border bg-surface'} ${isDragging ? 'z-10 opacity-60 shadow-lg' : ''}`}
      ref={setNodeRef}
      role="listitem"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        aria-label={`Arrastrar ${control.label} para cambiar su orden`}
        className="grid size-11 shrink-0 touch-none cursor-grab place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing lg:size-8"
        disabled={pending}
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
      >
        <Icon name="more" size={13} />
      </button>
      <button aria-current={selected ? 'true' : undefined} className="min-h-11 min-w-0 rounded-md px-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8" onClick={() => onSelect(control.id)} type="button">
        <strong className="block truncate text-xs text-foreground">{index + 1}. {control.label}</strong>
        <span className="block truncate text-[0.625rem] text-muted-foreground">{typeLabel(control.type)} · {field ? `Guarda en ${field.label}` : 'No conectado a contenido'}</span>
      </button>
      <Button aria-label={`Mover arriba ${control.label}`} disabled={pending || index === 0} onClick={() => onMove(control.id, index - 1)} size="icon" variant="ghost"><span aria-hidden="true" className="rotate-180"><Icon name="chevron-down" size={13} /></span></Button>
      <Button aria-label={`Mover abajo ${control.label}`} disabled={pending || index === length - 1} onClick={() => onMove(control.id, index + 1)} size="icon" variant="ghost"><Icon name="chevron-down" size={13} /></Button>
    </div>
  )
}

function FormWorkspace({ cms, form, onDeleted }: { readonly cms: CmsBackend; readonly form: Form; readonly onDeleted: () => void }) {
  const forms = useFormSession()
  const contentTypes = useMemo(() => Object.values(cms.contentTypes).sort((left, right) => left.order - right.order || lexicalCompare(left.pluralName, right.pluralName)), [cms])
  const orderedControlIds = form.steps[0]?.controlIds ?? []
  const [selectedControlId, setSelectedControlId] = useState(orderedControlIds[0] ?? '')
  const [formName, setFormName] = useState(form.name)
  const [contentTypeId, setContentTypeId] = useState<ContentTypeId | null>(form.contentTypeId)
  const [addType, setAddType] = useState<FieldType>('text')
  const [addLabel, setAddLabel] = useState('Nuevo campo')
  const [addName, setAddName] = useState(`field_${Object.keys(form.controls).length + 1}`)
  const [addMappedFieldId, setAddMappedFieldId] = useState('')
  const [addRequired, setAddRequired] = useState(false)
  const [addAdvancedOpen, setAddAdvancedOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const selectedControl = form.controls[selectedControlId] ?? form.controls[orderedControlIds[0] ?? '']
  const addFields = compatibleFields(cms, form.contentTypeId, addType)
  const firstStep = form.steps[0]
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function saveForm() {
    setPending(true)
    const result = await forms.updateForm(form.id, { contentTypeId, name: formName.trim() })
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: 'Formulario actualizado.' } : { kind: 'error', text: result.error })
  }

  async function addControl() {
    if (!firstStep) return
    if (!addLabel.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(addName.trim())) {
      setNotice({ kind: 'error', text: 'El nuevo campo necesita un nombre visible y una clave interna válida.' })
      return
    }
    const controlId = crypto.randomUUID()
    const control: FormControl = {
      conditions: [],
      id: controlId,
      label: addLabel.trim(),
      mappedFieldId: addFields.find((field) => field.id === addMappedFieldId)?.id ?? null,
      name: addName.trim(),
      required: addRequired,
      type: addType,
    }
    setPending(true)
    const result = await forms.addFormControl(form.id, firstStep.id, control)
    setPending(false)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error })
      return
    }
    setSelectedControlId(controlId)
    setAddLabel('Nuevo campo')
    setAddName(`field_${Object.keys(form.controls).length + 2}`)
    setAddMappedFieldId('')
    setAddRequired(false)
    setNotice({ kind: 'success', text: `${control.label} añadido al formulario.` })
  }

  async function move(controlId: string, target: number) {
    setPending(true)
    const result = await forms.reorderFormControl(form.id, controlId, target)
    setPending(false)
    if (!result.ok) setNotice({ kind: 'error', text: result.error })
  }

  function handleDragEnd(event: DragEndEvent): void {
    if (!event.over || event.active.id === event.over.id) return
    const target = orderedControlIds.indexOf(String(event.over.id))
    if (target >= 0) void move(String(event.active.id), target)
  }

  async function deleteForm() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setPending(true)
    const result = await forms.deleteForm(form.id)
    setPending(false)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error })
      setConfirmDelete(false)
      return
    }
    onDeleted()
  }

  return (
    <div className="grid gap-2">
      <section className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="form" size={14} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-foreground">{form.name}</h2>
            <p className="form-manager-responsive-copy text-[0.625rem] text-muted-foreground">{Object.keys(form.controls).length} campos · edición visual</p>
          </div>
          <Button disabled={pending} onClick={() => { void deleteForm() }} size="small" variant={confirmDelete ? 'destructive' : 'ghost'}>
            {confirmDelete ? 'Confirmar borrar' : 'Borrar'}
          </Button>
        </div>
        {notice ? <StatusMessage kind={notice.kind}>{notice.text}</StatusMessage> : null}
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)_auto] md:items-end">
          <TextField label="Nombre" onChange={(event) => setFormName(event.target.value)} value={formName} />
          <ChoiceMenu
            help={FORM_HELP.contentType}
            label="Guardar respuestas en"
            onChange={(value) => setContentTypeId(contentTypes.find((type) => type.id === value)?.id ?? null)}
            options={contentTypes.map((type) => ({ label: type.pluralName, description: type.description || 'Contenido disponible', value: type.id }))}
            value={contentTypeId ?? ''}
          />
          <Button isLoading={pending} loadingLabel="Guardando" onClick={() => { void saveForm() }} size="small"><Icon name="check" size={12} /> Guardar</Button>
        </div>
      </section>

      <section aria-labelledby="form-layout-heading" className="grid gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-xs font-bold text-foreground" id="form-layout-heading">Campos y orden</h3>
              <HelpTip description={FORM_HELP.order.description} label={FORM_HELP.order.label} reference={FORM_HELP.order.reference} />
            </div>
            <p className="form-manager-responsive-copy text-[0.625rem] text-muted-foreground">Selecciona un campo para editarlo. Reordénalo arrastrando o con los botones; funciona con ratón, teclado y touch.</p>
          </div>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-[0.625rem] font-semibold text-muted-foreground">{orderedControlIds.length} campos</span>
        </div>
        <DndContext
          accessibility={{
            announcements: {
              onDragCancel: () => 'Cambio de orden cancelado.',
              onDragEnd: ({ active, over }) => over ? `${form.controls[String(active.id)]?.label ?? 'Campo'} reordenado.` : 'Cambio de orden cancelado.',
              onDragOver: ({ over }) => over ? `Posición ${orderedControlIds.indexOf(String(over.id)) + 1}.` : 'Sin destino.',
              onDragStart: ({ active }) => `Moviendo ${form.controls[String(active.id)]?.label ?? 'campo'}.`,
            },
          }}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext items={orderedControlIds} strategy={verticalListSortingStrategy}>
            <div className="grid gap-1" role="list">
              {orderedControlIds.map((controlId, index) => {
                const control = form.controls[controlId]
                if (!control) return null
                return (
                  <SortableControlRow
                    control={control}
                    field={control.mappedFieldId ? cms.fields[control.mappedFieldId] : undefined}
                    index={index}
                    key={control.id}
                    length={orderedControlIds.length}
                    onMove={(id, target) => { void move(id, target) }}
                    onSelect={setSelectedControlId}
                    pending={pending}
                    selected={selectedControl?.id === control.id}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section aria-labelledby="add-control-heading" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
        <div>
          <h3 className="text-xs font-bold text-foreground" id="add-control-heading">Añadir campo</h3>
          <p className="form-manager-responsive-copy text-[0.625rem] text-muted-foreground">Elige qué pedir al usuario. Si lo conectas a contenido, solo aparecen destinos compatibles.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <ChoiceMenu help={FORM_HELP.fieldType} label="Tipo de campo" onChange={(value) => { setAddType(fieldType(value)); setAddMappedFieldId('') }} options={fieldTypes.map((option) => ({ label: option.label, value: option.id }))} value={addType} />
          <ChoiceMenu help={FORM_HELP.mappedField} label="Guardar su valor en" onChange={setAddMappedFieldId} options={[{ label: 'No guardar en un campo', value: '' }, ...addFields.map((field) => ({ label: field.label, description: typeLabel(field.type), value: field.id }))]} value={addMappedFieldId} />
          <TextField label="Texto que verá el usuario" onChange={(event) => { const next = event.target.value; setAddLabel(next); setAddName(keyFromLabel(next, 'field')) }} value={addLabel} />
          <RequiredFieldToggle checked={addRequired} onChange={setAddRequired} />
        </div>
        <AdvancedOptions label="Opciones avanzadas del campo" onToggle={() => setAddAdvancedOpen((current) => !current)} open={addAdvancedOpen}>
          <InternalKeyField onChange={setAddName} value={addName} />
        </AdvancedOptions>
        <div className="flex justify-end"><Button disabled={pending || !firstStep} onClick={() => { void addControl() }} size="small"><Icon name="plus" size={12} /> Añadir al formulario</Button></div>
      </section>

      {selectedControl ? <ControlEditor cms={cms} control={selectedControl} form={form} key={selectedControl.id} onDeleted={() => {
        const remaining = orderedControlIds.filter((id) => id !== selectedControl.id)
        setSelectedControlId(remaining[0] ?? '')
      }} /> : null}
    </div>
  )
}

export function FormManager() {
  const structure = useEditorProjectStructure()
  const cms = projectCmsBackend(structure.cms)
  const forms = useMemo(() => Object.values(cms.forms).sort((left, right) => lexicalCompare(left.name, right.name)), [cms.forms])
  const [activeFormId, setActiveFormId] = useState<FormId | null>(forms[0]?.id ?? null)
  const activeForm = forms.find((form) => form.id === activeFormId) ?? forms[0] ?? null
  const [creating, setCreating] = useState(forms.length === 0)

  return (
    <div className="form-manager grid min-h-full gap-2 p-2 lg:grid-cols-[14rem_minmax(0,1fr)] lg:p-3">
      <aside aria-label="Formularios guardados" className="form-manager-sidebar grid content-start gap-2 rounded-lg border border-border bg-muted/20 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <strong className="block text-xs text-foreground">Formularios</strong>
              <HelpTip description="Crea y administra formularios que pueden guardar respuestas en el contenido del proyecto." label="Formularios" reference="JetFormBuilder · Elementor Forms" />
            </div>
            <span className="text-[0.625rem] text-muted-foreground">{forms.length} guardados</span>
          </div>
          <Button aria-label="Nuevo formulario" onClick={() => setCreating(true)} size="icon" variant="secondary"><Icon name="plus" size={13} /></Button>
        </div>
        <div className="grid gap-1" role="list">
          {forms.map((form) => (
            <button
              aria-current={activeForm?.id === form.id ? 'page' : undefined}
              className={`min-h-11 rounded-md border px-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 ${activeForm?.id === form.id && !creating ? 'border-primary/30 bg-primary-soft text-primary-strong' : 'border-transparent bg-surface text-foreground hover:border-border hover:bg-muted'}`}
              key={form.id}
              onClick={() => { setActiveFormId(form.id); setCreating(false) }}
              role="listitem"
              type="button"
            >
              <strong className="block truncate text-xs">{form.name}</strong>
              <span className="block truncate text-[0.625rem] text-muted-foreground">{Object.keys(form.controls).length} campos</span>
            </button>
          ))}
          {forms.length === 0 ? <p className="rounded-md border border-dashed border-border bg-surface px-2 py-3 text-xs text-muted-foreground">Todavía no hay formularios.</p> : null}
        </div>
      </aside>

      <main className="min-w-0">
        {creating || !activeForm ? (
          <CreationPanel cms={cms} onCreated={(formId) => { setActiveFormId(formId); setCreating(false) }} />
        ) : (
          <FormWorkspace cms={cms} form={activeForm} key={activeForm.id} onDeleted={() => {
            const next = forms.find((form) => form.id !== activeForm.id)
            setActiveFormId(next?.id ?? null)
            setCreating(!next)
          }} />
        )}
      </main>
    </div>
  )
}
