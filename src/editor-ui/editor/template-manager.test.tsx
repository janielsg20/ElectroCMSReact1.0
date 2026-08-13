import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { AppSectionContext } from './app-section-context'
import { EditorProjectContext } from './editor-project-context'
import { TemplateManager } from './TemplateManager'

describe('TemplateManager', () => {
  it('propone una ruta única desde el nombre al crear una página', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-template-manager-${crypto.randomUUID()}`)
    render(
      <AppSectionContext value={{ section: 'documents', setSection: () => {} }}>
        <EditorProjectContext value={session}>
          <TemplateManager />
        </EditorProjectContext>
      </AppSectionContext>,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo' }), { target: { value: 'page' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Acerca de nosotros' } })
    expect(screen.getByRole('textbox', { name: 'Ruta' })).toHaveValue('/acerca-de-nosotros')
    fireEvent.click(screen.getByRole('button', { name: 'Crear Página' }))

    await waitFor(() => expect(Object.values(session.store.structure.documents)).toHaveLength(2))
    expect(Object.values(session.store.structure.documents).find((document) => document.name === 'Acerca de nosotros')).toMatchObject({
      kind: 'page',
      routePath: '/acerca-de-nosotros',
    })
  })
})
