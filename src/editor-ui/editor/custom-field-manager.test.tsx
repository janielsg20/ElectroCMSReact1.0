import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseContentTypeId, type ContentType } from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectContext, requireContentTypeSession } from './editor-project-context'
import { ProjectDataPanel } from './ProjectDataPanel'

const contentTypeId = parseContentTypeId('61616161-6161-4616-8616-616161616161')

function articleType(): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id: contentTypeId,
    order: 10,
    pluralName: 'Artículos',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: 'Artículo',
    slug: 'articles',
    supports: ['title', 'custom-fields'],
    taxonomyIds: [],
  }
}

async function renderFields() {
  const session = createBrowserEditorProjectSession(`electrocms-fields-ui-${crypto.randomUUID()}`)
  expect((await requireContentTypeSession(session).createContentType(articleType())).ok).toBe(true)
  render(
    <EditorProjectContext value={session}>
      <ProjectDataPanel />
    </EditorProjectContext>,
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Campos personalizados' }))
  await screen.findByRole('textbox', { name: 'Nombre visible' })
  return session
}

describe('M09.3 gestor de campos personalizados', () => {
  it('crea, edita y elimina un campo real sin exigir claves internas en el flujo normal', async () => {
    const session = await renderFields()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre visible' }), { target: { value: 'Subtítulo' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto de ayuda' }), { target: { value: 'Escribe un subtítulo' } })
    expect(screen.queryByRole('textbox', { name: 'Clave interna' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Crear campo' }))

    expect(await screen.findByText(/Subtítulo creado/i)).toBeInTheDocument()
    const created = Object.values(session.store.structure.cms?.fields ?? {})[0]
    expect(created).toMatchObject({ key: 'subtitulo', label: 'Subtítulo', type: 'text' })
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).toContain(created?.id)

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre visible' }), { target: { value: 'Bajada' } })
    fireEvent.click(screen.getByRole('switch', { name: /Campo obligatorio/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(Object.values(session.store.structure.cms?.fields ?? {})[0]).toMatchObject({ label: 'Bajada', required: true })
      expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.fields ?? {})).toHaveLength(0))
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).toHaveLength(0)
  })

  it('expone los 27 tipos con nombres de usuario y reserva la configuración técnica para avanzado', async () => {
    await renderFields()

    const typeButton = screen.getByRole('button', { name: 'Tipo de información' })
    fireEvent.click(typeButton)
    const typeList = screen.getByRole('listbox', { name: 'Tipo de información' })
    expect(within(typeList).getAllByRole('option')).toHaveLength(27)
    expect(within(typeList).getByRole('option', { name: /Lista repetible/i })).toBeInTheDocument()
    fireEvent.click(within(typeList).getByRole('option', { name: /Lista de opciones/i }))
    expect(screen.getByRole('textbox', { name: /Opciones disponibles/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tipo de información' }))
    fireEvent.click(screen.getByRole('option', { name: /Contenido relacionado/i }))
    expect(screen.getByText(/Contenido → Entradas → Relaciones/i)).toBeInTheDocument()
    expect(screen.queryByText(/CPT/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Opciones avanzadas/i }))
    expect(screen.getByRole('textbox', { name: 'Clave interna' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Condiciones técnicas' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Entradas y relaciones' })).toHaveAttribute('aria-selected', 'false')
  })
})
