import { bentoColorThemes, colorThemes } from './tokens'

function relativeLuminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)
  if (!channels || channels.length !== 3) throw new Error(`Color hexadecimal inválido: ${hex}`)

  const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

describe('tokens de color', () => {
  it.each([...Object.entries(colorThemes).map(([mode, colors]) => [`studio-${mode}`, colors] as const), ...Object.entries(bentoColorThemes).map(([mode, colors]) => [`bento-${mode}`, colors] as const)])('%s mantiene contraste AA en pares de texto', (_mode, colors) => {
    expect(contrastRatio(colors.foreground, colors.canvas)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(colors.foreground, colors.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(colors.mutedForeground, colors.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(colors.onDestructive, colors.destructive)).toBeGreaterThanOrEqual(4.5)
  })
})
