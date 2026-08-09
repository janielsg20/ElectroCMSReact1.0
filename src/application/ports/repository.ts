export interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>
  list(): Promise<readonly TEntity[]>
  save(entity: TEntity): Promise<void>
  remove(id: TId): Promise<boolean>
}
