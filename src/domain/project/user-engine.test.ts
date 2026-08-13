import { describe, expect, it } from 'vitest'
import { STARTER_PROJECT_STRUCTURE } from '../../editor-ui/editor/starter-project-structure'
import { parseRoleId, parseUserId } from './identity'
import { createRole } from './role-engine'
import { createUser, deleteUser, updateUser } from './user-engine'

const roleId = parseRoleId('94000000-0000-4000-8000-000000000001')
const userId = parseUserId('95000000-0000-4000-8000-000000000001')

function person() { return { displayName: 'Ana', email: 'ana@example.com', id: userId, roleIds: [roleId], status: 'active' as const } }

describe('M12.4 user engine', () => {
  it('crea y actualiza una persona con roles válidos', () => {
    const roles = createRole(STARTER_PROJECT_STRUCTURE, { capabilities: [], contentTypes: {}, dashboardIds: [], fields: {}, id: roleId, name: 'Cliente', routes: [], slug: 'client' })
    if (!roles.ok) throw new Error(roles.error)
    const created = createUser(roles.value, person())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(updateUser(created.value, userId, { displayName: 'Ana López' })).toMatchObject({ ok: true, value: { cms: { users: { [userId]: { displayName: 'Ana López' } } } } })
  })

  it('rechaza personas con correo duplicado', () => {
    const roles = createRole(STARTER_PROJECT_STRUCTURE, { capabilities: [], contentTypes: {}, dashboardIds: [], fields: {}, id: roleId, name: 'Cliente', routes: [], slug: 'client' })
    if (!roles.ok) throw new Error(roles.error)
    const created = createUser(roles.value, person())
    if (!created.ok) throw new Error(created.error)
    const duplicate = createUser(created.value, { ...person(), id: parseUserId('95000000-0000-4000-8000-000000000002') })
    expect(duplicate).toMatchObject({ ok: false, error: 'Ya existe una persona con ese correo electrónico.' })
    expect(deleteUser(created.value, userId).ok).toBe(true)
  })
})
