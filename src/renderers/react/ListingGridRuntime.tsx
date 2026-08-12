import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  composeSmartFilteredQuery,
  type JsonValue,
} from '../../domain'
import { CmsListingRuntimeCache } from './listing-runtime-cache'
import { ListingRecordProvider } from './ListingRecordProvider'
import type { ProjectStructureRenderStore } from './project-structure-render-store'
import { useSmartFilterRuntimeStore } from './smart-filter-runtime-context'

export interface ListingGridRuntimeProps {
  readonly nodeId: string
  readonly properties: Readonly<Record<string, JsonValue>>
  readonly slots: Readonly<Record<string, readonly ReactNode[]>>
  readonly store: ProjectStructureRenderStore
}

const listingRuntimeCache = new CmsListingRuntimeCache({ maxEntries: 64 })

function textProperty(properties: Readonly<Record<string, JsonValue>>, key: string, fallback = ''): string {
  const value = properties[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
}

function numberProperty(properties: Readonly<Record<string, JsonValue>>, key: string, fallback: number): number {
  const value = properties[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function slotTemplate(slots: Readonly<Record<string, readonly ReactNode[]>>): readonly ReactNode[] {
  const content = slots.content
  if (content && content.length > 0) return content
  return Object.values(slots).flat()
}

function RuntimeState({ message, tone = 'neutral' }: { readonly message: string; readonly tone?: 'neutral' | 'danger' }) {
  const className = tone === 'danger'
    ? 'rounded-md border border-danger/40 bg-danger/10 p-4 text-xs text-danger'
    : 'rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground'
  return <div className={className} role={tone === 'danger' ? 'alert' : 'status'}>{message}</div>
}

export function ListingGridRuntime({ nodeId, properties, slots, store }: ListingGridRuntimeProps) {
  const queryId = textProperty(properties, 'queryId').trim()
  const columns = Math.max(1, Math.min(12, Math.trunc(numberProperty(properties, 'columns', 3))))
  const emptyMessage = textProperty(properties, 'emptyMessage', 'Sin resultados')
  const filterStore = useSmartFilterRuntimeStore()
  const subscribe = useCallback((listener: () => void) => store.subscribeStructure(listener), [store])
  const getCms = useCallback(() => store.structure.cms, [store])
  const cms = useSyncExternalStore(subscribe, getCms, getCms)
  const subscribeFilters = useCallback((listener: () => void) => filterStore.subscribe(queryId, listener), [filterStore, queryId])
  const getFilters = useCallback(() => filterStore.getSnapshot(queryId), [filterStore, queryId])
  const filterSnapshot = useSyncExternalStore(subscribeFilters, getFilters, getFilters)
  const template = slotTemplate(slots)
  const execution = useMemo(() => {
    if (!cms || !queryId) return null
    const composed = composeSmartFilteredQuery(cms, queryId, filterSnapshot.activeFilters)
    if (!composed.ok) return composed
    const pageSize = Math.min(1_000, composed.value.query.pageSize * filterSnapshot.loadMoreMultiplier)
    return listingRuntimeCache.execute(cms, composed.value.query, { page: filterSnapshot.page, pageSize })
  }, [cms, filterSnapshot.activeFilters, filterSnapshot.loadMoreMultiplier, filterSnapshot.page, queryId])

  useEffect(() => {
    if (!execution?.ok) return
    const result = execution.value.listing
    filterStore.setResultMeta(queryId, {
      count: result.totalMatched,
      hasNextPage: result.hasNextPage,
      page: result.page,
      pageCount: result.pageCount,
      pageSize: result.pageSize,
    })
  }, [execution, filterStore, queryId])

  if (!queryId) return <RuntimeState message="Selecciona una consulta guardada para este listing." />
  if (!cms) return <RuntimeState message="El proyecto no tiene un backend CMS disponible." tone="danger" />
  if (!execution) return <RuntimeState message={emptyMessage} />
  if (!execution.ok) return <RuntimeState message={execution.error[0]?.message ?? 'No se pudo ejecutar el listing.'} tone="danger" />

  const { listing: result, performance } = execution.value
  const hasTemplate = template.length > 0

  return (
    <section
      aria-label="Listado de contenido"
      data-listing-active-filters={filterSnapshot.activeFilters.length}
      data-listing-cache={performance.cacheHit ? 'hit' : 'miss'}
      data-listing-candidates={performance.candidateRecords}
      data-listing-indexed={performance.indexUsed ? 'true' : 'false'}
      data-listing-page={result.page}
      data-listing-query={result.queryId}
      data-listing-runtime={nodeId}
      data-listing-source-records={performance.sourceRecords}
    >
      {result.records.length > 0 ? (
        hasTemplate ? (
          <div className="grid min-w-0 gap-3" role="list" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {result.records.map((record) => (
              <div className="min-w-0" data-listing-record={record.id} key={record.id} role="listitem">
                <ListingRecordProvider recordId={record.id}>{template}</ListingRecordProvider>
              </div>
            ))}
          </div>
        ) : <RuntimeState message="Añade widgets dentro del Listing grid para definir la plantilla repetible." />
      ) : <RuntimeState message={emptyMessage} />}

      {result.pageCount > 1 ? (
        <nav aria-label="Paginación del listado" className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-md border border-border bg-surface p-1.5 text-xs">
          <button className="min-h-11 rounded-md border border-border px-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40" disabled={!result.hasPreviousPage} onClick={() => filterStore.setPage(queryId, result.page - 1)} type="button">Anterior</button>
          <span aria-live="polite" className="min-w-0 truncate px-2 font-semibold text-muted-foreground">Página {result.page} de {result.pageCount} · {result.availableCount} elementos</span>
          <button className="min-h-11 rounded-md border border-border px-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40" disabled={!result.hasNextPage} onClick={() => filterStore.setPage(queryId, result.page + 1)} type="button">Siguiente</button>
        </nav>
      ) : null}
    </section>
  )
}
