import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { RoleSchema, type CmsBackend, type Role } from './cms-schema'
import type { RoleId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type RoleDiagnosticCode =
  | 'role-not-found'
  | 'role-id-conflict'
  | 'role-name-conflict'
  | 'role-slug-conflict'
  | 'role-in-use'
  | 'invalid-role'
  | 'invalid-project'

export interface RoleDiagnostic {
  readonly code: RoleDiagnosticCode
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

function diagnostic(
  code: RoleDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): RoleDiagnostic {
  return { code, message, path }
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

function normalizeRole(role: Role): Role {
  return {
    ...structuredClone(role),
    capabilities: [...new Set(role.capabilities)],
    dashboardIds: [...new Set(role.dashboardIds)],
    routes: [...new Set(role.routes)],
  }
}

function roleConflict(
  cms: CmsBackend,
  role: Role,
  ignoredId?: RoleId,
): RoleDiagnostic | null {
  const name = normalize(role.name)
  const nameOwner = Object.values(cms.roles).find((candidate) => candidate.id !== ignoredId && normalize(candidate.name) === name)
  if (nameOwner) return diagnostic('role-name-conflict', `Ya existe un rol llamado ${nameOwner.name}.`, ['cms', 'roles', role.id, 'name'])
  const slugOwner = Object.values(cms.roles).find((candidate) => candidate.id !== ignoredId && candidate.slug === role.slug)
  if (slugOwner) return diagnostic('role-slug-conflict', `El identificador ${role.slug} ya pertenece a ${slugOwner.name}.`, ['cms', 'roles', role.id, 'slug'])
  return null
}

function validateCandidate(structure: ProjectStructure, cms: CmsBackend): Result<ProjectStructure, readonly RoleDiagnostic[]> {
  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic('invalid-role', issue.message, ['cms', ...issue.path])))
  }
  const project = validateProjectStructure({ ...structuredClone(structure), cms: cmsValidation.value })
  return project.ok
    ? success(project.value)
    : failure(project.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}

function roleDependencies(cms: CmsBackend, roleId: RoleId): readonly string[] {
  const dependencies: string[] = []
  if (Object.values(cms.users).some((user) => user.roleIds.includes(roleId))) dependencies.push('usuarios')
  if (Object.values(cms.fields).some((field) => field.allowedRoleIds.includes(roleId))) dependencies.push('campos')
  if (Object.values(cms.backendScreens).some((screen) => screen.allowedRoleIds.includes(roleId))) dependencies.push('pantallas')
  if (Object.values(cms.menus).some((menu) => Object.values(menu.items).some((item) => item.allowedRoleIds.includes(roleId)))) dependencies.push('menús')
  return [...new Set(dependencies)]
}

export function listRoles(structure: ProjectStructure): readonly Role[] {
  return Object.values(projectCmsBackend(structure.cms).roles)
    .sort((left, right) => left.name.localeCompare(right.name, 'es') || left.id.localeCompare(right.id))
}

export function createRole(
  structure: ProjectStructure,
  input: Role,
): Result<ProjectStructure, readonly RoleDiagnostic[]> {
  const parsed = RoleSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-role',
      issue.message,
      ['cms', 'roles', input.id, ...issue.path.map(String)],
    )))
  }
  const cms = projectCmsBackend(structure.cms)
  if (cms.roles[parsed.data.id]) {
    return failure([diagnostic('role-id-conflict', 'Ya existe un rol con ese ID.', ['cms', 'roles', parsed.data.id])])
  }
  const role = normalizeRole(parsed.data)
  const conflict = roleConflict(cms, role)
  if (conflict) return failure([conflict])
  cms.roles[role.id] = role
  return validateCandidate(structure, cms)
}

export function updateRole(
  structure: ProjectStructure,
  roleId: RoleId,
  patch: RoleEditablePatch,
): Result<ProjectStructure, readonly RoleDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.roles[roleId]
  if (!current) return failure([diagnostic('role-not-found', 'El rol ya no existe.', ['cms', 'roles', roleId])])
  const parsed = RoleSchema.safeParse({ ...current, ...structuredClone(patch), id: roleId })
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-role',
      issue.message,
      ['cms', 'roles', roleId, ...issue.path.map(String)],
    )))
  }
  const role = normalizeRole(parsed.data)
  const conflict = roleConflict(cms, role, roleId)
  if (conflict) return failure([conflict])
  cms.roles[roleId] = role
  return validateCandidate(structure, cms)
}

export function deleteRole(
  structure: ProjectStructure,
  roleId: RoleId,
): Result<ProjectStructure, readonly RoleDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.roles[roleId]
  if (!current) return failure([diagnostic('role-not-found', 'El rol ya no existe.', ['cms', 'roles', roleId])])
  const dependencies = roleDependencies(cms, roleId)
  if (dependencies.length > 0) {
    return failure([diagnostic(
      'role-in-use',
      `No se puede eliminar ${current.name}: todavía se usa en ${dependencies.join(', ')}.`,
      ['cms', 'roles', roleId],
    )])
  }
  delete cms.roles[roleId]
  return validateCandidate(structure, cms)
}
