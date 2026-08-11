import type * as z from 'zod'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import { serializeCanonical } from '../../domain/project/canonical-json'
import type { ProjectId, Timestamp } from '../../domain/project/identity'
import type { JsonValue } from '../../domain/project/project-envelope'
import {
  createEmptyProjectHistoryState,
  createProjectHistoryStateSchema,
  type PendingProjectHistoryOperation,
  type ProjectHistoryEntry,
  type ProjectHistoryEntryId,
  type ProjectHistoryState,
} from '../../domain/project/project-history'
import { createProjectRecordSchema, type ProjectRecord } from '../../domain/project/project-record'

export interface ProjectCommandFailure {
  readonly message: string
}

export interface ReversibleProjectCommand<TPayload extends JsonValue> {
  readonly id: string
  readonly label: string
  readonly commandIds?: readonly string[]
  apply(current: ProjectRecord<TPayload>): Result<ProjectRecord<TPayload>, ProjectCommandFailure>
}

export class CompositeProjectCommand<TPayload extends JsonValue> implements ReversibleProjectCommand<TPayload> {
  readonly commandIds: readonly string[]

  constructor(
    readonly id: string,
    readonly label: string,
    private readonly commands: readonly ReversibleProjectCommand<TPayload>[],
  ) {
    this.commandIds = commands.flatMap((command) => command.commandIds ?? [command.id])
  }

  apply(current: ProjectRecord<TPayload>): Result<ProjectRecord<TPayload>, ProjectCommandFailure> {
    let next = structuredClone(current)
    for (const command of this.commands) {
      const result = command.apply(next)
      if (!result.ok) return failure({ message: `${command.label}: ${result.error.message}` })
      next = result.value
    }
    return success(next)
  }
}

export type ProjectCommandBusError =
  | { readonly kind: 'not-found'; readonly projectId: ProjectId }
  | { readonly kind: 'nothing-to-undo' }
  | { readonly kind: 'nothing-to-redo' }
  | { readonly kind: 'pending-operation'; readonly entryId: ProjectHistoryEntryId }
  | { readonly kind: 'command-failed'; readonly commandId: string; readonly message: string }
  | { readonly kind: 'invalid-command-output'; readonly commandId: string; readonly message: string }
  | { readonly kind: 'history-conflict'; readonly message: string }
  | { readonly kind: 'persistence'; readonly stage: 'read-project' | 'read-history' | 'prepare-history' | 'project' | 'finalize-history' | 'recover'; readonly cause: LocalRepositoryError }

export interface ProjectCommandReceipt {
  readonly entryId: ProjectHistoryEntryId
  readonly cursor: number
  readonly status: 'applied' | 'applied-pending-reconciliation'
  readonly warning: LocalRepositoryError | null
}

export interface ProjectCommandRecoveryReport {
  readonly recovered: boolean
  readonly reconciled: boolean
  readonly cursor: number
}

export interface ProjectCommandBusDependencies {
  readonly createHistoryEntryId: () => ProjectHistoryEntryId
  readonly now: () => Timestamp
  readonly maxEntries?: number
}

function persistence<T>(
  result: Result<T, LocalRepositoryError>,
  stage: Extract<ProjectCommandBusError, { kind: 'persistence' }>['stage'],
): Result<T, ProjectCommandBusError> {
  return result.ok ? result : failure({ kind: 'persistence', stage, cause: result.error })
}

export class ProjectCommandBus<TPayload extends JsonValue> {
  readonly #maxEntries: number
  readonly #recordSchema: z.ZodType<ProjectRecord<TPayload>>
  readonly #historySchema: z.ZodType<ProjectHistoryState<TPayload>>

  constructor(
    private readonly projects: LocalRepository<ProjectRecord<TPayload>, ProjectId>,
    private readonly histories: LocalRepository<ProjectHistoryState<TPayload>, ProjectId>,
    payloadSchema: z.ZodType<TPayload>,
    private readonly dependencies: ProjectCommandBusDependencies,
  ) {
    this.#maxEntries = Math.max(1, dependencies.maxEntries ?? 100)
    this.#recordSchema = createProjectRecordSchema(payloadSchema)
    this.#historySchema = createProjectHistoryStateSchema(payloadSchema)
  }

  async execute(command: ReversibleProjectCommand<TPayload>, projectId: ProjectId): Promise<Result<ProjectCommandReceipt, ProjectCommandBusError>> {
    const loaded = await this.load(projectId)
    if (!loaded.ok) return loaded
    const { current, history } = loaded.value
    const ready = this.ensureReady(current, history)
    if (!ready.ok) return ready

    const applied = command.apply(structuredClone(current))
    if (!applied.ok) return failure({ kind: 'command-failed', commandId: command.id, message: applied.error.message })
    const target = this.stamp(applied.value, current)
    const valid = this.#recordSchema.safeParse(target)
    if (!valid.success) return failure({ kind: 'invalid-command-output', commandId: command.id, message: 'El comando produjo un ProjectRecord inválido.' })
    if (!this.identityPreserved(current, target)) return failure({ kind: 'invalid-command-output', commandId: command.id, message: 'El comando intentó cambiar la identidad o versión base del proyecto.' })
    if (this.sameLogicalRecord(current, target)) return failure({ kind: 'command-failed', commandId: command.id, message: 'El comando no produjo cambios.' })

    const entry: ProjectHistoryEntry<TPayload> = {
      id: this.dependencies.createHistoryEntryId(),
      projectId,
      label: command.label,
      commandIds: command.commandIds ?? [command.id],
      createdAt: this.dependencies.now(),
      before: structuredClone(current),
      after: structuredClone(target),
    }
    const branch = [...history.entries.slice(0, history.cursor), entry].slice(-this.#maxEntries)
    const sourceCursor = Math.max(0, branch.length - 1)
    const targetCursor = branch.length
    const prepared: ProjectHistoryState<TPayload> = {
      ...history,
      entries: branch,
      cursor: sourceCursor,
      pending: {
        kind: 'execute',
        entryId: entry.id,
        sourceCursor,
        targetCursor,
        startedAt: this.dependencies.now(),
        target,
      },
    }
    return this.persistOperation(prepared)
  }

  async undo(projectId: ProjectId): Promise<Result<ProjectCommandReceipt, ProjectCommandBusError>> {
    const loaded = await this.load(projectId)
    if (!loaded.ok) return loaded
    const { current, history } = loaded.value
    const ready = this.ensureReady(current, history)
    if (!ready.ok) return ready
    if (history.cursor === 0) return failure({ kind: 'nothing-to-undo' })
    const entry = history.entries[history.cursor - 1]
    if (!entry) return failure({ kind: 'history-conflict', message: 'No existe la entrada apuntada por el cursor de undo.' })
    if (!this.sameLogicalRecord(current, entry.after)) return failure({ kind: 'history-conflict', message: 'El proyecto actual no coincide con el extremo aplicado del historial.' })

    const target = this.stamp(entry.before, current)
    const prepared: ProjectHistoryState<TPayload> = {
      ...history,
      pending: {
        kind: 'undo',
        entryId: entry.id,
        sourceCursor: history.cursor,
        targetCursor: history.cursor - 1,
        startedAt: this.dependencies.now(),
        target,
      },
    }
    return this.persistOperation(prepared)
  }

  async redo(projectId: ProjectId): Promise<Result<ProjectCommandReceipt, ProjectCommandBusError>> {
    const loaded = await this.load(projectId)
    if (!loaded.ok) return loaded
    const { current, history } = loaded.value
    const ready = this.ensureReady(current, history)
    if (!ready.ok) return ready
    if (history.cursor >= history.entries.length) return failure({ kind: 'nothing-to-redo' })
    const entry = history.entries[history.cursor]
    if (!entry) return failure({ kind: 'history-conflict', message: 'No existe la entrada apuntada por el cursor de redo.' })
    if (!this.sameLogicalRecord(current, entry.before)) return failure({ kind: 'history-conflict', message: 'El proyecto actual no coincide con el extremo previo del historial.' })

    const target = this.stamp(entry.after, current)
    const prepared: ProjectHistoryState<TPayload> = {
      ...history,
      pending: {
        kind: 'redo',
        entryId: entry.id,
        sourceCursor: history.cursor,
        targetCursor: history.cursor + 1,
        startedAt: this.dependencies.now(),
        target,
      },
    }
    return this.persistOperation(prepared)
  }

  async recover(projectId: ProjectId): Promise<Result<ProjectCommandRecoveryReport, ProjectCommandBusError>> {
    const historyResult = persistence(await this.histories.findById(projectId), 'recover')
    if (!historyResult.ok) return historyResult
    const history = historyResult.value
    if (!history?.pending) return success({ recovered: false, reconciled: false, cursor: history?.cursor ?? 0 })

    const currentResult = persistence(await this.projects.findById(projectId), 'recover')
    if (!currentResult.ok) return currentResult
    if (!currentResult.value) return failure({ kind: 'not-found', projectId })
    const current = currentResult.value
    const pending = history.pending
    const source = this.sourceForPending(history, pending)
    if (!source) return failure({ kind: 'history-conflict', message: 'La operación pendiente referencia un extremo de historial inválido.' })

    if (this.sameLogicalRecord(current, pending.target)) {
      const finalized = persistence(await this.histories.save({ ...history, cursor: pending.targetCursor, pending: null }), 'recover')
      return finalized.ok ? success({ recovered: false, reconciled: true, cursor: pending.targetCursor }) : finalized
    }

    if (!this.sameLogicalRecord(current, source)) {
      return failure({ kind: 'history-conflict', message: 'El proyecto persistido no coincide con el origen ni con el destino de la operación pendiente.' })
    }

    const savedProject = persistence(await this.projects.save(pending.target), 'recover')
    if (!savedProject.ok) return savedProject
    const finalized = persistence(await this.histories.save({ ...history, cursor: pending.targetCursor, pending: null }), 'recover')
    return finalized.ok ? success({ recovered: true, reconciled: false, cursor: pending.targetCursor }) : finalized
  }

  private async load(projectId: ProjectId): Promise<Result<{ current: ProjectRecord<TPayload>; history: ProjectHistoryState<TPayload> }, ProjectCommandBusError>> {
    const currentResult = persistence(await this.projects.findById(projectId), 'read-project')
    if (!currentResult.ok) return currentResult
    if (!currentResult.value) return failure({ kind: 'not-found', projectId })
    const historyResult = persistence(await this.histories.findById(projectId), 'read-history')
    if (!historyResult.ok) return historyResult
    return success({ current: currentResult.value, history: historyResult.value ?? createEmptyProjectHistoryState(projectId) })
  }

  private ensureReady(current: ProjectRecord<TPayload>, history: ProjectHistoryState<TPayload>): Result<void, ProjectCommandBusError> {
    if (history.pending) return failure({ kind: 'pending-operation', entryId: history.pending.entryId })
    const expected = history.cursor === 0 ? history.entries[0]?.before : history.entries[history.cursor - 1]?.after
    if (expected && !this.sameLogicalRecord(current, expected)) {
      return failure({ kind: 'history-conflict', message: 'El cursor del historial no representa el estado lógico actual del proyecto.' })
    }
    return success(undefined)
  }

  private async persistOperation(prepared: ProjectHistoryState<TPayload>): Promise<Result<ProjectCommandReceipt, ProjectCommandBusError>> {
    const parsed = this.#historySchema.safeParse(prepared)
    if (!parsed.success || !prepared.pending) return failure({ kind: 'history-conflict', message: 'La operación preparada viola las invariantes del historial.' })
    const pending = prepared.pending
    const preparedResult = persistence(await this.histories.save(prepared), 'prepare-history')
    if (!preparedResult.ok) return preparedResult
    const projectResult = persistence(await this.projects.save(pending.target), 'project')
    if (!projectResult.ok) return projectResult
    const finalized = { ...prepared, cursor: pending.targetCursor, pending: null }
    const finalResult = await this.histories.save(finalized)
    if (!finalResult.ok) {
      return success({ entryId: pending.entryId, cursor: pending.targetCursor, status: 'applied-pending-reconciliation', warning: finalResult.error })
    }
    return success({ entryId: pending.entryId, cursor: pending.targetCursor, status: 'applied', warning: null })
  }

  private sourceForPending(history: ProjectHistoryState<TPayload>, pending: PendingProjectHistoryOperation<TPayload>): ProjectRecord<TPayload> | null {
    const entry = history.entries.find((candidate) => candidate.id === pending.entryId)
    if (!entry) return null
    return pending.kind === 'undo' ? entry.after : entry.before
  }

  private stamp(template: ProjectRecord<TPayload>, current: ProjectRecord<TPayload>): ProjectRecord<TPayload> {
    return {
      ...structuredClone(template),
      project: {
        ...structuredClone(template.project),
        format: current.project.format,
        schemaVersion: current.project.schemaVersion,
        projectId: current.project.projectId,
        createdAt: current.project.createdAt,
        revision: current.project.revision + 1,
        updatedAt: this.dependencies.now(),
      },
    }
  }

  private identityPreserved(current: ProjectRecord<TPayload>, target: ProjectRecord<TPayload>): boolean {
    return current.project.projectId === target.project.projectId
      && current.project.format === target.project.format
      && current.project.schemaVersion === target.project.schemaVersion
      && current.project.createdAt === target.project.createdAt
  }

  private sameLogicalRecord(left: ProjectRecord<TPayload>, right: ProjectRecord<TPayload>): boolean {
    const normalize = (record: ProjectRecord<TPayload>): ProjectRecord<TPayload> => ({
      ...record,
      project: { ...record.project, revision: 0, updatedAt: record.project.createdAt },
    })
    const leftSerialized = serializeCanonical(this.#recordSchema, normalize(left))
    const rightSerialized = serializeCanonical(this.#recordSchema, normalize(right))
    return leftSerialized.ok && rightSerialized.ok && leftSerialized.value === rightSerialized.value
  }
}
