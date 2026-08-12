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
import { WidgetList } from './widget-controls'

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
  return <div className="rounded-md border border-dashed border-border bg-muted/35 p-3 text-xs text-muted-foreground" data-dynamic-source={source || undefined} data-electrocms-widget-control="empty-state">{message}</div>
}

function disclosure(question: string, answer?: string, open = false): ReactNode {
  return (
    <details className="group rounded-md border border-border bg-surface shadow-sm" open={open}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <svg aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-90" fill="none" viewBox="0 0 16 16"><path d="m6 4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
      </summary>
      {answer !== undefined ? <p className="border-t border-border px-3 py-2 text-sm leading-6 text-foreground">{answer}</p> : null}
    </details>
  )
}

function progressView(label: string, current: number, maximum: number): ReactNode {
  const max = maximum > 0 ? maximum : 100
  const value = Math.min(Math.max(current, 0), max)
  const percent = Math.round((value / max) * 100)
  return (
    <div aria-label={label} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value} className="grid gap-1.5 rounded-md border border-border bg-surface p-3" data-electrocms-widget-control="progress" role="progressbar">
      <span className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-muted-foreground">{label}</span><output className="font-bold tabular-nums text-foreground">{percent}%</output></span>
      <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} /></span>
    </div>
  )
}

const contentAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.content.card': ({ properties, slots }) => <article className="rounded-lg border border-border bg-surface p-4 shadow-sm"><h3 className="font-heading font-bold text-foreground">{text(properties, 'title')}</h3><p className="mt-1 text-sm text-muted-foreground">{text(properties, 'description')}</p>{children(slots)}</article>,
  'react.content.article': ({ properties, slots }) => <article className="rounded-lg border border-border bg-surface p-4"><h3 className="font-heading font-bold text-foreground">{text(properties, 'title')}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text(properties, 'excerpt')}</p>{children(slots)}</article>,
  'react.content.testimonial': ({ properties }) => <figure className="rounded-lg border border-border bg-surface p-4 shadow-sm"><blockquote className="text-sm italic leading-6 text-foreground">“{text(properties, 'quote')}”</blockquote><figcaption className="mt-2 text-xs font-semibold text-muted-foreground">— {text(properties, 'author')}</figcaption></figure>,
  'react.content.team-member': ({ properties, slots }) => <article className="rounded-lg border border-border bg-surface p-4"><h3 className="font-bold text-foreground">{text(properties, 'name')}</h3><p className="text-sm text-muted-foreground">{text(properties, 'role')}</p>{children(slots)}</article>,
  'react.content.faq': ({ properties }) => disclosure(text(properties, 'question'), text(properties, 'answer'), boolean(properties, 'open')),
  'react.content.tabs': ({ properties }) => <nav aria-label="Pestañas" className="flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1" role="tablist">{strings(properties, 'items').map((item, index) => <a aria-selected={index === number(properties, 'active')} className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${index === number(properties, 'active') ? 'border-primary bg-primary text-on-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`} href={`#tab-${index + 1}`} key={`${item}-${index}`} role="tab" tabIndex={index === number(properties, 'active') ? 0 : -1}>{item}</a>)}</nav>,
  'react.content.accordion': ({ properties }) => <div className="grid gap-1.5" data-electrocms-widget-control="accordion">{strings(properties, 'items').map((item, index) => <div key={`${item}-${index}`}>{disclosure(item, undefined, index === number(properties, 'openIndex'))}</div>)}</div>,
  'react.content.timeline': ({ properties }) => <div className="grid gap-1.5" data-electrocms-widget-control="timeline" role="list">{strings(properties, 'items').map((item, index) => <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2" key={`${item}-${index}`} role="listitem"><span aria-hidden="true" className="grid size-7 place-items-center rounded-full border border-primary/30 bg-primary-soft text-[0.625rem] font-bold text-primary-strong">{index + 1}</span><span className="min-h-9 rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground">{item}</span></div>)}</div>,
  'react.content.counter': ({ properties }) => <div aria-label={text(properties, 'label')} className="rounded-lg border border-border bg-surface p-4 text-center"><strong className="text-2xl font-bold tabular-nums text-foreground">{text(properties, 'value')}{text(properties, 'suffix')}</strong></div>,
  'react.content.progress': ({ properties }) => progressView(text(properties, 'label'), number(properties, 'value'), number(properties, 'max', 100)),
  'react.content.metric': ({ properties }) => <div className="rounded-lg border border-border bg-surface px-3 py-4 text-center shadow-sm"><strong className="block font-heading text-lg font-bold text-foreground">{text(properties, 'value')}</strong><span className="text-xs text-muted-foreground">{text(properties, 'label')}</span></div>,
  'react.content.pricing-table': ({ properties }) => <article className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"><div><h3 className="font-bold text-foreground">{text(properties, 'plan')}</h3><p className="mt-1 text-2xl font-bold text-primary-strong">{text(properties, 'price')}</p></div><WidgetList items={strings(properties, 'features')} label={`Características de ${text(properties, 'plan')}`} /></article>,
  'react.content.feature-list': ({ properties }) => <div aria-label="Características" className="grid gap-1.5" data-electrocms-widget-control="feature-list" role="list">{strings(properties, 'items').map((item, index) => <div className="flex min-h-10 items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground" key={`${item}-${index}`} role="listitem"><svg aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" fill="none" viewBox="0 0 16 16"><path d="m3.5 8.2 2.8 2.8 6.2-6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg><span>{item}</span></div>)}</div>,
  'react.content.breadcrumbs': ({ properties }) => <nav aria-label="Breadcrumbs"><div className="flex flex-wrap items-center gap-1.5 text-xs" role="list">{strings(properties, 'items').map((item, index) => <span className="inline-flex items-center gap-1.5" key={`${item}-${index}`} role="listitem">{index > 0 ? <svg aria-hidden="true" className="size-3 text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="m6 4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg> : null}<span className={index === strings(properties, 'items').length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{item}</span></span>)}</div></nav>,
  'react.content.table-of-contents': ({ properties }) => <nav aria-label="Tabla de contenido" className="rounded-md border border-border bg-surface p-2"><WidgetList items={strings(properties, 'items')} label="Entradas de la tabla de contenido" /></nav>,
  'react.content.carousel': ({ properties }) => <section aria-label="Carrusel" className="rounded-lg border border-border bg-surface p-4" aria-roledescription="carousel"><p aria-live="polite" className="text-sm text-foreground">{strings(properties, 'items')[number(properties, 'active')] ?? 'Sin slides'}</p></section>,
  'react.content.slider': ({ properties }) => <section aria-label="Slider" className="rounded-lg border border-border bg-surface p-4" aria-roledescription="carousel"><p aria-live="polite" className="text-sm text-foreground">{strings(properties, 'items')[number(properties, 'active')] ?? 'Sin slides'}</p></section>,
  'react.content.call-to-action': ({ properties }) => <section className="rounded-lg border border-primary/20 bg-primary-soft p-5"><h2 className="font-heading text-xl font-bold text-foreground">{text(properties, 'title')}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{text(properties, 'text')}</p><a className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-md border border-primary bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" href={safeHref(text(properties, 'href', '#'))}>{text(properties, 'buttonLabel')}</a></section>,
  'react.content.modal': ({ properties, slots }) => boolean(properties, 'open', true) ? <div aria-label={text(properties, 'label')} aria-modal="true" className="rounded-lg border border-border bg-surface p-4 text-foreground shadow-xl" data-electrocms-surface="content-modal" role="dialog">{children(slots)}</div> : null,
  'react.content.popup': ({ properties }) => boolean(properties, 'open', true) ? <aside aria-label={text(properties, 'label')} className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground shadow-lg" data-electrocms-surface="content-popup" role="dialog">{text(properties, 'text')}</aside> : null,
}

const dynamicEmptyAdapter: RegisteredWidgetAdapter = ({ properties, slots }) => hasChildren(slots)
  ? <>{children(slots)}</>
  : emptyState(text(properties, 'emptyMessage', 'Sin datos'), text(properties, 'queryId') || text(properties, 'relationId') || text(properties, 'binding'))

const dynamicAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.dynamic.field': ({ properties }) => <span className="text-foreground" data-dynamic-binding={text(properties, 'binding') || undefined}>{text(properties, 'fallback')}</span>,
  'react.dynamic.image': ({ properties }) => <div aria-label={text(properties, 'alt')} className="grid min-h-24 place-items-center rounded-md border border-dashed border-border bg-muted/35 text-xs text-muted-foreground" data-dynamic-binding={text(properties, 'binding') || undefined} role="img">{text(properties, 'fallback') || text(properties, 'alt')}</div>,
  'react.dynamic.link': ({ properties }) => <a className="cursor-pointer text-primary-strong underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" data-dynamic-binding={text(properties, 'binding') || undefined} href={safeHref(text(properties, 'fallback', '#'))}>{text(properties, 'text')}</a>,
  'react.dynamic.repeater': dynamicEmptyAdapter,
  'react.dynamic.listing-grid': ({ properties, slots }) => hasChildren(slots) ? <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${number(properties, 'columns', 3)}, minmax(0, 1fr))` }}>{children(slots)}</div> : emptyState(text(properties, 'emptyMessage'), text(properties, 'queryId')),
  'react.dynamic.query-result': dynamicEmptyAdapter,
  'react.dynamic.relations': dynamicEmptyAdapter,
  'react.dynamic.related-content': dynamicEmptyAdapter,
  'react.dynamic.conditional-field': ({ properties, slots }) => boolean(properties, 'matches', true) ? <span data-condition={text(properties, 'condition')}>{hasChildren(slots) ? children(slots) : text(properties, 'value')}</span> : null,
  'react.dynamic.author': ({ properties }) => <span data-dynamic-binding={text(properties, 'binding') || undefined}>{text(properties, 'fallback')}</span>,
  'react.dynamic.date': ({ properties }) => <time data-dynamic-binding={text(properties, 'binding') || undefined} data-format={text(properties, 'format')}>{text(properties, 'fallback')}</time>,
  'react.dynamic.taxonomies': ({ properties }) => <div data-dynamic-binding={text(properties, 'binding') || undefined}><WidgetList items={strings(properties, 'items')} label="Taxonomías dinámicas" /></div>,
  'react.dynamic.metadata': ({ properties }) => <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 rounded-md border border-border bg-surface px-2.5 py-2 text-sm" data-dynamic-binding={text(properties, 'binding') || undefined}><dt className="font-semibold text-muted-foreground">{text(properties, 'key')}</dt><dd className="min-w-0 text-foreground">{text(properties, 'value')}</dd></dl>,
  'react.dynamic.calculated-field': ({ properties }) => <output className="text-foreground" data-expression={text(properties, 'expression') || undefined}>{text(properties, 'fallback')}</output>,
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
