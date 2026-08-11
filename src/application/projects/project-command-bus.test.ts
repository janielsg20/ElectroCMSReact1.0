import * as z from 'zod'
import { beforeEach, describe, expect, it } from 'vitest'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import { parseProjectId, parseTimestamp, type ProjectId } from '../../domain/project/identity'
import { parseProjectHistoryEntryId, type ProjectHistoryState } from '../../domain/project/project-history'
import type { ProjectRecord } from '../../domain/project/project-record'
import {
  CompositeProjectCommand,
  ProjectCommandBus,
  type ReversibleProjectCommand,
} from './project-command-bus'

const PayloadSchema = z.strictObject({ title: z.string(), count: z.number().int() })
type Payload = z.infer<typeof PayloadSchema>
const PROJECT_ID = parseProjectId('11111111-1111-4111-8111-111111111111')
const CREATED_AT = parseTimestamp('2026-08-10T00:00:00.000Z')

function record(revision: number, title = 'Inicio', count = 0): ProjectRecord<Payload> {
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
      payload: { title, count },
    },
    lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
  }
}

function setTitle(id: string, title: string): ReversibleProjectCommand<Payload> {
  return {
    id,
    label: `Título ${title}`,
    apply(current) {
      return success({ ...current, project: { ...current.project, payload: { ...current.project.payload, title } } })
    },
  }
}

function increment(id: string): ReversibleProjectCommand<Payload> {
  return {
    id,
    label: 'Incrementar',
    apply(current) {
      return success({ ...current, project: { ...current.project, payload: { ...current.project.payload, count: current.project.payload.count + 1 } } })
    },
  }
}

class ControlledRepository<TEntity, TId> implements LocalRepository<TEntity, TId> {
  readonly entities = new Map<TId, TEntity>()
  readonly failedSaveCalls = new Set<number>()
  saveCalls = 0

  constructor(private readonly getId: (entity: TEntity) => TId) {}

  findById(id: TId): Promise<Result<TEntity | null, LocalRepositoryError>> {
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
      const result = await this.save(entity)
      if (!result.ok) return result
    }
    return success(undefined)
  }

  remove(id: TId): Promise<Result<boolean, LocalRepositoryError>> {
    return Promise.resolve(success(this.entities.delete(id)))
  }

  close(): void {}
}

let projects: ControlledRepository<ProjectRecord<Payload>, ProjectId>
let histories: ControlledRepository<ProjectHistoryState<Payload>, ProjectId>
let bus: ProjectCommandBus<Payload>

beforeEach(() => {
  projects = new ControlledRepository((value) => value.project.projectId)
  histories = new ControlledRepository((value) => value.projectId)
  projects.entities.set(PROJECT_ID, record(0))
  let id = 0
  let minute = 10
  bus = new ProjectCommandBus(projects, histories, PayloadSchema, {
    createHistoryEntryId: () => parseProjectHistoryEntryId(`${String(++id).padStart(8, '0')}-2222-4222-8222-222222222222`),
    now: () => parseTimestamp(`2026-08-10T00:${minute++}:00.000Z`),
    maxEntries: 3,
  })
})

describe('ProjectCommandBus', () => {
  it('ejecuta, deshace y rehace conservando revisiones monotónicas', async () => {
    await expect(bus.execute(setTitle('title-a', 'A'), PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { cursor: 1, status: 'applied' } })
    expect(projects.entities.get(PROJECT_ID)?.project).toMatchObject({ revision: 1, payload: { title: 'A' } })

    await expect(bus.undo(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { cursor: 0 } })
    expect(projects.entities.get(PROJECT_ID)?.project).toMatchObject({ revision: 2, payload: { title: 'Inicio' } })

    await expect(bus.redo(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { cursor: 1 } })
    expect(projects.entities.get(PROJECT_ID)?.project).toMatchObject({ revision: 3, payload: { title: 'A' } })
  })

  it('crea una rama nueva después de undo y descarta el redo anterior', async () => {
    await bus.execute(setTitle('title-a', 'A'), PROJECT_ID)
    await bus.execute(setTitle('title-b', 'B'), PROJECT_ID)
    await bus.undo(PROJECT_ID)
    await bus.execute(setTitle('title-c', 'C'), PROJECT_ID)

    const history = histories.entities.get(PROJECT_ID)
    expect(history?.entries.map((entry) => entry.commandIds[0])).toEqual(['title-a', 'title-c'])
    expect(history?.cursor).toBe(2)
    await expect(bus.redo(PROJECT_ID)).resolves.toMatchObject({ ok: false, error: { kind: 'nothing-to-redo' } })
  })

  it('agrupa comandos en una transacción compuesta y no persiste parciales si uno falla', async () => {
    const composite = new CompositeProjectCommand('tx', 'Actualizar tarjeta', [setTitle('title', 'Compuesto'), increment('count')])
    await expect(bus.execute(composite, PROJECT_ID)).resolves.toMatchObject({ ok: true })
    expect(projects.entities.get(PROJECT_ID)?.project.payload).toEqual({ title: 'Compuesto', count: 1 })
    expect(histories.entities.get(PROJECT_ID)?.entries[0]?.commandIds).toEqual(['title', 'count'])

    const failing: ReversibleProjectCommand<Payload> = { id: 'fail', label: 'Falla', apply: () => failure({ message: 'No válido' }) }
    const broken = new CompositeProjectCommand('broken', 'Transacción rota', [increment('first'), failing])
    const revision = projects.entities.get(PROJECT_ID)?.project.revision
    await expect(bus.execute(broken, PROJECT_ID)).resolves.toMatchObject({ ok: false, error: { kind: 'command-failed' } })
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(revision)
    expect(histories.entities.get(PROJECT_ID)?.entries).toHaveLength(1)
  })

  it('aplica el límite configurado manteniendo una cadena reversible coherente', async () => {
    bus = new ProjectCommandBus(projects, histories, PayloadSchema, {
      createHistoryEntryId: (() => { let id = 0; return () => parseProjectHistoryEntryId(`${String(++id).padStart(8, '0')}-4444-4444-8444-444444444444`) })(),
      now: () => parseTimestamp('2026-08-10T01:00:00.000Z'),
      maxEntries: 2,
    })
    await bus.execute(setTitle('one', 'Uno'), PROJECT_ID)
    await bus.execute(setTitle('two', 'Dos'), PROJECT_ID)
    await bus.execute(setTitle('three', 'Tres'), PROJECT_ID)

    expect(histories.entities.get(PROJECT_ID)?.entries.map((entry) => entry.commandIds[0])).toEqual(['two', 'three'])
    await bus.undo(PROJECT_ID)
    await bus.undo(PROJECT_ID)
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Uno')
    await expect(bus.undo(PROJECT_ID)).resolves.toMatchObject({ ok: false, error: { kind: 'nothing-to-undo' } })
  })

  it('recupera una ejecución pendiente cuando falla la escritura del proyecto', async () => {
    projects.failedSaveCalls.add(1)
    await expect(bus.execute(setTitle('pending', 'Pendiente'), PROJECT_ID)).resolves.toMatchObject({ ok: false, error: { kind: 'persistence', stage: 'project' } })
    expect(histories.entities.get(PROJECT_ID)?.pending?.kind).toBe('execute')
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Inicio')

    projects.failedSaveCalls.clear()
    await expect(bus.recover(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { recovered: true, cursor: 1 } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Pendiente')
    expect(histories.entities.get(PROJECT_ID)?.pending).toBeNull()
  })

  it('reconcilia el cursor si el proyecto se guardó pero falló la confirmación del historial', async () => {
    histories.failedSaveCalls.add(2)
    await expect(bus.execute(setTitle('reconcile', 'Guardado'), PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { status: 'applied-pending-reconciliation' } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.title).toBe('Guardado')
    expect(histories.entities.get(PROJECT_ID)?.pending).not.toBeNull()

    histories.failedSaveCalls.clear()
    await expect(bus.recover(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { reconciled: true, cursor: 1 } })
    expect(histories.entities.get(PROJECT_ID)?.pending).toBeNull()
  })

  it('detecta cambios externos que ya no corresponden al cursor del historial', async () => {
    await bus.execute(setTitle('tracked', 'A'), PROJECT_ID)
    projects.entities.set(PROJECT_ID, record(2, 'Cambio externo'))
    await expect(bus.undo(PROJECT_ID)).resolves.toMatchObject({ ok: false, error: { kind: 'history-conflict' } })
  })
})
