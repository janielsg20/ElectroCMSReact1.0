import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseContentTypeId, type ContentType } from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import {
  EditorProjectContext,
  requireContentTypeSession,
} from './editor-project-context'
import { ProjectDataPanel } from './ProjectDataPanel'

const articleTypeId = parseContentTypeId('91919191-9191-4919-8919-919191919191')
const authorTypeId = parseContentTypeId('92929292-9292-4929-8929-929292929292')

function contentType(id: typeof articleTypeId, article: boolean): ContentType {
  return {
    archiveTemplateId: null,
    capabilities: ['content.read'],
    description: '',
    fieldIds: [],
    icon: 'content',
    id,
    order: article ? 10 : 20,
    pluralName: article ? 'Artículos' : 'Autores',
    public: true,
    showInMenu: true,
    singleTemplateId: null,
    singularName: article ? 'Artículo' : 'Autor',
    slug: article ? 'articles' : 'authors',
    supports: article ? ['title', 'revisions'] : ['title'],
    taxonomyIds: [],
  }
}

async function renderRecords() {
  const session = createBrowserEditorProjectSession(`electrocms-records-ui-${crypto.randomUUID()}`)
  const contentTypes = requireContentTypeSession(session)
  expect((await contentTypes.createContentType(contentType(articleTypeId, true))).ok).toBe(true)
  expect((await contentTypes.createContentType(contentType(authorTypeId, false))).ok).toBe(true)

  render(
    <EditorProjectContext value={session}>
      <ProjectDataPanel />
    </EditorProjectContext>,
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Registros' }))
  return session
}

async function createRecordFor(typeName: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de contenido' }), { target: { value: typeName === 'Artículos' ? articleTypeId : authorTypeId } })
  fireEvent.click(screen.getByRole('button', { name: 'Crear registro' }))
  await screen.findByText(/Registro creado en el proyecto/i)
}

describe('M09.4 gestor de registros y relaciones', () => {
  it('crea borradores, genera revisiones y conecta registros con integridad', async () => {
    const session = await renderRecords()

    expect(screen.getByRole('tab', { name: 'Registros' })).toHaveClass('min-h-11', 'lg:min-h-9')
    expect(screen.getByRole('tab', { name: 'Relaciones' })).toHaveAttribute('aria-selected', 'false')

    await createRecordFor('Artículos')
    const articleRecord = Object.values(session.store.structure.cms?.records ?? {}).find((record) => record.contentTypeId === articleTypeId)
    expect(articleRecord?.status).toBe('draft')

    fireEvent.change(screen.getByRole('combobox', { name: 'Estado' }), { target: { value: 'pending' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(session.store.structure.cms?.records[articleRecord!.id]?.status).toBe('pending'))
    expect(Object.values(session.store.structure.cms?.recordRevisions ?? {})).toHaveLength(1)

    await createRecordFor('Autores')
    const authorRecord = Object.values(session.store.structure.cms?.records ?? {}).find((record) => record.contentTypeId === authorTypeId)
    expect(authorRecord).toBeDefined()

    fireEvent.click(screen.getByRole('tab', { name: 'Relaciones' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Autor del artículo' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Slug' }), { target: { value: 'article-author' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Origen' }), { target: { value: articleTypeId } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Destino' }), { target: { value: authorTypeId } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear relación' }))
    await screen.findByText(/Relación guardada/i)

    expect(Object.values(session.store.structure.cms?.relations ?? {})).toHaveLength(1)
    fireEvent.change(screen.getByRole('combobox', { name: 'Registro origen' }), { target: { value: articleRecord!.id } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Registro destino' }), { target: { value: authorRecord!.id } })
    fireEvent.click(screen.getByRole('button', { name: 'Conectar registros' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.relationEntries ?? {})).toHaveLength(1))

    expect(screen.queryByRole('tab', { name: 'Bindings' })).not.toBeInTheDocument()
  })
})
