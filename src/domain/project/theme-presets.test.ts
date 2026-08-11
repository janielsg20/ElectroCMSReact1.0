import { describe, expect, it } from 'vitest'
import { ProjectStructureSchema } from './structure-schema'
import { DEFAULT_BACKEND_THEME } from './theme-schema'
import {
  applyProjectThemePreset,
  projectThemeContrastPairs,
  PROJECT_THEME_PRESETS,
  themeContrastRatio,
} from './theme-presets'

function emptyStructure() {
  return ProjectStructureSchema.parse({
    breakpoints: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', inheritsFrom: null, name: 'Desktop', orientation: 'landscape', width: 1440 }],
    documents: {},
    globalComponents: {},
  })
}

describe('M08.2 presets visuales de proyecto', () => {
  it('implementa el catálogo completo y cada entrada declara decisiones visuales', () => {
    expect(PROJECT_THEME_PRESETS.map((preset) => preset.id)).toEqual([
      'bento-grid', 'minimal-clean', 'elegant', 'sophisticated-dark', 'high-density',
      'material', 'glassmorphism', 'neobrutalism', 'corporate', 'editorial', 'technical-dashboard',
    ])
    for (const preset of PROJECT_THEME_PRESETS) {
      expect(preset.traits.accessibility).toBe('WCAG 2.2 AA')
      expect(preset.traits.layout).toBeTruthy()
      expect(preset.traits.responsiveProfile).toBeTruthy()
      expect(preset.theme.name).toBe(preset.label)
    }
  })

  it.each(PROJECT_THEME_PRESETS)('$label mantiene contraste WCAG AA en los pares semánticos', (preset) => {
    for (const [foreground, background] of projectThemeContrastPairs(preset.theme)) {
      expect(themeContrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('aplica un preset en un único ámbito sin mutar entrada ni breakpoints', () => {
    const structure = emptyStructure()
    const original = structuredClone(structure)
    const result = applyProjectThemePreset(structure, 'frontend', 'glassmorphism')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.themes.frontend.name).toBe('Glassmorphism')
    expect(result.value.themes.backend).toEqual(DEFAULT_BACKEND_THEME)
    expect(result.value.breakpoints).toEqual(original.breakpoints)
    expect(structure).toEqual(original)
  })
})
