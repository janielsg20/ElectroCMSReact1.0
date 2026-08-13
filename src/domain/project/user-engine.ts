import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { UserSchema, type User } from './cms-schema'
import type { UserId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type UserEditablePatch = Partial<Omit<User, 'id'>>

function valid(structure: ProjectStructure, user: User, ignoredId?: UserId): Result<ProjectStructure, string> {
  const parsed = UserSchema.safeParse(user)
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Los datos de la persona no son válidos.')
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  if (Object.values(cms.users).some((candidate) => candidate.id !== ignoredId && candidate.email === parsed.data.email)) return failure('Ya existe una persona con ese correo electrónico.')
  cms.users[user.id] = parsed.data
  const validatedCms = validateCmsBackend(cms)
  if (!validatedCms.ok) return failure(validatedCms.error[0]?.message ?? 'Los roles de esta persona no son válidos.')
  next.cms = validatedCms.value
  const validatedStructure = validateProjectStructure(next)
  return validatedStructure.ok ? success(validatedStructure.value) : failure(validatedStructure.error[0]?.message ?? 'El proyecto no es válido.')
}

export function createUser(structure: ProjectStructure, user: User): Result<ProjectStructure, string> {
  if (projectCmsBackend(structure.cms).users[user.id]) return failure('La persona ya existe.')
  return valid(structure, user)
}

export function updateUser(structure: ProjectStructure, userId: UserId, patch: UserEditablePatch): Result<ProjectStructure, string> {
  const user = structure.cms?.users[userId]
  if (!user) return failure('La persona ya no existe.')
  return valid(structure, { ...structuredClone(user), ...structuredClone(patch), id: userId }, userId)
}

export function deleteUser(structure: ProjectStructure, userId: UserId): Result<ProjectStructure, string> {
  const next = structuredClone(structure)
  const cms = projectCmsBackend(next.cms)
  if (!cms.users[userId]) return failure('La persona ya no existe.')
  if (Object.values(cms.records).some((record) => record.authorId === userId)) return failure('No puedes eliminar una persona que aún figura como autora de contenido.')
  delete cms.users[userId]
  const validatedCms = validateCmsBackend(cms)
  if (!validatedCms.ok) return failure('No puedes eliminar una persona que sigue usándose en el proyecto.')
  next.cms = validatedCms.value
  const validatedStructure = validateProjectStructure(next)
  return validatedStructure.ok ? success(validatedStructure.value) : failure(validatedStructure.error[0]?.message ?? 'El proyecto no es válido.')
}
