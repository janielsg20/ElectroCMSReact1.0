import * as z from 'zod'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, describe, expect, it } from 'vitest'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository, type IndexedDbRepositoryOptions } from './indexed-db-repository'

const EntitySchema = z.strictObject({
  id: z.string().min(1),
  schemaVersion: z.literal(1),
  name: z.string().min(1),
})
type Entity = z.infer<typeof EntitySchema>

const databases: ElectroCmsLocalDatabase[] = []

function database(name: string, indexedDB = new IDBFactory()): ElectroCmsLocalDatabase {
  const instance = new ElectroCmsLocalDatabase(name, { indexedDB, IDBKeyRange })
  databases.push(instance)
  return instance
}

function repository(
  instance: ElectroCmsLocalDatabase,
  overrides: Partial<IndexedDbRepositoryOptions<Entity, string>> = {},
) {
  return new IndexedDbRepository(instance, {
    namespace: 'projects',
    schema: EntitySchema,
    getId: (entity) => entity.id,
    getSchemaVersion: (entity) => entity.schemaVersion,
    now: () => '2026-08-09T22:00:00.000Z',
    ...overrides,
  })
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map(async (instance) => {
    instance.close()
    await instance.delete()
  }))
})

describe('IndexedDbRepository', () => {
  it('guarda, lista por índice, busca y elimina', async () => {
    const store = repository(database('electrocms-indexed-operations'))
    const first = { id: 'project-1', schemaVersion: 1 as const, name: 'Primero' }
    const second = { id: 'project-2', schemaVersion: 1 as const, name: 'Segundo' }

    await expect(store.saveMany([second, first])).resolves.toEqual({ ok: true, value: undefined })
    await expect(store.list()).resolves.toEqual({ ok: true, value: [first, second] })
    await expect(store.listBySchemaVersion(1)).resolves.toEqual({ ok: true, value: [first, second] })
    await expect(store.listBySchemaVersion(2)).resolves.toEqual({ ok: true, value: [] })
    await expect(store.remove(first.id)).resolves.toEqual({ ok: true, value: true })
    await expect(store.remove(first.id)).resolves.toEqual({ ok: true, value: false })
  })

  it('conserva datos tras cerrar y reabrir otra conexión', async () => {
    const indexedDB = new IDBFactory()
    const firstDatabase = database('electrocms-reopen', indexedDB)
    const firstStore = repository(firstDatabase)
    const entity = { id: 'project-1', schemaVersion: 1 as const, name: 'Persistente' }
    await firstStore.save(entity)
    firstStore.close()

    const reopenedStore = repository(database('electrocms-reopen', indexedDB))
    await expect(reopenedStore.findById(entity.id)).resolves.toEqual({ ok: true, value: entity })
  })

  it('revierte toda la transacción y tipa el error de cuota', async () => {
    const instance = database('electrocms-quota')
    const stableStore = repository(instance)
    const original = { id: 'project-1', schemaVersion: 1 as const, name: 'Original' }
    await stableStore.save(original)

    const failingStore = repository(instance, {
      beforeCommit: () => { throw new DOMException('No queda espacio local.', 'QuotaExceededError') },
    })
    const result = await failingStore.saveMany([
      { ...original, name: 'No debe persistir' },
      { id: 'project-2', schemaVersion: 1, name: 'Tampoco' },
    ])

    expect(result).toMatchObject({ ok: false, error: { kind: 'quota-exceeded', recoverable: true } })
    await expect(stableStore.findById(original.id)).resolves.toEqual({ ok: true, value: original })
    await expect(stableStore.findById('project-2')).resolves.toEqual({ ok: true, value: null })
  })

  it('detecta alteraciones sin devolver contenido corrupto', async () => {
    const instance = database('electrocms-corruption')
    const store = repository(instance)
    const entity = { id: 'project-1', schemaVersion: 1 as const, name: 'Válido' }
    await store.save(entity)

    await instance.records.update(['projects', entity.id], { serialized: '{"alterado":true}' })

    const result = await store.findById(entity.id)
    expect(result).toMatchObject({ ok: false, error: { kind: 'corrupt-data', id: entity.id, recoverable: true } })
  })

  it('distingue una conexión cerrada de un fallo genérico', async () => {
    const store = repository(database('electrocms-closed'))
    store.close()
    await expect(store.list()).resolves.toMatchObject({ ok: false, error: { kind: 'closed', recoverable: true } })
  })
})
