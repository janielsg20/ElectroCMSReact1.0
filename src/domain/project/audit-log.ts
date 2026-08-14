import * as z from 'zod'
import { AuditLogEntryIdSchema, ProjectIdSchema, TimestampSchema, UserIdSchema, type AuditLogEntryId, type ProjectId, type Timestamp } from './identity'
import type { JsonValue } from './project-envelope'

export const AUDIT_LOG_SCHEMA_VERSION = 1 as const
const LabelSchema = z.string().trim().min(1).max(180)

export const AuditActorSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('person'), label: LabelSchema, userId: UserIdSchema }),
  z.strictObject({ kind: z.literal('system'), label: LabelSchema }),
])

export const AuditChangeSchema = z.strictObject({
  kind: z.enum(['added', 'changed', 'removed']),
  path: z.string().trim().min(1).max(500),
})

export const AuditLogEntrySchema = z.strictObject({
  action: z.enum(['execute', 'undo', 'redo']),
  actor: AuditActorSchema,
  changes: z.array(AuditChangeSchema).min(1).max(40),
  commandIds: z.array(z.string().trim().min(1).max(180)).min(1),
  createdAt: TimestampSchema,
  id: AuditLogEntryIdSchema,
  label: LabelSchema,
  projectId: ProjectIdSchema,
  schemaVersion: z.literal(AUDIT_LOG_SCHEMA_VERSION),
})

export type AuditActor = z.infer<typeof AuditActorSchema>
export type AuditChange = z.infer<typeof AuditChangeSchema>
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>

function isRecord(value: JsonValue): value is Readonly<Record<string, JsonValue>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sameValue(left: JsonValue | undefined, right: JsonValue | undefined): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** Returns paths only: an export never includes edited values or potentially sensitive content. */
export function describeAuditChanges(before: JsonValue, after: JsonValue, limit = 40): readonly AuditChange[] {
  const changes: AuditChange[] = []
  const visit = (left: JsonValue | undefined, right: JsonValue | undefined, path: string): void => {
    if (changes.length >= limit || sameValue(left, right)) return
    if (left === undefined) { changes.push({ kind: 'added', path }); return }
    if (right === undefined) { changes.push({ kind: 'removed', path }); return }
    if (isRecord(left) && isRecord(right)) {
      for (const key of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()) visit(left[key], right[key], `${path}.${key}`)
      return
    }
    changes.push({ kind: 'changed', path })
  }
  visit(before, after, 'proyecto')
  return changes.length ? changes : [{ kind: 'changed', path: 'proyecto' }]
}

export function createAuditLogEntry(input: {
  readonly action: AuditLogEntry['action']
  readonly actor: AuditActor
  readonly after: JsonValue
  readonly before: JsonValue
  readonly commandIds: readonly string[]
  readonly createdAt: Timestamp
  readonly id: AuditLogEntryId
  readonly label: string
  readonly projectId: ProjectId
}): AuditLogEntry {
  return AuditLogEntrySchema.parse({
    action: input.action,
    actor: input.actor,
    changes: describeAuditChanges(input.before, input.after),
    commandIds: input.commandIds,
    createdAt: input.createdAt,
    id: input.id,
    label: input.label,
    projectId: input.projectId,
    schemaVersion: AUDIT_LOG_SCHEMA_VERSION,
  })
}

export function exportAuditLog(entries: readonly AuditLogEntry[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), format: 'electrocms.audit-log', schemaVersion: AUDIT_LOG_SCHEMA_VERSION, entries }, null, 2)
}
