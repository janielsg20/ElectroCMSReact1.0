import type { CmsBackend, FieldDefinition, Form } from './cms-schema'
import type { JsonValue } from './project-envelope'

export type FormRuntimeValue = JsonValue | undefined
export type FormRuntimeValues = Readonly<Record<string, FormRuntimeValue>>

export type FormValidationErrorCode =
  | 'required'
  | 'invalid-type'
  | 'invalid-format'
  | 'invalid-option'
  | 'min-length'
  | 'max-length'
  | 'min'
  | 'max'
  | 'invalid-pattern'

export interface FormValidationError {
  readonly code: FormValidationErrorCode
  readonly controlId: string
  readonly message: string
}

export interface FormControlRuntimeState {
  readonly controlId: string
  readonly errors: readonly FormValidationError[]
  readonly visible: boolean
}

export interface FormValidationResult {
  readonly controlStates: Readonly<Record<string, FormControlRuntimeState>>
  readonly errors: readonly FormValidationError[]
  readonly firstInvalidControlId: string | null
  readonly valid: boolean
  readonly visibleControlIds: readonly string[]
}

type FormControl = Form['controls'][string]
type FieldCondition = FormControl['conditions'][number]['conditions'][number]

function orderedControlIds(form: Form): readonly string[] {
  const ordered = form.steps.flatMap((step) => step.controlIds)
  const seen = new Set(ordered)
  return [...ordered, ...Object.keys(form.controls).filter((id) => !seen.has(id))]
}

function isEmpty(value: FormRuntimeValue): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

function deepEqual(left: JsonValue | undefined, right: JsonValue): boolean {
  if (left === right) return true
  if (left === undefined) return false
  return JSON.stringify(left) === JSON.stringify(right)
}

function containsValue(value: FormRuntimeValue, expected: JsonValue): boolean {
  if (typeof value === 'string' && typeof expected === 'string') return value.includes(expected)
  if (Array.isArray(value)) return value.some((item) => deepEqual(item, expected))
  return false
}

function numeric(value: FormRuntimeValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function conditionMatches(condition: FieldCondition, value: FormRuntimeValue): boolean {
  switch (condition.operator) {
    case 'equals': return deepEqual(value, condition.value)
    case 'not-equals': return !deepEqual(value, condition.value)
    case 'contains': return containsValue(value, condition.value)
    case 'greater-than': {
      const left = numeric(value)
      const right = numeric(condition.value)
      return left !== null && right !== null && left > right
    }
    case 'less-than': {
      const left = numeric(value)
      const right = numeric(condition.value)
      return left !== null && right !== null && left < right
    }
    case 'exists': return !isEmpty(value)
  }
}

function fieldValue(form: Form, values: FormRuntimeValues, fieldId: string): FormRuntimeValue {
  for (const controlId of orderedControlIds(form)) {
    const control = form.controls[controlId]
    if (control?.mappedFieldId === fieldId) return values[controlId]
  }
  return undefined
}

export function isFormControlVisible(form: Form, control: FormControl, values: FormRuntimeValues): boolean {
  if (control.conditions.length === 0) return true
  return control.conditions.some((group) => {
    const matches = group.conditions.map((condition) => conditionMatches(condition, fieldValue(form, values, condition.fieldId)))
    return group.operator === 'all' ? matches.every(Boolean) : matches.some(Boolean)
  })
}

function error(control: FormControl, code: FormValidationErrorCode, message: string): FormValidationError {
  return { code, controlId: control.id, message }
}

function optionMatches(field: FieldDefinition, value: JsonValue): boolean {
  return field.options.some((option) => deepEqual(option.value, value))
}

function validateType(control: FormControl, value: JsonValue, field?: FieldDefinition): FormValidationError[] {
  const errors: FormValidationError[] = []
  const textTypes = new Set<FormControl['type']>(['text', 'textarea', 'rich-text', 'email', 'phone', 'url', 'date', 'time', 'datetime', 'color'])
  if (textTypes.has(control.type) && typeof value !== 'string') {
    errors.push(error(control, 'invalid-type', `${control.label} debe contener texto.`))
    return errors
  }
  if ((control.type === 'number' || control.type === 'currency') && numeric(value) === null) {
    errors.push(error(control, 'invalid-type', `${control.label} debe ser un número válido.`))
    return errors
  }
  if (control.type === 'switch' && typeof value !== 'boolean') {
    errors.push(error(control, 'invalid-type', `${control.label} debe estar activado o desactivado.`))
    return errors
  }
  if (control.type === 'group' && (Array.isArray(value) || typeof value !== 'object' || value === null)) {
    errors.push(error(control, 'invalid-type', `${control.label} debe contener un grupo de valores.`))
    return errors
  }
  if ((control.type === 'repeater' || control.type === 'gallery') && !Array.isArray(value)) {
    errors.push(error(control, 'invalid-type', `${control.label} debe contener una lista de valores.`))
    return errors
  }
  if (field && (control.type === 'select' || control.type === 'radio') && !optionMatches(field, value)) {
    errors.push(error(control, 'invalid-option', `${control.label} debe usar una opción disponible.`))
  }
  if (field && control.type === 'checkbox' && Array.isArray(value) && value.some((item) => !optionMatches(field, item))) {
    errors.push(error(control, 'invalid-option', `${control.label} contiene una opción no disponible.`))
  }
  return errors
}

function validateFormat(control: FormControl, value: JsonValue): FormValidationError[] {
  if (typeof value !== 'string' || value === '') return []
  if (control.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return [error(control, 'invalid-format', `${control.label} debe contener un correo electrónico válido.`)]
  }
  if (control.type === 'url') {
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
    } catch {
      return [error(control, 'invalid-format', `${control.label} debe contener una URL http o https válida.`)]
    }
  }
  if (control.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) {
    return [error(control, 'invalid-format', `${control.label} debe usar un color en formato #RRGGBB.`)]
  }
  if (control.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return [error(control, 'invalid-format', `${control.label} debe usar una fecha válida.`)]
  }
  if (control.type === 'time' && !/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
    return [error(control, 'invalid-format', `${control.label} debe usar una hora válida.`)]
  }
  if (control.type === 'datetime' && Number.isNaN(Date.parse(value))) {
    return [error(control, 'invalid-format', `${control.label} debe usar una fecha y hora válidas.`)]
  }
  return []
}

function validateRules(control: FormControl, value: JsonValue, field?: FieldDefinition): FormValidationError[] {
  if (!field) return []
  const rules = field.validation
  const errors: FormValidationError[] = []
  const length = typeof value === 'string' || Array.isArray(value) ? value.length : null
  if (rules.minLength !== null && length !== null && length < rules.minLength) {
    errors.push(error(control, 'min-length', `${control.label} necesita al menos ${rules.minLength} caracteres o elementos.`))
  }
  if (rules.maxLength !== null && length !== null && length > rules.maxLength) {
    errors.push(error(control, 'max-length', `${control.label} admite como máximo ${rules.maxLength} caracteres o elementos.`))
  }
  const numberValue = numeric(value)
  if (rules.min !== null && numberValue !== null && numberValue < rules.min) {
    errors.push(error(control, 'min', `${control.label} debe ser igual o mayor que ${rules.min}.`))
  }
  if (rules.max !== null && numberValue !== null && numberValue > rules.max) {
    errors.push(error(control, 'max', `${control.label} debe ser igual o menor que ${rules.max}.`))
  }
  if (rules.pattern !== null && typeof value === 'string') {
    try {
      if (!new RegExp(rules.pattern).test(value)) errors.push(error(control, 'invalid-pattern', `${control.label} no cumple el formato requerido.`))
    } catch {
      errors.push(error(control, 'invalid-pattern', `${control.label} tiene una regla de formato inválida.`))
    }
  }
  return errors
}

export function validateFormControl(
  form: Form,
  cms: CmsBackend,
  control: FormControl,
  value: FormRuntimeValue,
  values: FormRuntimeValues,
): readonly FormValidationError[] {
  if (!isFormControlVisible(form, control, values)) return []
  const field = control.mappedFieldId ? cms.fields[control.mappedFieldId] : undefined
  const required = control.required || field?.required === true
  if (isEmpty(value)) return required ? [error(control, 'required', `${control.label} es obligatorio.`)] : []
  return [
    ...validateType(control, value as JsonValue, field),
    ...validateFormat(control, value as JsonValue),
    ...validateRules(control, value as JsonValue, field),
  ]
}

export function validateFormSubmission(form: Form, cms: CmsBackend, values: FormRuntimeValues): FormValidationResult {
  const controlStates: Record<string, FormControlRuntimeState> = {}
  const errors: FormValidationError[] = []
  const visibleControlIds: string[] = []

  for (const controlId of orderedControlIds(form)) {
    const control = form.controls[controlId]
    if (!control) continue
    const visible = isFormControlVisible(form, control, values)
    const controlErrors = visible ? validateFormControl(form, cms, control, values[controlId], values) : []
    if (visible) visibleControlIds.push(controlId)
    errors.push(...controlErrors)
    controlStates[controlId] = { controlId, errors: controlErrors, visible }
  }

  return {
    controlStates,
    errors,
    firstInvalidControlId: errors[0]?.controlId ?? null,
    valid: errors.length === 0,
    visibleControlIds,
  }
}
