import type { ReactNode } from 'react'
import {
  CONTENT_DYNAMIC_WIDGET_DEFINITIONS,
  createCoreWidgetRegistry,
} from '../../domain/widgets/content-dynamic-widgets'
import { createStructuralBasicWidgetRegistry } from '../../domain/widgets/structural-basic-widgets'
import {
  ReactWidgetAdapterRegistry,
  createStructuralBasicReactAdapterRegistry,
  type RegisteredWidgetAdapter,
} from './registered-widget-adapters'

function text(properties: Readonly<Record<string, unknown>>, key: string, fallback = ''): string {
  const value = properties[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
}

function number(properties: Readonly<Record<string, unknown>>, key: string, fallback = 0): number {
  const value = properties[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function boolean(properties: Readonly<Record<string, unknown>>, key: string, fallback = false): boolean {
  const value = properties[key]
  return typeof value === 'boolean' ? value : fallback
}

function strings(properties: Readonly<Record<string, unknown>>, key: string): readonly string[] {
  const value = properties[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function children(slots: Readonly<Record<string, readonly ReactNode[]>>): ReactNode {
  return slots.content ?? Object.values(slots).flat()
}

function hasChildren(slots: Readonly<Record<string, readonly ReactNode[]>>): boolean {
  return Object.values(slots).some((slot) => slot.length > 0)
}

function safeHref(value: string): string {
  return value.startsWith('#') || value.startsWith('/') || /^https?:\/\//i.test(value) ? value : '#'
}

function emptyState(message: string, source?: string): ReactNode {
  return <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500" data-dynamic-source={source || undefined}>{message}</div>
}

const contentAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.content.card': ({ properties, slots }) => <article className="rounded-md border border-slate-200 bg-white p-4"><h3 className="font-heading font-bold">{text(properties, 'title')}</h3><p className="mt-1 text-sm text-slate-600">{text(properties, 'description')}</p>{children(slots)}</article>,
  'react.content.article': ({ properties, slots }) => <article><h3 className="font-heading font-bold">{text(properties, 'title')}</h3><p>{text(properties, 'excerpt')}</p>{children(slots)}</article>,
  'react.content.testimonial': ({ properties }) => <figure><blockquote className="italic">“{text(properties, 'quote')}”</blockquote><figcaption className="mt-2 text-sm font-semibold">— {text(properties, 'author')}</figcaption></figure>,
  'react.content.team-member': ({ properties, slots }) => <article><h3 className="font-bold">{text(properties, 'name')}</h3><p className="text-sm text-slate-600">{text(properties, 'role')}</p>{children(slots)}</article>,
  'react.content.faq': ({ properties }) => <details open={boolean(properties, 'open')}><summary className="cursor-pointer font-semibold">{text(properties, 'question')}</summary><p className="mt-2">{text(properties, 'answer')}</p></details>,
  'react.content.tabs': ({ properties }) => <nav aria-label="Pestañas" className="flex flex-wrap gap-1" role="tablist">{strings(properties, 'items').map((item, index) => <a aria-selected={index === number(properties, 'active')} className="rounded border px-3 py-2 text-xs" href={`#tab-${index + 1}`} key={`${item}-${index}`} role="tab" tabIndex={index === number(properties, 'active') ? 0 : -1}>{item}</a>)}</nav>,
  'react.content.accordion': ({ properties }) => <div>{strings(properties, 'items').map((item, index) => <details key={`${item}-${index}`} open={index === number(properties, 'openIndex')}><summary>{item}</summary></details>)}</div>,
  'react.content.timeline': ({ properties }) => <ol className="border-l pl-5">{strings(properties, 'items').map((item, index) => <li className="mb-3" key={`${item}-${index}`}>{item}</li>)}</ol>,
  'react.content.counter': ({ properties }) => <div aria-label={text(properties, 'label')}><strong className="text-2xl">{text(properties, 'value')}{text(properties, 'suffix')}</strong></div>,
  'react.content.progress': ({ properties }) => <label className="grid gap-1 text-xs"><span>{text(properties, 'label')}</span><progress max={number(properties, 'max', 100)} value={number(properties, 'value')} /></label>,
  'react.content.metric': ({ properties }) => <div className="bg-white px-2 py-4 text-center"><strong className="block font-heading text-lg">{text(properties, 'value')}</strong><span className="text-xs text-slate-500">{text(properties, 'label')}</span></div>,
  'react.content.pricing-table': ({ properties }) => <article className="rounded-md border p-4"><h3 className="font-bold">{text(properties, 'plan')}</h3><p className="text-2xl font-bold">{text(properties, 'price')}</p><ul>{strings(properties, 'features').map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></article>,
  'react.content.feature-list': ({ properties }) => <ul className="grid gap-2">{strings(properties, 'items').map((item, index) => <li key={`${item}-${index}`}>✓ {item}</li>)}</ul>,
  'react.content.breadcrumbs': ({ properties }) => <nav aria-label="Breadcrumbs"><ol className="flex flex-wrap gap-2">{strings(properties, 'items').map((item, index) => <li key={`${item}-${index}`}>{index > 0 ? <span aria-hidden="true">/ </span> : null}{item}</li>)}</ol></nav>,
  'react.content.table-of-contents': ({ properties }) => <nav aria-label="Tabla de contenido"><ol>{strings(properties, 'items').map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol></nav>,
  'react.content.carousel': ({ properties }) => <section aria-label="Carrusel" aria-roledescription="carousel"><p aria-live="polite">{strings(properties, 'items')[number(properties, 'active')] ?? 'Sin slides'}</p></section>,
  'react.content.slider': ({ properties }) => <section aria-label="Slider" aria-roledescription="carousel"><p aria-live="polite">{strings(properties, 'items')[number(properties, 'active')] ?? 'Sin slides'}</p></section>,
  'react.content.call-to-action': ({ properties }) => <section className="rounded-md bg-blue-50 p-5"><h2 className="font-heading text-xl font-bold">{text(properties, 'title')}</h2><p>{text(properties, 'text')}</p><a className="mt-3 inline-flex min-h-11 items-center rounded bg-blue-600 px-4 text-sm font-bold text-white" href={safeHref(text(properties, 'href', '#'))}>{text(properties, 'buttonLabel')}</a></section>,
  'react.content.modal': ({ properties, slots }) => boolean(properties, 'open', true) ? <div aria-label={text(properties, 'label')} aria-modal="true" className="rounded border bg-white p-4 shadow-xl" role="dialog">{children(slots)}</div> : null,
  'react.content.popup': ({ properties }) => boolean(properties, 'open', true) ? <aside aria-label={text(properties, 'label')} className="rounded border bg-white p-4 shadow-lg" role="dialog">{text(properties, 'text')}</aside> : null,
}

const dynamicEmptyAdapter: RegisteredWidgetAdapter = ({ properties, slots }) => hasChildren(slots)
  ? <>{children(slots)}</>
  : emptyState(text(properties, 'emptyMessage', 'Sin datos'), text(properties, 'queryId') || text(properties, 'relationId') || text(properties, 'binding'))

const dynamicAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.dynamic.field': ({ properties }) => <span data-dynamic-binding={text(properties, 'binding') || undefined}>{text(properties, 'fallback')}</span>,
  'react.dynamic.image': ({ properties }) => <div aria-label={text(properties, 'alt')} className="grid min-h-24 place-items-center rounded border border-dashed text-xs" data-dynamic-binding={text(properties, 'binding') || undefined} role="img">{text(properties, 'fallback') || text(properties, 'alt')}</div>,
  'react.dynamic.link': ({ properties }) => <a data-dynamic-binding={text(properties, 'binding') || undefined} href={safeHref(text(properties, 'fallback', '#'))}>{text(properties, 'text')}</a>,
  'react.dynamic.repeater': dynamicEmptyAdapter,
  'react.dynamic.listing-grid': ({ properties, slots }) => hasChildren(slots) ? <div className="grid" style={{ gridTemplateColumns: `repeat(${number(properties, 'columns', 3)}, minmax(0, 1fr))` }}>{children(slots)}</div> : emptyState(text(properties, 'emptyMessage'), text(properties, 'queryId')),
  'react.dynamic.query-result': dynamicEmptyAdapter,
  'react.dynamic.relations': dynamicEmptyAdapter,
  'react.dynamic.related-content': dynamicEmptyAdapter,
  'react.dynamic.conditional-field': ({ properties, slots }) => boolean(properties, 'matches', true) ? <span data-condition={text(properties, 'condition')}>{hasChildren(slots) ? children(slots) : text(properties, 'value')}</span> : null,
  'react.dynamic.author': ({ properties }) => <span data-dynamic-binding={text(properties, 'binding') || undefined}>{text(properties, 'fallback')}</span>,
  'react.dynamic.date': ({ properties }) => <time data-dynamic-binding={text(properties, 'binding') || undefined} data-format={text(properties, 'format')}>{text(properties, 'fallback')}</time>,
  'react.dynamic.taxonomies': ({ properties }) => <ul data-dynamic-binding={text(properties, 'binding') || undefined}>{strings(properties, 'items').map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>,
  'react.dynamic.metadata': ({ properties }) => <dl data-dynamic-binding={text(properties, 'binding') || undefined}><dt>{text(properties, 'key')}</dt><dd>{text(properties, 'value')}</dd></dl>,
  'react.dynamic.calculated-field': ({ properties }) => <output data-expression={text(properties, 'expression') || undefined}>{text(properties, 'fallback')}</output>,
}

export function registerContentDynamicReactAdapters(registry: ReactWidgetAdapterRegistry): void {
  for (const definition of CONTENT_DYNAMIC_WIDGET_DEFINITIONS) {
    const adapter = contentAdapters[definition.rendererId] ?? dynamicAdapters[definition.rendererId]
    if (!adapter) throw new Error(`Falta el adapter React ${definition.rendererId}.`)
    registry.register(definition.rendererId, adapter)
  }
}

export function createCoreReactAdapterRegistry(): ReactWidgetAdapterRegistry {
  const registry = createStructuralBasicReactAdapterRegistry(createStructuralBasicWidgetRegistry())
  registerContentDynamicReactAdapters(registry)
  return registry
}

export const coreWidgetRegistry = createCoreWidgetRegistry()
export const coreReactAdapterRegistry = createCoreReactAdapterRegistry()
