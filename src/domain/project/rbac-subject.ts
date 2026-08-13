import type { CmsBackend, Role } from './cms-schema'
import type { RoleId } from './identity'
import type { RbacDecision, RbacDecisionCode, RbacSubject } from './rbac-types'

export function rbacDecision(allowed: boolean, code: RbacDecisionCode, message: string, matchedRoleIds: readonly RoleId[] = []): RbacDecision {
  return { allowed, code, matchedRoleIds, message }
}

export function rbacSubjectRoles(cms: CmsBackend, subject: RbacSubject): readonly Role[] {
  return [...new Set(subject.roleIds)].flatMap((roleId) => cms.roles[roleId] ? [cms.roles[roleId]] : [])
}

export function rbacRoleIds(roles: readonly Role[]): readonly RoleId[] {
  return roles.map((role) => role.id)
}

export function rbacDenyNoRoles(): RbacDecision {
  return rbacDecision(false, 'deny-by-default', 'Acceso denegado por defecto: no hay un rol válido en el contexto actual.')
}
