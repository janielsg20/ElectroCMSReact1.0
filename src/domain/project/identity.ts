import * as z from 'zod'

export const ProjectIdSchema = z.uuid().brand<'ProjectId'>()

export const TimestampSchema = z.iso
  .datetime({ offset: false, precision: 3 })
  .brand<'Timestamp'>()

export type ProjectId = z.infer<typeof ProjectIdSchema>
export type Timestamp = z.infer<typeof TimestampSchema>

export function parseProjectId(value: unknown): ProjectId {
  return ProjectIdSchema.parse(value)
}

export function parseTimestamp(value: unknown): Timestamp {
  return TimestampSchema.parse(value)
}
