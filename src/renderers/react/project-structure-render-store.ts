import {
  failure,
  resolveValidatedNodeResponsiveState,
  success,
  validateProjectStructure,
  type BreakpointId,
  type Document,
  type DocumentId,
  type GlobalComponent,
  type GlobalComponentId,
  type Node,
  type NodeId,
  type ProjectStructure,
  type ResolvedNodeResponsiveState,
  type Result,
  type StructureDiagnostic,
} from '../../domain'

type StructureTree = Document | GlobalComponent
type Listener = () => void
const EMPTY_NODE_IDS: readonly NodeId[] = Object.freeze([])

export interface NodeRenderSnapshot {
  readonly node: Node
  readonly responsive: ResolvedNodeResponsiveState
}

interface CachedNodeSnapshot {
  readonly breakpointId: BreakpointId
  readonly breakpoints: ProjectStructure['breakpoints']
  readonly node: Node
  readonly snapshot: NodeRenderSnapshot
}

function sameIds(previous: readonly NodeId[], next: readonly NodeId[]): boolean {
  return previous.length === next.length && previous.every((id, index) => id === next[index])
}

function sameJson(previous: unknown, next: unknown): boolean {
  return previous === next || JSON.stringify(previous) === JSON.stringify(next)
}

function indexNodeOwners(structure: ProjectStructure): ReadonlyMap<NodeId, StructureTree> {
  const owners = new Map<NodeId, StructureTree>()
  const trees: readonly StructureTree[] = [
    ...Object.values(structure.documents),
    ...Object.values(structure.globalComponents),
  ]

  for (const tree of trees) {
    for (const node of Object.values(tree.nodes)) owners.set(node.id, tree)
  }
  return owners
}

/**
 * Adaptador observable del modelo normalizado para React.
 *
 * Conserva ProjectStructure como única fuente de verdad y notifica por ID. Un
 * cambio inmutable en un nodo no fuerza renders de sus ancestros o hermanos.
 */
export class ProjectStructureRenderStore {
  readonly #documentListeners = new Map<DocumentId, Set<Listener>>()
  readonly #nodeListeners = new Map<NodeId, Set<Listener>>()
  readonly #structureListeners = new Set<Listener>()
  readonly #snapshotCache = new Map<NodeId, CachedNodeSnapshot>()
  #nodeOwners: ReadonlyMap<NodeId, StructureTree>
  #structure: ProjectStructure

  constructor(input: unknown) {
    const validated = validateProjectStructure(input)
    if (!validated.ok) {
      throw new Error(`ProjectStructure inválido para renderer: ${validated.error.map((item) => item.message).join(' ')}`)
    }
    this.#structure = validated.value
    this.#nodeOwners = indexNodeOwners(validated.value)
  }

  get structure(): ProjectStructure {
    return this.#structure
  }

  getDocument(documentId: DocumentId): Document | undefined {
    return this.#structure.documents[documentId]
  }

  getDocumentRootNodeIds(documentId: DocumentId): readonly NodeId[] {
    return this.getDocument(documentId)?.rootNodeIds ?? EMPTY_NODE_IDS
  }

  getComponentRootNodeIds(componentId: GlobalComponentId): readonly NodeId[] {
    return this.#structure.globalComponents[componentId]?.rootNodeIds ?? EMPTY_NODE_IDS
  }

  getNodeSnapshot(
    nodeId: NodeId,
    breakpointId: BreakpointId,
  ): NodeRenderSnapshot | undefined {
    const node = this.#nodeOwners.get(nodeId)?.nodes[nodeId]
    if (!node) return undefined

    const cached = this.#snapshotCache.get(nodeId)
    if (
      cached?.node === node
      && cached.breakpointId === breakpointId
      && cached.breakpoints === this.#structure.breakpoints
    ) {
      return cached.snapshot
    }

    const resolved = resolveValidatedNodeResponsiveState(this.#structure, node, breakpointId)
    if (!resolved.ok) return undefined

    const snapshot = { node, responsive: resolved.value } satisfies NodeRenderSnapshot
    this.#snapshotCache.set(nodeId, {
      breakpointId,
      breakpoints: this.#structure.breakpoints,
      node,
      snapshot,
    })
    return snapshot
  }

  subscribeDocument(documentId: DocumentId, listener: Listener): () => void {
    return this.#subscribe(this.#documentListeners, documentId, listener)
  }

  subscribeNode(nodeId: NodeId, listener: Listener): () => void {
    return this.#subscribe(this.#nodeListeners, nodeId, listener)
  }

  subscribeStructure(listener: Listener): () => void {
    this.#structureListeners.add(listener)
    return () => this.#structureListeners.delete(listener)
  }

  replaceStructure(
    input: unknown,
  ): Result<ProjectStructure, readonly StructureDiagnostic[]> {
    const validated = validateProjectStructure(input)
    if (!validated.ok) return failure(validated.error)

    const previous = this.#structure
    const next = validated.value
    const breakpointsChanged = !sameJson(previous.breakpoints, next.breakpoints)
    const nextOwners = indexNodeOwners(next)
    const nodeIds = new Set<NodeId>([
      ...this.#nodeOwners.keys(),
      ...nextOwners.keys(),
    ])
    const documentIds = new Set<DocumentId>([
      ...Object.values(previous.documents).map((document) => document.id),
      ...Object.values(next.documents).map((document) => document.id),
    ])

    this.#structure = next
    this.#nodeOwners = nextOwners
    this.#emit(this.#structureListeners)

    for (const nodeId of nodeIds) {
      const previousNode = this.#findNode(previous, nodeId)
      const nextNode = nextOwners.get(nodeId)?.nodes[nodeId]
      const referencedComponentChanged = (
        previousNode?.kind === 'component-instance'
        || nextNode?.kind === 'component-instance'
      ) && !sameJson(
        previousNode?.kind === 'component-instance'
          ? previous.globalComponents[previousNode.componentId]?.rootNodeIds
          : undefined,
        nextNode?.kind === 'component-instance'
          ? next.globalComponents[nextNode.componentId]?.rootNodeIds
          : undefined,
      )
      if (breakpointsChanged || referencedComponentChanged || !sameJson(previousNode, nextNode)) {
        this.#snapshotCache.delete(nodeId)
        this.#emit(this.#nodeListeners.get(nodeId))
      }
    }

    for (const documentId of documentIds) {
      const previousRoots = previous.documents[documentId]?.rootNodeIds ?? []
      const nextRoots = next.documents[documentId]?.rootNodeIds ?? []
      const documentChanged = !sameJson(
        previous.documents[documentId] && {
          id: previous.documents[documentId].id,
          kind: previous.documents[documentId].kind,
          name: previous.documents[documentId].name,
        },
        next.documents[documentId] && {
          id: next.documents[documentId].id,
          kind: next.documents[documentId].kind,
          name: next.documents[documentId].name,
        },
      )
      if (documentChanged || !sameIds(previousRoots, nextRoots)) {
        this.#emit(this.#documentListeners.get(documentId))
      }
    }

    return success(next)
  }

  #emit(listeners: ReadonlySet<Listener> | undefined): void {
    if (!listeners) return
    for (const listener of [...listeners]) listener()
  }

  #findNode(structure: ProjectStructure, nodeId: NodeId): Node | undefined {
    const trees: readonly StructureTree[] = [
      ...Object.values(structure.documents),
      ...Object.values(structure.globalComponents),
    ]
    for (const tree of trees) {
      const node = tree.nodes[nodeId]
      if (node) return node
    }
    return undefined
  }

  #subscribe<TKey>(
    registry: Map<TKey, Set<Listener>>,
    key: TKey,
    listener: Listener,
  ): () => void {
    const listeners = registry.get(key) ?? new Set<Listener>()
    listeners.add(listener)
    registry.set(key, listeners)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) registry.delete(key)
    }
  }
}
