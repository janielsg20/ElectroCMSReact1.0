import * as z from 'zod'

export const ProjectIdSchema = z.uuid().brand<'ProjectId'>()
export const DocumentIdSchema = z.uuid().brand<'DocumentId'>()
export const NodeIdSchema = z.uuid().brand<'NodeId'>()
export const BreakpointIdSchema = z.uuid().brand<'BreakpointId'>()
export const GlobalComponentIdSchema = z.uuid().brand<'GlobalComponentId'>()

export const TimestampSchema = z.iso
  .datetime({ offset: false, precision: 3 })
  .brand<'Timestamp'>()

export type ProjectId = z.infer<typeof ProjectIdSchema>
export type DocumentId = z.infer<typeof DocumentIdSchema>
export type NodeId = z.infer<typeof NodeIdSchema>
export type BreakpointId = z.infer<typeof BreakpointIdSchema>
export type GlobalComponentId = z.infer<typeof GlobalComponentIdSchema>
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

export function parseTimestamp(value: unknown): Timestamp {
  return TimestampSchema.parse(value)
}
