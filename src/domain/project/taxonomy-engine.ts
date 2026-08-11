import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import {
  TaxonomySchema,
  TaxonomyTermSchema,
  type CmsBackend,
  type Taxonomy,
  type TaxonomyTerm,
} from './cms-schema'
import type { ContentTypeId, DocumentId, TaxonomyId, TaxonomyTermId } from './identity'
import type { ProjectStructure, TemplateCondition } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type TaxonomyDiagnosticCode =
  | 'taxonomy-not-found'
  | 'taxonomy-id-conflict'
  | 'taxonomy-slug-conflict'
  | 'taxonomy-in-use'
  | 'missing-content-type'
  | 'invalid-taxonomy'
  | 'invalid-archive-template'
  | 'term-not-found'
  | 'term-id-conflict'
  | 'term-slug-conflict'
  | 'term-parent-forbidden'
  | 'term-parent-invalid'
  | 'term-cycle'
  | 'term-in-use'
  | 'invalid-term'
  | 'invalid-cms'
  | 'invalid-project'

export interface TaxonomyDiagnostic {
  readonly code: TaxonomyDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type TaxonomyEditablePatch = Partial<Pick<Taxonomy,
  | 'slug'
  | 'singularName'
  | 'pluralName'
  | 'hierarchical'
  | 'public'
  | 'contentTypeIds'
  | 'order'
>>

export type TaxonomyTermEditablePatch = Partial<Pick<TaxonomyTerm,
  | 'name'
  | 'slug'
  | 'parentId'
>>

export interface TaxonomyMutationInput {
  readonly archiveTemplateId?: DocumentId | null
  readonly taxonomy: Taxonomy
}

export interface TaxonomyUpdateInput {
  readonly archiveTemplateId?: DocumentId | null
  readonly patch: TaxonomyEditablePatch
}

export interface TaxonomyListItem {
  readonly archiveTemplateId: DocumentId | null
  readonly taxonomy: Taxonomy
}

function diagnostic(
  code: TaxonomyDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): TaxonomyDiagnostic {
  return { code, message, path }
}

function archiveBindingKey(taxonomyId: TaxonomyId): string {
  return `taxonomy:${taxonomyId}`
}

function normalizeTaxonomy(taxonomy: Taxonomy): Taxonomy {
  return {
    ...structuredClone(taxonomy),
    contentTypeIds: [...new Set(taxonomy.contentTypeIds)],
    fieldIds: [...new Set(taxonomy.fieldIds)],
  }
}

function taxonomySlugOwner(cms: CmsBackend, slug: string, ignoredId?: TaxonomyId): Taxonomy | undefined {
  return Object.values(cms.taxonomies).find((taxonomy) => (
    taxonomy.slug === slug && taxonomy.id !== ignoredId
  ))
}

function termSlugOwner(
  cms: CmsBackend,
  taxonomyId: TaxonomyId,
  slug: string,
  ignoredId?: TaxonomyTermId,
): TaxonomyTerm | undefined {
  return Object.values(cms.taxonomyTerms).find((term) => (
    term.taxonomyId === taxonomyId && term.slug === slug && term.id !== ignoredId
  ))
}

function validateAssociations(
  cms: CmsBackend,
  taxonomy: Taxonomy,
): readonly TaxonomyDiagnostic[] {
  const diagnostics: TaxonomyDiagnostic[] = []
  for (const contentTypeId of taxonomy.contentTypeIds) {
    if (!cms.contentTypes[contentTypeId]) {
      diagnostics.push(diagnostic(
        'missing-content-type',
        `El CPT asociado ${contentTypeId} no existe.`,
        ['cms', 'taxonomies', taxonomy.id, 'contentTypeIds'],
      ))
    }
  }
  return diagnostics
}

function synchronizeContentTypeAssociations(
  cms: CmsBackend,
  taxonomyId: TaxonomyId,
  nextContentTypeIds: readonly ContentTypeId[],
): void {
  const selected = new Set(nextContentTypeIds)
  for (const contentType of Object.values(cms.contentTypes)) {
    const hasTaxonomy = contentType.taxonomyIds.includes(taxonomyId)
    if (selected.has(contentType.id) && !hasTaxonomy) {
      contentType.taxonomyIds = [...contentType.taxonomyIds, taxonomyId]
    } else if (!selected.has(contentType.id) && hasTaxonomy) {
      contentType.taxonomyIds = contentType.taxonomyIds.filter((id) => id !== taxonomyId)
    }
  }
}

function resolveArchiveTemplateId(
  structure: ProjectStructure,
  taxonomyId: TaxonomyId,
): DocumentId | null {
  const key = archiveBindingKey(taxonomyId)
  const match = Object.values(structure.documents)
    .filter((document) => document.kind === 'archive' || document.kind === 'template')
    .sort((left, right) => left.id.localeCompare(right.id))
    .find((document) => document.conditions.some((condition) => (
      condition.target === 'archive' && condition.contentType === key
    )))
  return match?.id ?? null
}

function applyArchiveTemplateBinding(
  structure: ProjectStructure,
  taxonomyId: TaxonomyId,
  archiveTemplateId: DocumentId | null | undefined,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  if (archiveTemplateId === undefined) return success(structuredClone(structure))
  const candidate = structuredClone(structure)
  const key = archiveBindingKey(taxonomyId)
  for (const document of Object.values(candidate.documents)) {
    document.conditions = document.conditions.filter((condition) => !(
      condition.target === 'archive' && condition.contentType === key
    ))
  }
  if (archiveTemplateId === null) return success(candidate)
  const document = candidate.documents[archiveTemplateId]
  if (!document || (document.kind !== 'archive' && document.kind !== 'template')) {
    return failure([diagnostic(
      'invalid-archive-template',
      'La plantilla de archivo de taxonomía debe apuntar a Archive o Template.',
      ['documents', archiveTemplateId],
    )])
  }
  const condition: TemplateCondition = {
    contentType: key,
    priority: 0,
    target: 'archive',
  }
  document.conditions = [...document.conditions, condition]
  return success(candidate)
}

function validateCandidate(
  structure: ProjectStructure,
  cms: CmsBackend,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic(
      'invalid-cms',
      issue.message,
      ['cms', ...issue.path],
    )))
  }
  const candidate: ProjectStructure = { ...structuredClone(structure), cms: cmsValidation.value }
  const validated = validateProjectStructure(candidate)
  if (!validated.ok) {
    return failure(validated.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
  }
  return success(validated.value)
}

export function listTaxonomies(structure: ProjectStructure): readonly TaxonomyListItem[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.taxonomies)
    .sort((left, right) => (
      left.order - right.order
      || left.pluralName.localeCompare(right.pluralName, 'es')
      || left.id.localeCompare(right.id)
    ))
    .map((taxonomy) => ({
      archiveTemplateId: resolveArchiveTemplateId(structure, taxonomy.id),
      taxonomy,
    }))
}

export function createTaxonomy(
  structure: ProjectStructure,
  input: TaxonomyMutationInput,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const parsed = TaxonomySchema.safeParse(input.taxonomy)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-taxonomy',
      issue.message,
      ['cms', 'taxonomies', input.taxonomy.id, ...issue.path.map(String)],
    )))
  }
  const taxonomy = normalizeTaxonomy(parsed.data)
  const cms = projectCmsBackend(structure.cms)
  if (cms.taxonomies[taxonomy.id]) {
    return failure([diagnostic('taxonomy-id-conflict', 'Ya existe una taxonomía con ese ID.', ['cms', 'taxonomies', taxonomy.id])])
  }
  const slugOwner = taxonomySlugOwner(cms, taxonomy.slug)
  if (slugOwner) {
    return failure([diagnostic(
      'taxonomy-slug-conflict',
      `El slug ${taxonomy.slug} ya pertenece a ${slugOwner.pluralName}.`,
      ['cms', 'taxonomies', taxonomy.id, 'slug'],
    )])
  }
  const associationDiagnostics = validateAssociations(cms, taxonomy)
  if (associationDiagnostics.length > 0) return failure(associationDiagnostics)

  cms.taxonomies[taxonomy.id] = taxonomy
  synchronizeContentTypeAssociations(cms, taxonomy.id, taxonomy.contentTypeIds)
  const withCms = validateCandidate(structure, cms)
  if (!withCms.ok) return withCms
  const withArchive = applyArchiveTemplateBinding(withCms.value, taxonomy.id, input.archiveTemplateId ?? null)
  if (!withArchive.ok) return withArchive
  return validateCandidate(withArchive.value, projectCmsBackend(withArchive.value.cms))
}

export function updateTaxonomy(
  structure: ProjectStructure,
  taxonomyId: TaxonomyId,
  input: TaxonomyUpdateInput,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.taxonomies[taxonomyId]
  if (!current) {
    return failure([diagnostic('taxonomy-not-found', 'La taxonomía ya no existe.', ['cms', 'taxonomies', taxonomyId])])
  }
  const parsed = TaxonomySchema.safeParse({
    ...current,
    ...structuredClone(input.patch),
    id: taxonomyId,
    fieldIds: current.fieldIds,
  })
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-taxonomy',
      issue.message,
      ['cms', 'taxonomies', taxonomyId, ...issue.path.map(String)],
    )))
  }
  const taxonomy = normalizeTaxonomy(parsed.data)
  const slugOwner = taxonomySlugOwner(cms, taxonomy.slug, taxonomyId)
  if (slugOwner) {
    return failure([diagnostic(
      'taxonomy-slug-conflict',
      `El slug ${taxonomy.slug} ya pertenece a ${slugOwner.pluralName}.`,
      ['cms', 'taxonomies', taxonomyId, 'slug'],
    )])
  }
  const associations = validateAssociations(cms, taxonomy)
  if (associations.length > 0) return failure(associations)
  if (!taxonomy.hierarchical) {
    const child = Object.values(cms.taxonomyTerms).find((term) => (
      term.taxonomyId === taxonomyId && term.parentId !== null
    ))
    if (child) {
      return failure([diagnostic(
        'term-parent-forbidden',
        'No se puede convertir en no jerárquica mientras existan términos con padre.',
        ['cms', 'taxonomyTerms', child.id, 'parentId'],
      )])
    }
  }

  cms.taxonomies[taxonomyId] = taxonomy
  synchronizeContentTypeAssociations(cms, taxonomyId, taxonomy.contentTypeIds)
  const withCms = validateCandidate(structure, cms)
  if (!withCms.ok) return withCms
  const withArchive = applyArchiveTemplateBinding(withCms.value, taxonomyId, input.archiveTemplateId)
  if (!withArchive.ok) return withArchive
  return validateCandidate(withArchive.value, projectCmsBackend(withArchive.value.cms))
}

function taxonomyDependencies(cms: CmsBackend, taxonomyId: TaxonomyId): readonly string[] {
  const taxonomy = cms.taxonomies[taxonomyId]
  if (!taxonomy) return []
  const dependencies: string[] = []
  if (taxonomy.fieldIds.length > 0) dependencies.push('campos de término')
  if (Object.values(cms.taxonomyTerms).some((term) => term.taxonomyId === taxonomyId)) dependencies.push('términos')
  if (Object.values(cms.fields).some((field) => (
    field.owner.kind === 'taxonomy' && field.owner.taxonomyId === taxonomyId
  ))) dependencies.push('definiciones de campo')
  return [...new Set(dependencies)]
}

export function deleteTaxonomy(
  structure: ProjectStructure,
  taxonomyId: TaxonomyId,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.taxonomies[taxonomyId]
  if (!current) {
    return failure([diagnostic('taxonomy-not-found', 'La taxonomía ya no existe.', ['cms', 'taxonomies', taxonomyId])])
  }
  const dependencies = taxonomyDependencies(cms, taxonomyId)
  if (dependencies.length > 0) {
    return failure([diagnostic(
      'taxonomy-in-use',
      `No se puede eliminar ${current.pluralName}: existen ${dependencies.join(', ')}.`,
      ['cms', 'taxonomies', taxonomyId],
    )])
  }
  delete cms.taxonomies[taxonomyId]
  synchronizeContentTypeAssociations(cms, taxonomyId, [])
  const withCms = validateCandidate(structure, cms)
  if (!withCms.ok) return withCms
  const withoutArchive = applyArchiveTemplateBinding(withCms.value, taxonomyId, null)
  if (!withoutArchive.ok) return withoutArchive
  return validateCandidate(withoutArchive.value, projectCmsBackend(withoutArchive.value.cms))
}

export function listTaxonomyTerms(
  structure: ProjectStructure,
  taxonomyId: TaxonomyId,
): readonly TaxonomyTerm[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.taxonomyTerms)
    .filter((term) => term.taxonomyId === taxonomyId)
    .sort((left, right) => left.name.localeCompare(right.name, 'es') || left.id.localeCompare(right.id))
}

function validateTermParent(
  cms: CmsBackend,
  taxonomy: Taxonomy,
  termId: TaxonomyTermId,
  parentId: TaxonomyTermId | null,
): readonly TaxonomyDiagnostic[] {
  if (parentId === null) return []
  if (!taxonomy.hierarchical) {
    return [diagnostic(
      'term-parent-forbidden',
      'Una taxonomía no jerárquica no admite términos padre.',
      ['cms', 'taxonomyTerms', termId, 'parentId'],
    )]
  }
  const parent = cms.taxonomyTerms[parentId]
  if (!parent || parent.taxonomyId !== taxonomy.id) {
    return [diagnostic(
      'term-parent-invalid',
      'El término padre debe existir dentro de la misma taxonomía.',
      ['cms', 'taxonomyTerms', termId, 'parentId'],
    )]
  }
  let cursor: TaxonomyTerm | undefined = parent
  const visited = new Set<TaxonomyTermId>([termId])
  while (cursor) {
    if (visited.has(cursor.id)) {
      return [diagnostic(
        'term-cycle',
        'La jerarquía de términos produciría un ciclo.',
        ['cms', 'taxonomyTerms', termId, 'parentId'],
      )]
    }
    visited.add(cursor.id)
    cursor = cursor.parentId ? cms.taxonomyTerms[cursor.parentId] : undefined
  }
  return []
}

export function createTaxonomyTerm(
  structure: ProjectStructure,
  input: TaxonomyTerm,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const parsed = TaxonomyTermSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-term',
      issue.message,
      ['cms', 'taxonomyTerms', input.id, ...issue.path.map(String)],
    )))
  }
  const term = structuredClone(parsed.data)
  const cms = projectCmsBackend(structure.cms)
  const taxonomy = cms.taxonomies[term.taxonomyId]
  if (!taxonomy) {
    return failure([diagnostic('taxonomy-not-found', 'La taxonomía del término no existe.', ['cms', 'taxonomyTerms', term.id, 'taxonomyId'])])
  }
  if (cms.taxonomyTerms[term.id]) {
    return failure([diagnostic('term-id-conflict', 'Ya existe un término con ese ID.', ['cms', 'taxonomyTerms', term.id])])
  }
  const slugOwner = termSlugOwner(cms, term.taxonomyId, term.slug)
  if (slugOwner) {
    return failure([diagnostic(
      'term-slug-conflict',
      `El slug ${term.slug} ya existe dentro de ${taxonomy.pluralName}.`,
      ['cms', 'taxonomyTerms', term.id, 'slug'],
    )])
  }
  const parentDiagnostics = validateTermParent(cms, taxonomy, term.id, term.parentId)
  if (parentDiagnostics.length > 0) return failure(parentDiagnostics)
  cms.taxonomyTerms[term.id] = term
  return validateCandidate(structure, cms)
}

export function updateTaxonomyTerm(
  structure: ProjectStructure,
  termId: TaxonomyTermId,
  patch: TaxonomyTermEditablePatch,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.taxonomyTerms[termId]
  if (!current) {
    return failure([diagnostic('term-not-found', 'El término ya no existe.', ['cms', 'taxonomyTerms', termId])])
  }
  const taxonomy = cms.taxonomies[current.taxonomyId]
  if (!taxonomy) {
    return failure([diagnostic('taxonomy-not-found', 'La taxonomía del término ya no existe.', ['cms', 'taxonomyTerms', termId, 'taxonomyId'])])
  }
  const parsed = TaxonomyTermSchema.safeParse({ ...current, ...structuredClone(patch), id: termId, taxonomyId: current.taxonomyId, values: current.values })
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-term',
      issue.message,
      ['cms', 'taxonomyTerms', termId, ...issue.path.map(String)],
    )))
  }
  const term = structuredClone(parsed.data)
  const slugOwner = termSlugOwner(cms, current.taxonomyId, term.slug, termId)
  if (slugOwner) {
    return failure([diagnostic(
      'term-slug-conflict',
      `El slug ${term.slug} ya existe dentro de ${taxonomy.pluralName}.`,
      ['cms', 'taxonomyTerms', termId, 'slug'],
    )])
  }
  const parentDiagnostics = validateTermParent(cms, taxonomy, termId, term.parentId)
  if (parentDiagnostics.length > 0) return failure(parentDiagnostics)
  cms.taxonomyTerms[termId] = term
  return validateCandidate(structure, cms)
}

export function deleteTaxonomyTerm(
  structure: ProjectStructure,
  termId: TaxonomyTermId,
): Result<ProjectStructure, readonly TaxonomyDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.taxonomyTerms[termId]
  if (!current) {
    return failure([diagnostic('term-not-found', 'El término ya no existe.', ['cms', 'taxonomyTerms', termId])])
  }
  if (Object.values(cms.taxonomyTerms).some((term) => term.parentId === termId)) {
    return failure([diagnostic('term-in-use', 'No se puede eliminar un término que todavía tiene hijos.', ['cms', 'taxonomyTerms', termId])])
  }
  if (Object.values(cms.records).some((record) => record.taxonomyTermIds.includes(termId))) {
    return failure([diagnostic('term-in-use', 'No se puede eliminar un término usado por registros.', ['cms', 'taxonomyTerms', termId])])
  }
  if (Object.values(cms.queries).some((query) => query.taxonomyTermIds.includes(termId))) {
    return failure([diagnostic('term-in-use', 'No se puede eliminar un término usado por consultas.', ['cms', 'taxonomyTerms', termId])])
  }
  delete cms.taxonomyTerms[termId]
  return validateCandidate(structure, cms)
}
