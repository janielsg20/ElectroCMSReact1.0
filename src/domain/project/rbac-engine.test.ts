import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseBackendScreenId,
  parseContentRecordId,
  parseContentRecordRevisionId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseRoleId,
  parseTimestamp,
  parseUserId,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import type { ContentRecord, ContentType, FieldDefinition, Role, User } from './cms-schema'
import {
  readAuthorizedContentRecord,
  updateAuthorizedContentRecord,
  userCanAccessRoute,
  userCanAccessScreen,
  userCanContentAction,
  userCanEditField,
  userCanReadField,
} from './rbac-engine'

const documentId = parseDocumentId('d1000000-0000-4000-8000-000000000001')
const contentTypeId = parseContentTypeId('d2000000-0000-4000-8000-000000000001')
const titleFieldId = parseFieldDefinitionId('d3000000-0000-4000-8000-000000000001')
const secretFieldId = parseFieldDefinitionId('d3000000-0000-4000-8000-000000000002')
const roleId = parseRoleId('d4000000-0000-4000-8000-000000000001')
const otherRoleId = parseRoleId('d4000000-0000-4000-8000-000000000002')
const userId = parseUserId('d5000000-0000-4000-8000-000000000001')
const recordId = parseContentRecordId('d6000000-0000-4000-8000-000000000001')
const screenId = parseBackendScreenId('d7000000-0000-4000-8000-000000000001')
const timestamp = parseTimestamp('2026-08-13T16:30:00.000Z')

function field(id: typeof titleFieldId, key: string, label: string): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: null,
    description: '',
    group: '',
    id,
    key,
    label,
    options: [],
    order: id === titleFieldId ? 0 : 1,
    owner: { kind: 'content-type', contentTypeId },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type: 'text',
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
}

function contentType(): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: [],
    description: '',
    fieldIds: [titleFieldId, secretFieldId],
    icon: 'content',
    id: contentTypeId,
    order: 0,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: ['custom-fields', 'revisions'],
    taxonomyIds: [],
  }
}

function role(overrides: Partial<Role> = {}): Role {
  return {
    capabilities: [],
    contentTypes: {
      [contentTypeId]: { create: true, delete: false, moderate: false, publish: false, read: true, update: true },
    },
    dashboardIds: [],
    fields: {
      [titleFieldId]: { editable: true, readable: true },
      [secretFieldId]: { editable: false, readable: false },
    },
    id: roleId,
    name: 'Editor',
    routes: ['/admin/articles'],
    slug: 'editor',
    ...overrides,
  }
}

function user(overrides: Partial<User> = {}): User {
  return {
    displayName: 'Ada Editor',
    email: 'ada@example.com',
    id: userId,
    roleIds: [roleId],
    status: 'active',
    ...overrides,
  }
}

function record(overrides: Partial<ContentRecord> = {}): ContentRecord {
  return {
    authorId: userId,
    contentTypeId,
    createdAt: timestamp,
    id: recordId,
    status: 'draft',
    taxonomyTermIds: [],
    updatedAt: timestamp,
    values: { [titleFieldId]: 'Visible', [secretFieldId]: 'Oculto' },
    ...overrides,
  }
}

function structure(roleValue: Role = role(), userValue: User = user()): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = contentType()
  cms.fields[titleFieldId] = field(titleFieldId, 'title', 'Título')
  cms.fields[secretFieldId] = field(secretFieldId, 'secret', 'Interno')
  cms.roles[roleValue.id] = roleValue
  cms.users[userValue.id] = userValue
  cms.records[recordId] = record()
  cms.backendScreens[screenId] = {
    allowedRoleIds: [],
    contentTypeId,
    documentId,
    formId: null,
    id: screenId,
    kind: 'table',
    name: 'Artículos',
    queryId: null,
    route: '/admin/articles',
  }
  return ProjectStructureSchema.parse({
    breakpoints: structuredClone(DEFAULT_BREAKPOINTS),
    cms,
    documents: {
      [documentId]: { conditions: [], id: documentId, kind: 'page', name: 'Admin', nodes: {}, rootNodeIds: [], routePath: '/admin' },
    },
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

describe('M12.3 RBAC engine', () => {
  it('deniega por defecto cuando el rol no declara permisos explícitos', () => {
    const cms = structure(role({ contentTypes: {}, fields: {}, routes: [] })).cms!
    expect(userCanContentAction(cms, userId, contentTypeId, 'read')).toBe(false)
    expect(userCanReadField(cms, userId, titleFieldId)).toBe(false)
    expect(userCanEditField(cms, userId, titleFieldId)).toBe(false)
    expect(userCanAccessRoute(cms, userId, '/admin/articles')).toBe(false)
    expect(userCanAccessScreen(cms, userId, screenId)).toBe(false)
  })

  it('filtra campos no autorizados incluso cuando el registro sí es legible', () => {
    const result = readAuthorizedContentRecord(structure(), userId, recordId)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.values[titleFieldId]).toBe('Visible')
    expect(result.value.values[secretFieldId]).toBeUndefined()
  })

  it('bloquea edición de campo, publicación y moderación sin permisos específicos', () => {
    const base = structure()
    const forbiddenField = updateAuthorizedContentRecord(
      base,
      userId,
      recordId,
      { values: { [secretFieldId]: 'Intento' } },
      { now: parseTimestamp('2026-08-13T16:31:00.000Z'), revisionId: parseContentRecordRevisionId('d8000000-0000-4000-8000-000000000001') },
    )
    expect(forbiddenField.ok).toBe(false)
    if (!forbiddenField.ok) expect(forbiddenField.error[0]?.code).toBe('field-forbidden')

    const publish = updateAuthorizedContentRecord(
      base,
      userId,
      recordId,
      { status: 'published' },
      { now: parseTimestamp('2026-08-13T16:32:00.000Z'), revisionId: parseContentRecordRevisionId('d8000000-0000-4000-8000-000000000002') },
    )
    expect(publish.ok).toBe(false)
    if (!publish.ok) expect(publish.error[0]?.message).toContain('publicar')

    const pendingBase = structure()
    pendingBase.cms!.records[recordId] = record({ status: 'pending' })
    const moderate = updateAuthorizedContentRecord(
      pendingBase,
      userId,
      recordId,
      { status: 'draft' },
      { now: parseTimestamp('2026-08-13T16:33:00.000Z'), revisionId: parseContentRecordRevisionId('d8000000-0000-4000-8000-000000000003') },
    )
    expect(moderate.ok).toBe(false)
    if (!moderate.ok) expect(moderate.error[0]?.message).toContain('moderar')
  })

  it('aplica rutas y allow-list de pantalla sin convertir la UI en frontera de seguridad', () => {
    const base = structure()
    const cms = base.cms!
    expect(userCanAccessRoute(cms, userId, '/admin/articles')).toBe(true)
    expect(userCanAccessRoute(cms, userId, '/admin/settings')).toBe(false)
    expect(userCanAccessScreen(cms, userId, screenId)).toBe(true)

    cms.backendScreens[screenId] = { ...cms.backendScreens[screenId]!, allowedRoleIds: [otherRoleId] }
    expect(userCanAccessScreen(cms, userId, screenId)).toBe(false)
  })

  it('deniega usuarios suspendidos aunque sus roles concedan permisos', () => {
    const cms = structure(role(), user({ status: 'suspended' })).cms!
    expect(userCanContentAction(cms, userId, contentTypeId, 'read')).toBe(false)
    expect(userCanReadField(cms, userId, titleFieldId)).toBe(false)
    expect(userCanAccessScreen(cms, userId, screenId)).toBe(false)
  })
})
