import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { RoleSchema, type CmsBackend, type Role } from './cms-schema'
import type { RoleId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type RolePermissionDiagnosticCode =
  | 'role-not-found'
  | 'role-id-conflict'
  | 'role-name-conflict'
  | 'role-slug-conflict'
  | 'role-in-use'
  | 'invalid-role'
  | 'invalid-cms'
  | 'invalid-project'

export interface RolePermissionDiagnostic {
  readonly code: RolePermissionDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type RoleEditablePatch = Partial<Pick<Role,
  | 'name'
  | 'slug'
  | 'capabilities'
  | 'contentTypes'
  | 'fields'
  | 'dashboardIds'
  | 'routes'
>>

function diagnostic(code: RolePermissionDiagnosticCode, message: string, path: readonly (string | number)[] = []): RolePermissionDiagnostic {
  return { code, message, path }
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function normalizeRole(role: Role): Role {
  return {
    ...structuredClone(role),
    capabilities: unique(role.capabilities),
    dashboardIds: unique(role.dashboardIds),
    routes: unique(role.routes),
  }
}

function roleNameOwner(cms: CmsBackend, name: string, ignoredId?: RoleId): Role | undefined {
  const normalized = normalize(name)
  return Object.values(cms.roles).find((role) => role.id !== ignoredId && normalize(role.name) === normalized)
}

function roleSlugOwner(cms: CmsBackend, slug: string, ignoredId?: RoleId): Role | undefined {
  return Object.values(cms.roles).find((role) => role.id !== ignoredId && role.slug === slug)
}

function validateCandidate(structure: ProjectStructure, cms: CmsBackend): Result<ProjectStructure, readonly RolePermissionDiagnostic[]> {
  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) return failure(cmsValidation.error.map((issue) => diagnostic('invalid-cms', issue.message, ['cms', ...issue.path])))
  const candidate = validateProjectStructure({ ...structuredClone(structure), cms: cmsValidation.value })
  return candidate.ok
    ? success(candidate.value)
    : failure(candidate.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}

function roleDependencies(cms: CmsBackend, roleId: RoleId): readonly string[] {
  const dependencies: string[] = []
  if (Object.values(cms.users).some((user) => user.roleIds.includes(roleId))) dependencies.push('usuarios')
  if (Object.values(cms.fields).some((field) => field.allowedRoleIds.includes(roleId))) dependencies.push('campos')
  if (Object.values(cms.backendScreens).some((screen) => screen.allowedRoleIds.includes(roleId))) dependencies.push('pantallas')
  if (Object.values(cms.menus).some((menu) => Object.values(menu.items).some((item) => item.allowedRoleIds.includes(roleId)))) dependencies.push('menús')
  return unique(dependencies)
}

export function listRoles(structure: ProjectStructure): readonly Role[] {
  return Object.values(projectCmsBackend(structure.cms).roles)
    .sort((left, right) => left.name.localeCompare(right.name, 'es') || left.id.localeCompare(right.id))
}

export function createRole(structure: ProjectStructure, input: Role): Result<ProjectStructure, readonly RolePermissionDiagnostic[]> {
  const parsed = RoleSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic('invalid-role', issue.message, ['cms', 'roles', input.id, ...issue.path.map(String)])))
  }
  const cms = projectCmsBackend(structure.cms)
  if (cms.roles[parsed.data.id]) return failure([diagnostic('role-id-conflict', 'Ya existe un rol con ese ID.', ['cms', 'roles', parsed.data.id])])
  if (roleNameOwner(cms, parsed.data.name)) return failure([diagnostic('role-name-conflict', 'Ya existe un rol con ese nombre.', ['cms', 'roles', parsed.data.id, 'name'])])
  if (roleSlugOwner(cms, parsed.data.slug)) return failure([diagnostic('role-slug-conflict', `El slug ${parsed.data.slug} ya está en uso.`, ['cms', 'roles', parsed.data.id, 'slug'])])
  cms.roles[parsed.data.id] = normalizeRole(parsed.data)
  return validateCandidate(structure, cms)
}

export function updateRole(structure: ProjectStructure, roleId: RoleId, patch: RoleEditablePatch): Result<ProjectStructure, readonly RolePermissionDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.roles[roleId]
  if (!current) return failure([diagnostic('role-not-found', 'El rol ya no existe.', ['cms', 'roles', roleId])])
  const parsed = RoleSchema.safeParse({ ...current, ...structuredClone(patch), id: roleId })
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => diagnostic('invalid-role', issue.message, ['cms', 'roles', roleId, ...issue.path.map(String)])))
  if (roleNameOwner(cms, parsed.data.name, roleId)) return failure([diagnostic('role-name-conflict', 'Ya existe otro rol con ese nombre.', ['cms', 'roles', roleId, 'name'])])
  if (roleSlugOwner(cms, parsed.data.slug, roleId)) return failure([diagnostic('role-slug-conflict', `El slug ${parsed.data.slug} pertenece a otro rol.`, ['cms', 'roles', roleId, 'slug'])])
  cms.roles[roleId] = normalizeRole(parsed.data)
  return validateCandidate(structure, cms)
}

export function deleteRole(structure: ProjectStructure, roleId: RoleId): Result<ProjectStructure, readonly RolePermissionDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.roles[roleId]
  if (!current) return failure([diagnostic('role-not-found', 'El rol ya no existe.', ['cms', 'roles', roleId])])
  const dependencies = roleDependencies(cms, roleId)
  if (dependencies.length > 0) {
    return failure([diagnostic('role-in-use', `No se puede eliminar ${current.name}: el rol todavía está usado por ${dependencies.join(', ')}.`, ['cms', 'roles', roleId])])
  }
  delete cms.roles[roleId]
  return validateCandidate(structure, cms)
}
