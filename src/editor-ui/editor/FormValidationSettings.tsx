import { useMemo, useState } from 'react'
import type { CmsBackend, FieldDefinition, Form } from '../../domain'
import { Button, Icon, TextField } from '../primitives'
import { FieldConditionEditor } from './FieldConditionEditor'
import { FormStepSettings } from './FormStepSettings'
import { FormValidationPreview } from './FormValidationPreview'
import { useFormSession } from './form-session-context'

type FormControl = Form['controls'][string]

function ruleSummary(field: FieldDefinition | undefined, control: FormControl): readonly string[] {
  const items: string[] = []
  if (control.required || field?.required) items.push('Obligatorio')
  if (!field) {
    items.push('Validación por tipo de campo')
    return items
  }
  if (field.validation.minLength !== null) items.push(`Mínimo ${field.validation.minLength} caracteres/elementos`)
  if (field.validation.maxLength !== null) items.push(`Máximo ${field.validation.maxLength} caracteres/elementos`)
  if (field.validation.min !== null) items.push(`Valor mínimo ${field.validation.min}`)
  if (field.validation.max !== null) items.push(`Valor máximo ${field.validation.max}`)
  if (field.validation.pattern !== null) items.push('Formato personalizado')
  if (items.length === 0) items.push('Validación por tipo de campo')
  return items
}

export function FormValidationSettings({ cms, control, form }: { readonly cms: CmsBackend; readonly control: FormControl; readonly form: Form }) {
  const forms = useFormSession()
  const [successMessage, setSuccessMessage] = useState(form.successMessage)
  const [errorMessage, setErrorMessage] = useState(form.errorMessage)
  const [conditions, setConditions] = useState<FormControl['conditions']>(() => structuredClone(control.conditions))
  const [messagePending, setMessagePending] = useState(false)
  const [conditionPending, setConditionPending] = useState(false)
  const [messageNotice, setMessageNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const [conditionNotice, setConditionNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const mappedField = control.mappedFieldId ? cms.fields[control.mappedFieldId] : undefined
  const rules = ruleSummary(mappedField, control)
  const sourceFields = useMemo(() => {
    const fields = new Map<string, FieldDefinition>()
    for (const candidate of Object.values(form.controls)) {
      if (candidate.id === control.id || !candidate.mappedFieldId) continue
      const field = cms.fields[candidate.mappedFieldId]
      if (field) fields.set(field.id, field)
    }
    return [...fields.values()]
  }, [cms.fields, control.id, form.controls])

  async function saveMessages(): Promise<void> {
    setMessageNotice(null)
    if (!successMessage.trim() || !errorMessage.trim()) {
      setMessageNotice({ kind: 'error', text: 'Los mensajes de éxito y error no pueden quedar vacíos.' })
      return
    }
    setMessagePending(true)
    const result = await forms.updateForm(form.id, { errorMessage: errorMessage.trim(), successMessage: successMessage.trim() })
    setMessagePending(false)
    setMessageNotice(result.ok ? { kind: 'success', text: 'Mensajes guardados.' } : { kind: 'error', text: result.error })
  }

  async function saveConditions(): Promise<void> {
    setConditionNotice(null)
    setConditionPending(true)
    const result = await forms.updateFormControl(form.id, control.id, { conditions })
    setConditionPending(false)
    setConditionNotice(result.ok ? { kind: 'success', text: conditions.length ? 'Reglas de visibilidad guardadas.' : 'El campo volverá a mostrarse siempre.' } : { kind: 'error', text: result.error })
  }

  return (
    <section aria-labelledby="form-validation-settings-heading" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="check" size={14} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-foreground" id="form-validation-settings-heading">Validación y visibilidad</h3>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Las mismas reglas se usan al probar el formulario y al preparar los datos para su destino.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1" aria-label={`Reglas activas de ${control.label}`}>
        {rules.map((rule) => <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[0.625rem] font-semibold text-muted-foreground" key={rule}>{rule}</span>)}
        {mappedField ? <span className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1 text-[0.625rem] font-semibold text-primary-strong">Heredadas de {mappedField.label}</span> : null}
      </div>

      <details className="rounded-md border border-border bg-muted/10">
        <summary className="min-h-11 cursor-pointer px-2 py-2 text-xs font-bold text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9">Visibilidad condicional · {control.label}</summary>
        <div className="grid gap-2 border-t border-border p-2">
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Elige otros campos ya conectados al contenido. Un campo no puede depender de sí mismo.</p>
          <FieldConditionEditor fields={sourceFields} onChange={setConditions} value={conditions} />
          {conditionNotice ? <p className={`rounded-md px-2 py-1.5 text-xs ${conditionNotice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary-strong'}`} role={conditionNotice.kind === 'error' ? 'alert' : 'status'}>{conditionNotice.text}</p> : null}
          <div className="flex justify-end"><Button isLoading={conditionPending} loadingLabel="Guardando" onClick={() => { void saveConditions() }} size="small"><Icon name="check" size={12} />Guardar visibilidad</Button></div>
        </div>
      </details>

      <details className="rounded-md border border-border bg-muted/10">
        <summary className="min-h-11 cursor-pointer px-2 py-2 text-xs font-bold text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9">Mensajes del formulario</summary>
        <div className="grid gap-2 border-t border-border p-2 md:grid-cols-2">
          <TextField label="Mensaje cuando todo está correcto" onChange={(event) => setSuccessMessage(event.target.value)} value={successMessage} />
          <TextField label="Mensaje cuando hay errores" onChange={(event) => setErrorMessage(event.target.value)} value={errorMessage} />
          {messageNotice ? <p className={`rounded-md px-2 py-1.5 text-xs md:col-span-2 ${messageNotice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary-strong'}`} role={messageNotice.kind === 'error' ? 'alert' : 'status'}>{messageNotice.text}</p> : null}
          <div className="flex justify-end md:col-span-2"><Button isLoading={messagePending} loadingLabel="Guardando" onClick={() => { void saveMessages() }} size="small"><Icon name="check" size={12} />Guardar mensajes</Button></div>
        </div>
      </details>

      <FormStepSettings form={form} />
      <FormValidationPreview cms={cms} form={form} />
    </section>
  )
}
