import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { resolveNodeDataState, setNodeDataSettings } from './data-condition-engine'
import {
  parseContentRecordId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseNodeId,
  parseTimestamp,
} from './identity'
import { ProjectStructureSchema } from './structure-schema'

const DOCUMENT_ID = parseDocumentId('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
const SOURCE_ID = parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const TARGET_ID = parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const CONTENT_TYPE_ID = parseContentTypeId('11111111-bbbb-4111-8111-111111111111')
const OTHER_CONTENT_TYPE_ID = parseContentTypeId('22222222-bbbb-4222-8222-222222222222')
const FIELD_ID = parseFieldDefinitionId('33333333-bbbb-4333-8333-333333333333')
const MISSING_FIELD_ID = parseFieldDefinitionId('44444444-bbbb-4444-8444-444444444444')
const RECORD_ID = parseContentRecordId('55555555-bbbb-4555-8555-555555555555')
const TIMESTAMP = parseTimestamp('2026-08-12T00:00:00.000Z')

function structure() {
  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS,
    documents: {
      [DOCUMENT_ID]: {
        id: DOCUMENT_ID, kind: 'page', name: 'Inicio', rootNodeIds: [SOURCE_ID, TARGET_ID],
        nodes: {
          [SOURCE_ID]: { bindings: {}, conditions: [], hidden: false, id: SOURCE_ID, kind: 'widget', locked: false, name: 'Fuente', properties: { text: 'Origen', value: 12 }, responsive: {}, slots: {}, styles: {}, widgetType: 'content.text' },
          [TARGET_ID]: { bindings: {}, conditions: [], hidden: false, id: TARGET_ID, kind: 'widget', locked: false, name: 'Destino', properties: { text: 'Base' }, responsive: {}, slots: {}, styles: {}, widgetType: 'content.text' },
        },
      },
    },
    globalComponents: {},
  })
}

function cmsStructure() {
  const base = structure()
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[CONTENT_TYPE_ID] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [FIELD_ID],
    icon: 'content',
    id: CONTENT_TYPE_ID,
    order: 10,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: ['title', 'custom-fields'],
    taxonomyIds: [],
  }
  cms.fields[FIELD_ID] = {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: null,
    description: '',
    group: '',
    id: FIELD_ID,
    key: 'title',
    label: 'Título',
    options: [],
    order: 10,
    owner: { contentTypeId: CONTENT_TYPE_ID, kind: 'content-type' },
    placeholder: '',
    relationId: null,
    required: false,
    taxonomyId: null,
    type: 'text',
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
  }
  cms.records[RECORD_ID] = {
    authorId: null,
    contentTypeId: CONTENT_TYPE_ID,
    createdAt: TIMESTAMP,
    id: RECORD_ID,
    status: 'published',
    taxonomyTermIds: [],
    updatedAt: TIMESTAMP,
    values: { [FIELD_ID]: 'Título desde CMS' },
  }
  return ProjectStructureSchema.parse({ ...base, cms })
}

describe('M07.5 motor de datos, condiciones y accesibilidad', () => {
  it('resuelve bindings literales, rutas de proyecto y propiedades de nodo', () => {
    const source = structure()
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!target) throw new Error('Falta nodo destino.')
    target.bindings = {
      label: { kind: 'project-path', path: ['documents', DOCUMENT_ID, 'name'] },
      text: { kind: 'node-property', nodeId: SOURCE_ID, path: ['properties', 'text'] },
      tone: { kind: 'literal', value: 'accent' },
    }
    const resolved = resolveNodeDataState(source, target, target.properties)
    expect(resolved.properties).toMatchObject({ label: 'Inicio', text: 'Origen', tone: 'accent' })
    expect(resolved.diagnostics).toEqual([])
    expect(resolved.state).toBe('ready')
  })

  it('evalúa grupos all/any/negate y falla visible cuando existe un diagnóstico', () => {
    const source = structure()
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!target) throw new Error('Falta nodo destino.')
    target.conditions = [{
      negate: false, operator: 'all', predicates: [{ operator: 'greater-than', source: { kind: 'node-property', nodeId: SOURCE_ID, path: ['properties', 'value'] }, value: 20 }],
    }]
    expect(resolveNodeDataState(source, target, target.properties).visible).toBe(false)
    target.conditions = [{ negate: false, operator: 'all', predicates: [{ operator: 'contains', source: { kind: 'literal', value: 5 }, value: 'x' }] }]
    const invalid = resolveNodeDataState(source, target, target.properties)
    expect(invalid.visible).toBe(true)
    expect(invalid.diagnostics[0]?.code).toBe('invalid-comparison')
    expect(invalid.state).toBe('error')
  })

  it('valida, aplica y restablece una configuración estructurada sin mutar el input', () => {
    const source = structure()
    const updated = setNodeDataSettings(source, { documentId: DOCUMENT_ID, kind: 'document' }, TARGET_ID, {
      accessibility: { label: 'Resumen', role: 'region', tabIndex: 0 },
      bindings: { text: { kind: 'literal', value: 'Vinculado' } },
      conditions: [],
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.documents[DOCUMENT_ID]?.nodes[TARGET_ID]).toMatchObject({ accessibility: { label: 'Resumen', role: 'region', tabIndex: 0 } })
    expect(source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]?.accessibility).toBeUndefined()

    const unsafe = setNodeDataSettings(source, { documentId: DOCUMENT_ID, kind: 'document' }, TARGET_ID, {
      accessibility: { role: 'button' }, bindings: {}, conditions: [],
    })
    expect(unsafe.ok).toBe(false)
  })
})

describe('M09.5 bindings CMS', () => {
  it('resuelve un campo real y una propiedad del registro hacia propiedades del widget', () => {
    const source = cmsStructure()
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!target) throw new Error('Falta nodo destino.')
    target.bindings = {
      text: { fieldId: FIELD_ID, kind: 'cms-record-field', recordId: RECORD_ID },
      tone: { kind: 'cms-record-property', property: 'status', recordId: RECORD_ID },
    }

    const resolved = resolveNodeDataState(source, target, target.properties)
    expect(resolved.properties).toMatchObject({ text: 'Título desde CMS', tone: 'published' })
    expect(resolved.diagnostics).toEqual([])
    expect(resolved.state).toBe('ready')
  })

  it('distingue empty cuando el campo existe pero no tiene valor ni default', () => {
    const source = cmsStructure()
    const record = source.cms?.records[RECORD_ID]
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!record || !target) throw new Error('Falta fixture CMS.')
    record.values = {}
    target.bindings = { text: { fieldId: FIELD_ID, kind: 'cms-record-field', recordId: RECORD_ID } }

    const resolved = resolveNodeDataState(source, target, target.properties)
    expect(resolved.properties.text).toBeNull()
    expect(resolved.state).toBe('empty')
    expect(resolved.diagnostics).toEqual([])
  })

  it('rechaza fieldId ausente y marca incompatibilidad CPT↔campo como error de resolución', () => {
    const source = cmsStructure()
    const invalidSettings = setNodeDataSettings(source, { documentId: DOCUMENT_ID, kind: 'document' }, TARGET_ID, {
      accessibility: {},
      bindings: { text: { fieldId: MISSING_FIELD_ID, kind: 'cms-record-field', recordId: RECORD_ID } },
      conditions: [],
    })
    expect(invalidSettings.ok).toBe(false)

    const field = source.cms?.fields[FIELD_ID]
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!field || !target) throw new Error('Falta fixture CMS.')
    field.owner = { contentTypeId: OTHER_CONTENT_TYPE_ID, kind: 'content-type' }
    target.bindings = { text: { fieldId: FIELD_ID, kind: 'cms-record-field', recordId: RECORD_ID } }
    const resolved = resolveNodeDataState(source, target, target.properties)
    expect(resolved.state).toBe('error')
    expect(resolved.diagnostics[0]?.code).toBe('field-owner-mismatch')
  })
})
