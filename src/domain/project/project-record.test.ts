import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import { createProjectRecordSchema } from './project-record'

const schema = createProjectRecordSchema(z.strictObject({ title: z.string() }))
const project = {
  format: 'electrocms.project' as const,
  schemaVersion: 1 as const,
  projectId: '01989d97-41f0-7d62-a0b3-7f30e657ea38',
  revision: 0,
  name: 'Proyecto',
  createdAt: '2026-08-09T20:40:00.000Z',
  updatedAt: '2026-08-09T20:40:00.000Z',
  metadata: {},
  payload: { title: 'Inicio' },
}

describe('ProjectRecord', () => {
  it('acepta estados activos, archivados y recuperables coherentes', () => {
    expect(schema.safeParse({ project, lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null } }).success).toBe(true)
    expect(schema.safeParse({ project, lifecycle: { state: 'archived', archivedAt: project.updatedAt, trashedAt: null, restoreState: null } }).success).toBe(true)
    expect(schema.safeParse({ project, lifecycle: { state: 'trashed', archivedAt: project.updatedAt, trashedAt: project.updatedAt, restoreState: 'archived' } }).success).toBe(true)
  })

  it('rechaza combinaciones de recuperación incoherentes', () => {
    expect(schema.safeParse({ project, lifecycle: { state: 'active', archivedAt: project.updatedAt, trashedAt: null, restoreState: null } }).success).toBe(false)
    expect(schema.safeParse({ project, lifecycle: { state: 'trashed', archivedAt: null, trashedAt: project.updatedAt, restoreState: null } }).success).toBe(false)
    expect(schema.safeParse({ project, lifecycle: { state: 'trashed', archivedAt: project.updatedAt, trashedAt: project.updatedAt, restoreState: 'active' } }).success).toBe(false)
  })
})
