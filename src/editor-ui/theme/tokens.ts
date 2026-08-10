export const colorThemes = {
  light: {
    canvas: '#f7f8fa',
    surface: '#ffffff',
    foreground: '#151922',
    muted: '#f0f2f5',
    mutedForeground: '#5f6673',
    border: '#dfe3e8',
    primary: '#2563eb',
    primaryStrong: '#1d4ed8',
    primarySoft: '#e8f0ff',
    onPrimary: '#ffffff',
    destructive: '#b91c1c',
    onDestructive: '#ffffff',
    focus: '#2563eb',
  },
  dark: {
    canvas: '#0f141d',
    surface: '#171d27',
    foreground: '#f8fafc',
    muted: '#232b37',
    mutedForeground: '#b8c0cc',
    border: '#374151',
    primary: '#60a5fa',
    primaryStrong: '#93c5fd',
    primarySoft: '#172c4c',
    onPrimary: '#08111f',
    destructive: '#f87171',
    onDestructive: '#2b0a0a',
    focus: '#93c5fd',
  },
} as const

export type ThemeMode = keyof typeof colorThemes
export type ColorToken = keyof (typeof colorThemes)['light']
