import type * as z from 'zod'
import type { LocalRepository, LocalRepositoryError } from '../../application/ports/local-repository'
import { failure, success, type Result } from '../../domain/common/result'
import { deserializeCanonical, serializeCanonical } from '../../domain/project/canonical-json'
import { ElectroCmsLocalDatabase, type StoredLocalRecord } from './electrocms-local-database'

export interface IndexedDbRepositoryOptions<TEntity, TId extends string> {
  readonly namespace: string
  readonly schema: z.ZodType<TEntity>
  readonly getId: (entity: TEntity) => TId
  readonly getSchemaVersion: (entity: TEntity) => number
  readonly now?: () => string
  readonly beforeCommit?: (records: readonly StoredLocalRecord[]) => void
}

function integrityFingerprint(value: string): string {
  let first = 0x811c9dc5
  let second = 0x9e3779b9
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    first = Math.imul(first ^ code, 0x01000193)
    second = Math.imul(second ^ code, 0x85ebca6b)
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`
}

function errorName(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const candidate = error as { name?: unknown; inner?: unknown }
  if (candidate.name === 'QuotaExceededError') return candidate.name
  return errorName(candidate.inner) ?? (typeof candidate.name === 'string' ? candidate.name : null)
}

function storageError(error: unknown): LocalRepositoryError {
  const name = errorName(error)
  const message = error instanceof Error ? error.message : 'La operación de almacenamiento local falló.'
  if (name === 'QuotaExceededError') return { kind: 'quota-exceeded', message, recoverable: true }
  if (name === 'DatabaseClosedError') return { kind: 'closed', message, recoverable: true }
  if (name === 'MissingAPIError' || name === 'UnsupportedError') return { kind: 'unavailable', message, recoverable: false }
  return { kind: 'storage-failure', message, recoverable: true }
}

export class IndexedDbRepository<TEntity, TId extends string>
implements LocalRepository<TEntity, TId> {
  readonly #now: () => string

  constructor(
    private readonly database: ElectroCmsLocalDatabase,
    private readonly options: IndexedDbRepositoryOptions<TEntity, TId>,
  ) {
    this.#now = options.now ?? (() => new Date().toISOString())
  }

  async findById(id: TId): Promise<Result<TEntity | null, LocalRepositoryError>> {
    try {
      const stored = await this.database.records.get([this.options.namespace, id])
      if (!stored) return success(null)
      return this.decode(stored)
    } catch (error) {
      return failure(storageError(error))
    }
  }

  async list(): Promise<Result<readonly TEntity[], LocalRepositoryError>> {
    try {
      const stored = await this.database.records.where('namespace').equals(this.options.namespace).sortBy('id')
      return this.decodeMany(stored)
    } catch (error) {
      return failure(storageError(error))
    }
  }

  async listBySchemaVersion(schemaVersion: number): Promise<Result<readonly TEntity[], LocalRepositoryError>> {
    try {
      const stored = await this.database.records
        .where('[namespace+schemaVersion]')
        .equals([this.options.namespace, schemaVersion])
        .sortBy('id')
      return this.decodeMany(stored)
    } catch (error) {
      return failure(storageError(error))
    }
  }

  save(entity: TEntity): Promise<Result<void, LocalRepositoryError>> {
    return this.saveMany([entity])
  }

  async saveMany(entities: readonly TEntity[]): Promise<Result<void, LocalRepositoryError>> {
    const prepared: StoredLocalRecord[] = []
    for (const entity of entities) {
      const serialized = serializeCanonical(this.options.schema, entity)
      if (!serialized.ok) {
        return failure({
          kind: 'corrupt-data',
          id: String(this.options.getId(entity)),
          message: 'La entidad no cumple su schema persistente.',
          recoverable: true,
        })
      }
      prepared.push({
        namespace: this.options.namespace,
        id: this.options.getId(entity),
        schemaVersion: this.options.getSchemaVersion(entity),
        serialized: serialized.value,
        integrity: integrityFingerprint(serialized.value),
        updatedAt: this.#now(),
      })
    }

    try {
      await this.database.transaction('rw', this.database.records, async () => {
        await this.database.records.bulkPut(prepared)
        this.options.beforeCommit?.(prepared)
      })
      return success(undefined)
    } catch (error) {
      return failure(storageError(error))
    }
  }

  async remove(id: TId): Promise<Result<boolean, LocalRepositoryError>> {
    try {
      return await this.database.transaction('rw', this.database.records, async () => {
        const key: [string, string] = [this.options.namespace, id]
        const existed = await this.database.records.get(key)
        if (existed === undefined) return success(false)
        await this.database.records.delete(key)
        return success(true)
      })
    } catch (error) {
      return failure(storageError(error))
    }
  }

  close(): void {
    this.database.close()
  }

  private decode(stored: StoredLocalRecord): Result<TEntity, LocalRepositoryError> {
    if (integrityFingerprint(stored.serialized) !== stored.integrity) {
      return failure({ kind: 'corrupt-data', id: stored.id, message: 'La huella de integridad no coincide.', recoverable: true })
    }
    const parsed = deserializeCanonical(this.options.schema, stored.serialized)
    if (!parsed.ok) {
      return failure({ kind: 'corrupt-data', id: stored.id, message: 'El registro persistido no cumple su schema.', recoverable: true })
    }
    if (String(this.options.getId(parsed.value)) !== stored.id || this.options.getSchemaVersion(parsed.value) !== stored.schemaVersion) {
      return failure({ kind: 'corrupt-data', id: stored.id, message: 'Los índices no coinciden con el contenido persistido.', recoverable: true })
    }
    return success(parsed.value)
  }

  private decodeMany(stored: readonly StoredLocalRecord[]): Result<readonly TEntity[], LocalRepositoryError> {
    const entities: TEntity[] = []
    for (const record of stored) {
      const decoded = this.decode(record)
      if (!decoded.ok) return decoded
      entities.push(decoded.value)
    }
    return success(entities)
  }
}
