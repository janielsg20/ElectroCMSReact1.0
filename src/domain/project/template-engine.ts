import { failure, success, type Result } from '../common/result'
import type { DocumentId } from './identity'
import { DocumentSchema, type Document, type ProjectStructure, type TemplateCondition } from './structure-schema'
import { validateProjectStructure } from './validate-structure'

export type TemplateTarget = TemplateCondition['target']

export interface TemplateRuntimeContext {
  readonly contentType?: string
  readonly path: string
  readonly target: TemplateTarget
}

export interface TemplateComposition {
  readonly footer: Document | null
  readonly header: Document | null
  readonly main: Document | null
}

export type TemplateEngineErrorCode = 'document-not-found' | 'document-id-conflict' | 'invalid-document' | 'invalid-structure'

export interface TemplateEngineError {
  readonly code: TemplateEngineErrorCode
  readonly message: string
}

function invalid(message: string): Result<never, TemplateEngineError> {
  return failure({ code: 'invalid-document', message })
}

function validate(structure: ProjectStructure): Result<ProjectStructure, TemplateEngineError> {
  const result = validateProjectStructure(structure)
  if (result.ok) return success(result.value)
  return failure({ code: 'invalid-structure', message: result.error[0]?.message ?? 'La estructura de plantillas no es válida.' })
}

function matchesCondition(condition: TemplateCondition, context: TemplateRuntimeContext): boolean {
  if (condition.target !== context.target) return false
  if (condition.pathPrefix && !context.path.startsWith(condition.pathPrefix)) return false
  if (condition.contentType && condition.contentType !== context.contentType) return false
  return true
}

function specificity(condition: TemplateCondition): number {
  return (condition.pathPrefix?.length ?? 0) + (condition.contentType ? 500 : 0)
}

function candidateScore(document: Document, context: TemplateRuntimeContext): readonly [number, number, string] | null {
  const matches = document.conditions.filter((condition) => matchesCondition(condition, context))
  if (matches.length === 0) return null
  const best = [...matches].sort((left, right) => right.priority - left.priority || specificity(right) - specificity(left))[0]
  if (!best) return null
  return [best.priority, specificity(best), document.id]
}

function select(documents: readonly Document[], context: TemplateRuntimeContext): Document | null {
  return documents
    .map((document) => ({ document, score: candidateScore(document, context) }))
    .filter((entry): entry is { document: Document; score: readonly [number, number, string] } => entry.score !== null)
    .sort((left, right) => right.score[0] - left.score[0] || right.score[1] - left.score[1] || left.score[2].localeCompare(right.score[2]))[0]?.document ?? null
}

function pageForRoute(documents: readonly Document[], path: string): Document | null {
  return documents.filter((document) => document.kind === 'page' && document.routePath === path)
    .sort((left, right) => left.id.localeCompare(right.id))[0] ?? null
}

export function resolveTemplateComposition(structure: ProjectStructure, context: TemplateRuntimeContext): Result<TemplateComposition, TemplateEngineError> {
  const valid = validate(structure)
  if (!valid.ok) return valid
  const documents = Object.values(valid.value.documents)
  const main = context.target === 'page'
    ? pageForRoute(documents, context.path)
    : select(documents.filter((document) => document.kind === context.target || document.kind === 'template'), context)
  const shared = documents.filter((document) => document.kind === 'header' || document.kind === 'footer')
  return success({
    footer: select(shared.filter((document) => document.kind === 'footer'), context),
    header: select(shared.filter((document) => document.kind === 'header'), context),
    main: main ?? (context.target === 'not-found' ? select(documents.filter((document) => document.kind === 'not-found'), context) : null),
  })
}

export function addDocument(structure: ProjectStructure, document: Document): Result<ProjectStructure, TemplateEngineError> {
  if (structure.documents[document.id]) return failure({ code: 'document-id-conflict', message: 'Ya existe un documento con ese ID.' })
  const parsed = DocumentSchemaSafe(document)
  if (!parsed.ok) return parsed
  const next = structuredClone(structure)
  next.documents[document.id] = parsed.value
  return validate(next)
}

function DocumentSchemaSafe(document: Document): Result<Document, TemplateEngineError> {
  if (document.kind === 'page' && !document.routePath) return invalid('Una página debe declarar una ruta.')
  const parsed = DocumentSchema.safeParse(document)
  return parsed.success
    ? success(parsed.data)
    : invalid(parsed.error.issues[0]?.message ?? 'El documento no es válido.')
}

export function updateDocumentConditions(structure: ProjectStructure, documentId: DocumentId, conditions: readonly TemplateCondition[]): Result<ProjectStructure, TemplateEngineError> {
  const document = structure.documents[documentId]
  if (!document) return failure({ code: 'document-not-found', message: 'El documento no existe.' })
  if (document.kind === 'page') return invalid('Las páginas se resuelven por ruta y no admiten condiciones de plantilla.')
  const next = structuredClone(structure)
  next.documents[documentId] = { ...next.documents[documentId], conditions: structuredClone([...conditions]) }
  return validate(next)
}
