import { act, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BREAKPOINTS,
  EMPTY_CMS_BACKEND,
  parseContentRecordId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseNodeId,
  parseTimestamp,
  ProjectStructureSchema,
  type ProjectStructure,
} from '../../domain'
import { CanonicalProjectRenderer } from './CanonicalProjectRenderer'
import { ProjectStructureRenderStore } from './project-structure-render-store'

const DOCUMENT_ID = parseDocumentId('10101010-aaaa-4010-8010-101010101010')
const NODE_ID = parseNodeId('20202020-aaaa-4020-8020-202020202020')
const CONTENT_TYPE_ID = parseContentTypeId('30303030-aaaa-4030-8030-303030303030')
const FIELD_ID = parseFieldDefinitionId('40404040-aaaa-4040-8040-404040404040')
const RECORD_ID = parseContentRecordId('50505050-aaaa-4050-8050-505050505050')
const TIMESTAMP = parseTimestamp('2026-08-12T00:00:00.000Z')

function structure(text = 'Desde CMS'): ProjectStructure {
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
    values: { [FIELD_ID]: text },
  }

  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms,
    documents: {
      [DOCUMENT_ID]: {
        conditions: [],
        id: DOCUMENT_ID,
        kind: 'page',
        name: 'Inicio',
        nodes: {
          [NODE_ID]: {
            bindings: { text: { fieldId: FIELD_ID, kind: 'cms-record-field', recordId: RECORD_ID } },
            conditions: [],
            hidden: false,
            id: NODE_ID,
            kind: 'widget',
            locked: false,
            name: 'Texto CMS',
            properties: { text: 'Fallback' },
            responsive: {},
            slots: {},
            styles: {},
            widgetType: 'content.text',
          },
        },
        rootNodeIds: [NODE_ID],
        routePath: '/',
      },
    },
    globalComponents: {},
  })
}

describe('M09.5 renderer de bindings CMS', () => {
  it('renderiza valores CMS y se invalida cuando cambia solo el backend CMS', async () => {
    const store = new ProjectStructureRenderStore(structure())
    render(
      <CanonicalProjectRenderer
        breakpointId={DEFAULT_BREAKPOINTS[0].id}
        documentId={DOCUMENT_ID}
        renderWidget={({ responsive }) => createElement('span', null, String(responsive.properties.text ?? ''))}
        store={store}
      />,
    )

    expect(screen.getByText('Desde CMS')).toBeInTheDocument()
    act(() => {
      const replaced = store.replaceStructure(structure('CMS actualizado'))
      expect(replaced.ok).toBe(true)
    })
    expect(await screen.findByText('CMS actualizado')).toBeInTheDocument()
  })

  it('previsualiza loading, empty y error sin persistirlos en ProjectStructure', () => {
    const initial = structure()
    const store = new ProjectStructureRenderStore(initial)
    render(
      <CanonicalProjectRenderer
        breakpointId={DEFAULT_BREAKPOINTS[0].id}
        documentId={DOCUMENT_ID}
        renderWidget={({ responsive }) => createElement('span', null, String(responsive.properties.text ?? ''))}
        store={store}
      />,
    )

    act(() => store.setNodeDataPreviewMode(NODE_ID, 'loading'))
    expect(screen.getByText(/Cargando contenido/i)).toBeInTheDocument()
    act(() => store.setNodeDataPreviewMode(NODE_ID, 'empty'))
    expect(screen.getByText('Sin contenido')).toBeInTheDocument()
    act(() => store.setNodeDataPreviewMode(NODE_ID, 'error'))
    expect(screen.getByText(/No se pudo resolver el contenido/i)).toBeInTheDocument()
    expect(store.structure).toEqual(initial)
    act(() => store.setNodeDataPreviewMode(NODE_ID, 'auto'))
    expect(screen.getByText('Desde CMS')).toBeInTheDocument()
  })
})
