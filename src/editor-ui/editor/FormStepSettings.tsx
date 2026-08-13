import { useState } from 'react'
import type { Form } from '../../domain'
import type { FormEditablePatch } from '../../domain/project/form-builder-engine'
import { mergeFormStepBackward, moveFormStep, renameFormStep, splitFormStep } from '../../domain/project/form-step-runtime'
import { Button, ChoiceField, Icon, TextField } from '../primitives'
import { useFormSession } from './form-session-context'

type ProgressionPatch = FormEditablePatch & Partial<Pick<Form, 'steps' | 'draftSaving'>>

interface SplitOption {
  readonly controlId: string
  readonly label: string
  readonly stepId: string
  readonly value: string
}

function splitOptions(form: Form): readonly SplitOption[] {
  return form.steps.flatMap((step) => step.controlIds.slice(1).flatMap((controlId) => {
    const control = form.controls[controlId]
    return control ? [{ controlId, label: `${step.name} · antes de ${control.label}`, stepId: step.id, value: `${step.id}:${controlId}` }] : []
  }))
}

function controlLabels(form: Form, controlIds: readonly string[]): string {
  return controlIds.map((id) => form.controls[id]?.label).filter(Boolean).join(' · ')
}

export function FormStepSettings({ form }: { readonly form: Form }) {
  const forms = useFormSession()
  const options = splitOptions(form)
  const [splitValue, setSplitValue] = useState(options[0]?.value ?? '')
  const [stepNames, setStepNames] = useState<Record<string, string>>(() => Object.fromEntries(form.steps.map((step) => [step.id, step.name])))
  const [pending, setPending] = useState(false)
  const [mergeArmedId, setMergeArmedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)

  async function persist(patch: ProgressionPatch, successText: string): Promise<boolean> {
    setPending(true)
    const result = await forms.updateForm(form.id, { name: form.name, ...patch } as ProgressionPatch)
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: successText } : { kind: 'error', text: result.error })
    return result.ok
  }

  async function createStep(): Promise<void> {
    const option = options.find((candidate) => candidate.value === splitValue)
    if (!option) {
      setNotice({ kind: 'error', text: 'Elige un campo a partir del cual empezar el nuevo paso.' })
      return
    }
    const result = splitFormStep(form, option.stepId, option.controlId, crypto.randomUUID(), `Paso ${form.steps.length + 1}`)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.message })
      return
    }
    await persist({ steps: [...result.steps] }, 'Paso creado y orden de campos actualizado.')
  }

  async function rename(stepId: string): Promise<void> {
    const result = renameFormStep(form, stepId, stepNames[stepId] ?? '')
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.message })
      return
    }
    await persist({ steps: [...result.steps] }, 'Nombre del paso actualizado.')
  }

  async function move(stepId: string, direction: -1 | 1): Promise<void> {
    const result = moveFormStep(form, stepId, direction)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.message })
      return
    }
    await persist({ steps: [...result.steps] }, 'Orden de pasos actualizado.')
  }

  async function merge(stepId: string): Promise<void> {
    if (mergeArmedId !== stepId) {
      setMergeArmedId(stepId)
      setNotice({ kind: 'success', text: 'Pulsa de nuevo para confirmar. Los campos pasarán al paso anterior.' })
      return
    }
    const result = mergeFormStepBackward(form, stepId)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.message })
      setMergeArmedId(null)
      return
    }
    setMergeArmedId(null)
    await persist({ steps: [...result.steps] }, 'Pasos fusionados sin perder campos.')
  }

  return (
    <section aria-labelledby="form-step-settings-heading" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="more" size={14} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-foreground" id="form-step-settings-heading">Pasos y borradores</h3>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Divide formularios largos en pasos y permite recuperar respuestas no enviadas en este dispositivo.</p>
        </div>
        <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[0.625rem] font-bold text-muted-foreground">{form.steps.length} {form.steps.length === 1 ? 'paso' : 'pasos'}</span>
      </div>

      {notice ? <p className={`rounded-md px-2 py-1.5 text-xs ${notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary-strong'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/15 px-2 lg:min-h-9">
        <button
          aria-checked={form.draftSaving}
          aria-label="Guardar borrador automáticamente"
          className="grid size-11 shrink-0 place-items-center rounded-md focus-visible:ring-2 focus-visible:ring-focus lg:h-8 lg:w-11"
          disabled={pending}
          onClick={() => { void persist({ draftSaving: !form.draftSaving }, form.draftSaving ? 'Guardado de borradores desactivado.' : 'Guardado de borradores activado.') }}
          role="switch"
          type="button"
        >
          <span aria-hidden="true" className={`relative block h-6 w-11 rounded-full border transition-colors ${form.draftSaving ? 'border-primary bg-primary' : 'border-border bg-surface'}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${form.draftSaving ? 'translate-x-[1.15rem]' : 'translate-x-0.5'}`} />
          </span>
        </button>
        <span className="min-w-0 flex-1">
          <strong className="block text-xs text-foreground">Guardar borrador automáticamente</strong>
          <span className="block text-[0.625rem] leading-4 text-muted-foreground">Conserva las respuestas de la vista de prueba en este dispositivo. No envía datos.</span>
        </span>
      </div>

      {options.length > 0 ? (
        <div className="grid gap-2 rounded-md border border-border bg-muted/10 p-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <ChoiceField
            label="Empezar un nuevo paso"
            onChange={setSplitValue}
            options={options.map((option) => ({ label: option.label, value: option.value }))}
            value={options.some((option) => option.value === splitValue) ? splitValue : options[0]?.value ?? ''}
          />
          <Button disabled={pending} onClick={() => { void createStep() }} size="small"><Icon name="plus" size={12} />Crear paso</Button>
        </div>
      ) : <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">Añade al menos dos campos dentro de un mismo paso para poder dividirlo.</p>}

      <div className="grid gap-1.5" role="list" aria-label="Pasos del formulario">
        {form.steps.map((step, index) => (
          <div className="grid gap-1.5 rounded-md border border-border bg-muted/10 p-2" key={step.id} role="listitem">
            <div className="grid gap-1.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <TextField
                label={`Paso ${index + 1}`}
                onChange={(event) => setStepNames((current) => ({ ...current, [step.id]: event.target.value }))}
                value={stepNames[step.id] ?? step.name}
              />
              <div className="flex flex-wrap justify-end gap-1">
                <Button aria-label={`Mover arriba ${step.name}`} disabled={pending || index === 0} onClick={() => { void move(step.id, -1) }} size="icon" variant="ghost"><span aria-hidden="true" className="rotate-180"><Icon name="chevron-down" size={13} /></span></Button>
                <Button aria-label={`Mover abajo ${step.name}`} disabled={pending || index === form.steps.length - 1} onClick={() => { void move(step.id, 1) }} size="icon" variant="ghost"><Icon name="chevron-down" size={13} /></Button>
                {index > 0 ? <Button disabled={pending} onClick={() => { void merge(step.id) }} size="small" variant={mergeArmedId === step.id ? 'destructive' : 'ghost'}>{mergeArmedId === step.id ? 'Confirmar unión' : 'Unir al anterior'}</Button> : null}
                <Button disabled={pending} onClick={() => { void rename(step.id) }} size="small" variant="secondary">Guardar nombre</Button>
              </div>
            </div>
            <p className="truncate text-[0.625rem] text-muted-foreground">{controlLabels(form, step.controlIds)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
