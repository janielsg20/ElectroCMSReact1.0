import { describe, expect, it } from 'vitest'
import { EMPTY_CMS_BACKEND } from './cms-defaults'
import type { ContentType, FieldDefinition, Relation, Taxonomy } from './cms-schema'
import {
  createCustomField,
  deleteCustomField,
  listCustomFields,
  updateCustomField,
} from './custom-field-engine'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseContentTypeId,
  parseFieldDefinitionId,
  parseRelationId,
  parseTaxonomyId,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'

const contentTypeId = parseContentTypeId('10101010-1010-4010-8010-101010101010')
const secondContentTypeId = parseContentTypeId('20202020-2020-4020-8020-202020202020')
const taxonomyId = parseTaxonomyId('30303030-3030-4030-8030-303030303030')
const relationId = parseRelationId('40404040-4040-4040-8040-404040404040')

function contentType(id: typeof contentTypeId, slug: string): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id,
    order: 10,
    pluralName: slug === 'articles' ? 'Artículos' : 'Autores',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: slug === 'articles' ? 'Artículo' : 'Autor',
    slug,
    supports: ['title', 'custom-fields'],
    taxonomyIds: slug === 'articles' ? [taxonomyId] : [],
  }
}

function categoryTaxonomy(): Taxonomy {
  return {
    archiveTemplateId: null,
    contentTypeIds: [contentTypeId],
    description: '',
    fieldIds: [],
    hierarchical: true,
    id: taxonomyId,
    pluralName: 'Categorías',
    singularName: 'Categoría',
    slug: 'categories',
  }
}

function articleAuthorRelation(): Relation {
  return {
    cardinality: 'one-to-many',
    id: relationId,
    name: 'Autor de artículo',
    slug: 'article-author',
    sourceContentTypeId: contentTypeId,
    targetContentTypeId: secondContentTypeId,
  }
}

function structure(): ProjectStructure {
  const cms = structuredClone(EMPTY_CMS_BACKEND)
  cms.contentTypes[contentTypeId] = contentType(contentTypeId, 'articles')
  cms.contentTypes[secondContentTypeId] = contentType(secondContentTypeId, 'authors')
  cms.taxonomies[taxonomyId] = categoryTaxonomy()
  cms.relations[relationId] = articleAuthorRelation()
  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    cms,
    documents: {},
    globalComponents: {},
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

function field(
  type: FieldDefinition['type'],
  key = `field-${type}`,
  overrides: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    allowedRoleIds: [],
    calculatedExpression: type === 'calculated' ? 'price * quantity' : null,
    childFieldIds: [],
    conditions: [],
    defaultValue: null,
    description: '',
    group: '',
    id: parseFieldDefinitionId(crypto.randomUUID()),
    key,
    label: `Campo ${type}`,
    options: type === 'select' || type === 'radio'
      ? [{ label: 'Principal', value: 'main' }]
      : type === 'checkbox'
        ? [{ label: 'Activo', value: 'active' }]
        : [],
    order: 10,
    owner: { contentTypeId, kind: 'content-type' },
    placeholder: '',
    relationId: type === 'relation' ? relationId : null,
    required: false,
    taxonomyId: type === 'taxonomy' ? taxonomyId : null,
    type,
    validation: { max: null, maxLength: null, min: null, minLength: null, pattern: null },
    ...overrides,
  }
}

describe('M09.3 custom field engine', () => {
  it('crea, lista y sincroniza un campo con su CPT propietario', () => {
    const text = field('text', 'subtitle')
    const created = createCustomField(structure(), text)
    expect(created.ok).toBe(true)
    if (!created.ok) return

    expect(created.value.cms?.contentTypes[contentTypeId]?.fieldIds).toContain(text.id)
    expect(listCustomFields(created.value).map((item) => item.id)).toEqual([text.id])
  })

  it('rechaza claves duplicadas dentro del mismo propietario y defaults incompatibles', () => {
    const first = field('text', 'subtitle')
    const created = createCustomField(structure(), first)
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const duplicate = createCustomField(created.value, field('textarea', 'subtitle'))
    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) expect(duplicate.error[0]?.code).toBe('field-key-conflict')

    const invalidDefault = createCustomField(created.value, field('number', 'price', { defaultValue: '12' }))
    expect(invalidDefault.ok).toBe(false)
    if (!invalidDefault.ok) expect(invalidDefault.error[0]?.code).toBe('invalid-default-value')
  })

  it('acepta los 27 tipos exigidos cuando su configuración canónica es válida', () => {
    const types: FieldDefinition['type'][] = [
      'text', 'textarea', 'rich-text', 'number', 'currency', 'email', 'phone', 'url', 'date', 'time',
      'datetime', 'color', 'select', 'radio', 'checkbox', 'switch', 'image', 'gallery', 'file', 'map',
      'relation', 'user', 'taxonomy', 'conditional',
    ]
    let current = structure()
    for (const type of types) {
      const created = createCustomField(current, field(type, `field-${type}`))
      expect(created.ok, `tipo ${type}`).toBe(true)
      if (created.ok) current = created.value
    }

    const child = field('text', 'child')
    const withChild = createCustomField(current, child)
    expect(withChild.ok).toBe(true)
    if (!withChild.ok) return

    const group = createCustomField(withChild.value, field('group', 'group-field', {
      childFieldIds: [child.id],
      defaultValue: {},
    }))
    expect(group.ok).toBe(true)
    if (!group.ok) return

    const repeater = createCustomField(group.value, field('repeater', 'repeater-field', {
      childFieldIds: [child.id],
      defaultValue: [],
    }))
    expect(repeater.ok).toBe(true)
    if (!repeater.ok) return

    const calculated = createCustomField(repeater.value, field('calculated', 'total'))
    expect(calculated.ok).toBe(true)
  })

  it('valida opciones, referencias de taxonomía, hijos y condiciones dentro del propietario', () => {
    const emptySelect = createCustomField(structure(), field('select', 'status', { options: [] }))
    expect(emptySelect.ok).toBe(false)
    if (!emptySelect.ok) expect(emptySelect.error[0]?.code).toBe('invalid-options')

    const child = field('text', 'child')
    const createdChild = createCustomField(structure(), child)
    expect(createdChild.ok).toBe(true)
    if (!createdChild.ok) return

    const sameOwnerCondition = createCustomField(createdChild.value, field('conditional', 'conditional-field', {
      conditions: [{ conditions: [{ fieldId: child.id, operator: 'exists', value: null }], operator: 'all' }],
    }))
    expect(sameOwnerCondition.ok).toBe(true)

    const badChild = createCustomField(createdChild.value, field('text', 'not-composite', { childFieldIds: [child.id] }))
    expect(badChild.ok).toBe(false)
    if (!badChild.ok) expect(badChild.error[0]?.code).toBe('invalid-child-field')
  })

  it('actualiza configuración y protege borrado cuando otro campo depende de él', () => {
    const child = field('text', 'child')
    const createdChild = createCustomField(structure(), child)
    expect(createdChild.ok).toBe(true)
    if (!createdChild.ok) return

    const updated = updateCustomField(createdChild.value, child.id, { label: 'Campo hijo', order: 4 })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.cms?.fields[child.id]?.label).toBe('Campo hijo')

    const groupField = field('group', 'group-field', { childFieldIds: [child.id], defaultValue: {} })
    const withGroup = createCustomField(updated.value, groupField)
    expect(withGroup.ok).toBe(true)
    if (!withGroup.ok) return

    const blocked = deleteCustomField(withGroup.value, child.id)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.error[0]?.code).toBe('field-in-use')

    const removedGroup = deleteCustomField(withGroup.value, groupField.id)
    expect(removedGroup.ok).toBe(true)
    if (!removedGroup.ok) return
    const removedChild = deleteCustomField(removedGroup.value, child.id)
    expect(removedChild.ok).toBe(true)
    if (removedChild.ok) expect(removedChild.value.cms?.contentTypes[contentTypeId]?.fieldIds).not.toContain(child.id)
  })
})
