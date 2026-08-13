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

describe('M09.3/M11.2 gestor de campos personalizados', () => {
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

  it('expone los 27 tipos y reemplaza las condiciones JSON por el editor visual compartido', async () => {
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
    expect(screen.queryByRole('textbox', { name: /Condiciones técnicas/i })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Cuándo mostrar este campo/i })).toBeInTheDocument()
    expect(screen.getByText(/No hay otros campos disponibles/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Entradas y relaciones' })).toHaveAttribute('aria-selected', 'false')
  })

  it('persiste una condición visual contra otro campo del mismo contenido', async () => {
    const session = await renderFields()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre visible' }), { target: { value: 'Tipo de cliente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear campo' }))
    await screen.findByText(/Tipo de cliente creado/i)
    const source = Object.values(session.store.structure.cms?.fields ?? {}).find((field) => field.label === 'Tipo de cliente')
    expect(source).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre visible' }), { target: { value: 'Empresa' } })
    fireEvent.click(screen.getByRole('button', { name: /Opciones avanzadas/i }))

    const conditions = screen.getByRole('region', { name: /Cuándo mostrar este campo/i })
    fireEvent.click(within(conditions).getByRole('button', { name: 'Grupo' }))
    expect(within(conditions).getByRole('button', { name: 'Campo' })).toHaveTextContent('Tipo de cliente')
    fireEvent.click(screen.getByRole('button', { name: 'Crear campo' }))

    await screen.findByText(/Empresa creado/i)
    const target = Object.values(session.store.structure.cms?.fields ?? {}).find((field) => field.label === 'Empresa')
    expect(target?.conditions).toHaveLength(1)
    expect(target?.conditions[0]?.conditions[0]).toMatchObject({ fieldId: source?.id, operator: 'equals', value: '' })
  })
})
