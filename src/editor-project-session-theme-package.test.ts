import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  ThemePackageSchema,
  createThemePackage,
  parseThemePackageId,
} from './domain'
import { createBrowserEditorProjectSession } from './editor-project-session'
import { requireThemePackageSession } from './editor-ui/editor/editor-project-context'

describe('editor theme package integration', () => {
  it('applies selected package parts through the reversible project command bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-theme-package-session-${crypto.randomUUID()}`)
    const themePackages = requireThemePackageSession(session)
    const before = session.store.structure.themes.frontend.name
    const created = createThemePackage(session.store.structure, {
      createdAt: '2026-08-11T22:00:00.000Z',
      name: 'Frontend importado',
      packageId: parseThemePackageId('11111111-aaaa-4bbb-8ccc-222222222222'),
      selection: {
        backendTheme: false,
        documents: false,
        frontendTheme: true,
        globalComponents: false,
      },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const imported = ThemePackageSchema.parse({
      ...created.value,
      contents: {
        ...created.value.contents,
        themes: {
          frontend: {
            ...created.value.contents.themes.frontend,
            name: 'Frontend desde paquete',
          },
        },
      },
    })

    const applied = await themePackages.applyThemePackage(imported, {
      backendTheme: false,
      documents: false,
      frontendTheme: true,
      globalComponents: false,
    }, 'abort')
    expect(applied.ok).toBe(true)
    expect(session.store.structure.themes.frontend.name).toBe('Frontend desde paquete')

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    expect(session.store.structure.themes.frontend.name).toBe(before)
  })
})
