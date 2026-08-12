import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BREAKPOINTS,
  ProjectStructureSchema,
  parseContentRecordId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseNodeId,
  parseQueryId,
  parseTimestamp,
  type ProjectStructure,
} from '../../domain'
import { EMPTY_CMS_BACKEND } from '../../domain/project/cms-defaults'
import { CanonicalProjectRenderer } from './CanonicalProjectRenderer'
import { ProjectStructureRenderStore } from './project-structure-render-store'

const documentId = parseDocumentId('20000000-0000-4000-8000-000000000001')
const contentTypeId = parseContentTypeId('21000000-0000-4000-8000-000000000001')
const fieldId = parseFieldDefinitionId('22000000-0000-4000-8000-000000000001')
const recordAId = parseContentRecordId('23000000-0000-4000-8000-000000000001')
const recordBId = parseContentRecordId('23000000-0000-4000-8000-000000000002')
const recordCId = parseContentRecordId('23000000-0000-4000-8000-000000000003')
const queryId = parseQueryId('24000000-0000-4000-8000-000000000001')
const listingNodeId = parseNodeId('25000000-0000-4000-8000-000000000001')
const templateNodeId = parseNodeId('25000000-0000-4000-8000-000000000002')

function fixture(): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [fieldId],
    icon: 'content',
    id: contentTypeId,
    order: 10,
    pluralName: 'Entradas',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Entrada',
    slug: 'entries',
    supports: ['custom-fields'],
    taxonomyIds: [],
  }
  cms.fields[fieldId] = {
    allowedRoleIds: [],
    calculatedExpression: null,
    childFieldIds: [],
    conditions: [],
    defaultValue: '',
    description: '',
    group: '',
    id: fieldId,
    key: 'title',
    label: 'Título',
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
  const records = [
    [recordAId, 'Alpha'],
    [recordBId, 'Beta'],
    [recordCId, 'Gamma'],
  ] as const
  records.forEach(([id, title], index) => {
    const day = String(index + 1).padStart(2, '0')
    cms.records[id] = {
      authorId: null,
      contentTypeId,
      createdAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      id,
      status: 'published',
      taxonomyTermIds: [],
      updatedAt: parseTimestamp(`2026-08-${day}T00:00:00.000Z`),
      values: { [fieldId]: title },
    }
  })
  cms.queries[queryId] = {
    contentTypeId,
    groups: [],
    id: queryId,
    limit: 3,
    name: 'Entradas por página',
    offset: 0,
    pageSize: 2,
    sorts: [{ direction: 'asc', fieldId: null, systemField: 'id' }],
  }

  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS,
    cms,
    documents: {
      [documentId]: {
        id: documentId,
        kind: 'page',
        name: 'Listado runtime',
        nodes: {
          [listingNodeId]: {
            bindings: {},
            conditions: [],
            hidden: false,
            id: listingNodeId,
            kind: 'widget',
            locked: false,
            name: 'Listado dinámico',
            properties: { columns: 2, emptyMessage: 'Sin entradas', queryId },
            responsive: {},
            slots: { content: [templateNodeId] },
            styles: {},
            widgetType: 'dynamic.listing-grid',
          },
          [templateNodeId]: {
            bindings: { fallback: { fieldId, kind: 'cms-record-field', recordId: recordAId } },
            conditions: [],
            hidden: false,
            id: templateNodeId,
            kind: 'widget',
            locked: false,
            name: 'Título repetible',
            properties: { binding: '', fallback: 'Preview' },
            responsive: {},
            slots: {},
            styles: {},
            widgetType: 'dynamic.field',
          },
        },
        rootNodeIds: [listingNodeId],
      },
    },
    globalComponents: {},
  })
}

function desktopBreakpoint() {
  const breakpoint = DEFAULT_BREAKPOINTS[0]
  if (!breakpoint) throw new Error('Falta breakpoint desktop.')
  return breakpoint.id
}

describe('M10.3 ListingGridRuntime', () => {
  it('repite la plantilla con bindings contextuales y navega páginas sin mutar el proyecto', () => {
    const store = new ProjectStructureRenderStore(fixture())
    const originalQuery = structuredClone(store.structure.cms?.queries[queryId])
    const { container } = render(
      <CanonicalProjectRenderer breakpointId={desktopBreakpoint()} documentId={documentId} store={store} />,
    )

    expect(container.querySelectorAll(`[data-listing-runtime="${listingNodeId}"] [data-listing-record]`)).toHaveLength(2)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2 · 3 elementos')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 2 · 3 elementos')).toBeInTheDocument()
    expect(store.structure.cms?.queries[queryId]).toEqual(originalQuery)
  })
})
