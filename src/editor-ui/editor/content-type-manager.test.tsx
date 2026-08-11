import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectContext } from './editor-project-context'
import { ContentTypeManager } from './ContentTypeManager'

function renderManager() {
  const session = createBrowserEditorProjectSession(`electrocms-cpt-ui-${crypto.randomUUID()}`)
  render(
    <EditorProjectContext value={session}>
      <ContentTypeManager />
    </EditorProjectContext>,
  )
  return session
}

describe('M09.1 gestor de tipos de contenido', () => {
  it('crea, edita y elimina un CPT desde la UI funcional', async () => {
    const session = renderManager()

    fireEvent.change(screen.getByRole('textbox', { name: 'Singular' }), { target: { value: 'Artículo' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Plural' }), { target: { value: 'Artículos' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Slug' }), { target: { value: 'articles' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear tipo' }))

    expect(await screen.findByText(/artículos creado y guardado/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /artículos/i })).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.contentTypes ?? {})).toHaveLength(1)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Público' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Plural' }), { target: { value: 'Publicaciones' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.contentTypes ?? {})[0]
      expect(current?.public).toBe(false)
      expect(current?.pluralName).toBe('Publicaciones')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('button', { name: 'Confirmar eliminación' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))

    expect(await screen.findByText(/publicaciones eliminado/i)).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.contentTypes ?? {})).toHaveLength(0)
  })

  it('mantiene densidad responsive, soporte accesible y no expone fases futuras', () => {
    renderManager()

    expect(screen.getByRole('textbox', { name: 'Singular' })).toHaveClass('min-h-11', 'lg:min-h-9')
    expect(screen.getByRole('group', { name: 'Soportes del tipo de contenido' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Campos personalizados' })).toBeInTheDocument()
    expect(screen.getByText(/taxonomías, campos, registros y bindings se activarán en M09\.2–M09\.5/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /crear taxonomía/i })).not.toBeInTheDocument()
  })
})
