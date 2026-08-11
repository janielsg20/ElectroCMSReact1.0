import { failure, success, type Result } from '../common/result'
import { setProjectTheme } from './theme-engine'
import type { ProjectStructure } from './structure-schema'
import { ProjectThemeSchema, type ProjectTheme, type ProjectThemeScope } from './theme-schema'

export type ProjectThemePresetId =
  | 'bento-grid'
  | 'minimal-clean'
  | 'elegant'
  | 'sophisticated-dark'
  | 'high-density'
  | 'material'
  | 'glassmorphism'
  | 'neobrutalism'
  | 'corporate'
  | 'editorial'
  | 'technical-dashboard'

export interface ProjectThemePreset {
  readonly id: ProjectThemePresetId
  readonly label: string
  readonly description: string
  readonly theme: ProjectTheme
  readonly traits: {
    readonly accessibility: 'WCAG 2.2 AA'
    readonly border: 'none' | 'subtle' | 'strong'
    readonly componentShape: 'rounded' | 'soft' | 'square'
    readonly elevation: 'flat' | 'low' | 'layered'
    readonly layout: 'bento' | 'content-first' | 'dashboard' | 'editorial' | 'linear'
    readonly responsiveProfile: 'content' | 'dashboard' | 'standard'
  }
}

export interface ThemePresetDiagnostic {
  readonly code: 'invalid-preset-theme' | 'unknown-theme-preset'
  readonly message: string
  readonly path: readonly string[]
}

const motion = { easing: 'ease-out' as const, fast: 150, normal: 250, slow: 400 }

function theme(
  name: string,
  input: {
    readonly background: string
    readonly border: string
    readonly danger?: string
    readonly focus?: string
    readonly muted: string
    readonly onPrimary?: string
    readonly primary: string
    readonly surface: string
    readonly text: string
    readonly bodyFamily?: string
    readonly headingFamily?: string
    readonly baseSize?: number
    readonly scaleRatio?: number
    readonly lineHeight?: number
    readonly controlHeight?: number
    readonly density?: 'compact' | 'comfortable' | 'spacious'
    readonly densityScale?: number
    readonly gap?: number
    readonly section?: number
    readonly radii?: readonly [small: number, medium: number, large: number]
    readonly shadows?: readonly [small: string, medium: string, large: string]
  },
): ProjectTheme {
  const [small = 6, medium = 10, large = 16] = input.radii ?? []
  const [shadowSmall = '0 1px 3px rgb(15 23 42 / 0.08)', shadowMedium = '0 8px 20px rgb(15 23 42 / 0.10)', shadowLarge = '0 20px 40px rgb(15 23 42 / 0.14)'] = input.shadows ?? []
  return ProjectThemeSchema.parse({
    name,
    schemaVersion: 1,
    tokens: {
      color: {
        background: input.background,
        border: input.border,
        danger: input.danger ?? '#b91c1c',
        focus: input.focus ?? input.primary,
        muted: input.muted,
        onPrimary: input.onPrimary ?? '#ffffff',
        primary: input.primary,
        surface: input.surface,
        text: input.text,
      },
      density: { mode: input.density ?? 'comfortable', scale: input.densityScale ?? 1 },
      motion,
      radius: { full: 9999, large, medium, small },
      shadow: { large: shadowLarge, medium: shadowMedium, small: shadowSmall },
      spacing: { controlHeight: input.controlHeight ?? 44, gap: input.gap ?? 16, section: input.section ?? 64, unit: 4 },
      typography: {
        baseSize: input.baseSize ?? 16,
        bodyFamily: input.bodyFamily ?? 'Inter, sans-serif',
        headingFamily: input.headingFamily ?? input.bodyFamily ?? 'Inter, sans-serif',
        lineHeight: input.lineHeight ?? 1.5,
        scaleRatio: input.scaleRatio ?? 1.25,
      },
    },
  })
}

const flatShadows = ['0 0 0 rgb(0 0 0 / 0)', '0 1px 2px rgb(15 23 42 / 0.05)', '0 2px 6px rgb(15 23 42 / 0.07)'] as const
const hardShadows = ['2px 2px 0 rgb(15 23 42 / 0.9)', '4px 4px 0 rgb(15 23 42 / 0.9)', '8px 8px 0 rgb(15 23 42 / 0.9)'] as const

export const PROJECT_THEME_PRESETS: readonly ProjectThemePreset[] = Object.freeze([
  { id: 'bento-grid', label: 'Bento Grid', description: 'Mosaicos modulares, superficies claras y jerarquía visual marcada.', theme: theme('Bento Grid', { background: '#eef2f6', border: '#cbd5e1', muted: '#475569', primary: '#1d4ed8', surface: '#ffffff', text: '#0f172a', radii: [8, 14, 22], gap: 20, shadows: ['0 2px 8px rgb(15 23 42 / 0.08)', '0 12px 28px rgb(15 23 42 / 0.11)', '0 24px 52px rgb(15 23 42 / 0.15)'] }), traits: { accessibility: 'WCAG 2.2 AA', border: 'subtle', componentShape: 'rounded', elevation: 'layered', layout: 'bento', responsiveProfile: 'standard' } },
  { id: 'minimal-clean', label: 'Minimal Clean', description: 'Contenido prioritario, bajo ruido y espaciado equilibrado.', theme: theme('Minimal Clean', { background: '#f8fafc', border: '#d8dee8', muted: '#475569', primary: '#334155', surface: '#ffffff', text: '#111827', radii: [4, 8, 12], section: 72, shadows: flatShadows }), traits: { accessibility: 'WCAG 2.2 AA', border: 'subtle', componentShape: 'soft', elevation: 'flat', layout: 'content-first', responsiveProfile: 'content' } },
  { id: 'elegant', label: 'Elegant', description: 'Tipografía refinada, ritmo generoso y acento borgoña.', theme: theme('Elegant', { background: '#faf7f2', border: '#d9cfc2', muted: '#665d54', primary: '#7f1d1d', surface: '#fffdf9', text: '#271c18', bodyFamily: 'Georgia, serif', headingFamily: 'Georgia, serif', scaleRatio: 1.333, lineHeight: 1.65, radii: [2, 6, 10], gap: 20, section: 88 }), traits: { accessibility: 'WCAG 2.2 AA', border: 'subtle', componentShape: 'soft', elevation: 'low', layout: 'content-first', responsiveProfile: 'content' } },
  { id: 'sophisticated-dark', label: 'Sophisticated Dark', description: 'Superficies oscuras, alto contraste y acento violeta.', theme: theme('Sophisticated Dark', { background: '#090b10', border: '#3f4653', muted: '#c1c7d0', onPrimary: '#171126', primary: '#c4b5fd', surface: '#151923', text: '#f8fafc', focus: '#ddd6fe', danger: '#fca5a5', radii: [6, 10, 16], shadows: ['0 2px 8px rgb(0 0 0 / 0.35)', '0 12px 28px rgb(0 0 0 / 0.42)', '0 28px 64px rgb(0 0 0 / 0.5)'] }), traits: { accessibility: 'WCAG 2.2 AA', border: 'subtle', componentShape: 'soft', elevation: 'layered', layout: 'linear', responsiveProfile: 'standard' } },
  { id: 'high-density', label: 'High Density', description: 'Máxima información con controles compactos y lectura clara.', theme: theme('High Density', { background: '#f1f5f9', border: '#c2ccd9', muted: '#475569', primary: '#1d4ed8', surface: '#ffffff', text: '#0f172a', baseSize: 14, scaleRatio: 1.16, lineHeight: 1.35, controlHeight: 34, density: 'compact', densityScale: 0.86, gap: 10, section: 28, radii: [3, 5, 8], shadows: flatShadows }), traits: { accessibility: 'WCAG 2.2 AA', border: 'strong', componentShape: 'square', elevation: 'flat', layout: 'dashboard', responsiveProfile: 'dashboard' } },
  { id: 'material', label: 'Material', description: 'Color tonal, elevación contenida y movimiento funcional.', theme: theme('Material', { background: '#f7f2fa', border: '#cac4d0', muted: '#5f5963', primary: '#6750a4', surface: '#fffbfe', text: '#1d1b20', radii: [8, 12, 20], shadows: ['0 1px 3px rgb(29 27 32 / 0.16)', '0 6px 16px rgb(29 27 32 / 0.18)', '0 18px 36px rgb(29 27 32 / 0.20)'] }), traits: { accessibility: 'WCAG 2.2 AA', border: 'none', componentShape: 'rounded', elevation: 'layered', layout: 'linear', responsiveProfile: 'standard' } },
  { id: 'glassmorphism', label: 'Glassmorphism', description: 'Capas translúcidas simuladas con contraste y bordes definidos.', theme: theme('Glassmorphism', { background: '#e8f3f5', border: '#94a3b8', muted: '#475569', primary: '#0f766e', surface: '#ffffff', text: '#102a2d', radii: [10, 16, 24], gap: 18, shadows: ['0 4px 12px rgb(15 118 110 / 0.10)', '0 16px 36px rgb(15 118 110 / 0.14)', '0 30px 70px rgb(15 118 110 / 0.18)'] }), traits: { accessibility: 'WCAG 2.2 AA', border: 'strong', componentShape: 'rounded', elevation: 'layered', layout: 'bento', responsiveProfile: 'standard' } },
  { id: 'neobrutalism', label: 'Neobrutalism', description: 'Bordes duros, sombras desplazadas y color directo.', theme: theme('Neobrutalism', { background: '#fff7cc', border: '#0f172a', muted: '#475569', primary: '#1d4ed8', surface: '#ffffff', text: '#0f172a', headingFamily: 'Arial Black, sans-serif', lineHeight: 1.4, radii: [0, 0, 0], gap: 18, shadows: hardShadows }), traits: { accessibility: 'WCAG 2.2 AA', border: 'strong', componentShape: 'square', elevation: 'layered', layout: 'bento', responsiveProfile: 'standard' } },
  { id: 'corporate', label: 'Corporate', description: 'Sobrio, confiable y preparado para flujos empresariales.', theme: theme('Corporate', { background: '#f1f5f9', border: '#b8c5d1', muted: '#475569', primary: '#164e63', surface: '#ffffff', text: '#102a43', baseSize: 15, scaleRatio: 1.2, controlHeight: 40, density: 'compact', densityScale: 0.94, gap: 14, section: 44, radii: [3, 6, 10] }), traits: { accessibility: 'WCAG 2.2 AA', border: 'subtle', componentShape: 'soft', elevation: 'low', layout: 'dashboard', responsiveProfile: 'dashboard' } },
  { id: 'editorial', label: 'Editorial', description: 'Escala tipográfica protagonista y composición de lectura.', theme: theme('Editorial', { background: '#f7f4ee', border: '#d6cec2', muted: '#625b52', primary: '#7c2d12', surface: '#fffdf8', text: '#29221d', bodyFamily: 'Georgia, serif', headingFamily: 'Georgia, serif', baseSize: 17, scaleRatio: 1.414, lineHeight: 1.7, radii: [0, 2, 4], gap: 24, section: 96, shadows: flatShadows }), traits: { accessibility: 'WCAG 2.2 AA', border: 'subtle', componentShape: 'square', elevation: 'flat', layout: 'editorial', responsiveProfile: 'content' } },
  { id: 'technical-dashboard', label: 'Dashboard técnico', description: 'Datos densos, navegación operativa y jerarquía de estado.', theme: theme('Dashboard técnico', { background: '#eaf0f6', border: '#b7c4d2', muted: '#475569', primary: '#0369a1', surface: '#ffffff', text: '#0c253a', baseSize: 14, scaleRatio: 1.16, lineHeight: 1.4, controlHeight: 36, density: 'compact', densityScale: 0.9, gap: 12, section: 32, radii: [3, 6, 9], shadows: flatShadows }), traits: { accessibility: 'WCAG 2.2 AA', border: 'strong', componentShape: 'square', elevation: 'low', layout: 'dashboard', responsiveProfile: 'dashboard' } },
])

const presetById = new Map(PROJECT_THEME_PRESETS.map((preset) => [preset.id, preset]))

export function getProjectThemePreset(id: ProjectThemePresetId): ProjectThemePreset {
  const preset = presetById.get(id)
  if (!preset) throw new Error(`Preset visual desconocido: ${id}`)
  return preset
}

export function applyProjectThemePreset(
  structure: ProjectStructure,
  scope: ProjectThemeScope,
  presetId: ProjectThemePresetId,
): Result<ProjectStructure, readonly ThemePresetDiagnostic[]> {
  const preset = presetById.get(presetId)
  if (!preset) return failure([{ code: 'unknown-theme-preset', message: `No existe el preset ${presetId}.`, path: ['presets', presetId] }])
  const parsed = ProjectThemeSchema.safeParse(preset.theme)
  if (!parsed.success) return failure(parsed.error.issues.map((issue) => ({ code: 'invalid-preset-theme' as const, message: issue.message, path: ['presets', presetId, ...issue.path.map(String)] })))
  const applied = setProjectTheme(structure, scope, structuredClone(parsed.data))
  return applied.ok ? success(applied.value) : failure(applied.error.map((issue) => ({ code: 'invalid-preset-theme' as const, message: issue.message, path: issue.path })))
}

function relativeLuminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)
  if (!channels || channels.length !== 3) return 0
  const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function themeContrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

export function projectThemeContrastPairs(themeValue: ProjectTheme): readonly (readonly [string, string])[] {
  const { color } = themeValue.tokens
  return [
    [color.text, color.background],
    [color.text, color.surface],
    [color.muted, color.surface],
    [color.onPrimary, color.primary],
  ]
}
