import type * as z from 'zod'
import type { ProjectId } from '../../domain/project/identity'
import type { JsonValue } from '../../domain/project/project-envelope'
import { createProjectRecoveryStateSchema, type ProjectRecoveryState } from '../../domain/project/project-recovery'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository } from './indexed-db-repository'

export const PROJECT_RECOVERY_NAMESPACE = 'project-recovery'

export function createProjectRecoveryRepository<TPayload extends JsonValue>(
  database: ElectroCmsLocalDatabase,
  payloadSchema: z.ZodType<TPayload>,
): IndexedDbRepository<ProjectRecoveryState<TPayload>, ProjectId> {
  return new IndexedDbRepository(database, {
    namespace: PROJECT_RECOVERY_NAMESPACE,
    schema: createProjectRecoveryStateSchema(payloadSchema),
    getId: (state) => state.projectId,
    getSchemaVersion: (state) => state.schemaVersion,
  })
}
