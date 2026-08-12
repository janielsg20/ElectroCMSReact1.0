import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { deleteCustomField } from './custom-field-engine'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseNodeId,
  parseTimestamp,
} from './identity'
import { deleteContentRecord } from './record-relation-engine'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import { createThemePackage, parseThemePackageId } from './theme-package'

const documentId = parseDocumentId('11111111-cccc-4111-8111-111111111111')
const nodeId = parseNodeId('22222222-cccc-4222-8222-222222222222')
const contentTypeId = parseContentTypeId('33333333-cccc-4333-8333-333333333333')
const fieldId = parseFieldDefinitionId('44444444-cccc-4444-8444-444444444444')
const recordId = parseContentRecordId('55555555-cccc-4555-8555-555555555555')
const timestamp = parseTimestamp('2026-08-12T01:00:00.000Z')
const packageId = parseThemePackageId('66666666-cccc-4666-8666-666666666666')

function structure(binding: 'field' | 'record'): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [fieldId],
    icon: 'content',
    id: contentTypeId,
    order: 10,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: ['custom-fields'],
    taxonomyIds: [],
  }
  cms.fields[fieldId] = {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: null,
    description: '',
    group: '',
    id: fieldId,
    key: 'subtitle',
    label: 'Subtítulo',
    options: [],
    order: 10,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type: 'text',
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  cms.records[recordId] = {
    authorId: null,
    contentTypeId,
    createdAt: timestamp,
    id: recordId,
    status: 'draft',
    taxonomyTermIds: [],
    updatedAt: timestamp,
    values: {},
  }

  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms,
    documents: {
      [documentId]: {
        conditions: [],
        id: documentId,
        kind: 'page',
        name: 'Inicio',
        nodes: {
          [nodeId]: {
            bindings: binding === 'field'
              ? { text: { fieldId, kind: 'cms-record-field', recordId } }
              : { text: { kind: 'cms-record-property', property: 'status', recordId } },
            conditions: [],
            hidden: false,
            id: nodeId,
            kind: 'widget',
            locked: false,
            name: 'Texto dinámico',
            properties: { text: 'Fallback' },
            responsive: {},
            slots: {},
            styles: {},
            widgetType: 'basic.text',
          },
        },
        rootNodeIds: [nodeId],
        routePath: '/',
      },
    },
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

describe('M09.5 integridad de dependencias CMS', () => {
  it('bloquea eliminar un registro que todavía alimenta un binding del canvas', () => {
    const removed = deleteContentRecord(structure('record'), recordId)
    expect(removed.ok).toBe(false)
    if (!removed.ok) {
      expect(removed.error.some((item) => item.code === 'invalid-project')).toBe(true)
      expect(removed.error.some((item) => item.message.includes('registro inexistente'))).toBe(true)
    }
  })

  it('bloquea eliminar un campo sin valores guardados cuando un binding todavía lo referencia', () => {
    const removed = deleteCustomField(structure('field'), fieldId)
    expect(removed.ok).toBe(false)
    if (!removed.ok) {
      expect(removed.error.some((item) => item.code === 'invalid-project')).toBe(true)
      expect(removed.error.some((item) => item.message.includes('campo inexistente'))).toBe(true)
    }
  })

  it('rechaza theme packages con documentos dependientes de CMS en vez de perder la referencia silenciosamente', () => {
    const packaged = createThemePackage(structure('record'), {
      createdAt: '2026-08-12T01:00:00.000Z',
      name: 'Tema con CMS',
      packageId,
      selection: {
        backendTheme: false,
        documents: true,
        frontendTheme: false,
        globalComponents: false,
      },
    })
    expect(packaged.ok).toBe(false)
    if (!packaged.ok) expect(packaged.error[0]?.code).toBe('invalid-package')
  })
})
