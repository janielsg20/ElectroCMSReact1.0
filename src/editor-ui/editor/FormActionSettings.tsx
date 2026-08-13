import { useState } from 'react'
import type { CmsBackend, Form, JsonValue } from '../../domain'
import { FORM_ACTION_KINDS, formActionDefinition, type FormActionConfigField } from '../../domain/project/form-action-catalog'
import type { FormEditablePatch } from '../../domain/project/form-builder-engine'
import { Button, ChoiceField, HelpTip, Icon, TextField } from '../primitives'
import { useFormSession } from './form-session-context'

type FormAction = Form['actions'][number]
type ActionPatch = FormEditablePatch & Partial<Pick<Form, 'actions'>>

const capabilityLabels = {
  content: 'Contenido', identity: 'Usuarios', messaging: 'Mensajería', 'local-storage': 'Local', navigation: 'Navegación', network: 'Externo', relations: 'Relaciones', files: 'Archivos',
} as const

function configText(config: FormAction['config'], key: string): string {
  const value = config[key]
  return typeof value === 'string' ? value : value === undefined || value === null ? '' : JSON.stringify(value)
}

function defaultConfig(kind: FormAction['kind'], cms: CmsBackend, form: Form): FormAction['config'] {
  const definition = formActionDefinition(kind)
  const config: Record<string, JsonValue> = {}
  for (const field of definition.fields) {
    if (field.type === 'content-type') config[field.key] = form.contentTypeId ?? Object.keys(cms.contentTypes)[0] ?? ''
    else if (field.type === 'relation') config[field.key] = Object.keys(cms.relations)[0] ?? ''
    else if (field.type === 'control') {
      const preferred = Object.values(form.controls).find((control) => field.key.toLowerCase().includes('email') ? control.type === 'email' : field.key.toLowerCase().includes('file') ? control.type === 'file' : false)
      config[field.key] = preferred?.id ?? Object.keys(form.controls)[0] ?? ''
    } else if (field.key === 'key') config[field.key] = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'formulario'
    else if (field.key === 'message') config[field.key] = form.successMessage
    else config[field.key] = ''
  }
  return config
}

function ActionField({ cms, field, form, onChange, value }: {
  readonly cms: CmsBackend
  readonly field: FormActionConfigField
  readonly form: Form
  readonly onChange: (value: string) => void
  readonly value: string
}) {
  if (field.type === 'content-type') {
    return <ChoiceField label={field.label} onChange={onChange} options={Object.values(cms.contentTypes).map((item) => ({ label: item.pluralName, value: item.id }))} value={value} />
  }
  if (field.type === 'relation') {
    return <ChoiceField label={field.label} onChange={onChange} options={Object.values(cms.relations).map((item) => ({ label: item.name, value: item.id }))} placeholder="Selecciona una relación" value={value} />
  }
  if (field.type === 'control') {
    return <ChoiceField label={field.label} onChange={onChange} options={Object.values(form.controls).map((control) => ({ description: control.type, label: control.label, value: control.id }))} value={value} />
  }
  if (field.type === 'textarea') {
    return (
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        {field.label}{field.required ? ' *' : ''}
        <textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => onChange(event.target.value)} value={value} />
      </label>
    )
  }
  return <TextField label={field.label} onChange={(event) => onChange(event.target.value)} required={field.required} type={field.type === 'email' || field.type === 'url' ? field.type : 'text'} value={value} />
}

function ActionCard({ action, cms, form, index, length, pending, onDelete, onMove, onSave }: {
  readonly action: FormAction
  readonly cms: CmsBackend
  readonly form: Form
  readonly index: number
  readonly length: number
  readonly pending: boolean
  readonly onDelete: (actionId: string) => void
  readonly onMove: (actionId: string, direction: -1 | 1) => void
  readonly onSave: (action: FormAction) => void
}) {
  const definition = formActionDefinition(action.kind)
  const [config, setConfig] = useState<FormAction['config']>(() => structuredClone(action.config))
  const [notice, setNotice] = useState('')

  function save(): void {
    const missing = definition.fields.find((field) => field.required && !configText(config, field.key).trim())
    if (missing) {
      setNotice(`Completa ${missing.label.toLowerCase()}.`)
      return
    }
    setNotice('')
    onSave({ ...action, config: structuredClone(config) })
  }

  return (
    <article className="grid gap-2 rounded-md border border-border bg-muted/10 p-2">
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="check" size={13} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <strong className="text-xs text-foreground">{index + 1}. {definition.label}</strong>
            <HelpTip description={definition.description} label={definition.label} reference={definition.reference} />
          </div>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">{definition.description}</p>
        </div>
        <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[0.625rem] font-semibold text-muted-foreground">{capabilityLabels[definition.capability]}</span>
      </div>

      {definition.fields.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {definition.fields.map((field) => (
            <ActionField
              cms={cms}
              field={field}
              form={form}
              key={field.key}
              onChange={(value) => setConfig((current) => ({ ...current, [field.key]: value }))}
              value={configText(config, field.key)}
            />
          ))}
        </div>
      ) : <p className="rounded-md border border-dashed border-border bg-surface p-2 text-[0.625rem] text-muted-foreground">Esta acción usa automáticamente el contexto y los campos conectados del formulario.</p>}

      {notice ? <p className="text-xs text-destructive" role="alert">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-border pt-1.5">
        <Button disabled={pending} onClick={() => onDelete(action.id)} size="small" variant="ghost">Eliminar</Button>
        <div className="flex flex-wrap justify-end gap-1">
          <Button aria-label={`Mover arriba ${definition.label}`} disabled={pending || index === 0} onClick={() => onMove(action.id, -1)} size="icon" variant="ghost"><span aria-hidden="true" className="rotate-180"><Icon name="chevron-down" size={13} /></span></Button>
          <Button aria-label={`Mover abajo ${definition.label}`} disabled={pending || index === length - 1} onClick={() => onMove(action.id, 1)} size="icon" variant="ghost"><Icon name="chevron-down" size={13} /></Button>
          <Button disabled={pending} onClick={save} size="small" variant="secondary">Guardar acción</Button>
        </div>
      </div>
    </article>
  )
}

export function FormActionSettings({ cms, form }: { readonly cms: CmsBackend; readonly form: Form }) {
  const forms = useFormSession()
  const [newKind, setNewKind] = useState<FormAction['kind']>('save-record')
  const [pending, setPending] = useState(false)
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)

  async function persist(actions: readonly FormAction[], message: string): Promise<boolean> {
    setPending(true)
    const patch: ActionPatch = { actions: [...actions], name: form.name }
    const result = await forms.updateForm(form.id, patch)
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: message } : { kind: 'error', text: result.error })
    return result.ok
  }

  function add(): void {
    const action: FormAction = { config: defaultConfig(newKind, cms, form), id: crypto.randomUUID(), kind: newKind }
    void persist([...form.actions, action], `${formActionDefinition(newKind).label} añadida al pipeline.`)
  }

  function save(action: FormAction): void {
    void persist(form.actions.map((current) => current.id === action.id ? action : current), 'Configuración de la acción guardada.')
  }

  function move(actionId: string, direction: -1 | 1): void {
    const index = form.actions.findIndex((action) => action.id === actionId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= form.actions.length) return
    const actions = [...form.actions]
    const [action] = actions.splice(index, 1)
    actions.splice(target, 0, action)
    void persist(actions, 'Orden del pipeline actualizado.')
  }

  function remove(actionId: string): void {
    if (deleteArmedId !== actionId) {
      setDeleteArmedId(actionId)
      setNotice({ kind: 'success', text: 'Pulsa Eliminar otra vez para confirmar.' })
      return
    }
    setDeleteArmedId(null)
    void persist(form.actions.filter((action) => action.id !== actionId), 'Acción eliminada.')
  }

  return (
    <section aria-labelledby="form-action-settings-heading" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="form" size={14} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-foreground" id="form-action-settings-heading">Qué ocurre al completar</h3>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Las acciones se ejecutan de arriba abajo. Si una falla, ElectroCMS detiene las siguientes y muestra el motivo.</p>
        </div>
        <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[0.625rem] font-bold text-muted-foreground">{form.actions.length} acciones</span>
      </div>

      {notice ? <p className={`rounded-md px-2 py-1.5 text-xs ${notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary-strong'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      <div className="grid gap-2 rounded-md border border-border bg-muted/10 p-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <ChoiceField
          label="Añadir acción"
          onChange={(value) => setNewKind(FORM_ACTION_KINDS.includes(value as FormAction['kind']) ? value as FormAction['kind'] : 'save-record')}
          options={FORM_ACTION_KINDS.map((kind) => {
            const definition = formActionDefinition(kind)
            return { description: definition.description, label: definition.label, value: kind }
          })}
          value={newKind}
        />
        <Button disabled={pending} onClick={add} size="small"><Icon name="plus" size={12} />Añadir</Button>
      </div>

      {form.actions.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">No hay acciones todavía. El formulario puede validarse, pero no realizará ninguna operación al completarse.</p> : null}
      <div className="grid gap-1.5">
        {form.actions.map((action, index) => (
          <div className={deleteArmedId === action.id ? 'rounded-md ring-1 ring-destructive/40' : ''} key={`${action.id}:${JSON.stringify(action.config)}`}>
            <ActionCard action={action} cms={cms} form={form} index={index} length={form.actions.length} onDelete={remove} onMove={move} onSave={save} pending={pending} />
          </div>
        ))}
      </div>
    </section>
  )
}
