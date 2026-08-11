import { describe, expect, it } from 'vitest'
import { themeContrastRatio } from '../../domain'
import { EDITOR_THEME_PRESETS } from './editor-presets'

describe('M08.2 presets visuales del editor', () => {
  it('implementa los nueve estilos obligatorios mediante tokens', () => {
    expect(EDITOR_THEME_PRESETS.map((preset) => preset.id)).toEqual([
      'high-density', 'google-bento-grid', 'minimal-clean', 'elegant-editorial',
      'sophisticated-dark', 'saas-glassmorphism', 'material-neutral',
      'neobrutalist-modern', 'corporate-pro',
    ])
    for (const preset of EDITOR_THEME_PRESETS) {
      expect(preset.tokens.controlHeight).toBeGreaterThanOrEqual(36)
      expect(preset.tokens.fontFamily).toBeTruthy()
      expect(preset.tokens.shadows).toHaveLength(3)
    }
  })

  it.each(EDITOR_THEME_PRESETS)('$label mantiene contraste AA en claro y oscuro', (preset) => {
    for (const colors of Object.values(preset.tokens.colors)) {
      expect(themeContrastRatio(colors.foreground, colors.canvas)).toBeGreaterThanOrEqual(4.5)
      expect(themeContrastRatio(colors.foreground, colors.surface)).toBeGreaterThanOrEqual(4.5)
      expect(themeContrastRatio(colors.mutedForeground, colors.surface)).toBeGreaterThanOrEqual(4.5)
      expect(themeContrastRatio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5)
      expect(themeContrastRatio(colors.onDestructive, colors.destructive)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
