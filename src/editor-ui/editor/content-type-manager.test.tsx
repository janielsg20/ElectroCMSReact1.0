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
  it('crea, edita y elimina un tipo de contenido desde la UI funcional', async () => {
    const session = renderManager()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre singular' }), { target: { value: 'Artículo' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre plural' }), { target: { value: 'Artículos' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'URL amigable' }), { target: { value: 'articles' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText(/artículos creado\. ahora puedes añadir campos o entradas/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /artículos/i })).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.contentTypes ?? {})).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /Opciones avanzadas/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Visible en el sitio' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre plural' }), { target: { value: 'Publicaciones' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      const current = Object.values(session.store.structure.cms?.contentTypes ?? {})[0]
      expect(current?.public).toBe(false)
      expect(current?.pluralName).toBe('Publicaciones')
      expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('button', { name: 'Confirmar eliminación' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))

    expect(await screen.findByText(/publicaciones eliminado/i)).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.contentTypes ?? {})).toHaveLength(0)
  })

  it('mantiene densidad responsive, soporte accesible y oculta complejidad técnica', () => {
    renderManager()

    expect(screen.getByRole('textbox', { name: 'Nombre singular' })).toHaveClass('min-h-11', 'lg:min-h-9')
    expect(screen.getByRole('button', { name: /Opciones avanzadas/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText(/Empieza por lo esencial\. ElectroCMS configura valores seguros para el resto/i)).toBeInTheDocument()
    expect(screen.getByText(/Después de crear el tipo, usa las pestañas Campos, Clasificaciones y Entradas/i)).toBeInTheDocument()
    expect(screen.queryByText(/M09\.5/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/CPT/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /crear taxonomía/i })).not.toBeInTheDocument()
  })
})
