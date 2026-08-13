import type { ProjectStructure, Result, Role, RoleId } from '../../domain'
import type { RoleEditablePatch } from '../../domain/project/role-engine'
import type { RoleMutationSession } from '../../editor-project-role-session'
import { useEditorProject, type EditorProjectSession } from './editor-project-context'

export type RoleSession = RoleMutationSession

export function requireRoleSession(session: EditorProjectSession): EditorProjectSession & RoleSession {
  const candidate = session as EditorProjectSession & Partial<RoleSession>
  if (
    typeof candidate.createRole !== 'function'
    || typeof candidate.updateRole !== 'function'
    || typeof candidate.deleteRole !== 'function'
  ) {
    throw new Error('La sesión actual no ofrece gestión persistente de roles.')
  }
  return candidate as EditorProjectSession & RoleSession
}

export function useRoleSession(): {
  createRole(role: Role): Promise<Result<ProjectStructure, string>>
  updateRole(roleId: RoleId, patch: RoleEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteRole(roleId: RoleId): Promise<Result<ProjectStructure, string>>
} {
  return requireRoleSession(useEditorProject())
}
