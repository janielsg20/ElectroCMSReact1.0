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
import { Button, Icon, TextField } from '../primitives'
import { useEditorProjectStructure } from './editor-project-context'
import { useFormSession } from './form-session-context'

type FieldType = FieldDefinition['type']

interface ChoiceOption {
  readonly description?: string
  readonly label: string
  readonly value: string
}

const fieldTypes: readonly { readonly id: FieldType; readonly label: string }[] = [
  { id: 'text', label: 'Texto' },
  { id: 'textarea', label: 'Textarea' },
  { id: 'rich-text', label: 'Rich text' },
  { id: 'number', label: 'Número' },
  { id: 'currency', label: 'Moneda' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'url', label: 'URL' },
  { id: 'date', label: 'Fecha' },
  { id: 'time', label: 'Hora' },
  { id: 'datetime', label: 'Fecha y hora' },
  { id: 'color', label: 'Color' },
  { id: 'select', label: 'Selector' },
  { id: 'radio', label: 'Radio' },
  { id: 'checkbox', label: 'Checkbox' },
  { id: 'switch', label: 'Switch' },
  { id: 'image', label: 'Imagen' },
  { id: 'gallery', label: 'Galería' },
  { id: 'file', label: 'Archivo' },
  { id: 'map', label: 'Mapa' },
  { id: 'relation', label: 'Relación' },
  { id: 'user', label: 'Usuario' },
  { id: 'taxonomy', label: 'Taxonomía' },
  { id: 'repeater', label: 'Repeater' },
  { id: 'group', label: 'Grupo' },
  { id: 'calculated', label: 'Calculado' },
  { id: 'conditional', label: 'Condicional' },
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
}: {
  readonly disabled?: boolean
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
      <span className="text-xs font-semibold leading-4 text-muted-foreground">{label}</span>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
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
        <div
          aria-label={label}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-1 shadow-xl"
          role="listbox"
        >
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
    <div
      className={`rounded-md border px-2.5 py-2 text-xs ${kind === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary-soft text-primary-strong'}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
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
  const [mappedFieldId, setMappedFieldId] = useState('')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const matchingFields = compatibleFields(cms, contentTypeId, controlType)

  async function create() {
    if (!name.trim()) {
      setNotice({ kind: 'error', text: 'Escribe un nombre para el formulario.' })
      return
    }
    if (!controlLabel.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(controlName.trim())) {
      setNotice({ kind: 'error', text: 'El primer control necesita una etiqueta y una clave válida que empiece por una letra.' })
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
          required: false,
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
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground" id="new-form-heading">Crear formulario</h2>
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">M11.1 crea un layout lineal canónico. Pasos, validación condicional y acciones se activarán en sus microfases correspondientes.</p>
        </div>
      </div>

      {notice ? <StatusMessage kind={notice.kind}>{notice.text}</StatusMessage> : null}
      {contentTypes.length === 0 ? <StatusMessage kind="error">Crea primero un tipo de contenido en Contenido → Tipos. También puedes crear un formulario sin mapping cuando exista al menos un CPT.</StatusMessage> : null}

      <div className="grid gap-2 md:grid-cols-2">
        <TextField label="Nombre del formulario" onChange={(event) => setName(event.target.value)} required value={name} />
        <ChoiceMenu
          label="Tipo de contenido"
          onChange={(value) => {
            const next = cms.contentTypes[value]?.id ?? null
            setContentTypeId(next)
            setMappedFieldId('')
          }}
          options={contentTypes.map((type) => ({ label: type.pluralName, description: type.slug, value: type.id }))}
          value={contentTypeId ?? ''}
        />
        <ChoiceMenu
          label="Tipo del primer control"
          onChange={(value) => {
            setControlType(fieldType(value))
            setMappedFieldId('')
          }}
          options={fieldTypes.map((type) => ({ label: type.label, value: type.id }))}
          value={controlType}
        />
        <ChoiceMenu
          label="Mapear a Custom Field"
          onChange={setMappedFieldId}
          options={[{ label: 'Sin mapear', value: '' }, ...matchingFields.map((field) => ({ label: field.label, description: field.key, value: field.id }))]}
          value={mappedFieldId}
        />
        <TextField label="Etiqueta del control" onChange={(event) => {
          const next = event.target.value
          setControlLabel(next)
          if (!controlName || controlName === keyFromLabel(controlLabel, 'field')) setControlName(keyFromLabel(next, 'field'))
        }} required value={controlLabel} />
        <TextField hint="Letras, números, punto, guion o guion bajo. Debe empezar por una letra." label="Clave del control" onChange={(event) => setControlName(event.target.value)} required value={controlName} />
      </div>

      <div className="flex justify-end">
        <Button disabled={contentTypes.length === 0} isLoading={pending} loadingLabel="Creando" onClick={create}>
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
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const matchingFields = compatibleFields(cms, form.contentTypeId, type)

  async function save() {
    if (!label.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(name.trim())) {
      setNotice({ kind: 'error', text: 'Etiqueta y clave no son válidas.' })
      return
    }
    setPending(true)
    const result = await forms.updateFormControl(form.id, control.id, {
      label: label.trim(),
      mappedFieldId: matchingFields.find((field) => field.id === mappedFieldId)?.id ?? null,
      name: name.trim(),
      type,
    })
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: 'Control actualizado.' } : { kind: 'error', text: result.error })
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
          <h3 className="truncate text-xs font-bold text-foreground" id={`control-editor-${control.id}`}>Editar · {control.label}</h3>
          <p className="text-[0.625rem] text-muted-foreground">{typeLabel(control.type)} · {control.name}</p>
        </div>
      </div>
      {notice ? <StatusMessage kind={notice.kind}>{notice.text}</StatusMessage> : null}
      <div className="grid gap-2 md:grid-cols-2">
        <TextField label="Etiqueta" onChange={(event) => setLabel(event.target.value)} required value={label} />
        <TextField label="Clave" onChange={(event) => setName(event.target.value)} required value={name} />
        <ChoiceMenu
          label="Tipo de control"
          onChange={(value) => {
            const next = fieldType(value)
            setType(next)
            if (!compatibleFields(cms, form.contentTypeId, next).some((field) => field.id === mappedFieldId)) setMappedFieldId('')
          }}
          options={fieldTypes.map((option) => ({ label: option.label, value: option.id }))}
          value={type}
        />
        <ChoiceMenu
          label="Mapear a Custom Field"
          onChange={setMappedFieldId}
          options={[{ label: 'Sin mapear', value: '' }, ...matchingFields.map((field) => ({ label: field.label, description: field.key, value: field.id }))]}
          value={mappedFieldId}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
        <Button disabled={pending || Object.keys(form.controls).length <= 1} onClick={remove} size="small" variant={confirmDelete ? 'destructive' : 'ghost'}>
          <Icon name="close" size={12} /> {confirmDelete ? 'Confirmar eliminación' : 'Eliminar control'}
        </Button>
        <Button isLoading={pending} loadingLabel="Guardando" onClick={save} size="small"><Icon name="check" size={12} /> Guardar control</Button>
      </div>
    </section>
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
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const selectedControl = form.controls[selectedControlId] ?? form.controls[orderedControlIds[0] ?? '']
  const addFields = compatibleFields(cms, form.contentTypeId, addType)
  const firstStep = form.steps[0]

  async function saveForm() {
    setPending(true)
    const result = await forms.updateForm(form.id, { contentTypeId, name: formName.trim() })
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: 'Formulario actualizado.' } : { kind: 'error', text: result.error })
  }

  async function addControl() {
    if (!firstStep) return
    if (!addLabel.trim() || !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(addName.trim())) {
      setNotice({ kind: 'error', text: 'El nuevo control necesita una etiqueta y una clave válida.' })
      return
    }
    const controlId = crypto.randomUUID()
    const control: FormControl = {
      conditions: [],
      id: controlId,
      label: addLabel.trim(),
      mappedFieldId: addFields.find((field) => field.id === addMappedFieldId)?.id ?? null,
      name: addName.trim(),
      required: false,
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
    setNotice({ kind: 'success', text: `${control.label} añadido al layout.` })
  }

  async function move(controlId: string, target: number) {
    setPending(true)
    const result = await forms.reorderFormControl(form.id, controlId, target)
    setPending(false)
    if (!result.ok) setNotice({ kind: 'error', text: result.error })
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
            <p className="text-[0.625rem] text-muted-foreground">{Object.keys(form.controls).length} controles · layout lineal canónico</p>
          </div>
          <Button disabled={pending} onClick={deleteForm} size="small" variant={confirmDelete ? 'destructive' : 'ghost'}>
            {confirmDelete ? 'Confirmar borrar' : 'Borrar'}
          </Button>
        </div>
        {notice ? <StatusMessage kind={notice.kind}>{notice.text}</StatusMessage> : null}
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)_auto] md:items-end">
          <TextField label="Nombre" onChange={(event) => setFormName(event.target.value)} value={formName} />
          <ChoiceMenu
            label="Tipo de contenido"
            onChange={(value) => setContentTypeId(cms.contentTypes[value]?.id ?? null)}
            options={contentTypes.map((type) => ({ label: type.pluralName, description: type.slug, value: type.id }))}
            value={contentTypeId ?? ''}
          />
          <Button isLoading={pending} loadingLabel="Guardando" onClick={saveForm} size="small"><Icon name="check" size={12} /> Guardar</Button>
        </div>
      </section>

      <section aria-labelledby="form-layout-heading" className="grid gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-foreground" id="form-layout-heading">Layout y orden</h3>
            <p className="text-[0.625rem] text-muted-foreground">Mover arriba/abajo funciona con ratón, teclado y touch sin depender de drag.</p>
          </div>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-[0.625rem] font-semibold text-muted-foreground">Paso único · M11.1</span>
        </div>
        <div className="grid gap-1" role="list">
          {orderedControlIds.map((controlId, index) => {
            const control = form.controls[controlId]
            if (!control) return null
            const field = control.mappedFieldId ? cms.fields[control.mappedFieldId] : undefined
            const selected = selectedControl?.id === control.id
            return (
              <div className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 rounded-md border p-1 ${selected ? 'border-primary/40 bg-primary-soft/60' : 'border-border bg-surface'}`} key={control.id} role="listitem">
                <button
                  aria-current={selected ? 'true' : undefined}
                  className="min-h-11 min-w-0 rounded-md px-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8"
                  onClick={() => setSelectedControlId(control.id)}
                  type="button"
                >
                  <strong className="block truncate text-xs text-foreground">{index + 1}. {control.label}</strong>
                  <span className="block truncate text-[0.625rem] text-muted-foreground">{typeLabel(control.type)} · {field ? `→ ${field.label}` : 'sin mapping'}</span>
                </button>
                <Button aria-label={`Mover arriba ${control.label}`} disabled={pending || index === 0} onClick={() => move(control.id, index - 1)} size="icon" variant="ghost"><span aria-hidden="true" className="rotate-180"><Icon name="chevron-down" size={13} /></span></Button>
                <Button aria-label={`Mover abajo ${control.label}`} disabled={pending || index === orderedControlIds.length - 1} onClick={() => move(control.id, index + 1)} size="icon" variant="ghost"><Icon name="chevron-down" size={13} /></Button>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="add-control-heading" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
        <div>
          <h3 className="text-xs font-bold text-foreground" id="add-control-heading">Añadir control</h3>
          <p className="text-[0.625rem] text-muted-foreground">Los 27 tipos canónicos están disponibles. El mapping solo muestra Custom Fields compatibles.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <ChoiceMenu label="Tipo" onChange={(value) => { setAddType(fieldType(value)); setAddMappedFieldId('') }} options={fieldTypes.map((option) => ({ label: option.label, value: option.id }))} value={addType} />
          <ChoiceMenu label="Mapear a Custom Field" onChange={setAddMappedFieldId} options={[{ label: 'Sin mapear', value: '' }, ...addFields.map((field) => ({ label: field.label, description: field.key, value: field.id }))]} value={addMappedFieldId} />
          <TextField label="Etiqueta" onChange={(event) => { const next = event.target.value; setAddLabel(next); setAddName(keyFromLabel(next, 'field')) }} value={addLabel} />
          <TextField label="Clave" onChange={(event) => setAddName(event.target.value)} value={addName} />
        </div>
        <div className="flex justify-end"><Button disabled={pending || !firstStep} onClick={addControl} size="small"><Icon name="plus" size={12} /> Añadir al formulario</Button></div>
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
    <div className="grid min-h-full gap-2 p-2 lg:grid-cols-[14rem_minmax(0,1fr)] lg:p-3">
      <aside className="grid content-start gap-2 rounded-lg border border-border bg-muted/20 p-2" aria-label="Formularios guardados">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <strong className="block text-xs text-foreground">Formularios</strong>
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
              <span className="block truncate text-[0.625rem] text-muted-foreground">{Object.keys(form.controls).length} controles</span>
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
