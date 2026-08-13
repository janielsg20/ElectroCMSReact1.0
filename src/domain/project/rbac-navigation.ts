import type { CmsBackend } from './cms-schema'
import type { BackendScreenId } from './identity'
import { rbacDecision, rbacDenyNoRoles, rbacRoleIds, rbacSubjectRoles } from './rbac-subject'
import type { RbacDecision, RbacSubject } from './rbac-types'

export function routeMatches(pattern: string, route: string): boolean {
  if (pattern === route) return true
  if (!pattern.endsWith('/*')) return false
  const base = pattern.slice(0, -2).replace(/\/$/, '')
  return route === base || route.startsWith(`${base}/`)
}

export function authorizeRoute(cms: CmsBackend, subject: RbacSubject, route: string): RbacDecision {
  const roles = rbacSubjectRoles(cms, subject)
  if (roles.length === 0) return rbacDenyNoRoles()
  const allowed = roles.filter((role) => role.routes.some((pattern) => routeMatches(pattern, route)))
  return allowed.length > 0
    ? rbacDecision(true, 'allowed', `Ruta ${route} autorizada.`, rbacRoleIds(allowed))
    : rbacDecision(false, 'permission-denied', `Ningún rol concede acceso a ${route}.`)
}

export function authorizeScreen(cms: CmsBackend, subject: RbacSubject, screenId: BackendScreenId): RbacDecision {
  const screen = cms.backendScreens[screenId]
  if (!screen) return rbacDecision(false, 'resource-not-found', 'La pantalla administrativa no existe.')
  const roles = rbacSubjectRoles(cms, subject)
  if (roles.length === 0) return rbacDenyNoRoles()
  const allowed = roles.filter((role) => (
    screen.allowedRoleIds.includes(role.id)
    || role.dashboardIds.includes(screen.id)
    || role.routes.some((pattern) => routeMatches(pattern, screen.route))
  ))
  return allowed.length > 0
    ? rbacDecision(true, 'allowed', `Pantalla ${screen.name} autorizada.`, rbacRoleIds(allowed))
    : rbacDecision(false, 'permission-denied', `Ningún rol concede acceso a la pantalla ${screen.name}.`)
}
