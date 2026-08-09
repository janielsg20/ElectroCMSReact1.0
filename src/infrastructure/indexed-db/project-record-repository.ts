import type * as z from 'zod'
import type { ProjectId } from '../../domain/project/identity'
import { type JsonValue } from '../../domain/project/project-envelope'
import { createProjectRecordSchema, type ProjectRecord } from '../../domain/project/project-record'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository } from './indexed-db-repository'

export const PROJECT_RECORDS_NAMESPACE = 'projects'

export function createProjectRecordRepository<TPayload extends JsonValue>(
  database: ElectroCmsLocalDatabase,
  payloadSchema: z.ZodType<TPayload>,
): IndexedDbRepository<ProjectRecord<TPayload>, ProjectId> {
  return new IndexedDbRepository(database, {
    namespace: PROJECT_RECORDS_NAMESPACE,
    schema: createProjectRecordSchema(payloadSchema),
    getId: (record) => record.project.projectId,
    getSchemaVersion: (record) => record.project.schemaVersion,
  })
}
