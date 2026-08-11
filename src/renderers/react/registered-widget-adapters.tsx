import { createElement, type CSSProperties, type ReactNode } from 'react'
import {
  createStructuralBasicWidgetRegistry,
} from '../../domain/widgets/structural-basic-widgets'
import type {
  WidgetDefinition,
  WidgetRegistry,
} from '../../domain/widgets/widget-registry'
import type { CanonicalWidgetRenderer, CanonicalWidgetViewProps } from './canonical-widget-contract'

export interface RegisteredWidgetAdapterProps extends CanonicalWidgetViewProps {
  readonly definition: WidgetDefinition
  readonly properties: Readonly<Record<string, unknown>>
}

export type RegisteredWidgetAdapter = (props: RegisteredWidgetAdapterProps) => ReactNode

export class ReactWidgetAdapterRegistry {
  readonly #adapters = new Map<string, RegisteredWidgetAdapter>()

  register(rendererId: string, adapter: RegisteredWidgetAdapter): void {
    if (!rendererId.trim()) throw new Error('El rendererId del adapter es obligatorio.')
    if (this.#adapters.has(rendererId)) throw new Error(`El adapter ${rendererId} ya está registrado.`)
    this.#adapters.set(rendererId, adapter)
  }

  get(rendererId: string): RegisteredWidgetAdapter | undefined {
    return this.#adapters.get(rendererId)
  }

  has(rendererId: string): boolean {
    return this.#adapters.has(rendererId)
  }

  listRendererIds(): readonly string[] {
    return [...this.#adapters.keys()]
  }
}

function content(props: RegisteredWidgetAdapterProps): ReactNode {
  return props.slots.content ?? Object.values(props.slots).flat()
}

function stringValue(properties: Readonly<Record<string, unknown>>, key: string, fallback = ''): string {
  const value = properties[key]
  return typeof value === 'string' ? value : fallback
}

function numberValue(properties: Readonly<Record<string, unknown>>, key: string, fallback = 0): number {
  const value = properties[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function booleanValue(properties: Readonly<Record<string, unknown>>, key: string, fallback = false): boolean {
  const value = properties[key]
  return typeof value === 'boolean' ? value : fallback
}

function stringList(properties: Readonly<Record<string, unknown>>, key: string): readonly string[] {
  const value = properties[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function stringRows(properties: Readonly<Record<string, unknown>>, key: string): readonly (readonly string[])[] {
  const value = properties[key]
  if (!Array.isArray(value)) return []
  return value.filter(Array.isArray).map((row) => row.filter((cell): cell is string => typeof cell === 'string'))
}

function safeMediaSource(value: string): string | undefined {
  if (!value) return undefined
  return /^(?:https?:|blob:|data:(?:image|audio|video)\/|\/|\.\/|\.\.\/)/i.test(value) ? value : undefined
}

function safeFrameSource(value: string): string {
  if (value === 'about:blank' || /^https?:\/\//i.test(value)) return value
  return 'about:blank'
}

function flexAlignment(value: string): CSSProperties['alignItems'] {
  return value === 'start' ? 'flex-start' : value === 'end' ? 'flex-end' : value
}

function flexJustification(value: string): CSSProperties['justifyContent'] {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  if (value === 'between') return 'space-between'
  return value
}

const adapters: Readonly<Record<string, RegisteredWidgetAdapter>> = {
  'react.layout.section': (props) => <section aria-label={stringValue(props.properties, 'label') || undefined} className="px-5 py-7 sm:px-9">{content(props)}</section>,
  'react.layout.container': (props) => <div className="mx-auto w-full" style={{ maxWidth: numberValue(props.properties, 'maxWidth', 1200) }}>{content(props)}</div>,
  'react.layout.flex': (props) => <div style={{ alignItems: flexAlignment(stringValue(props.properties, 'align', 'stretch')), display: 'flex', flexDirection: stringValue(props.properties, 'direction', 'row') as CSSProperties['flexDirection'], flexWrap: booleanValue(props.properties, 'wrap', true) ? 'wrap' : 'nowrap', gap: numberValue(props.properties, 'gap', 16), justifyContent: flexJustification(stringValue(props.properties, 'justify', 'start')) }}>{content(props)}</div>,
  'react.layout.grid': (props) => <div style={{ display: 'grid', gap: numberValue(props.properties, 'gap', 16), gridTemplateColumns: `repeat(${numberValue(props.properties, 'columns', 3)}, minmax(0, 1fr))` }}>{content(props)}</div>,
  'react.layout.columns': (props) => <div style={{ display: 'grid', gap: numberValue(props.properties, 'gap', 16), gridTemplateColumns: `repeat(${numberValue(props.properties, 'columns', 2)}, minmax(0, 1fr))` }}>{content(props)}</div>,
  'react.layout.row': (props) => <div style={{ alignItems: flexAlignment(stringValue(props.properties, 'align', 'center')), display: 'flex', flexWrap: 'nowrap', gap: numberValue(props.properties, 'gap', 12) }}>{content(props)}</div>,
  'react.layout.stack': (props) => <div style={{ display: 'flex', flexDirection: 'column', gap: numberValue(props.properties, 'gap', 12) }}>{content(props)}</div>,
  'react.layout.spacer': (props) => <div aria-hidden="true" style={{ blockSize: numberValue(props.properties, 'size', 32) }} />,
  'react.layout.divider': (props) => <hr aria-orientation="horizontal" style={{ border: 0, borderTop: `${numberValue(props.properties, 'thickness', 1)}px solid ${stringValue(props.properties, 'color', '#cbd5e1')}` }} />,
  'react.layout.tabs-container': (props) => <section aria-label={stringValue(props.properties, 'label')} data-active-tab={numberValue(props.properties, 'activeTab')} data-widget-container="tabs">{content(props)}</section>,
  'react.layout.accordion-container': (props) => <section aria-label={stringValue(props.properties, 'label')} data-allow-multiple={booleanValue(props.properties, 'allowMultiple') ? 'true' : 'false'} data-widget-container="accordion">{content(props)}</section>,
  'react.layout.modal': (props) => booleanValue(props.properties, 'open', true) ? <div aria-label={stringValue(props.properties, 'label')} aria-modal="true" className="rounded-lg border border-slate-300 bg-white p-4 shadow-xl" role="dialog">{content(props)}</div> : null,
  'react.layout.drawer': (props) => booleanValue(props.properties, 'open', true) ? <aside aria-label={stringValue(props.properties, 'label')} className="border border-slate-300 bg-white p-4 shadow-xl" data-side={stringValue(props.properties, 'side', 'right')}>{content(props)}</aside> : null,
  'react.layout.off-canvas': (props) => booleanValue(props.properties, 'open', true) ? <aside aria-label={stringValue(props.properties, 'label')} className="border border-dashed border-slate-300 bg-white p-4" data-side={stringValue(props.properties, 'side', 'left')}>{content(props)}</aside> : null,
  'react.layout.sticky-container': (props) => <div style={{ position: 'sticky', top: numberValue(props.properties, 'offset') }}>{content(props)}</div>,
  'react.content.text': (props) => <span>{stringValue(props.properties, 'text')}</span>,
  'react.content.heading': (props) => createElement(`h${numberValue(props.properties, 'level', 2)}`, { className: 'font-heading font-bold leading-tight' }, stringValue(props.properties, 'text')),
  'react.content.paragraph': (props) => <p className="leading-6">{stringValue(props.properties, 'text')}</p>,
  'react.content.rich-text': (props) => <div className="whitespace-pre-wrap leading-6">{stringValue(props.properties, 'content')}</div>,
  'react.media.image': (props) => {
    const src = safeMediaSource(stringValue(props.properties, 'src'))
    return src ? <img alt={stringValue(props.properties, 'alt')} className="h-auto max-w-full" src={src} /> : <div aria-label={stringValue(props.properties, 'alt')} className="grid min-h-24 place-items-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500" role="img">Sin imagen</div>
  },
  'react.media.gallery': (props) => <div aria-label={stringValue(props.properties, 'alt')} className="grid grid-cols-2 gap-2" role="list">{stringList(props.properties, 'images').map((source, index) => <img alt={`${stringValue(props.properties, 'alt')} ${index + 1}`} className="h-auto max-w-full" key={`${source}-${index}`} role="listitem" src={safeMediaSource(source)} />)}</div>,
  'react.content.icon': (props) => <span aria-label={stringValue(props.properties, 'label')} role="img">{stringValue(props.properties, 'symbol', '★')}</span>,
  'react.content.button': (props) => <a aria-disabled={booleanValue(props.properties, 'disabled') ? 'true' : undefined} className="inline-flex min-h-11 items-center rounded-md bg-blue-600 px-4 text-xs font-bold text-white" href={booleanValue(props.properties, 'disabled') ? undefined : stringValue(props.properties, 'href', '#')}>{stringValue(props.properties, 'text')}</a>,
  'react.content.logo': (props) => {
    const src = safeMediaSource(stringValue(props.properties, 'src'))
    return src ? <img alt={stringValue(props.properties, 'alt')} className="h-auto max-w-full" src={src} /> : <strong aria-label={stringValue(props.properties, 'alt')} className="font-heading font-bold">{stringValue(props.properties, 'text')}</strong>
  },
  'react.media.video': (props) => <video aria-label={stringValue(props.properties, 'caption') || undefined} className="max-w-full" controls={booleanValue(props.properties, 'controls', true)} src={safeMediaSource(stringValue(props.properties, 'src'))} />,
  'react.media.audio': (props) => <audio aria-label={stringValue(props.properties, 'label')} controls={booleanValue(props.properties, 'controls', true)} src={safeMediaSource(stringValue(props.properties, 'src'))} />,
  'react.embed.html': (props) => <pre aria-label="Fuente HTML" className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100"><code>{stringValue(props.properties, 'html')}</code></pre>,
  'react.embed.iframe': (props) => {
    const source = safeFrameSource(stringValue(props.properties, 'src'))
    return <iframe className="min-h-48 w-full border-0" sandbox="" src={source} title={stringValue(props.properties, 'title')} />
  },
  'react.embed.map': (props) => {
    const source = safeFrameSource(stringValue(props.properties, 'src'))
    return source === 'about:blank' ? <div aria-label={stringValue(props.properties, 'label')} className="grid min-h-48 place-items-center rounded bg-slate-100 text-sm" role="region">{stringValue(props.properties, 'address')}</div> : <iframe className="min-h-48 w-full border-0" loading="lazy" sandbox="allow-scripts allow-same-origin" src={source} title={stringValue(props.properties, 'label')} />
  },
  'react.visual.shape': (props) => {
    const shape = stringValue(props.properties, 'shape', 'rectangle')
    const style: CSSProperties = { aspectRatio: '1', backgroundColor: stringValue(props.properties, 'color', '#2563eb'), maxWidth: 160 }
    if (shape === 'circle') style.borderRadius = '9999px'
    if (shape === 'triangle') style.clipPath = 'polygon(50% 0, 100% 100%, 0 100%)'
    return <div aria-hidden="true" style={style} />
  },
  'react.visual.svg': (props) => <svg aria-label={stringValue(props.properties, 'label')} role="img" viewBox="0 0 24 24"><path d={stringValue(props.properties, 'path')} fill={stringValue(props.properties, 'fill', '#2563eb')} /></svg>,
  'react.content.separator': (props) => <hr style={{ border: 0, borderTop: `${numberValue(props.properties, 'thickness', 1)}px solid ${stringValue(props.properties, 'color', '#cbd5e1')}` }} />,
  'react.content.table': (props) => <div className="max-w-full overflow-x-auto"><table><caption>{stringValue(props.properties, 'caption')}</caption><thead><tr>{stringList(props.properties, 'headers').map((header, index) => <th key={`${header}-${index}`} scope="col">{header}</th>)}</tr></thead><tbody>{stringRows(props.properties, 'rows').map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>,
  'react.content.list': (props) => {
    const List = booleanValue(props.properties, 'ordered') ? 'ol' : 'ul'
    return <List>{stringList(props.properties, 'items').map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</List>
  },
  'react.content.code': (props) => <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100"><code className={`language-${stringValue(props.properties, 'language')}`}>{stringValue(props.properties, 'code')}</code></pre>,
}

export function createStructuralBasicReactAdapterRegistry(
  widgetRegistry: WidgetRegistry = structuralBasicWidgetRegistry,
): ReactWidgetAdapterRegistry {
  const registry = new ReactWidgetAdapterRegistry()
  for (const definition of widgetRegistry.list()) {
    const adapter = adapters[definition.rendererId]
    if (!adapter) throw new Error(`No existe adapter React para ${definition.rendererId}.`)
    registry.register(definition.rendererId, adapter)
  }
  return registry
}

export interface RegistryBackedRendererOptions {
  readonly adapterRegistry: ReactWidgetAdapterRegistry
  readonly fallback: CanonicalWidgetRenderer
  readonly widgetRegistry: WidgetRegistry
}

export function createRegistryBackedWidgetRenderer({
  adapterRegistry,
  fallback,
  widgetRegistry,
}: RegistryBackedRendererOptions): CanonicalWidgetRenderer {
  return (props) => {
    if (props.node.kind !== 'widget') return fallback(props)
    const definition = widgetRegistry.get(props.node.widgetType)
    if (!definition) return fallback(props)
    const parsed = definition.propertySchema.safeParse({ ...definition.defaults, ...props.responsive.properties })
    if (!parsed.success) throw new Error(`Propiedades inválidas para ${definition.id}: ${parsed.error.message}`)
    const adapter = adapterRegistry.get(definition.rendererId)
    if (!adapter) throw new Error(`No existe adapter React para ${definition.rendererId}.`)
    return adapter({ ...props, definition, properties: parsed.data })
  }
}

export function createRegisteredWidgetRenderer(
  widgetRegistry: WidgetRegistry,
  adapterRegistry: ReactWidgetAdapterRegistry,
  fallback: CanonicalWidgetRenderer,
): CanonicalWidgetRenderer {
  return createRegistryBackedWidgetRenderer({ adapterRegistry, fallback, widgetRegistry })
}

export const structuralBasicWidgetRegistry = createStructuralBasicWidgetRegistry()
export const structuralBasicReactAdapterRegistry = createStructuralBasicReactAdapterRegistry(structuralBasicWidgetRegistry)
