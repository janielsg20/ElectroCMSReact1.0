import {
  Component,
  useCallback,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type {
  BreakpointId,
  DocumentId,
  NodeId,
} from '../../domain'
import {
  renderCanonicalWidget,
  type CanonicalWidgetRenderer,
} from './canonical-widget-view'
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
}

export interface CanonicalNodeFrameProps {
  readonly children: ReactNode
  readonly snapshot: NodeRenderSnapshot
  readonly style: CSSProperties
}

interface NodeRendererProps {
  readonly breakpointId: BreakpointId
  readonly nodeId: NodeId
  readonly renderWidget: CanonicalWidgetRenderer
  readonly NodeFrame: ComponentType<CanonicalNodeFrameProps>
  readonly store: ProjectStructureRenderStore
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
  readonly snapshot: NodeRenderSnapshot
  readonly slots: Readonly<Record<string, readonly ReactNode[]>>
}

const layoutStyleKeys = [
  'height',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'width',
] as const satisfies readonly (keyof CSSProperties)[]

function canonicalLayoutStyle(styles: Readonly<Record<string, unknown>>): CSSProperties {
  const result: Record<string, number | string> = { boxSizing: 'border-box' }
  for (const key of layoutStyleKeys) {
    const value = styles[key]
    if (typeof value === 'number' && Number.isFinite(value)) result[key] = value
  }
  if (typeof result.width === 'number') result.maxWidth = '100%'
  return result
}

function DefaultNodeFrame({ children, snapshot, style }: CanonicalNodeFrameProps) {
  return (
    <div
      className="relative"
      data-node-id={snapshot.node.id}
      data-node-locked={snapshot.node.locked ? 'true' : 'false'}
      data-node-name={snapshot.node.name}
      style={style}
    >
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

function CanonicalNodeView({ NodeFrame, renderWidget, slots, snapshot }: CanonicalNodeViewProps) {
  return (
    <NodeFrame snapshot={snapshot} style={canonicalLayoutStyle(snapshot.responsive.styles)}>
      {snapshot.node.locked ? <span className="sr-only">Nodo bloqueado.</span> : null}
      {renderWidget({ node: snapshot.node, responsive: snapshot.responsive, slots })}
    </NodeFrame>
  )
}

function SubscribedNodeRenderer({
  breakpointId,
  NodeFrame,
  nodeId,
  renderWidget,
  store,
}: NodeRendererProps) {
  const subscribe = useCallback(
    (listener: () => void) => store.subscribeNode(nodeId, listener),
    [nodeId, store],
  )
  const getSnapshot = useCallback(
    () => store.getNodeSnapshot(nodeId, breakpointId),
    [breakpointId, nodeId, store],
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
          store={store}
        />
      )),
    ]),
  )

  return (
    <NodeErrorBoundary nodeId={nodeId} nodeName={snapshot.node.name} resetKey={snapshot}>
      <CanonicalNodeView NodeFrame={NodeFrame} renderWidget={renderWidget} slots={slots} snapshot={snapshot} />
    </NodeErrorBoundary>
  )
}

export function CanonicalProjectRenderer({
  breakpointId,
  documentId,
  NodeFrame = DefaultNodeFrame,
  renderWidget = renderCanonicalWidget,
  store,
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
  const document = store.getDocument(documentId)

  if (!document) {
    return <div className="m-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" role="alert">El documento solicitado no existe.</div>
  }

  return (
    <div aria-label={`Vista previa de ${document.name}`} data-canonical-document={document.id}>
      {rootNodeIds.map((nodeId) => (
        <SubscribedNodeRenderer
          breakpointId={breakpointId}
          key={nodeId}
          nodeId={nodeId}
          NodeFrame={NodeFrame}
          renderWidget={renderWidget}
          store={store}
        />
      ))}
    </div>
  )
}
