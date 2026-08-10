import * as z from 'zod'
import {
  ProjectIdSchema,
  ProjectJournalEntryIdSchema,
  ProjectSnapshotIdSchema,
  TimestampSchema,
  type ProjectId,
  type ProjectJournalEntryId,
  type ProjectSnapshotId,
  type Timestamp,
} from './identity'
import type { JsonValue } from './project-envelope'
import { createProjectRecordSchema, type ProjectRecord } from './project-record'

export const PROJECT_RECOVERY_SCHEMA_VERSION = 1 as const
export const ProjectJournalStatusSchema = z.enum(['pending', 'committed', 'recovered', 'superseded'])
export type ProjectJournalStatus = z.infer<typeof ProjectJournalStatusSchema>

export interface ProjectSnapshot<TPayload extends JsonValue> {
  readonly id: ProjectSnapshotId
  readonly projectId: ProjectId
  readonly revision: number
  readonly createdAt: Timestamp
  readonly record: ProjectRecord<TPayload>
}

export interface ProjectJournalEntry<TPayload extends JsonValue> {
  readonly id: ProjectJournalEntryId
  readonly projectId: ProjectId
  readonly baseRevision: number
  readonly targetRevision: number
  readonly createdAt: Timestamp
  readonly status: ProjectJournalStatus
  readonly target: ProjectRecord<TPayload>
}

export interface ProjectRecoveryState<TPayload extends JsonValue> {
  readonly projectId: ProjectId
  readonly schemaVersion: typeof PROJECT_RECOVERY_SCHEMA_VERSION
  readonly snapshots: readonly ProjectSnapshot<TPayload>[]
  readonly journalEntries: readonly ProjectJournalEntry<TPayload>[]
}

export function createProjectRecoveryStateSchema<TPayload extends JsonValue>(
  payloadSchema: z.ZodType<TPayload>,
): z.ZodType<ProjectRecoveryState<TPayload>> {
  const recordSchema = createProjectRecordSchema(payloadSchema)
  const snapshotSchema = z.strictObject({
    id: ProjectSnapshotIdSchema,
    projectId: ProjectIdSchema,
    revision: z.number().int().nonnegative(),
    createdAt: TimestampSchema,
    record: recordSchema,
  })
  const journalSchema = z.strictObject({
    id: ProjectJournalEntryIdSchema,
    projectId: ProjectIdSchema,
    baseRevision: z.number().int().nonnegative(),
    targetRevision: z.number().int().positive(),
    createdAt: TimestampSchema,
    status: ProjectJournalStatusSchema,
    target: recordSchema,
  })

  return z.strictObject({
    projectId: ProjectIdSchema,
    schemaVersion: z.literal(PROJECT_RECOVERY_SCHEMA_VERSION),
    snapshots: z.array(snapshotSchema),
    journalEntries: z.array(journalSchema),
  }).superRefine((state, context) => {
    const snapshotIds = new Set<string>()
    for (const [index, snapshot] of state.snapshots.entries()) {
      if (snapshotIds.has(snapshot.id)) context.addIssue({ code: 'custom', path: ['snapshots', index, 'id'], message: 'El ID del snapshot está duplicado.' })
      snapshotIds.add(snapshot.id)
      if (snapshot.projectId !== state.projectId || snapshot.record.project.projectId !== state.projectId || snapshot.revision !== snapshot.record.project.revision) {
        context.addIssue({ code: 'custom', path: ['snapshots', index], message: 'El snapshot no corresponde al proyecto o revisión declarados.' })
      }
    }

    const journalIds = new Set<string>()
    for (const [index, entry] of state.journalEntries.entries()) {
      if (journalIds.has(entry.id)) context.addIssue({ code: 'custom', path: ['journalEntries', index, 'id'], message: 'El ID del journal está duplicado.' })
      journalIds.add(entry.id)
      if (entry.projectId !== state.projectId || entry.target.project.projectId !== state.projectId || entry.targetRevision !== entry.target.project.revision || entry.targetRevision <= entry.baseRevision) {
        context.addIssue({ code: 'custom', path: ['journalEntries', index], message: 'La entrada de journal no corresponde al proyecto o secuencia declarados.' })
      }
    }
  })
}
