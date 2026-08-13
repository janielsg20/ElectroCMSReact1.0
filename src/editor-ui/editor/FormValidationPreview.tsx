import { useEffect, useMemo, useRef, useState } from 'react'
import type { CmsBackend, Form, JsonValue } from '../../domain'
import { clearFormDraft, readFormDraft, writeFormDraft } from '../../domain/project/form-draft-storage'
import { isFormControlVisible, validateFormSubmission } from '../../domain/project/form-runtime'
import { Button, ChoiceField, Icon, TextField } from '../primitives'

type FormControl = Form['controls'][string]
type MutableValues = Record<string, JsonValue | undefined>

function sameJson(left: JsonValue | undefined, right: JsonValue): boolean {
  return left !== undefined && JSON.stringify(left) === JSON.stringify(right)
}

function orderedControls(form: Form): readonly FormControl[] {
  const ids = form.steps.flatMap((step) => step.controlIds)
  const seen = new Set(ids)
  return [...ids, ...Object.keys(form.controls).filter((id) => !seen.has(id))]
    .flatMap((id) => form.controls[id] ? [form.controls[id]] : [])
}

function valueText(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' || typeof item === 'number' ? String(item) : '').filter(Boolean).join(', ')
  return typeof value.value === 'string' ? value.value : ''
}

function errorText(errors: readonly { readonly message: string }[] | undefined): string | undefined {
  return errors?.length ? errors.map((item) => item.message).join(' ') : undefined
}

interface PreviewControlProps {
  readonly cms: CmsBackend
  readonly control: FormControl
  readonly error?: string
  readonly onChange: (value: JsonValue | undefined) => void
  readonly value: JsonValue | undefined
}

function PreviewControl({ cms, control, error, onChange, value }: PreviewControlProps) {
  const field = control.mappedFieldId ? cms.fields[control.mappedFieldId] : undefined
  const required = control.required || field?.required === true
  const optionValues = field?.options ?? []

  if ((control.type === 'select' || control.type === 'radio') && optionValues.length > 0) {
    const selected = optionValues.findIndex((option) => sameJson(value, option.value))
    return (
      <div className="grid gap-1">
        <ChoiceField
          label={control.label}
          onChange={(next) => onChange(optionValues[Number(next)]?.value)}
          options={optionValues.map((option, index) => ({ label: option.label, value: String(index) }))}
          placeholder="Seleccionar"
          value={selected >= 0 ? String(selected) : ''}
        />
        {required ? <span className="text-[0.625rem] font-semibold text-primary-strong">Obligatorio</span> : null}
        {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : null}
      </div>
    )
  }

  if (control.type === 'checkbox' && optionValues.length > 0) {
    const selected = Array.isArray(value) ? value : []
    return (
      <fieldset className="grid gap-1">
        <legend className="text-xs font-semibold text-muted-foreground">{control.label}{required ? ' *' : ''}</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {optionValues.map((option) => {
            const checked = selected.some((item) => sameJson(item, option.value))
            return (
              <button
                aria-checked={checked}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 ${checked ? 'border-primary/40 bg-primary-soft text-primary-strong' : 'border-border bg-surface hover:bg-muted'}`}
                key={JSON.stringify(option.value)}
                onClick={() => onChange(checked ? selected.filter((item) => !sameJson(item, option.value)) : [...selected, option.value])}
                role="checkbox"
                type="button"
              >
                <span aria-hidden="true" className={`grid size-4 place-items-center rounded border ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border'}`}>{checked ? <Icon name="check" size={11} /> : null}</span>
                {option.label}
              </button>
            )
          })}
        </div>
        {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : null}
      </fieldset>
    )
  }

  if (control.type === 'switch') {
    const checked = value === true
    return (
      <div className="grid gap-1">
        <button
          aria-checked={checked}
          className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8"
          onClick={() => onChange(!checked)}
          role="switch"
          type="button"
        >
          <span><strong className="block">{control.label}</strong><span className="text-[0.625rem] text-muted-foreground">{required ? 'Obligatorio' : 'Opcional'}</span></span>
          <span aria-hidden="true" className={`relative h-6 w-11 rounded-full border ${checked ? 'border-primary bg-primary' : 'border-border bg-muted'}`}><span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow transition-transform ${checked ? 'translate-x-[1.15rem]' : 'translate-x-0.5'}`} /></span>
        </button>
        {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : null}
      </div>
    )
  }

  if (control.type === 'textarea' || control.type === 'rich-text') {
    return (
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        {control.label}{required ? ' *' : ''}
        <textarea
          aria-invalid={error ? true : undefined}
          className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus lg:text-xs"
          onChange={(event) => onChange(event.target.value)}
          value={valueText(value)}
        />
        {error ? <span className="text-xs font-medium text-destructive" role="alert">{error}</span> : null}
      </label>
    )
  }

  if (control.type === 'gallery' || control.type === 'repeater') {
    return (
      <TextField
        error={error}
        hint="Para la prueba, separa varios valores con comas."
        label={control.label}
        onChange={(event) => onChange(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
        required={required}
        value={valueText(value)}
      />
    )
  }

  if (control.type === 'group') {
    return (
      <TextField
        error={error}
        hint="Introduce un valor de prueba para el grupo."
        label={control.label}
        onChange={(event) => onChange(event.target.value ? { value: event.target.value } : undefined)}
        required={required}
        value={valueText(value)}
      />
    )
  }

  const numeric = control.type === 'number' || control.type === 'currency'
  const htmlType = control.type === 'email' || control.type === 'url' || control.type === 'date' || control.type === 'time' || control.type === 'color'
    ? control.type
    : control.type === 'datetime' ? 'datetime-local' : numeric ? 'number' : 'text'
  return (
    <TextField
      error={error}
      inputMode={numeric ? 'decimal' : undefined}
      label={control.label}
      onChange={(event) => {
        if (!numeric) onChange(event.target.value)
        else if (event.target.value === '') onChange(undefined)
        else {
          const next = Number(event.target.value)
          onChange(Number.isFinite(next) ? next : event.target.value)
        }
      }}
      required={required}
      type={htmlType}
      value={valueText(value)}
    />
  )
}

export function FormValidationPreview({ cms, form }: { readonly cms: CmsBackend; readonly form: Form }) {
  const [recoveredDraft, setRecoveredDraft] = useState(() => form.draftSaving && typeof window !== 'undefined' ? readFormDraft(window.localStorage, form) : null)
  const [values, setValues] = useState<MutableValues>(() => recoveredDraft?.values ?? {})
  const [currentStepId, setCurrentStepId] = useState(() => recoveredDraft?.stepId ?? form.steps[0]?.id ?? '')
  const [attempted, setAttempted] = useState(false)
  const [discardArmed, setDiscardArmed] = useState(false)
  const controlContainers = useRef<Record<string, HTMLDivElement | null>>({})
  const controls = useMemo(() => orderedControls(form), [form])
  const currentStepIndex = Math.max(0, form.steps.findIndex((step) => step.id === currentStepId))
  const currentStep = form.steps[currentStepIndex] ?? form.steps[0]
  const currentControlIds = new Set(currentStep?.controlIds ?? [])
  const visibleControls = controls.filter((control) => currentControlIds.has(control.id) && isFormControlVisible(form, control, values))
  const validation = attempted ? validateFormSubmission(form, cms, values) : null
  const currentErrors = validation?.errors.filter((item) => currentControlIds.has(item.controlId)) ?? []
  const isLastStep = currentStepIndex >= form.steps.length - 1
  const progress = form.steps.length ? Math.round(((currentStepIndex + 1) / form.steps.length) * 100) : 100

  useEffect(() => {
    if (!form.draftSaving || !currentStep || typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      writeFormDraft(window.localStorage, form, currentStep.id, values)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [currentStep, form, values])

  function changeValue(controlId: string, value: JsonValue | undefined): void {
    setValues((current) => ({ ...current, [controlId]: value }))
    setDiscardArmed(false)
  }

  function focusControl(controlId: string | null): void {
    if (!controlId) return
    requestAnimationFrame(() => {
      const container = controlContainers.current[controlId]
      container?.querySelector<HTMLElement>('input, textarea, button, [tabindex]')?.focus()
    })
  }

  function advance(): void {
    if (!currentStep) return
    const result = validateFormSubmission(form, cms, values)
    const stepErrors = result.errors.filter((item) => currentControlIds.has(item.controlId))
    setAttempted(true)
    if (stepErrors.length > 0) {
      focusControl(stepErrors[0]?.controlId ?? null)
      return
    }
    if (!isLastStep) {
      const next = form.steps[currentStepIndex + 1]
      if (next) {
        setCurrentStepId(next.id)
        setAttempted(false)
        setDiscardArmed(false)
      }
      return
    }
    if (!result.valid) {
      const first = result.firstInvalidControlId
      const ownerIndex = form.steps.findIndex((step) => step.controlIds.includes(first ?? ''))
      if (ownerIndex >= 0 && ownerIndex !== currentStepIndex) setCurrentStepId(form.steps[ownerIndex]?.id ?? currentStep.id)
      focusControl(first)
      return
    }
    if (typeof window !== 'undefined') clearFormDraft(window.localStorage, form.id)
    setRecoveredDraft(null)
  }

  function back(): void {
    const previous = form.steps[currentStepIndex - 1]
    if (!previous) return
    setCurrentStepId(previous.id)
    setAttempted(false)
    setDiscardArmed(false)
  }

  function discard(): void {
    if (!discardArmed) {
      setDiscardArmed(true)
      return
    }
    if (typeof window !== 'undefined') clearFormDraft(window.localStorage, form.id)
    setValues({})
    setAttempted(false)
    setRecoveredDraft(null)
    setDiscardArmed(false)
    setCurrentStepId(form.steps[0]?.id ?? '')
  }

  return (
    <section aria-labelledby="form-validation-preview-heading" className="grid gap-2 rounded-lg border border-border bg-muted/15 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-foreground" id="form-validation-preview-heading">Probar formulario</h3>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Comprueba pasos, validación, visibilidad y recuperación sin enviar ni guardar respuestas en el CMS.</p>
        </div>
        <span className="rounded-md border border-border bg-surface px-2 py-1 text-[0.625rem] font-semibold text-muted-foreground">Vista previa</span>
      </div>

      {form.steps.length > 1 ? (
        <div className="grid gap-1" aria-label="Progreso del formulario">
          <div className="flex items-center justify-between gap-2 text-[0.625rem] font-semibold text-muted-foreground">
            <span>Paso {currentStepIndex + 1} de {form.steps.length} · {currentStep?.name}</span>
            <span>{progress}%</span>
          </div>
          <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar">
            <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {recoveredDraft ? <p className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1.5 text-xs text-primary-strong" role="status">Borrador recuperado de este dispositivo. Puedes continuar donde lo dejaste.</p> : null}
      {form.draftSaving ? <p className="text-[0.625rem] text-muted-foreground">Borrador automático activo · se conserva localmente mientras escribes.</p> : null}

      {attempted && validation && (currentErrors.length > 0 || (isLastStep && validation.valid)) ? (
        <div aria-live="polite" className={`rounded-md border px-2 py-2 text-xs ${validation.valid ? 'border-primary/25 bg-primary-soft text-primary-strong' : 'border-destructive/30 bg-destructive/10 text-destructive'}`} role="status">
          {validation.valid ? form.successMessage : form.errorMessage}
          {currentErrors.length > 0 ? <span className="ml-1">({currentErrors.length} {currentErrors.length === 1 ? 'campo por revisar' : 'campos por revisar'} en este paso)</span> : null}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {visibleControls.map((control) => (
          <div
            className="min-w-0"
            data-form-preview-control={control.id}
            key={control.id}
            ref={(element) => { controlContainers.current[control.id] = element }}
          >
            <PreviewControl
              cms={cms}
              control={control}
              error={attempted ? errorText(validation?.controlStates[control.id]?.errors) : undefined}
              onChange={(value) => changeValue(control.id, value)}
              value={values[control.id]}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-border pt-2">
        <Button onClick={discard} size="small" variant={discardArmed ? 'destructive' : 'ghost'}>{discardArmed ? 'Confirmar descarte' : 'Descartar respuestas'}</Button>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button disabled={currentStepIndex === 0} onClick={back} size="small" variant="secondary"><Icon name="chevron-down" size={12} /><span className="sr-only">Ir </span>Atrás</Button>
          <Button onClick={advance} size="small"><Icon name="check" size={12} />{isLastStep ? 'Comprobar formulario' : 'Siguiente'}</Button>
        </div>
      </div>
    </section>
  )
}
