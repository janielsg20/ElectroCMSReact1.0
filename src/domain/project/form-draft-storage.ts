import * as z from 'zod'
import type { Form } from './cms-schema'
import { JsonValueSchema, type JsonValue } from './project-envelope'
import type { FormRuntimeValues } from './form-runtime'

export const FORM_DRAFT_VERSION = 1 as const

export const FormDraftSchema = z.strictObject({
  version: z.literal(FORM_DRAFT_VERSION),
  formId: z.string().min(1),
  stepId: z.string().min(1),
  updatedAt: z.string().min(1),
  values: z.record(z.string(), JsonValueSchema),
})

export type FormDraft = z.infer<typeof FormDraftSchema>

export interface FormDraftStorage {
  getItem(key: string): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

export type FormDraftWriteResult =
  | { readonly ok: true; readonly draft: FormDraft }
  | { readonly ok: false; readonly message: string }

export function formDraftKey(formId: string): string {
  return `electrocms:form-draft:v${FORM_DRAFT_VERSION}:${formId}`
}

export function readFormDraft(storage: FormDraftStorage, form: Form): FormDraft | null {
  try {
    const raw = storage.getItem(formDraftKey(form.id))
    if (!raw) return null
    const parsed = FormDraftSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.formId !== form.id) return null
    if (!form.steps.some((step) => step.id === parsed.data.stepId)) return null
    return parsed.data
  } catch {
    return null
  }
}

export function writeFormDraft(
  storage: FormDraftStorage,
  form: Form,
  stepId: string,
  values: FormRuntimeValues,
  now: () => string = () => new Date().toISOString(),
): FormDraftWriteResult {
  if (!form.steps.some((step) => step.id === stepId)) return { ok: false, message: 'El paso actual ya no existe.' }
  const persistedValues: Record<string, JsonValue> = {}
  for (const [controlId, value] of Object.entries(values)) {
    if (value !== undefined && form.controls[controlId]) persistedValues[controlId] = value
  }
  const parsed = FormDraftSchema.safeParse({
    version: FORM_DRAFT_VERSION,
    formId: form.id,
    stepId,
    updatedAt: now(),
    values: persistedValues,
  })
  if (!parsed.success) return { ok: false, message: 'El borrador contiene datos que no se pueden guardar.' }
  try {
    storage.setItem(formDraftKey(form.id), JSON.stringify(parsed.data))
    return { ok: true, draft: parsed.data }
  } catch {
    return { ok: false, message: 'El navegador no pudo guardar el borrador local.' }
  }
}

export function clearFormDraft(storage: FormDraftStorage, formId: string): boolean {
  try {
    storage.removeItem(formDraftKey(formId))
    return true
  } catch {
    return false
  }
}
