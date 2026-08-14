import { MediaBlobRecordSchema, type MediaBlobRecord } from '../../domain/project/media-library'
import type { MediaAssetId } from '../../domain/project/identity'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository } from './indexed-db-repository'

export const MEDIA_BLOBS_NAMESPACE = 'media-blobs.v1'

export function createMediaBlobRepository(database: ElectroCmsLocalDatabase): IndexedDbRepository<MediaBlobRecord, MediaAssetId> {
  return new IndexedDbRepository(database, { getId: (record) => record.assetId, getSchemaVersion: (record) => record.schemaVersion, namespace: MEDIA_BLOBS_NAMESPACE, schema: MediaBlobRecordSchema })
}
