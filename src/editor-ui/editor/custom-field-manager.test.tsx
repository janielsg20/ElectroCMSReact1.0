import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseContentTypeId, type ContentType } from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import {
  EditorProjectContext,
  requireContentTypeSession,
} from './editor-project-context'
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
  fireEvent.click(screen.getByRole('tab', { name: 'Campos' }))
  return session
}

describe('M09.3 gestor de campos personalizados', () => {
  it('crea, edita y elimina un campo real vinculado al CPT', async () => {
    const session = await renderFields()

    fireEvent.change(screen.getByRole('textbox', { name: 'Etiqueta' }), { target: { value: 'Subtítulo' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Clave' }), { target: { value: 'subtitle' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Placeholder' }), { target: { value: 'Escribe un subtítulo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear campo' }))

    expect(await screen.findByText(/Subtítulo creado y vinculado/i)).toBeInTheDocument()
    const created = Object.values(session.store.structure.cms?.fields ?? {})[0]
    expect(created).toMatchObject({ key: 'subtitle', label: 'Subtítulo', type: 'text' })
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).toContain(created?.id)

    fireEvent.change(screen.getByRole('textbox', { name: 'Etiqueta' }), { target: { value: 'Bajada' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /Requerido/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(Object.values(session.store.structure.cms?.fields ?? {})[0]).toMatchObject({ label: 'Bajada', required: true }))

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.fields ?? {})).toHaveLength(0))
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.fieldIds).toHaveLength(0)
  })

  it('expone los 27 tipos y mantiene aisladas las superficies de otras microfases', async () => {
    await renderFields()

    const typeSelect = screen.getByRole('combobox', { name: 'Tipo' })
    expect(within(typeSelect).getAllByRole('option')).toHaveLength(27)
    expect(screen.getByRole('tab', { name: 'Campos' })).toHaveClass('min-h-11', 'lg:min-h-9')

    fireEvent.change(typeSelect, { target: { value: 'select' } })
    expect(screen.getByRole('textbox', { name: /Opciones/i })).toBeInTheDocument()

    fireEvent.change(typeSelect, { target: { value: 'relation' } })
    expect(screen.getByText(/La creación de relaciones pertenece a M09\.4/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /crear relación/i })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Registros y relaciones' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByRole('tab', { name: 'Bindings' })).not.toBeInTheDocument()
  })
})
