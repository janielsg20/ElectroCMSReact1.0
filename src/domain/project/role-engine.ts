import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { RoleSchema, type Role } from './cms-schema'
import type { RoleId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type RoleEditablePatch = Partial<Omit<Role, 'id'>>

function valid(structure: ProjectStructure, role: Role, ignoredId?: RoleId): Result<ProjectStructure, string> {
  const parsed = RoleSchema.safeParse(role)
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'La configuración del rol no es válida.')
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  if (Object.values(cms.roles).some((candidate) => candidate.id !== ignoredId && candidate.slug === role.slug)) return failure('Ya existe un rol con ese identificador.')
  cms.roles[role.id] = parsed.data
  const validatedCms = validateCmsBackend(cms)
  if (!validatedCms.ok) return failure(validatedCms.error[0]?.message ?? 'Los permisos del rol no son válidos.')
  next.cms = cms
  const validatedStructure = validateProjectStructure(next)
  return validatedStructure.ok ? success(next) : failure(validatedStructure.error[0]?.message ?? 'El proyecto no es válido.')
}

export function createRole(structure: ProjectStructure, role: Role): Result<ProjectStructure, string> {
  const cms = projectCmsBackend(structure.cms)
  if (cms.roles[role.id]) return failure('El rol ya existe.')
  return valid(structure, role)
}

export function updateRole(structure: ProjectStructure, roleId: RoleId, patch: RoleEditablePatch): Result<ProjectStructure, string> {
  const role = structure.cms?.roles[roleId]
  if (!role) return failure('El rol ya no existe.')
  return valid(structure, { ...structuredClone(role), ...structuredClone(patch), id: roleId }, roleId)
}

export function deleteRole(structure: ProjectStructure, roleId: RoleId): Result<ProjectStructure, string> {
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  if (!cms.roles[roleId]) return failure('El rol ya no existe.')
  if (Object.values(cms.users).some((user) => user.roleIds.includes(roleId))) return failure('No puedes eliminar un rol asignado a un usuario.')
  delete cms.roles[roleId]
  const validatedCms = validateCmsBackend(cms)
  if (!validatedCms.ok) return failure('No puedes eliminar un rol que sigue usándose en permisos, menús o paneles.')
  next.cms = cms
  const validatedStructure = validateProjectStructure(next)
  return validatedStructure.ok ? success(next) : failure(validatedStructure.error[0]?.message ?? 'El proyecto no es válido.')
}
