import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { parseContentTypeId } from './identity'
import { authorizeContentType } from './rbac-data'

const contentTypeId = parseContentTypeId('d2000000-0000-4000-8000-000000000001')

describe('M12.3 default deny', () => {
  it('deniega una acción sin roles válidos', () => {
    const cms = structuredClone(EMPTY_CMS_BACKEND)
    cms.contentTypes[contentTypeId] = {
      archiveTemplateId: null,
      capabilities: [],
      description: '',
      fieldIds: [],
      icon: 'content',
      id: contentTypeId,
      order: 0,
      pluralName: 'Pedidos',
      public: false,
      showInMenu: true,
      singleTemplateId: null,
      singularName: 'Pedido',
      slug: 'pedidos',
      supports: [],
      taxonomyIds: [],
    }
    expect(authorizeContentType(cms, { roleIds: [] }, contentTypeId, 'read')).toMatchObject({ allowed: false, code: 'deny-by-default' })
  })
})
