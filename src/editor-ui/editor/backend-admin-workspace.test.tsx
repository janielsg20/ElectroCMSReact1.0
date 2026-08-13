import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  parseBackendScreenId,
  parseContentTypeId,
  parseMenuId,
  parseMenuItemId,
  parseRoleId,
  parseUserId,
  type ContentType,
  type Role,
  type User,
} from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { AppSectionProvider } from './AppSectionProvider'
import { BackendAdminWorkspace } from './BackendAdminWorkspace'
import { requireBackendShellSession } from './backend-shell-session-context'
import { requireContentTypeSession, requireRoleSession, requireUserSession } from './editor-project-context'
import { EditorProjectProvider } from './EditorProjectProvider'

const ACTIVE_USER_STORAGE_KEY = 'electrocms.active-user.v1'
const contentTypeId = parseContentTypeId('d1111111-1111-4111-8111-111111111111')
const screenId = parseBackendScreenId('d2222222-2222-4222-8222-222222222222')
const menuId = parseMenuId('d3333333-3333-4333-8333-333333333333')
const menuItemId = parseMenuItemId('d4444444-4444-4444-8444-444444444444')
const roleId = parseRoleId('d5555555-5555-4555-8555-555555555555')
const userId = parseUserId('d6666666-6666-4666-8666-666666666666')

const contentType: ContentType = {
  archiveTemplateId: null,
  capabilities: [],
  description: 'Pedidos de la tienda',
  fieldIds: [],
  icon: 'content',
  id: contentTypeId,
  order: 0,
  pluralName: 'Pedidos',
  public: true,
  showInMenu: true,
  singleTemplateId: null,
  singularName: 'Pedido',
  slug: 'pedidos',
  supports: ['title'],
  taxonomyIds: [],
}

const restrictedRole: Role = {
  capabilities: [],
  contentTypes: {},
  dashboardIds: [screenId],
  fields: {},
  id: roleId,
  name: 'Solo panel',
  routes: ['/admin/pedidos'],
  slug: 'solo-panel',
}

const user: User = {
  displayName: 'Ana',
  email: 'ana@example.com',
  id: userId,
  roleIds: [roleId],
  status: 'active',
}

async function configuredSession() {
  const session = createBrowserEditorProjectSession(`electrocms-admin-workspace-${crypto.randomUUID()}`)
  expect((await requireContentTypeSession(session).createContentType(contentType)).ok).toBe(true)
  expect((await requireBackendShellSession(session).createAdminShell({
    documentId: session.documentId,
    menuId,
    menuItemId,
    menuLabel: 'Pedidos',
    menuName: 'Administración',
    route: '/admin/pedidos',
    screenId,
    screenKind: 'dashboard',
    screenName: 'Pedidos',
  })).ok).toBe(true)
  expect((await requireBackendShellSession(session).updateAdminShell(screenId, {
    contentTypeId,
    formId: null,
    queryId: null,
    screenKind: 'table',
  })).ok).toBe(true)
  expect((await requireRoleSession(session).createRole(restrictedRole)).ok).toBe(true)
  expect((await requireUserSession(session).createUser(user)).ok).toBe(true)
  return session
}

function renderWorkspace(session: ReturnType<typeof createBrowserEditorProjectSession>) {
  return render(
    <EditorProjectProvider session={session}>
      <AppSectionProvider><BackendAdminWorkspace /></AppSectionProvider>
    </EditorProjectProvider>,
  )
}

describe('M12.5 BackendAdminWorkspace permissions', () => {
  afterEach(() => window.localStorage.clear())

  it('conserva los paneles disponibles en modo de configuración', async () => {
    const session = await configuredSession()
    renderWorkspace(session)
    expect(screen.getAllByText('Pedidos').length).toBeGreaterThan(0)
    expect(screen.getByText(/modo de configuración/i)).toBeInTheDocument()
  })

  it('no expone contenido ni acciones CRUD a una persona sin permiso de lectura', async () => {
    const session = await configuredSession()
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId)
    renderWorkspace(session)
    expect(await screen.findByText(/no tiene permiso para consultar este contenido/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0)
  })
})
