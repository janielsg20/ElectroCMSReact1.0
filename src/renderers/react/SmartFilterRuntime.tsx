import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { CmsBackend, JsonValue, SmartFilterKind } from '../../domain'
import type { ProjectStructureRenderStore } from './project-structure-render-store'
import { useSmartFilterRuntimeStore } from './smart-filter-runtime-context'
import type { SmartFilterRegistration } from './smart-filter-runtime-store'

export interface SmartFilterRuntimeProps {
  readonly nodeId: string
  readonly properties: Readonly<Record<string, JsonValue>>
  readonly projectStore: ProjectStructureRenderStore
  readonly widgetType: string
}

interface Choice {
  readonly label: string
  readonly value: JsonValue
}

const CONTROL = 'min-h-11 w-full rounded-md border border-border bg-surface px-3 text-xs text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
const ACTION = 'min-h-11 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40'
const ACTIVE = 'border-primary/50 bg-primary-soft text-primary-strong'

function text(properties: Readonly<Record<string, JsonValue>>, key: string, fallback = ''): string {
  const value = properties[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
}

function number(properties: Readonly<Record<string, JsonValue>>, key: string, fallback = 0): number {
  const value = properties[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function boolean(properties: Readonly<Record<string, JsonValue>>, key: string, fallback = false): boolean {
  const value = properties[key]
  return typeof value === 'boolean' ? value : fallback
}

function strings(properties: Readonly<Record<string, JsonValue>>, key: string): readonly string[] {
  const value = properties[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function filterKind(widgetType: string): SmartFilterKind | null {
  if (widgetType === 'filter.search') return 'search'
  if (widgetType === 'filter.select') return 'select'
  if (widgetType === 'filter.range') return 'range'
  if (widgetType === 'filter.checkboxes') return 'checkboxes'
  if (widgetType === 'filter.radio') return 'radio'
  if (widgetType === 'filter.date') return 'date'
  if (widgetType === 'filter.taxonomy') return 'taxonomy'
  if (widgetType === 'filter.sort') return 'sort'
  return null
}

function debounceFor(widgetType: string): number {
  if (widgetType === 'filter.search') return 180
  if (widgetType === 'filter.range') return 120
  return 0
}

function initialValue(widgetType: string, properties: Readonly<Record<string, JsonValue>>): JsonValue {
  if (widgetType === 'filter.search') return text(properties, 'query')
  if (widgetType === 'filter.checkboxes' || widgetType === 'filter.taxonomy') return [...strings(properties, 'selected')]
  if (widgetType === 'filter.select' || widgetType === 'filter.radio' || widgetType === 'filter.date' || widgetType === 'filter.sort') return text(properties, 'value')
  if (widgetType === 'filter.range') return null
  return null
}

function jsonEqual(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function displayValue(value: JsonValue): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function parseChoice(source: string): Choice {
  const separator = source.indexOf('|')
  if (separator < 0) return { label: source, value: source }
  return { label: source.slice(0, separator).trim() || source.slice(separator + 1), value: source.slice(separator + 1).trim() }
}

function fieldChoices(cms: CmsBackend | undefined, fieldId: string, fallback: readonly string[]): readonly Choice[] {
  if (fallback.length > 0) return fallback.map(parseChoice)
  const field = cms ? Object.values(cms.fields).find((item) => item.id === fieldId) : undefined
  if (!field) return []
  return field.options.map((option) => ({ label: option.label, value: option.value }))
}

function taxonomyChoices(cms: CmsBackend | undefined, taxonomyId: string, fallback: readonly string[]): readonly Choice[] {
  const terms = Object.values(cms?.taxonomyTerms ?? {})
    .filter((term) => term.taxonomyId === taxonomyId)
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
  if (terms.length > 0) return terms.map((term) => ({ label: term.name, value: term.id }))
  return fallback.map(parseChoice)
}

function sortChoices(properties: Readonly<Record<string, JsonValue>>): readonly Choice[] {
  const configured = strings(properties, 'options')
  if (configured.length > 0) return configured.map(parseChoice)
  return [
    { label: 'Más recientes', value: 'createdAt:desc' },
    { label: 'Más antiguos', value: 'createdAt:asc' },
    { label: 'Actualizados recientemente', value: 'updatedAt:desc' },
    { label: 'ID ascendente', value: 'id:asc' },
  ]
}

function pageWindow(page: number, pageCount: number, size = 7): readonly number[] {
  if (pageCount <= size) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const half = Math.floor(size / 2)
  const start = Math.min(Math.max(1, page - half), pageCount - size + 1)
  return Array.from({ length: size }, (_, index) => start + index)
}

function FilterShell({ children, count, label, showCount }: { readonly children: ReactNode; readonly count: number; readonly label: string; readonly showCount: boolean }) {
  return (
    <section aria-label={label} className="grid min-w-0 gap-2 rounded-lg border border-border bg-surface/95 p-2.5 shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <strong className="truncate text-xs font-semibold text-foreground">{label}</strong>
        {showCount ? <output aria-label={`${count} resultados`} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[0.625rem] font-bold tabular-nums text-muted-foreground">{count}</output> : null}
      </div>
      {children}
    </section>
  )
}

function ChoiceMenu({ choices, label, onChange, value }: { readonly choices: readonly Choice[]; readonly label: string; readonly onChange: (value: JsonValue) => void; readonly value: JsonValue }) {
  const [open, setOpen] = useState(false)
  const selected = choices.find((choice) => jsonEqual(choice.value, value))
  return (
    <div className="relative min-w-0">
      <button aria-expanded={open} aria-haspopup="listbox" className={`${CONTROL} flex items-center justify-between gap-2 text-left`} onClick={() => setOpen((current) => !current)} type="button">
        <span className="truncate">{selected?.label ?? 'Todos'}</span>
        <span aria-hidden="true" className={`text-[0.625rem] transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open ? (
        <div aria-label={label} className="absolute left-0 right-0 z-30 mt-1 grid max-h-56 gap-1 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg" role="listbox">
          <button aria-selected={value === ''} className={`min-h-11 rounded px-2 text-left text-xs ${value === '' ? ACTIVE : 'hover:bg-muted'}`} onClick={() => { onChange(''); setOpen(false) }} role="option" type="button">Todos</button>
          {choices.map((choice, index) => {
            const active = jsonEqual(choice.value, value)
            return <button aria-selected={active} className={`min-h-11 rounded px-2 text-left text-xs ${active ? ACTIVE : 'hover:bg-muted'}`} key={`${displayValue(choice.value)}-${index}`} onClick={() => { onChange(choice.value); setOpen(false) }} role="option" type="button">{choice.label}</button>
          })}
        </div>
      ) : null}
    </div>
  )
}

function ChoiceGroup({ choices, label, multiple, onChange, value }: { readonly choices: readonly Choice[]; readonly label: string; readonly multiple: boolean; readonly onChange: (value: JsonValue) => void; readonly value: JsonValue }) {
  const selected = Array.isArray(value) ? value : []
  return (
    <div aria-label={label} className="flex flex-wrap gap-1.5" role={multiple ? 'group' : 'radiogroup'}>
      {choices.map((choice, index) => {
        const active = multiple ? selected.some((item) => jsonEqual(item, choice.value)) : jsonEqual(value, choice.value)
        const toggle = () => {
          if (!multiple) onChange(active ? '' : choice.value)
          else onChange(active ? selected.filter((item) => !jsonEqual(item, choice.value)) : [...selected, choice.value])
        }
        return (
          <button
            aria-checked={active}
            className={`min-h-11 rounded-full border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? ACTIVE : 'border-border bg-surface text-foreground hover:bg-muted'}`}
            key={`${displayValue(choice.value)}-${index}`}
            onClick={toggle}
            role={multiple ? 'checkbox' : 'radio'}
            type="button"
          >
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}

function RangeControl({ max, min, onChange, value }: { readonly max: number; readonly min: number; readonly onChange: (value: JsonValue) => void; readonly value: JsonValue }) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : null
  const from = typeof raw?.min === 'number' ? raw.min : min
  const to = typeof raw?.max === 'number' ? raw.max : max
  const update = (key: 'min' | 'max', source: string) => {
    const parsed = Number(source)
    if (!Number.isFinite(parsed)) return
    onChange({ min: key === 'min' ? parsed : from, max: key === 'max' ? parsed : to })
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground">Desde<input aria-label="Rango desde" className={CONTROL} inputMode="decimal" onChange={(event) => update('min', event.target.value)} type="text" value={from} /></label>
      <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground">Hasta<input aria-label="Rango hasta" className={CONTROL} inputMode="decimal" onChange={(event) => update('max', event.target.value)} type="text" value={to} /></label>
    </div>
  )
}

function QueryRequired({ label }: { readonly label: string }) {
  return <div className="rounded-md border border-dashed border-border bg-muted/20 p-2 text-xs text-muted-foreground" role="status">Configura una Query objetivo para {label.toLocaleLowerCase('es')}.</div>
}

export function SmartFilterRuntime({ nodeId, projectStore, properties, widgetType }: SmartFilterRuntimeProps) {
  const runtimeStore = useSmartFilterRuntimeStore()
  const queryId = text(properties, 'queryId').trim()
  const kind = filterKind(widgetType)
  const subscribe = useMemo(() => (listener: () => void) => runtimeStore.subscribe(queryId, listener), [queryId, runtimeStore])
  const getSnapshot = useMemo(() => () => runtimeStore.getSnapshot(queryId), [queryId, runtimeStore])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const cms = projectStore.structure.cms
  const label = text(properties, 'label', widgetType.replace('filter.', ''))
  const applyMode = text(properties, 'applyMode', 'realtime') === 'apply' ? 'apply' : 'realtime'
  const showCount = boolean(properties, 'showCount', true)
  const registration = useMemo<SmartFilterRegistration | null>(() => kind && queryId ? {
    applyMode,
    dateField: text(properties, 'dateField', 'createdAt') === 'updatedAt' ? 'updatedAt' : 'createdAt',
    debounceMs: debounceFor(widgetType),
    fieldId: text(properties, 'fieldId'),
    initialValue: initialValue(widgetType, properties),
    kind,
    nodeId,
    persistState: boolean(properties, 'persistState'),
    queryId,
    showCount,
    taxonomyId: text(properties, 'taxonomy'),
    urlKey: text(properties, 'urlKey'),
  } : null, [applyMode, kind, nodeId, properties, queryId, showCount, widgetType])

  useEffect(() => {
    if (!registration) return
    runtimeStore.register(registration)
    return () => runtimeStore.unregister(registration.queryId, registration.nodeId)
  }, [registration, runtimeStore])

  if (!queryId) return <QueryRequired label={label} />

  if (widgetType === 'filter.pagination') {
    const pageCount = Math.max(1, snapshot.meta.pageCount)
    const page = Math.min(snapshot.page, pageCount)
    const pages = pageWindow(page, pageCount)
    return (
      <FilterShell count={snapshot.meta.count} label="Paginación" showCount={showCount}>
        <nav aria-label="Paginación de resultados" className="flex flex-wrap items-center gap-1">
          <button className={ACTION} disabled={page <= 1} onClick={() => runtimeStore.setPage(queryId, page - 1)} type="button">Anterior</button>
          {pages.map((item) => <button aria-current={item === page ? 'page' : undefined} className={`${ACTION} min-w-11 ${item === page ? ACTIVE : ''}`} key={item} onClick={() => runtimeStore.setPage(queryId, item)} type="button">{item}</button>)}
          <button className={ACTION} disabled={page >= pageCount} onClick={() => runtimeStore.setPage(queryId, page + 1)} type="button">Siguiente</button>
        </nav>
      </FilterShell>
    )
  }

  if (widgetType === 'filter.load-more') {
    const disabled = boolean(properties, 'disabled') || !snapshot.meta.hasNextPage
    return (
      <FilterShell count={snapshot.meta.count} label={label} showCount={showCount}>
        <button className={`${ACTION} w-full`} disabled={disabled} onClick={() => runtimeStore.loadMore(queryId)} type="button">{snapshot.meta.hasNextPage ? label : 'Todo cargado'}</button>
      </FilterShell>
    )
  }

  if (widgetType === 'filter.reset') {
    return (
      <FilterShell count={snapshot.meta.count} label={label} showCount={showCount}>
        <button className={`${ACTION} w-full`} disabled={boolean(properties, 'disabled')} onClick={() => runtimeStore.reset(queryId)} type="button">{label}</button>
      </FilterShell>
    )
  }

  if (!registration || !kind) return <QueryRequired label={label} />
  const entry = snapshot.entries[nodeId]
  const value = entry?.draft ?? registration.initialValue
  const setValue = (next: JsonValue) => runtimeStore.setDraft(queryId, nodeId, next)
  const pendingApply = applyMode === 'apply' && entry ? !jsonEqual(entry.applied, entry.draft) : false
  const pendingRealtime = applyMode === 'realtime' && entry ? !jsonEqual(entry.applied, entry.draft) : false
  const fieldId = text(properties, 'fieldId')
  const options = fieldChoices(cms, fieldId, strings(properties, 'options'))
  let control: ReactNode

  if (widgetType === 'filter.search') {
    control = <input aria-label={label} className={CONTROL} onChange={(event) => setValue(event.target.value)} placeholder="Buscar…" type="text" value={typeof value === 'string' ? value : ''} />
  } else if (widgetType === 'filter.select') {
    control = <ChoiceMenu choices={options} label={label} onChange={setValue} value={value} />
  } else if (widgetType === 'filter.range') {
    control = <RangeControl max={number(properties, 'max', 100)} min={number(properties, 'min', 0)} onChange={setValue} value={value} />
  } else if (widgetType === 'filter.checkboxes') {
    control = <ChoiceGroup choices={options} label={label} multiple onChange={setValue} value={value} />
  } else if (widgetType === 'filter.radio') {
    control = <ChoiceGroup choices={options} label={label} multiple={false} onChange={setValue} value={value} />
  } else if (widgetType === 'filter.date') {
    control = <input aria-label={label} className={`${CONTROL} font-mono`} inputMode="numeric" onChange={(event) => setValue(event.target.value)} placeholder="YYYY-MM-DD" type="text" value={typeof value === 'string' ? value : ''} />
  } else if (widgetType === 'filter.taxonomy') {
    control = <ChoiceGroup choices={taxonomyChoices(cms, text(properties, 'taxonomy'), strings(properties, 'terms'))} label={label} multiple onChange={setValue} value={value} />
  } else {
    control = <ChoiceMenu choices={sortChoices(properties)} label={label} onChange={setValue} value={value} />
  }

  return (
    <FilterShell count={snapshot.meta.count} label={label} showCount={showCount}>
      {control}
      {applyMode === 'apply' ? <button className={`${ACTION} w-full ${pendingApply ? 'border-primary bg-primary text-on-primary hover:bg-primary-strong' : ''}`} disabled={!pendingApply} onClick={() => runtimeStore.apply(queryId, nodeId)} type="button">Aplicar filtro</button> : null}
      {pendingRealtime ? <span aria-live="polite" className="sr-only">Actualizando filtro…</span> : null}
      {entry?.registration.persistState ? <span className="sr-only">El estado de este filtro se conserva localmente.</span> : null}
    </FilterShell>
  )
}
