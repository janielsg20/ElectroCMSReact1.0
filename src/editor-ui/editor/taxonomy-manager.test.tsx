import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { parseContentTypeId, type ContentType } from '../../domain'
import { EditorProjectContext, requireContentTypeSession } from './editor-project-context'
import { ProjectDataPanel } from './ProjectDataPanel'

const contentTypeId = parseContentTypeId('81818181-8181-4818-8818-818181818181')

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

async function renderDataPanel() {
  const session = createBrowserEditorProjectSession(`electrocms-taxonomy-ui-${crypto.randomUUID()}`)
  const contentTypes = requireContentTypeSession(session)
  expect((await contentTypes.createContentType(articleType())).ok).toBe(true)
  render(
    <EditorProjectContext value={session}>
      <ProjectDataPanel />
    </EditorProjectContext>,
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Clasificaciones' }))
  await screen.findByRole('button', { name: 'Nueva' })
  return session
}

describe('M09.2 gestor de clasificaciones', () => {
  it('crea una clasificación y opciones, sincroniza el contenido y protege borrados', async () => {
    const session = await renderDataPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre singular' }), { target: { value: 'Categoría' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre plural' }), { target: { value: 'Categorías' } })

    const contentAssociation = screen.getByRole('checkbox', { name: /Artículos/i })
    expect(contentAssociation).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Opciones avanzadas/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'URL amigable' }), { target: { value: 'categories' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear clasificación' }))

    expect(await screen.findByText(/Categorías creada/i)).toBeInTheDocument()
    const taxonomy = Object.values(session.store.structure.cms?.taxonomies ?? {})[0]
    expect(taxonomy?.contentTypeIds).toEqual([contentTypeId])
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.taxonomyIds).toContain(taxonomy?.id)

    const optionsHeading = screen.getByRole('heading', { name: /Opciones · Categorías/i })
    const optionsSection = optionsHeading.closest('section')
    expect(optionsSection).not.toBeNull()
    if (!optionsSection) return
    const options = within(optionsSection)

    fireEvent.click(options.getByRole('button', { name: 'Opción' }))
    fireEvent.change(options.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Arte' } })
    fireEvent.click(options.getByRole('button', { name: /Opciones avanzadas/i }))
    fireEvent.change(options.getByRole('textbox', { name: 'URL amigable' }), { target: { value: 'arte' } })
    fireEvent.click(options.getByRole('button', { name: 'Crear opción' }))

    expect(await options.findByText(/Arte creado/i)).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.taxonomyTerms ?? {})).toHaveLength(1)
    await waitFor(() => expect(options.getByRole('button', { name: 'Eliminar opción' })).toBeEnabled())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.taxonomies ?? {})).toHaveLength(1))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar eliminación' })).toBeEnabled())
    await waitFor(() => expect(options.getByRole('button', { name: 'Eliminar opción' })).toBeEnabled())

    fireEvent.click(options.getByRole('option', { name: /Arte/i }))
    fireEvent.click(options.getByRole('button', { name: 'Eliminar opción' }))
    fireEvent.click(options.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.taxonomyTerms ?? {})).toHaveLength(0))
  })

  it('mantiene navegación accesible y oculta complejidad técnica en el flujo principal', async () => {
    await renderDataPanel()

    const classificationTab = screen.getByRole('tab', { name: 'Clasificaciones' })
    expect(classificationTab).toHaveClass('min-h-11', 'lg:min-h-9')
    expect(classificationTab).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    expect(screen.getByRole('checkbox', { name: /Artículos/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByText(/CPT/i)).not.toBeInTheDocument()

    const fieldsTab = screen.getByRole('tab', { name: 'Campos personalizados' })
    expect(fieldsTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByRole('button', { name: /crear campo/i })).not.toBeInTheDocument()
  })
})
