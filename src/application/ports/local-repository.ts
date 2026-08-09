import type { Result } from '../../domain/common/result'

export type LocalRepositoryError =
  | { readonly kind: 'quota-exceeded'; readonly message: string; readonly recoverable: true }
  | { readonly kind: 'corrupt-data'; readonly id: string; readonly message: string; readonly recoverable: true }
  | { readonly kind: 'closed'; readonly message: string; readonly recoverable: true }
  | { readonly kind: 'unavailable'; readonly message: string; readonly recoverable: false }
  | { readonly kind: 'storage-failure'; readonly message: string; readonly recoverable: true }

export interface LocalRepository<TEntity, TId> {
  findById(id: TId): Promise<Result<TEntity | null, LocalRepositoryError>>
  list(): Promise<Result<readonly TEntity[], LocalRepositoryError>>
  listBySchemaVersion(schemaVersion: number): Promise<Result<readonly TEntity[], LocalRepositoryError>>
  save(entity: TEntity): Promise<Result<void, LocalRepositoryError>>
  saveMany(entities: readonly TEntity[]): Promise<Result<void, LocalRepositoryError>>
  remove(id: TId): Promise<Result<boolean, LocalRepositoryError>>
  close(): void
}
