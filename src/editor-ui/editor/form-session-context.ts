import type { Form, FormId, ProjectStructure, Result } from '../../domain'
import type {
  FormControl,
  FormControlEditablePatch,
  FormEditablePatch,
} from '../../domain/project/form-builder-engine'
import { useEditorProject, type EditorProjectSession } from './editor-project-context'

export interface FormSession {
  createForm(form: Form): Promise<Result<ProjectStructure, string>>
  updateForm(formId: FormId, patch: FormEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteForm(formId: FormId): Promise<Result<ProjectStructure, string>>
  addFormControl(formId: FormId, stepId: string, control: FormControl, position?: number): Promise<Result<ProjectStructure, string>>
  updateFormControl(formId: FormId, controlId: string, patch: FormControlEditablePatch): Promise<Result<ProjectStructure, string>>
  reorderFormControl(formId: FormId, controlId: string, position: number): Promise<Result<ProjectStructure, string>>
  removeFormControl(formId: FormId, controlId: string): Promise<Result<ProjectStructure, string>>
}

export function requireFormSession(session: EditorProjectSession): EditorProjectSession & FormSession {
  const candidate = session as EditorProjectSession & Partial<FormSession>
  if (
    typeof candidate.createForm !== 'function'
    || typeof candidate.updateForm !== 'function'
    || typeof candidate.deleteForm !== 'function'
    || typeof candidate.addFormControl !== 'function'
    || typeof candidate.updateFormControl !== 'function'
    || typeof candidate.reorderFormControl !== 'function'
    || typeof candidate.removeFormControl !== 'function'
  ) throw new Error('La sesión actual no ofrece la capacidad de formularios.')
  return candidate as EditorProjectSession & FormSession
}

export function useFormSession(): FormSession {
  return requireFormSession(useEditorProject())
}
