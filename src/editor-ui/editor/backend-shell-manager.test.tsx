import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectContext } from './editor-project-context'
import { BackendShellManager } from './BackendShellManager'

describe('M12.1 BackendShellManager', () => {
  it('convierte el lienzo actual en dashboard administrativo y persiste navegación sin pedir IDs', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-backend-shell-${crypto.randomUUID()}`)
    render(
      <EditorProjectContext value={session}>
        <BackendShellManager />
      </EditorProjectContext>,
    )

    expect(screen.queryByText(/ID interno/i)).not.toBeInTheDocument()
    expect(screen.getByText(/mismo lienzo/i)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del panel' }), { target: { value: 'Operaciones' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre en el menú' }), { target: { value: 'Resumen' } })
    fireEvent.click(screen.getByRole('button', { name: 'Usar este lienzo como dashboard' }))

    await waitFor(() => expect(Object.values(session.store.structure.cms?.backendScreens ?? {})).toHaveLength(1))
    const adminScreen = Object.values(session.store.structure.cms?.backendScreens ?? {})[0]
    expect(adminScreen).toMatchObject({ documentId: session.documentId, kind: 'dashboard', name: 'Operaciones' })
    const menu = Object.values(session.store.structure.cms?.menus ?? {})[0]
    expect(menu?.name).toBe('Administración')
    const menuItem = menu ? menu.items[menu.rootItemIds[0] ?? ''] : undefined
    expect(menuItem).toMatchObject({ kind: 'screen', label: 'Resumen', screenId: adminScreen?.id })
    expect(screen.getByText('Administrativo')).toBeInTheDocument()
  })

  it('edita y retira la pantalla conservando el documento visual', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-backend-shell-edit-${crypto.randomUUID()}`)
    const { rerender } = render(
      <EditorProjectContext value={session}>
        <BackendShellManager />
      </EditorProjectContext>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Usar este lienzo como dashboard' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.backendScreens ?? {})).toHaveLength(1))

    rerender(
      <EditorProjectContext value={session}>
        <BackendShellManager />
      </EditorProjectContext>,
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre en el menú' }), { target: { value: 'Escritorio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar administración' }))
    await waitFor(() => {
      const menu = Object.values(session.store.structure.cms?.menus ?? {})[0]
      const item = menu ? menu.items[menu.rootItemIds[0] ?? ''] : undefined
      expect(item?.label).toBe('Escritorio')
    })

    const documentBefore = session.store.structure.documents[session.documentId]
    fireEvent.click(screen.getByRole('button', { name: 'Retirar de administración' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar retiro' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.backendScreens ?? {})).toHaveLength(0))
    expect(session.store.structure.documents[session.documentId]).toEqual(documentBefore)
  })
})
