import type { ReactNode } from 'react'
import {
  createRegistryBackedWidgetRenderer,
} from './registered-widget-adapters'
import { completeReactAdapterRegistry, completeWidgetRegistry } from './commerce-form-filter-widget-adapters'
import type { CanonicalWidgetViewProps } from './canonical-widget-contract'

export type { CanonicalWidgetRenderer, CanonicalWidgetViewProps } from './canonical-widget-contract'

function textProperty(
  properties: Readonly<Record<string, unknown>>,
  key: string,
  fallback = '',
): string {
  const value = properties[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
}

function slotContent(
  slots: Readonly<Record<string, readonly ReactNode[]>>,
  name?: string,
): ReactNode {
  if (name) return slots[name] ?? null
  return Object.values(slots).flat()
}

function safeHref(properties: Readonly<Record<string, unknown>>): string {
  const href = textProperty(properties, 'href', '#')
  return href.startsWith('#') || href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '#'
}

/** Fallback transitorio para las familias que se registran en M06.4. */
export function renderLegacyCanonicalWidget({
  node,
  responsive,
  slots,
}: CanonicalWidgetViewProps): ReactNode {
  const properties = responsive.properties
  const namedContent = slotContent(slots, 'content')
  const content = Array.isArray(namedContent) && namedContent.length > 0
    ? namedContent
    : slotContent(slots)

  switch (node.kind === 'widget' ? node.widgetType : 'component-instance') {
    case 'layout.site-header':
      return <header className="flex min-h-12 items-center gap-3 border-b border-slate-200 px-4 sm:px-5">{content}</header>
    case 'content.brand':
      return <strong className="font-heading text-xs font-bold">{textProperty(properties, 'text', node.name)}</strong>
    case 'layout.navigation':
      return <nav aria-label={textProperty(properties, 'label', 'Navegación del sitio')} className="ml-auto hidden items-center gap-4 text-xs font-semibold sm:flex">{content}</nav>
    case 'content.link':
      return <a className="text-slate-700 hover:text-blue-700" href={safeHref(properties)}>{textProperty(properties, 'text', node.name)}</a>
    case 'layout.hero':
      return <section className="relative overflow-hidden bg-slate-50 px-5 py-9 text-slate-950 sm:px-9 sm:py-12">{content}</section>
    case 'layout.hero-content':
      return <div className="relative max-w-xl">{content}</div>
    case 'content.eyebrow':
      return <p className="font-heading text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-blue-700">{textProperty(properties, 'text', node.name)}</p>
    case 'layout.actions':
      return <div className="mt-5 flex flex-wrap gap-2">{content}</div>
    case 'layout.metrics':
      return <section className="grid grid-cols-3 gap-px bg-slate-200 text-center">{content}</section>
    case 'layout.section-heading':
      return <div className="flex items-end justify-between gap-3">{content}</div>
    case 'layout.cards':
      return <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">{content}</div>
    case 'component-instance':
      return <div>{slotContent(slots)}</div>
    default:
      return <div className="rounded border border-dashed border-slate-300 p-2" data-unsupported-widget={node.kind === 'widget' ? node.widgetType : undefined}>{Array.isArray(content) && content.length === 0 ? node.name : content}</div>
  }
}

export const renderCanonicalWidget = createRegistryBackedWidgetRenderer({
  adapterRegistry: completeReactAdapterRegistry,
  fallback: renderLegacyCanonicalWidget,
  widgetRegistry: completeWidgetRegistry,
})
