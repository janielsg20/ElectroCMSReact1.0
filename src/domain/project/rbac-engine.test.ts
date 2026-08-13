import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { parseBackendScreenId, parseContentTypeId, parseFieldDefinitionId, parseMenuId, parseMenuItemId, parseRoleId, parseUserId } from './identity'
import { activeUser, canAccessField, canAccessMenuItem, canAccessRoute, canAccessScreen, canManageContent, canUseCapability, DEFAULT_ROLE_TEMPLATES, editableFields, RBAC_CAPABILITIES, visibleFields, visibleMenuItemIds } from './rbac-engine'

const roleId = parseRoleId('10000000-0000-4000-8000-000000000001')
const otherRoleId = parseRoleId('10000000-0000-4000-8000-000000000002')
const userId = parseUserId('20000000-0000-4000-8000-000000000001')
const suspendedUserId = parseUserId('20000000-0000-4000-8000-000000000002')
const contentTypeId = parseContentTypeId('30000000-0000-4000-8000-000000000001')
const fieldId = parseFieldDefinitionId('40000000-0000-4000-8000-000000000001')
const screenId = parseBackendScreenId('50000000-0000-4000-8000-000000000001')
const menuId = parseMenuId('70000000-0000-4000-8000-000000000001')
const menuItemId = parseMenuItemId('80000000-0000-4000-8000-000000000001')

function fixture() {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.roles[roleId] = {
    capabilities: ['content.export'], contentTypes: { [contentTypeId]: { create: true, delete: false, moderate: false, publish: false, read: true, update: true } }, dashboardIds: [screenId],
    fields: { [fieldId]: { editable: true, readable: true } }, id: roleId, name: 'Editor', routes: ['/admin/orders'], slug: 'editor',
  }
  cms.roles[otherRoleId] = { capabilities: [], contentTypes: {}, dashboardIds: [], fields: {}, id: otherRoleId, name: 'Invitado', routes: [], slug: 'guest' }
  cms.users[userId] = { displayName: 'Ana', email: 'ana@example.com', id: userId, roleIds: [roleId], status: 'active' }
  cms.users[suspendedUserId] = { displayName: 'Luis', email: 'luis@example.com', id: suspendedUserId, roleIds: [roleId], status: 'suspended' }
  cms.backendScreens[screenId] = { allowedRoleIds: [], contentTypeId: null, documentId: '60000000-0000-4000-8000-000000000001' as never, formId: null, id: screenId, kind: 'table', name: 'Pedidos', queryId: null, route: '/admin/orders' }
  cms.menus[menuId] = { id: menuId, items: { [menuItemId]: { allowedRoleIds: [], childIds: [], id: menuItemId, kind: 'screen', label: 'Pedidos', screenId, target: '/admin/orders' } }, name: 'Administración', rootItemIds: [menuItemId] }
  return cms
}

describe('M12.3 RBAC', () => {
  it('declara los ocho roles iniciales y las capacidades administrables', () => {
    expect(DEFAULT_ROLE_TEMPLATES.map((role) => role.name)).toEqual(['Administrador', 'Diseñador', 'Editor', 'Autor', 'Gestor', 'Colaborador', 'Cliente', 'Usuario registrado'])
    expect(RBAC_CAPABILITIES).toContain('content.export')
    expect(DEFAULT_ROLE_TEMPLATES[0].capabilities).toEqual(RBAC_CAPABILITIES)
  })

  it('deniega por defecto si falta usuario, rol activo o permiso explícito', () => {
    const cms = fixture()
    expect(canUseCapability(cms, null, 'content.export')).toBe(false)
    expect(canAccessRoute(cms, userId, '/admin/unknown')).toBe(false)
    expect(canManageContent(cms, userId, contentTypeId, 'delete')).toBe(false)
    expect(canAccessField(cms, userId, fieldId, 'readable')).toBe(true)
    expect(canUseCapability(cms, suspendedUserId, 'content.export')).toBe(false)
    expect(activeUser(cms, suspendedUserId)).toBeNull()
  })

  it('autoriza únicamente rutas, pantallas y acciones concedidas por el rol activo', () => {
    const cms = fixture()
    expect(canAccessRoute(cms, userId, '/admin/orders')).toBe(true)
    expect(canAccessScreen(cms, userId, screenId)).toBe(true)
    expect(canManageContent(cms, userId, contentTypeId, 'create')).toBe(true)
    expect(canManageContent(cms, userId, contentTypeId, 'update')).toBe(true)
    expect(canAccessField(cms, userId, fieldId, 'editable')).toBe(true)
    expect(canAccessScreen(cms, userId, parseBackendScreenId('50000000-0000-4000-8000-000000000002'))).toBe(false)
  })

  it('filtra navegación y campos antes de entregar datos a una vista', () => {
    const cms = fixture()
    const fields = [
      { id: fieldId, label: 'Título' },
      { id: parseFieldDefinitionId('40000000-0000-4000-8000-000000000002'), label: 'Privado' },
    ] as never
    expect(visibleFields(cms, userId, fields).map((field) => field.label)).toEqual(['Título'])
    expect(editableFields(cms, userId, fields).map((field) => field.label)).toEqual(['Título'])
    expect(canAccessMenuItem(cms, userId, cms.menus[menuId].items[menuItemId])).toBe(true)
    expect(visibleMenuItemIds(cms, userId, menuId)).toEqual([menuItemId])
    expect(visibleMenuItemIds(cms, null, menuId)).toEqual([])
  })
})
