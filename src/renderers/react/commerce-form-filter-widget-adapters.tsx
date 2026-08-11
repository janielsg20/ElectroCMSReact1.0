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
    ? <button className="inline-flex min-h-11 items-center rounded border px-4" disabled type="button">{text(properties, labelKey)}</button>
    : <a className="inline-flex min-h-11 items-center rounded border px-4" href={href}>{text(properties, labelKey)}</a>
}

function emptyState(message: string, source?: string): ReactNode {
  return <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500" data-widget-source={source || undefined}>{message}</div>
}

const commerceAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.commerce.product-card': ({ properties }) => <article className="rounded border p-4"><h3><a href={safeHref(text(properties, 'href', '#'))}>{text(properties, 'title')}</a></h3><p>{text(properties, 'price')}</p></article>,
  'react.commerce.product-grid': ({ properties, slots }) => hasChildren(slots) ? <div className="grid gap-3" data-query={text(properties, 'queryId')} style={{ gridTemplateColumns: `repeat(${number(properties, 'columns', 3)}, minmax(0, 1fr))` }}>{children(slots)}</div> : emptyState(text(properties, 'emptyMessage'), text(properties, 'queryId')),
  'react.commerce.price': ({ properties }) => <data value={text(properties, 'value')}>{text(properties, 'currency')} {text(properties, 'value')}</data>,
  'react.commerce.previous-price': ({ properties }) => <del>{text(properties, 'currency')} {text(properties, 'value')}</del>,
  'react.commerce.variations': ({ properties }) => <label>{text(properties, 'label')}<select defaultValue="">{<option value="">Seleccionar</option>}{strings(properties, 'options').map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>,
  'react.commerce.buy-button': ({ properties }) => actionLink(properties, 'label'),
  'react.commerce.add-to-cart': ({ properties }) => <span data-product-id={text(properties, 'productId') || undefined}>{actionLink(properties, 'label')}</span>,
  'react.commerce.cart-count': ({ properties }) => <output aria-label={text(properties, 'label')}>{number(properties, 'count')}</output>,
  'react.commerce.inventory': ({ properties }) => <output aria-label={text(properties, 'label')}>{number(properties, 'quantity')}</output>,
  'react.commerce.stock-badge': ({ properties }) => <span data-stock={text(properties, 'state')} role="status">{text(properties, 'label')}</span>,
  'react.commerce.wishlist': ({ properties }) => <output aria-label={text(properties, 'label')} data-item-id={text(properties, 'itemId') || undefined} role="status">{boolean(properties, 'active') ? 'Guardado' : 'No guardado'}</output>,
  'react.commerce.checkout': ({ properties }) => <section aria-label="Checkout" data-checkout-state={text(properties, 'state')}>{emptyState(text(properties, 'message'))}</section>,
  'react.commerce.order-summary': ({ properties }) => <section aria-label="Resumen de pedido"><ul>{strings(properties, 'items').map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul><strong>Total: {text(properties, 'total')}</strong></section>,
  'react.commerce.product-gallery': ({ properties }) => <div aria-label={text(properties, 'alt')} className="grid grid-cols-2 gap-2" role="list">{strings(properties, 'images').map((source, index) => <img alt={`${text(properties, 'alt')} ${index + 1}`} key={`${source}-${index}`} role="listitem" src={safeMedia(source)} />)}</div>,
  'react.commerce.related-products': ({ properties, slots }) => hasChildren(slots) ? <div data-query={text(properties, 'queryId')}>{children(slots)}</div> : emptyState(text(properties, 'emptyMessage'), text(properties, 'queryId')),
}

function preventSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault()
}

function inputAdapter(type: InputHTMLAttributes<HTMLInputElement>['type']): RegisteredWidgetAdapter {
  return ({ properties }) => <label>{text(properties, 'label')}<input defaultValue={text(properties, 'value')} name={text(properties, 'name')} required={boolean(properties, 'required')} type={type} /></label>
}

function choiceAdapter(type: 'checkbox' | 'radio'): RegisteredWidgetAdapter {
  return ({ properties }) => <fieldset><legend>{text(properties, 'label')}</legend>{strings(properties, 'options').map((option, index) => <label key={`${option}-${index}`}><input defaultChecked={type === 'radio' ? text(properties, 'value') === option : strings(properties, 'selected').includes(option)} name={text(properties, 'name') || text(properties, 'label')} type={type} value={option} />{option}</label>)}</fieldset>
}

const formAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.form.container': ({ properties, slots }) => <form aria-label={text(properties, 'label')} data-action={text(properties, 'action') || undefined} method={text(properties, 'method', 'post')} onSubmit={preventSubmit}>{children(slots)}</form>,
  'react.form.text': inputAdapter('text'),
  'react.form.number': ({ properties }) => <label>{text(properties, 'label')}<input defaultValue={number(properties, 'value')} max={number(properties, 'max')} min={number(properties, 'min')} name={text(properties, 'name')} required={boolean(properties, 'required')} type="number" /></label>,
  'react.form.email': inputAdapter('email'),
  'react.form.phone': inputAdapter('tel'),
  'react.form.url': inputAdapter('url'),
  'react.form.textarea': ({ properties }) => <label>{text(properties, 'label')}<textarea defaultValue={text(properties, 'value')} name={text(properties, 'name')} required={boolean(properties, 'required')} rows={number(properties, 'rows', 4)} /></label>,
  'react.form.select': ({ properties }) => <label>{text(properties, 'label')}<select defaultValue={text(properties, 'value')} name={text(properties, 'name')} required={boolean(properties, 'required')}><option value="">Seleccionar</option>{strings(properties, 'options').map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>,
  'react.form.radio': choiceAdapter('radio'),
  'react.form.checkbox': ({ properties }) => <label><input defaultChecked={boolean(properties, 'value')} name={text(properties, 'name')} required={boolean(properties, 'required')} type="checkbox" />{text(properties, 'label')}</label>,
  'react.form.switch': ({ properties }) => <label><input defaultChecked={boolean(properties, 'value')} name={text(properties, 'name')} role="switch" type="checkbox" />{text(properties, 'label')}</label>,
  'react.form.date': inputAdapter('date'),
  'react.form.time': inputAdapter('time'),
  'react.form.file': ({ properties }) => <label>{text(properties, 'label')}<input accept={text(properties, 'accept') || undefined} name={text(properties, 'name')} required={boolean(properties, 'required')} type="file" /></label>,
  'react.form.image': ({ properties }) => <label>{text(properties, 'label')}<input accept={text(properties, 'accept', 'image/*')} name={text(properties, 'name')} required={boolean(properties, 'required')} type="file" /></label>,
  'react.form.repeater': ({ properties, slots }) => hasChildren(slots) ? <div data-max-items={number(properties, 'maxItems')}>{children(slots)}</div> : <ul>{strings(properties, 'items').map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>,
  'react.form.conditional-fields': ({ properties, slots }) => boolean(properties, 'matches', true) ? <div data-condition={text(properties, 'condition')}>{children(slots)}</div> : null,
  'react.form.captcha': ({ properties }) => emptyState(boolean(properties, 'enabled') ? `CAPTCHA ${text(properties, 'provider')} requiere runtime` : 'CAPTCHA deshabilitado'),
  'react.form.submit': ({ properties }) => <button disabled={boolean(properties, 'disabled', true)} type="submit">{text(properties, 'label')}</button>,
  'react.form.status-message': ({ properties }) => <p aria-live="polite" data-state={text(properties, 'state')} role={text(properties, 'state') === 'error' ? 'alert' : 'status'}>{text(properties, 'message')}</p>,
}

const filterAdapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.filter.search': ({ properties }) => <label>{text(properties, 'label')}<input defaultValue={text(properties, 'query')} type="search" /></label>,
  'react.filter.select': ({ properties }) => <label>{text(properties, 'label')}<select defaultValue={text(properties, 'value')}><option value="">Todos</option>{strings(properties, 'options').map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>,
  'react.filter.range': ({ properties }) => <label>{text(properties, 'label')}<input defaultValue={number(properties, 'value')} max={number(properties, 'max')} min={number(properties, 'min')} type="range" /></label>,
  'react.filter.checkboxes': choiceAdapter('checkbox'),
  'react.filter.radio': choiceAdapter('radio'),
  'react.filter.date': ({ properties }) => <label>{text(properties, 'label')}<input defaultValue={text(properties, 'value')} type="date" /></label>,
  'react.filter.taxonomy': ({ properties }) => <fieldset data-taxonomy={text(properties, 'taxonomy')}><legend>{text(properties, 'label')}</legend>{strings(properties, 'terms').map((term, index) => <label key={`${term}-${index}`}><input defaultChecked={strings(properties, 'selected').includes(term)} type="checkbox" value={term} />{term}</label>)}</fieldset>,
  'react.filter.sort': ({ properties }) => <label>{text(properties, 'label')}<select defaultValue={text(properties, 'value')}>{strings(properties, 'options').map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>,
  'react.filter.pagination': ({ properties }) => <nav aria-label="Paginación"><ol className="flex gap-1">{Array.from({ length: number(properties, 'totalPages', 1) }, (_, index) => <li key={index + 1}><a aria-current={index + 1 === number(properties, 'page', 1) ? 'page' : undefined} href={`#page-${index + 1}`}>{index + 1}</a></li>)}</ol></nav>,
  'react.filter.load-more': ({ properties }) => <button aria-describedby="load-more-runtime" data-requested-disabled={boolean(properties, 'disabled')} disabled type="button">{text(properties, 'state') === 'loading' ? 'Cargando…' : text(properties, 'label')}<span className="sr-only" id="load-more-runtime">Requiere proveedor de datos</span></button>,
  'react.filter.reset': ({ properties }) => <button disabled={boolean(properties, 'disabled')} type="reset">{text(properties, 'label')}</button>,
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
