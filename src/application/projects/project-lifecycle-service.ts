import * as z from 'zod'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import { serializeCanonical } from '../../domain/project/canonical-json'
import type { ProjectId, Timestamp } from '../../domain/project/identity'
import { migrateProjectJson, type ProjectMigrationError } from '../../domain/project/migrations'
import { createProjectEnvelopeSchema, CURRENT_PROJECT_SCHEMA_VERSION, PROJECT_FORMAT, type JsonValue, type ProjectEnvelope, type ProjectMetadata } from '../../domain/project/project-envelope'
import type { ProjectLifecycleState, ProjectRecord } from '../../domain/project/project-record'

const ProjectNameSchema = z.string().trim().min(1).max(160)

export type ProjectLifecycleError =
  | { readonly kind: 'not-found'; readonly projectId: ProjectId }
  | { readonly kind: 'already-exists'; readonly projectId: ProjectId }
  | { readonly kind: 'invalid-name'; readonly message: string }
  | { readonly kind: 'invalid-payload'; readonly message: string }
  | { readonly kind: 'invalid-state'; readonly state: ProjectLifecycleState; readonly operation: string }
  | { readonly kind: 'invalid-import'; readonly cause: ProjectMigrationError }
  | { readonly kind: 'persistence'; readonly cause: LocalRepositoryError }

export interface ProjectLifecycleDependencies {
  readonly createId: () => ProjectId
  readonly now: () => Timestamp
}

export interface CreateProjectInput<TPayload extends JsonValue> {
  readonly name: string
  readonly payload: TPayload
  readonly metadata?: ProjectMetadata
}

export interface ImportProjectOptions {
  readonly onConflict?: 'reject' | 'duplicate'
}

function persistence<T>(result: Result<T, LocalRepositoryError>): Result<T, ProjectLifecycleError> {
  return result.ok ? result : failure({ kind: 'persistence', cause: result.error })
}

export class ProjectLifecycleService<TPayload extends JsonValue> {
  readonly #envelopeSchema: z.ZodType<ProjectEnvelope<TPayload>>

  constructor(
    private readonly repository: LocalRepository<ProjectRecord<TPayload>, ProjectId>,
    private readonly payloadSchema: z.ZodType<TPayload>,
    private readonly dependencies: ProjectLifecycleDependencies,
  ) {
    this.#envelopeSchema = createProjectEnvelopeSchema(payloadSchema)
  }

  async create(input: CreateProjectInput<TPayload>): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const name = this.validName(input.name)
    if (!name.ok) return name
    const payload = this.payloadSchema.safeParse(input.payload)
    if (!payload.success) return failure({ kind: 'invalid-payload', message: 'El payload no cumple el schema del proyecto.' })
    const now = this.dependencies.now()
    const record: ProjectRecord<TPayload> = {
      project: {
        format: PROJECT_FORMAT,
        schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
        projectId: this.dependencies.createId(),
        revision: 0,
        name: name.value,
        createdAt: now,
        updatedAt: now,
        metadata: input.metadata ?? {},
        payload: payload.data,
      },
      lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
    }
    return this.saveNew(record)
  }

  async duplicate(projectId: ProjectId, name?: string): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const found = await this.requireProject(projectId)
    if (!found.ok) return found
    if (found.value.lifecycle.state === 'trashed') return failure({ kind: 'invalid-state', state: 'trashed', operation: 'duplicate' })
    const duplicateName = this.validName(name ?? `${found.value.project.name} copia`)
    if (!duplicateName.ok) return duplicateName
    const now = this.dependencies.now()
    const record: ProjectRecord<TPayload> = {
      project: {
        ...found.value.project,
        projectId: this.dependencies.createId(),
        revision: 0,
        name: duplicateName.value,
        createdAt: now,
        updatedAt: now,
        metadata: structuredClone(found.value.project.metadata),
        payload: structuredClone(found.value.project.payload),
      },
      lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
    }
    return this.saveNew(record)
  }

  async rename(projectId: ProjectId, name: string): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const validName = this.validName(name)
    if (!validName.ok) return validName
    return this.update(projectId, 'rename', (record, now) => ({
      ...record,
      project: { ...record.project, name: validName.value, revision: record.project.revision + 1, updatedAt: now },
    }))
  }

  archive(projectId: ProjectId): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    return this.update(projectId, 'archive', (record, now) => {
      if (record.lifecycle.state !== 'active') return failure({ kind: 'invalid-state', state: record.lifecycle.state, operation: 'archive' })
      return success({
        project: { ...record.project, revision: record.project.revision + 1, updatedAt: now },
        lifecycle: { state: 'archived', archivedAt: now, trashedAt: null, restoreState: null },
      })
    })
  }

  moveToTrash(projectId: ProjectId): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    return this.update(projectId, 'move-to-trash', (record, now) => {
      if (record.lifecycle.state === 'trashed') return failure({ kind: 'invalid-state', state: 'trashed', operation: 'move-to-trash' })
      return success({
        project: { ...record.project, revision: record.project.revision + 1, updatedAt: now },
        lifecycle: {
          state: 'trashed',
          archivedAt: record.lifecycle.archivedAt,
          trashedAt: now,
          restoreState: record.lifecycle.state,
        },
      })
    })
  }

  delete(projectId: ProjectId): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    return this.moveToTrash(projectId)
  }

  recover(projectId: ProjectId): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    return this.update(projectId, 'recover', (record, now) => {
      if (record.lifecycle.state !== 'trashed') return failure({ kind: 'invalid-state', state: record.lifecycle.state, operation: 'recover' })
      const state = record.lifecycle.restoreState
      return success({
        project: { ...record.project, revision: record.project.revision + 1, updatedAt: now },
        lifecycle: state === 'archived'
          ? { state, archivedAt: record.lifecycle.archivedAt, trashedAt: null, restoreState: null }
          : { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
      })
    })
  }

  async exportProject(projectId: ProjectId): Promise<Result<string, ProjectLifecycleError>> {
    const found = await this.requireProject(projectId)
    if (!found.ok) return found
    if (found.value.lifecycle.state === 'trashed') return failure({ kind: 'invalid-state', state: 'trashed', operation: 'export' })
    const serialized = serializeCanonical(this.#envelopeSchema, found.value.project)
    if (!serialized.ok) {
      return failure({ kind: 'persistence', cause: { kind: 'corrupt-data', id: projectId, message: 'El proyecto no puede exportarse porque no cumple su schema.', recoverable: true } })
    }
    return success(serialized.value)
  }

  async importProject(source: string, options: ImportProjectOptions = {}): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const migrated = migrateProjectJson(source, this.payloadSchema)
    if (!migrated.ok) return failure({ kind: 'invalid-import', cause: migrated.error })
    const existing = await this.repository.findById(migrated.value.project.projectId)
    const checked = persistence(existing)
    if (!checked.ok) return checked

    let project = migrated.value.project
    if (checked.value) {
      if ((options.onConflict ?? 'reject') === 'reject') return failure({ kind: 'already-exists', projectId: project.projectId })
      const now = this.dependencies.now()
      project = { ...project, projectId: this.dependencies.createId(), revision: 0, createdAt: now, updatedAt: now }
    }
    const record: ProjectRecord<TPayload> = {
      project,
      lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
    }
    return this.saveNew(record)
  }

  private validName(name: string): Result<string, ProjectLifecycleError> {
    const parsed = ProjectNameSchema.safeParse(name)
    return parsed.success ? success(parsed.data) : failure({ kind: 'invalid-name', message: 'El nombre debe contener entre 1 y 160 caracteres.' })
  }

  private async requireProject(projectId: ProjectId): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const found = persistence(await this.repository.findById(projectId))
    if (!found.ok) return found
    return found.value ? success(found.value) : failure({ kind: 'not-found', projectId })
  }

  private async saveNew(record: ProjectRecord<TPayload>): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const projectId = record.project.projectId
    const existing = persistence(await this.repository.findById(projectId))
    if (!existing.ok) return existing
    if (existing.value) return failure({ kind: 'already-exists', projectId })
    const saved = persistence(await this.repository.save(record))
    return saved.ok ? success(record) : saved
  }

  private async update(
    projectId: ProjectId,
    operation: string,
    transform: (record: ProjectRecord<TPayload>, now: Timestamp) => ProjectRecord<TPayload> | Result<ProjectRecord<TPayload>, ProjectLifecycleError>,
  ): Promise<Result<ProjectRecord<TPayload>, ProjectLifecycleError>> {
    const found = await this.requireProject(projectId)
    if (!found.ok) return found
    if (operation === 'rename' && found.value.lifecycle.state === 'trashed') return failure({ kind: 'invalid-state', state: 'trashed', operation })
    const transformed = transform(found.value, this.dependencies.now())
    const record = 'ok' in transformed ? transformed : success(transformed)
    if (!record.ok) return record
    const saved = persistence(await this.repository.save(record.value))
    return saved.ok ? success(record.value) : saved
  }

}
