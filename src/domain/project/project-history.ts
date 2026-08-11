import * as z from 'zod'
import { ProjectIdSchema, TimestampSchema, type ProjectId, type Timestamp } from './identity'
import type { JsonValue } from './project-envelope'
import { createProjectRecordSchema, type ProjectRecord } from './project-record'

export const PROJECT_HISTORY_SCHEMA_VERSION = 1 as const
export const ProjectHistoryEntryIdSchema = z.uuid().brand<'ProjectHistoryEntryId'>()
export const ProjectHistoryOperationKindSchema = z.enum(['execute', 'undo', 'redo'])

export type ProjectHistoryEntryId = z.infer<typeof ProjectHistoryEntryIdSchema>
export type ProjectHistoryOperationKind = z.infer<typeof ProjectHistoryOperationKindSchema>

export interface ProjectHistoryEntry<TPayload extends JsonValue> {
  readonly id: ProjectHistoryEntryId
  readonly projectId: ProjectId
  readonly label: string
  readonly commandIds: readonly string[]
  readonly createdAt: Timestamp
  readonly before: ProjectRecord<TPayload>
  readonly after: ProjectRecord<TPayload>
}

export interface PendingProjectHistoryOperation<TPayload extends JsonValue> {
  readonly kind: ProjectHistoryOperationKind
  readonly entryId: ProjectHistoryEntryId
  readonly sourceCursor: number
  readonly targetCursor: number
  readonly startedAt: Timestamp
  readonly target: ProjectRecord<TPayload>
}

export interface ProjectHistoryState<TPayload extends JsonValue> {
  readonly projectId: ProjectId
  readonly schemaVersion: typeof PROJECT_HISTORY_SCHEMA_VERSION
  readonly entries: readonly ProjectHistoryEntry<TPayload>[]
  readonly cursor: number
  readonly pending: PendingProjectHistoryOperation<TPayload> | null
}

export function parseProjectHistoryEntryId(value: unknown): ProjectHistoryEntryId {
  return ProjectHistoryEntryIdSchema.parse(value)
}

export function createEmptyProjectHistoryState<TPayload extends JsonValue>(projectId: ProjectId): ProjectHistoryState<TPayload> {
  return {
    projectId,
    schemaVersion: PROJECT_HISTORY_SCHEMA_VERSION,
    entries: [],
    cursor: 0,
    pending: null,
  }
}

export function createProjectHistoryStateSchema<TPayload extends JsonValue>(
  payloadSchema: z.ZodType<TPayload>,
): z.ZodType<ProjectHistoryState<TPayload>> {
  const recordSchema = createProjectRecordSchema(payloadSchema)
  const entrySchema = z.strictObject({
    id: ProjectHistoryEntryIdSchema,
    projectId: ProjectIdSchema,
    label: z.string().trim().min(1).max(180),
    commandIds: z.array(z.string().trim().min(1).max(180)).min(1),
    createdAt: TimestampSchema,
    before: recordSchema,
    after: recordSchema,
  })
  const pendingSchema = z.strictObject({
    kind: ProjectHistoryOperationKindSchema,
    entryId: ProjectHistoryEntryIdSchema,
    sourceCursor: z.number().int().nonnegative(),
    targetCursor: z.number().int().nonnegative(),
    startedAt: TimestampSchema,
    target: recordSchema,
  })

  return z.strictObject({
    projectId: ProjectIdSchema,
    schemaVersion: z.literal(PROJECT_HISTORY_SCHEMA_VERSION),
    entries: z.array(entrySchema),
    cursor: z.number().int().nonnegative(),
    pending: pendingSchema.nullable(),
  }).superRefine((state, context) => {
    if (state.cursor > state.entries.length) {
      context.addIssue({ code: 'custom', path: ['cursor'], message: 'El cursor no puede superar el historial disponible.' })
    }

    const ids = new Set<string>()
    for (const [index, entry] of state.entries.entries()) {
      if (ids.has(entry.id)) context.addIssue({ code: 'custom', path: ['entries', index, 'id'], message: 'El ID de historial está duplicado.' })
      ids.add(entry.id)
      if (entry.projectId !== state.projectId || entry.before.project.projectId !== state.projectId || entry.after.project.projectId !== state.projectId) {
        context.addIssue({ code: 'custom', path: ['entries', index], message: 'La entrada de historial no pertenece al proyecto declarado.' })
      }
    }

    if (!state.pending) return
    const pending = state.pending
    if (pending.target.project.projectId !== state.projectId) {
      context.addIssue({ code: 'custom', path: ['pending', 'target'], message: 'La operación pendiente apunta a otro proyecto.' })
    }
    if (pending.sourceCursor > state.entries.length || pending.targetCursor > state.entries.length) {
      context.addIssue({ code: 'custom', path: ['pending'], message: 'Los cursores de la operación pendiente están fuera del historial.' })
    }
    if (state.cursor !== pending.sourceCursor) {
      context.addIssue({ code: 'custom', path: ['pending', 'sourceCursor'], message: 'El cursor persistido debe coincidir con el origen de la operación pendiente.' })
    }

    const entryIndex = state.entries.findIndex((entry) => entry.id === pending.entryId)
    if (entryIndex < 0) {
      context.addIssue({ code: 'custom', path: ['pending', 'entryId'], message: 'La operación pendiente referencia una entrada inexistente.' })
      return
    }

    if (pending.kind === 'execute' && (pending.targetCursor !== pending.sourceCursor + 1 || entryIndex !== pending.targetCursor - 1)) {
      context.addIssue({ code: 'custom', path: ['pending'], message: 'La ejecución pendiente debe avanzar exactamente una entrada.' })
    }
    if (pending.kind === 'undo' && (pending.sourceCursor === 0 || pending.targetCursor + 1 !== pending.sourceCursor || entryIndex !== pending.targetCursor)) {
      context.addIssue({ code: 'custom', path: ['pending'], message: 'El undo pendiente debe retroceder exactamente una entrada.' })
    }
    if (pending.kind === 'redo' && (pending.targetCursor !== pending.sourceCursor + 1 || entryIndex !== pending.sourceCursor)) {
      context.addIssue({ code: 'custom', path: ['pending'], message: 'El redo pendiente debe avanzar exactamente una entrada existente.' })
    }
  })
}
