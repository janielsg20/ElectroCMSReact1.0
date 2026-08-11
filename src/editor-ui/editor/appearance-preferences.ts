import { z } from 'zod'

export const EDITOR_APPEARANCE_PREFERENCES_KEY = 'electrocms.appearance.v1'
export const EDITOR_APPEARANCE_PREFERENCES_VERSION = 1 as const

export type UiTheme = 'studio' | 'bento' | 'flow'
export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = Exclude<ColorMode, 'system'>

const appearancePreferencesSchema = z.object({
  version: z.literal(EDITOR_APPEARANCE_PREFERENCES_VERSION),
  uiTheme: z.enum(['studio', 'bento', 'flow']),
  colorMode: z.enum(['light', 'dark', 'system']),
}).strict()

export type AppearancePreferences = z.infer<typeof appearancePreferencesSchema>

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  version: EDITOR_APPEARANCE_PREFERENCES_VERSION,
  uiTheme: 'studio',
  colorMode: 'light',
}

export interface AppearancePreferencesStore {
  load(): AppearancePreferences | null
  save(preferences: AppearancePreferences): void
  clear(): void
}

export class BrowserAppearancePreferencesStore implements AppearancePreferencesStore {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {}

  load(): AppearancePreferences | null {
    const raw = this.storage.getItem(EDITOR_APPEARANCE_PREFERENCES_KEY)
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      const result = appearancePreferencesSchema.safeParse(parsed)
      return result.success ? result.data : null
    } catch {
      return null
    }
  }

  save(preferences: AppearancePreferences): void {
    const parsed = appearancePreferencesSchema.parse(preferences)
    this.storage.setItem(EDITOR_APPEARANCE_PREFERENCES_KEY, JSON.stringify(parsed))
  }

  clear(): void {
    this.storage.removeItem(EDITOR_APPEARANCE_PREFERENCES_KEY)
  }
}

export function resolveColorMode(colorMode: ColorMode, systemDark: boolean): ResolvedColorMode {
  return colorMode === 'system' ? systemDark ? 'dark' : 'light' : colorMode
}

export function systemPrefersDark(mediaMatcher: Partial<Pick<Window, 'matchMedia'>> = window): boolean {
  return typeof mediaMatcher.matchMedia === 'function' && mediaMatcher.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyAppearance(root: HTMLElement, preferences: AppearancePreferences, systemDark: boolean): void {
  const resolved = resolveColorMode(preferences.colorMode, systemDark)
  root.dataset.theme = resolved
  root.dataset.colorMode = preferences.colorMode
  root.dataset.uiTheme = preferences.uiTheme
  root.style.colorScheme = resolved
}

export function readInitialAppearance(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage): AppearancePreferences {
  return new BrowserAppearancePreferencesStore(storage).load() ?? DEFAULT_APPEARANCE_PREFERENCES
}
