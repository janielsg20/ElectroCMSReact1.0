import type { CmsBackend } from './cms-schema'
import type { ContentTypeId, FieldDefinitionId } from './identity'
import { rbacDecision, rbacDenyNoRoles, rbacRoleIds, rbacSubjectRoles } from './rbac-subject'
import type { RbacDecision, RbacSubject } from './rbac-types'

export type RbacContentAction = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'moderate'
export type RbacFieldAction = 'read' | 'edit'

export function authorizeCapability(cms: CmsBackend, subject: RbacSubject, capability: string): RbacDecision {
  const roles = rbacSubjectRoles(cms, subject)
  if (roles.length === 0) return rbacDenyNoRoles()
  const allowed = roles.filter((role) => role.capabilities.includes(capability))
  return allowed.length > 0
    ? rbacDecision(true, 'allowed', `Capacidad ${capability} autorizada.`, rbacRoleIds(allowed))
    : rbacDecision(false, 'permission-denied', `Ningún rol concede la capacidad ${capability}.`)
}

export function authorizeContentType(cms: CmsBackend, subject: RbacSubject, contentTypeId: ContentTypeId, action: RbacContentAction): RbacDecision {
  if (!cms.contentTypes[contentTypeId]) return rbacDecision(false, 'resource-not-found', 'El tipo de contenido no existe.')
  const roles = rbacSubjectRoles(cms, subject)
  if (roles.length === 0) return rbacDenyNoRoles()
  const allowed = roles.filter((role) => role.contentTypes[contentTypeId]?.[action] === true)
  return allowed.length > 0
    ? rbacDecision(true, 'allowed', `Acción ${action} autorizada para el tipo de contenido.`, rbacRoleIds(allowed))
    : rbacDecision(false, 'permission-denied', `Ningún rol concede ${action} sobre este tipo de contenido.`)
}

export function authorizeField(cms: CmsBackend, subject: RbacSubject, fieldId: FieldDefinitionId, action: RbacFieldAction): RbacDecision {
  const field = cms.fields[fieldId]
  if (!field) return rbacDecision(false, 'resource-not-found', 'El campo no existe.')
  const roles = rbacSubjectRoles(cms, subject)
  if (roles.length === 0) return rbacDenyNoRoles()
  const constrained = field.allowedRoleIds.length > 0 ? roles.filter((role) => field.allowedRoleIds.includes(role.id)) : roles
  const allowed = constrained.filter((role) => {
    const permission = role.fields[fieldId]
    return action === 'read' ? permission?.readable === true : permission?.editable === true
  })
  return allowed.length > 0
    ? rbacDecision(true, 'allowed', `Permiso ${action} autorizado para el campo.`, rbacRoleIds(allowed))
    : rbacDecision(false, 'permission-denied', `Ningún rol concede ${action} sobre este campo.`)
}
