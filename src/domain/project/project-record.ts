import * as z from 'zod'
import { TimestampSchema } from './identity'
import { createProjectEnvelopeSchema, type JsonValue, type ProjectEnvelope } from './project-envelope'

export const ProjectLifecycleStateSchema = z.enum(['active', 'archived', 'trashed'])
export type ProjectLifecycleState = z.infer<typeof ProjectLifecycleStateSchema>

export const ProjectLifecycleSchema = z.strictObject({
  state: ProjectLifecycleStateSchema,
  archivedAt: TimestampSchema.nullable(),
  trashedAt: TimestampSchema.nullable(),
  restoreState: z.enum(['active', 'archived']).nullable(),
})

export type ProjectLifecycle = z.infer<typeof ProjectLifecycleSchema>

export interface ProjectRecord<TPayload extends JsonValue> {
  readonly project: ProjectEnvelope<TPayload>
  readonly lifecycle: ProjectLifecycle
}

export function createProjectRecordSchema<TPayload extends JsonValue>(
  payloadSchema: z.ZodType<TPayload>,
): z.ZodType<ProjectRecord<TPayload>> {
  return z
    .strictObject({
      project: createProjectEnvelopeSchema(payloadSchema),
      lifecycle: ProjectLifecycleSchema,
    })
    .superRefine(({ lifecycle }, context) => {
      if (lifecycle.state === 'active' && (lifecycle.archivedAt || lifecycle.trashedAt || lifecycle.restoreState)) {
        context.addIssue({ code: 'custom', path: ['lifecycle'], message: 'Un proyecto activo no conserva marcas de archivo o papelera.' })
      }
      if (lifecycle.state === 'archived' && (!lifecycle.archivedAt || lifecycle.trashedAt || lifecycle.restoreState)) {
        context.addIssue({ code: 'custom', path: ['lifecycle'], message: 'Un proyecto archivado requiere archivedAt y no puede estar en papelera.' })
      }
      if (lifecycle.state === 'trashed' && (!lifecycle.trashedAt || !lifecycle.restoreState)) {
        context.addIssue({ code: 'custom', path: ['lifecycle'], message: 'Un proyecto en papelera requiere fecha y estado de recuperación.' })
      }
      if (lifecycle.state === 'trashed' && lifecycle.restoreState === 'active' && lifecycle.archivedAt) {
        context.addIssue({ code: 'custom', path: ['lifecycle', 'archivedAt'], message: 'Un proyecto activo enviado a papelera no debe conservar archivedAt.' })
      }
      if (lifecycle.state === 'trashed' && lifecycle.restoreState === 'archived' && !lifecycle.archivedAt) {
        context.addIssue({ code: 'custom', path: ['lifecycle', 'archivedAt'], message: 'La recuperación a archivado requiere archivedAt.' })
      }
    })
}
