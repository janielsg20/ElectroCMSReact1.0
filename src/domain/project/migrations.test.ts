import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import projectV0 from './fixtures/project-v0.json'
import projectV1 from './fixtures/project-v1.json'
import {
  createMigrationRegistry,
  migrateProjectJson,
  restoreMigrationBackup,
} from './migrations'

const payloadSchema = z.strictObject({ title: z.string() })

describe('migraciones de proyecto', () => {
  it('migra el fixture v0 a v1 y crea una copia previa exacta', () => {
    const source = JSON.stringify(projectV0, null, 2)
    const result = migrateProjectJson(source, payloadSchema)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.project).toMatchObject({ schemaVersion: 1, revision: 0, metadata: { migratedFromSchemaVersion: 0 } })
    expect(result.value.appliedVersions).toEqual([1])
    expect(result.value.backup).toMatchObject({ sourceSchemaVersion: 0, source })
  })

  it('restaura byte por byte la copia anterior y permite repetir la migración', () => {
    const source = JSON.stringify(projectV0, null, 2)
    const migrated = migrateProjectJson(source, payloadSchema)
    if (!migrated.ok || !migrated.value.backup) throw new Error('La migración de prueba debe producir backup.')

    const restored = restoreMigrationBackup(migrated.value.backup)
    expect(restored).toEqual({ ok: true, value: source })
    expect(restored.ok && migrateProjectJson(restored.value, payloadSchema).ok).toBe(true)
  })

  it('acepta el fixture actual sin migrarlo ni crear backup', () => {
    const result = migrateProjectJson(JSON.stringify(projectV1), payloadSchema)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.project.revision).toBe(3)
    expect(result.value.appliedVersions).toEqual([])
    expect(result.value.backup).toBeNull()
  })

  it('diagnostica versiones futuras y cadenas incompletas', () => {
    expect(migrateProjectJson(JSON.stringify({ ...projectV1, schemaVersion: 2 }), payloadSchema)).toMatchObject({
      ok: false,
      error: { kind: 'newer-version', found: 2, supported: 1 },
    })
    expect(migrateProjectJson(JSON.stringify(projectV0), payloadSchema, createMigrationRegistry([]))).toMatchObject({
      ok: false,
      error: { kind: 'missing-migration', fromVersion: 0 },
    })
  })

  it('no altera el origen si falla la validación de una versión antigua', () => {
    const source = JSON.stringify({ ...projectV0, name: '' })
    const result = migrateProjectJson(source, payloadSchema)
    expect(result).toMatchObject({ ok: false, error: { kind: 'migration-failed', fromVersion: 0 } })
    if (result.ok || result.error.kind !== 'migration-failed') return
    expect(restoreMigrationBackup(result.error.backup)).toEqual({ ok: true, value: source })
    expect(source).toContain('"name":""')
  })

  it('solo permite pasos forward consecutivos y únicos', () => {
    const pass = { migrate: (input: unknown) => ({ ok: true as const, value: input }) }
    expect(() => createMigrationRegistry([{ fromVersion: 1, toVersion: 1, ...pass }])).toThrow(/avanzar/)
    expect(() => createMigrationRegistry([
      { fromVersion: 0, toVersion: 1, ...pass },
      { fromVersion: 0, toVersion: 1, ...pass },
    ])).toThrow(/existe/)
  })
})
