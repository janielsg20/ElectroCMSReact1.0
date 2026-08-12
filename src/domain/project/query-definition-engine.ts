import { failure, success, type Result } from '../common/result'
import { projectCmsBackend } from './cms-defaults'
import { QuerySchema, type Query } from './cms-schema'
import type { QueryId } from './identity'
import { validateQueryDefinition, type QueryEngineDiagnostic } from './query-engine'
import type { JsonValue } from './project-envelope'
import type { ProjectStructure } from './structure-schema'
import { validateProjectStructure } from './validate-structure'

export type QueryDefinitionDiagnosticCode =
  | 'query-not-found'
  | 'query-id-conflict'
  | 'query-name-conflict'
  | 'query-in-use'
  | 'invalid-query'
  | 'invalid-project'

export interface QueryDefinitionDiagnostic {
  readonly code: QueryDefinitionDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export type QueryEditablePatch = Partial<Pick<Query,
  'name' | 'contentTypeId' | 'groups' | 'sorts' | 'limit' | 'offset' | 'pageSize'
>>

function diagnostic(
  code: QueryDefinitionDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): QueryDefinitionDiagnostic {
  return { code, message, path }
}

function fromQueryDiagnostics(issues: readonly QueryEngineDiagnostic[]): QueryDefinitionDiagnostic[] {
  return issues.map((issue) => diagnostic('invalid-query', issue.message, issue.path))
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

function nameOwner(structure: ProjectStructure, name: string, ignoredId?: QueryId): Query | undefined {
  const normalized = normalizeName(name)
  return Object.values(projectCmsBackend(structure.cms).queries).find((query) => (
    query.id !== ignoredId && normalizeName(query.name) === normalized
  ))
}

function containsString(value: JsonValue | undefined, expected: string): boolean {
  if (value === expected) return true
  if (Array.isArray(value)) return value.some((entry) => containsString(entry, expected))
  if (value && typeof value === 'object') return Object.values(value).some((entry) => containsString(entry, expected))
  return false
}

function queryNodeDependencies(structure: ProjectStructure, queryId: QueryId): string[] {
  const dependencies: string[] = []
  for (const document of Object.values(structure.documents)) {
    for (const node of Object.values(document.nodes)) {
      if (containsString(node.properties, queryId) || containsString(node.bindings, queryId)) {
        dependencies.push(`${document.name} / ${node.name}`)
      }
    }
  }
  for (const component of Object.values(structure.globalComponents)) {
    for (const node of Object.values(component.nodes)) {
      if (containsString(node.properties, queryId) || containsString(node.bindings, queryId)) {
        dependencies.push(`${component.name} / ${node.name}`)
      }
    }
  }
  return dependencies
}

function validateCandidate(
  structure: ProjectStructure,
  query: Query,
): Result<ProjectStructure, readonly QueryDefinitionDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  cms.queries[query.id] = structuredClone(query)
  const validatedQuery = validateQueryDefinition(cms, query)
  if (!validatedQuery.ok) return failure(fromQueryDiagnostics(validatedQuery.error))

  const candidate = validateProjectStructure({ ...structuredClone(structure), cms })
  if (!candidate.ok) {
    return failure(candidate.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
  }
  return success(candidate.value)
}

export function listSavedQueries(structure: ProjectStructure): readonly Query[] {
  return Object.values(projectCmsBackend(structure.cms).queries)
    .sort((left, right) => left.name === right.name ? (left.id < right.id ? -1 : left.id > right.id ? 1 : 0) : left.name < right.name ? -1 : 1)
}

export function createSavedQuery(
  structure: ProjectStructure,
  input: Query,
): Result<ProjectStructure, readonly QueryDefinitionDiagnostic[]> {
  const parsed = QuerySchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic('invalid-query', issue.message, ['cms', 'queries', input.id, ...issue.path.map(String)])))
  }
  const cms = projectCmsBackend(structure.cms)
  if (cms.queries[parsed.data.id]) return failure([diagnostic('query-id-conflict', 'Ya existe una consulta con ese ID.', ['cms', 'queries', parsed.data.id])])
  const owner = nameOwner(structure, parsed.data.name)
  if (owner) return failure([diagnostic('query-name-conflict', `Ya existe una consulta llamada ${owner.name}.`, ['cms', 'queries', parsed.data.id, 'name'])])
  return validateCandidate(structure, parsed.data)
}

export function updateSavedQuery(
  structure: ProjectStructure,
  queryId: QueryId,
  patch: QueryEditablePatch,
): Result<ProjectStructure, readonly QueryDefinitionDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  const current = cms.queries[queryId]
  if (!current) return failure([diagnostic('query-not-found', 'La consulta ya no existe.', ['cms', 'queries', queryId])])

  const parsed = QuerySchema.safeParse({ ...current, ...structuredClone(patch), id: queryId })
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic('invalid-query', issue.message, ['cms', 'queries', queryId, ...issue.path.map(String)])))
  }
  const owner = nameOwner(structure, parsed.data.name, queryId)
  if (owner) return failure([diagnostic('query-name-conflict', `Ya existe una consulta llamada ${owner.name}.`, ['cms', 'queries', queryId, 'name'])])
  return validateCandidate(structure, parsed.data)
}

export function deleteSavedQuery(
  structure: ProjectStructure,
  queryId: QueryId,
): Result<ProjectStructure, readonly QueryDefinitionDiagnostic[]> {
  const cms = projectCmsBackend(structure.cms)
  if (!cms.queries[queryId]) return failure([diagnostic('query-not-found', 'La consulta ya no existe.', ['cms', 'queries', queryId])])

  const dependencies = queryNodeDependencies(structure, queryId)
  if (dependencies.length > 0) {
    return failure([diagnostic(
      'query-in-use',
      `La consulta está vinculada a ${dependencies.slice(0, 3).join(', ')}${dependencies.length > 3 ? '…' : ''}.`,
      ['cms', 'queries', queryId],
    )])
  }

  delete cms.queries[queryId]
  const candidate = validateProjectStructure({ ...structuredClone(structure), cms })
  if (!candidate.ok) return failure(candidate.error.map((issue) => diagnostic('invalid-project', issue.message, issue.path)))
  return success(candidate.value)
}
