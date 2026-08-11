import { createContext, useContext } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Result } from '../../domain'
import type { WidgetInsertionResult } from './editor-project-context'
import type { SavedWidgetPreset, WidgetLibraryPreferences } from './widget-library-preferences'

export const WIDGET_LIBRARY_CANVAS_DROP_ID = 'widget-library-canvas-drop'
export const WIDGET_LIBRARY_DRAG_POLICY = {
  pointerDistance: 6,
  touchDelay: 180,
  touchTolerance: 6,
} as const

export type WidgetLibrarySource =
  | { readonly kind: 'definition'; readonly widgetId: string }
  | { readonly kind: 'saved'; readonly presetId: string }

export interface WidgetLibraryContextValue {
  readonly activeSource: WidgetLibrarySource | null
  readonly preferences: WidgetLibraryPreferences
  readonly status: string
  insertSource(source: WidgetLibrarySource): Promise<Result<WidgetInsertionResult, string>>
  removeSaved(presetId: string): void
  saveSelectedWidget(): SavedWidgetPreset | null
  toggleFavorite(widgetId: string): void
}

export const WidgetLibraryContext = createContext<WidgetLibraryContextValue | null>(null)

export function useWidgetLibrary(): WidgetLibraryContextValue {
  const value = useContext(WidgetLibraryContext)
  if (!value) throw new Error('La biblioteca requiere WidgetLibraryProvider.')
  return value
}

export function useWidgetLibraryCanvasDrop() {
  const library = useWidgetLibrary()
  const { isOver, setNodeRef } = useDroppable({ id: WIDGET_LIBRARY_CANVAS_DROP_ID })
  return { active: library.activeSource !== null, isOver, setNodeRef }
}

export function widgetLibraryDragId(source: WidgetLibrarySource): string {
  return source.kind === 'definition' ? `widget-definition:${source.widgetId}` : `widget-saved:${source.presetId}`
}
