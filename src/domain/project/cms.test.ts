import { describe, expect, it } from 'vitest'
import { CmsBackendSchema } from './cms-schema'
import {
  parseBackendScreenId,
  parseContentRecordId,
  parseContentTypeId,
  parseFieldDefinitionId,
  parseFormId,
  parseMenuId,
  parseMenuItemId,
  parseQueryId,
  parseRelationEntryId,
  parseRelationId,
  parseRoleId,
  parseTaxonomyId,
  parseTaxonomyTermId,
  parseUserId,
  type ContentTypeId,
  type FieldDefinitionId,
} from './identity'
import { validateCmsBackend } from './validate-cms'

const BOOK_TYPE_ID = parseContentTypeId('11111111-1111-4111-8111-111111111111')
const AUTHOR_TYPE_ID = parseContentTypeId('22222222-2222-4222-8222-222222222222')
const TITLE_FIELD_ID = parseFieldDefinitionId('33333333-3333-4333-8333-333333333333')
const BIO_FIELD_ID = parseFieldDefinitionId('44444444-4444-4444-8444-444444444444')
const TAXONOMY_ID = parseTaxonomyId('55555555-5555-4555-8555-555555555555')
const TERM_ID = parseTaxonomyTermId('66666666-6666-4666-8666-666666666666')
const BOOK_ONE_ID = parseContentRecordId('77777777-7777-4777-8777-777777777777')
const BOOK_TWO_ID = parseContentRecordId('88888888-8888-4888-8888-888888888888')
const AUTHOR_ONE_ID = parseContentRecordId('99999999-9999-4999-8999-999999999999')
const AUTHOR_TWO_ID = parseContentRecordId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const RELATION_ID = parseRelationId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const ENTRY_ONE_ID = parseRelationEntryId('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
const ENTRY_TWO_ID = parseRelationEntryId('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
const ENTRY_THREE_ID = parseRelationEntryId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
const QUERY_ID = parseQueryId('12121212-1212-4121-8121-121212121212')
const FORM_ID = parseFormId('13131313-1313-4131-8131-131313131313')
const ROLE_ID = parseRoleId('14141414-1414-4141-8141-141414141414')
const USER_ID = parseUserId('15151515-1515-4151-8151-151515151515')
const SCREEN_ID = parseBackendScreenId('16161616-1616-4161-8161-161616161616')
const MENU_ID = parseMenuId('17171717-1717-4171-8171-171717171717')
const MENU_ITEM_ID = parseMenuItemId('18181818-1818-4181-8181-181818181818')
const DOCUMENT_ID = '19191919-1919-4191-8191-191919191919'
const CONTROL_ID = '20202020-2020-4202-8202-202020202020'
const STEP_ID = '21212121-2121-4212-8212-212121212121'
const ACTION_ID = '23232323-2323-4232-8232-232323232323'

function baseField(id: FieldDefinitionId, ownerId: ContentTypeId, key: string) {
  return {
    id,
    owner: { kind: 'content-type' as const, contentTypeId: ownerId },
    key,
    label: key === 'title' ? 'Título' : 'Biografía',
    type: key === 'title' ? 'text' as const : 'textarea' as const,
    description: '',
    placeholder: '',
    defaultValue: null,
    required: key === 'title',
    validation: { minLength: null, maxLength: null, min: null, max: null, pattern: null },
    options: [],
    conditions: [],
    childFieldIds: [],
    relationId: null,
    taxonomyId: null,
    allowedRoleIds: [ROLE_ID],
    calculatedExpression: null,
    group: 'Principal',
    order: 0,
  }
}

function validCms() {
  return CmsBackendSchema.parse({
    contentTypes: {
      [BOOK_TYPE_ID]: {
        id: BOOK_TYPE_ID,
        slug: 'books',
        singularName: 'Libro',
        pluralName: 'Libros',
        description: '',
        icon: 'book',
        capabilities: ['content.books'],
        supports: ['title', 'revisions'],
        public: true,
        showInMenu: true,
        order: 0,
        singleTemplateId: null,
        archiveTemplateId: null,
        fieldIds: [TITLE_FIELD_ID],
        taxonomyIds: [TAXONOMY_ID],
      },
      [AUTHOR_TYPE_ID]: {
        id: AUTHOR_TYPE_ID,
        slug: 'authors',
        singularName: 'Autor',
        pluralName: 'Autores',
        description: '',
        icon: 'user',
        capabilities: ['content.authors'],
        supports: ['title'],
        public: true,
        showInMenu: true,
        order: 1,
        singleTemplateId: null,
        archiveTemplateId: null,
        fieldIds: [BIO_FIELD_ID],
        taxonomyIds: [],
      },
    },
    taxonomies: {
      [TAXONOMY_ID]: {
        id: TAXONOMY_ID,
        slug: 'genres',
        singularName: 'Género',
        pluralName: 'Géneros',
        description: '',
        hierarchical: true,
        contentTypeIds: [BOOK_TYPE_ID],
        fieldIds: [],
        archiveTemplateId: null,
      },
    },
    fields: {
      [TITLE_FIELD_ID]: baseField(TITLE_FIELD_ID, BOOK_TYPE_ID, 'title'),
      [BIO_FIELD_ID]: baseField(BIO_FIELD_ID, AUTHOR_TYPE_ID, 'bio'),
    },
    records: {
      [BOOK_ONE_ID]: { id: BOOK_ONE_ID, contentTypeId: BOOK_TYPE_ID, status: 'published', authorId: USER_ID, values: { [TITLE_FIELD_ID]: 'Uno' }, taxonomyTermIds: [TERM_ID], createdAt: '2026-08-09T10:00:00.000Z', updatedAt: '2026-08-09T10:00:00.000Z' },
      [BOOK_TWO_ID]: { id: BOOK_TWO_ID, contentTypeId: BOOK_TYPE_ID, status: 'draft', authorId: USER_ID, values: { [TITLE_FIELD_ID]: 'Dos' }, taxonomyTermIds: [], createdAt: '2026-08-09T10:00:00.000Z', updatedAt: '2026-08-09T11:00:00.000Z' },
      [AUTHOR_ONE_ID]: { id: AUTHOR_ONE_ID, contentTypeId: AUTHOR_TYPE_ID, status: 'published', authorId: USER_ID, values: { [BIO_FIELD_ID]: 'Primero' }, taxonomyTermIds: [], createdAt: '2026-08-09T10:00:00.000Z', updatedAt: '2026-08-09T10:00:00.000Z' },
      [AUTHOR_TWO_ID]: { id: AUTHOR_TWO_ID, contentTypeId: AUTHOR_TYPE_ID, status: 'published', authorId: USER_ID, values: { [BIO_FIELD_ID]: 'Segundo' }, taxonomyTermIds: [], createdAt: '2026-08-09T10:00:00.000Z', updatedAt: '2026-08-09T10:00:00.000Z' },
    },
    taxonomyTerms: {
      [TERM_ID]: { id: TERM_ID, taxonomyId: TAXONOMY_ID, slug: 'fiction', name: 'Ficción', description: '', parentId: null, values: {} },
    },
    relations: {
      [RELATION_ID]: { id: RELATION_ID, name: 'Autores de libros', slug: 'book-authors', cardinality: 'many-to-many', sourceContentTypeId: BOOK_TYPE_ID, targetContentTypeId: AUTHOR_TYPE_ID },
    },
    relationEntries: {
      [ENTRY_ONE_ID]: { id: ENTRY_ONE_ID, relationId: RELATION_ID, sourceRecordId: BOOK_ONE_ID, targetRecordId: AUTHOR_ONE_ID },
      [ENTRY_TWO_ID]: { id: ENTRY_TWO_ID, relationId: RELATION_ID, sourceRecordId: BOOK_ONE_ID, targetRecordId: AUTHOR_TWO_ID },
      [ENTRY_THREE_ID]: { id: ENTRY_THREE_ID, relationId: RELATION_ID, sourceRecordId: BOOK_TWO_ID, targetRecordId: AUTHOR_ONE_ID },
    },
    queries: {
      [QUERY_ID]: {
        id: QUERY_ID,
        name: 'Libros publicados',
        contentTypeId: BOOK_TYPE_ID,
        groups: [{ operator: 'all', predicates: [{ source: 'status', fieldId: null, taxonomyId: null, relationId: null, operator: 'equals', value: 'published' }] }],
        sorts: [{ fieldId: TITLE_FIELD_ID, systemField: null, direction: 'asc' }],
        limit: 100,
        offset: 0,
        pageSize: 20,
      },
    },
    forms: {
      [FORM_ID]: {
        id: FORM_ID,
        name: 'Editar libro',
        contentTypeId: BOOK_TYPE_ID,
        controls: { [CONTROL_ID]: { id: CONTROL_ID, name: 'title', label: 'Título', type: 'text', mappedFieldId: TITLE_FIELD_ID, required: true, conditions: [] } },
        steps: [{ id: STEP_ID, name: 'Contenido', controlIds: [CONTROL_ID] }],
        actions: [{ id: ACTION_ID, kind: 'save-record', config: {} }],
        draftSaving: true,
        csrfProtection: true,
        successMessage: 'Guardado',
        errorMessage: 'No se pudo guardar',
      },
    },
    roles: {
      [ROLE_ID]: {
        id: ROLE_ID,
        name: 'Editor',
        slug: 'editor',
        capabilities: ['content.edit'],
        contentTypes: { [BOOK_TYPE_ID]: { create: true, read: true, update: true, delete: false, publish: true, moderate: false } },
        fields: { [TITLE_FIELD_ID]: { readable: true, editable: true } },
        dashboardIds: [SCREEN_ID],
        routes: ['/admin/books'],
      },
    },
    users: {
      [USER_ID]: { id: USER_ID, displayName: 'Ada Editor', email: 'ada@example.test', status: 'active', roleIds: [ROLE_ID] },
    },
    menus: {
      [MENU_ID]: {
        id: MENU_ID,
        name: 'Administración',
        rootItemIds: [MENU_ITEM_ID],
        items: { [MENU_ITEM_ID]: { id: MENU_ITEM_ID, label: 'Libros', kind: 'screen', screenId: SCREEN_ID, target: '/admin/books', childIds: [], allowedRoleIds: [ROLE_ID] } },
      },
    },
    backendScreens: {
      [SCREEN_ID]: { id: SCREEN_ID, name: 'Libros', route: '/admin/books', kind: 'table', documentId: DOCUMENT_ID, contentTypeId: BOOK_TYPE_ID, queryId: QUERY_ID, formId: FORM_ID, allowedRoleIds: [ROLE_ID] },
    },
  })
}

function codes(input: unknown): string[] {
  const result = validateCmsBackend(input)
  return result.ok ? [] : result.error.map((item) => item.code)
}

describe('modelo CMS y backend', () => {
  it('valida el modelo normalizado completo', () => {
    expect(validateCmsBackend(validCms()).ok).toBe(true)
  })

  it('aplica cardinalidad 1:1 en ambos extremos', () => {
    const invalid = validCms()
    invalid.relations[RELATION_ID] = { ...invalid.relations[RELATION_ID], cardinality: 'one-to-one' }
    expect(codes(invalid)).toContain('relation-cardinality')

    const valid = validCms()
    valid.relations[RELATION_ID] = { ...valid.relations[RELATION_ID], cardinality: 'one-to-one' }
    delete valid.relationEntries[ENTRY_TWO_ID]
    delete valid.relationEntries[ENTRY_THREE_ID]
    expect(validateCmsBackend(valid).ok).toBe(true)
  })

  it('aplica cardinalidad 1:N solo al extremo destino', () => {
    const valid = validCms()
    valid.relations[RELATION_ID] = { ...valid.relations[RELATION_ID], cardinality: 'one-to-many' }
    delete valid.relationEntries[ENTRY_THREE_ID]
    expect(validateCmsBackend(valid).ok).toBe(true)

    const invalid = validCms()
    invalid.relations[RELATION_ID] = { ...invalid.relations[RELATION_ID], cardinality: 'one-to-many' }
    expect(codes(invalid)).toContain('relation-cardinality')
  })

  it('permite cardinalidad N:N en ambos extremos', () => {
    expect(validateCmsBackend(validCms()).ok).toBe(true)
  })

  it('diagnostica campos obligatorios, extremos y jerarquías inválidas', () => {
    const cms = validCms()
    delete cms.records[BOOK_ONE_ID].values[TITLE_FIELD_ID]
    cms.relationEntries[ENTRY_ONE_ID] = { ...cms.relationEntries[ENTRY_ONE_ID], targetRecordId: BOOK_TWO_ID }
    cms.taxonomyTerms[TERM_ID] = { ...cms.taxonomyTerms[TERM_ID], parentId: TERM_ID }
    const result = codes(cms)
    expect(result).toContain('missing-required-field')
    expect(result).toContain('invalid-relation-endpoint')
    expect(result).toContain('term-cycle')
  })

  it('diagnostica contratos rotos de consulta, formulario y menú', () => {
    const cms = validCms()
    cms.queries[QUERY_ID] = {
      ...cms.queries[QUERY_ID],
      sorts: [{ fieldId: TITLE_FIELD_ID, systemField: 'createdAt', direction: 'asc' }],
    }
    cms.forms[FORM_ID] = {
      ...cms.forms[FORM_ID],
      steps: [{ id: STEP_ID, name: 'Contenido', controlIds: ['24242424-2424-4242-8242-242424242424'] }],
    }
    cms.menus[MENU_ID].items[MENU_ITEM_ID] = {
      ...cms.menus[MENU_ID].items[MENU_ITEM_ID],
      childIds: [MENU_ITEM_ID],
    }
    const result = codes(cms)
    expect(result).toContain('invalid-query-sort')
    expect(result).toContain('invalid-form-control')
    expect(result).toContain('menu-cycle')
  })

  it('rechaza referencias cruzadas de otro tipo de contenido', () => {
    const cms = validCms()
    cms.queries[QUERY_ID] = {
      ...cms.queries[QUERY_ID],
      groups: [{ operator: 'all', predicates: [{ source: 'field', fieldId: BIO_FIELD_ID, taxonomyId: null, relationId: null, operator: 'contains', value: 'Ada' }] }],
      sorts: [{ fieldId: BIO_FIELD_ID, systemField: null, direction: 'asc' }],
    }
    cms.forms[FORM_ID].controls[CONTROL_ID] = {
      ...cms.forms[FORM_ID].controls[CONTROL_ID],
      conditions: [{ operator: 'all', conditions: [{ fieldId: BIO_FIELD_ID, operator: 'exists', value: true }] }],
    }
    cms.backendScreens[SCREEN_ID] = {
      ...cms.backendScreens[SCREEN_ID],
      contentTypeId: AUTHOR_TYPE_ID,
    }

    const result = codes(cms)
    expect(result).toContain('invalid-query-predicate')
    expect(result).toContain('invalid-query-sort')
    expect(result).toContain('invalid-form-control')
    expect(result).toContain('invalid-screen-reference')
  })

  it('genera JSON Schema estricto para CMS y backend', () => {
    expect(CmsBackendSchema.toJSONSchema()).toMatchObject({ type: 'object', additionalProperties: false })
  })
})
