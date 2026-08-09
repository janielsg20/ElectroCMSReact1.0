import { InMemoryRepository } from './in-memory-repository'

interface ExampleEntity {
  readonly id: string
  readonly name: string
}

describe('InMemoryRepository', () => {
  it('cumple el contrato de guardar, listar, buscar y eliminar', async () => {
    const repository = new InMemoryRepository<ExampleEntity, string>((entity) => entity.id)
    const entity = { id: 'entity-1', name: 'Base' }

    await repository.save(entity)

    await expect(repository.findById(entity.id)).resolves.toEqual(entity)
    await expect(repository.list()).resolves.toEqual([entity])
    await expect(repository.remove(entity.id)).resolves.toBe(true)
    await expect(repository.findById(entity.id)).resolves.toBeNull()
  })
})
