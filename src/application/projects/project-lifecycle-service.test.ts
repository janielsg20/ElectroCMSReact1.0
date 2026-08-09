import * as z from 'zod'
import { beforeEach, describe, expect, it } from 'vitest'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import projectV0 from '../../domain/project/fixtures/project-v0.json'
import { parseProjectId, parseTimestamp, type ProjectId } from '../../domain/project/identity'
import type { ProjectRecord } from '../../domain/project/project-record'
import { ProjectLifecycleService } from './project-lifecycle-service'

const PayloadSchema = z.strictObject({ title: z.string() })
type Payload = z.infer<typeof PayloadSchema>

const IDS = [
  parseProjectId('11111111-1111-4111-8111-111111111111'),
  parseProjectId('22222222-2222-4222-8222-222222222222'),
  parseProjectId('33333333-3333-4333-8333-333333333333'),
]
const TIMES = [
  parseTimestamp('2026-08-09T20:00:00.000Z'),
  parseTimestamp('2026-08-09T20:01:00.000Z'),
  parseTimestamp('2026-08-09T20:02:00.000Z'),
  parseTimestamp('2026-08-09T20:03:00.000Z'),
  parseTimestamp('2026-08-09T20:04:00.000Z'),
]

class TestLocalRepository<TEntity, TId> implements LocalRepository<TEntity, TId> {
  readonly entities = new Map<TId, TEntity>()
  failure: LocalRepositoryError | null = null

  constructor(private readonly getId: (entity: TEntity) => TId) {}

  findById(id: TId): Promise<Result<TEntity | null, LocalRepositoryError>> {
    return Promise.resolve(this.failure ? failure(this.failure) : success(this.entities.get(id) ?? null))
  }

  list(): Promise<Result<readonly TEntity[], LocalRepositoryError>> {
    return Promise.resolve(this.failure ? failure(this.failure) : success([...this.entities.values()]))
  }

  listBySchemaVersion(): Promise<Result<readonly TEntity[], LocalRepositoryError>> {
    return this.list()
  }

  save(entity: TEntity): Promise<Result<void, LocalRepositoryError>> {
    if (this.failure) return Promise.resolve(failure(this.failure))
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
    return Promise.resolve(this.failure ? failure(this.failure) : success(this.entities.delete(id)))
  }

  close(): void {}
}

let repository: TestLocalRepository<ProjectRecord<Payload>, ProjectId>
let service: ProjectLifecycleService<Payload>

beforeEach(() => {
  repository = new TestLocalRepository((record) => record.project.projectId)
  let idIndex = 0
  let timeIndex = 0
  service = new ProjectLifecycleService(repository, PayloadSchema, {
    createId: () => IDS[idIndex++],
    now: () => TIMES[timeIndex++],
  })
})

describe('ProjectLifecycleService', () => {
  it('crea proyectos activos con identidad y envelope válidos', async () => {
    const result = await service.create({ name: '  Mi sitio  ', payload: { title: 'Inicio' }, metadata: { locale: 'es' } })
    expect(result).toMatchObject({
      ok: true,
      value: {
        project: { projectId: IDS[0], name: 'Mi sitio', revision: 0, createdAt: TIMES[0], metadata: { locale: 'es' } },
        lifecycle: { state: 'active' },
      },
    })
  })

  it('duplica con ID, revisión y fechas nuevas sin compartir payload', async () => {
    const created = await service.create({ name: 'Original', payload: { title: 'Inicio' } })
    if (!created.ok) throw new Error('Precondición inválida')
    const duplicated = await service.duplicate(created.value.project.projectId)
    expect(duplicated).toMatchObject({ ok: true, value: { project: { projectId: IDS[1], name: 'Original copia', revision: 0, createdAt: TIMES[1] }, lifecycle: { state: 'active' } } })
    if (!duplicated.ok) return
    expect(duplicated.value.project.payload).toEqual(created.value.project.payload)
    expect(duplicated.value.project.payload).not.toBe(created.value.project.payload)
  })

  it('renombra y archiva incrementando revisión', async () => {
    const created = await service.create({ name: 'Original', payload: { title: 'Inicio' } })
    if (!created.ok) throw new Error('Precondición inválida')
    const renamed = await service.rename(created.value.project.projectId, 'Nuevo nombre')
    expect(renamed).toMatchObject({ ok: true, value: { project: { name: 'Nuevo nombre', revision: 1, updatedAt: TIMES[1] } } })
    const archived = await service.archive(created.value.project.projectId)
    expect(archived).toMatchObject({ ok: true, value: { project: { revision: 2 }, lifecycle: { state: 'archived', archivedAt: TIMES[2] } } })
  })

  it('envía a papelera y recupera al estado activo', async () => {
    const created = await service.create({ name: 'Proyecto', payload: { title: 'Inicio' } })
    if (!created.ok) throw new Error('Precondición inválida')
    const trashed = await service.delete(created.value.project.projectId)
    expect(trashed).toMatchObject({ ok: true, value: { lifecycle: { state: 'trashed', restoreState: 'active', trashedAt: TIMES[1] } } })
    const recovered = await service.recover(created.value.project.projectId)
    expect(recovered).toMatchObject({ ok: true, value: { lifecycle: { state: 'active', restoreState: null, trashedAt: null } } })
  })

  it('recupera a archivado cuando ese era el estado previo', async () => {
    const created = await service.create({ name: 'Proyecto', payload: { title: 'Inicio' } })
    if (!created.ok) throw new Error('Precondición inválida')
    await service.archive(created.value.project.projectId)
    await service.moveToTrash(created.value.project.projectId)
    const recovered = await service.recover(created.value.project.projectId)
    expect(recovered).toMatchObject({ ok: true, value: { lifecycle: { state: 'archived', archivedAt: TIMES[1], restoreState: null } } })
  })

  it('bloquea operaciones incompatibles con papelera', async () => {
    const created = await service.create({ name: 'Proyecto', payload: { title: 'Inicio' } })
    if (!created.ok) throw new Error('Precondición inválida')
    await service.moveToTrash(created.value.project.projectId)
    await expect(service.rename(created.value.project.projectId, 'Otro')).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-state', operation: 'rename' } })
    await expect(service.duplicate(created.value.project.projectId)).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-state', operation: 'duplicate' } })
    await expect(service.exportProject(created.value.project.projectId)).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-state', operation: 'export' } })
  })

  it('exporta canónicamente e importa sin sobrescribir conflictos', async () => {
    const created = await service.create({ name: 'Proyecto', payload: { title: 'Inicio' } })
    if (!created.ok) throw new Error('Precondición inválida')
    const exported = await service.exportProject(created.value.project.projectId)
    expect(exported.ok && exported.value).toContain('"format":"electrocms.project"')
    if (!exported.ok) return
    await expect(service.importProject(exported.value)).resolves.toMatchObject({ ok: false, error: { kind: 'already-exists', projectId: IDS[0] } })
    await expect(service.importProject(exported.value, { onConflict: 'duplicate' })).resolves.toMatchObject({ ok: true, value: { project: { projectId: IDS[1], revision: 0 }, lifecycle: { state: 'active' } } })
  })

  it('migra un proyecto v0 al importarlo y diagnostica entradas inválidas', async () => {
    const imported = await service.importProject(JSON.stringify(projectV0))
    expect(imported).toMatchObject({ ok: true, value: { project: { schemaVersion: 1, revision: 0, metadata: { migratedFromSchemaVersion: 0 } } } })
    await expect(service.importProject('{')).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-import', cause: { kind: 'invalid-json' } } })
  })

  it('propaga fallos del repositorio sin afirmar éxito', async () => {
    repository.failure = { kind: 'quota-exceeded', message: 'Sin espacio', recoverable: true }
    await expect(service.create({ name: 'Proyecto', payload: { title: 'Inicio' } })).resolves.toMatchObject({ ok: false, error: { kind: 'persistence', cause: { kind: 'quota-exceeded' } } })
  })

  it('rechaza payload inválido e identidades repetidas sin sobrescribir', async () => {
    await expect(service.create({ name: 'Existente', payload: { title: 'Inicio' } })).resolves.toMatchObject({ ok: true })
    const fixedIdService = new ProjectLifecycleService(repository, PayloadSchema, {
      createId: () => IDS[0],
      now: () => TIMES[1],
    })
    await expect(fixedIdService.create({ name: 'No sobrescribir', payload: { title: 'Otro' } })).resolves.toMatchObject({ ok: false, error: { kind: 'already-exists', projectId: IDS[0] } })
    await expect(service.create({ name: 'Payload roto', payload: { title: 2 } as unknown as Payload })).resolves.toMatchObject({ ok: false, error: { kind: 'invalid-payload' } })
  })
})
