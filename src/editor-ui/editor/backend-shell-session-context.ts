import type { BackendScreenId, ProjectStructure, Result } from '../../domain'
import type { AdminShellInput, AdminShellUpdate } from '../../domain/project/backend-shell-engine'
import { useEditorProject, type EditorProjectSession } from './editor-project-context'

export interface BackendShellSession {
  createAdminShell(input: AdminShellInput): Promise<Result<ProjectStructure, string>>
  updateAdminShell(screenId: BackendScreenId, patch: AdminShellUpdate): Promise<Result<ProjectStructure, string>>
  deleteAdminShell(screenId: BackendScreenId): Promise<Result<ProjectStructure, string>>
}

export function requireBackendShellSession(session: EditorProjectSession): EditorProjectSession & BackendShellSession {
  const candidate = session as EditorProjectSession & Partial<BackendShellSession>
  if (
    typeof candidate.createAdminShell !== 'function'
    || typeof candidate.updateAdminShell !== 'function'
    || typeof candidate.deleteAdminShell !== 'function'
  ) throw new Error('La sesión actual no ofrece la capacidad de administración visual.')
  return candidate as EditorProjectSession & BackendShellSession
}

export function useBackendShellSession(): BackendShellSession {
  return requireBackendShellSession(useEditorProject())
}
