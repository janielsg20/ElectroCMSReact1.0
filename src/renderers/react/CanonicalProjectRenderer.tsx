import {
  Component,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type {
  BreakpointId,
  DocumentId,
  NodeId,
  ProjectTheme,
  ProjectThemeScope,
} from '../../domain'
import { compileCanonicalStyles } from '../../domain/project/style-engine'
import { compileThemeStyleTokens } from '../../domain/project/theme-engine'
import {
  renderCanonicalWidget,
  type CanonicalWidgetRenderer,
} from './canonical-widget-view'
import { ListingGridRuntime } from './ListingGridRuntime'
import { useListingRecordId } from './listing-runtime-context'
import {
  ProjectStructureRenderStore,
  type NodeRenderSnapshot,
} from './project-structure-render-store'

export interface CanonicalProjectRendererProps {
  readonly breakpointId: BreakpointId
  readonly documentId: DocumentId
  readonly renderWidget?: CanonicalWidgetRenderer
  readonly NodeFrame?: ComponentType<CanonicalNodeFrameProps>
  readonly store: ProjectStructureRenderStore
  readonly themeScope?: ProjectThemeScope
}

export interface CanonicalNodeFrameProps {
  readonly children: ReactNode
  readonly className: string
  readonly snapshot: NodeRenderSnapshot
  readonly style: CSSProperties
  readonly styleScope: string
  readonly styleSheet: string
}

interface NodeRendererProps {
  readonly breakpointId: BreakpointId
  readonly nodeId: NodeId
  readonly renderWidget: CanonicalWidgetRenderer
  readonly NodeFrame: ComponentType<CanonicalNodeFrameProps>
  readonly runtimeListings: boolean
  readonly store: ProjectStructureRenderStore
  readonly themeTokens: ReturnType<typeof compileThemeStyleTokens>
}

interface NodeErrorBoundaryProps {
  readonly children: ReactNode
  readonly nodeId: NodeId
  readonly nodeName: string
  readonly resetKey: NodeRenderSnapshot
}

interface NodeErrorBoundaryState {
  readonly failed: boolean
}

interface CanonicalNodeViewProps {
  readonly NodeFrame: ComponentType<CanonicalNodeFrameProps>
  readonly renderWidget: CanonicalWidgetRenderer
  readonly runtimeListings: boolean
  readonly snapshot: NodeRenderSnapshot
  readonly slots: Readonly<Record<string, readonly ReactNode[]>>
  readonly store: ProjectStructureRenderStore
  readonly themeTokens: ReturnType<typeof compileThemeStyleTokens>
}

function DefaultNodeFrame({ children, className, snapshot, style, styleScope, styleSheet }: CanonicalNodeFrameProps) {
  const accessibility = snapshot.accessibility
  return (
    <div
      aria-description={accessibility.description}
      aria-label={accessibility.label}
      className={`relative ${className}`.trim()}
      data-node-data-state={snapshot.dataState}
      data-node-id={snapshot.node.id}
      data-node-locked={snapshot.node.locked ? 'true' : 'false'}
      data-node-name={snapshot.node.name}
      data-style-scope={styleScope}
      role={accessibility.role}
      style={style}
      tabIndex={accessibility.tabIndex}
    >
      {styleSheet ? <style data-node-state-styles={snapshot.node.id}>{styleSheet}</style> : null}
      {children}
    </div>
  )
}

class NodeErrorBoundary extends Component<NodeErrorBoundaryProps, NodeErrorBoundaryState> {
  state: NodeErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): NodeErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(): void {
    // El diagnóstico se mantiene local. La telemetría opcional pertenece a F17/F28.
  }

  componentDidUpdate(previous: NodeErrorBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="m-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-xs text-danger" data-node-error={this.props.nodeId} role="alert">
          No se pudo renderizar “{this.props.nodeName}”. El resto del documento continúa disponible.
        </div>
      )
    }
    return this.props.children
  }
}

function NodeDataStateView({ snapshot }: { readonly snapshot: NodeRenderSnapshot }) {
  if (snapshot.dataState === 'loading') {
    return (
      <div aria-label="Estado de carga de contenido" className="grid min-h-16 place-items-center rounded-md border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground" data-data-preview="loading" role="status">
        <span><strong className="block text-foreground">Cargando contenido…</strong><span className="mt-1 block text-[0.625rem]">Preview local; no ejecuta una petición remota.</span></span>
      </div>
    )
  }
  if (snapshot.dataState === 'empty') {
    return (
      <div className="grid min-h-16 place-items-center rounded-md border border-dashed border-border bg-muted/20 p-3 text-center text-xs text-muted-foreground" data-data-preview="empty" role="status">
        <span><strong className="block text-foreground">Sin contenido</strong><span className="mt-1 block text-[0.625rem]">El binding actual no produce un valor visible.</span></span>
      </div>
    )
  }
  if (snapshot.dataState === 'error') {
    return (
      <div className="grid min-h-16 place-items-center rounded-md border border-danger/40 bg-danger/10 p-3 text-center text-xs text-danger" data-data-preview="error" role="alert">
        <span><strong className="block">No se pudo resolver el contenido</strong><span className="mt-1 block text-[0.625rem]">{snapshot.diagnostics[0]?.message ?? 'Estado de error simulado para revisar el diseño.'}</span></span>
      </div>
    )
  }
  return null
}

function CanonicalNodeView({ NodeFrame, renderWidget, runtimeListings, slots, snapshot, store, themeTokens }: CanonicalNodeViewProps) {
  const compiled = compileCanonicalStyles(snapshot.responsive.styles, { scopeId: snapshot.node.id, tokens: themeTokens })
  const dataStateView = snapshot.dataState === 'ready' ? null : <NodeDataStateView snapshot={snapshot} />
  const isListing = runtimeListings && snapshot.node.kind === 'widget' && snapshot.node.widgetType === 'dynamic.listing-grid'
  const queryId = snapshot.responsive.properties.queryId
  const listingKey = `${snapshot.node.id}:${typeof queryId === 'string' ? queryId : ''}`
  const widget = isListing
    ? <ListingGridRuntime key={listingKey} nodeId={snapshot.node.id} properties={snapshot.responsive.properties} slots={slots} store={store} />
    : renderWidget({ node: snapshot.node, responsive: snapshot.responsive, slots })

  return (
    <NodeFrame
      className={compiled.className}
      snapshot={snapshot}
      style={compiled.declarations}
      styleScope={compiled.scopeId}
      styleSheet={compiled.stateCssText}
    >
      {snapshot.node.locked ? <span className="sr-only">Nodo bloqueado.</span> : null}
      {dataStateView ?? widget}
    </NodeFrame>
  )
}

function SubscribedNodeRenderer({
  breakpointId,
  NodeFrame,
  nodeId,
  renderWidget,
  runtimeListings,
  store,
  themeTokens,
}: NodeRendererProps) {
  const contextRecordId = useListingRecordId()
  const subscribe = useCallback(
    (listener: () => void) => store.subscribeNode(nodeId, listener),
    [nodeId, store],
  )
  const getSnapshot = useCallback(
    () => store.getNodeSnapshot(nodeId, breakpointId, contextRecordId),
    [breakpointId, contextRecordId, nodeId, store],
  )
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  if (!snapshot) {
    return <div className="m-2 rounded border border-danger/40 p-2 text-xs text-danger" data-missing-node={nodeId} role="alert">Nodo no disponible: {nodeId}</div>
  }

  if (snapshot.responsive.hidden) return null

  const slotEntries: readonly (readonly [string, readonly NodeId[]])[] = snapshot.node.kind === 'component-instance'
    ? [['component', store.getComponentRootNodeIds(snapshot.node.componentId)]]
    : Object.entries(snapshot.node.slots)
  const slots = Object.fromEntries(
    slotEntries.map(([slotName, childIds]) => [
      slotName,
      childIds.map((childId) => (
        <SubscribedNodeRenderer
          breakpointId={breakpointId}
          key={childId}
          nodeId={childId}
          NodeFrame={NodeFrame}
          renderWidget={renderWidget}
          runtimeListings={runtimeListings}
          store={store}
          themeTokens={themeTokens}
        />
      )),
    ]),
  )

  return (
    <NodeErrorBoundary nodeId={nodeId} nodeName={snapshot.node.name} resetKey={snapshot}>
      <CanonicalNodeView
        NodeFrame={NodeFrame}
        renderWidget={renderWidget}
        runtimeListings={runtimeListings}
        slots={slots}
        snapshot={snapshot}
        store={store}
        themeTokens={themeTokens}
      />
    </NodeErrorBoundary>
  )
}

export function CanonicalProjectRenderer({
  breakpointId,
  documentId,
  NodeFrame = DefaultNodeFrame,
  renderWidget = renderCanonicalWidget,
  store,
  themeScope = 'frontend',
}: CanonicalProjectRendererProps) {
  const subscribe = useCallback(
    (listener: () => void) => store.subscribeDocument(documentId, listener),
    [documentId, store],
  )
  const getSnapshot = useCallback(
    () => store.getDocumentRootNodeIds(documentId),
    [documentId, store],
  )
  const rootNodeIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const subscribeTheme = useCallback((listener: () => void) => store.subscribeTheme(themeScope, listener), [store, themeScope])
  const getTheme = useCallback(() => store.getTheme(themeScope), [store, themeScope])
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme)
  const themeTokens = useMemo(() => compileThemeStyleTokens(theme.tokens), [theme.tokens])
  const document = store.getDocument(documentId)
  const runtimeListings = renderWidget === renderCanonicalWidget

  if (!document) {
    return <div className="m-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" role="alert">El documento solicitado no existe.</div>
  }

  return (
    <div
      aria-label={`Vista previa de ${document.name}`}
      data-canonical-document={document.id}
      data-project-theme={theme.name}
      data-project-theme-scope={themeScope}
      style={themeRootStyle(theme)}
    >
      {rootNodeIds.map((nodeId) => (
        <SubscribedNodeRenderer
          breakpointId={breakpointId}
          key={nodeId}
          nodeId={nodeId}
          NodeFrame={NodeFrame}
          renderWidget={renderWidget}
          runtimeListings={runtimeListings}
          store={store}
          themeTokens={themeTokens}
        />
      ))}
    </div>
  )
}

function themeRootStyle(theme: ProjectTheme): CSSProperties {
  return {
    backgroundColor: theme.tokens.color.background,
    color: theme.tokens.color.text,
    fontFamily: theme.tokens.typography.bodyFamily,
    fontSize: theme.tokens.typography.baseSize,
    lineHeight: theme.tokens.typography.lineHeight,
    minHeight: '100%',
  }
}
