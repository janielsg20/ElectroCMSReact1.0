import { Component, memo, useMemo, type ErrorInfo, type ReactNode } from 'react'
import { failure, success, type Result } from '../../domain/common/result'
import type { BreakpointId, DocumentId, NodeId } from '../../domain/project/identity'
import type { JsonValue } from '../../domain/project/project-envelope'
import type { Node, ProjectStructure } from '../../domain/project/structure-schema'
import { resolveNodeResponsiveState, validateProjectStructure, type StructureDiagnostic } from '../../domain/project/validate-structure'

export interface CanvasRenderSlot {
  readonly name: string
  readonly children: readonly CanvasRenderNode[]
}

export interface CanvasRenderNode {
  readonly id: NodeId
  readonly name: string
  readonly kind: Node['kind']
  readonly widgetType?: string
  readonly componentId?: string
  readonly locked: boolean
  readonly hidden: boolean
  readonly properties: Readonly<Record<string, JsonValue>>
  readonly styles: Readonly<Record<string, JsonValue>>
  readonly slots: readonly CanvasRenderSlot[]
  readonly signature: string
}

export interface CanvasDocumentRenderModel {
  readonly documentId: DocumentId
  readonly documentName: string
  readonly breakpointId: BreakpointId
  readonly roots: readonly CanvasRenderNode[]
}

export type CanvasRenderModelFailure =
  | { readonly kind: 'structure-invalid'; readonly diagnostics: readonly StructureDiagnostic[] }
  | { readonly kind: 'document-not-found'; readonly documentId: DocumentId }
  | { readonly kind: 'node-resolution-failed'; readonly nodeId: NodeId; readonly diagnostics: readonly StructureDiagnostic[] }

export interface CanvasNodeRendererContext {
  readonly node: CanvasRenderNode
  readonly children: ReactNode
}

export type CanvasNodeRenderer = (context: CanvasNodeRendererContext) => ReactNode

function signatureFor(
  node: Node,
  hidden: boolean,
  properties: Readonly<Record<string, JsonValue>>,
  styles: Readonly<Record<string, JsonValue>>,
  slots: readonly CanvasRenderSlot[],
): string {
  return JSON.stringify({
    id: node.id,
    name: node.name,
    kind: node.kind,
    widgetType: node.kind === 'widget' ? node.widgetType : undefined,
    componentId: node.kind === 'component-instance' ? node.componentId : undefined,
    locked: node.locked,
    hidden,
    properties,
    styles,
    slots: slots.map((slot) => [slot.name, slot.children.map((child) => child.signature)]),
  })
}

export function compileCanvasDocument(
  input: unknown,
  documentId: DocumentId,
  breakpointId: BreakpointId,
): Result<CanvasDocumentRenderModel, CanvasRenderModelFailure> {
  const validated = validateProjectStructure(input)
  if (!validated.ok) return failure({ kind: 'structure-invalid', diagnostics: validated.error })

  const structure = validated.value
  const document = structure.documents[documentId]
  if (!document) return failure({ kind: 'document-not-found', documentId })

  function compileNode(nodeId: NodeId): Result<CanvasRenderNode, CanvasRenderModelFailure> {
    const node = document.nodes[nodeId]
    if (!node) {
      return failure({
        kind: 'node-resolution-failed',
        nodeId,
        diagnostics: [{ code: 'missing-node-reference', message: `El nodo ${nodeId} no existe.`, path: ['documents', documentId, 'nodes', nodeId] }],
      })
    }

    const resolved = resolveNodeResponsiveState(structure, nodeId, breakpointId)
    if (!resolved.ok) return failure({ kind: 'node-resolution-failed', nodeId, diagnostics: resolved.error })

    const slots: CanvasRenderSlot[] = []
    for (const [slotName, childIds] of Object.entries(node.slots)) {
      const children: CanvasRenderNode[] = []
      for (const childId of childIds) {
        const child = compileNode(childId)
        if (!child.ok) return child
        children.push(child.value)
      }
      slots.push({ name: slotName, children })
    }

    const value: CanvasRenderNode = {
      id: node.id,
      name: node.name,
      kind: node.kind,
      ...(node.kind === 'widget' ? { widgetType: node.widgetType } : { componentId: node.componentId }),
      locked: node.locked,
      hidden: resolved.value.hidden,
      properties: resolved.value.properties,
      styles: resolved.value.styles,
      slots,
      signature: '',
    }
    return success({ ...value, signature: signatureFor(node, value.hidden, value.properties, value.styles, slots) })
  }

  const roots: CanvasRenderNode[] = []
  for (const rootId of document.rootNodeIds) {
    const root = compileNode(rootId)
    if (!root.ok) return root
    roots.push(root.value)
  }

  return success({ documentId, documentName: document.name, breakpointId, roots })
}

interface CanvasNodeBoundaryProps {
  readonly nodeId: NodeId
  readonly resetKey: string
  readonly children: ReactNode
}

interface CanvasNodeBoundaryState {
  readonly failed: boolean
}

class CanvasNodeBoundary extends Component<CanvasNodeBoundaryProps, CanvasNodeBoundaryState> {
  state: CanvasNodeBoundaryState = { failed: false }

  static getDerivedStateFromError(): CanvasNodeBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`Canvas node ${this.props.nodeId} failed to render.`, error, info.componentStack)
  }

  componentDidUpdate(previous: CanvasNodeBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="m-1 rounded border border-danger/40 bg-danger/10 px-2 py-2 text-xs text-danger" data-canvas-node-error={this.props.nodeId} role="alert">
          No se pudo renderizar este nodo. El resto del canvas continúa disponible.
        </div>
      )
    }
    return this.props.children
  }
}

interface CanvasNodeViewProps {
  readonly node: CanvasRenderNode
  readonly renderNode: CanvasNodeRenderer
  readonly onNodeRender?: (nodeId: NodeId) => void
}

interface CanvasNodeContentProps {
  readonly node: CanvasRenderNode
  readonly renderNode: CanvasNodeRenderer
  readonly children: ReactNode
}

function CanvasNodeContent({ node, renderNode, children }: CanvasNodeContentProps) {
  return renderNode({ node, children })
}

const CanvasNodeView = memo(function CanvasNodeView({ node, renderNode, onNodeRender }: CanvasNodeViewProps) {
  onNodeRender?.(node.id)
  if (node.hidden) return null

  const children = node.slots.map((slot) => (
    <div data-canvas-slot={slot.name} key={slot.name}>
      {slot.children.map((child) => (
        <CanvasNodeView key={child.id} node={child} onNodeRender={onNodeRender} renderNode={renderNode} />
      ))}
    </div>
  ))

  return (
    <CanvasNodeBoundary nodeId={node.id} resetKey={node.signature}>
      <CanvasNodeContent node={node} renderNode={renderNode}>{children}</CanvasNodeContent>
    </CanvasNodeBoundary>
  )
}, (previous, next) => (
  previous.node.signature === next.node.signature
  && previous.renderNode === next.renderNode
  && previous.onNodeRender === next.onNodeRender
))

interface CanonicalCanvasRendererProps {
  readonly structure: ProjectStructure
  readonly documentId: DocumentId
  readonly breakpointId: BreakpointId
  readonly renderNode: CanvasNodeRenderer
  readonly onNodeRender?: (nodeId: NodeId) => void
}

export function CanonicalCanvasRenderer({ structure, documentId, breakpointId, renderNode, onNodeRender }: CanonicalCanvasRendererProps) {
  const compiled = useMemo(
    () => compileCanvasDocument(structure, documentId, breakpointId),
    [breakpointId, documentId, structure],
  )

  if (!compiled.ok) {
    return (
      <div className="m-2 rounded border border-danger/40 bg-danger/10 p-3 text-xs text-danger" data-canvas-render-error role="alert">
        El documento no se puede renderizar porque su estructura canónica es inválida.
      </div>
    )
  }

  return (
    <div data-canvas-document={compiled.value.documentId} data-canvas-breakpoint={compiled.value.breakpointId}>
      {compiled.value.roots.map((root) => (
        <CanvasNodeView key={root.id} node={root} onNodeRender={onNodeRender} renderNode={renderNode} />
      ))}
    </div>
  )
}
