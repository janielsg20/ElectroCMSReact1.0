import type * as z from 'zod'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import { serializeCanonical } from '../../domain/project/canonical-json'
import type { ProjectId, ProjectJournalEntryId, ProjectSnapshotId, Timestamp } from '../../domain/project/identity'
import type { JsonValue } from '../../domain/project/project-envelope'
import {
  PROJECT_RECOVERY_SCHEMA_VERSION,
  type ProjectJournalEntry,
  type ProjectRecoveryState,
  type ProjectSnapshot,
} from '../../domain/project/project-recovery'
import { createProjectRecordSchema, type ProjectRecord } from '../../domain/project/project-record'

export type ProjectAutosaveError =
  | { readonly kind: 'not-found'; readonly projectId: ProjectId }
  | { readonly kind: 'invalid-revision'; readonly current: number; readonly target: number }
  | { readonly kind: 'invalid-state'; readonly message: string }
  | { readonly kind: 'persistence'; readonly stage: 'read' | 'prepare' | 'project' | 'recovery'; readonly cause: LocalRepositoryError }

export interface ProjectAutosaveReceipt {
  readonly snapshotId: ProjectSnapshotId
  readonly journalEntryId: ProjectJournalEntryId
  readonly status: 'saved' | 'saved-pending-reconciliation'
  readonly warning: LocalRepositoryError | null
}

export interface ProjectRecoveryReport {
  readonly restoredSnapshot: boolean
  readonly recoveredEntries: number
  readonly reconciledEntries: number
  readonly supersededEntries: number
  readonly conflicts: readonly ProjectJournalEntryId[]
}

export interface ProjectAutosaveDependencies {
  readonly createSnapshotId: () => ProjectSnapshotId
  readonly createJournalEntryId: () => ProjectJournalEntryId
  readonly now: () => Timestamp
  readonly maxSnapshots?: number
  readonly maxJournalEntries?: number
}

function persistence<T>(
  result: Result<T, LocalRepositoryError>,
  stage: Extract<ProjectAutosaveError, { kind: 'persistence' }>['stage'],
): Result<T, ProjectAutosaveError> {
  return result.ok ? result : failure({ kind: 'persistence', stage, cause: result.error })
}

export class ProjectAutosaveService<TPayload extends JsonValue> {
  readonly #maxSnapshots: number
  readonly #maxJournalEntries: number
  readonly #recordSchema: z.ZodType<ProjectRecord<TPayload>>

  constructor(
    private readonly projects: LocalRepository<ProjectRecord<TPayload>, ProjectId>,
    private readonly recoveryStates: LocalRepository<ProjectRecoveryState<TPayload>, ProjectId>,
    payloadSchema: z.ZodType<TPayload>,
    private readonly dependencies: ProjectAutosaveDependencies,
  ) {
    this.#maxSnapshots = Math.max(1, dependencies.maxSnapshots ?? 20)
    this.#maxJournalEntries = Math.max(1, dependencies.maxJournalEntries ?? 100)
    this.#recordSchema = createProjectRecordSchema(payloadSchema)
  }

  async save(next: ProjectRecord<TPayload>): Promise<Result<ProjectAutosaveReceipt, ProjectAutosaveError>> {
    const projectId = next.project.projectId
    const currentResult = persistence(await this.projects.findById(projectId), 'read')
    if (!currentResult.ok) return currentResult
    if (!currentResult.value) return failure({ kind: 'not-found', projectId })
    const current = currentResult.value
    if (current.lifecycle.state !== 'active' || next.lifecycle.state !== 'active') {
      return failure({ kind: 'invalid-state', message: 'El autoguardado solo acepta proyectos activos.' })
    }
    if (next.project.revision !== current.project.revision + 1) {
      return failure({ kind: 'invalid-revision', current: current.project.revision, target: next.project.revision })
    }

    const stateResult = persistence(await this.recoveryStates.findById(projectId), 'read')
    if (!stateResult.ok) return stateResult
    const now = this.dependencies.now()
    const snapshot: ProjectSnapshot<TPayload> = {
      id: this.dependencies.createSnapshotId(),
      projectId,
      revision: current.project.revision,
      createdAt: now,
      record: structuredClone(current),
    }
    const entry: ProjectJournalEntry<TPayload> = {
      id: this.dependencies.createJournalEntryId(),
      projectId,
      baseRevision: current.project.revision,
      targetRevision: next.project.revision,
      createdAt: now,
      status: 'pending',
      target: structuredClone(next),
    }
    const previous = stateResult.value ?? {
      projectId,
      schemaVersion: PROJECT_RECOVERY_SCHEMA_VERSION,
      snapshots: [],
      journalEntries: [],
    }
    const prepared: ProjectRecoveryState<TPayload> = {
      ...previous,
      snapshots: [...previous.snapshots, snapshot].slice(-this.#maxSnapshots),
      journalEntries: this.pruneJournal([...previous.journalEntries, entry]),
    }
    const preparedResult = persistence(await this.recoveryStates.save(prepared), 'prepare')
    if (!preparedResult.ok) return preparedResult

    const projectResult = persistence(await this.projects.save(next), 'project')
    if (!projectResult.ok) return projectResult

    const committed: ProjectRecoveryState<TPayload> = {
      ...prepared,
      journalEntries: this.pruneJournal(prepared.journalEntries.map((candidate) => candidate.id === entry.id ? { ...candidate, status: 'committed' as const } : candidate)),
    }
    const commitResult = await this.recoveryStates.save(committed)
    if (!commitResult.ok) {
      return success({ snapshotId: snapshot.id, journalEntryId: entry.id, status: 'saved-pending-reconciliation', warning: commitResult.error })
    }
    return success({ snapshotId: snapshot.id, journalEntryId: entry.id, status: 'saved', warning: null })
  }

  async recover(projectId: ProjectId): Promise<Result<ProjectRecoveryReport, ProjectAutosaveError>> {
    const stateResult = persistence(await this.recoveryStates.findById(projectId), 'recovery')
    if (!stateResult.ok) return stateResult
    if (!stateResult.value) return success({ restoredSnapshot: false, recoveredEntries: 0, reconciledEntries: 0, supersededEntries: 0, conflicts: [] })
    let state = stateResult.value
    let restoredSnapshot = false
    const currentResult = await this.projects.findById(projectId)
    let current: ProjectRecord<TPayload>
    if (!currentResult.ok) {
      if (currentResult.error.kind !== 'corrupt-data') return failure({ kind: 'persistence', stage: 'recovery', cause: currentResult.error })
      const snapshot = this.latestSnapshot(state.snapshots)
      if (!snapshot) return failure({ kind: 'persistence', stage: 'recovery', cause: currentResult.error })
      const restored = persistence(await this.projects.save(snapshot.record), 'recovery')
      if (!restored.ok) return restored
      current = snapshot.record
      restoredSnapshot = true
    } else if (!currentResult.value) {
      const snapshot = this.latestSnapshot(state.snapshots)
      if (!snapshot) return failure({ kind: 'not-found', projectId })
      const restored = persistence(await this.projects.save(snapshot.record), 'recovery')
      if (!restored.ok) return restored
      current = snapshot.record
      restoredSnapshot = true
    } else {
      current = currentResult.value
    }

    let recoveredEntries = 0
    let reconciledEntries = 0
    let supersededEntries = 0
    const conflicts: ProjectJournalEntryId[] = []
    const entries: ProjectJournalEntry<TPayload>[] = []
    for (const entry of state.journalEntries) {
      const canRestoreCommitted = restoredSnapshot
        && (entry.status === 'committed' || entry.status === 'recovered')
        && entry.targetRevision > current.project.revision
      if (entry.status !== 'pending' && !canRestoreCommitted) {
        entries.push(entry)
        continue
      }
      if (current.project.revision === entry.targetRevision && this.sameRecord(current, entry.target)) {
        entries.push({ ...entry, status: 'committed' })
        reconciledEntries += 1
      } else if (current.project.revision === entry.baseRevision) {
        const restored = persistence(await this.projects.save(entry.target), 'recovery')
        if (!restored.ok) return restored
        current = entry.target
        entries.push({ ...entry, status: 'recovered' })
        recoveredEntries += 1
      } else if (current.project.revision > entry.targetRevision) {
        entries.push({ ...entry, status: 'superseded' })
        supersededEntries += 1
      } else {
        entries.push(entry)
        conflicts.push(entry.id)
      }
    }

    state = { ...state, journalEntries: this.pruneJournal(entries) }
    const savedState = persistence(await this.recoveryStates.save(state), 'recovery')
    if (!savedState.ok) return savedState
    return success({ restoredSnapshot, recoveredEntries, reconciledEntries, supersededEntries, conflicts })
  }

  private pruneJournal(entries: readonly ProjectJournalEntry<TPayload>[]): readonly ProjectJournalEntry<TPayload>[] {
    const pending = entries.filter((entry) => entry.status === 'pending')
    const completed = entries.filter((entry) => entry.status !== 'pending').slice(-this.#maxJournalEntries)
    return [...completed, ...pending]
  }

  private latestSnapshot(snapshots: readonly ProjectSnapshot<TPayload>[]): ProjectSnapshot<TPayload> | null {
    return [...snapshots].sort((left, right) => right.revision - left.revision || right.createdAt.localeCompare(left.createdAt))[0] ?? null
  }

  private sameRecord(left: ProjectRecord<TPayload>, right: ProjectRecord<TPayload>): boolean {
    const leftSerialized = serializeCanonical(this.#recordSchema, left)
    const rightSerialized = serializeCanonical(this.#recordSchema, right)
    return leftSerialized.ok && rightSerialized.ok && leftSerialized.value === rightSerialized.value
  }
}

export interface AutosaveScheduler {
  set(callback: () => void, delayMs: number): unknown
  clear(handle: unknown): void
}

const defaultScheduler: AutosaveScheduler = {
  set: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clear: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export class DebouncedProjectAutosave<TPayload extends JsonValue> {
  #pending: ProjectRecord<TPayload> | null = null
  #timer: unknown = null

  constructor(
    private readonly service: ProjectAutosaveService<TPayload>,
    private readonly delayMs: number,
    private readonly onResult: (result: Result<ProjectAutosaveReceipt, ProjectAutosaveError>) => void,
    private readonly scheduler: AutosaveScheduler = defaultScheduler,
  ) {}

  schedule(record: ProjectRecord<TPayload>): void {
    this.#pending = record
    if (this.#timer !== null) this.scheduler.clear(this.#timer)
    this.#timer = this.scheduler.set(() => { void this.flush() }, this.delayMs)
  }

  async flush(): Promise<Result<ProjectAutosaveReceipt, ProjectAutosaveError> | null> {
    if (this.#timer !== null) this.scheduler.clear(this.#timer)
    this.#timer = null
    const record = this.#pending
    this.#pending = null
    if (!record) return null
    const result = await this.service.save(record)
    this.onResult(result)
    return result
  }

  cancel(): void {
    if (this.#timer !== null) this.scheduler.clear(this.#timer)
    this.#timer = null
    this.#pending = null
  }
}
