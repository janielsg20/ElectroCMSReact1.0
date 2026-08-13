import { describe, expect, it } from 'vitest'
import { parseMenuId, parseMenuItemId, parseRoleId, parseUserId } from './identity'
import { createRole, deleteRole, updateRole } from './role-engine'
import { STARTER_PROJECT_STRUCTURE } from '../../editor-ui/editor/starter-project-structure'

const roleId = parseRoleId('90000000-0000-4000-8000-000000000001')

function role() {
  return { capabilities: ['content.manage'], contentTypes: {}, dashboardIds: [], fields: {}, id: roleId, name: 'Editor de contenido', routes: ['/admin/content'], slug: 'content-editor' }
}

describe('M12.3 role engine', () => {
  it('crea y actualiza un rol validado en el CMS canónico', () => {
    const created = createRole(STARTER_PROJECT_STRUCTURE, role())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.value.cms?.roles[roleId]).toMatchObject({ name: 'Editor de contenido', slug: 'content-editor' })
    const updated = updateRole(created.value, roleId, { capabilities: ['content.manage', 'content.export'], name: 'Editor senior' })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.cms?.roles[roleId]?.capabilities).toEqual(['content.manage', 'content.export'])
  })

  it('no elimina un rol que sigue asignado a una persona', () => {
    const created = createRole(STARTER_PROJECT_STRUCTURE, role())
    if (!created.ok) throw new Error(created.error)
    const withUser = structuredClone(created.value)
    const userId = parseUserId('91000000-0000-4000-8000-000000000001')
    if (!withUser.cms) throw new Error('CMS missing')
    withUser.cms.users[userId] = { displayName: 'Ana', email: 'ana@example.com', id: userId, roleIds: [roleId], status: 'active' }
    const deleted = deleteRole(withUser, roleId)
    expect(deleted).toMatchObject({ ok: false, error: 'No puedes eliminar un rol asignado a un usuario.' })
  })

  it('no elimina un rol que sigue usándose en un menú', () => {
    const created = createRole(STARTER_PROJECT_STRUCTURE, role())
    if (!created.ok) throw new Error(created.error)
    const referenced = structuredClone(created.value)
    if (!referenced.cms) throw new Error('CMS missing')
    const menuId = parseMenuId('92000000-0000-4000-8000-000000000001')
    const itemId = parseMenuItemId('93000000-0000-4000-8000-000000000001')
    referenced.cms.menus[menuId] = { id: menuId, items: { [itemId]: { allowedRoleIds: [roleId], childIds: [], id: itemId, kind: 'route', label: 'Área privada', screenId: null, target: '/admin' } }, name: 'Principal', rootItemIds: [itemId] }
    const deleted = deleteRole(referenced, roleId)
    expect(deleted).toMatchObject({ ok: false, error: 'No puedes eliminar un rol que sigue usándose en permisos, menús o paneles.' })
  })
})
