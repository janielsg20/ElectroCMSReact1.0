import type { Repository } from '../../application/ports/repository'

export class InMemoryRepository<TEntity, TId> implements Repository<TEntity, TId> {
  readonly #entities = new Map<TId, TEntity>()

  constructor(private readonly getId: (entity: TEntity) => TId) {}

  findById(id: TId): Promise<TEntity | null> {
    return Promise.resolve(this.#entities.get(id) ?? null)
  }

  list(): Promise<readonly TEntity[]> {
    return Promise.resolve([...this.#entities.values()])
  }

  save(entity: TEntity): Promise<void> {
    this.#entities.set(this.getId(entity), entity)
    return Promise.resolve()
  }

  remove(id: TId): Promise<boolean> {
    return Promise.resolve(this.#entities.delete(id))
  }
}
