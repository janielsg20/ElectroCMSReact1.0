import 'fake-indexeddb/auto'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseMediaAssetId } from '../../domain'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectProvider } from './EditorProjectProvider'
import { ProjectDataPanel } from './ProjectDataPanel'

describe('M13.1 MediaLibraryManager', () => {
  it('muestra recursos locales y permite editar su texto alternativo', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-media-manager-${crypto.randomUUID()}`)
    const assetId = parseMediaAssetId('c1000000-0000-4000-8000-000000000001')
    const imported = await session.importMediaAsset?.({ altText: '', byteSize: 12, contentHash: 'c'.repeat(64), description: '', fileName: 'logo.svg', folderId: null, height: 24, id: assetId, kind: 'icon', mimeType: 'image/svg+xml', name: 'Logotipo', starred: false, tagIds: [], width: 24 }, 'data:image/svg+xml;base64,PHN2Zy8+')
    expect(imported?.ok).toBe(true)
    render(<EditorProjectProvider session={session}><ProjectDataPanel /></EditorProjectProvider>)
    fireEvent.click(screen.getByRole('tab', { name: 'Biblioteca multimedia' }))
    expect(await screen.findByRole('heading', { name: 'Biblioteca multimedia' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /logotipo/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto alternativo' }), { target: { value: 'Marca ElectroCMS' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar metadatos' }))
    expect(await screen.findByText('Metadatos guardados.')).toBeInTheDocument()
    expect(session.store.structure.media?.assets[assetId]?.altText).toBe('Marca ElectroCMS')
  })

  it('crea organización y la asigna al recurso seleccionado', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-media-organization-${crypto.randomUUID()}`)
    const assetId = parseMediaAssetId('c1000000-0000-4000-8000-000000000002')
    await session.importMediaAsset?.({ altText: '', byteSize: 12, contentHash: 'd'.repeat(64), description: '', fileName: 'manual.pdf', folderId: null, height: null, id: assetId, kind: 'document', mimeType: 'application/pdf', name: 'Manual', starred: false, tagIds: [], width: null }, 'data:application/pdf;base64,JVBERi0=')
    render(<EditorProjectProvider session={session}><ProjectDataPanel /></EditorProjectProvider>)
    fireEvent.click(screen.getByRole('tab', { name: 'Biblioteca multimedia' }))
    await screen.findByRole('heading', { name: 'Biblioteca multimedia' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nueva carpeta' }), { target: { value: 'Documentación' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear carpeta' }))
    expect(await screen.findByText('Carpeta creada.')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nueva etiqueta' }), { target: { value: 'Guía' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear etiqueta' }))
    expect(await screen.findByText('Etiqueta creada.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /manual/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Documentación' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guía' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar metadatos' }))
    expect(await screen.findByText('Metadatos guardados.')).toBeInTheDocument()
    expect(Object.values(session.store.structure.media?.folders ?? {})).toHaveLength(1)
    expect(Object.values(session.store.structure.media?.tags ?? {})).toHaveLength(1)
    expect(session.store.structure.media?.assets[assetId]?.folderId).not.toBeNull()
    expect(session.store.structure.media?.assets[assetId]?.tagIds).toHaveLength(1)
  })
})
