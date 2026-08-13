import type { Form } from './cms-schema'

export type FormStep = Form['steps'][number]

export type FormStepMutationResult =
  | { readonly ok: true; readonly steps: readonly FormStep[] }
  | { readonly ok: false; readonly message: string }

function success(steps: readonly FormStep[]): FormStepMutationResult {
  return { ok: true, steps }
}

function failure(message: string): FormStepMutationResult {
  return { ok: false, message }
}

export function renameFormStep(form: Form, stepId: string, name: string): FormStepMutationResult {
  const trimmed = name.trim()
  if (!trimmed) return failure('El paso necesita un nombre.')
  const index = form.steps.findIndex((step) => step.id === stepId)
  if (index < 0) return failure('El paso ya no existe.')
  const steps = structuredClone(form.steps)
  steps[index] = { ...steps[index], name: trimmed }
  return success(steps)
}

export function splitFormStep(
  form: Form,
  stepId: string,
  controlId: string,
  newStepId: string,
  newStepName: string,
): FormStepMutationResult {
  const stepIndex = form.steps.findIndex((step) => step.id === stepId)
  if (stepIndex < 0) return failure('El paso ya no existe.')
  const step = form.steps[stepIndex]
  const splitIndex = step.controlIds.indexOf(controlId)
  if (splitIndex <= 0) return failure('El nuevo paso debe empezar después de al menos un campo del paso actual.')

  const name = newStepName.trim()
  if (!name) return failure('El nuevo paso necesita un nombre.')
  if (form.steps.some((candidate) => candidate.id === newStepId)) return failure('El identificador del nuevo paso ya existe.')

  const before = step.controlIds.slice(0, splitIndex)
  const after = step.controlIds.slice(splitIndex)
  if (before.length === 0 || after.length === 0) return failure('Cada paso debe conservar al menos un campo.')

  const steps = structuredClone(form.steps)
  steps.splice(stepIndex, 1,
    { ...steps[stepIndex], controlIds: before },
    { id: newStepId, name, controlIds: after },
  )
  return success(steps)
}

export function mergeFormStepBackward(form: Form, stepId: string): FormStepMutationResult {
  const stepIndex = form.steps.findIndex((step) => step.id === stepId)
  if (stepIndex < 0) return failure('El paso ya no existe.')
  if (stepIndex === 0) return failure('El primer paso no puede fusionarse hacia atrás.')

  const steps = structuredClone(form.steps)
  const previous = steps[stepIndex - 1]
  const current = steps[stepIndex]
  steps.splice(stepIndex - 1, 2, {
    ...previous,
    controlIds: [...previous.controlIds, ...current.controlIds],
  })
  return success(steps)
}

export function moveFormStep(form: Form, stepId: string, direction: -1 | 1): FormStepMutationResult {
  const stepIndex = form.steps.findIndex((step) => step.id === stepId)
  if (stepIndex < 0) return failure('El paso ya no existe.')
  const target = stepIndex + direction
  if (target < 0 || target >= form.steps.length) return failure('El paso ya está en el extremo de la secuencia.')

  const steps = structuredClone(form.steps)
  const [step] = steps.splice(stepIndex, 1)
  steps.splice(target, 0, step)
  return success(steps)
}
