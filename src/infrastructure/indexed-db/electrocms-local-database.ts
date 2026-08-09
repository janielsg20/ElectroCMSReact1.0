import Dexie, { type DexieOptions, type Table } from 'dexie'

export const LOCAL_DATABASE_SCHEMA_VERSION = 1
export const LOCAL_RECORDS_TABLE = 'records'

export interface StoredLocalRecord {
  readonly namespace: string
  readonly id: string
  readonly schemaVersion: number
  readonly serialized: string
  readonly integrity: string
  readonly updatedAt: string
}

export class ElectroCmsLocalDatabase extends Dexie {
  readonly records!: Table<StoredLocalRecord, [string, string]>

  constructor(name: string, options?: DexieOptions) {
    super(name, options)
    this.version(LOCAL_DATABASE_SCHEMA_VERSION).stores({
      [LOCAL_RECORDS_TABLE]: '[namespace+id], namespace, [namespace+schemaVersion], updatedAt',
    })
  }
}
