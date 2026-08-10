import * as z from 'zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import {
  parseProjectId,
  parseProjectJournalEntryId,
  parseProjectSnapshotId,
  parseTimestamp,
  type ProjectId,
} from '../../domain/project/identity'
import type { ProjectRecoveryState } from '../../domain/project/project-recovery'
import type { ProjectRecord } from '../../domain/project/project-record'
import {
  DebouncedProjectAutosave,
  ProjectAutosaveService,
  type AutosaveScheduler,
} from './project-autosave-service'

const PayloadSchema = z.strictObject({ title: z.string() })
type Payload = z.infer<typeof PayloadSchema>
const PROJECT_ID = parseProjectId('11111111-1111-4111-8111-111111111111')
const CREATED_AT = parseTimestamp('2026-08-10T00:00:00.000Z')

function record(revision: number, title = `Revisión ${revision}`): ProjectRecord<Payload> {
  return {
    project: {
      format: 'electrocms.project',
      schemaVersion: 1,
      projectId: PROJECT_ID,
      revision,
      name: 'Proyecto',
      createdAt: CREATED_AT,
      updatedAt: parseTimestamp(`2026-08-10T00:${String(revision).padStart(2, '0')}:00.000Z`),
      metadata: {},
      payload: { title },
    },
    lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
  }
}

class ControlledRepository<TEntity, TId> implements LocalRepository<TEntity, TId> {
  readonly entities = new Map<TId, TEntity>()
  readonly failedSaveCalls = new Set<number>()
  nextFindError: LocalRepositoryError | null = null
  saveCalls = 0

  constructor(private readonly getId: (entity: TEntity) => TId) {}

  findById(id: TId): Promise<Result<TEntity | null, LocalRepositoryError>> {
    if (this.nextFindError) {
      const error = this.nextFindError
      this.nextFindError = null
      return Promise.resolve(failure(error))
    }
    return Promise.resolve(success(structuredClone(this.entities.get(id) ?? null)))
  }

  list(): Promise<Result<readonly TEntity[], LocalRepositoryError>> {
    return Promise.resolve(success(structuredClone([...this.entities.values()])))
  }

  listBySchemaVersion(): Promise<Result<readonly TEntity[], LocalRepositoryError>> {
    return this.list()
  }

  save(entity: TEntity): Promise<Result<void, LocalRepositoryError>> {
    this.saveCalls += 1
    if (this.failedSaveCalls.has(this.saveCalls)) {
      return Promise.resolve(failure({ kind: 'storage-failure', message: 'Fallo simulado', recoverable: true }))
    }
    this.entities.set(this.getId(entity), structuredClone(entity))
    return Promise.resolve(success(undefined))
  }

  async saveMany(entities: readonly TEntity[]): Promise<Result<void, LocalRepositoryError>> {
    for (const entity of entities) {
      const saved = await this.save(entity)
      if (!saved.ok) return saved
    }
    return success(undefined)
  }

  remove(id: TId): Promise<Result<boolean, LocalRepositoryError>> {
    return Promise.resolve(success(this.entities.delete(id)))
  }

  close(): void {}
}

let projects: ControlledRepository<ProjectRecord<Payload>, ProjectId>
let recovery: ControlledRepository<ProjectRecoveryState<Payload>, ProjectId>
let service: ProjectAutosaveService<Payload>

beforeEach(() => {
  projects = new ControlledRepository((value) => value.project.projectId)
  recovery = new ControlledRepository((value) => value.projectId)
  projects.entities.set(PROJECT_ID, record(0))
  let snapshotId = 0
  let journalId = 0
  let minute = 10
  service = new ProjectAutosaveService(projects, recovery, PayloadSchema, {
    createSnapshotId: () => parseProjectSnapshotId(`${String(++snapshotId).padStart(8, '0')}-2222-4222-8222-222222222222`),
    createJournalEntryId: () => parseProjectJournalEntryId(`${String(++journalId).padStart(8, '0')}-3333-4333-8333-333333333333`),
    now: () => parseTimestamp(`2026-08-10T00:${minute++}:00.000Z`),
    maxSnapshots: 2,
    maxJournalEntries: 2,
  })
})

describe('ProjectAutosaveService', () => {
  it('prepara snapshot, guarda la revisión y confirma el journal', async () => {
    const result = await service.save(record(1))
    expect(result).toMatchObject({ ok: true, value: { status: 'saved', warning: null } })
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(1)
    expect(recovery.entities.get(PROJECT_ID)).toMatchObject({
      snapshots: [{ revision: 0 }],
      journalEntries: [{ baseRevision: 0, targetRevision: 1, status: 'committed' }],
    })
  })

  it('conserva la última revisión válida y journal pendiente si falla la escritura', async () => {
    projects.failedSaveCalls.add(1)
    const result = await service.save(record(1, 'Pendiente'))
    expect(result).toMatchObject({ ok: false, error: { kind: 'persistence', stage: 'project' } })
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(0)
    expect(recovery.entities.get(PROJECT_ID)?.journalEntries[0]).toMatchObject({ status: 'pending', targetRevision: 1 })
  })

  it('recupera una escritura interrumpida desde el journal', async () => {
    projects.failedSaveCalls.add(1)
    await service.save(record(1, 'Recuperada'))
    projects.failedSaveCalls.clear()

    const result = await service.recover(PROJECT_ID)
    expect(result).toMatchObject({ ok: true, value: { recoveredEntries: 1, conflicts: [] } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Recuperada')
    expect(recovery.entities.get(PROJECT_ID)?.journalEntries[0]?.status).toBe('recovered')
  })

  it('reconcilia un commit completo cuya confirmación de journal falló', async () => {
    recovery.failedSaveCalls.add(2)
    const saved = await service.save(record(1))
    expect(saved).toMatchObject({ ok: true, value: { status: 'saved-pending-reconciliation', warning: { kind: 'storage-failure' } } })
    recovery.failedSaveCalls.clear()

    await expect(service.recover(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { reconciledEntries: 1 } })
    expect(recovery.entities.get(PROJECT_ID)?.journalEntries[0]?.status).toBe('committed')
  })

  it('restaura un proyecto corrupto y reaplica el último journal confirmado', async () => {
    await service.save(record(1, 'Último válido'))
    projects.nextFindError = { kind: 'corrupt-data', id: PROJECT_ID, message: 'Alterado', recoverable: true }

    const result = await service.recover(PROJECT_ID)
    expect(result).toMatchObject({ ok: true, value: { restoredSnapshot: true, recoveredEntries: 1 } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Último válido')
  })

  it('no sobrescribe una revisión incompatible y reporta conflicto', async () => {
    const target = record(2, 'No aplicar')
    recovery.entities.set(PROJECT_ID, {
      projectId: PROJECT_ID,
      schemaVersion: 1,
      snapshots: [],
      journalEntries: [{
        id: parseProjectJournalEntryId('99999999-3333-4333-8333-333333333333'),
        projectId: PROJECT_ID,
        baseRevision: 1,
        targetRevision: 2,
        createdAt: CREATED_AT,
        status: 'pending',
        target,
      }],
    })

    const result = await service.recover(PROJECT_ID)
    expect(result).toMatchObject({ ok: true, value: { conflicts: ['99999999-3333-4333-8333-333333333333'] } })
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(0)
  })

  it('limita snapshots y entradas confirmadas sin eliminar pendientes', async () => {
    await service.save(record(1))
    await service.save(record(2))
    await service.save(record(3))
    const state = recovery.entities.get(PROJECT_ID)
    expect(state?.snapshots.map((item) => item.revision)).toEqual([1, 2])
    expect(state?.journalEntries.map((item) => item.targetRevision)).toEqual([2, 3])
  })

  it('rechaza saltos de revisión y proyectos no activos', async () => {
    await expect(service.save(record(2))).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-revision', current: 0, target: 2 } })
    const archived = { ...record(1), lifecycle: { state: 'archived' as const, archivedAt: CREATED_AT, trashedAt: null, restoreState: null } }
    await expect(service.save(archived)).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-state' } })
  })
})

describe('DebouncedProjectAutosave', () => {
  it('conserva solo la edición más reciente y permite cancelar', async () => {
    const callbacks = new Map<number, () => void>()
    let handle = 0
    const scheduler: AutosaveScheduler = {
      set(callback) {
        handle += 1
        callbacks.set(handle, callback)
        return handle
      },
      clear(value) {
        callbacks.delete(value as number)
      },
    }
    const onResult = vi.fn()
    const autosave = new DebouncedProjectAutosave(service, 500, onResult, scheduler)
    autosave.schedule(record(1, 'Primera'))
    autosave.schedule(record(1, 'Última'))
    expect(callbacks.size).toBe(1)

    await expect(autosave.flush()).resolves.toMatchObject({ ok: true })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Última')
    expect(onResult).toHaveBeenCalledOnce()

    autosave.schedule(record(2, 'Cancelar'))
    autosave.cancel()
    await expect(autosave.flush()).resolves.toBeNull()
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(1)
  })
})
