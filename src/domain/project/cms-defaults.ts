import { CmsBackendSchema, type CmsBackend } from './cms-schema'

export const EMPTY_CMS_BACKEND: CmsBackend = CmsBackendSchema.parse({
  backendScreens: {},
  contentTypes: {},
  fields: {},
  forms: {},
  menus: {},
  queries: {},
  records: {},
  relationEntries: {},
  relations: {},
  roles: {},
  taxonomies: {},
  taxonomyTerms: {},
  users: {},
})

export function projectCmsBackend(cms: CmsBackend | undefined): CmsBackend {
  return cms ? structuredClone(cms) : structuredClone(EMPTY_CMS_BACKEND)
}
