import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, describe, expect, it } from 'vitest'
import {
  THEME_PACKAGE_FORMAT,
  THEME_PACKAGE_SCHEMA_VERSION,
  ThemePackageSchema,
  parseThemePackageId,
} from '../../domain/project/theme-package'
import { DEFAULT_FRONTEND_THEME } from '../../domain/project/theme-schema'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { createThemePackageRepository, THEME_PACKAGES_NAMESPACE } from './theme-package-repository'

const databases: ElectroCmsLocalDatabase[] = []

function database(name: string): ElectroCmsLocalDatabase {
  const instance = new ElectroCmsLocalDatabase(name, {
    IDBKeyRange,
    indexedDB: new IDBFactory(),
  })
  databases.push(instance)
  return instance
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map(async (instance) => {
    instance.close()
    await instance.delete()
  }))
})

describe('ThemePackageRepository', () => {
  it('persiste, lista y elimina paquetes en su namespace independiente', async () => {
    const instance = database('electrocms-theme-packages')
    const repository = createThemePackageRepository(instance)
    const themePackage = ThemePackageSchema.parse({
      contents: {
        breakpoints: [],
        documents: [],
        globalComponents: [],
        themes: { frontend: DEFAULT_FRONTEND_THEME },
      },
      createdAt: '2026-08-11T22:00:00.000Z',
      description: 'Tema local',
      format: THEME_PACKAGE_FORMAT,
      name: 'Minimal local',
      packageId: parseThemePackageId('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
      schemaVersion: THEME_PACKAGE_SCHEMA_VERSION,
      updatedAt: '2026-08-11T22:00:00.000Z',
      version: '1.0.0',
    })

    await expect(repository.save(themePackage)).resolves.toEqual({ ok: true, value: undefined })
    await expect(repository.list()).resolves.toEqual({ ok: true, value: [themePackage] })
    const stored = await instance.records.where('namespace').equals(THEME_PACKAGES_NAMESPACE).toArray()
    expect(stored).toHaveLength(1)
    await expect(repository.remove(themePackage.packageId)).resolves.toEqual({ ok: true, value: true })
  })
})
