import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import { createProjectRecoveryStateSchema } from './project-recovery'

const schema = createProjectRecoveryStateSchema(z.strictObject({ title: z.string() }))
const projectId = '11111111-1111-4111-8111-111111111111'
const timestamp = '2026-08-10T00:00:00.000Z'
const record = {
  project: {
    format: 'electrocms.project',
    schemaVersion: 1,
    projectId,
    revision: 1,
    name: 'Proyecto',
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    payload: { title: 'Inicio' },
  },
  lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
}

describe('ProjectRecoveryState', () => {
  it('acepta snapshots y journal alineados con proyecto y revisión', () => {
    expect(schema.safeParse({
      projectId,
      schemaVersion: 1,
      snapshots: [{ id: '22222222-2222-4222-8222-222222222222', projectId, revision: 1, createdAt: timestamp, record }],
      journalEntries: [{ id: '33333333-3333-4333-8333-333333333333', projectId, baseRevision: 0, targetRevision: 1, createdAt: timestamp, status: 'pending', target: record }],
    }).success).toBe(true)
  })

  it('rechaza IDs duplicados y secuencias incoherentes', () => {
    const snapshot = { id: '22222222-2222-4222-8222-222222222222', projectId, revision: 0, createdAt: timestamp, record }
    expect(schema.safeParse({ projectId, schemaVersion: 1, snapshots: [snapshot, snapshot], journalEntries: [] }).success).toBe(false)
    expect(schema.safeParse({
      projectId,
      schemaVersion: 1,
      snapshots: [],
      journalEntries: [{ id: '33333333-3333-4333-8333-333333333333', projectId, baseRevision: 1, targetRevision: 1, createdAt: timestamp, status: 'pending', target: record }],
    }).success).toBe(false)
  })
})
