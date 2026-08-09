import * as z from 'zod'

export const ProjectIdSchema = z.uuid().brand<'ProjectId'>()
export const DocumentIdSchema = z.uuid().brand<'DocumentId'>()
export const NodeIdSchema = z.uuid().brand<'NodeId'>()
export const BreakpointIdSchema = z.uuid().brand<'BreakpointId'>()
export const GlobalComponentIdSchema = z.uuid().brand<'GlobalComponentId'>()
export const ContentTypeIdSchema = z.uuid().brand<'ContentTypeId'>()
export const TaxonomyIdSchema = z.uuid().brand<'TaxonomyId'>()
export const TaxonomyTermIdSchema = z.uuid().brand<'TaxonomyTermId'>()
export const FieldDefinitionIdSchema = z.uuid().brand<'FieldDefinitionId'>()
export const ContentRecordIdSchema = z.uuid().brand<'ContentRecordId'>()
export const RelationIdSchema = z.uuid().brand<'RelationId'>()
export const RelationEntryIdSchema = z.uuid().brand<'RelationEntryId'>()
export const QueryIdSchema = z.uuid().brand<'QueryId'>()
export const FormIdSchema = z.uuid().brand<'FormId'>()
export const RoleIdSchema = z.uuid().brand<'RoleId'>()
export const UserIdSchema = z.uuid().brand<'UserId'>()
export const MenuIdSchema = z.uuid().brand<'MenuId'>()
export const MenuItemIdSchema = z.uuid().brand<'MenuItemId'>()
export const BackendScreenIdSchema = z.uuid().brand<'BackendScreenId'>()

export const TimestampSchema = z.iso
  .datetime({ offset: false, precision: 3 })
  .brand<'Timestamp'>()

export type ProjectId = z.infer<typeof ProjectIdSchema>
export type DocumentId = z.infer<typeof DocumentIdSchema>
export type NodeId = z.infer<typeof NodeIdSchema>
export type BreakpointId = z.infer<typeof BreakpointIdSchema>
export type GlobalComponentId = z.infer<typeof GlobalComponentIdSchema>
export type ContentTypeId = z.infer<typeof ContentTypeIdSchema>
export type TaxonomyId = z.infer<typeof TaxonomyIdSchema>
export type TaxonomyTermId = z.infer<typeof TaxonomyTermIdSchema>
export type FieldDefinitionId = z.infer<typeof FieldDefinitionIdSchema>
export type ContentRecordId = z.infer<typeof ContentRecordIdSchema>
export type RelationId = z.infer<typeof RelationIdSchema>
export type RelationEntryId = z.infer<typeof RelationEntryIdSchema>
export type QueryId = z.infer<typeof QueryIdSchema>
export type FormId = z.infer<typeof FormIdSchema>
export type RoleId = z.infer<typeof RoleIdSchema>
export type UserId = z.infer<typeof UserIdSchema>
export type MenuId = z.infer<typeof MenuIdSchema>
export type MenuItemId = z.infer<typeof MenuItemIdSchema>
export type BackendScreenId = z.infer<typeof BackendScreenIdSchema>
export type Timestamp = z.infer<typeof TimestampSchema>

export function parseProjectId(value: unknown): ProjectId {
  return ProjectIdSchema.parse(value)
}

export function parseDocumentId(value: unknown): DocumentId {
  return DocumentIdSchema.parse(value)
}

export function parseNodeId(value: unknown): NodeId {
  return NodeIdSchema.parse(value)
}

export function parseBreakpointId(value: unknown): BreakpointId {
  return BreakpointIdSchema.parse(value)
}

export function parseGlobalComponentId(value: unknown): GlobalComponentId {
  return GlobalComponentIdSchema.parse(value)
}

export function parseContentTypeId(value: unknown): ContentTypeId {
  return ContentTypeIdSchema.parse(value)
}

export function parseTaxonomyId(value: unknown): TaxonomyId {
  return TaxonomyIdSchema.parse(value)
}

export function parseTaxonomyTermId(value: unknown): TaxonomyTermId {
  return TaxonomyTermIdSchema.parse(value)
}

export function parseFieldDefinitionId(value: unknown): FieldDefinitionId {
  return FieldDefinitionIdSchema.parse(value)
}

export function parseContentRecordId(value: unknown): ContentRecordId {
  return ContentRecordIdSchema.parse(value)
}

export function parseRelationId(value: unknown): RelationId {
  return RelationIdSchema.parse(value)
}

export function parseRelationEntryId(value: unknown): RelationEntryId {
  return RelationEntryIdSchema.parse(value)
}

export function parseQueryId(value: unknown): QueryId {
  return QueryIdSchema.parse(value)
}

export function parseFormId(value: unknown): FormId {
  return FormIdSchema.parse(value)
}

export function parseRoleId(value: unknown): RoleId {
  return RoleIdSchema.parse(value)
}

export function parseUserId(value: unknown): UserId {
  return UserIdSchema.parse(value)
}

export function parseMenuId(value: unknown): MenuId {
  return MenuIdSchema.parse(value)
}

export function parseMenuItemId(value: unknown): MenuItemId {
  return MenuItemIdSchema.parse(value)
}

export function parseBackendScreenId(value: unknown): BackendScreenId {
  return BackendScreenIdSchema.parse(value)
}

export function parseTimestamp(value: unknown): Timestamp {
  return TimestampSchema.parse(value)
}
