import * as z from 'zod'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { ProjectAutosaveService } from '../../application/projects/project-autosave-service'
import {
  parseProjectId,
  parseProjectJournalEntryId,
  parseProjectSnapshotId,
  parseTimestamp,
} from '../../domain/project/identity'
import type { ProjectRecord } from '../../domain/project/project-record'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { createProjectRecordRepository } from './project-record-repository'
import { createProjectRecoveryRepository } from './project-recovery-repository'

describe('repositorio persistente de recuperación', () => {
  it('reaplica un journal pendiente después de cerrar y reabrir IndexedDB', async () => {
    const indexedDB = new IDBFactory()
    const options = { indexedDB, IDBKeyRange }
    const payloadSchema = z.strictObject({ title: z.string() })
    type Payload = z.infer<typeof payloadSchema>
    const projectId = parseProjectId('11111111-1111-4111-8111-111111111111')
    const timestamp = parseTimestamp('2026-08-10T01:00:00.000Z')
    const makeRecord = (revision: number): ProjectRecord<Payload> => ({
      project: {
        format: 'electrocms.project',
        schemaVersion: 1,
        projectId,
        revision,
        name: 'Proyecto',
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: {},
        payload: { title: `Revisión ${revision}` },
      },
      lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
    })

    const firstDatabase = new ElectroCmsLocalDatabase('electrocms-recovery-reopen', options)
    const firstProjects = createProjectRecordRepository(firstDatabase, payloadSchema)
    const firstRecovery = createProjectRecoveryRepository(firstDatabase, payloadSchema)
    const original = makeRecord(0)
    const target = makeRecord(1)
    await firstProjects.save(original)
    await firstRecovery.save({
      projectId,
      schemaVersion: 1,
      snapshots: [{ id: parseProjectSnapshotId('22222222-2222-4222-8222-222222222222'), projectId, revision: 0, createdAt: timestamp, record: original }],
      journalEntries: [{ id: parseProjectJournalEntryId('33333333-3333-4333-8333-333333333333'), projectId, baseRevision: 0, targetRevision: 1, createdAt: timestamp, status: 'pending', target }],
    })
    firstDatabase.close()

    const reopenedDatabase = new ElectroCmsLocalDatabase('electrocms-recovery-reopen', options)
    const reopenedProjects = createProjectRecordRepository(reopenedDatabase, payloadSchema)
    const reopenedRecovery = createProjectRecoveryRepository(reopenedDatabase, payloadSchema)
    const service = new ProjectAutosaveService(reopenedProjects, reopenedRecovery, payloadSchema, {
      createSnapshotId: () => parseProjectSnapshotId('44444444-4444-4444-8444-444444444444'),
      createJournalEntryId: () => parseProjectJournalEntryId('55555555-5555-4555-8555-555555555555'),
      now: () => timestamp,
    })

    await expect(service.recover(projectId)).resolves.toMatchObject({ ok: true, value: { recoveredEntries: 1 } })
    await expect(reopenedProjects.findById(projectId)).resolves.toMatchObject({ ok: true, value: { project: { revision: 1 } } })

    reopenedDatabase.close()
    await reopenedDatabase.delete()
  })
})
