import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { ContentTypeSchema, type CmsBackend, type ContentType } from './cms-schema'
import type { ContentTypeId } from './identity'
import type { ProjectStructure } from './structure-schema'
import { validateCmsBackend } from './validate-cms'
import { validateProjectStructure } from './validate-structure'

export type ContentTypeDiagnosticCode =
  | 'content-type-not-found'
  | 'content-type-id-conflict'
  | 'content-type-slug-conflict'
  | 'content-type-in-use'
  | 'invalid-content-type'
  | 'invalid-single-template'
  | 'invalid-archive-template'
  | 'invalid-cms'
  | 'invalid-project'

export interface ContentTypeDiagnostic {
  readonly code: ContentTypeDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type ContentTypeEditablePatch = Partial<Pick<ContentType,
  | 'slug'
  | 'singularName'
  | 'pluralName'
  | 'description'
  | 'icon'
  | 'capabilities'
  | 'supports'
  | 'public'
  | 'showInMenu'
  | 'order'
  | 'singleTemplateId'
  | 'archiveTemplateId'
>>

function diagnostic(
  code: ContentTypeDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): ContentTypeDiagnostic {
  return { code, message, path }
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function normalizeContentType(contentType: ContentType): ContentType {
  return {
    ...structuredClone(contentType),
    capabilities: uniqueStrings(contentType.capabilities),
    supports: uniqueStrings(contentType.supports),
  }
}

function validateTemplateReferences(
  structure: ProjectStructure,
  contentType: ContentType,
): readonly ContentTypeDiagnostic[] {
  const diagnostics: ContentTypeDiagnostic[] = []
  if (contentType.singleTemplateId) {
    const document = structure.documents[contentType.singleTemplateId]
    if (!document || (document.kind !== 'single' && document.kind !== 'template')) {
      diagnostics.push(diagnostic(
        'invalid-single-template',
        'La plantilla single debe apuntar a un documento Single o Template existente.',
        ['cms', 'contentTypes', contentType.id, 'singleTemplateId'],
      ))
    }
  }
  if (contentType.archiveTemplateId) {
    const document = structure.documents[contentType.archiveTemplateId]
    if (!document || (document.kind !== 'archive' && document.kind !== 'template')) {
      diagnostics.push(diagnostic(
        'invalid-archive-template',
        'La plantilla archive debe apuntar a un documento Archive o Template existente.',
        ['cms', 'contentTypes', contentType.id, 'archiveTemplateId'],
      ))
    }
  }
  return diagnostics
}

function slugOwner(cms: CmsBackend, slug: string, ignoredId?: ContentTypeId): ContentType | undefined {
  return Object.values(cms.contentTypes).find((contentType) => (
    contentType.slug === slug && contentType.id !== ignoredId
  ))
}

function validateCandidate(
  structure: ProjectStructure,
  cms: CmsBackend,
  contentType: ContentType,
): Result<ProjectStructure, readonly ContentTypeDiagnostic[]> {
  const templateDiagnostics = validateTemplateReferences(structure, contentType)
  if (templateDiagnostics.length > 0) return failure(templateDiagnostics)

  const cmsValidation = validateCmsBackend(cms)
  if (!cmsValidation.ok) {
    return failure(cmsValidation.error.map((issue) => diagnostic(
      'invalid-cms',
      issue.message,
      ['cms', ...issue.path],
    )))
  }

  const candidate: ProjectStructure = {
    ...structuredClone(structure),
    cms: cmsValidation.value,
  }
  const validated = validateProjectStructure(candidate)
  if (!validated.ok) {
    return failure(validated.error.map((issue) => diagnostic(
      'invalid-project',
      issue.message,
      issue.path,
    )))
  }
  return success(validated.value)
}

export function listContentTypes(structure: ProjectStructure): readonly ContentType[] {
  const cms = projectCmsBackend(structure.cms)
  return Object.values(cms.contentTypes).sort((left, right) => (
    left.order - right.order
    || left.pluralName.localeCompare(right.pluralName, 'es')
    || left.id.localeCompare(right.id)
  ))
}

export function createContentType(
  structure: ProjectStructure,
  input: ContentType,
): Result<ProjectStructure, readonly ContentTypeDiagnostic[]> {
  const parsed = ContentTypeSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-content-type',
      issue.message,
      ['cms', 'contentTypes', input.id, ...issue.path.map(String)],
    )))
  }

  const contentType = normalizeContentType(parsed.data)
  const cms = projectCmsBackend(structure.cms)
  if (cms.contentTypes[contentType.id]) {
    return failure([diagnostic(
      'content-type-id-conflict',
      'Ya existe un tipo de contenido con ese ID.',
      ['cms', 'contentTypes', contentType.id],
    )])
  }
  const existingSlug = slugOwner(cms, contentType.slug)
  if (existingSlug) {
    return failure([diagnostic(
      'content-type-slug-conflict',
      `El slug ${contentType.slug} ya pertenece a ${existingSlug.pluralName}.`,
      ['cms', 'contentTypes', contentType.id, 'slug'],
    )])
  }

  cms.contentTypes[contentType.id] = contentType
  return validateCandidate(structure, cms, contentType)
}

export function updateContentType(
  structure: ProjectStructure,
  contentTypeId: ContentTypeId,
  patch: ContentTypeEditablePatch,
): Result<ProjectStructure, readonly ContentTypeDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.contentTypes[contentTypeId]
  if (!current) {
    return failure([diagnostic(
      'content-type-not-found',
      'El tipo de contenido ya no existe.',
      ['cms', 'contentTypes', contentTypeId],
    )])
  }

  const parsed = ContentTypeSchema.safeParse({
    ...current,
    ...structuredClone(patch),
    id: contentTypeId,
    fieldIds: current.fieldIds,
    taxonomyIds: current.taxonomyIds,
  })
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-content-type',
      issue.message,
      ['cms', 'contentTypes', contentTypeId, ...issue.path.map(String)],
    )))
  }

  const contentType = normalizeContentType(parsed.data)
  const existingSlug = slugOwner(cms, contentType.slug, contentTypeId)
  if (existingSlug) {
    return failure([diagnostic(
      'content-type-slug-conflict',
      `El slug ${contentType.slug} ya pertenece a ${existingSlug.pluralName}.`,
      ['cms', 'contentTypes', contentTypeId, 'slug'],
    )])
  }
  cms.contentTypes[contentTypeId] = contentType
  return validateCandidate(structure, cms, contentType)
}

function contentTypeDependencies(cms: CmsBackend, contentTypeId: ContentTypeId): string[] {
  const dependencies: string[] = []
  const contentType = cms.contentTypes[contentTypeId]
  if (!contentType) return dependencies
  if (contentType.fieldIds.length > 0) dependencies.push('campos asociados')
  if (contentType.taxonomyIds.length > 0) dependencies.push('taxonomías asociadas')
  if (Object.values(cms.fields).some((field) => (
    field.owner.kind === 'content-type' && field.owner.contentTypeId === contentTypeId
  ))) dependencies.push('definiciones de campo')
  if (Object.values(cms.records).some((record) => record.contentTypeId === contentTypeId)) dependencies.push('registros')
  if (Object.values(cms.taxonomies).some((taxonomy) => taxonomy.contentTypeIds.includes(contentTypeId))) dependencies.push('taxonomías')
  if (Object.values(cms.relations).some((relation) => (
    relation.sourceContentTypeId === contentTypeId || relation.targetContentTypeId === contentTypeId
  ))) dependencies.push('relaciones')
  if (Object.values(cms.queries).some((query) => query.contentTypeId === contentTypeId)) dependencies.push('consultas')
  if (Object.values(cms.forms).some((form) => form.contentTypeId === contentTypeId)) dependencies.push('formularios')
  if (Object.values(cms.backendScreens).some((screen) => screen.contentTypeId === contentTypeId)) dependencies.push('pantallas de backend')
  if (Object.values(cms.roles).some((role) => Object.hasOwn(role.contentTypes, contentTypeId))) dependencies.push('permisos de rol')
  return [...new Set(dependencies)]
}

export function deleteContentType(
  structure: ProjectStructure,
  contentTypeId: ContentTypeId,
): Result<ProjectStructure, readonly ContentTypeDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.contentTypes[contentTypeId]
  if (!current) {
    return failure([diagnostic(
      'content-type-not-found',
      'El tipo de contenido ya no existe.',
      ['cms', 'contentTypes', contentTypeId],
    )])
  }

  const dependencies = contentTypeDependencies(cms, contentTypeId)
  if (dependencies.length > 0) {
    return failure([diagnostic(
      'content-type-in-use',
      `No se puede eliminar ${current.pluralName}: existen ${dependencies.join(', ')}.`,
      ['cms', 'contentTypes', contentTypeId],
    )])
  }

  delete cms.contentTypes[contentTypeId]
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
  return validated.ok
    ? success(validated.value)
    : failure(validated.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
}
