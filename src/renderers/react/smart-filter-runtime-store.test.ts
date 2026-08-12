import { beforeEach, describe, expect, it } from 'vitest'
import { SmartFilterRuntimeStore, type SmartFilterRegistration } from './smart-filter-runtime-store'

function registration(overrides: Partial<SmartFilterRegistration> = {}): SmartFilterRegistration {
  return {
    applyMode: 'realtime',
    fieldId: 'field-1',
    initialValue: '',
    kind: 'search',
    nodeId: 'filter-node-1',
    persistState: true,
    queryId: 'query-1',
    showCount: true,
    urlKey: 'search',
    ...overrides,
  }
}

describe('M10.4 SmartFilterRuntimeStore', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/editor')
    window.localStorage.clear()
  })

  it('aplica en tiempo real y sincroniza URL + persistencia local', () => {
    const store = new SmartFilterRuntimeStore()
    const config = registration()
    store.register(config)
    store.setDraft(config.queryId, config.nodeId, 'Gamma')

    expect(store.getSnapshot(config.queryId).activeFilters).toMatchObject([{ id: config.nodeId, kind: 'search', value: 'Gamma' }])
    expect(new URL(window.location.href).searchParams.get('search')).toBe('"Gamma"')
    expect(window.localStorage.getItem(`electrocms.smart-filter.v1:${config.queryId}:${config.nodeId}`)).toBe('"Gamma"')
  })

  it('mantiene draft separado hasta pulsar aplicar', () => {
    const store = new SmartFilterRuntimeStore()
    const config = registration({ applyMode: 'apply', persistState: false })
    store.register(config)
    store.setDraft(config.queryId, config.nodeId, 'Beta')

    expect(store.getSnapshot(config.queryId).activeFilters).toEqual([])
    expect(store.getSnapshot(config.queryId).entries[config.nodeId]?.draft).toBe('Beta')

    store.apply(config.queryId, config.nodeId)
    expect(store.getSnapshot(config.queryId).activeFilters).toMatchObject([{ value: 'Beta' }])
  })

  it('coordina paginación, carga progresiva, contador y reset', () => {
    const store = new SmartFilterRuntimeStore()
    const config = registration({ persistState: false })
    store.register(config)
    store.setDraft(config.queryId, config.nodeId, 'Alpha')
    store.setResultMeta(config.queryId, { count: 8, hasNextPage: true, page: 1, pageCount: 4, pageSize: 2 })
    store.setPage(config.queryId, 3)
    expect(store.getSnapshot(config.queryId).page).toBe(3)

    store.loadMore(config.queryId)
    expect(store.getSnapshot(config.queryId)).toMatchObject({ loadMoreMultiplier: 2, page: 1, meta: { count: 8 } })

    store.reset(config.queryId)
    expect(store.getSnapshot(config.queryId).activeFilters).toEqual([])
    expect(store.getSnapshot(config.queryId)).toMatchObject({ loadMoreMultiplier: 1, page: 1 })
  })
})