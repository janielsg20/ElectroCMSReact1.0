import * as z from 'zod'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { success } from '../../domain/common/result'
import { parseProjectId, parseTimestamp } from '../../domain/project/identity'
import { parseProjectHistoryEntryId } from '../../domain/project/project-history'
import type { ProjectRecord } from '../../domain/project/project-record'
import { ProjectCommandBus, type ReversibleProjectCommand } from '../../application/projects/project-command-bus'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { createProjectHistoryRepository } from './project-history-repository'
import { createProjectRecordRepository } from './project-record-repository'

const payloadSchema = z.strictObject({ title: z.string() })
type Payload = z.infer<typeof payloadSchema>

function command(title: string): ReversibleProjectCommand<Payload> {
  return {
    id: `title-${title}`,
    label: `Cambiar a ${title}`,
    apply(current) {
      return success({ ...current, project: { ...current.project, payload: { title } } })
    },
  }
}

describe('repositorio persistente de historial', () => {
  it('conserva cursor y permite undo después de cerrar y reabrir IndexedDB', async () => {
    const indexedDB = new IDBFactory()
    const options = { indexedDB, IDBKeyRange }
    const projectId = parseProjectId('11111111-1111-4111-8111-111111111111')
    const createdAt = parseTimestamp('2026-08-10T00:00:00.000Z')
    const original: ProjectRecord<Payload> = {
      project: {
        format: 'electrocms.project',
        schemaVersion: 1,
        projectId,
        revision: 0,
        name: 'Proyecto',
        createdAt,
        updatedAt: createdAt,
        metadata: {},
        payload: { title: 'Inicio' },
      },
      lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
    }

    const firstDatabase = new ElectroCmsLocalDatabase('electrocms-history-reopen', options)
    const firstProjects = createProjectRecordRepository(firstDatabase, payloadSchema)
    const firstHistories = createProjectHistoryRepository(firstDatabase, payloadSchema)
    await firstProjects.save(original)
    const firstBus = new ProjectCommandBus(firstProjects, firstHistories, payloadSchema, {
      createHistoryEntryId: () => parseProjectHistoryEntryId('22222222-2222-4222-8222-222222222222'),
      now: () => parseTimestamp('2026-08-10T00:01:00.000Z'),
    })
    await firstBus.execute(command('Persistido'), projectId)
    firstDatabase.close()

    const reopenedDatabase = new ElectroCmsLocalDatabase('electrocms-history-reopen', options)
    const reopenedProjects = createProjectRecordRepository(reopenedDatabase, payloadSchema)
    const reopenedHistories = createProjectHistoryRepository(reopenedDatabase, payloadSchema)
    const reopenedBus = new ProjectCommandBus(reopenedProjects, reopenedHistories, payloadSchema, {
      createHistoryEntryId: () => parseProjectHistoryEntryId('33333333-3333-4333-8333-333333333333'),
      now: () => parseTimestamp('2026-08-10T00:02:00.000Z'),
    })

    await expect(reopenedBus.undo(projectId)).resolves.toMatchObject({ ok: true, value: { cursor: 0 } })
    await expect(reopenedProjects.findById(projectId)).resolves.toMatchObject({ ok: true, value: { project: { revision: 2, payload: { title: 'Inicio' } } } })
    await expect(reopenedHistories.findById(projectId)).resolves.toMatchObject({ ok: true, value: { cursor: 0, pending: null } })

    reopenedDatabase.close()
    await reopenedDatabase.delete()
  })
})
