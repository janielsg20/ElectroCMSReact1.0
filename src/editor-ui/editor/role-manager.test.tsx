import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectContext } from './editor-project-context'
import { RoleManager } from './RoleManager'

describe('M12.3 RoleManager', () => {
  it('crea y actualiza un rol sin exponer identificadores internos', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-role-manager-${crypto.randomUUID()}`)
    render(<EditorProjectContext value={session}><RoleManager /></EditorProjectContext>)

    expect(screen.queryByText(/ID interno/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roles y permisos' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del rol' }), { target: { value: 'Editor de noticias' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear rol' }))

    await waitFor(() => expect(Object.values(session.store.structure.cms?.roles ?? {})).toHaveLength(1))
    expect(Object.values(session.store.structure.cms?.roles ?? {})[0]).toMatchObject({ name: 'Editor de noticias', slug: 'editor-de-noticias' })

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del rol' }), { target: { value: 'Editor principal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.roles ?? {})[0]?.name).toBe('Editor principal'))
  })
})
