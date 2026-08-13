import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { FormSchema, type CmsBackend, type Form } from './cms-schema'
import type { FormId } from './identity'
import type { JsonValue } from './project-envelope'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type FormControl = Form['controls'][string]
export type FormStep = Form['steps'][number]

export type FormBuilderDiagnosticCode =
  | 'form-not-found'
  | 'form-id-conflict'
  | 'form-name-conflict'
  | 'form-in-use'
  | 'step-not-found'
  | 'control-not-found'
  | 'control-id-conflict'
  | 'control-name-conflict'
  | 'invalid-control-position'
  | 'invalid-field-mapping'
  | 'invalid-condition-source'
  | 'last-control-in-step'
  | 'invalid-form'
  | 'invalid-cms'
  | 'invalid-project'

export interface FormBuilderDiagnostic {
  readonly code: FormBuilderDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type FormEditablePatch = Partial<Pick<Form,
  'name' | 'contentTypeId' | 'successMessage' | 'errorMessage'
>>
export type FormControlEditablePatch = Partial<Pick<FormControl,
  'name' | 'label' | 'type' | 'mappedFieldId' | 'required' | 'conditions'
>>

function diagnostic(
  code: FormBuilderDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): FormBuilderDiagnostic {
  return { code, message, path }
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

function formNameOwner(cms: CmsBackend, name: string, ignoredId?: FormId): Form | undefined {
  const expected = normalize(name)
  return Object.values(cms.forms).find((form) => form.id !== ignoredId && normalize(form.name) === expected)
}

function controlNameOwner(form: Form, name: string, ignoredId?: string): FormControl | undefined {
  const expected = normalize(name)
  return Object.values(form.controls).find((control) => control.id !== ignoredId && normalize(control.name) === expected)
}

function containsString(value: JsonValue | undefined, expected: string): boolean {
  if (value === expected) return true
  if (Array.isArray(value)) return value.some((entry) => containsString(entry, expected))
  if (value && typeof value === 'object') return Object.values(value).some((entry) => containsString(entry, expected))
  return false
}

function formDependencies(structure: ProjectStructure, formId: FormId): string[] {
  const dependencies: string[] = []
  const cms = projectCmsBackend(structure.cms)
  for (const screen of Object.values(cms.backendScreens)) {
    if (screen.formId === formId) dependencies.push(`pantalla ${screen.name}`)
  }
  for (const document of Object.values(structure.documents)) {
    for (const node of Object.values(document.nodes)) {
      if (containsString(node.properties, formId) || containsString(node.bindings, formId)) {
        dependencies.push(`${document.name} / ${node.name}`)
      }
    }
  }
  for (const component of Object.values(structure.globalComponents)) {
    for (const node of Object.values(component.nodes)) {
      if (containsString(node.properties, formId) || containsString(node.bindings, formId)) {
        dependencies.push(`${component.name} / ${node.name}`)
      }
    }
  }
  return [...new Set(dependencies)]
}

function mappingDiagnostics(cms: CmsBackend, form: Form): FormBuilderDiagnostic[] {
  const diagnostics: FormBuilderDiagnostic[] = []
  const mappedFieldIds = new Set(Object.values(form.controls).flatMap((control) => control.mappedFieldId ? [control.mappedFieldId] : []))
  for (const control of Object.values(form.controls)) {
    if (control.mappedFieldId) {
      if (!form.contentTypeId) {
        diagnostics.push(diagnostic(
          'invalid-field-mapping',
          'Selecciona un tipo de contenido antes de mapear controles a campos.',
          ['cms', 'forms', form.id, 'controls', control.id, 'mappedFieldId'],
        ))
      } else {
        const field = cms.fields[control.mappedFieldId]
        if (!field || field.owner.kind !== 'content-type' || field.owner.contentTypeId !== form.contentTypeId) {
          diagnostics.push(diagnostic(
            'invalid-field-mapping',
            'El campo mapeado debe pertenecer al tipo de contenido del formulario.',
            ['cms', 'forms', form.id, 'controls', control.id, 'mappedFieldId'],
          ))
        } else if (field.type !== control.type) {
          diagnostics.push(diagnostic(
            'invalid-field-mapping',
            `El control ${control.label} (${control.type}) solo puede mapearse a un campo compatible del mismo tipo.`,
            ['cms', 'forms', form.id, 'controls', control.id, 'mappedFieldId'],
          ))
        }
      }
    }

    for (const group of control.conditions) {
      for (const condition of group.conditions) {
        if (!mappedFieldIds.has(condition.fieldId)) {
          diagnostics.push(diagnostic(
            'invalid-condition-source',
            'Cada condición debe usar un campo que esté conectado a otro control del formulario.',
            ['cms', 'forms', form.id, 'controls', control.id, 'conditions'],
          ))
        } else if (control.mappedFieldId === condition.fieldId) {
          diagnostics.push(diagnostic(
            'invalid-condition-source',
            'Un campo no puede decidir su propia visibilidad.',
            ['cms', 'forms', form.id, 'controls', control.id, 'conditions'],
          ))
        }
      }
    }
  }
  return diagnostics
}

function validateCandidate(
  structure: ProjectStructure,
  cms: CmsBackend,
  form: Form,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const mappings = mappingDiagnostics(cms, form)
  if (mappings.length > 0) return failure(mappings)

  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic(
      'invalid-cms',
      issue.message,
      ['cms', ...issue.path],
    )))
  }

  const candidate = validateProjectStructure({ ...structuredClone(structure), cms: cmsValidation.value })
  if (!candidate.ok) {
    return failure(candidate.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
  }
  return success(candidate.value)
}

function parsedForm(input: unknown, formIdHint: string): Result<Form, readonly FormBuilderDiagnostic[]> {
  const parsed = FormSchema.safeParse(input)
  if (parsed.success) return success(parsed.data)
  return failure(parsed.error.issues.map((issue) => diagnostic(
    'invalid-form',
    issue.message,
    ['cms', 'forms', formIdHint, ...issue.path.map(String)],
  )))
}

function currentForm(
  structure: ProjectStructure,
  formId: FormId,
): Result<{ readonly cms: CmsBackend; readonly form: Form }, readonly FormBuilderDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const form = cms.forms[formId]
  return form
    ? success({ cms, form })
    : failure([diagnostic('form-not-found', 'El formulario ya no existe.', ['cms', 'forms', formId])])
}

export function listForms(structure: ProjectStructure): readonly Form[] {
  return Object.values(projectCmsBackend(structure.cms).forms)
    .sort((left, right) => left.name === right.name
      ? (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
      : left.name < right.name ? -1 : 1)
}

export function createForm(
  structure: ProjectStructure,
  input: Form,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const parsed = parsedForm(input, input.id)
  if (!parsed.ok) return parsed
  const cms = projectCmsBackend(structure.cms)
  const form = structuredClone(parsed.value)
  if (cms.forms[form.id]) {
    return failure([diagnostic('form-id-conflict', 'Ya existe un formulario con ese ID.', ['cms', 'forms', form.id])])
  }
  const owner = formNameOwner(cms, form.name)
  if (owner) {
    return failure([diagnostic('form-name-conflict', `Ya existe un formulario llamado ${owner.name}.`, ['cms', 'forms', form.id, 'name'])])
  }
  cms.forms[form.id] = form
  return validateCandidate(structure, cms, form)
}

export function updateForm(
  structure: ProjectStructure,
  formId: FormId,
  patch: FormEditablePatch,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const current = currentForm(structure, formId)
  if (!current.ok) return current
  const parsed = parsedForm({ ...current.value.form, ...structuredClone(patch), id: formId }, formId)
  if (!parsed.ok) return parsed
  const owner = formNameOwner(current.value.cms, parsed.value.name, formId)
  if (owner) {
    return failure([diagnostic('form-name-conflict', `Ya existe un formulario llamado ${owner.name}.`, ['cms', 'forms', formId, 'name'])])
  }
  current.value.cms.forms[formId] = parsed.value
  return validateCandidate(structure, current.value.cms, parsed.value)
}

export function deleteForm(
  structure: ProjectStructure,
  formId: FormId,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const current = currentForm(structure, formId)
  if (!current.ok) return current
  const dependencies = formDependencies(structure, formId)
  if (dependencies.length > 0) {
    return failure([diagnostic(
      'form-in-use',
      `El formulario está vinculado a ${dependencies.slice(0, 3).join(', ')}${dependencies.length > 3 ? '…' : ''}.`,
      ['cms', 'forms', formId],
    )])
  }
  delete current.value.cms.forms[formId]
  const cmsValidation = validateCmsBackend(current.value.cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic('invalid-cms', issue.message, ['cms', ...issue.path])))
  }
  const candidate = validateProjectStructure({ ...structuredClone(structure), cms: cmsValidation.value })
  return candidate.ok
    ? success(candidate.value)
    : failure(candidate.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}

export function addFormControl(
  structure: ProjectStructure,
  formId: FormId,
  stepId: string,
  input: FormControl,
  position?: number,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const current = currentForm(structure, formId)
  if (!current.ok) return current
  const form = structuredClone(current.value.form)
  const stepIndex = form.steps.findIndex((step) => step.id === stepId)
  if (stepIndex < 0) return failure([diagnostic('step-not-found', 'El paso ya no existe.', ['cms', 'forms', formId, 'steps', stepId])])
  if (form.controls[input.id]) return failure([diagnostic('control-id-conflict', 'Ya existe un control con ese ID.', ['cms', 'forms', formId, 'controls', input.id])])
  const nameOwner = controlNameOwner(form, input.name)
  if (nameOwner) return failure([diagnostic('control-name-conflict', `Ya existe un control llamado ${nameOwner.name}.`, ['cms', 'forms', formId, 'controls', input.id, 'name'])])

  const step = form.steps[stepIndex]
  const target = position ?? step.controlIds.length
  if (!Number.isInteger(target) || target < 0 || target > step.controlIds.length) {
    return failure([diagnostic('invalid-control-position', 'La posición del control no es válida.', ['cms', 'forms', formId, 'steps', stepIndex, 'controlIds'])])
  }
  form.controls[input.id] = structuredClone(input)
  step.controlIds.splice(target, 0, input.id)

  const parsed = parsedForm(form, formId)
  if (!parsed.ok) return parsed
  current.value.cms.forms[formId] = parsed.value
  return validateCandidate(structure, current.value.cms, parsed.value)
}

export function updateFormControl(
  structure: ProjectStructure,
  formId: FormId,
  controlId: string,
  patch: FormControlEditablePatch,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const current = currentForm(structure, formId)
  if (!current.ok) return current
  const form = structuredClone(current.value.form)
  const control = form.controls[controlId]
  if (!control) return failure([diagnostic('control-not-found', 'El control ya no existe.', ['cms', 'forms', formId, 'controls', controlId])])
  const next = { ...control, ...structuredClone(patch), id: controlId }
  const nameOwner = controlNameOwner(form, next.name, controlId)
  if (nameOwner) return failure([diagnostic('control-name-conflict', `Ya existe un control llamado ${nameOwner.name}.`, ['cms', 'forms', formId, 'controls', controlId, 'name'])])
  form.controls[controlId] = next

  const parsed = parsedForm(form, formId)
  if (!parsed.ok) return parsed
  current.value.cms.forms[formId] = parsed.value
  return validateCandidate(structure, current.value.cms, parsed.value)
}

export function reorderFormControl(
  structure: ProjectStructure,
  formId: FormId,
  controlId: string,
  position: number,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const current = currentForm(structure, formId)
  if (!current.ok) return current
  const form = structuredClone(current.value.form)
  if (!form.controls[controlId]) return failure([diagnostic('control-not-found', 'El control ya no existe.', ['cms', 'forms', formId, 'controls', controlId])])
  const stepIndex = form.steps.findIndex((step) => step.controlIds.includes(controlId))
  if (stepIndex < 0) return failure([diagnostic('control-not-found', 'El control no pertenece a ningún paso.', ['cms', 'forms', formId, 'controls', controlId])])
  const step = form.steps[stepIndex]
  if (!Number.isInteger(position) || position < 0 || position >= step.controlIds.length) {
    return failure([diagnostic('invalid-control-position', 'La posición del control no es válida.', ['cms', 'forms', formId, 'steps', stepIndex, 'controlIds'])])
  }
  const source = step.controlIds.indexOf(controlId)
  step.controlIds.splice(source, 1)
  step.controlIds.splice(position, 0, controlId)

  const parsed = parsedForm(form, formId)
  if (!parsed.ok) return parsed
  current.value.cms.forms[formId] = parsed.value
  return validateCandidate(structure, current.value.cms, parsed.value)
}

export function removeFormControl(
  structure: ProjectStructure,
  formId: FormId,
  controlId: string,
): Result<ProjectStructure, readonly FormBuilderDiagnostic[]> {
  const current = currentForm(structure, formId)
  if (!current.ok) return current
  const form = structuredClone(current.value.form)
  if (!form.controls[controlId]) return failure([diagnostic('control-not-found', 'El control ya no existe.', ['cms', 'forms', formId, 'controls', controlId])])
  const stepIndex = form.steps.findIndex((step) => step.controlIds.includes(controlId))
  if (stepIndex < 0) return failure([diagnostic('control-not-found', 'El control no pertenece a ningún paso.', ['cms', 'forms', formId, 'controls', controlId])])
  const step = form.steps[stepIndex]
  if (step.controlIds.length <= 1) {
    return failure([diagnostic(
      'last-control-in-step',
      'Cada paso debe conservar al menos un control según el contrato canónico actual.',
      ['cms', 'forms', formId, 'steps', stepIndex, 'controlIds'],
    )])
  }
  step.controlIds = step.controlIds.filter((id) => id !== controlId)
  delete form.controls[controlId]

  const parsed = parsedForm(form, formId)
  if (!parsed.ok) return parsed
  current.value.cms.forms[formId] = parsed.value
  return validateCandidate(structure, current.value.cms, parsed.value)
}
