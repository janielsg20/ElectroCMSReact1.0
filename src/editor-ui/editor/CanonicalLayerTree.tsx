import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import type { NodeId } from '../../domain'
import { Icon, type IconName } from '../primitives'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId, useEditorSelection } from './editor-project-context'
import { buildLayerTreeEntries, dragPlacement, LAYER_DRAG_POLICY, placementRelativeTo, type LayerTreeEntry, type MoveRelation } from './layer-tree-model'

function nodeIcon(entry: LayerTreeEntry): IconName {
  if (entry.node.kind === 'component-instance') return 'columns'
  if (entry.node.widgetType.includes('heading')) return 'heading'
  if (entry.node.widgetType.includes('image') || entry.node.widgetType.includes('hero')) return 'image'
  if (entry.node.widgetType.includes('button') || entry.node.widgetType.includes('actions')) return 'button'
  if (entry.node.widgetType.includes('text') || entry.node.widgetType.includes('link')) return 'text'
  return 'columns'
}

interface SortableLayerProps {
  readonly activeId: NodeId | null
  readonly entry: LayerTreeEntry
  readonly insertion: { readonly id: NodeId; readonly edge: 'before' | 'after' } | null
  readonly selected: boolean
  readonly onOpenMove: (nodeId: NodeId) => void
  readonly onSelect: (nodeId: NodeId) => void
}

function SortableLayer({ activeId, entry, insertion, selected, onOpenMove, onSelect }: SortableLayerProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ disabled: entry.node.locked, id: entry.node.id })
  const style = {
    opacity: isDragging ? 0.45 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const isInsertionTarget = insertion?.id === entry.node.id

  return (
    <li
      aria-level={entry.depth + 1}
      aria-selected={selected}
      className={`relative ${isInsertionTarget && insertion.edge === 'before' ? 'border-t-2 border-primary' : ''} ${isInsertionTarget && insertion.edge === 'after' ? 'border-b-2 border-primary' : ''}`}
      ref={setNodeRef}
      role="treeitem"
      style={style}
    >
      <div
        className={`layer-option flex min-h-11 items-center gap-1 rounded-md pr-1 text-xs transition-[background-color,color,box-shadow] lg:min-h-9 ${selected ? 'layer-option--selected bg-primary-soft font-semibold text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        data-selected={selected ? 'true' : 'false'}
        style={{ paddingLeft: `${4 + entry.depth * 10}px` }}
      >
        <button
          aria-label={entry.node.locked ? `${entry.node.name}, bloqueada` : `Arrastrar ${entry.node.name}`}
          className={`grid size-9 shrink-0 place-items-center rounded touch-none focus-visible:ring-2 focus-visible:ring-focus ${entry.node.locked ? 'cursor-not-allowed opacity-50' : 'cursor-grab hover:bg-primary-soft active:cursor-grabbing'}`}
          disabled={entry.node.locked}
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
        >
          <Icon name={entry.node.locked ? 'lock' : 'more'} size={13} />
        </button>
        <button className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded text-left focus-visible:ring-2 focus-visible:ring-focus" onClick={() => onSelect(entry.node.id)} type="button">
          <Icon name={nodeIcon(entry)} size={14} />
          <span className="truncate">{entry.node.name}</span>
          {entry.node.hidden ? <span className="sr-only">Oculta</span> : null}
        </button>
        <button
          aria-expanded={activeId === entry.node.id}
          aria-label={`Mover ${entry.node.name} mediante menú`}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus"
          disabled={entry.node.locked}
          onClick={() => onOpenMove(entry.node.id)}
          type="button"
        >
          <Icon name="more" size={13} />
        </button>
      </div>
    </li>
  )
}

export function CanonicalLayerTree() {
  const session = useEditorProject()
  const selection = useEditorSelection()
  const selectedNodeId = useEditorSelectedNodeId()
  const structure = useEditorProjectStructure()
  const document = structure.documents[session.documentId]
  const entries = useMemo(() => document ? buildLayerTreeEntries(document) : [], [document])
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.node.id, entry])), [entries])
  const [menuNodeId, setMenuNodeId] = useState<NodeId | null>(null)
  const [targetId, setTargetId] = useState<NodeId | ''>('')
  const [relation, setRelation] = useState<MoveRelation>('after')
  const [insertion, setInsertion] = useState<{ readonly id: NodeId; readonly edge: 'before' | 'after' } | null>(null)
  const [status, setStatus] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: LAYER_DRAG_POLICY.pointerDistance } }),
    useSensor(TouchSensor, { activationConstraint: { delay: LAYER_DRAG_POLICY.touchDelay, tolerance: LAYER_DRAG_POLICY.touchTolerance } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!document) return <p className="p-2 text-xs text-destructive">El documento activo no está disponible.</p>

  async function executeMove(nodeId: NodeId, placement: ReturnType<typeof placementRelativeTo>): Promise<void> {
    setStatus('Moviendo capa…')
    const moved = await session.moveNodes([nodeId], placement)
    setStatus(moved.ok ? 'Capa movida.' : `No se pudo mover: ${moved.error}`)
  }

  function handleDragOver(event: DragOverEvent): void {
    const active = entryById.get(event.active.id as NodeId)
    const over = event.over ? entryById.get(event.over.id as NodeId) : undefined
    if (!active || !over || active.node.id === over.node.id) {
      setInsertion(null)
      return
    }
    setInsertion({ id: over.node.id, edge: active.parentId === over.parentId && active.slot === over.slot && active.index < over.index ? 'after' : 'before' })
  }

  function handleDragEnd(event: DragEndEvent): void {
    setInsertion(null)
    const active = entryById.get(event.active.id as NodeId)
    const over = event.over ? entryById.get(event.over.id as NodeId) : undefined
    if (!active || !over || active.node.id === over.node.id) return
    void executeMove(active.node.id, dragPlacement(active, over))
  }

  function openMoveMenu(nodeId: NodeId): void {
    setMenuNodeId((current) => current === nodeId ? null : nodeId)
    setTargetId(entries.find((entry) => entry.node.id !== nodeId)?.node.id ?? '')
    setRelation('after')
  }

  function submitAlternativeMove(): void {
    if (!menuNodeId || !targetId) return
    const target = entryById.get(targetId)
    if (!target) return
    void executeMove(menuNodeId, placementRelativeTo(target, relation)).then(() => setMenuNodeId(null))
  }

  return (
    <DndContext
      accessibility={{
        announcements: {
          onDragCancel: () => 'Movimiento cancelado.',
          onDragEnd: ({ active, over }) => over ? `${entryById.get(active.id as NodeId)?.node.name ?? 'Capa'} movida.` : 'Movimiento cancelado.',
          onDragOver: ({ over }) => over ? `Destino ${entryById.get(over.id as NodeId)?.node.name ?? 'capa'}.` : 'Sin destino.',
          onDragStart: ({ active }) => `Moviendo ${entryById.get(active.id as NodeId)?.node.name ?? 'capa'}.`,
        },
      }}
      autoScroll
      collisionDetection={closestCenter}
      onDragCancel={() => setInsertion(null)}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      sensors={sensors}
    >
      <SortableContext items={entries.map((entry) => entry.node.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label="Árbol de capas" role="tree">
          {entries.map((entry) => (
            <SortableLayer
              activeId={menuNodeId}
              entry={entry}
              insertion={insertion}
              key={entry.node.id}
              onOpenMove={openMoveMenu}
              onSelect={(nodeId) => selection.selectNode(nodeId)}
              selected={entry.node.id === selectedNodeId}
            />
          ))}
        </ul>
      </SortableContext>

      {menuNodeId ? (
        <fieldset className="mx-1 mt-1 grid gap-1 rounded-md border border-primary/30 bg-primary-soft p-2" data-testid="layer-move-menu">
          <legend className="px-1 text-xs font-bold text-primary-strong">Mover capa sin arrastrar</legend>
          <label className="grid gap-0.5 text-xs font-semibold text-foreground">
            Destino
            <select className="min-h-10 rounded border border-border bg-surface px-2 font-normal" onChange={(event) => setTargetId(event.target.value as NodeId)} value={targetId}>
              {entries.filter((entry) => entry.node.id !== menuNodeId).map((entry) => <option key={entry.node.id} value={entry.node.id}>{entry.node.name}</option>)}
            </select>
          </label>
          <label className="grid gap-0.5 text-xs font-semibold text-foreground">
            Posición
            <select className="min-h-10 rounded border border-border bg-surface px-2 font-normal" onChange={(event) => setRelation(event.target.value as MoveRelation)} value={relation}>
              <option value="before">Antes</option>
              <option value="after">Después</option>
              <option value="inside">Dentro de</option>
            </select>
          </label>
          <div className="flex justify-end gap-1">
            <button className="min-h-10 cursor-pointer rounded px-2 text-xs font-semibold hover:bg-muted" onClick={() => setMenuNodeId(null)} type="button">Cancelar</button>
            <button className="min-h-10 cursor-pointer rounded bg-primary px-2 text-xs font-bold text-on-primary" disabled={!targetId} onClick={submitAlternativeMove} type="button">Mover</button>
          </div>
        </fieldset>
      ) : null}
      <p aria-live="polite" className="sr-only">{status}</p>
    </DndContext>
  )
}
