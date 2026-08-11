import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from '../../editor-project-session'
import { EditorProjectContext } from './editor-project-context'
import { ProjectThemeControl } from './ProjectThemeControl'

function renderControl() {
  const session = createBrowserEditorProjectSession(`electrocms-theme-control-${crypto.randomUUID()}`)
  render(
    <EditorProjectContext value={session}>
      <ProjectThemeControl scope="frontend" theme={session.store.structure.themes.frontend} />
    </EditorProjectContext>,
  )
  return session
}

describe('M08.1 control de tema de proyecto', () => {
  it('expone los once presets y aplica una copia editable mediante historial', async () => {
    const session = renderControl()
    const catalog = screen.getByRole('radiogroup', { name: /presets del frontend generado/i })
    expect(catalog.querySelectorAll('[role="radio"]')).toHaveLength(11)
    fireEvent.click(screen.getByRole('radio', { name: /glassmorphism/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar preset' }))

    await waitFor(() => expect(session.store.structure.themes.frontend.name).toBe('Glassmorphism'))
    expect(await screen.findByText(/glassmorphism aplicado al frontend generado/i)).toBeInTheDocument()
    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    expect(session.store.structure.themes.frontend.name).toBe('Frontend base')
  })

  it('valida y aplica tokens sin modificar el ámbito del editor', async () => {
    const session = renderControl()
    const rootThemeBefore = document.documentElement.dataset.uiTheme
    const textarea = screen.getByRole('textbox', { name: /tokens semánticos/i })
    const tokens = JSON.parse(String((textarea as HTMLTextAreaElement).value)) as { color: { primary: string } }
    tokens.color.primary = '#7c3aed'
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Frontend violeta' } })
    fireEvent.change(textarea, { target: { value: JSON.stringify(tokens) } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar tema' }))

    await waitFor(() => expect(session.store.structure.themes.frontend.tokens.color.primary).toBe('#7c3aed'))
    expect(await screen.findByText('Tema de frontend generado actualizado.')).toBeInTheDocument()
    expect(document.documentElement.dataset.uiTheme).toBe(rootThemeBefore)
  })

  it('bloquea JSON o tokens inválidos antes de crear un comando', async () => {
    const session = renderControl()
    const before = structuredClone(session.store.structure.themes.frontend)
    fireEvent.change(screen.getByRole('textbox', { name: /tokens semánticos/i }), { target: { value: '{' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('JSON válido')
    expect(screen.getByRole('button', { name: 'Aplicar tema' })).toBeDisabled()
    expect(session.store.structure.themes.frontend).toEqual(before)
  })
})
