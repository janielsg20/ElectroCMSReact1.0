export const colorThemes = {
  light: {
    canvas: '#faf7ff',
    surface: '#ffffff',
    foreground: '#2e1065',
    muted: '#f1ebff',
    mutedForeground: '#5b4b75',
    border: '#cfc3e8',
    primary: '#6d28d9',
    primaryStrong: '#4c1d95',
    primarySoft: '#ede9fe',
    onPrimary: '#ffffff',
    destructive: '#b91c1c',
    onDestructive: '#ffffff',
    focus: '#7c3aed',
  },
  dark: {
    canvas: '#120b1d',
    surface: '#1d132b',
    foreground: '#f5f3ff',
    muted: '#2b1d3e',
    mutedForeground: '#c4b5d9',
    border: '#4b3762',
    primary: '#a78bfa',
    primaryStrong: '#ddd6fe',
    primarySoft: '#2e1a47',
    onPrimary: '#1e0b33',
    destructive: '#f87171',
    onDestructive: '#2b0a0a',
    focus: '#c4b5fd',
  },
} as const

export type ThemeMode = keyof typeof colorThemes
export type ColorToken = keyof (typeof colorThemes)['light']
