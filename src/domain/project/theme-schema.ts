import * as z from 'zod'

export const THEME_SCHEMA_VERSION = 1 as const

export const ThemeScopeSchema = z.enum(['editor', 'frontend', 'backend'])
export const ProjectThemeScopeSchema = z.enum(['frontend', 'backend'])

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hexadecimal de seis dígitos.')
const SafeTextSchema = z.string().trim().min(1).max(160).refine(
  (value) => !/[;{}@]|url\s*\(|expression\s*\(|javascript\s*:/i.test(value),
  'El valor contiene una expresión no permitida.',
)
const TokenNumberSchema = z.number().finite().min(0).max(10_000)

export const SemanticThemeTokensSchema = z.strictObject({
  color: z.strictObject({
    background: HexColorSchema,
    border: HexColorSchema,
    danger: HexColorSchema,
    focus: HexColorSchema,
    muted: HexColorSchema,
    onPrimary: HexColorSchema,
    primary: HexColorSchema,
    surface: HexColorSchema,
    text: HexColorSchema,
  }),
  typography: z.strictObject({
    baseSize: z.number().finite().min(10).max(32),
    bodyFamily: SafeTextSchema,
    headingFamily: SafeTextSchema,
    lineHeight: z.number().finite().min(1).max(2.5),
    scaleRatio: z.number().finite().min(1).max(2),
  }),
  spacing: z.strictObject({
    controlHeight: z.number().finite().min(24).max(96),
    gap: TokenNumberSchema,
    section: TokenNumberSchema,
    unit: z.number().finite().min(1).max(32),
  }),
  radius: z.strictObject({
    full: z.number().finite().min(0).max(9_999),
    large: z.number().finite().min(0).max(96),
    medium: z.number().finite().min(0).max(64),
    small: z.number().finite().min(0).max(32),
  }),
  shadow: z.strictObject({
    large: SafeTextSchema,
    medium: SafeTextSchema,
    small: SafeTextSchema,
  }),
  motion: z.strictObject({
    easing: z.enum(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear']),
    fast: z.number().int().min(0).max(5_000),
    normal: z.number().int().min(0).max(5_000),
    slow: z.number().int().min(0).max(5_000),
  }),
  density: z.strictObject({
    mode: z.enum(['compact', 'comfortable', 'spacious']),
    scale: z.number().finite().min(0.75).max(1.5),
  }),
})

export const ProjectThemeSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
  schemaVersion: z.literal(THEME_SCHEMA_VERSION),
  tokens: SemanticThemeTokensSchema,
})

export type ThemeScope = z.infer<typeof ThemeScopeSchema>
export type ProjectThemeScope = z.infer<typeof ProjectThemeScopeSchema>
export type SemanticThemeTokens = z.infer<typeof SemanticThemeTokensSchema>
export type ProjectTheme = z.infer<typeof ProjectThemeSchema>

export const DEFAULT_FRONTEND_THEME: ProjectTheme = Object.freeze<ProjectTheme>({
  name: 'Frontend base',
  schemaVersion: THEME_SCHEMA_VERSION,
  tokens: {
    color: { background: '#ffffff', border: '#e2e8f0', danger: '#dc2626', focus: '#2563eb', muted: '#64748b', onPrimary: '#ffffff', primary: '#2563eb', surface: '#f8fafc', text: '#0f172a' },
    density: { mode: 'comfortable', scale: 1 },
    motion: { easing: 'ease-out', fast: 150, normal: 250, slow: 400 },
    radius: { full: 9999, large: 16, medium: 10, small: 6 },
    shadow: { large: '0 20px 40px rgb(15 23 42 / 0.14)', medium: '0 8px 20px rgb(15 23 42 / 0.10)', small: '0 2px 8px rgb(15 23 42 / 0.08)' },
    spacing: { controlHeight: 44, gap: 16, section: 64, unit: 4 },
    typography: { baseSize: 16, bodyFamily: 'Inter, sans-serif', headingFamily: 'Inter, sans-serif', lineHeight: 1.5, scaleRatio: 1.25 },
  },
})

export const DEFAULT_BACKEND_THEME: ProjectTheme = Object.freeze<ProjectTheme>({
  name: 'Backend base',
  schemaVersion: THEME_SCHEMA_VERSION,
  tokens: {
    color: { background: '#f1f5f9', border: '#cbd5e1', danger: '#b91c1c', focus: '#1d4ed8', muted: '#64748b', onPrimary: '#ffffff', primary: '#1d4ed8', surface: '#ffffff', text: '#0f172a' },
    density: { mode: 'compact', scale: 0.9 },
    motion: { easing: 'ease-out', fast: 120, normal: 200, slow: 320 },
    radius: { full: 9999, large: 10, medium: 6, small: 4 },
    shadow: { large: '0 16px 32px rgb(15 23 42 / 0.12)', medium: '0 6px 16px rgb(15 23 42 / 0.09)', small: '0 1px 4px rgb(15 23 42 / 0.08)' },
    spacing: { controlHeight: 36, gap: 12, section: 32, unit: 4 },
    typography: { baseSize: 14, bodyFamily: 'Inter, sans-serif', headingFamily: 'Inter, sans-serif', lineHeight: 1.4, scaleRatio: 1.18 },
  },
})

export const DEFAULT_PROJECT_THEMES = Object.freeze({
  backend: DEFAULT_BACKEND_THEME,
  frontend: DEFAULT_FRONTEND_THEME,
})

export const ProjectThemesSchema = z.strictObject({
  backend: ProjectThemeSchema,
  frontend: ProjectThemeSchema,
})

export type ProjectThemes = z.infer<typeof ProjectThemesSchema>
