import 'fake-indexeddb/auto'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectProvider } from './EditorProjectProvider'
import { ProjectDataPanel } from './ProjectDataPanel'

describe('M13.3 ProjectBlueprintManager', () => {
  it('permite elegir y aplicar un modelo desde Contenido sin exponer detalles internos', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-blueprints-${crypto.randomUUID()}`)
    render(<EditorProjectProvider session={session}><ProjectDataPanel /></EditorProjectProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'Modelos de proyecto' }))
    expect(await screen.findByRole('heading', { name: 'Empezar con un modelo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('listitem', { name: /Estudio de tatuajes/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Usar Estudio de tatuajes' }))

    expect(await screen.findByText(/Modelo Estudio de tatuajes aplicado/i)).toBeInTheDocument()
    expect(Object.values(session.store.structure.cms?.contentTypes ?? {}).map((item) => item.slug)).toContain('tattoo-booking')
    expect(screen.queryByText(/ProjectStructure|Command Bus|M13\.3/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Usar Estudio de tatuajes' }))
    expect(await screen.findByText(/No se pudo aplicar el modelo: Ya existe un tipo de contenido/i)).toBeInTheDocument()
  })
})
