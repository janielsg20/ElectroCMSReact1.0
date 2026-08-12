import { failure, success, type Result } from '../common/result'
import { CmsBackendSchema, type CmsBackend, type Menu } from './cms-schema'

export type CmsDiagnosticCode =
  | 'schema-invalid'
  | 'entity-key-mismatch'
  | 'duplicate-slug'
  | 'duplicate-route'
  | 'missing-reference'
  | 'owner-mismatch'
  | 'invalid-field-config'
  | 'invalid-record-field'
  | 'missing-required-field'
  | 'invalid-chronology'
  | 'invalid-term-parent'
  | 'term-cycle'
  | 'invalid-relation-endpoint'
  | 'duplicate-relation-entry'
  | 'relation-cardinality'
  | 'invalid-query-predicate'
  | 'invalid-query-sort'
  | 'invalid-form-control'
  | 'duplicate-form-control'
  | 'invalid-role-permission'
  | 'invalid-menu-item'
  | 'menu-cycle'
  | 'invalid-screen-reference'

export interface CmsDiagnostic {
  readonly code: CmsDiagnosticCode
  readonly message: string
  readonly path: readonly (number | string)[]
}

type DiagnosticSink = CmsDiagnostic[]

function entityById<TEntity>(
  collection: Readonly<Record<string, TEntity>>,
  id: string,
): TEntity | undefined {
  return collection[id]
}

function report(
  diagnostics: DiagnosticSink,
  code: CmsDiagnosticCode,
  message: string,
  path: readonly (number | string)[],
): void {
  diagnostics.push({ code, message, path })
}

function validateNormalizedKeys(
  cms: CmsBackend,
  diagnostics: DiagnosticSink,
): void {
  const collections: ReadonlyArray<readonly [
    string,
    Readonly<Record<string, { readonly id: string }>>,
  ]> = [
    ['contentTypes', cms.contentTypes],
    ['taxonomies', cms.taxonomies],
    ['fields', cms.fields],
    ['records', cms.records],
    ['recordRevisions', cms.recordRevisions],
    ['taxonomyTerms', cms.taxonomyTerms],
    ['relations', cms.relations],
    ['relationEntries', cms.relationEntries],
    ['queries', cms.queries],
    ['forms', cms.forms],
    ['roles', cms.roles],
    ['users', cms.users],
    ['menus', cms.menus],
    ['backendScreens', cms.backendScreens],
  ]

  for (const [collectionName, collection] of collections) {
    for (const [key, entity] of Object.entries(collection)) {
      if (entity.id !== key) {
        report(
          diagnostics,
          'entity-key-mismatch',
          `La clave ${key} no coincide con el ID interno ${entity.id}.`,
          [collectionName, key, 'id'],
        )
      }
    }
  }
}

function validateUniqueProperty(
  collectionName: string,
  entries: readonly [string, string][],
  property: 'route' | 'slug',
  diagnostics: DiagnosticSink,
): void {
  const seen = new Map<string, string>()
  for (const [id, value] of entries) {
    const previousId = seen.get(value)
    if (previousId) {
      report(
        diagnostics,
        property === 'route' ? 'duplicate-route' : 'duplicate-slug',
        `${property} ${value} se repite en ${previousId} y ${id}.`,
        [collectionName, id, property],
      )
    } else {
      seen.set(value, id)
    }
  }
}

function validateContentModel(cms: CmsBackend, diagnostics: DiagnosticSink): void {
  validateUniqueProperty(
    'contentTypes',
    Object.entries(cms.contentTypes).map(([id, item]) => [id, item.slug]),
    'slug',
    diagnostics,
  )
  validateUniqueProperty(
    'taxonomies',
    Object.entries(cms.taxonomies).map(([id, item]) => [id, item.slug]),
    'slug',
    diagnostics,
  )

  for (const [contentTypeId, contentType] of Object.entries(cms.contentTypes)) {
    for (const fieldId of contentType.fieldIds) {
      const field = cms.fields[fieldId]
      if (!field) {
        report(diagnostics, 'missing-reference', `El campo ${fieldId} no existe.`, ['contentTypes', contentTypeId, 'fieldIds'])
      } else if (field.owner.kind !== 'content-type' || field.owner.contentTypeId !== contentType.id) {
        report(diagnostics, 'owner-mismatch', `El campo ${fieldId} no pertenece al tipo ${contentTypeId}.`, ['contentTypes', contentTypeId, 'fieldIds'])
      }
    }
    for (const taxonomyId of contentType.taxonomyIds) {
      const taxonomy = cms.taxonomies[taxonomyId]
      if (!taxonomy) {
        report(diagnostics, 'missing-reference', `La taxonomía ${taxonomyId} no existe.`, ['contentTypes', contentTypeId, 'taxonomyIds'])
      } else if (!taxonomy.contentTypeIds.includes(contentType.id)) {
        report(diagnostics, 'owner-mismatch', `La asociación con ${taxonomyId} no es bidireccional.`, ['contentTypes', contentTypeId, 'taxonomyIds'])
      }
    }
  }

  for (const [taxonomyId, taxonomy] of Object.entries(cms.taxonomies)) {
    for (const contentTypeId of taxonomy.contentTypeIds) {
      const contentType = cms.contentTypes[contentTypeId]
      if (!contentType) {
        report(diagnostics, 'missing-reference', `El tipo ${contentTypeId} no existe.`, ['taxonomies', taxonomyId, 'contentTypeIds'])
      } else if (!contentType.taxonomyIds.includes(taxonomy.id)) {
        report(diagnostics, 'owner-mismatch', `La asociación con ${contentTypeId} no es bidireccional.`, ['taxonomies', taxonomyId, 'contentTypeIds'])
      }
    }
    for (const fieldId of taxonomy.fieldIds) {
      const field = cms.fields[fieldId]
      if (!field) {
        report(diagnostics, 'missing-reference', `El campo ${fieldId} no existe.`, ['taxonomies', taxonomyId, 'fieldIds'])
      } else if (field.owner.kind !== 'taxonomy' || field.owner.taxonomyId !== taxonomy.id) {
        report(diagnostics, 'owner-mismatch', `El campo ${fieldId} no pertenece a la taxonomía ${taxonomyId}.`, ['taxonomies', taxonomyId, 'fieldIds'])
      }
    }
  }
}

function validateFields(cms: CmsBackend, diagnostics: DiagnosticSink): void {
  for (const [fieldId, field] of Object.entries(cms.fields)) {
    const path = ['fields', fieldId] as const
    const ownerExists = field.owner.kind === 'content-type'
      ? Boolean(cms.contentTypes[field.owner.contentTypeId])
      : Boolean(cms.taxonomies[field.owner.taxonomyId])
    if (!ownerExists) report(diagnostics, 'missing-reference', `El propietario del campo ${fieldId} no existe.`, [...path, 'owner'])

    if (field.validation.minLength !== null && field.validation.maxLength !== null && field.validation.minLength > field.validation.maxLength) {
      report(diagnostics, 'invalid-field-config', `Los límites de longitud de ${fieldId} están invertidos.`, [...path, 'validation'])
    }
    if (field.validation.min !== null && field.validation.max !== null && field.validation.min > field.validation.max) {
      report(diagnostics, 'invalid-field-config', `Los límites numéricos de ${fieldId} están invertidos.`, [...path, 'validation'])
    }
    if (field.type === 'relation' && (!field.relationId || !cms.relations[field.relationId])) {
      report(diagnostics, 'invalid-field-config', `El campo relacional ${fieldId} requiere una relación existente.`, [...path, 'relationId'])
    } else if (field.type === 'relation' && field.relationId && field.owner.kind === 'content-type') {
      const relation = cms.relations[field.relationId]
      if (relation && relation.sourceContentTypeId !== field.owner.contentTypeId && relation.targetContentTypeId !== field.owner.contentTypeId) {
        report(diagnostics, 'invalid-field-config', `La relación ${field.relationId} no incluye al propietario de ${fieldId}.`, [...path, 'relationId'])
      }
    }
    if (field.type === 'taxonomy' && (!field.taxonomyId || !cms.taxonomies[field.taxonomyId])) {
      report(diagnostics, 'invalid-field-config', `El campo taxonomía ${fieldId} requiere una taxonomía existente.`, [...path, 'taxonomyId'])
    }
    if (field.type === 'calculated' && !field.calculatedExpression) {
      report(diagnostics, 'invalid-field-config', `El campo calculado ${fieldId} requiere expresión.`, [...path, 'calculatedExpression'])
    }
    if ((field.type === 'group' || field.type === 'repeater') && field.childFieldIds.length === 0) {
      report(diagnostics, 'invalid-field-config', `El campo ${field.type} ${fieldId} requiere campos hijos.`, [...path, 'childFieldIds'])
    }

    for (const childId of field.childFieldIds) {
      if (!cms.fields[childId]) report(diagnostics, 'missing-reference', `El campo hijo ${childId} no existe.`, [...path, 'childFieldIds'])
    }
    for (const group of field.conditions) {
      for (const condition of group.conditions) {
        if (!cms.fields[condition.fieldId]) report(diagnostics, 'missing-reference', `El campo condicional ${condition.fieldId} no existe.`, [...path, 'conditions'])
      }
    }
    for (const roleId of field.allowedRoleIds) {
      if (!cms.roles[roleId]) report(diagnostics, 'missing-reference', `El rol ${roleId} no existe.`, [...path, 'allowedRoleIds'])
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visit(fieldId: string): void {
    if (visiting.has(fieldId)) {
      report(diagnostics, 'invalid-field-config', `Los campos compuestos contienen un ciclo en ${fieldId}.`, ['fields', fieldId, 'childFieldIds'])
      return
    }
    if (visited.has(fieldId)) return
    visiting.add(fieldId)
    for (const childId of entityById(cms.fields, fieldId)?.childFieldIds ?? []) visit(childId)
    visiting.delete(fieldId)
    visited.add(fieldId)
  }
  for (const fieldId of Object.keys(cms.fields)) visit(fieldId)
}

function validateRecordsAndTerms(cms: CmsBackend, diagnostics: DiagnosticSink): void {
  for (const [recordId, record] of Object.entries(cms.records)) {
    const path = ['records', recordId] as const
    const contentType = cms.contentTypes[record.contentTypeId]
    if (!contentType) {
      report(diagnostics, 'missing-reference', `El tipo de contenido ${record.contentTypeId} no existe.`, [...path, 'contentTypeId'])
      continue
    }
    if (record.authorId && !cms.users[record.authorId]) report(diagnostics, 'missing-reference', `El autor ${record.authorId} no existe.`, [...path, 'authorId'])
    if (record.updatedAt < record.createdAt) report(diagnostics, 'invalid-chronology', `El registro ${recordId} se actualizó antes de crearse.`, [...path, 'updatedAt'])

    for (const fieldId of Object.keys(record.values)) {
      if (!contentType.fieldIds.some((candidateId) => candidateId === fieldId)) {
        report(diagnostics, 'invalid-record-field', `El campo ${fieldId} no pertenece al tipo ${contentType.id}.`, [...path, 'values', fieldId])
      }
    }
    if (record.status !== 'draft') {
      for (const fieldId of contentType.fieldIds) {
        if (cms.fields[fieldId]?.required && !(fieldId in record.values)) {
          report(diagnostics, 'missing-required-field', `Falta el campo obligatorio ${fieldId}.`, [...path, 'values'])
        }
      }
    }
    for (const termId of record.taxonomyTermIds) {
      const term = cms.taxonomyTerms[termId]
      if (!term) {
        report(diagnostics, 'missing-reference', `El término ${termId} no existe.`, [...path, 'taxonomyTermIds'])
      } else if (!contentType.taxonomyIds.includes(term.taxonomyId)) {
        report(diagnostics, 'owner-mismatch', `El término ${termId} no corresponde al tipo ${contentType.id}.`, [...path, 'taxonomyTermIds'])
      }
    }
  }

  for (const [termId, term] of Object.entries(cms.taxonomyTerms)) {
    const path = ['taxonomyTerms', termId] as const
    const taxonomy = cms.taxonomies[term.taxonomyId]
    if (!taxonomy) {
      report(diagnostics, 'missing-reference', `La taxonomía ${term.taxonomyId} no existe.`, [...path, 'taxonomyId'])
      continue
    }
    if (term.parentId) {
      const parent = cms.taxonomyTerms[term.parentId]
      if (!taxonomy.hierarchical || !parent || parent.taxonomyId !== term.taxonomyId) {
        report(diagnostics, 'invalid-term-parent', `El padre de ${termId} no es válido para su taxonomía.`, [...path, 'parentId'])
      }
    }
    for (const fieldId of Object.keys(term.values)) {
      if (!taxonomy.fieldIds.some((candidateId) => candidateId === fieldId)) report(diagnostics, 'invalid-record-field', `El campo ${fieldId} no pertenece a la taxonomía ${taxonomy.id}.`, [...path, 'values', fieldId])
    }
  }

  for (const termId of Object.keys(cms.taxonomyTerms)) {
    const seen = new Set<string>()
    let currentId: string | null = termId
    while (currentId) {
      if (seen.has(currentId)) {
        report(diagnostics, 'term-cycle', `La jerarquía de términos contiene un ciclo en ${currentId}.`, ['taxonomyTerms', termId, 'parentId'])
        break
      }
      seen.add(currentId)
      currentId = entityById(cms.taxonomyTerms, currentId)?.parentId ?? null
    }
  }
}

function validateRelations(cms: CmsBackend, diagnostics: DiagnosticSink): void {
  validateUniqueProperty(
    'relations',
    Object.entries(cms.relations).map(([id, relation]) => [id, relation.slug]),
    'slug',
    diagnostics,
  )
  const pairs = new Set<string>()
  const sourceCounts = new Map<string, number>()
  const targetCounts = new Map<string, number>()

  for (const [relationId, relation] of Object.entries(cms.relations)) {
    if (!cms.contentTypes[relation.sourceContentTypeId]) report(diagnostics, 'missing-reference', `El tipo origen ${relation.sourceContentTypeId} no existe.`, ['relations', relationId, 'sourceContentTypeId'])
    if (!cms.contentTypes[relation.targetContentTypeId]) report(diagnostics, 'missing-reference', `El tipo destino ${relation.targetContentTypeId} no existe.`, ['relations', relationId, 'targetContentTypeId'])
  }

  for (const [entryId, entry] of Object.entries(cms.relationEntries)) {
    const path = ['relationEntries', entryId] as const
    const relation = cms.relations[entry.relationId]
    const source = cms.records[entry.sourceRecordId]
    const target = cms.records[entry.targetRecordId]
    if (!relation || !source || !target) {
      report(diagnostics, 'missing-reference', `La entrada relacional ${entryId} contiene referencias ausentes.`, path)
      continue
    }
    if (source.contentTypeId !== relation.sourceContentTypeId || target.contentTypeId !== relation.targetContentTypeId) {
      report(diagnostics, 'invalid-relation-endpoint', `Los extremos de ${entryId} no corresponden a la relación.`, path)
    }
    const pairKey = `${entry.relationId}:${entry.sourceRecordId}:${entry.targetRecordId}`
    if (pairs.has(pairKey)) report(diagnostics, 'duplicate-relation-entry', `La relación entre registros está duplicada.`, path)
    pairs.add(pairKey)

    const sourceKey = `${entry.relationId}:${entry.sourceRecordId}`
    const targetKey = `${entry.relationId}:${entry.targetRecordId}`
    sourceCounts.set(sourceKey, (sourceCounts.get(sourceKey) ?? 0) + 1)
    targetCounts.set(targetKey, (targetCounts.get(targetKey) ?? 0) + 1)
    if (relation.cardinality === 'one-to-one' && (sourceCounts.get(sourceKey)! > 1 || targetCounts.get(targetKey)! > 1)) {
      report(diagnostics, 'relation-cardinality', `La entrada ${entryId} viola la cardinalidad 1:1.`, path)
    }
    if (relation.cardinality === 'one-to-many' && targetCounts.get(targetKey)! > 1) {
      report(diagnostics, 'relation-cardinality', `La entrada ${entryId} asigna más de un origen al mismo destino en 1:N.`, path)
    }
  }
}

function fieldBelongsToContentType(cms: CmsBackend, fieldId: string, contentTypeId: string): boolean {
  const field = entityById(cms.fields, fieldId)
  return Boolean(field && field.owner.kind === 'content-type' && field.owner.contentTypeId === contentTypeId)
}

function validateQueriesAndForms(cms: CmsBackend, diagnostics: DiagnosticSink): void {
  for (const [queryId, query] of Object.entries(cms.queries)) {
    const path = ['queries', queryId] as const
    if (!cms.contentTypes[query.contentTypeId]) report(diagnostics, 'missing-reference', `El tipo ${query.contentTypeId} no existe.`, [...path, 'contentTypeId'])
    for (const group of query.groups) {
      for (const predicate of group.predicates) {
        if ((predicate.source === 'field' || predicate.source === 'repeater') && (!predicate.fieldId || !fieldBelongsToContentType(cms, predicate.fieldId, query.contentTypeId))) {
          report(diagnostics, 'invalid-query-predicate', `El predicado ${predicate.source} requiere un campo del tipo consultado.`, [...path, 'groups'])
        }
        const taxonomy = predicate.taxonomyId ? cms.taxonomies[predicate.taxonomyId] : undefined
        if (predicate.source === 'taxonomy' && (!taxonomy || !taxonomy.contentTypeIds.includes(query.contentTypeId))) {
          report(diagnostics, 'invalid-query-predicate', `El predicado de taxonomía requiere una taxonomía asociada al tipo consultado.`, [...path, 'groups'])
        }
        const relation = predicate.relationId ? cms.relations[predicate.relationId] : undefined
        if (predicate.source === 'relation' && (!relation || (relation.sourceContentTypeId !== query.contentTypeId && relation.targetContentTypeId !== query.contentTypeId))) {
          report(diagnostics, 'invalid-query-predicate', `El predicado relacional requiere una relación conectada al tipo consultado.`, [...path, 'groups'])
        }
      }
    }
    for (const sort of query.sorts) {
      if ((sort.fieldId === null) === (sort.systemField === null)) {
        report(diagnostics, 'invalid-query-sort', `Cada orden debe elegir exactamente un campo.`, [...path, 'sorts'])
      } else if (sort.fieldId && !fieldBelongsToContentType(cms, sort.fieldId, query.contentTypeId)) {
        report(diagnostics, 'invalid-query-sort', `El campo de orden debe pertenecer al tipo consultado.`, [...path, 'sorts'])
      }
    }
  }

  for (const [formId, form] of Object.entries(cms.forms)) {
    const path = ['forms', formId] as const
    const contentType = form.contentTypeId ? cms.contentTypes[form.contentTypeId] : undefined
    if (form.contentTypeId && !contentType) report(diagnostics, 'missing-reference', `El tipo ${form.contentTypeId} no existe.`, [...path, 'contentTypeId'])
    for (const [controlKey, control] of Object.entries(form.controls)) {
      if (control.id !== controlKey) report(diagnostics, 'invalid-form-control', `La clave del control no coincide con ${control.id}.`, [...path, 'controls', controlKey, 'id'])
      if (control.mappedFieldId && (!cms.fields[control.mappedFieldId] || (contentType && !contentType.fieldIds.includes(control.mappedFieldId)))) {
        report(diagnostics, 'invalid-form-control', `El campo mapeado ${control.mappedFieldId} no es válido.`, [...path, 'controls', controlKey, 'mappedFieldId'])
      }
      for (const group of control.conditions) {
        for (const condition of group.conditions) {
          if (!cms.fields[condition.fieldId] || (form.contentTypeId && !fieldBelongsToContentType(cms, condition.fieldId, form.contentTypeId))) {
            report(diagnostics, 'invalid-form-control', `El campo condicional ${condition.fieldId} no es válido para el formulario.`, [...path, 'controls', controlKey, 'conditions'])
          }
        }
      }
    }
    const usedControls = new Set<string>()
    for (const [stepIndex, step] of form.steps.entries()) {
      for (const controlId of step.controlIds) {
        if (!form.controls[controlId]) report(diagnostics, 'invalid-form-control', `El control ${controlId} no existe.`, [...path, 'steps', stepIndex, 'controlIds'])
        if (usedControls.has(controlId)) report(diagnostics, 'duplicate-form-control', `El control ${controlId} aparece en más de un paso.`, [...path, 'steps', stepIndex, 'controlIds'])
        usedControls.add(controlId)
      }
    }
    for (const controlId of Object.keys(form.controls)) {
      if (!usedControls.has(controlId)) report(diagnostics, 'invalid-form-control', `El control ${controlId} no pertenece a ningún paso.`, [...path, 'controls', controlId])
    }
  }
}

function validateAccessAndScreens(cms: CmsBackend, diagnostics: DiagnosticSink): void {
  validateUniqueProperty(
    'roles',
    Object.entries(cms.roles).map(([id, role]) => [id, role.slug]),
    'slug',
    diagnostics,
  )
  validateUniqueProperty(
    'backendScreens',
    Object.entries(cms.backendScreens).map(([id, screen]) => [id, screen.route]),
    'route',
    diagnostics,
  )

  for (const [roleId, role] of Object.entries(cms.roles)) {
    for (const contentTypeId of Object.keys(role.contentTypes)) {
      if (!entityById(cms.contentTypes, contentTypeId)) report(diagnostics, 'invalid-role-permission', `El permiso referencia al tipo ${contentTypeId} inexistente.`, ['roles', roleId, 'contentTypes', contentTypeId])
    }
    for (const fieldId of Object.keys(role.fields)) {
      if (!entityById(cms.fields, fieldId)) report(diagnostics, 'invalid-role-permission', `El permiso referencia al campo ${fieldId} inexistente.`, ['roles', roleId, 'fields', fieldId])
    }
    for (const screenId of role.dashboardIds) {
      if (!cms.backendScreens[screenId]) report(diagnostics, 'invalid-role-permission', `El dashboard ${screenId} no existe.`, ['roles', roleId, 'dashboardIds'])
    }
  }
  for (const [userId, user] of Object.entries(cms.users)) {
    for (const roleId of user.roleIds) {
      if (!cms.roles[roleId]) report(diagnostics, 'missing-reference', `El rol ${roleId} del usuario no existe.`, ['users', userId, 'roleIds'])
    }
  }
  for (const [screenId, screen] of Object.entries(cms.backendScreens)) {
    const query = screen.queryId ? cms.queries[screen.queryId] : undefined
    const form = screen.formId ? cms.forms[screen.formId] : undefined
    if (screen.contentTypeId && !cms.contentTypes[screen.contentTypeId]) report(diagnostics, 'invalid-screen-reference', `El tipo ${screen.contentTypeId} no existe.`, ['backendScreens', screenId, 'contentTypeId'])
    if (screen.queryId && !query) report(diagnostics, 'invalid-screen-reference', `La consulta ${screen.queryId} no existe.`, ['backendScreens', screenId, 'queryId'])
    if (screen.formId && !form) report(diagnostics, 'invalid-screen-reference', `El formulario ${screen.formId} no existe.`, ['backendScreens', screenId, 'formId'])
    if (screen.contentTypeId && query && query.contentTypeId !== screen.contentTypeId) report(diagnostics, 'invalid-screen-reference', `La consulta ${query.id} no corresponde al tipo de la pantalla.`, ['backendScreens', screenId, 'queryId'])
    if (screen.contentTypeId && form?.contentTypeId && form.contentTypeId !== screen.contentTypeId) report(diagnostics, 'invalid-screen-reference', `El formulario ${form.id} no corresponde al tipo de la pantalla.`, ['backendScreens', screenId, 'formId'])
    for (const roleId of screen.allowedRoleIds) {
      if (!cms.roles[roleId]) report(diagnostics, 'invalid-screen-reference', `El rol ${roleId} no existe.`, ['backendScreens', screenId, 'allowedRoleIds'])
    }
  }
}

function validateMenu(menuId: string, menu: Menu, cms: CmsBackend, diagnostics: DiagnosticSink): void {
  const parentCounts = new Map<string, number>()
  for (const [itemKey, item] of Object.entries(menu.items)) {
    if (item.id !== itemKey) report(diagnostics, 'invalid-menu-item', `La clave ${itemKey} no coincide con el ID del ítem.`, ['menus', menuId, 'items', itemKey, 'id'])
    if (item.kind === 'screen' && (!item.screenId || !cms.backendScreens[item.screenId])) report(diagnostics, 'invalid-menu-item', `El ítem ${itemKey} requiere una pantalla existente.`, ['menus', menuId, 'items', itemKey, 'screenId'])
    for (const roleId of item.allowedRoleIds) {
      if (!cms.roles[roleId]) report(diagnostics, 'invalid-menu-item', `El rol ${roleId} no existe.`, ['menus', menuId, 'items', itemKey, 'allowedRoleIds'])
    }
    for (const childId of item.childIds) {
      if (!menu.items[childId]) report(diagnostics, 'invalid-menu-item', `El ítem hijo ${childId} no existe.`, ['menus', menuId, 'items', itemKey, 'childIds'])
      else parentCounts.set(childId, (parentCounts.get(childId) ?? 0) + 1)
    }
  }
  for (const rootId of menu.rootItemIds) {
    if (!menu.items[rootId]) report(diagnostics, 'invalid-menu-item', `El ítem raíz ${rootId} no existe.`, ['menus', menuId, 'rootItemIds'])
    else parentCounts.set(rootId, (parentCounts.get(rootId) ?? 0) + 1)
  }
  for (const itemId of Object.keys(menu.items)) {
    if ((parentCounts.get(itemId) ?? 0) !== 1) report(diagnostics, 'invalid-menu-item', `El ítem ${itemId} debe ocupar exactamente una posición.`, ['menus', menuId, 'items', itemId])
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visit(itemId: string): void {
    if (visiting.has(itemId)) {
      report(diagnostics, 'menu-cycle', `El menú contiene un ciclo en ${itemId}.`, ['menus', menuId, 'items', itemId])
      return
    }
    if (visited.has(itemId)) return
    visiting.add(itemId)
    for (const childId of entityById(menu.items, itemId)?.childIds ?? []) visit(childId)
    visiting.delete(itemId)
    visited.add(itemId)
  }
  for (const itemId of Object.keys(menu.items)) visit(itemId)
}

export function validateCmsBackend(input: unknown): Result<CmsBackend, readonly CmsDiagnostic[]> {
  const parsed = CmsBackendSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => ({
      code: 'schema-invalid' as const,
      message: issue.message,
      path: issue.path.map((segment) => typeof segment === 'symbol' ? (segment.description ?? segment.toString()) : segment),
    })))
  }

  const cms = parsed.data
  const diagnostics: CmsDiagnostic[] = []
  validateNormalizedKeys(cms, diagnostics)
  validateContentModel(cms, diagnostics)
  validateFields(cms, diagnostics)
  validateRecordsAndTerms(cms, diagnostics)
  validateRelations(cms, diagnostics)
  validateQueriesAndForms(cms, diagnostics)
  validateAccessAndScreens(cms, diagnostics)
  for (const [menuId, menu] of Object.entries(cms.menus)) validateMenu(menuId, menu, cms, diagnostics)
  return diagnostics.length > 0 ? failure(diagnostics) : success(cms)
}
