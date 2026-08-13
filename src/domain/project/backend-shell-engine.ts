import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import type { BackendScreen, Menu, MenuItem } from './cms-schema'
import type { BackendScreenId, DocumentId, MenuId, MenuItemId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type BackendShellDiagnosticCode =
  | 'document-not-found'
  | 'screen-not-found'
  | 'screen-name-conflict'
  | 'route-conflict'
  | 'menu-not-found'
  | 'menu-item-not-found'
  | 'invalid-shell'
  | 'invalid-project'

export interface BackendShellDiagnostic {
  readonly code: BackendShellDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export interface AdminShellInput {
  readonly documentId: DocumentId
  readonly menuId: MenuId
  readonly menuItemId: MenuItemId
  readonly menuLabel: string
  readonly menuName: string
  readonly route: string
  readonly screenId: BackendScreenId
  readonly screenKind: BackendScreen['kind']
  readonly screenName: string
}

export interface AdminShellUpdate {
  readonly menuLabel?: string
  readonly route?: string
  readonly screenKind?: BackendScreen['kind']
  readonly screenName?: string
}

export interface AdminShellRecord {
  readonly menu: Menu
  readonly menuItem: MenuItem
  readonly screen: BackendScreen
}

function diagnostic(code: BackendShellDiagnosticCode, message: string, path: readonly (string | number)[] = []): BackendShellDiagnostic {
  return { code, message, path }
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

function menuContainingScreen(structure: ProjectStructure, screenId: BackendScreenId): { readonly menu: Menu; readonly item: MenuItem } | null {
  const cms = projectCmsBackend(structure.cms)
  for (const menu of Object.values(cms.menus)) {
    const item = (Object.values(menu.items) as MenuItem[]).find((candidate) => candidate.kind === 'screen' && candidate.screenId === screenId)
    if (item) return { item, menu }
  }
  return null
}

function validateCandidate(structure: ProjectStructure): Result<ProjectStructure, readonly BackendShellDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic('invalid-shell', issue.message, ['cms', ...issue.path])))
  }
  const candidate = validateProjectStructure({ ...structuredClone(structure), cms: cmsValidation.value })
  return candidate.ok
    ? success(candidate.value)
    : failure(candidate.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}

export function listBackendScreens(structure: ProjectStructure): readonly BackendScreen[] {
  return Object.values(projectCmsBackend(structure.cms).backendScreens)
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export function adminShellForDocument(structure: ProjectStructure, documentId: DocumentId): AdminShellRecord | null {
  const cms = projectCmsBackend(structure.cms)
  const screen = Object.values(cms.backendScreens).find((candidate) => candidate.documentId === documentId)
  if (!screen) return null
  const link = menuContainingScreen(structure, screen.id)
  if (!link) return null
  return { menu: link.menu, menuItem: link.item, screen }
}

export function createAdminShell(
  structure: ProjectStructure,
  input: AdminShellInput,
): Result<ProjectStructure, readonly BackendShellDiagnostic[]> {
  if (!structure.documents[input.documentId]) {
    return failure([diagnostic('document-not-found', 'El lienzo elegido ya no existe.', ['documents', input.documentId])])
  }

  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  const screenName = input.screenName.trim()
  const menuName = input.menuName.trim()
  const menuLabel = input.menuLabel.trim()
  const route = input.route.trim()

  if (cms.backendScreens[input.screenId]) {
    return failure([diagnostic('invalid-shell', 'La pantalla administrativa ya existe.', ['cms', 'backendScreens', input.screenId])])
  }
  if (Object.values(cms.backendScreens).some((screen) => normalize(screen.name) === normalize(screenName))) {
    return failure([diagnostic('screen-name-conflict', 'Ya existe una pantalla administrativa con ese nombre.', ['cms', 'backendScreens', input.screenId, 'name'])])
  }
  if (Object.values(cms.backendScreens).some((screen) => screen.route === route)) {
    return failure([diagnostic('route-conflict', 'Ya existe una pantalla administrativa con esa ruta.', ['cms', 'backendScreens', input.screenId, 'route'])])
  }

  cms.backendScreens[input.screenId] = {
    allowedRoleIds: [],
    contentTypeId: null,
    documentId: input.documentId,
    formId: null,
    id: input.screenId,
    kind: input.screenKind,
    name: screenName,
    queryId: null,
    route,
  }

  const menu = cms.menus[input.menuId] ?? {
    id: input.menuId,
    items: {},
    name: menuName,
    rootItemIds: [],
  }
  if (menu.items[input.menuItemId]) {
    return failure([diagnostic('invalid-shell', 'El elemento de navegación ya existe.', ['cms', 'menus', input.menuId, 'items', input.menuItemId])])
  }
  menu.items[input.menuItemId] = {
    allowedRoleIds: [],
    childIds: [],
    id: input.menuItemId,
    kind: 'screen',
    label: menuLabel,
    screenId: input.screenId,
    target: route,
  }
  menu.rootItemIds.push(input.menuItemId)
  cms.menus[input.menuId] = menu
  next.cms = cms
  return validateCandidate(next)
}

export function updateAdminShell(
  structure: ProjectStructure,
  screenId: BackendScreenId,
  patch: AdminShellUpdate,
): Result<ProjectStructure, readonly BackendShellDiagnostic[]> {
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  const screen = cms.backendScreens[screenId]
  if (!screen) return failure([diagnostic('screen-not-found', 'La pantalla administrativa ya no existe.', ['cms', 'backendScreens', screenId])])
  const link = menuContainingScreen(next, screenId)
  if (!link) return failure([diagnostic('menu-item-not-found', 'La navegación de esta pantalla ya no existe.', ['cms', 'backendScreens', screenId])])

  const screenName = patch.screenName?.trim() ?? screen.name
  const route = patch.route?.trim() ?? screen.route
  if (Object.values(cms.backendScreens).some((candidate) => candidate.id !== screenId && normalize(candidate.name) === normalize(screenName))) {
    return failure([diagnostic('screen-name-conflict', 'Ya existe otra pantalla administrativa con ese nombre.', ['cms', 'backendScreens', screenId, 'name'])])
  }
  if (Object.values(cms.backendScreens).some((candidate) => candidate.id !== screenId && candidate.route === route)) {
    return failure([diagnostic('route-conflict', 'Ya existe otra pantalla administrativa con esa ruta.', ['cms', 'backendScreens', screenId, 'route'])])
  }

  cms.backendScreens[screenId] = {
    ...screen,
    kind: patch.screenKind ?? screen.kind,
    name: screenName,
    route,
  }
  const menu = cms.menus[link.menu.id]
  if (!menu) return failure([diagnostic('menu-not-found', 'El menú administrativo ya no existe.', ['cms', 'menus', link.menu.id])])
  const item = menu.items[link.item.id]
  if (!item) return failure([diagnostic('menu-item-not-found', 'El elemento de navegación ya no existe.', ['cms', 'menus', menu.id, 'items', link.item.id])])
  menu.items[item.id] = {
    ...item,
    label: patch.menuLabel?.trim() ?? item.label,
    target: route,
  }
  next.cms = cms
  return validateCandidate(next)
}

export function deleteAdminShell(
  structure: ProjectStructure,
  screenId: BackendScreenId,
): Result<ProjectStructure, readonly BackendShellDiagnostic[]> {
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  if (!cms.backendScreens[screenId]) return failure([diagnostic('screen-not-found', 'La pantalla administrativa ya no existe.', ['cms', 'backendScreens', screenId])])

  for (const menu of Object.values(cms.menus)) {
    const removedIds = (Object.values(menu.items) as MenuItem[])
      .filter((item) => item.kind === 'screen' && item.screenId === screenId)
      .map((item) => item.id)
    if (removedIds.length === 0) continue
    const removed = new Set(removedIds)
    menu.rootItemIds = menu.rootItemIds.filter((id) => !removed.has(id))
    for (const item of Object.values(menu.items) as MenuItem[]) {
      item.childIds = item.childIds.filter((id) => !removed.has(id))
    }
    for (const itemId of removedIds) delete menu.items[itemId]
  }
  delete cms.backendScreens[screenId]
  next.cms = cms
  return validateCandidate(next)
}
