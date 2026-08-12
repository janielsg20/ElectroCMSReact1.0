import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import {
  COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS,
  createCompleteWidgetRegistry,
} from '../../domain/widgets/commerce-form-filter-widgets'
import {
  ReactWidgetAdapterRegistry,
  type RegisteredWidgetAdapter,
} from './registered-widget-adapters'
import { createCoreReactAdapterRegistry } from './content-dynamic-widget-adapters'
import {
  WidgetButton,
  WidgetCheckbox,
  WidgetChoiceGroup,
  WidgetDateTimeField,
  WidgetFileField,
  WidgetInputField,
  WidgetList,
  WidgetRange,
  WidgetSelect,
  WidgetSwitch,
  WidgetTextArea,
} from './widget-controls'

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

function safeMedia(value: string): string | undefined {
  return /^(?:https?:|blob:|data:image\/|\/|\.\/|\.\.\/)/i.test(value) ? value : undefined
}

function actionLink(properties: Readonly<Record<string, unknown>>, labelKey: string): ReactNode {
  const href = safeHref(text(properties, 'href', '#'))
  const disabled = boolean(properties, 'disabled') || href === '#'
  return disabled
    ? <WidgetButton disabled>{text(properties, labelKey)}</WidgetButton>
    : <a className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-primary-strong hover:bg-primary-strong active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2" data-electrocms-widget-control="link-button" href={href}>{text(properties, labelKey)}</a>
}

function emptyState(message: string, source?: string): ReactNode {
  return <div className="rounded-md border border-dashed border-border bg-muted/35 p-3 text-xs text-muted-foreground" data-electrocms-widget-control="empty-state" data-widget-source={source || undefined}>{message}</div>
}

const commerceAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.commerce.product-card': ({ properties }) => <article className="grid gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm"><h3 className="text-base font-bold text-foreground"><a className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" href={safeHref(text(properties, 'href', '#'))}>{text(properties, 'title')}</a></h3><p className="text-sm font-semibold text-primary-strong">{text(properties, 'price')}</p></article>,
  'react.commerce.product-grid': ({ properties, slots }) => hasChildren(slots) ? <div className="grid gap-3" data-query={text(properties, 'queryId')} style={{ gridTemplateColumns: `repeat(${number(properties, 'columns', 3)}, minmax(0, 1fr))` }}>{children(slots)}</div> : emptyState(text(properties, 'emptyMessage'), text(properties, 'queryId')),
  'react.commerce.price': ({ properties }) => <data className="font-semibold text-foreground" value={text(properties, 'value')}>{text(properties, 'currency')} {text(properties, 'value')}</data>,
  'react.commerce.previous-price': ({ properties }) => <del className="text-muted-foreground">{text(properties, 'currency')} {text(properties, 'value')}</del>,
  'react.commerce.variations': ({ properties }) => <WidgetSelect defaultValue="" label={text(properties, 'label')} options={strings(properties, 'options')} placeholder="Seleccionar" />,
  'react.commerce.buy-button': ({ properties }) => actionLink(properties, 'label'),
  'react.commerce.add-to-cart': ({ properties }) => <span data-product-id={text(properties, 'productId') || undefined}>{actionLink(properties, 'label')}</span>,
  'react.commerce.cart-count': ({ properties }) => <output aria-label={text(properties, 'label')} className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full bg-primary-soft px-2 text-xs font-bold text-primary-strong">{number(properties, 'count')}</output>,
  'react.commerce.inventory': ({ properties }) => <output aria-label={text(properties, 'label')} className="text-sm font-semibold text-foreground">{number(properties, 'quantity')}</output>,
  'react.commerce.stock-badge': ({ properties }) => <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-muted px-2 text-xs font-semibold text-foreground" data-stock={text(properties, 'state')} role="status">{text(properties, 'label')}</span>,
  'react.commerce.wishlist': ({ properties }) => <output aria-label={text(properties, 'label')} className="inline-flex min-h-8 items-center rounded-md border border-border bg-surface px-2 text-xs font-semibold text-foreground" data-item-id={text(properties, 'itemId') || undefined} role="status">{boolean(properties, 'active') ? 'Guardado' : 'No guardado'}</output>,
  'react.commerce.checkout': ({ properties }) => <section aria-label="Checkout" className="rounded-lg border border-border bg-surface p-4" data-checkout-state={text(properties, 'state')}>{emptyState(text(properties, 'message'))}</section>,
  'react.commerce.order-summary': ({ properties }) => <section aria-label="Resumen de pedido" className="grid gap-3 rounded-lg border border-border bg-surface p-4"><WidgetList items={strings(properties, 'items')} label="Artículos del pedido" /><strong className="border-t border-border pt-2 text-sm text-foreground">Total: {text(properties, 'total')}</strong></section>,
  'react.commerce.product-gallery': ({ properties }) => <div aria-label={text(properties, 'alt')} className="grid grid-cols-2 gap-2" role="list">{strings(properties, 'images').map((source, index) => <img alt={`${text(properties, 'alt')} ${index + 1}`} className="w-full rounded-md border border-border object-cover" key={`${source}-${index}`} role="listitem" src={safeMedia(source)} />)}</div>,
  'react.commerce.related-products': ({ properties, slots }) => hasChildren(slots) ? <div data-query={text(properties, 'queryId')}>{children(slots)}</div> : emptyState(text(properties, 'emptyMessage'), text(properties, 'queryId')),
}

function preventSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault()
}

function inputAdapter(type: InputHTMLAttributes<HTMLInputElement>['type']): RegisteredWidgetAdapter {
  return ({ properties }) => <WidgetInputField defaultValue={text(properties, 'value')} label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} type={type} />
}

function choiceAdapter(type: 'checkbox' | 'radio'): RegisteredWidgetAdapter {
  return ({ properties }) => <WidgetChoiceGroup defaultSelected={type === 'checkbox' ? strings(properties, 'selected') : undefined} defaultValue={type === 'radio' ? text(properties, 'value') : undefined} label={text(properties, 'label')} multiple={type === 'checkbox'} name={text(properties, 'name') || text(properties, 'label')} options={strings(properties, 'options')} />
}

const formAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.form.container': ({ properties, slots }) => <form aria-label={text(properties, 'label')} className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm" data-action={text(properties, 'action') || undefined} data-electrocms-widget-control="form" method={text(properties, 'method', 'post')} onSubmit={preventSubmit}>{children(slots)}</form>,
  'react.form.text': inputAdapter('text'),
  'react.form.number': ({ properties }) => <WidgetInputField defaultValue={number(properties, 'value')} inputMode="decimal" label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} type="text" />,
  'react.form.email': inputAdapter('email'),
  'react.form.phone': inputAdapter('tel'),
  'react.form.url': inputAdapter('url'),
  'react.form.textarea': ({ properties }) => <WidgetTextArea defaultValue={text(properties, 'value')} label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} rows={number(properties, 'rows', 4)} />,
  'react.form.select': ({ properties }) => <WidgetSelect defaultValue={text(properties, 'value')} label={text(properties, 'label')} name={text(properties, 'name')} options={strings(properties, 'options')} placeholder="Seleccionar" required={boolean(properties, 'required')} />,
  'react.form.radio': choiceAdapter('radio'),
  'react.form.checkbox': ({ properties }) => <WidgetCheckbox defaultChecked={boolean(properties, 'value')} label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} />,
  'react.form.switch': ({ properties }) => <WidgetSwitch defaultChecked={boolean(properties, 'value')} label={text(properties, 'label')} name={text(properties, 'name')} />,
  'react.form.date': ({ properties }) => <WidgetDateTimeField defaultValue={text(properties, 'value')} kind="date" label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} />,
  'react.form.time': ({ properties }) => <WidgetDateTimeField defaultValue={text(properties, 'value')} kind="time" label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} />,
  'react.form.file': ({ properties }) => <WidgetFileField accept={text(properties, 'accept') || undefined} label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} />,
  'react.form.image': ({ properties }) => <WidgetFileField accept={text(properties, 'accept', 'image/*')} label={text(properties, 'label')} name={text(properties, 'name')} required={boolean(properties, 'required')} />,
  'react.form.repeater': ({ properties, slots }) => hasChildren(slots) ? <div className="grid gap-2" data-max-items={number(properties, 'maxItems')}>{children(slots)}</div> : <WidgetList items={strings(properties, 'items')} label="Elementos repetidos" />,
  'react.form.conditional-fields': ({ properties, slots }) => boolean(properties, 'matches', true) ? <div className="grid gap-2" data-condition={text(properties, 'condition')}>{children(slots)}</div> : null,
  'react.form.captcha': ({ properties }) => emptyState(boolean(properties, 'enabled') ? `CAPTCHA ${text(properties, 'provider')} requiere runtime` : 'CAPTCHA deshabilitado'),
  'react.form.submit': ({ properties }) => <WidgetButton disabled={boolean(properties, 'disabled', true)} type="submit">{text(properties, 'label')}</WidgetButton>,
  'react.form.status-message': ({ properties }) => <p aria-live="polite" className={`rounded-md border px-3 py-2 text-sm ${text(properties, 'state') === 'error' ? 'border-danger/35 bg-danger-soft text-danger' : 'border-border bg-muted text-foreground'}`} data-state={text(properties, 'state')} role={text(properties, 'state') === 'error' ? 'alert' : 'status'}>{text(properties, 'message')}</p>,
}

const filterAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.filter.search': ({ properties }) => <WidgetInputField defaultValue={text(properties, 'query')} label={text(properties, 'label')} placeholder="Buscar…" type="text" />,
  'react.filter.select': ({ properties }) => <WidgetSelect defaultValue={text(properties, 'value')} label={text(properties, 'label')} options={strings(properties, 'options')} placeholder="Todos" />,
  'react.filter.range': ({ properties }) => <WidgetRange defaultValue={number(properties, 'value')} label={text(properties, 'label')} max={number(properties, 'max', 100)} min={number(properties, 'min')} />,
  'react.filter.checkboxes': choiceAdapter('checkbox'),
  'react.filter.radio': choiceAdapter('radio'),
  'react.filter.date': ({ properties }) => <WidgetDateTimeField defaultValue={text(properties, 'value')} kind="date" label={text(properties, 'label')} />,
  'react.filter.taxonomy': ({ properties }) => <div data-taxonomy={text(properties, 'taxonomy')}><WidgetChoiceGroup defaultSelected={strings(properties, 'selected')} label={text(properties, 'label')} multiple options={strings(properties, 'terms')} /></div>,
  'react.filter.sort': ({ properties }) => <WidgetSelect defaultValue={text(properties, 'value')} label={text(properties, 'label')} options={strings(properties, 'options')} placeholder="Ordenar" />,
  'react.filter.pagination': ({ properties }) => <nav aria-label="Paginación" className="flex flex-wrap gap-1" data-electrocms-widget-control="pagination">{Array.from({ length: number(properties, 'totalPages', 1) }, (_, index) => <a aria-current={index + 1 === number(properties, 'page', 1) ? 'page' : undefined} className={`grid min-h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${index + 1 === number(properties, 'page', 1) ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-foreground hover:border-primary/35 hover:bg-muted'}`} href={`#page-${index + 1}`} key={index + 1}>{index + 1}</a>)}</nav>,
  'react.filter.load-more': ({ properties }) => <><WidgetButton describedBy="load-more-runtime" disabled type="button">{text(properties, 'state') === 'loading' ? 'Cargando…' : text(properties, 'label')}</WidgetButton><span className="sr-only" id="load-more-runtime">Requiere proveedor de datos</span></>,
  'react.filter.reset': ({ properties }) => <WidgetButton disabled={boolean(properties, 'disabled')} type="reset">{text(properties, 'label')}</WidgetButton>,
}

export function registerCommerceFormFilterReactAdapters(registry: ReactWidgetAdapterRegistry): void {
  for (const definition of COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS) {
    const adapter = commerceAdapters[definition.rendererId] ?? formAdapters[definition.rendererId] ?? filterAdapters[definition.rendererId]
    if (!adapter) throw new Error(`Falta el adapter React ${definition.rendererId}.`)
    registry.register(definition.rendererId, adapter)
  }
}

export function createCompleteReactAdapterRegistry(): ReactWidgetAdapterRegistry {
  const registry = createCoreReactAdapterRegistry()
  registerCommerceFormFilterReactAdapters(registry)
  return registry
}

export const completeWidgetRegistry = createCompleteWidgetRegistry()
export const completeReactAdapterRegistry = createCompleteReactAdapterRegistry()
