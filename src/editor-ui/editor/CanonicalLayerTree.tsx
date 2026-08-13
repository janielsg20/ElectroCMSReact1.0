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
import { useEffect, useMemo, useRef, useState } from 'react'
import type { NodeId } from '../../domain'
import { ChoiceField, Icon, type IconName } from '../primitives'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId, useEditorSelection } from './editor-project-context'
import {
  buildLayerTreeEntries,
  dragPlacement,
  hasLayerChildren,
  layerAncestorIds,
  LAYER_DRAG_POLICY,
  placementRelativeTo,
  visibleLayerTreeEntries,
  type LayerTreeEntry,
  type MoveRelation,
} from './layer-tree-model'

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
  readonly expanded: boolean
  readonly insertion: { readonly id: NodeId; readonly edge: 'before' | 'after' } | null
  readonly selected: boolean
  readonly onOpenMove: (nodeId: NodeId) => void
  readonly onRequestDelete: (nodeId: NodeId) => void
  readonly onSelect: (nodeId: NodeId) => void
  readonly onToggle: (nodeId: NodeId) => void
}

function SortableLayer({ activeId, entry, expanded, insertion, selected, onOpenMove, onRequestDelete, onSelect, onToggle }: SortableLayerProps) {
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
  const hasChildren = hasLayerChildren(entry)

  return (
    <li
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={entry.depth + 1}
      aria-selected={selected}
      className={`relative ${isInsertionTarget && insertion.edge === 'before' ? 'border-t-2 border-primary' : ''} ${isInsertionTarget && insertion.edge === 'after' ? 'border-b-2 border-primary' : ''}`}
      ref={setNodeRef}
      role="treeitem"
      style={style}
    >
      <div
        className={`layer-option layer-option--depth-${Math.min(entry.depth, 6)} flex min-h-11 items-center gap-0.5 rounded-md pr-1 text-xs transition-[background-color,color,box-shadow] lg:min-h-9 ${selected ? 'layer-option--selected bg-primary-soft font-semibold text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        data-selected={selected ? 'true' : 'false'}
        style={{ paddingLeft: `${2 + entry.depth * 10}px` }}
      >
        {hasChildren ? (
          <button
            aria-label={expanded ? `Contraer ${entry.node.name}` : `Expandir ${entry.node.name}`}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus lg:size-8"
            onClick={() => onToggle(entry.node.id)}
            type="button"
          >
            <Icon className={`transition-transform ${expanded ? '' : '-rotate-90'}`} name="chevron-down" size={13} />
          </button>
        ) : <span aria-hidden="true" className="block size-11 shrink-0 lg:size-8" />}
        <button
          aria-description="Arrastra para reordenar la capa. También puedes usar el menú de acciones para moverla sin arrastrar."
          aria-label={entry.node.locked ? `${entry.node.name}, bloqueada` : `Arrastrar ${entry.node.name}`}
          className={`grid size-11 shrink-0 place-items-center rounded touch-none focus-visible:ring-2 focus-visible:ring-focus lg:size-8 ${entry.node.locked ? 'cursor-not-allowed opacity-50' : 'cursor-grab hover:bg-primary-soft active:cursor-grabbing'}`}
          disabled={entry.node.locked}
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
        >
          <Icon name={entry.node.locked ? 'lock' : 'move'} size={13} />
        </button>
        <button aria-label={entry.node.name} className="flex min-h-11 min-w-11 flex-1 cursor-pointer items-center gap-1.5 rounded px-1 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-8 lg:min-w-0" onClick={() => onSelect(entry.node.id)} type="button">
          <Icon className="shrink-0" name={nodeIcon(entry)} size={14} />
          <span className="truncate">{entry.node.name}</span>
          {entry.node.hidden ? <><Icon name="eye" size={12} /><span className="sr-only">Oculta</span></> : null}
        </button>
        <button
          aria-expanded={activeId === entry.node.id}
          aria-label={`Mover ${entry.node.name} mediante menú`}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus lg:size-8"
          disabled={entry.node.locked}
          onClick={() => onOpenMove(entry.node.id)}
          type="button"
        >
          <Icon name="more" size={13} />
        </button>
        {selected ? <button aria-label={`Eliminar ${entry.node.name}`} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:size-8" disabled={entry.node.locked} onClick={() => onRequestDelete(entry.node.id)} type="button"><Icon name="trash" size={13} /></button> : null}
      </div>
    </li>
  )
}

const relationOptions = [
  { label: 'Antes', value: 'before' },
  { label: 'Después', value: 'after' },
  { label: 'Dentro de', value: 'inside' },
] as const

export function CanonicalLayerTree() {
  const session = useEditorProject()
  const selection = useEditorSelection()
  const selectedNodeId = useEditorSelectedNodeId()
  const structure = useEditorProjectStructure()
  const document = structure.documents[session.documentId]
  const entries = useMemo(() => document ? buildLayerTreeEntries(document) : [], [document])
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.node.id, entry])), [entries])
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<NodeId>>(() => new Set<NodeId>())
  const selectedAncestors = useMemo(() => {
    if (!selectedNodeId) return [] as readonly NodeId[]
    const selectedEntry = entryById.get(selectedNodeId)
    return selectedEntry ? layerAncestorIds(selectedEntry, entries) : []
  }, [entries, entryById, selectedNodeId])
  const effectiveCollapsedIds = useMemo(() => {
    if (selectedAncestors.length === 0) return collapsedIds
    const next = new Set(collapsedIds)
    for (const ancestorId of selectedAncestors) next.delete(ancestorId)
    return next
  }, [collapsedIds, selectedAncestors])
  const visibleEntries = useMemo(() => visibleLayerTreeEntries(entries, effectiveCollapsedIds), [effectiveCollapsedIds, entries])
  const [menuNodeId, setMenuNodeId] = useState<NodeId | null>(null)
  const [deleteNodeId, setDeleteNodeId] = useState<NodeId | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [targetId, setTargetId] = useState<NodeId | ''>('')
  const [relation, setRelation] = useState<MoveRelation>('after')
  const [insertion, setInsertion] = useState<{ readonly id: NodeId; readonly edge: 'before' | 'after' } | null>(null)
  const [status, setStatus] = useState('')
  const targetOptions = useMemo(() => entries
    .filter((entry) => entry.node.id !== menuNodeId)
    .map((entry) => ({
      description: `Nivel ${entry.depth + 1}`,
      label: entry.node.name,
      value: entry.node.id,
    })), [entries, menuNodeId])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: LAYER_DRAG_POLICY.pointerDistance } }),
    useSensor(TouchSensor, { activationConstraint: { delay: LAYER_DRAG_POLICY.touchDelay, tolerance: LAYER_DRAG_POLICY.touchTolerance } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (!selectedNodeId || !session.deleteNodes) return
      event.preventDefault()
      setDeleteNodeId(selectedNodeId)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodeId, session])

  if (!document) return <p className="p-2 text-xs text-destructive">El documento activo no está disponible.</p>

  async function executeMove(nodeId: NodeId, placement: ReturnType<typeof placementRelativeTo>): Promise<void> {
    setStatus('Moviendo capa…')
    const moved = await session.moveNodes([nodeId], placement)
    setStatus(moved.ok ? 'Capa movida.' : `No se pudo mover: ${moved.error}`)
  }

  async function deleteSelected(): Promise<void> {
    if (!deleteNodeId || !session.deleteNodes) return
    const entry = entryById.get(deleteNodeId)
    setStatus(`Eliminando ${entry?.node.name ?? 'capa'}…`)
    const deleted = await session.deleteNodes([deleteNodeId])
    setDeleteNodeId(null)
    if (deleted.ok) {
      const nextSelection = entries.find((candidate) => candidate.node.id !== deleteNodeId)?.node.id
      if (nextSelection) selection.selectNode(nextSelection)
      setStatus('Capa eliminada. Puedes usar Deshacer para recuperarla.')
    } else setStatus(`No se pudo eliminar: ${deleted.error}`)
  }

  async function runSelectedAction(action: 'duplicate' | 'hide' | 'lock'): Promise<void> {
    if (!selectedNodeId) return
    const entry = entryById.get(selectedNodeId)
    if (!entry) return
    if (action === 'duplicate' && session.duplicateNodes) {
      const result = await session.duplicateNodes([selectedNodeId])
      setStatus(result.ok ? 'Capa duplicada.' : `No se pudo duplicar: ${result.error}`)
    }
    if (action === 'hide' && session.setNodesHidden) {
      const result = await session.setNodesHidden([selectedNodeId], !entry.node.hidden)
      setStatus(result.ok ? (entry.node.hidden ? 'Capa visible.' : 'Capa oculta.') : `No se pudo actualizar: ${result.error}`)
    }
    if (action === 'lock' && session.setNodesLocked) {
      const result = await session.setNodesLocked([selectedNodeId], !entry.node.locked)
      setStatus(result.ok ? (entry.node.locked ? 'Capa desbloqueada.' : 'Capa bloqueada.') : `No se pudo actualizar: ${result.error}`)
    }
  }

  async function saveRename(): Promise<void> {
    const name = renameInputRef.current?.value.trim() ?? ''
    if (!selectedNodeId || !session.renameNode || !name) return
    const result = await session.renameNode(selectedNodeId, name)
    setStatus(result.ok ? 'Nombre de capa actualizado.' : `No se pudo cambiar el nombre: ${result.error}`)
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

  function toggleNode(nodeId: NodeId): void {
    if (selectedNodeId && selectedAncestors.includes(nodeId)) selection.selectNode(nodeId)
    setCollapsedIds((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  if (entries.length === 0) {
    return (
      <div className="m-2 grid min-h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/25 p-4 text-center">
        <div><Icon className="mx-auto mb-2 text-muted-foreground" name="layers" size={20} /><p className="text-xs font-bold text-foreground">No existen capas</p><p className="mt-1 text-[0.625rem] leading-4 text-muted-foreground">Añade o arrastra un widget al lienzo para comenzar la estructura de esta página.</p></div>
      </div>
    )
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
      <SortableContext items={visibleEntries.map((entry) => entry.node.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label="Árbol de capas" role="tree">
          {visibleEntries.map((entry) => (
            <SortableLayer
              activeId={menuNodeId}
              entry={entry}
              expanded={!effectiveCollapsedIds.has(entry.node.id)}
              insertion={insertion}
              key={entry.node.id}
              onOpenMove={openMoveMenu}
              onRequestDelete={setDeleteNodeId}
              onSelect={(nodeId) => selection.selectNode(nodeId)}
              onToggle={toggleNode}
              selected={entry.node.id === selectedNodeId}
            />
          ))}
        </ul>
      </SortableContext>

      {menuNodeId ? (
        <fieldset className="mx-1 mt-1 grid gap-2 rounded-lg border border-primary/30 bg-primary-soft p-2" data-testid="layer-move-menu">
          <legend className="px-1 text-xs font-bold text-primary-strong">Mover capa sin arrastrar</legend>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Elige otra capa y coloca la selección antes, después o dentro de ella.</p>
          <ChoiceField label="Destino" onChange={(value) => setTargetId(value as NodeId)} options={targetOptions} value={targetId} />
          <ChoiceField label="Posición" onChange={(value) => setRelation(value as MoveRelation)} options={relationOptions} value={relation} />
          <div className="flex justify-end gap-1">
            <button className="min-h-11 cursor-pointer rounded-md px-3 text-xs font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={() => setMenuNodeId(null)} type="button">Cancelar</button>
            <button className="min-h-11 cursor-pointer rounded-md bg-primary px-3 text-xs font-bold text-on-primary focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9" disabled={!targetId} onClick={submitAlternativeMove} type="button">Mover</button>
          </div>
        </fieldset>
      ) : null}
      {selectedNodeId && entryById.get(selectedNodeId) ? <section aria-label="Acciones de la capa seleccionada" className="mx-1 mt-2 grid gap-2 rounded-lg border border-border bg-muted/20 p-2"><span className="text-[0.625rem] font-semibold text-muted-foreground">Acciones para {entryById.get(selectedNodeId)?.node.name}</span><form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); void saveRename() }}><label className="sr-only" htmlFor="layer-name">Nombre de la capa</label><input className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" defaultValue={entryById.get(selectedNodeId)?.node.name ?? ''} id="layer-name" key={selectedNodeId} maxLength={160} ref={renameInputRef} required /><button className="min-h-11 cursor-pointer rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9" disabled={!session.renameNode} type="submit">Renombrar</button></form><div className="flex flex-wrap gap-1"><button className="min-h-11 cursor-pointer rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9" disabled={entryById.get(selectedNodeId)?.node.locked || !session.duplicateNodes} onClick={() => void runSelectedAction('duplicate')} type="button">Duplicar</button><button className="min-h-11 cursor-pointer rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9" disabled={entryById.get(selectedNodeId)?.node.locked || !session.setNodesHidden} onClick={() => void runSelectedAction('hide')} type="button">{entryById.get(selectedNodeId)?.node.hidden ? 'Mostrar' : 'Ocultar'}</button><button className="min-h-11 cursor-pointer rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9" disabled={!session.setNodesLocked} onClick={() => void runSelectedAction('lock')} type="button">{entryById.get(selectedNodeId)?.node.locked ? 'Desbloquear' : 'Bloquear'}</button><button className="min-h-11 cursor-pointer rounded-md border border-danger/40 bg-surface px-3 text-xs font-semibold text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-9" disabled={entryById.get(selectedNodeId)?.node.locked || !session.deleteNodes} onClick={() => setDeleteNodeId(selectedNodeId)} type="button">Eliminar</button></div></section> : null}
      {deleteNodeId ? <section aria-labelledby="delete-layer-title" className="mx-1 mt-2 grid gap-2 rounded-lg border border-danger/40 bg-danger-soft p-2"><h3 className="text-xs font-bold text-foreground" id="delete-layer-title">¿Eliminar {entryById.get(deleteNodeId)?.node.name ?? 'esta capa'}?</h3><p className="text-[0.625rem] leading-4 text-muted-foreground">También se eliminarán los elementos que contiene. Podrás recuperarlos con Deshacer.</p><div className="flex justify-end gap-1"><button className="min-h-11 cursor-pointer rounded-md px-3 text-xs font-semibold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={() => setDeleteNodeId(null)} type="button">Cancelar</button><button className="min-h-11 cursor-pointer rounded-md bg-danger px-3 text-xs font-bold text-on-primary focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={() => void deleteSelected()} type="button">Eliminar capa</button></div></section> : null}
      <p aria-live="polite" className="sr-only">{status}</p>
    </DndContext>
  )
}
