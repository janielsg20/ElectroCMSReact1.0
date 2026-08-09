import * as z from 'zod'
import { ProjectIdSchema, TimestampSchema, type ProjectId, type Timestamp } from './identity'

export const PROJECT_FORMAT = 'electrocms.project' as const
export const CURRENT_PROJECT_SCHEMA_VERSION = 1 as const

export type JsonPrimitive = boolean | number | string | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export const JsonValueSchema: z.ZodType<JsonValue> = z.json()

export const ProjectMetadataSchema = z.record(
  z.string().min(1).max(128),
  JsonValueSchema,
)

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>

export interface ProjectEnvelope<TPayload extends JsonValue> {
  readonly format: typeof PROJECT_FORMAT
  readonly schemaVersion: typeof CURRENT_PROJECT_SCHEMA_VERSION
  readonly projectId: ProjectId
  readonly revision: number
  readonly name: string
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly metadata: ProjectMetadata
  readonly payload: TPayload
}

export function createProjectEnvelopeSchema<TPayload extends JsonValue>(
  payloadSchema: z.ZodType<TPayload>,
): z.ZodType<ProjectEnvelope<TPayload>> {
  return z
    .strictObject({
      format: z.literal(PROJECT_FORMAT),
      schemaVersion: z.literal(CURRENT_PROJECT_SCHEMA_VERSION),
      projectId: ProjectIdSchema,
      revision: z.number().int().nonnegative(),
      name: z.string().trim().min(1).max(160),
      createdAt: TimestampSchema,
      updatedAt: TimestampSchema,
      metadata: ProjectMetadataSchema,
      payload: payloadSchema,
    })
    .refine(
      ({ createdAt, updatedAt }) => updatedAt >= createdAt,
      {
        path: ['updatedAt'],
        message: 'updatedAt no puede ser anterior a createdAt.',
      },
    )
}
