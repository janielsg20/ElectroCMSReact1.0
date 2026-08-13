import type { CmsBackend, Form } from './cms-schema'
import type { JsonValue } from './project-envelope'
import { validateFormSubmission, type FormRuntimeValues, type FormValidationResult } from './form-runtime'

type FormAction = Form['actions'][number]
export type FormActionKind = FormAction['kind']

export type FormMappedValues = Readonly<Record<string, JsonValue>>

export interface FormActionExecutionContext {
  readonly actionIndex: number
  readonly cms: CmsBackend
  readonly form: Form
  readonly mappedValues: FormMappedValues
  readonly values: FormRuntimeValues
}

export type FormActionHandlerResult =
  | { readonly ok: true; readonly output?: JsonValue }
  | { readonly ok: false; readonly message: string }

export type FormActionHandler = (
  action: FormAction,
  context: FormActionExecutionContext,
) => FormActionHandlerResult | Promise<FormActionHandlerResult>

export type FormActionHandlers = Partial<Record<FormActionKind, FormActionHandler>>

export interface FormActionExecutionRecord {
  readonly actionId: string
  readonly kind: FormActionKind
  readonly output?: JsonValue
  readonly status: 'success' | 'failed'
  readonly message?: string
}

export type FormActionPipelineErrorCode =
  | 'validation-failed'
  | 'duplicate-field-mapping'
  | 'adapter-missing'
  | 'action-failed'

export interface FormActionPipelineError {
  readonly actionId: string | null
  readonly actionIndex: number | null
  readonly code: FormActionPipelineErrorCode
  readonly message: string
}

export interface FormActionPipelineResult {
  readonly completed: boolean
  readonly error: FormActionPipelineError | null
  readonly mappedValues: FormMappedValues
  readonly records: readonly FormActionExecutionRecord[]
  readonly validation: FormValidationResult
}

export type FormValueMappingResult =
  | { readonly ok: true; readonly values: FormMappedValues }
  | { readonly ok: false; readonly message: string }

function jsonEquals(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function mapFormValuesToFields(form: Form, values: FormRuntimeValues): FormValueMappingResult {
  const mapped: Record<string, JsonValue> = {}
  for (const step of form.steps) {
    for (const controlId of step.controlIds) {
      const control = form.controls[controlId]
      const value = values[controlId]
      if (!control?.mappedFieldId || value === undefined) continue
      const current = mapped[control.mappedFieldId]
      if (current !== undefined && !jsonEquals(current, value)) {
        return {
          ok: false,
          message: `Dos controles intentan guardar valores distintos en el mismo campo: ${control.label}.`,
        }
      }
      mapped[control.mappedFieldId] = value
    }
  }
  return { ok: true, values: mapped }
}

export async function executeFormActionPipeline(
  form: Form,
  cms: CmsBackend,
  values: FormRuntimeValues,
  handlers: FormActionHandlers,
): Promise<FormActionPipelineResult> {
  const validation = validateFormSubmission(form, cms, values)
  if (!validation.valid) {
    return {
      completed: false,
      error: { actionId: null, actionIndex: null, code: 'validation-failed', message: form.errorMessage },
      mappedValues: {},
      records: [],
      validation,
    }
  }

  const mapping = mapFormValuesToFields(form, values)
  if (!mapping.ok) {
    return {
      completed: false,
      error: { actionId: null, actionIndex: null, code: 'duplicate-field-mapping', message: mapping.message },
      mappedValues: {},
      records: [],
      validation,
    }
  }

  const records: FormActionExecutionRecord[] = []
  for (const [actionIndex, action] of form.actions.entries()) {
    const handler = handlers[action.kind]
    if (!handler) {
      return {
        completed: false,
        error: {
          actionId: action.id,
          actionIndex,
          code: 'adapter-missing',
          message: `La acción ${action.kind} necesita una capacidad que no está disponible en este destino.`,
        },
        mappedValues: mapping.values,
        records,
        validation,
      }
    }

    const result = await handler(action, { actionIndex, cms, form, mappedValues: mapping.values, values })
    if (!result.ok) {
      const record: FormActionExecutionRecord = { actionId: action.id, kind: action.kind, message: result.message, status: 'failed' }
      records.push(record)
      return {
        completed: false,
        error: { actionId: action.id, actionIndex, code: 'action-failed', message: result.message },
        mappedValues: mapping.values,
        records,
        validation,
      }
    }
    records.push(result.output === undefined
      ? { actionId: action.id, kind: action.kind, status: 'success' }
      : { actionId: action.id, kind: action.kind, output: result.output, status: 'success' })
  }

  return {
    completed: true,
    error: null,
    mappedValues: mapping.values,
    records,
    validation,
  }
}
