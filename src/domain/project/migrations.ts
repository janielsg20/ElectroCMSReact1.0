import * as z from 'zod'
import { failure, success, type Result } from '../common/result'
import { deserializeCanonical, serializeCanonical, type ValidationIssue } from './canonical-json'
import { ProjectIdSchema, TimestampSchema } from './identity'
import {
  createProjectEnvelopeSchema,
  CURRENT_PROJECT_SCHEMA_VERSION,
  JsonValueSchema,
  PROJECT_FORMAT,
  type JsonValue,
  type ProjectEnvelope,
} from './project-envelope'

const VersionedProjectHeaderSchema = z.looseObject({
  format: z.literal(PROJECT_FORMAT),
  schemaVersion: z.number().int().nonnegative(),
})

export const LegacyProjectEnvelopeV0Schema = z
  .strictObject({
    format: z.literal(PROJECT_FORMAT),
    schemaVersion: z.literal(0),
    projectId: ProjectIdSchema,
    name: z.string().trim().min(1).max(160),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    payload: JsonValueSchema,
  })
  .refine(({ createdAt, updatedAt }) => updatedAt >= createdAt, {
    path: ['updatedAt'],
    message: 'updatedAt no puede ser anterior a createdAt.',
  })

export const MigrationBackupSchema = z.strictObject({
  format: z.literal('electrocms.migration-backup'),
  sourceSchemaVersion: z.number().int().nonnegative(),
  source: z.string().min(1),
})

export type MigrationBackup = z.infer<typeof MigrationBackupSchema>

export interface MigrationStep {
  readonly fromVersion: number
  readonly toVersion: number
  migrate(input: unknown): Result<unknown, readonly ValidationIssue[]>
}

export interface MigrationRegistry {
  get(fromVersion: number): MigrationStep | undefined
}

export type ProjectMigrationError =
  | { readonly kind: 'invalid-json'; readonly message: string }
  | { readonly kind: 'invalid-envelope'; readonly issues: readonly ValidationIssue[] }
  | { readonly kind: 'newer-version'; readonly found: number; readonly supported: number }
  | { readonly kind: 'missing-migration'; readonly fromVersion: number; readonly backup: MigrationBackup }
  | { readonly kind: 'migration-failed'; readonly fromVersion: number; readonly issues: readonly ValidationIssue[]; readonly backup: MigrationBackup }
  | { readonly kind: 'invalid-current'; readonly issues: readonly ValidationIssue[]; readonly backup: MigrationBackup | null }

export interface ProjectMigrationSuccess<TPayload extends JsonValue> {
  readonly project: ProjectEnvelope<TPayload>
  readonly serialized: string
  readonly migratedFromVersion: number
  readonly appliedVersions: readonly number[]
  readonly backup: MigrationBackup | null
}

function issues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map(({ code, message, path }) => ({ code, message, path }))
}

export function createMigrationRegistry(steps: readonly MigrationStep[]): MigrationRegistry {
  const indexed = new Map<number, MigrationStep>()
  for (const step of steps) {
    if (step.toVersion !== step.fromVersion + 1) throw new Error('Las migraciones deben avanzar exactamente una versión.')
    if (indexed.has(step.fromVersion)) throw new Error(`Ya existe una migración desde la versión ${step.fromVersion}.`)
    indexed.set(step.fromVersion, step)
  }
  return Object.freeze({ get: (fromVersion: number) => indexed.get(fromVersion) })
}

const migrateV0ToV1: MigrationStep = {
  fromVersion: 0,
  toVersion: 1,
  migrate(input) {
    const parsed = LegacyProjectEnvelopeV0Schema.safeParse(input)
    if (!parsed.success) return failure(issues(parsed.error))
    return success({
      ...parsed.data,
      schemaVersion: 1,
      revision: 0,
      metadata: { migratedFromSchemaVersion: 0 },
    })
  },
}

export const DEFAULT_PROJECT_MIGRATIONS = createMigrationRegistry([migrateV0ToV1])

export function migrateProjectJson<TPayload extends JsonValue>(
  source: string,
  payloadSchema: z.ZodType<TPayload>,
  registry: MigrationRegistry = DEFAULT_PROJECT_MIGRATIONS,
): Result<ProjectMigrationSuccess<TPayload>, ProjectMigrationError> {
  let input: unknown
  try {
    input = JSON.parse(source) as unknown
  } catch {
    return failure({ kind: 'invalid-json', message: 'El documento no contiene JSON válido.' })
  }

  const header = VersionedProjectHeaderSchema.safeParse(input)
  if (!header.success) return failure({ kind: 'invalid-envelope', issues: issues(header.error) })
  if (header.data.schemaVersion > CURRENT_PROJECT_SCHEMA_VERSION) {
    return failure({ kind: 'newer-version', found: header.data.schemaVersion, supported: CURRENT_PROJECT_SCHEMA_VERSION })
  }

  const migratedFromVersion = header.data.schemaVersion
  const backup: MigrationBackup | null = migratedFromVersion < CURRENT_PROJECT_SCHEMA_VERSION
    ? { format: 'electrocms.migration-backup', sourceSchemaVersion: migratedFromVersion, source }
    : null
  const appliedVersions: number[] = []
  let current = input
  let version = migratedFromVersion

  while (version < CURRENT_PROJECT_SCHEMA_VERSION) {
    const step = registry.get(version)
    if (!step) return failure({ kind: 'missing-migration', fromVersion: version, backup: backup! })
    const migrated = step.migrate(current)
    if (!migrated.ok) return failure({ kind: 'migration-failed', fromVersion: version, issues: migrated.error, backup: backup! })
    current = migrated.value
    version = step.toVersion
    appliedVersions.push(version)
  }

  const currentSchema = createProjectEnvelopeSchema(payloadSchema)
  const parsed = currentSchema.safeParse(current)
  if (!parsed.success) return failure({ kind: 'invalid-current', issues: issues(parsed.error), backup })
  const serialized = serializeCanonical(currentSchema, parsed.data)
  if (!serialized.ok) {
    const invalid = serialized.error.kind === 'invalid-value' ? serialized.error.issues : []
    return failure({ kind: 'invalid-current', issues: invalid, backup })
  }

  return success({
    project: parsed.data,
    serialized: serialized.value,
    migratedFromVersion,
    appliedVersions,
    backup,
  })
}

export function restoreMigrationBackup(backup: unknown): Result<string, readonly ValidationIssue[]> {
  const parsed = MigrationBackupSchema.safeParse(backup)
  return parsed.success ? success(parsed.data.source) : failure(issues(parsed.error))
}

export function readCurrentProject<TPayload extends JsonValue>(
  source: string,
  payloadSchema: z.ZodType<TPayload>,
): ReturnType<typeof deserializeCanonical<ProjectEnvelope<TPayload>>> {
  return deserializeCanonical(createProjectEnvelopeSchema(payloadSchema), source)
}
