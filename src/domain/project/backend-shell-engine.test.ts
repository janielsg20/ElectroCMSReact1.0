import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseBackendScreenId,
  parseDocumentId,
  parseMenuId,
  parseMenuItemId,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import {
  adminShellForDocument,
  createAdminShell,
  deleteAdminShell,
  listBackendScreens,
  updateAdminShell,
} from './backend-shell-engine'

const documentId = parseDocumentId('e1000000-0000-4000-8000-000000000001')
const secondDocumentId = parseDocumentId('e1000000-0000-4000-8000-000000000002')
const screenId = parseBackendScreenId('e2000000-0000-4000-8000-000000000001')
const secondScreenId = parseBackendScreenId('e2000000-0000-4000-8000-000000000002')
const menuId = parseMenuId('e3000000-0000-4000-8000-000000000001')
const menuItemId = parseMenuItemId('e4000000-0000-4000-8000-000000000001')
const secondMenuItemId = parseMenuItemId('e4000000-0000-4000-8000-000000000002')

function structure(): ProjectStructure {
  return ProjectStructureSchema.parse({
    breakpoints: structuredClone(DEFAULT_BREAKPOINTS),
    cms: structuredClone(EMPTY_CMS_BACKEND),
    documents: {
      [documentId]: { conditions: [], id: documentId, kind: 'page', name: 'Inicio', nodes: {}, rootNodeIds: [], routePath: '/' },
      [secondDocumentId]: { conditions: [], id: secondDocumentId, kind: 'page', name: 'Secundaria', nodes: {}, rootNodeIds: [], routePath: '/second' },
    },
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

function input(overrides: Partial<Parameters<typeof createAdminShell>[1]> = {}): Parameters<typeof createAdminShell>[1] {
  return {
    documentId,
    menuId,
    menuItemId,
    menuLabel: 'Inicio',
    menuName: 'Administración',
    route: '/admin',
    screenId,
    screenKind: 'dashboard',
    screenName: 'Panel de administración',
    ...overrides,
  }
}

describe('M12.1 backend shell engine', () => {
  it('vincula el documento existente a una pantalla y navegación canónicas', () => {
    const result = createAdminShell(structure(), input())
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const shell = adminShellForDocument(result.value, documentId)
    expect(shell?.screen).toMatchObject({
      documentId,
      id: screenId,
      kind: 'dashboard',
      name: 'Panel de administración',
      route: '/admin',
    })
    expect(shell?.menu).toMatchObject({ id: menuId, name: 'Administración', rootItemIds: [menuItemId] })
    expect(shell?.menuItem).toMatchObject({ kind: 'screen', label: 'Inicio', screenId, target: '/admin' })
    expect(listBackendScreens(result.value)).toHaveLength(1)
  })

  it('actualiza nombre, ruta, tipo y etiqueta sin romper el enlace de navegación', () => {
    const created = createAdminShell(structure(), input())
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const updated = updateAdminShell(created.value, screenId, {
      menuLabel: 'Escritorio',
      route: '/admin/home',
      screenKind: 'metrics',
      screenName: 'Resumen del negocio',
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return

    const shell = adminShellForDocument(updated.value, documentId)
    expect(shell?.screen).toMatchObject({ kind: 'metrics', name: 'Resumen del negocio', route: '/admin/home' })
    expect(shell?.menuItem).toMatchObject({ label: 'Escritorio', target: '/admin/home' })
  })

  it('rechaza documento ausente y conflictos de nombre o ruta', () => {
    const missing = createAdminShell(structure(), input({ documentId: parseDocumentId('e1000000-0000-4000-8000-000000000099') }))
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.error[0]?.code).toBe('document-not-found')

    const first = createAdminShell(structure(), input())
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const duplicateName = createAdminShell(first.value, input({
      documentId: secondDocumentId,
      menuItemId: secondMenuItemId,
      route: '/admin/other',
      screenId: secondScreenId,
    }))
    expect(duplicateName.ok).toBe(false)
    if (!duplicateName.ok) expect(duplicateName.error[0]?.code).toBe('screen-name-conflict')

    const duplicateRoute = createAdminShell(first.value, input({
      documentId: secondDocumentId,
      menuItemId: secondMenuItemId,
      screenId: secondScreenId,
      screenName: 'Otra pantalla',
    }))
    expect(duplicateRoute.ok).toBe(false)
    if (!duplicateRoute.ok) expect(duplicateRoute.error[0]?.code).toBe('route-conflict')
  })

  it('elimina la pantalla y limpia todas las referencias del menú', () => {
    const created = createAdminShell(structure(), input())
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const removed = deleteAdminShell(created.value, screenId)
    expect(removed.ok).toBe(true)
    if (!removed.ok) return
    expect(removed.value.cms?.backendScreens[screenId]).toBeUndefined()
    expect(removed.value.cms?.menus[menuId]?.items[menuItemId]).toBeUndefined()
    expect(removed.value.cms?.menus[menuId]?.rootItemIds).not.toContain(menuItemId)
    expect(adminShellForDocument(removed.value, documentId)).toBeNull()
  })
})
