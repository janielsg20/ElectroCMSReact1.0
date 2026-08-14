import { AuditLogEntrySchema, AUDIT_LOG_SCHEMA_VERSION, type AuditLogEntry } from '../../domain/project/audit-log'
import type { AuditLogEntryId } from '../../domain/project/identity'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository } from './indexed-db-repository'

export const AUDIT_LOG_NAMESPACE = 'audit-log'

export function createAuditLogRepository(database: ElectroCmsLocalDatabase): IndexedDbRepository<AuditLogEntry, AuditLogEntryId> {
  return new IndexedDbRepository(database, {
    namespace: AUDIT_LOG_NAMESPACE,
    schema: AuditLogEntrySchema,
    getId: (entry) => entry.id,
    getSchemaVersion: () => AUDIT_LOG_SCHEMA_VERSION,
  })
}
