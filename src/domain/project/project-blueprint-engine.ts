import { failure, success, type Result } from '../common/result'
import {
  parseBackendScreenId,
  parseContentRecordId,
  parseContentTypeId,
  parseDocumentId,
  parseFieldDefinitionId,
  parseFormId,
  parseMenuId,
  parseMenuItemId,
  parseQueryId,
  parseRelationId,
  parseRoleId,
  parseTaxonomyId,
  parseTimestamp,
} from './identity'
import { projectCmsBackend } from './cms-defaults'
import type { ProjectBlueprint } from './project-blueprints'
import type { ProjectStructure } from './structure-schema'
import { validateProjectStructure } from './validate-structure'

export interface ProjectBlueprintApplyOptions {
  readonly createId: () => string
  readonly now?: string
}

export interface ProjectBlueprintApplyReport {
  readonly blueprintId: ProjectBlueprint['id']
  readonly created: Readonly<Record<'backendScreens' | 'contentTypes' | 'documents' | 'fields' | 'forms' | 'queries' | 'records' | 'relations' | 'roles' | 'taxonomies', number>>
}

function emptyValidation() {
  return { max: null, maxLength: null, min: null, minLength: null, pattern: null }
}

/**
 * Aplica un modelo inicial completamente editable. No reemplaza datos existentes;
 * se niega antes de escribir si el tipo o las rutas públicas ya están ocupados.
 */
export function applyProjectBlueprint(
  structure: ProjectStructure,
  blueprint: ProjectBlueprint,
  options: ProjectBlueprintApplyOptions,
): Result<{ readonly report: ProjectBlueprintApplyReport; readonly structure: ProjectStructure }, readonly string[]> {
  const cms = projectCmsBackend(structure.cms)
  const pageRoute = `/${blueprint.primaryContentSlug}`
  const conflicts: string[] = []
  if (Object.values(cms.contentTypes).some((item) => item.slug === blueprint.primaryContentSlug)) conflicts.push(`Ya existe un tipo de contenido con la URL amigable “${blueprint.primaryContentSlug}”.`)
  if (Object.values(structure.documents).some((item) => item.routePath === pageRoute)) conflicts.push(`Ya existe una página en “${pageRoute}”.`)
  if (conflicts.length > 0) return failure(conflicts)

  const createId = options.createId
  const contentTypeId = parseContentTypeId(createId())
  const taxonomyId = parseTaxonomyId(createId())
  const fieldId = parseFieldDefinitionId(createId())
  const relationId = parseRelationId(createId())
  const recordId = parseContentRecordId(createId())
  const queryId = parseQueryId(createId())
  const formId = parseFormId(createId())
  const roleId = parseRoleId(createId())
  const menuId = parseMenuId(createId())
  const menuItemId = parseMenuItemId(createId())
  const screenId = parseBackendScreenId(createId())
  const pageId = parseDocumentId(createId())
  const singleId = parseDocumentId(createId())
  const archiveId = parseDocumentId(createId())
  const timestamp = parseTimestamp(options.now ?? new Date().toISOString())

  cms.contentTypes[contentTypeId] = {
    archiveTemplateId: archiveId, capabilities: ['create', 'read', 'update', 'delete', 'publish'], description: blueprint.description,
    fieldIds: [fieldId], icon: 'collection', id: contentTypeId, order: Object.keys(cms.contentTypes).length,
    pluralName: `${blueprint.primaryContentLabel}s`, public: true, showInMenu: true, singleTemplateId: singleId,
    singularName: blueprint.primaryContentLabel, slug: blueprint.primaryContentSlug,
    supports: ['title', 'editor', 'author', 'thumbnail', 'excerpt', 'revisions', 'custom-fields'], taxonomyIds: [taxonomyId],
  }
  cms.taxonomies[taxonomyId] = {
    archiveTemplateId: null, contentTypeIds: [contentTypeId], description: `Clasifica ${blueprint.primaryContentLabel.toLocaleLowerCase('es')}s.`, fieldIds: [], hierarchical: true,
    id: taxonomyId, pluralName: 'Categorías', singularName: 'Categoría', slug: `${blueprint.primaryContentSlug}-category`,
  }
  cms.fields[fieldId] = {
    allowedRoleIds: [], calculatedExpression: null, childFieldIds: [], conditions: [], defaultValue: '', description: `Información principal de ${blueprint.primaryContentLabel.toLocaleLowerCase('es')}.`,
    group: 'Información principal', id: fieldId, key: 'summary', label: 'Resumen', options: [], order: 0,
    owner: { contentTypeId, kind: 'content-type' }, placeholder: 'Escribe un resumen', relationId: null, required: false, taxonomyId: null, type: 'textarea', validation: emptyValidation(),
  }
  cms.relations[relationId] = { cardinality: 'many-to-many', id: relationId, name: `Relacionados con ${blueprint.primaryContentLabel}`, slug: `${blueprint.primaryContentSlug}-related`, sourceContentTypeId: contentTypeId, targetContentTypeId: contentTypeId }
  cms.records[recordId] = { authorId: null, contentTypeId, createdAt: timestamp, id: recordId, status: 'draft', taxonomyTermIds: [], updatedAt: timestamp, values: { [fieldId]: `Ejemplo de ${blueprint.primaryContentLabel.toLocaleLowerCase('es')}` } }
  cms.queries[queryId] = { contentTypeId, groups: [{ operator: 'all', predicates: [{ fieldId: null, operator: 'equals', relationId: null, source: 'status', taxonomyId: null, value: 'published' }] }], id: queryId, limit: 24, name: `${blueprint.primaryContentLabel}s publicados`, offset: 0, pageSize: 12, sorts: [{ direction: 'desc', fieldId: null, systemField: 'updatedAt' }] }
  const controlId = createId()
  cms.forms[formId] = { actions: [{ config: {}, id: createId(), kind: 'create-content' }], contentTypeId, controls: { [controlId]: { conditions: [], id: controlId, label: 'Resumen', mappedFieldId: fieldId, name: 'summary', required: false, type: 'textarea' } }, csrfProtection: true, draftSaving: true, errorMessage: 'No se pudo guardar. Revisa los datos e inténtalo nuevamente.', id: formId, name: `Enviar ${blueprint.primaryContentLabel.toLocaleLowerCase('es')}`, steps: [{ controlIds: [controlId], id: createId(), name: 'Datos principales' }], successMessage: 'Guardado correctamente.' }
  cms.roles[roleId] = { capabilities: ['admin.access', 'content.manage'], contentTypes: { [contentTypeId]: { create: true, delete: true, moderate: true, publish: true, read: true, update: true } }, dashboardIds: [screenId], fields: { [fieldId]: { editable: true, readable: true } }, id: roleId, name: 'Gestor del proyecto', routes: [`/admin/${blueprint.primaryContentSlug}`], slug: `${blueprint.primaryContentSlug}-manager` }
  cms.menus[menuId] = { id: menuId, items: { [menuItemId]: { allowedRoleIds: [roleId], childIds: [], id: menuItemId, kind: 'screen', label: `Administrar ${blueprint.primaryContentLabel}s`, screenId, target: `/admin/${blueprint.primaryContentSlug}` } }, name: 'Administración', rootItemIds: [menuItemId] }
  cms.backendScreens[screenId] = { allowedRoleIds: [roleId], contentTypeId, documentId: pageId, formId, id: screenId, kind: 'table', name: `Administrar ${blueprint.primaryContentLabel}s`, queryId, route: `/admin/${blueprint.primaryContentSlug}` }

  const next = structuredClone(structure)
  next.documents[pageId] = { conditions: [], id: pageId, kind: 'page', name: `${blueprint.name} — Inicio`, nodes: {}, rootNodeIds: [], routePath: pageRoute }
  next.documents[singleId] = { conditions: [{ contentType: blueprint.primaryContentSlug, priority: 0, target: 'single' }], id: singleId, kind: 'single', name: `${blueprint.primaryContentLabel} individual`, nodes: {}, rootNodeIds: [] }
  next.documents[archiveId] = { conditions: [{ contentType: blueprint.primaryContentSlug, priority: 0, target: 'archive' }], id: archiveId, kind: 'archive', name: `Archivo de ${blueprint.primaryContentLabel}s`, nodes: {}, rootNodeIds: [] }
  next.cms = cms
  const validated = validateProjectStructure(next)
  if (!validated.ok) return failure(validated.error.map((issue) => issue.message))
  return success({
    structure: validated.value,
    report: { blueprintId: blueprint.id, created: { backendScreens: 1, contentTypes: 1, documents: 3, fields: 1, forms: 1, queries: 1, records: 1, relations: 1, roles: 1, taxonomies: 1 } },
  })
}
