import { failure, success, type Result } from '../common/result'
import type { CmsBackend, ContentRecord, Query } from './cms-schema'
import { QueryIdSchema, type QueryId } from './identity'
import {
  executeCmsQuery,
  type QueryEngineDiagnostic,
  type QueryEngineDiagnosticCode,
  type QueryExecutionMetrics,
  type QueryExecutionOptions,
} from './query-engine'

export type CmsListingDiagnosticCode = QueryEngineDiagnosticCode | 'invalid-page' | 'invalid-page-size'

export interface CmsListingDiagnostic {
  readonly code: CmsListingDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export interface CmsListingPageRequest {
  readonly page?: number
  readonly pageSize?: number
}

export interface CmsListingRequest extends CmsListingPageRequest {
  readonly queryId: QueryId | string
}

export interface CmsListingResult {
  readonly availableCount: number
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly metrics: QueryExecutionMetrics
  readonly page: number
  readonly pageCount: number
  readonly pageSize: number
  readonly queryId: QueryId
  readonly records: readonly ContentRecord[]
  readonly totalMatched: number
}

function diagnostic(
  code: CmsListingDiagnosticCode,
  message: string,
  path: readonly (string | number)[],
): CmsListingDiagnostic {
  return { code, message, path }
}

function queryDiagnostics(items: readonly QueryEngineDiagnostic[]): readonly CmsListingDiagnostic[] {
  return items.map((item) => ({ code: item.code, message: item.message, path: item.path }))
}

/**
 * Ejecuta una página sobre una definición de query ya materializada. Esta variante
 * existe para runtimes transitorios (filtros, URL, preview) y nunca persiste la
 * definición recibida en `CmsBackend`.
 *
 * El Query Engine se ejecuta una sola vez. Su resultado ya contiene la ventana
 * canónica `offset/limit`; la paginación de presentación únicamente corta esa
 * ventana en memoria. Así se conserva exactamente la semántica del motor sin
 * repetir validación, filtrado, ordenamiento ni recorrido de candidatos.
 */
export function executeCmsListingQuery(
  cms: CmsBackend,
  query: Query,
  request: CmsListingPageRequest = {},
  options: QueryExecutionOptions = {},
): Result<CmsListingResult, readonly CmsListingDiagnostic[]> {
  const page = request.page ?? 1
  if (!Number.isInteger(page) || page < 1) {
    return failure([diagnostic('invalid-page', 'La página del listing debe ser un entero mayor o igual a 1.', ['listing', 'page'])])
  }

  const pageSize = request.pageSize ?? query.pageSize
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1_000) {
    return failure([diagnostic('invalid-page-size', 'El tamaño de página debe estar entre 1 y 1000.', ['listing', 'pageSize'])])
  }

  const executed = executeCmsQuery(cms, query, options)
  if (!executed.ok) return failure(queryDiagnostics(executed.error))

  const availableCount = Math.min(
    query.limit,
    Math.max(0, executed.value.totalMatched - query.offset),
  )
  const pageCount = availableCount === 0 ? 0 : Math.ceil(availableCount / pageSize)
  const relativeOffset = (page - 1) * pageSize
  const records = relativeOffset >= executed.value.records.length
    ? []
    : executed.value.records.slice(relativeOffset, relativeOffset + pageSize)

  return success({
    availableCount,
    hasNextPage: page < pageCount,
    hasPreviousPage: page > 1 && pageCount > 0,
    metrics: executed.value.metrics,
    page,
    pageCount,
    pageSize,
    queryId: query.id,
    records,
    totalMatched: executed.value.totalMatched,
  })
}

/**
 * Ejecuta una página de un listing guardado sin duplicar la semántica del motor
 * de queries. `Query.offset` y `Query.limit` definen la ventana base; page/pageSize
 * únicamente particionan esa ventana para presentación.
 */
export function executeCmsListing(
  cms: CmsBackend,
  request: CmsListingRequest,
  options: QueryExecutionOptions = {},
): Result<CmsListingResult, readonly CmsListingDiagnostic[]> {
  const parsedId = QueryIdSchema.safeParse(request.queryId)
  if (!parsedId.success) {
    return failure([diagnostic('query-not-found', 'El listing requiere un QueryId válido.', ['listing', 'queryId'])])
  }

  const query = cms.queries[parsedId.data]
  if (!query) {
    return failure([diagnostic('query-not-found', `La consulta ${parsedId.data} no existe.`, ['listing', 'queryId'])])
  }

  return executeCmsListingQuery(cms, query, request, options)
}
