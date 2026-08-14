import type { BackendScreenId, ContentTypeId, FieldDefinitionId, MenuId, MenuItemId, UserId } from './identity'
import type { CmsBackend, FieldDefinition, MenuItem, Role, User } from './cms-schema'

export type ContentPermission = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'moderate'
export type FieldAccess = 'readable' | 'editable'

export const RBAC_CAPABILITIES = [
  'settings.manage',
  'themes.manage',
  'content.manage',
  'content.export',
  'dashboard.manage',
  'audit.view',
  'audit.export',
] as const

export const DEFAULT_ROLE_TEMPLATES = [
  { capabilities: RBAC_CAPABILITIES, name: 'Administrador', slug: 'administrator' },
  { capabilities: ['themes.manage', 'dashboard.manage'], name: 'Diseñador', slug: 'designer' },
  { capabilities: ['content.manage'], name: 'Editor', slug: 'editor' },
  { capabilities: ['content.manage'], name: 'Autor', slug: 'author' },
  { capabilities: ['content.manage', 'dashboard.manage'], name: 'Gestor', slug: 'manager' },
  { capabilities: [], name: 'Colaborador', slug: 'contributor' },
  { capabilities: [], name: 'Cliente', slug: 'client' },
  { capabilities: [], name: 'Usuario registrado', slug: 'registered-user' },
] as const

function activeRoles(cms: CmsBackend, userId: UserId | null): readonly Role[] {
  if (!userId) return []
  const user = cms.users[userId]
  if (!user || user.status !== 'active') return []
  return user.roleIds.flatMap((roleId) => {
    const role = cms.roles[roleId]
    return role ? [role] : []
  })
}

/**
 * All authorization decisions are deny-by-default.  A caller must supply an
 * active user and at least one of that user's roles must explicitly grant the
 * requested capability, route, screen, content action, or field access.
 */
export function canUseCapability(cms: CmsBackend, userId: UserId | null, capability: string): boolean {
  return activeRoles(cms, userId).some((role) => role.capabilities.includes(capability))
}

export function canAccessRoute(cms: CmsBackend, userId: UserId | null, route: string): boolean {
  return activeRoles(cms, userId).some((role) => role.routes.includes(route))
}

export function canAccessScreen(cms: CmsBackend, userId: UserId | null, screenId: BackendScreenId): boolean {
  const screen = cms.backendScreens[screenId]
  if (!screen) return false
  return activeRoles(cms, userId).some((role) =>
    role.dashboardIds.includes(screenId)
    || (screen.allowedRoleIds.includes(role.id) && role.routes.includes(screen.route)),
  )
}

export function canManageContent(cms: CmsBackend, userId: UserId | null, contentTypeId: ContentTypeId, permission: ContentPermission): boolean {
  return activeRoles(cms, userId).some((role) => role.contentTypes[contentTypeId]?.[permission] === true)
}

export function canAccessField(cms: CmsBackend, userId: UserId | null, fieldId: FieldDefinitionId, access: FieldAccess): boolean {
  return activeRoles(cms, userId).some((role) => role.fields[fieldId]?.[access] === true)
}

export function visibleFields(cms: CmsBackend, userId: UserId | null, fields: readonly FieldDefinition[]): readonly FieldDefinition[] {
  return fields.filter((field) => canAccessField(cms, userId, field.id, 'readable'))
}

export function editableFields(cms: CmsBackend, userId: UserId | null, fields: readonly FieldDefinition[]): readonly FieldDefinition[] {
  return fields.filter((field) => canAccessField(cms, userId, field.id, 'editable'))
}

export function canAccessMenuItem(cms: CmsBackend, userId: UserId | null, item: MenuItem): boolean {
  const roles = activeRoles(cms, userId)
  if (roles.length === 0) return false
  if (item.allowedRoleIds.length > 0 && !roles.some((role) => item.allowedRoleIds.includes(role.id))) return false
  return item.kind === 'screen' && item.screenId
    ? canAccessScreen(cms, userId, item.screenId)
    : canAccessRoute(cms, userId, item.target)
}

export function visibleMenuItemIds(cms: CmsBackend, userId: UserId | null, menuId: MenuId): readonly MenuItemId[] {
  const menu = cms.menus[menuId]
  if (!menu) return []
  return menu.rootItemIds.filter((itemId) => {
    const item = menu.items[itemId]
    return item ? canAccessMenuItem(cms, userId, item) : false
  })
}

export function activeUser(cms: CmsBackend, userId: UserId | null): User | null {
  if (!userId) return null
  const user = cms.users[userId]
  return user?.status === 'active' ? user : null
}
