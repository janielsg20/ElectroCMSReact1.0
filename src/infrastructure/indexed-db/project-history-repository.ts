import type * as z from 'zod'
import type { ProjectId } from '../../domain/project/identity'
import type { JsonValue } from '../../domain/project/project-envelope'
import { createProjectHistoryStateSchema, type ProjectHistoryState } from '../../domain/project/project-history'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository } from './indexed-db-repository'

export const PROJECT_HISTORY_NAMESPACE = 'project-history'

export function createProjectHistoryRepository<TPayload extends JsonValue>(
  database: ElectroCmsLocalDatabase,
  payloadSchema: z.ZodType<TPayload>,
): IndexedDbRepository<ProjectHistoryState<TPayload>, ProjectId> {
  return new IndexedDbRepository(database, {
    namespace: PROJECT_HISTORY_NAMESPACE,
    schema: createProjectHistoryStateSchema(payloadSchema),
    getId: (state) => state.projectId,
    getSchemaVersion: (state) => state.schemaVersion,
  })
}
