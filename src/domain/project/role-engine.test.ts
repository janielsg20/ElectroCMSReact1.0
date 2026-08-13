import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { parseContentTypeId, parseDocumentId, parseRoleId, parseUserId } from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import type { Role } from './cms-schema'
import { createRole, deleteRole, listRoles, updateRole } from './role-engine'

const documentId = parseDocumentId('e1000000-0000-4000-8000-000000000001')
const contentTypeId = parseContentTypeId('e2000000-0000-4000-8000-000000000001')
const roleId = parseRoleId('e3000000-0000-4000-8000-000000000001')
const secondRoleId = parseRoleId('e3000000-0000-4000-8000-000000000002')
const userId = parseUserId('e4000000-0000-4000-8000-000000000001')

function structure(): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: [],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: contentTypeId,
    order: 0,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: [],
    taxonomyIds: [],
  }
  return ProjectStructureSchema.parse({
    breakpoints: structuredClone(DEFAULT_BREAKPOINTS),
    cms,
    documents: {
      [documentId]: { conditions: [], id: documentId, kind: 'page', name: 'Inicio', nodes: {}, rootNodeIds: [], routePath: '/' },
    },
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

function role(id = roleId, name = 'Editor', slug = 'editor'): Role {
  return {
    capabilities: ['cms.access'],
    contentTypes: {},
    dashboardIds: [],
    fields: {},
    id,
    name,
    routes: ['/admin'],
    slug,
  }
}

describe('M12.3 role engine', () => {
  it('crea, lista y actualiza roles normalizando capacidades y rutas', () => {
    const created = createRole(structure(), { ...role(), capabilities: ['cms.access', 'cms.access'], routes: ['/admin', '/admin'] })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(listRoles(created.value)).toHaveLength(1)
    expect(created.value.cms?.roles[roleId]?.capabilities).toEqual(['cms.access'])
    expect(created.value.cms?.roles[roleId]?.routes).toEqual(['/admin'])

    const updated = updateRole(created.value, roleId, {
      contentTypes: { [contentTypeId]: { create: true, delete: false, moderate: false, publish: false, read: true, update: true } },
      name: 'Editor de contenido',
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.cms?.roles[roleId]?.name).toBe('Editor de contenido')
    expect(updated.value.cms?.roles[roleId]?.contentTypes[contentTypeId]?.read).toBe(true)
  })

  it('rechaza conflictos de nombre y slug', () => {
    const first = createRole(structure(), role())
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const duplicateName = createRole(first.value, role(secondRoleId, 'Editor', 'other-editor'))
    expect(duplicateName.ok).toBe(false)
    if (!duplicateName.ok) expect(duplicateName.error[0]?.code).toBe('role-name-conflict')

    const duplicateSlug = createRole(first.value, role(secondRoleId, 'Otro', 'editor'))
    expect(duplicateSlug.ok).toBe(false)
    if (!duplicateSlug.ok) expect(duplicateSlug.error[0]?.code).toBe('role-slug-conflict')
  })

  it('bloquea eliminar un rol asignado a un usuario', () => {
    const created = createRole(structure(), role())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const next = structuredClone(created.value)
    next.cms!.users[userId] = { displayName: 'Usuario', email: 'user@example.com', id: userId, roleIds: [roleId], status: 'active' }
    const deleted = deleteRole(next, roleId)
    expect(deleted.ok).toBe(false)
    if (!deleted.ok) expect(deleted.error[0]?.code).toBe('role-in-use')
  })

  it('elimina un rol sin dependencias', () => {
    const created = createRole(structure(), role())
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const deleted = deleteRole(created.value, roleId)
    expect(deleted.ok).toBe(true)
    if (!deleted.ok) return
    expect(deleted.value.cms?.roles[roleId]).toBeUndefined()
  })
})
