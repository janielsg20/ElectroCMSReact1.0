import * as z from 'zod'
import { JsonValueSchema, NodeResponsiveOverrideSchema, type Node, type NodeResponsiveOverride } from '../../domain'

const PropertyMapSchema = z.record(z.string().min(1).max(160), JsonValueSchema)

export const WIDGET_LIBRARY_PREFERENCES_VERSION = 1 as const
export const WIDGET_LIBRARY_PREFERENCES_KEY = 'electrocms.editor.library.v1'
export const MAX_RECENT_WIDGETS = 12
export const MAX_SAVED_WIDGETS = 50

export const SavedWidgetPresetSchema = z.strictObject({
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
  label: z.string().trim().min(1).max(160),
  properties: PropertyMapSchema,
  responsive: z.record(z.string().uuid(), NodeResponsiveOverrideSchema),
  styles: PropertyMapSchema,
  widgetType: z.string().trim().min(1).max(160),
})

export type SavedWidgetPreset = z.infer<typeof SavedWidgetPresetSchema>

export interface WidgetLibraryPreferences {
  readonly schemaVersion: typeof WIDGET_LIBRARY_PREFERENCES_VERSION
  readonly favoriteWidgetIds: readonly string[]
  readonly recentWidgetIds: readonly string[]
  readonly savedWidgets: readonly SavedWidgetPreset[]
}

export const WidgetLibraryPreferencesSchema: z.ZodType<WidgetLibraryPreferences> = z.strictObject({
  favoriteWidgetIds: z.array(z.string().trim().min(1).max(160)).max(500),
  recentWidgetIds: z.array(z.string().trim().min(1).max(160)).max(MAX_RECENT_WIDGETS),
  savedWidgets: z.array(SavedWidgetPresetSchema).max(MAX_SAVED_WIDGETS),
  schemaVersion: z.literal(WIDGET_LIBRARY_PREFERENCES_VERSION),
})

export const DEFAULT_WIDGET_LIBRARY_PREFERENCES: WidgetLibraryPreferences = {
  favoriteWidgetIds: [],
  recentWidgetIds: [],
  savedWidgets: [],
  schemaVersion: WIDGET_LIBRARY_PREFERENCES_VERSION,
}

export interface WidgetLibraryPreferencesStore {
  load(): WidgetLibraryPreferences
  save(preferences: WidgetLibraryPreferences): boolean
  clear(): void
}

export class BrowserWidgetLibraryPreferencesStore implements WidgetLibraryPreferencesStore {
  constructor(private readonly storage: Storage, private readonly key = WIDGET_LIBRARY_PREFERENCES_KEY) {}

  load(): WidgetLibraryPreferences {
    try {
      const source = this.storage.getItem(this.key)
      if (!source) return DEFAULT_WIDGET_LIBRARY_PREFERENCES
      const parsed = WidgetLibraryPreferencesSchema.safeParse(JSON.parse(source) as unknown)
      return parsed.success ? parsed.data : DEFAULT_WIDGET_LIBRARY_PREFERENCES
    } catch {
      return DEFAULT_WIDGET_LIBRARY_PREFERENCES
    }
  }

  save(preferences: WidgetLibraryPreferences): boolean {
    const parsed = WidgetLibraryPreferencesSchema.safeParse(preferences)
    if (!parsed.success) return false
    try {
      this.storage.setItem(this.key, JSON.stringify(parsed.data))
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key)
    } catch {
      // Las preferencias de biblioteca son recuperables y no bloquean el documento.
    }
  }
}

export function toggleFavoriteWidget(preferences: WidgetLibraryPreferences, widgetId: string): WidgetLibraryPreferences {
  const current = new Set(preferences.favoriteWidgetIds)
  if (current.has(widgetId)) current.delete(widgetId)
  else current.add(widgetId)
  return { ...preferences, favoriteWidgetIds: [...current] }
}

export function recordRecentWidget(preferences: WidgetLibraryPreferences, widgetId: string): WidgetLibraryPreferences {
  return {
    ...preferences,
    recentWidgetIds: [widgetId, ...preferences.recentWidgetIds.filter((id) => id !== widgetId)].slice(0, MAX_RECENT_WIDGETS),
  }
}

export function createSavedWidgetPreset(
  node: Node,
  label: string,
  createId: () => string = () => crypto.randomUUID(),
  createdAt: () => string = () => new Date().toISOString(),
): SavedWidgetPreset | null {
  if (node.kind !== 'widget') return null
  const candidate = SavedWidgetPresetSchema.safeParse({
    createdAt: createdAt(),
    id: createId(),
    label,
    properties: structuredClone(node.properties),
    responsive: structuredClone(node.responsive) as Record<string, NodeResponsiveOverride>,
    styles: structuredClone(node.styles),
    widgetType: node.widgetType,
  })
  return candidate.success ? candidate.data : null
}

export function addSavedWidget(preferences: WidgetLibraryPreferences, preset: SavedWidgetPreset): WidgetLibraryPreferences {
  return { ...preferences, savedWidgets: [preset, ...preferences.savedWidgets].slice(0, MAX_SAVED_WIDGETS) }
}

export function removeSavedWidget(preferences: WidgetLibraryPreferences, presetId: string): WidgetLibraryPreferences {
  return { ...preferences, savedWidgets: preferences.savedWidgets.filter((preset) => preset.id !== presetId) }
}
