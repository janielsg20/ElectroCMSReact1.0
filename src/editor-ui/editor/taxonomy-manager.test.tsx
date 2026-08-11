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
  fireEvent.click(screen.getByRole('tab', { name: 'Taxonomías' }))
  return session
}

describe('M09.2 gestor de taxonomías', () => {
  it('crea taxonomía y términos, sincroniza el CPT y protege borrados', async () => {
    const session = await renderDataPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Singular' }), { target: { value: 'Categoría' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Plural' }), { target: { value: 'Categorías' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Slug' }), { target: { value: 'categories' } })

    const cptAssociation = screen.getByRole('checkbox', { name: /Artículos/i })
    expect(cptAssociation).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Crear taxonomía' }))

    expect(await screen.findByText(/Categorías creada y guardada/i)).toBeInTheDocument()
    const taxonomy = Object.values(session.store.structure.cms?.taxonomies ?? {})[0]
    expect(taxonomy?.contentTypeIds).toEqual([contentTypeId])
    expect(session.store.structure.cms?.contentTypes[contentTypeId]?.taxonomyIds).toContain(taxonomy?.id)

    const termsHeading = screen.getByRole('heading', { name: /Términos · Categorías/i })
    const termsSection = termsHeading.closest('section')
    expect(termsSection).not.toBeNull()
    if (!termsSection) return
    const terms = within(termsSection)

    fireEvent.click(terms.getByRole('button', { name: 'Término' }))
    fireEvent.change(terms.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Arte' } })
    fireEvent.change(terms.getByRole('textbox', { name: 'Slug' }), { target: { value: 'arte' } })
    fireEvent.click(terms.getByRole('button', { name: 'Crear término' }))

    expect(await terms.findByText(/Arte creado/i)).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.taxonomyTerms ?? {})).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    expect(await screen.findByText(/No se puede eliminar Categorías: existen términos/i)).toBeInTheDocument()

    fireEvent.click(terms.getByRole('option', { name: /Arte/i }))
    fireEvent.click(terms.getByRole('button', { name: 'Eliminar término' }))
    fireEvent.click(terms.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.taxonomyTerms ?? {})).toHaveLength(0))
  })

  it('mantiene tabs secundarios accesibles y el aislamiento entre superficies', async () => {
    await renderDataPanel()

    const taxonomyTab = screen.getByRole('tab', { name: 'Taxonomías' })
    expect(taxonomyTab).toHaveClass('min-h-11', 'lg:min-h-9')
    expect(taxonomyTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('checkbox', { name: /Artículos/i })).toHaveClass('size-4')

    const fieldsTab = screen.getByRole('tab', { name: 'Campos' })
    expect(fieldsTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByRole('button', { name: /crear campo/i })).not.toBeInTheDocument()
  })
})
