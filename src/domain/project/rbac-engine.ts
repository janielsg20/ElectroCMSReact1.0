import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import type { CmsBackend, ContentRecord, ContentStatus, Role, User } from './cms-schema'
import type { ContentRecordId, ContentTypeId, FieldDefinitionId, RoleId, UserId } from './identity'
import {
  createContentRecord,
  deleteContentRecord,
  updateContentRecord,
  type ContentRecordEditablePatch,
  type RecordUpdateOptions,
} from './record-relation-engine'
import type { ProjectStructure } from './structure-schema'

export type ContentPermissionAction = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'moderate'

export type RbacDiagnosticCode =
  | 'user-not-found'
  | 'user-inactive'
  | 'record-not-found'
  | 'authorization-denied'
  | 'field-forbidden'
  | 'mutation-failed'

export interface RbacDiagnostic {
  readonly code: RbacDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

function diagnostic(
  code: RbacDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): RbacDiagnostic {
  return { code, message, path }
}

function activeUser(cms: CmsBackend, userId: UserId): Result<User, readonly RbacDiagnostic[]> {
  const user = cms.users[userId]
  if (!user) return failure([diagnostic('user-not-found', 'El usuario no existe.', ['cms', 'users', userId])])
  if (user.status !== 'active') {
    return failure([diagnostic('user-inactive', 'El usuario no tiene una sesión activa autorizable.', ['cms', 'users', userId, 'status'])])
  }
  return success(user)
}

function rolesFor(cms: CmsBackend, user: User): readonly Role[] {
  return user.roleIds.flatMap((roleId) => cms.roles[roleId] ? [cms.roles[roleId]] : [])
}

function roleAllowedByField(roleId: RoleId, allowedRoleIds: readonly RoleId[]): boolean {
  return allowedRoleIds.length === 0 || allowedRoleIds.includes(roleId)
}

export function userHasCapability(cms: CmsBackend, userId: UserId, capability: string): boolean {
  const user = cms.users[userId]
  if (!user || user.status !== 'active') return false
  return rolesFor(cms, user).some((role) => role.capabilities.includes(capability))
}

export function userCanContentAction(
  cms: CmsBackend,
  userId: UserId,
  contentTypeId: ContentTypeId,
  action: ContentPermissionAction,
): boolean {
  const user = cms.users[userId]
  if (!user || user.status !== 'active') return false
  return rolesFor(cms, user).some((role) => role.contentTypes[contentTypeId]?.[action] === true)
}

export function userCanReadField(cms: CmsBackend, userId: UserId, fieldId: FieldDefinitionId): boolean {
  const user = cms.users[userId]
  const field = cms.fields[fieldId]
  if (!user || user.status !== 'active' || !field) return false
  return rolesFor(cms, user).some((role) => {
    if (!roleAllowedByField(role.id, field.allowedRoleIds)) return false
    const permission = role.fields[fieldId]
    if (!permission?.readable) return false
    if (field.owner.kind === 'content-type') return role.contentTypes[field.owner.contentTypeId]?.read === true
    return true
  })
}

export function userCanEditField(cms: CmsBackend, userId: UserId, fieldId: FieldDefinitionId): boolean {
  const user = cms.users[userId]
  const field = cms.fields[fieldId]
  if (!user || user.status !== 'active' || !field) return false
  return rolesFor(cms, user).some((role) => {
    if (!roleAllowedByField(role.id, field.allowedRoleIds)) return false
    const permission = role.fields[fieldId]
    if (!permission?.editable) return false
    if (field.owner.kind === 'content-type') return role.contentTypes[field.owner.contentTypeId]?.update === true
    return true
  })
}

export function userCanAccessRoute(cms: CmsBackend, userId: UserId, route: string): boolean {
  const user = cms.users[userId]
  if (!user || user.status !== 'active') return false
  return rolesFor(cms, user).some((role) => role.routes.includes(route))
}

export function userCanAccessScreen(cms: CmsBackend, userId: UserId, screenId: string): boolean {
  const user = cms.users[userId]
  const screen = Object.values(cms.backendScreens).find((candidate) => candidate.id === screenId)
  if (!user || user.status !== 'active' || !screen) return false
  const roles = rolesFor(cms, user)
  return roles.some((role) => {
    if (!role.routes.includes(screen.route)) return false
    return screen.allowedRoleIds.length === 0 || screen.allowedRoleIds.includes(role.id)
  })
}

function requireContentAction(
  cms: CmsBackend,
  userId: UserId,
  contentTypeId: ContentTypeId,
  action: ContentPermissionAction,
): Result<readonly Role[], readonly RbacDiagnostic[]> {
  const userResult = activeUser(cms, userId)
  if (!userResult.ok) return userResult
  const roles = rolesFor(cms, userResult.value)
  if (!roles.some((role) => role.contentTypes[contentTypeId]?.[action] === true)) {
    return failure([diagnostic(
      'authorization-denied',
      `El usuario no tiene permiso para ${action} en este tipo de contenido.`,
      ['cms', 'contentTypes', contentTypeId, action],
    )])
  }
  return success(roles)
}

function requireEditableFields(
  cms: CmsBackend,
  userId: UserId,
  values: Readonly<Record<string, unknown>>,
): readonly RbacDiagnostic[] {
  return Object.keys(values).flatMap((fieldId) => userCanEditField(cms, userId, fieldId as FieldDefinitionId)
    ? []
    : [diagnostic('field-forbidden', 'Uno de los campos no permite edición para este usuario.', ['cms', 'fields', fieldId])])
}

function requiresPublish(current: ContentStatus | null, next: ContentStatus): boolean {
  return next === 'published' && current !== 'published'
}

function requiresModeration(current: ContentStatus | null, next: ContentStatus): boolean {
  return current === 'pending' && next !== 'pending'
}

export function readAuthorizedContentRecord(
  structure: ProjectStructure,
  userId: UserId,
  recordId: ContentRecordId,
): Result<ContentRecord, readonly RbacDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const record = cms.records[recordId]
  if (!record) return failure([diagnostic('record-not-found', 'El registro no existe.', ['cms', 'records', recordId])])
  const allowed = requireContentAction(cms, userId, record.contentTypeId, 'read')
  if (!allowed.ok) return allowed
  const values = Object.fromEntries(Object.entries(record.values).filter(([fieldId]) => userCanReadField(cms, userId, fieldId as FieldDefinitionId))) as ContentRecord['values']
  return success({ ...structuredClone(record), values })
}

export function listAuthorizedContentRecords(
  structure: ProjectStructure,
  userId: UserId,
  contentTypeId: ContentTypeId,
): Result<readonly ContentRecord[], readonly RbacDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const allowed = requireContentAction(cms, userId, contentTypeId, 'read')
  if (!allowed.ok) return allowed
  const records: ContentRecord[] = []
  for (const record of Object.values(cms.records)) {
    if (record.contentTypeId !== contentTypeId) continue
    const readable = readAuthorizedContentRecord(structure, userId, record.id)
    if (readable.ok) records.push(readable.value)
  }
  return success(records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id)))
}

export function createAuthorizedContentRecord(
  structure: ProjectStructure,
  userId: UserId,
  record: ContentRecord,
): Result<ProjectStructure, readonly RbacDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const allowed = requireContentAction(cms, userId, record.contentTypeId, 'create')
  if (!allowed.ok) return allowed
  if (requiresPublish(null, record.status) && !userCanContentAction(cms, userId, record.contentTypeId, 'publish')) {
    return failure([diagnostic('authorization-denied', 'El usuario no puede publicar este contenido.', ['cms', 'contentTypes', record.contentTypeId, 'publish'])])
  }
  const fieldErrors = requireEditableFields(cms, userId, record.values)
  if (fieldErrors.length > 0) return failure(fieldErrors)
  const created = createContentRecord(structure, record)
  return created.ok
    ? success(created.value)
    : failure(created.error.map((issue) => diagnostic('mutation-failed', issue.message, issue.path)))
}

export function updateAuthorizedContentRecord(
  structure: ProjectStructure,
  userId: UserId,
  recordId: ContentRecordId,
  patch: ContentRecordEditablePatch,
  options: RecordUpdateOptions,
): Result<ProjectStructure, readonly RbacDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.records[recordId]
  if (!current) return failure([diagnostic('record-not-found', 'El registro no existe.', ['cms', 'records', recordId])])
  const allowed = requireContentAction(cms, userId, current.contentTypeId, 'update')
  if (!allowed.ok) return allowed
  if (patch.values) {
    const fieldErrors = requireEditableFields(cms, userId, patch.values)
    if (fieldErrors.length > 0) return failure(fieldErrors)
  }
  if (patch.status && requiresPublish(current.status, patch.status) && !userCanContentAction(cms, userId, current.contentTypeId, 'publish')) {
    return failure([diagnostic('authorization-denied', 'El usuario no puede publicar este contenido.', ['cms', 'contentTypes', current.contentTypeId, 'publish'])])
  }
  if (patch.status && requiresModeration(current.status, patch.status) && !userCanContentAction(cms, userId, current.contentTypeId, 'moderate')) {
    return failure([diagnostic('authorization-denied', 'El usuario no puede moderar contenido pendiente.', ['cms', 'contentTypes', current.contentTypeId, 'moderate'])])
  }
  const updated = updateContentRecord(structure, recordId, patch, options)
  return updated.ok
    ? success(updated.value)
    : failure(updated.error.map((issue) => diagnostic('mutation-failed', issue.message, issue.path)))
}

export function deleteAuthorizedContentRecord(
  structure: ProjectStructure,
  userId: UserId,
  recordId: ContentRecordId,
): Result<ProjectStructure, readonly RbacDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const record = cms.records[recordId]
  if (!record) return failure([diagnostic('record-not-found', 'El registro no existe.', ['cms', 'records', recordId])])
  const allowed = requireContentAction(cms, userId, record.contentTypeId, 'delete')
  if (!allowed.ok) return allowed
  const deleted = deleteContentRecord(structure, recordId)
  return deleted.ok
    ? success(deleted.value)
    : failure(deleted.error.map((issue) => diagnostic('mutation-failed', issue.message, issue.path)))
}
