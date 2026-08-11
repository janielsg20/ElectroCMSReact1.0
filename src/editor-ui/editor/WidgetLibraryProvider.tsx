import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { createCompleteWidgetRegistry, failure, type Node, type Result, type WidgetDefinition } from '../../domain'
import { useEditorProject, useEditorSelection, type WidgetInsertionResult } from './editor-project-context'
import {
  WidgetLibraryContext,
  WIDGET_LIBRARY_CANVAS_DROP_ID,
  WIDGET_LIBRARY_DRAG_POLICY,
  type WidgetLibraryContextValue,
  type WidgetLibrarySource,
} from './widget-library-context'
import {
  addSavedWidget,
  BrowserWidgetLibraryPreferencesStore,
  createSavedWidgetPreset,
  recordRecentWidget,
  removeSavedWidget,
  toggleFavoriteWidget,
  type SavedWidgetPreset,
  type WidgetLibraryPreferences,
} from './widget-library-preferences'

const registry = createCompleteWidgetRegistry()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sourceFromDragEvent(event: DragStartEvent): WidgetLibrarySource | null {
  const data: unknown = event.active.data.current
  if (!isRecord(data)) return null
  const source = data.source
  if (!isRecord(source)) return null
  if (source.kind === 'definition' && typeof source.widgetId === 'string') return { kind: 'definition', widgetId: source.widgetId }
  if (source.kind === 'saved' && typeof source.presetId === 'string') return { kind: 'saved', presetId: source.presetId }
  return null
}

function normalizedPreferences(preferences: WidgetLibraryPreferences): WidgetLibraryPreferences {
  const known = new Set(registry.list().map((definition) => definition.id))
  return {
    ...preferences,
    favoriteWidgetIds: preferences.favoriteWidgetIds.filter((id) => known.has(id)),
    recentWidgetIds: preferences.recentWidgetIds.filter((id) => known.has(id)),
    savedWidgets: preferences.savedWidgets.filter((preset) => known.has(preset.widgetType)),
  }
}

function definitionForSource(source: WidgetLibrarySource, preferences: WidgetLibraryPreferences): { definition: WidgetDefinition; preset?: SavedWidgetPreset } | null {
  const preset = source.kind === 'saved' ? preferences.savedWidgets.find((candidate) => candidate.id === source.presetId) : undefined
  const widgetId = source.kind === 'definition' ? source.widgetId : preset?.widgetType
  const definition = widgetId ? registry.get(widgetId) : undefined
  return definition ? { definition, preset } : null
}

export function WidgetLibraryProvider({ children }: PropsWithChildren) {
  const session = useEditorProject()
  const selection = useEditorSelection()
  const [store] = useState(() => new BrowserWidgetLibraryPreferencesStore(window.localStorage))
  const [preferences, setPreferences] = useState(() => normalizedPreferences(store.load()))
  const [activeSource, setActiveSource] = useState<WidgetLibrarySource | null>(null)
  const [status, setStatus] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: WIDGET_LIBRARY_DRAG_POLICY.pointerDistance } }),
    useSensor(TouchSensor, { activationConstraint: { delay: WIDGET_LIBRARY_DRAG_POLICY.touchDelay, tolerance: WIDGET_LIBRARY_DRAG_POLICY.touchTolerance } }),
    useSensor(KeyboardSensor),
  )

  const updatePreferences = useCallback((update: (current: WidgetLibraryPreferences) => WidgetLibraryPreferences) => {
    setPreferences((current) => {
      const next = update(current)
      store.save(next)
      return next
    })
  }, [store])

  const insertSource = useCallback(async (source: WidgetLibrarySource): Promise<Result<WidgetInsertionResult, string>> => {
    const resolved = definitionForSource(source, preferences)
    if (!resolved) {
      const message = 'El elemento de biblioteca ya no está disponible.'
      setStatus(message)
      return failure(message)
    }
    const { definition, preset } = resolved
    const inserted = await session.insertWidget(definition.id, selection.getSelectedNodeId(), preset ? {
      name: preset.label,
      properties: preset.properties,
      responsive: preset.responsive,
      styles: preset.styles,
    } : undefined)
    if (!inserted.ok) {
      setStatus(inserted.error)
      return inserted
    }
    selection.selectNode(inserted.value.nodeId)
    updatePreferences((current) => recordRecentWidget(current, definition.id))
    setStatus(`${preset?.label ?? definition.label} insertado en el documento.`)
    return inserted
  }, [preferences, selection, session, updatePreferences])

  const toggleFavorite = useCallback((widgetId: string) => {
    updatePreferences((current) => toggleFavoriteWidget(current, widgetId))
  }, [updatePreferences])

  const removeSaved = useCallback((presetId: string) => {
    updatePreferences((current) => removeSavedWidget(current, presetId))
    setStatus('Widget guardado eliminado de la biblioteca.')
  }, [updatePreferences])

  const saveSelectedWidget = useCallback((): SavedWidgetPreset | null => {
    const selectedNodeId = selection.getSelectedNodeId()
    const document = session.store.structure.documents[session.documentId]
    const node: Node | undefined = selectedNodeId && document ? document.nodes[selectedNodeId] : undefined
    if (!node || node.kind !== 'widget') {
      setStatus('Selecciona un widget del documento para guardarlo.')
      return null
    }
    const definition = registry.get(node.widgetType)
    if (!definition) {
      setStatus('El widget seleccionado no pertenece al registro actual.')
      return null
    }
    const preset = createSavedWidgetPreset(node, `${node.name} guardado`)
    if (!preset) {
      setStatus('No se pudo validar el widget guardado.')
      return null
    }
    updatePreferences((current) => addSavedWidget(current, preset))
    setStatus(`${preset.label} añadido a Guardados.`)
    return preset
  }, [selection, session.documentId, session.store, updatePreferences])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveSource(sourceFromDragEvent(event))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const source = sourceFromDragEvent(event)
    setActiveSource(null)
    if (source && event.over?.id === WIDGET_LIBRARY_CANVAS_DROP_ID) void insertSource(source)
  }, [insertSource])

  const value = useMemo<WidgetLibraryContextValue>(() => ({
    activeSource,
    insertSource,
    preferences,
    removeSaved,
    saveSelectedWidget,
    status,
    toggleFavorite,
  }), [activeSource, insertSource, preferences, removeSaved, saveSelectedWidget, status, toggleFavorite])
  const activeItem = activeSource ? definitionForSource(activeSource, preferences) : null

  return (
    <WidgetLibraryContext value={value}>
      <DndContext
        accessibility={{
          announcements: {
            onDragCancel: () => 'Inserción cancelada.',
            onDragEnd: ({ over }) => over?.id === WIDGET_LIBRARY_CANVAS_DROP_ID ? 'Elemento soltado en el canvas.' : 'Elemento no insertado.',
            onDragMove: ({ over }) => over?.id === WIDGET_LIBRARY_CANVAS_DROP_ID ? 'Sobre el canvas.' : 'Fuera del canvas.',
            onDragOver: ({ over }) => over?.id === WIDGET_LIBRARY_CANVAS_DROP_ID ? 'Canvas disponible como destino.' : undefined,
            onDragStart: () => 'Elemento levantado. Muévelo al canvas y pulsa espacio para insertar.',
          },
          screenReaderInstructions: { draggable: 'Pulsa espacio para levantar. Usa las flechas para mover al canvas y vuelve a pulsar espacio para insertar.' },
        }}
        onDragCancel={() => setActiveSource(null)}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeItem ? <div className="rounded-md border border-primary bg-surface px-3 py-2 text-xs font-bold text-foreground shadow-lg">{activeItem.preset?.label ?? activeItem.definition.label}</div> : null}
        </DragOverlay>
      </DndContext>
    </WidgetLibraryContext>
  )
}
