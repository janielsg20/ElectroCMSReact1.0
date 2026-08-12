import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseContentTypeId, type ContentType } from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectProvider } from './EditorProjectProvider'
import { QueryManager } from './QueryManager'
import { requireContentTypeSession } from './editor-project-context'

const contentTypeId = parseContentTypeId('b1111111-1111-4111-8111-111111111111')

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
    supports: ['title'],
    taxonomyIds: [],
  }
}

async function setup() {
  const session = createBrowserEditorProjectSession(`electrocms-query-manager-${crypto.randomUUID()}`)
  const contentTypes = requireContentTypeSession(session)
  expect((await contentTypes.createContentType(articleType())).ok).toBe(true)
  render(<EditorProjectProvider session={session}><QueryManager /></EditorProjectProvider>)
  return session
}

describe('M10.2 QueryManager', () => {
  it('crea una consulta real desde el constructor visual y la persiste por Command Bus', async () => {
    const session = await setup()

    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre de consulta' }), { target: { value: 'Publicados recientes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }))

    expect(screen.getByRole('combobox', { name: 'Operador del grupo 1' })).toHaveValue('all')
    expect(screen.getByRole('combobox', { name: 'Fuente del predicado' })).toHaveValue('status')
    expect(screen.getByRole('combobox', { name: 'Valor de estado' })).toHaveValue('published')
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(Object.values(session.store.structure.cms?.queries ?? {})).toHaveLength(1))

    const queries = Object.values(session.store.structure.cms?.queries ?? {})
    expect(queries[0]).toMatchObject({ name: 'Publicados recientes', contentTypeId, limit: 100, offset: 0, pageSize: 20 })
  })

  it('muestra diagnóstico canónico y bloquea guardado cuando una fuente requiere un campo inexistente', async () => {
    await setup()

    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Fuente del predicado' }), { target: { value: 'field' } })

    expect(screen.getByText('Consulta inválida')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    expect(screen.getByText(/requiere un campo del tipo consultado/i)).toBeInTheDocument()
  })

  it('ofrece AND/OR, orden y paginación sin exponer funciones de listings M10.3', async () => {
    await setup()

    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Operador del grupo 1' }), { target: { value: 'any' } })
    fireEvent.click(screen.getByRole('button', { name: 'Orden' }))

    expect(screen.getByRole('combobox', { name: 'Operador del grupo 1' })).toHaveValue('any')
    expect(screen.getByRole('combobox', { name: 'Campo de orden 1' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Límite de resultados' })).toHaveValue(100)
    expect(screen.getByRole('spinbutton', { name: 'Offset de resultados' })).toHaveValue(0)
    expect(screen.getByRole('spinbutton', { name: 'Tamaño de página' })).toHaveValue(20)
    expect(screen.queryByText(/columnas dinámicas|listing|tabla configurable/i)).not.toBeInTheDocument()
  })
})
