import {
  ThemePackageSchema,
  type ThemePackage,
  type ThemePackageId,
} from '../../domain/project/theme-package'
import { ElectroCmsLocalDatabase } from './electrocms-local-database'
import { IndexedDbRepository } from './indexed-db-repository'

export const THEME_PACKAGES_NAMESPACE = 'theme-packages.v1'

export function createThemePackageRepository(database: ElectroCmsLocalDatabase) {
  return new IndexedDbRepository<ThemePackage, ThemePackageId>(database, {
    getId: (themePackage) => themePackage.packageId,
    getSchemaVersion: (themePackage) => themePackage.schemaVersion,
    namespace: THEME_PACKAGES_NAMESPACE,
    schema: ThemePackageSchema,
  })
}
