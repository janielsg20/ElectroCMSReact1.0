import type { CmsBackend, CmsListingDiagnostic, CmsListingPageRequest, CmsListingResult, Query } from '../../domain'
import { failure, success, type Result } from '../../domain/common/result'
import { buildCmsQueryIndex } from '../../domain/project/query-index'
import { executeCmsListingQuery } from '../../domain/project/listing-engine'

export interface ListingRuntimePerformance {
  readonly cacheHit: boolean
  readonly candidateRecords: number
  readonly executionMs: number
  readonly indexBuildMs: number
  readonly indexUsed: boolean
  readonly sourceRecords: number
}

export interface ListingRuntimeCacheResult {
  readonly listing: CmsListingResult
  readonly performance: ListingRuntimePerformance
}

interface CachedEntry {
  readonly listing: CmsListingResult
}

interface CmsCacheState {
  readonly entries: Map<string, CachedEntry>
  readonly index: ReturnType<typeof buildCmsQueryIndex>
  readonly indexBuildMs: number
}

export interface ListingRuntimeCacheOptions {
  readonly maxEntries?: number
  readonly now?: () => number
}

function stableKey(query: Query, request: CmsListingPageRequest): string {
  return JSON.stringify({ page: request.page ?? 1, pageSize: request.pageSize ?? query.pageSize, query })
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * Caché LRU efímera por identidad de `CmsBackend`. El backend canónico sigue
 * siendo la única fuente de verdad: cuando ProjectStructure entrega una nueva
 * referencia CMS, índice y resultados se reconstruyen automáticamente.
 */
export class CmsListingRuntimeCache {
  private readonly states = new WeakMap<CmsBackend, CmsCacheState>()
  private readonly maxEntries: number
  private readonly now: () => number

  constructor(options: ListingRuntimeCacheOptions = {}) {
    this.maxEntries = Math.max(1, Math.trunc(options.maxEntries ?? 64))
    this.now = options.now ?? defaultNow
  }

  execute(
    cms: CmsBackend,
    query: Query,
    request: CmsListingPageRequest = {},
  ): Result<ListingRuntimeCacheResult, readonly CmsListingDiagnostic[]> {
    const state = this.stateFor(cms)
    const key = stableKey(query, request)
    const started = this.now()
    const cached = state.entries.get(key)
    if (cached) {
      state.entries.delete(key)
      state.entries.set(key, cached)
      return success({
        listing: cached.listing,
        performance: {
          cacheHit: true,
          candidateRecords: cached.listing.metrics.candidateRecords,
          executionMs: Math.max(0, this.now() - started),
          indexBuildMs: state.indexBuildMs,
          indexUsed: cached.listing.metrics.indexUsed,
          sourceRecords: cached.listing.metrics.sourceRecords,
        },
      })
    }

    const executed = executeCmsListingQuery(cms, query, request, { index: state.index })
    if (!executed.ok) return failure(executed.error)
    state.entries.set(key, { listing: executed.value })
    while (state.entries.size > this.maxEntries) {
      const oldest = state.entries.keys().next().value
      if (oldest === undefined) break
      state.entries.delete(oldest)
    }
    return success({
      listing: executed.value,
      performance: {
        cacheHit: false,
        candidateRecords: executed.value.metrics.candidateRecords,
        executionMs: Math.max(0, this.now() - started),
        indexBuildMs: state.indexBuildMs,
        indexUsed: executed.value.metrics.indexUsed,
        sourceRecords: executed.value.metrics.sourceRecords,
      },
    })
  }

  private stateFor(cms: CmsBackend): CmsCacheState {
    const existing = this.states.get(cms)
    if (existing) return existing
    const started = this.now()
    const index = buildCmsQueryIndex(cms)
    const state: CmsCacheState = {
      entries: new Map(),
      index,
      indexBuildMs: Math.max(0, this.now() - started),
    }
    this.states.set(cms, state)
    return state
  }
}
