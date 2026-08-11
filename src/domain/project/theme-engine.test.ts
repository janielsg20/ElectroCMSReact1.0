import { describe, expect, it } from 'vitest'
import { ProjectStructureSchema } from './structure-schema'
import { compileCanonicalStyles } from './style-engine'
import {
  compileThemeStyleTokens,
  resetProjectTheme,
  setProjectTheme,
  themePersistence,
} from './theme-engine'
import { DEFAULT_BACKEND_THEME, DEFAULT_FRONTEND_THEME } from './theme-schema'

function emptyStructure() {
  return ProjectStructureSchema.parse({
    breakpoints: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', inheritsFrom: null, name: 'Desktop', orientation: 'landscape', width: 1440 }],
    documents: {},
    globalComponents: {},
  })
}

describe('M08.1 ámbitos de tema', () => {
  it('migra estructuras anteriores con frontend y backend independientes', () => {
    const structure = emptyStructure()
    expect(structure.themes.frontend).toEqual(DEFAULT_FRONTEND_THEME)
    expect(structure.themes.backend).toEqual(DEFAULT_BACKEND_THEME)
    expect(structure.themes.frontend).not.toBe(structure.themes.backend)
  })

  it('declara el editor como preferencia local y las salidas como estado canónico', () => {
    expect(themePersistence('editor')).toBe('local-editor-preference')
    expect(themePersistence('frontend')).toBe('canonical-project')
    expect(themePersistence('backend')).toBe('canonical-project')
  })

  it('edita un ámbito sin mutar la entrada ni el ámbito hermano', () => {
    const structure = emptyStructure()
    const backendBefore = structuredClone(structure.themes.backend)
    const updatedTheme = structuredClone(structure.themes.frontend)
    updatedTheme.name = 'Frontend personalizado'
    updatedTheme.tokens.color.primary = '#7c3aed'
    const updated = setProjectTheme(structure, 'frontend', updatedTheme)
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value).not.toBe(structure)
    expect(updated.value.themes.frontend).toMatchObject({ name: 'Frontend personalizado', tokens: { color: { primary: '#7c3aed' } } })
    expect(updated.value.themes.backend).toEqual(backendBefore)
    expect(structure.themes.frontend).toEqual(DEFAULT_FRONTEND_THEME)
  })

  it('rechaza tokens inseguros y restablece solo el ámbito solicitado', () => {
    const structure = emptyStructure()
    const unsafe = structuredClone(structure.themes.frontend)
    unsafe.tokens.typography.bodyFamily = 'Inter; background:url(javascript:1)'
    const rejected = setProjectTheme(structure, 'frontend', unsafe)
    expect(rejected.ok).toBe(false)
    if (rejected.ok) return
    expect(rejected.error[0]?.path).toEqual(['themes', 'frontend', 'tokens', 'typography', 'bodyFamily'])

    const customBackend = structuredClone(structure.themes.backend)
    customBackend.tokens.color.primary = '#be123c'
    const updated = setProjectTheme(structure, 'backend', customBackend)
    if (!updated.ok) throw new Error(updated.error[0]?.message)
    const reset = resetProjectTheme(updated.value, 'backend')
    expect(reset.ok).toBe(true)
    if (!reset.ok) return
    expect(reset.value.themes.backend).toEqual(DEFAULT_BACKEND_THEME)
    expect(reset.value.themes.frontend).toEqual(DEFAULT_FRONTEND_THEME)
  })

  it('alimenta el motor de estilos con tokens del ámbito seleccionado', () => {
    const tokens = compileThemeStyleTokens(DEFAULT_FRONTEND_THEME.tokens)
    const compiled = compileCanonicalStyles({
      backgroundColor: { $token: 'color.surface' },
      borderRadius: { $token: 'radius.md' },
      color: { $token: 'color.text' },
      transitionDuration: { $token: 'duration.normal' },
    }, { tokens })
    expect(compiled.diagnostics).toEqual([])
    expect(compiled.declarations).toMatchObject({
      backgroundColor: '#f8fafc',
      borderRadius: 10,
      color: '#0f172a',
      transitionDuration: '250ms',
    })
  })
})
