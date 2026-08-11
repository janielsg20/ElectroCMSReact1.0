export const EDITOR_THEME_PRESET_IDS = [
  'high-density',
  'google-bento-grid',
  'minimal-clean',
  'elegant-editorial',
  'sophisticated-dark',
  'saas-glassmorphism',
  'material-neutral',
  'neobrutalist-modern',
  'corporate-pro',
] as const

export type EditorThemePresetId = (typeof EDITOR_THEME_PRESET_IDS)[number]
export type EditorThemeLayout = 'studio' | 'bento' | 'flow'
export type EditorThemeMode = 'light' | 'dark'

export interface EditorColorTokens {
  readonly canvas: string
  readonly surface: string
  readonly foreground: string
  readonly muted: string
  readonly mutedForeground: string
  readonly border: string
  readonly primary: string
  readonly primaryStrong: string
  readonly primarySoft: string
  readonly onPrimary: string
  readonly destructive: string
  readonly onDestructive: string
  readonly focus: string
}

export interface EditorThemePreset {
  readonly id: EditorThemePresetId
  readonly label: string
  readonly description: string
  readonly layout: EditorThemeLayout
  readonly tokens: {
    readonly colors: Readonly<Record<EditorThemeMode, EditorColorTokens>>
    readonly controlHeight: number
    readonly fontFamily: string
    readonly headingFamily: string
    readonly radius: number
    readonly shadows: readonly [small: string, medium: string, large: string]
  }
}

const studioLight: EditorColorTokens = { canvas: '#f7f8fa', surface: '#ffffff', foreground: '#151922', muted: '#f0f2f5', mutedForeground: '#5f6673', border: '#dfe3e8', primary: '#2563eb', primaryStrong: '#1d4ed8', primarySoft: '#e8f0ff', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#2563eb' }
const studioDark: EditorColorTokens = { canvas: '#0f141d', surface: '#171d27', foreground: '#f8fafc', muted: '#232b37', mutedForeground: '#b8c0cc', border: '#374151', primary: '#60a5fa', primaryStrong: '#bfdbfe', primarySoft: '#172c4c', onPrimary: '#08111f', destructive: '#f87171', onDestructive: '#2b0a0a', focus: '#93c5fd' }
const lowShadows = ['0 1px 2px rgb(15 23 42 / 0.07)', '0 6px 18px rgb(15 23 42 / 0.11)', '0 18px 40px rgb(15 23 42 / 0.18)'] as const
const flatShadows = ['0 0 0 rgb(0 0 0 / 0)', '0 1px 2px rgb(15 23 42 / 0.06)', '0 3px 8px rgb(15 23 42 / 0.08)'] as const

export const EDITOR_THEME_PRESETS: readonly EditorThemePreset[] = Object.freeze([
  {
    id: 'high-density', label: 'High Density', description: 'Máxima información, controles compactos y jerarquía IDE.', layout: 'studio',
    tokens: { colors: { light: studioLight, dark: studioDark }, controlHeight: 36, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 5, shadows: flatShadows },
  },
  {
    id: 'google-bento-grid', label: 'Google Bento Grid', description: 'Paneles modulares, ritmo visual y superficies redondeadas.', layout: 'bento',
    tokens: { colors: {
      light: { canvas: '#eef1f5', surface: '#fbfcfe', foreground: '#172033', muted: '#e5e9ef', mutedForeground: '#596579', border: '#cbd3df', primary: '#1d4ed8', primaryStrong: '#1e40af', primarySoft: '#dce8ff', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#1d4ed8' },
      dark: { canvas: '#10141b', surface: '#1a202a', foreground: '#f3f6fa', muted: '#252d39', mutedForeground: '#b2bdcc', border: '#3b4655', primary: '#75a7ff', primaryStrong: '#c7d9ff', primarySoft: '#21385f', onPrimary: '#0b1526', destructive: '#f87171', onDestructive: '#2b0a0a', focus: '#9fc1ff' },
    }, controlHeight: 38, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 12, shadows: lowShadows },
  },
  {
    id: 'minimal-clean', label: 'Minimal Clean', description: 'Bajo ruido visual, bordes suaves y canvas prioritario.', layout: 'flow',
    tokens: { colors: {
      light: { canvas: '#f8fafc', surface: '#ffffff', foreground: '#111827', muted: '#f1f5f9', mutedForeground: '#526071', border: '#dce2ea', primary: '#334155', primaryStrong: '#1e293b', primarySoft: '#e8edf3', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#1d4ed8' },
      dark: { canvas: '#111318', surface: '#191c22', foreground: '#f5f7fa', muted: '#242830', mutedForeground: '#b6beca', border: '#363c47', primary: '#cbd5e1', primaryStrong: '#f1f5f9', primarySoft: '#303743', onPrimary: '#111827', destructive: '#f87171', onDestructive: '#2b0a0a', focus: '#93c5fd' },
    }, controlHeight: 38, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 7, shadows: flatShadows },
  },
  {
    id: 'elegant-editorial', label: 'Elegant Editorial', description: 'Tipografía editorial, tonos cálidos y ritmo refinado.', layout: 'flow',
    tokens: { colors: {
      light: { canvas: '#f7f3ed', surface: '#fffdf9', foreground: '#2a211c', muted: '#eee7de', mutedForeground: '#665d54', border: '#d8cec1', primary: '#7f1d1d', primaryStrong: '#681818', primarySoft: '#f6e4df', onPrimary: '#ffffff', destructive: '#9f1239', onDestructive: '#ffffff', focus: '#7f1d1d' },
      dark: { canvas: '#171310', surface: '#211b17', foreground: '#faf7f2', muted: '#332a24', mutedForeground: '#c9bfb5', border: '#4a3d35', primary: '#f0a7a7', primaryStrong: '#ffd1d1', primarySoft: '#4a2222', onPrimary: '#2d0b0b', destructive: '#fda4af', onDestructive: '#3f0712', focus: '#f0a7a7' },
    }, controlHeight: 40, fontFamily: 'Georgia, serif', headingFamily: 'Georgia, serif', radius: 4, shadows: flatShadows },
  },
  {
    id: 'sophisticated-dark', label: 'Sophisticated Dark', description: 'Oscuro elegante, profundidad y acento violeta.', layout: 'studio',
    tokens: { colors: {
      light: { canvas: '#f4f2f8', surface: '#ffffff', foreground: '#201a2a', muted: '#ece8f2', mutedForeground: '#625a6c', border: '#d6cfdf', primary: '#6d28d9', primaryStrong: '#5b21b6', primarySoft: '#ede9fe', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#6d28d9' },
      dark: { canvas: '#090b10', surface: '#151923', foreground: '#f8fafc', muted: '#242936', mutedForeground: '#c1c7d0', border: '#3f4653', primary: '#c4b5fd', primaryStrong: '#ede9fe', primarySoft: '#352d59', onPrimary: '#171126', destructive: '#fca5a5', onDestructive: '#3b0909', focus: '#ddd6fe' },
    }, controlHeight: 38, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 9, shadows: ['0 2px 8px rgb(0 0 0 / 0.28)', '0 12px 28px rgb(0 0 0 / 0.36)', '0 28px 64px rgb(0 0 0 / 0.46)'] },
  },
  {
    id: 'saas-glassmorphism', label: 'SaaS Glassmorphism', description: 'Capas translúcidas simuladas y separación nítida.', layout: 'bento',
    tokens: { colors: {
      light: { canvas: '#e8f3f5', surface: '#ffffff', foreground: '#102a2d', muted: '#e2edef', mutedForeground: '#4e6067', border: '#9fb3b8', primary: '#0f766e', primaryStrong: '#115e59', primarySoft: '#ccfbf1', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#0f766e' },
      dark: { canvas: '#081719', surface: '#122326', foreground: '#effdfb', muted: '#203438', mutedForeground: '#b4c8c9', border: '#3a565a', primary: '#5eead4', primaryStrong: '#99f6e4', primarySoft: '#134e4a', onPrimary: '#052e2b', destructive: '#fca5a5', onDestructive: '#3b0909', focus: '#5eead4' },
    }, controlHeight: 40, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 14, shadows: lowShadows },
  },
  {
    id: 'material-neutral', label: 'Material Neutral', description: 'Elevación funcional, color tonal y formas amables.', layout: 'bento',
    tokens: { colors: {
      light: { canvas: '#f7f2fa', surface: '#fffbfe', foreground: '#1d1b20', muted: '#eee9ef', mutedForeground: '#5f5963', border: '#cac4d0', primary: '#6750a4', primaryStrong: '#4f378b', primarySoft: '#eaddff', onPrimary: '#ffffff', destructive: '#b3261e', onDestructive: '#ffffff', focus: '#6750a4' },
      dark: { canvas: '#141218', surface: '#211f26', foreground: '#e6e0e9', muted: '#2b2930', mutedForeground: '#cac4d0', border: '#49454f', primary: '#d0bcff', primaryStrong: '#eaddff', primarySoft: '#4f378b', onPrimary: '#381e72', destructive: '#f2b8b5', onDestructive: '#601410', focus: '#d0bcff' },
    }, controlHeight: 40, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 12, shadows: lowShadows },
  },
  {
    id: 'neobrutalist-modern', label: 'Neobrutalist Modern', description: 'Contraste directo, bordes fuertes y geometría cuadrada.', layout: 'studio',
    tokens: { colors: {
      light: { canvas: '#fff7cc', surface: '#ffffff', foreground: '#0f172a', muted: '#ffec80', mutedForeground: '#475569', border: '#0f172a', primary: '#1d4ed8', primaryStrong: '#1e3a8a', primarySoft: '#dbeafe', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#1d4ed8' },
      dark: { canvas: '#111827', surface: '#1f2937', foreground: '#f9fafb', muted: '#374151', mutedForeground: '#d1d5db', border: '#f9fafb', primary: '#fde047', primaryStrong: '#fef08a', primarySoft: '#713f12', onPrimary: '#422006', destructive: '#fca5a5', onDestructive: '#3b0909', focus: '#fde047' },
    }, controlHeight: 40, fontFamily: 'Arial, sans-serif', headingFamily: 'Arial Black, sans-serif', radius: 0, shadows: ['2px 2px 0 rgb(15 23 42 / 0.9)', '4px 4px 0 rgb(15 23 42 / 0.9)', '7px 7px 0 rgb(15 23 42 / 0.9)'] },
  },
  {
    id: 'corporate-pro', label: 'Corporate Pro', description: 'Sobrio, confiable y optimizado para administración.', layout: 'flow',
    tokens: { colors: {
      light: { canvas: '#edf2f7', surface: '#ffffff', foreground: '#102a43', muted: '#e4ebf2', mutedForeground: '#486581', border: '#bcccdc', primary: '#164e63', primaryStrong: '#0e3a4a', primarySoft: '#d9eef2', onPrimary: '#ffffff', destructive: '#b91c1c', onDestructive: '#ffffff', focus: '#164e63' },
      dark: { canvas: '#0b1820', surface: '#122630', foreground: '#f0f7fa', muted: '#1d3642', mutedForeground: '#b7cbd3', border: '#385463', primary: '#67e8f9', primaryStrong: '#a5f3fc', primarySoft: '#164e63', onPrimary: '#083344', destructive: '#fca5a5', onDestructive: '#3b0909', focus: '#67e8f9' },
    }, controlHeight: 36, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', radius: 5, shadows: flatShadows },
  },
])

const editorPresetById = new Map(EDITOR_THEME_PRESETS.map((preset) => [preset.id, preset]))

export function isEditorThemePresetId(value: unknown): value is EditorThemePresetId {
  return typeof value === 'string' && editorPresetById.has(value as EditorThemePresetId)
}

export function getEditorThemePreset(id: EditorThemePresetId): EditorThemePreset {
  const preset = editorPresetById.get(id)
  if (!preset) throw new Error(`Preset del editor desconocido: ${id}`)
  return preset
}
