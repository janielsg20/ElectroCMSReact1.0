import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import type { BackendScreen } from './cms-schema'
import type { BackendScreenId, ContentTypeId, FormId, QueryId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type AdminStructuredViewKind = Extract<BackendScreen['kind'], 'table' | 'form' | 'detail' | 'calendar' | 'kanban' | 'chart' | 'metrics' | 'listing'>

export interface AdminViewBindingPatch {
  readonly contentTypeId: ContentTypeId
  readonly formId: FormId | null
  readonly kind: AdminStructuredViewKind
  readonly queryId: QueryId | null
}

export type AdminViewBindingDiagnosticCode =
  | 'screen-not-found'
  | 'content-type-not-found'
  | 'query-not-found'
  | 'form-not-found'
  | 'query-content-type-mismatch'
  | 'form-content-type-mismatch'
  | 'invalid-project'

export interface AdminViewBindingDiagnostic {
  readonly code: AdminViewBindingDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

function diagnostic(code: AdminViewBindingDiagnosticCode, message: string, path: readonly (string | number)[]): AdminViewBindingDiagnostic {
  return { code, message, path }
}

export function bindAdminStructuredView(
  structure: ProjectStructure,
  screenId: BackendScreenId,
  patch: AdminViewBindingPatch,
): Result<ProjectStructure, readonly AdminViewBindingDiagnostic[]> {
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  const screen = cms.backendScreens[screenId]
  if (!screen) return failure([diagnostic('screen-not-found', 'La pantalla administrativa ya no existe.', ['cms', 'backendScreens', screenId])])
  const contentType = cms.contentTypes[patch.contentTypeId]
  if (!contentType) return failure([diagnostic('content-type-not-found', 'El tipo de contenido elegido ya no existe.', ['cms', 'backendScreens', screenId, 'contentTypeId'])])

  const query = patch.queryId ? cms.queries[patch.queryId] : undefined
  if (patch.queryId && !query) return failure([diagnostic('query-not-found', 'La vista guardada elegida ya no existe.', ['cms', 'backendScreens', screenId, 'queryId'])])
  if (query && query.contentTypeId !== contentType.id) return failure([diagnostic('query-content-type-mismatch', 'La vista guardada debe consultar el mismo tipo de contenido.', ['cms', 'backendScreens', screenId, 'queryId'])])

  const form = patch.formId ? cms.forms[patch.formId] : undefined
  if (patch.formId && !form) return failure([diagnostic('form-not-found', 'El formulario elegido ya no existe.', ['cms', 'backendScreens', screenId, 'formId'])])
  if (form?.contentTypeId && form.contentTypeId !== contentType.id) return failure([diagnostic('form-content-type-mismatch', 'El formulario debe editar el mismo tipo de contenido.', ['cms', 'backendScreens', screenId, 'formId'])])

  cms.backendScreens[screenId] = {
    ...screen,
    contentTypeId: contentType.id,
    formId: patch.formId,
    kind: patch.kind,
    queryId: patch.queryId,
  }
  next.cms = cms

  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) return failure(cmsValidation.error.map((issue) => diagnostic('invalid-project', issue.message, ['cms', ...issue.path])))
  const validated = validateProjectStructure({ ...next, cms: cmsValidation.value })
  return validated.ok
    ? success(validated.value)
    : failure(validated.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}
