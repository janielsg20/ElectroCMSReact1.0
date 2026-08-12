import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectContext, requireThemePackageSession } from './editor-project-context'
import { ThemePackageManager } from './ThemePackageManager'

function renderManager() {
  const session = createBrowserEditorProjectSession(`electrocms-theme-package-ui-${crypto.randomUUID()}`)
  const themePackages = requireThemePackageSession(session)
  render(
    <EditorProjectContext value={session}>
      <ThemePackageManager />
    </EditorProjectContext>,
  )
  return { session, themePackages }
}

describe('M08.4 gestor de paquetes', () => {
  it('crea, versiona y elimina paquetes locales sin modificar el proyecto al guardarlos', async () => {
    const { session, themePackages } = renderManager()
    const structureBefore = structuredClone(session.store.structure)

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Kit editorial' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar paquete/i }))

    await waitFor(async () => {
      const listed = await themePackages.listThemePackages()
      expect(listed.ok).toBe(true)
      if (listed.ok) expect(listed.value).toHaveLength(1)
    })
    expect(await screen.findByRole('option', { name: /kit editorial/i })).toBeInTheDocument()
    expect(session.store.structure).toEqual(structureBefore)

    fireEvent.click(screen.getByRole('button', { name: '+ minor' }))
    await screen.findByText(/versión actualizada a 1\.1\.0/i)
    expect(screen.getByRole('option', { name: /v1\.1\.0/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('button', { name: 'Confirmar eliminación' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    await screen.findByText(/paquete local eliminado/i)
    await waitFor(async () => {
      const listed = await themePackages.listThemePackages()
      expect(listed.ok).toBe(true)
      if (listed.ok) expect(listed.value).toHaveLength(0)
    })
  })

  it('mantiene targets táctiles y explica que importar no aplica automáticamente', () => {
    renderManager()
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveClass('min-h-11', 'lg:min-h-9')
    expect(screen.getByText(/importar nunca aplica ni sobrescribe por sí solo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument()
  })
})
