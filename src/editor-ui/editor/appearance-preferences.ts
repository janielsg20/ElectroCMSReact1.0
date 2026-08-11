import { z } from 'zod'
import { EDITOR_THEME_PRESET_IDS, getEditorThemePreset, type EditorThemePresetId } from '../theme/editor-presets'

export const EDITOR_APPEARANCE_PREFERENCES_KEY = 'electrocms.appearance.v1'
export const EDITOR_APPEARANCE_PREFERENCES_VERSION = 1 as const

export type UiTheme = EditorThemePresetId
export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = Exclude<ColorMode, 'system'>

const legacyThemeAliases = {
  bento: 'google-bento-grid',
  flow: 'minimal-clean',
  studio: 'high-density',
} as const satisfies Record<string, UiTheme>

const appearancePreferencesSchema = z.object({
  version: z.literal(EDITOR_APPEARANCE_PREFERENCES_VERSION),
  uiTheme: z.enum([...EDITOR_THEME_PRESET_IDS, 'studio', 'bento', 'flow']),
  colorMode: z.enum(['light', 'dark', 'system']),
}).strict().transform((value) => ({
  ...value,
  uiTheme: value.uiTheme in legacyThemeAliases
    ? legacyThemeAliases[value.uiTheme as keyof typeof legacyThemeAliases]
    : value.uiTheme as UiTheme,
}))

export type AppearancePreferences = z.infer<typeof appearancePreferencesSchema>

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  version: EDITOR_APPEARANCE_PREFERENCES_VERSION,
  uiTheme: 'high-density',
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
  const preset = getEditorThemePreset(preferences.uiTheme)
  const colors = preset.tokens.colors[resolved]
  root.dataset.theme = resolved
  root.dataset.colorMode = preferences.colorMode
  root.dataset.uiPreset = preferences.uiTheme
  root.dataset.uiTheme = preset.layout
  root.style.colorScheme = resolved
  const properties = {
    '--color-canvas': colors.canvas,
    '--color-surface': colors.surface,
    '--color-foreground': colors.foreground,
    '--color-muted': colors.muted,
    '--color-muted-foreground': colors.mutedForeground,
    '--color-border': colors.border,
    '--color-primary': colors.primary,
    '--color-primary-strong': colors.primaryStrong,
    '--color-primary-soft': colors.primarySoft,
    '--color-on-primary': colors.onPrimary,
    '--color-destructive': colors.destructive,
    '--color-on-destructive': colors.onDestructive,
    '--color-focus': colors.focus,
    '--font-sans': preset.tokens.fontFamily,
    '--font-heading': preset.tokens.headingFamily,
    '--shadow-sm': preset.tokens.shadows[0],
    '--shadow-md': preset.tokens.shadows[1],
    '--shadow-lg': preset.tokens.shadows[2],
    '--ui-radius-control': `${preset.tokens.radius / 16}rem`,
    '--ui-row-desktop': `${preset.tokens.controlHeight / 16}rem`,
  } as const
  for (const [property, value] of Object.entries(properties)) root.style.setProperty(property, value)
}

export function readInitialAppearance(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage): AppearancePreferences {
  return new BrowserAppearancePreferencesStore(storage).load() ?? DEFAULT_APPEARANCE_PREFERENCES
}
