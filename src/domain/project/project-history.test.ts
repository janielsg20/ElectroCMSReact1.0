import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import { createProjectHistoryStateSchema } from './project-history'

const schema = createProjectHistoryStateSchema(z.strictObject({ title: z.string() }))
const projectId = '11111111-1111-4111-8111-111111111111'
const timestamp = '2026-08-10T00:00:00.000Z'
const makeRecord = (revision: number, title: string) => ({
  project: {
    format: 'electrocms.project',
    schemaVersion: 1,
    projectId,
    revision,
    name: 'Proyecto',
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    payload: { title },
  },
  lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
})

const entry = {
  id: '22222222-2222-4222-8222-222222222222',
  projectId,
  label: 'Cambiar título',
  commandIds: ['set-title'],
  createdAt: timestamp,
  before: makeRecord(0, 'Antes'),
  after: makeRecord(1, 'Después'),
}

describe('ProjectHistoryState', () => {
  it('acepta un historial persistible con cursor y operación pendiente coherentes', () => {
    expect(schema.safeParse({
      projectId,
      schemaVersion: 1,
      entries: [entry],
      cursor: 0,
      pending: {
        kind: 'execute',
        entryId: entry.id,
        sourceCursor: 0,
        targetCursor: 1,
        startedAt: timestamp,
        target: entry.after,
      },
    }).success).toBe(true)
  })

  it('rechaza cursores inválidos, IDs duplicados y operaciones pendientes incoherentes', () => {
    expect(schema.safeParse({ projectId, schemaVersion: 1, entries: [entry], cursor: 2, pending: null }).success).toBe(false)
    expect(schema.safeParse({ projectId, schemaVersion: 1, entries: [entry, entry], cursor: 1, pending: null }).success).toBe(false)
    expect(schema.safeParse({
      projectId,
      schemaVersion: 1,
      entries: [entry],
      cursor: 1,
      pending: {
        kind: 'undo',
        entryId: entry.id,
        sourceCursor: 1,
        targetCursor: 1,
        startedAt: timestamp,
        target: entry.before,
      },
    }).success).toBe(false)
  })
})
