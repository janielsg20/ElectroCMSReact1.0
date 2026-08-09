import * as z from 'zod'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { ProjectLifecycleService } from '../../application/projects/project-lifecycle-service'
import { parseProjectId, parseTimestamp } from '../../domain/project/identity'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { createProjectRecordRepository } from './project-record-repository'

describe('repositorio persistente de proyectos', () => {
  it('crea y reabre un ProjectRecord validado', async () => {
    const indexedDB = new IDBFactory()
    const options = { indexedDB, IDBKeyRange }
    const payloadSchema = z.strictObject({ title: z.string() })
    const projectId = parseProjectId('11111111-1111-4111-8111-111111111111')
    const firstDatabase = new ElectroCmsLocalDatabase('electrocms-project-record', options)
    const firstRepository = createProjectRecordRepository(firstDatabase, payloadSchema)
    const service = new ProjectLifecycleService(firstRepository, payloadSchema, {
      createId: () => projectId,
      now: () => parseTimestamp('2026-08-09T20:00:00.000Z'),
    })

    await expect(service.create({ name: 'Persistente', payload: { title: 'Inicio' } })).resolves.toMatchObject({ ok: true })
    firstRepository.close()

    const reopenedDatabase = new ElectroCmsLocalDatabase('electrocms-project-record', options)
    const reopenedRepository = createProjectRecordRepository(reopenedDatabase, payloadSchema)
    await expect(reopenedRepository.findById(projectId)).resolves.toMatchObject({
      ok: true,
      value: { project: { name: 'Persistente' }, lifecycle: { state: 'active' } },
    })

    reopenedRepository.close()
    await reopenedDatabase.delete()
  })
})
