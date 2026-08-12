import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { executeCmsListing } from '../../domain/project/listing-engine'
import type { JsonValue } from '../../domain'
import { ListingRecordProvider } from './listing-runtime-context'
import type { ProjectStructureRenderStore } from './project-structure-render-store'

export interface ListingGridRuntimeProps {
  readonly nodeId: string
  readonly properties: Readonly<Record<string, JsonValue>>
  readonly slots: Readonly<Record<string, readonly ReactNode[]>>
  readonly store: ProjectStructureRenderStore
}

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
    ? 'rounded-md border border-red-300 bg-red-50 p-4 text-xs text-red-700'
    : 'rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500'
  return <div className={className} role={tone === 'danger' ? 'alert' : 'status'}>{message}</div>
}

export function ListingGridRuntime({ nodeId, properties, slots, store }: ListingGridRuntimeProps) {
  const queryId = textProperty(properties, 'queryId').trim()
  const columns = Math.max(1, Math.min(12, Math.trunc(numberProperty(properties, 'columns', 3))))
  const emptyMessage = textProperty(properties, 'emptyMessage', 'Sin resultados')
  const [page, setPage] = useState(1)
  const subscribe = useCallback((listener: () => void) => store.subscribeStructure(listener), [store])
  const getCms = useCallback(() => store.structure.cms, [store])
  const cms = useSyncExternalStore(subscribe, getCms, getCms)
  const template = slotTemplate(slots)
  const listing = useMemo(
    () => cms && queryId ? executeCmsListing(cms, { page, queryId }) : null,
    [cms, page, queryId],
  )

  if (!queryId) {
    return <RuntimeState message="Selecciona una consulta guardada para este listing." />
  }
  if (!cms) {
    return <RuntimeState message="El proyecto no tiene un backend CMS disponible." tone="danger" />
  }
  if (!listing) {
    return <RuntimeState message={emptyMessage} />
  }
  if (!listing.ok) {
    return <RuntimeState message={listing.error[0]?.message ?? 'No se pudo ejecutar el listing.'} tone="danger" />
  }

  const result = listing.value
  const hasTemplate = template.length > 0

  return (
    <section
      aria-label="Listado de contenido"
      data-listing-page={result.page}
      data-listing-query={result.queryId}
      data-listing-runtime={nodeId}
    >
      {result.records.length > 0 ? (
        hasTemplate ? (
          <div
            className="grid min-w-0 gap-3"
            role="list"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {result.records.map((record) => (
              <div className="min-w-0" data-listing-record={record.id} key={record.id} role="listitem">
                <ListingRecordProvider recordId={record.id}>{template}</ListingRecordProvider>
              </div>
            ))}
          </div>
        ) : (
          <RuntimeState message="Añade widgets dentro del Listing grid para definir la plantilla repetible." />
        )
      ) : (
        <RuntimeState message={emptyMessage} />
      )}

      {result.pageCount > 1 ? (
        <nav aria-label="Paginación del listado" className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-1.5 text-xs">
          <button
            className="min-h-11 rounded-md border border-slate-200 px-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!result.hasPreviousPage}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Anterior
          </button>
          <span aria-live="polite" className="min-w-0 truncate px-2 font-semibold text-slate-600">
            Página {result.page} de {result.pageCount} · {result.availableCount} elementos
          </span>
          <button
            className="min-h-11 rounded-md border border-slate-200 px-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!result.hasNextPage}
            onClick={() => setPage((current) => Math.min(result.pageCount, current + 1))}
            type="button"
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </section>
  )
}
