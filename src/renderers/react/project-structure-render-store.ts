import {
  failure,
  resolveNodeDataState,
  resolveValidatedNodeResponsiveState,
  success,
  validateProjectStructure,
  type BindingSource,
  type BreakpointId,
  type ContentRecordId,
  type Document,
  type DocumentId,
  type GlobalComponent,
  type GlobalComponentId,
  type Node,
  type NodeAccessibility,
  type NodeDataPreviewMode,
  type NodeDataRenderState,
  type NodeId,
  type ProjectStructure,
  type ProjectTheme,
  type ProjectThemeScope,
  type ResolvedNodeResponsiveState,
  type Result,
  type StructureDiagnostic,
} from '../../domain'
import type { DataConditionDiagnostic } from '../../domain/project/data-condition-engine'

type StructureTree = Document | GlobalComponent
type Listener = () => void
const EMPTY_NODE_IDS: readonly NodeId[] = Object.freeze([])

export interface NodeRenderSnapshot {
  readonly accessibility: NodeAccessibility
  readonly dataState: NodeDataRenderState
  readonly diagnostics: readonly DataConditionDiagnostic[]
  readonly node: Node
  readonly responsive: ResolvedNodeResponsiveState
}

interface CachedNodeSnapshot {
  readonly breakpointId: BreakpointId
  readonly breakpoints: ProjectStructure['breakpoints']
  readonly contextRecordId?: ContentRecordId
  readonly node: Node
  readonly previewMode: NodeDataPreviewMode
  readonly structure: ProjectStructure
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

function contextualizeBindingSource(
  structure: ProjectStructure,
  source: BindingSource,
  contextRecordId: ContentRecordId,
): BindingSource {
  if (source.kind !== 'cms-record-field' && source.kind !== 'cms-record-property') return source
  const sourceRecord = structure.cms?.records[source.recordId]
  const contextRecord = structure.cms?.records[contextRecordId]
  if (!sourceRecord || !contextRecord || sourceRecord.contentTypeId !== contextRecord.contentTypeId) return source
  return { ...source, recordId: contextRecordId }
}

function contextualizeNode(
  structure: ProjectStructure,
  node: Node,
  contextRecordId: ContentRecordId,
): Node {
  const bindings = Object.fromEntries(
    Object.entries(node.bindings).map(([key, source]) => [
      key,
      contextualizeBindingSource(structure, source, contextRecordId),
    ]),
  ) as Record<string, BindingSource>
  const conditions = node.conditions.map((group) => ({
    ...group,
    predicates: group.predicates.map((predicate) => ({
      ...predicate,
      source: contextualizeBindingSource(structure, predicate.source, contextRecordId),
    })),
  }))
  return { ...node, bindings, conditions }
}

/**
 * Adaptador observable del modelo normalizado para React.
 *
 * Conserva ProjectStructure como única fuente de verdad y notifica por ID. Un
 * cambio inmutable en un nodo no fuerza renders de sus ancestros o hermanos.
 * Los estados de preview de datos son transitorios y nunca entran al proyecto.
 */
export class ProjectStructureRenderStore {
  readonly #documentListeners = new Map<DocumentId, Set<Listener>>()
  readonly #nodeListeners = new Map<NodeId, Set<Listener>>()
  readonly #structureListeners = new Set<Listener>()
  readonly #themeListeners = new Map<ProjectThemeScope, Set<Listener>>()
  readonly #snapshotCache = new Map<string, CachedNodeSnapshot>()
  readonly #contextSnapshotCache = new Map<string, CachedNodeSnapshot>()
  readonly #dataPreviewModes = new Map<NodeId, NodeDataPreviewMode>()
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

  getTheme(scope: ProjectThemeScope): ProjectTheme {
    return this.#structure.themes[scope]
  }

  getComponentRootNodeIds(componentId: GlobalComponentId): readonly NodeId[] {
    return this.#structure.globalComponents[componentId]?.rootNodeIds ?? EMPTY_NODE_IDS
  }

  getNodeDataPreviewMode(nodeId: NodeId): NodeDataPreviewMode {
    return this.#dataPreviewModes.get(nodeId) ?? 'auto'
  }

  setNodeDataPreviewMode(nodeId: NodeId, mode: NodeDataPreviewMode): void {
    if (!this.#nodeOwners.has(nodeId)) return
    const previous = this.getNodeDataPreviewMode(nodeId)
    if (previous === mode) return
    if (mode === 'auto') this.#dataPreviewModes.delete(nodeId)
    else this.#dataPreviewModes.set(nodeId, mode)
    this.#snapshotCache.delete(nodeId)
    this.#contextSnapshotCache.clear()
    this.#emit(this.#nodeListeners.get(nodeId))
  }

  getNodeSnapshot(
    nodeId: NodeId,
    breakpointId: BreakpointId,
    contextRecordId?: ContentRecordId,
  ): NodeRenderSnapshot | undefined {
    const node = this.#nodeOwners.get(nodeId)?.nodes[nodeId]
    if (!node) return undefined
    const previewMode = this.getNodeDataPreviewMode(nodeId)
    const cache = contextRecordId ? this.#contextSnapshotCache : this.#snapshotCache
    const cacheKey = contextRecordId ? `${nodeId}:${breakpointId}:${contextRecordId}` : nodeId

    const cached = cache.get(cacheKey)
    if (
      cached?.node === node
      && cached.breakpointId === breakpointId
      && cached.breakpoints === this.#structure.breakpoints
      && cached.contextRecordId === contextRecordId
      && cached.previewMode === previewMode
      && (Object.keys(node.bindings).length === 0 && node.conditions.length === 0 || cached.structure === this.#structure)
    ) {
      return cached.snapshot
    }

    const resolved = resolveValidatedNodeResponsiveState(this.#structure, node, breakpointId)
    if (!resolved.ok) return undefined

    const dataNode = contextRecordId ? contextualizeNode(this.#structure, node, contextRecordId) : node
    const data = resolveNodeDataState(this.#structure, dataNode, resolved.value.properties)
    const snapshot = {
      accessibility: data.accessibility,
      dataState: previewMode === 'auto' ? data.state : previewMode,
      diagnostics: data.diagnostics,
      node,
      responsive: {
        ...resolved.value,
        hidden: resolved.value.hidden || !data.visible,
        properties: data.properties,
      },
    } satisfies NodeRenderSnapshot
    cache.set(cacheKey, {
      breakpointId,
      breakpoints: this.#structure.breakpoints,
      contextRecordId,
      node,
      previewMode,
      snapshot,
      structure: this.#structure,
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

  subscribeTheme(scope: ProjectThemeScope, listener: Listener): () => void {
    return this.#subscribe(this.#themeListeners, scope, listener)
  }

  replaceStructure(
    input: unknown,
  ): Result<ProjectStructure, readonly StructureDiagnostic[]> {
    const validated = validateProjectStructure(input)
    if (!validated.ok) return failure(validated.error)

    const previous = this.#structure
    const parsed = validated.value
    const next: ProjectStructure = {
      ...parsed,
      themes: {
        backend: sameJson(previous.themes.backend, parsed.themes.backend) ? previous.themes.backend : parsed.themes.backend,
        frontend: sameJson(previous.themes.frontend, parsed.themes.frontend) ? previous.themes.frontend : parsed.themes.frontend,
      },
    }
    const breakpointsChanged = !sameJson(previous.breakpoints, next.breakpoints)
    const cmsChanged = !sameJson(previous.cms, next.cms)
    const nextOwners = indexNodeOwners(next)
    const dynamicNodeIds = new Set<NodeId>([...nextOwners.entries()]
      .filter(([nodeId, tree]) => {
        const node = tree.nodes[nodeId]
        return Boolean(node && (Object.keys(node.bindings).length > 0 || node.conditions.length > 0))
      })
      .map(([nodeId]) => nodeId))
    const notifiedNodeIds = new Set<NodeId>()
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
    this.#contextSnapshotCache.clear()
    this.#emit(this.#structureListeners)
    for (const scope of ['frontend', 'backend'] as const) {
      if (previous.themes[scope] !== next.themes[scope]) this.#emit(this.#themeListeners.get(scope))
    }

    if (cmsChanged) {
      for (const dynamicNodeId of dynamicNodeIds) {
        this.#snapshotCache.delete(dynamicNodeId)
        this.#emit(this.#nodeListeners.get(dynamicNodeId))
        notifiedNodeIds.add(dynamicNodeId)
      }
    }

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
        if (!notifiedNodeIds.has(nodeId)) {
          this.#emit(this.#nodeListeners.get(nodeId))
          notifiedNodeIds.add(nodeId)
        }
        for (const dynamicNodeId of dynamicNodeIds) {
          if (notifiedNodeIds.has(dynamicNodeId)) continue
          this.#snapshotCache.delete(dynamicNodeId)
          this.#emit(this.#nodeListeners.get(dynamicNodeId))
          notifiedNodeIds.add(dynamicNodeId)
        }
      }
    }

    for (const previewNodeId of [...this.#dataPreviewModes.keys()]) {
      if (!nextOwners.has(previewNodeId)) this.#dataPreviewModes.delete(previewNodeId)
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
