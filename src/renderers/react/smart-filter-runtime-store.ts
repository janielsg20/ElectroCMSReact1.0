import type { JsonValue, SmartFilterInput, SmartFilterKind } from '../../domain'

export type SmartFilterApplyMode = 'realtime' | 'apply'

export interface SmartFilterRegistration {
  readonly applyMode: SmartFilterApplyMode
  readonly dateField?: 'createdAt' | 'updatedAt'
  readonly debounceMs: number
  readonly fieldId?: string
  readonly initialValue: JsonValue
  readonly kind: SmartFilterKind
  readonly nodeId: string
  readonly persistState: boolean
  readonly queryId: string
  readonly showCount: boolean
  readonly taxonomyId?: string
  readonly urlKey: string
}

export interface SmartFilterResultMeta {
  readonly count: number
  readonly hasNextPage: boolean
  readonly page: number
  readonly pageCount: number
  readonly pageSize: number
}

export interface SmartFilterRuntimeEntry {
  readonly applied: JsonValue
  readonly draft: JsonValue
  readonly registration: SmartFilterRegistration
}

export interface SmartFilterQuerySnapshot {
  readonly activeFilters: readonly SmartFilterInput[]
  readonly entries: Readonly<Record<string, SmartFilterRuntimeEntry>>
  readonly loadMoreMultiplier: number
  readonly meta: SmartFilterResultMeta
  readonly page: number
  readonly revision: number
}

const EMPTY_META: SmartFilterResultMeta = Object.freeze({ count: 0, hasNextPage: false, page: 1, pageCount: 0, pageSize: 1 })
const EMPTY_SNAPSHOT: SmartFilterQuerySnapshot = Object.freeze({
  activeFilters: [],
  entries: {},
  loadMoreMultiplier: 1,
  meta: EMPTY_META,
  page: 1,
  revision: 0,
})

function storageKey(registration: SmartFilterRegistration): string {
  return `electrocms.smart-filter.v1:${registration.queryId}:${registration.nodeId}`
}

function timerKey(queryId: string, nodeId: string): string {
  return `${queryId}:${nodeId}`
}

function defaultUrlKey(registration: SmartFilterRegistration): string {
  return registration.urlKey.trim() || `ec_${registration.nodeId.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`
}

function readSerialized(raw: string | null): JsonValue | undefined {
  if (raw === null) return undefined
  try {
    return JSON.parse(raw) as JsonValue
  } catch {
    return raw
  }
}

function readInitialValue(registration: SmartFilterRegistration): JsonValue {
  if (typeof window !== 'undefined') {
    try {
      const urlValue = readSerialized(new URL(window.location.href).searchParams.get(defaultUrlKey(registration)))
      if (urlValue !== undefined) return urlValue
    } catch {
      // La URL puede no estar disponible en hosts embebidos; se usa el fallback local.
    }
    if (registration.persistState) {
      try {
        const stored = readSerialized(window.localStorage.getItem(storageKey(registration)))
        if (stored !== undefined) return stored
      } catch {
        // Storage puede estar bloqueado por privacidad; el runtime sigue funcional.
      }
    }
  }
  return registration.initialValue
}

function isEmptyValue(value: JsonValue): boolean {
  if (value === null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function persistApplied(registration: SmartFilterRegistration, value: JsonValue): void {
  if (typeof window === 'undefined') return
  if (registration.persistState) {
    try {
      if (isEmptyValue(value)) window.localStorage.removeItem(storageKey(registration))
      else window.localStorage.setItem(storageKey(registration), JSON.stringify(value))
    } catch {
      // Persistencia opcional; nunca debe romper el filtrado local.
    }
  }

  try {
    const url = new URL(window.location.href)
    const key = defaultUrlKey(registration)
    if (isEmptyValue(value)) url.searchParams.delete(key)
    else url.searchParams.set(key, JSON.stringify(value))
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    // Hosts sin History API conservan el estado en memoria.
  }
}

function sameJson(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function activeFilter(entry: SmartFilterRuntimeEntry): SmartFilterInput | null {
  if (isEmptyValue(entry.applied)) return null
  const registration = entry.registration
  return {
    ...(registration.dateField ? { dateField: registration.dateField } : {}),
    fieldId: registration.fieldId || null,
    id: registration.nodeId,
    kind: registration.kind,
    taxonomyId: registration.taxonomyId || null,
    value: entry.applied,
  }
}

export class SmartFilterRuntimeStore {
  private readonly listeners = new Map<string, Set<() => void>>()
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly snapshots = new Map<string, SmartFilterQuerySnapshot>()

  getSnapshot(queryId: string): SmartFilterQuerySnapshot {
    return this.snapshots.get(queryId) ?? EMPTY_SNAPSHOT
  }

  subscribe(queryId: string, listener: () => void): () => void {
    const listeners = this.listeners.get(queryId) ?? new Set<() => void>()
    listeners.add(listener)
    this.listeners.set(queryId, listeners)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) this.listeners.delete(queryId)
    }
  }

  register(registration: SmartFilterRegistration): void {
    if (!registration.queryId) return
    const current = this.getSnapshot(registration.queryId)
    const existing = current.entries[registration.nodeId]
    if (existing && JSON.stringify(existing.registration) === JSON.stringify(registration)) return

    this.cancelPending(registration.queryId, registration.nodeId)
    const initial = existing?.applied ?? readInitialValue(registration)
    const entry: SmartFilterRuntimeEntry = {
      applied: initial,
      draft: existing?.draft ?? initial,
      registration,
    }
    this.publish(registration.queryId, {
      ...current,
      entries: { ...current.entries, [registration.nodeId]: entry },
      page: 1,
    })
  }

  unregister(queryId: string, nodeId: string): void {
    this.cancelPending(queryId, nodeId)
    const current = this.snapshots.get(queryId)
    if (!current?.entries[nodeId]) return
    const entries = { ...current.entries }
    delete entries[nodeId]
    this.publish(queryId, { ...current, entries, page: 1 })
  }

  setDraft(queryId: string, nodeId: string, value: JsonValue): void {
    const current = this.getSnapshot(queryId)
    const entry = current.entries[nodeId]
    if (!entry || sameJson(entry.draft, value)) return

    if (entry.registration.applyMode !== 'realtime') {
      this.publish(queryId, {
        ...current,
        entries: { ...current.entries, [nodeId]: { ...entry, draft: value } },
      })
      return
    }

    const debounceMs = Math.max(0, Math.trunc(entry.registration.debounceMs))
    if (debounceMs === 0) {
      this.cancelPending(queryId, nodeId)
      this.commitRealtime(queryId, nodeId, value)
      return
    }

    this.cancelPending(queryId, nodeId)
    this.publish(queryId, {
      ...current,
      entries: { ...current.entries, [nodeId]: { ...entry, draft: value } },
    })
    const handle = setTimeout(() => {
      this.pending.delete(timerKey(queryId, nodeId))
      const latest = this.getSnapshot(queryId).entries[nodeId]
      if (!latest) return
      this.commitRealtime(queryId, nodeId, latest.draft)
    }, debounceMs)
    this.pending.set(timerKey(queryId, nodeId), handle)
  }

  apply(queryId: string, nodeId: string): void {
    this.cancelPending(queryId, nodeId)
    const current = this.getSnapshot(queryId)
    const entry = current.entries[nodeId]
    if (!entry || sameJson(entry.applied, entry.draft)) return
    const nextEntry = { ...entry, applied: entry.draft }
    this.publish(queryId, {
      ...current,
      entries: { ...current.entries, [nodeId]: nextEntry },
      loadMoreMultiplier: 1,
      page: 1,
    })
    persistApplied(entry.registration, entry.draft)
  }

  setPage(queryId: string, page: number): void {
    const current = this.getSnapshot(queryId)
    const normalized = Math.max(1, Math.trunc(page))
    if (current.page === normalized && current.loadMoreMultiplier === 1) return
    this.publish(queryId, { ...current, loadMoreMultiplier: 1, page: normalized })
  }

  loadMore(queryId: string): void {
    const current = this.getSnapshot(queryId)
    if (!current.meta.hasNextPage) return
    this.publish(queryId, {
      ...current,
      loadMoreMultiplier: Math.min(100, current.loadMoreMultiplier + 1),
      page: 1,
    })
  }

  reset(queryId: string): void {
    const current = this.getSnapshot(queryId)
    const entries = Object.fromEntries(Object.entries(current.entries).map(([nodeId, entry]) => {
      this.cancelPending(queryId, nodeId)
      const value = entry.registration.initialValue
      persistApplied(entry.registration, value)
      return [nodeId, { ...entry, applied: value, draft: value }]
    }))
    this.publish(queryId, { ...current, entries, loadMoreMultiplier: 1, page: 1 })
  }

  setResultMeta(queryId: string, meta: SmartFilterResultMeta): void {
    const current = this.getSnapshot(queryId)
    if (
      current.meta.count === meta.count
      && current.meta.hasNextPage === meta.hasNextPage
      && current.meta.page === meta.page
      && current.meta.pageCount === meta.pageCount
      && current.meta.pageSize === meta.pageSize
    ) return
    this.publish(queryId, { ...current, meta })
  }

  private cancelPending(queryId: string, nodeId: string): void {
    const key = timerKey(queryId, nodeId)
    const pending = this.pending.get(key)
    if (pending !== undefined) clearTimeout(pending)
    this.pending.delete(key)
  }

  private commitRealtime(queryId: string, nodeId: string, value: JsonValue): void {
    const current = this.getSnapshot(queryId)
    const entry = current.entries[nodeId]
    if (!entry || (sameJson(entry.applied, value) && sameJson(entry.draft, value))) return
    const nextEntry: SmartFilterRuntimeEntry = { ...entry, applied: value, draft: value }
    this.publish(queryId, {
      ...current,
      entries: { ...current.entries, [nodeId]: nextEntry },
      loadMoreMultiplier: 1,
      page: 1,
    })
    persistApplied(entry.registration, value)
  }

  private publish(queryId: string, input: Omit<SmartFilterQuerySnapshot, 'activeFilters' | 'revision'>): void {
    const previous = this.getSnapshot(queryId)
    const activeFilters = Object.values(input.entries)
      .map(activeFilter)
      .filter((item): item is SmartFilterInput => item !== null)
    const snapshot: SmartFilterQuerySnapshot = Object.freeze({
      ...input,
      activeFilters,
      revision: previous.revision + 1,
    })
    this.snapshots.set(queryId, snapshot)
    this.listeners.get(queryId)?.forEach((listener) => listener())
  }
}
