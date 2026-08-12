import * as z from 'zod'
import {
  BackendScreenIdSchema,
  ContentRecordIdSchema,
  ContentRecordRevisionIdSchema,
  ContentTypeIdSchema,
  DocumentIdSchema,
  FieldDefinitionIdSchema,
  FormIdSchema,
  MenuIdSchema,
  MenuItemIdSchema,
  QueryIdSchema,
  RelationEntryIdSchema,
  RelationIdSchema,
  RoleIdSchema,
  TaxonomyIdSchema,
  TaxonomyTermIdSchema,
  TimestampSchema,
  UserIdSchema,
} from './identity'
import { JsonValueSchema } from './project-envelope'

const LabelSchema = z.string().trim().min(1).max(160)
const DescriptionSchema = z.string().max(4_000)
const SlugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const KeySchema = z.string().trim().min(1).max(160).regex(/^[a-zA-Z][a-zA-Z0-9_.-]*$/)
const RouteSchema = z.string().trim().min(1).max(300).startsWith('/')

export const ContentStatusSchema = z.enum(['draft', 'pending', 'published', 'private', 'archived'])

export const FieldTypeSchema = z.enum([
  'text', 'textarea', 'rich-text', 'number', 'currency', 'email', 'phone', 'url', 'date', 'time',
  'datetime', 'color', 'select', 'radio', 'checkbox', 'switch', 'image', 'gallery', 'file', 'map',
  'relation', 'user', 'taxonomy', 'repeater', 'group', 'calculated', 'conditional',
])

export const FieldOwnerSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('content-type'), contentTypeId: ContentTypeIdSchema }),
  z.strictObject({ kind: z.literal('taxonomy'), taxonomyId: TaxonomyIdSchema }),
])

export const FieldValidationSchema = z.strictObject({
  minLength: z.number().int().nonnegative().nullable(),
  maxLength: z.number().int().nonnegative().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  pattern: z.string().max(500).nullable(),
})

export const FieldOptionSchema = z.strictObject({ label: LabelSchema, value: JsonValueSchema })

export const FieldConditionSchema = z.strictObject({
  fieldId: FieldDefinitionIdSchema,
  operator: z.enum(['equals', 'not-equals', 'contains', 'greater-than', 'less-than', 'exists']),
  value: JsonValueSchema,
})

export const FieldConditionGroupSchema = z.strictObject({
  operator: z.enum(['all', 'any']),
  conditions: z.array(FieldConditionSchema).min(1),
})

export const FieldDefinitionSchema = z.strictObject({
  id: FieldDefinitionIdSchema,
  owner: FieldOwnerSchema,
  key: KeySchema,
  label: LabelSchema,
  type: FieldTypeSchema,
  description: DescriptionSchema,
  placeholder: z.string().max(500),
  defaultValue: JsonValueSchema,
  required: z.boolean(),
  validation: FieldValidationSchema,
  options: z.array(FieldOptionSchema),
  conditions: z.array(FieldConditionGroupSchema),
  childFieldIds: z.array(FieldDefinitionIdSchema),
  relationId: RelationIdSchema.nullable(),
  taxonomyId: TaxonomyIdSchema.nullable(),
  allowedRoleIds: z.array(RoleIdSchema),
  calculatedExpression: z.string().max(2_000).nullable(),
  group: z.string().trim().max(160),
  order: z.number().int().nonnegative(),
})

export const ContentTypeSchema = z.strictObject({
  id: ContentTypeIdSchema,
  slug: SlugSchema,
  singularName: LabelSchema,
  pluralName: LabelSchema,
  description: DescriptionSchema,
  icon: z.string().trim().max(160),
  capabilities: z.array(KeySchema),
  supports: z.array(z.enum(['title', 'editor', 'author', 'thumbnail', 'excerpt', 'revisions', 'custom-fields'])),
  public: z.boolean(),
  showInMenu: z.boolean(),
  order: z.number().int().nonnegative(),
  singleTemplateId: DocumentIdSchema.nullable(),
  archiveTemplateId: DocumentIdSchema.nullable(),
  fieldIds: z.array(FieldDefinitionIdSchema),
  taxonomyIds: z.array(TaxonomyIdSchema),
})

export const TaxonomySchema = z.strictObject({
  id: TaxonomyIdSchema,
  slug: SlugSchema,
  singularName: LabelSchema,
  pluralName: LabelSchema,
  description: DescriptionSchema,
  hierarchical: z.boolean(),
  contentTypeIds: z.array(ContentTypeIdSchema).min(1),
  fieldIds: z.array(FieldDefinitionIdSchema),
  archiveTemplateId: DocumentIdSchema.nullable(),
})

export const TaxonomyTermSchema = z.strictObject({
  id: TaxonomyTermIdSchema,
  taxonomyId: TaxonomyIdSchema,
  slug: SlugSchema,
  name: LabelSchema,
  description: DescriptionSchema,
  parentId: TaxonomyTermIdSchema.nullable(),
  values: z.record(FieldDefinitionIdSchema, JsonValueSchema),
})

export const ContentRecordSchema = z.strictObject({
  id: ContentRecordIdSchema,
  contentTypeId: ContentTypeIdSchema,
  status: ContentStatusSchema,
  authorId: UserIdSchema.nullable(),
  values: z.record(FieldDefinitionIdSchema, JsonValueSchema),
  taxonomyTermIds: z.array(TaxonomyTermIdSchema),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const ContentRecordRevisionSchema = z.strictObject({
  id: ContentRecordRevisionIdSchema,
  recordId: ContentRecordIdSchema,
  createdAt: TimestampSchema,
  snapshot: ContentRecordSchema,
})

export const RelationSchema = z.strictObject({
  id: RelationIdSchema,
  name: LabelSchema,
  slug: SlugSchema,
  cardinality: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  sourceContentTypeId: ContentTypeIdSchema,
  targetContentTypeId: ContentTypeIdSchema,
})

export const RelationEntrySchema = z.strictObject({
  id: RelationEntryIdSchema,
  relationId: RelationIdSchema,
  sourceRecordId: ContentRecordIdSchema,
  targetRecordId: ContentRecordIdSchema,
})

export const QueryPredicateSchema = z.strictObject({
  source: z.enum(['status', 'field', 'taxonomy', 'author', 'date', 'relation', 'repeater']),
  fieldId: FieldDefinitionIdSchema.nullable(),
  taxonomyId: TaxonomyIdSchema.nullable(),
  relationId: RelationIdSchema.nullable(),
  operator: z.enum(['equals', 'not-equals', 'contains', 'in', 'not-in', 'greater-than', 'greater-or-equal', 'less-than', 'less-or-equal', 'between', 'exists']),
  value: JsonValueSchema,
})

export const QueryGroupSchema = z.strictObject({ operator: z.enum(['all', 'any']), predicates: z.array(QueryPredicateSchema).min(1) })

export const QuerySortSchema = z.strictObject({
  fieldId: FieldDefinitionIdSchema.nullable(),
  systemField: z.enum(['createdAt', 'updatedAt', 'status', 'id']).nullable(),
  direction: z.enum(['asc', 'desc']),
})

export const QuerySchema = z.strictObject({
  id: QueryIdSchema,
  name: LabelSchema,
  contentTypeId: ContentTypeIdSchema,
  groups: z.array(QueryGroupSchema),
  sorts: z.array(QuerySortSchema),
  limit: z.number().int().min(1).max(10_000),
  offset: z.number().int().nonnegative(),
  pageSize: z.number().int().min(1).max(1_000),
})

export const FormControlSchema = z.strictObject({
  id: z.uuid(),
  name: KeySchema,
  label: LabelSchema,
  type: FieldTypeSchema,
  mappedFieldId: FieldDefinitionIdSchema.nullable(),
  required: z.boolean(),
  conditions: z.array(FieldConditionGroupSchema),
})

export const FormStepSchema = z.strictObject({ id: z.uuid(), name: LabelSchema, controlIds: z.array(z.uuid()).min(1) })

export const FormActionSchema = z.strictObject({
  id: z.uuid(),
  kind: z.enum(['save-record', 'create-content', 'update-content', 'register-user', 'sign-in', 'send-email', 'save-local', 'redirect', 'show-message', 'webhook', 'update-relation', 'upload-file']),
  config: z.record(KeySchema, JsonValueSchema),
})

export const FormSchema = z.strictObject({
  id: FormIdSchema,
  name: LabelSchema,
  contentTypeId: ContentTypeIdSchema.nullable(),
  controls: z.record(z.uuid(), FormControlSchema),
  steps: z.array(FormStepSchema).min(1),
  actions: z.array(FormActionSchema),
  draftSaving: z.boolean(),
  csrfProtection: z.boolean(),
  successMessage: z.string().max(2_000),
  errorMessage: z.string().max(2_000),
})

export const ContentTypePermissionSchema = z.strictObject({
  create: z.boolean(), read: z.boolean(), update: z.boolean(), delete: z.boolean(), publish: z.boolean(), moderate: z.boolean(),
})

export const FieldPermissionSchema = z.strictObject({ readable: z.boolean(), editable: z.boolean() })

export const RoleSchema = z.strictObject({
  id: RoleIdSchema,
  name: LabelSchema,
  slug: SlugSchema,
  capabilities: z.array(KeySchema),
  contentTypes: z.record(ContentTypeIdSchema, ContentTypePermissionSchema),
  fields: z.record(FieldDefinitionIdSchema, FieldPermissionSchema),
  dashboardIds: z.array(BackendScreenIdSchema),
  routes: z.array(RouteSchema),
})

export const UserSchema = z.strictObject({
  id: UserIdSchema,
  displayName: LabelSchema,
  email: z.email(),
  status: z.enum(['invited', 'active', 'suspended']),
  roleIds: z.array(RoleIdSchema).min(1),
})

export const MenuItemSchema = z.strictObject({
  id: MenuItemIdSchema,
  label: LabelSchema,
  kind: z.enum(['screen', 'route', 'url']),
  screenId: BackendScreenIdSchema.nullable(),
  target: z.string().trim().min(1).max(2_000),
  childIds: z.array(MenuItemIdSchema),
  allowedRoleIds: z.array(RoleIdSchema),
})

export const MenuSchema = z.strictObject({ id: MenuIdSchema, name: LabelSchema, rootItemIds: z.array(MenuItemIdSchema), items: z.record(MenuItemIdSchema, MenuItemSchema) })

export const BackendScreenSchema = z.strictObject({
  id: BackendScreenIdSchema,
  name: LabelSchema,
  route: RouteSchema,
  kind: z.enum(['dashboard', 'table', 'form', 'detail', 'calendar', 'kanban', 'chart', 'metrics', 'listing']),
  documentId: DocumentIdSchema,
  contentTypeId: ContentTypeIdSchema.nullable(),
  queryId: QueryIdSchema.nullable(),
  formId: FormIdSchema.nullable(),
  allowedRoleIds: z.array(RoleIdSchema),
})

export const CmsBackendSchema = z.strictObject({
  contentTypes: z.record(ContentTypeIdSchema, ContentTypeSchema),
  taxonomies: z.record(TaxonomyIdSchema, TaxonomySchema),
  fields: z.record(FieldDefinitionIdSchema, FieldDefinitionSchema),
  records: z.record(ContentRecordIdSchema, ContentRecordSchema),
  recordRevisions: z.record(ContentRecordRevisionIdSchema, ContentRecordRevisionSchema).default(() => ({})),
  taxonomyTerms: z.record(TaxonomyTermIdSchema, TaxonomyTermSchema),
  relations: z.record(RelationIdSchema, RelationSchema),
  relationEntries: z.record(RelationEntryIdSchema, RelationEntrySchema),
  queries: z.record(QueryIdSchema, QuerySchema),
  forms: z.record(FormIdSchema, FormSchema),
  roles: z.record(RoleIdSchema, RoleSchema),
  users: z.record(UserIdSchema, UserSchema),
  menus: z.record(MenuIdSchema, MenuSchema),
  backendScreens: z.record(BackendScreenIdSchema, BackendScreenSchema),
})

export type ContentStatus = z.infer<typeof ContentStatusSchema>
export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>
export type ContentType = z.infer<typeof ContentTypeSchema>
export type Taxonomy = z.infer<typeof TaxonomySchema>
export type TaxonomyTerm = z.infer<typeof TaxonomyTermSchema>
export type ContentRecord = z.infer<typeof ContentRecordSchema>
export type ContentRecordRevision = z.infer<typeof ContentRecordRevisionSchema>
export type Relation = z.infer<typeof RelationSchema>
export type RelationEntry = z.infer<typeof RelationEntrySchema>
export type Query = z.infer<typeof QuerySchema>
export type Form = z.infer<typeof FormSchema>
export type Role = z.infer<typeof RoleSchema>
export type User = z.infer<typeof UserSchema>
export type Menu = z.infer<typeof MenuSchema>
export type BackendScreen = z.infer<typeof BackendScreenSchema>
export type CmsBackend = z.infer<typeof CmsBackendSchema>
