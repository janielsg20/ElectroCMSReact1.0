import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from '../../App'
import { EDITOR_WORKSPACE_PREFERENCES_KEY, EditorWorkspacePreferencesSchema } from './workspace-preferences'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

function installViewport(width: number): () => void {
  const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  const innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth')
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => {
      const min = query.match(/min-width:\s*([\d.]+)rem/)
      const max = query.match(/max-width:\s*([\d.]+)rem/)
      const minPx = min ? Number(min[1]) * 16 : 0
      const maxPx = max ? Number(max[1]) * 16 : Number.POSITIVE_INFINITY
      const matches = width >= minPx && width <= maxPx
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      } as MediaQueryList
    }),
  })
  return () => {
    if (matchMediaDescriptor) Object.defineProperty(window, 'matchMedia', matchMediaDescriptor)
    else Reflect.deleteProperty(window, 'matchMedia')
    if (innerWidthDescriptor) Object.defineProperty(window, 'innerWidth', innerWidthDescriptor)
    else Reflect.deleteProperty(window, 'innerWidth')
  }
}

describe('shell tablet M04.2', () => {
  it.each([768, 1023])('mantiene un panel persistente y abre el secundario como overlay a %d px', async (width) => {
    const restoreViewport = installViewport(width)
    try {
      render(<App />)
      await waitFor(() => expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).not.toBeNull())

      expect(screen.getByLabelText(/Inspector · panel persistente tablet/i)).toBeInTheDocument()
      const trigger = screen.getByRole('button', { name: /alternar páginas y capas/i })
      trigger.focus()
      fireEvent.click(trigger)

      const dialog = await screen.findByRole('dialog', { name: /Páginas y capas · panel secundario tablet/i, hidden: true })
      await waitFor(() => expect(document.activeElement).toBe(dialog))
      fireEvent.keyDown(dialog, { key: 'Escape' })
      expect(screen.queryByRole('dialog', { name: /panel secundario tablet/i, hidden: true })).not.toBeInTheDocument()
      await waitFor(() => expect(document.activeElement).toBe(trigger))
    } finally {
      restoreViewport()
    }
  })

  it('permite promover el panel secundario y conserva esa prioridad en workspace.v1', async () => {
    const restoreViewport = installViewport(900)
    try {
      render(<App />)
      await waitFor(() => expect(window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)).not.toBeNull())

      fireEvent.click(screen.getByRole('button', { name: /Abrir Páginas y capas como panel secundario/i, hidden: true }))
      const dialog = await screen.findByRole('dialog', { name: /Páginas y capas · panel secundario tablet/i, hidden: true })
      fireEvent.click(screen.getByRole('button', { name: /Mantener Páginas y capas como panel persistente/i, hidden: true }))

      await waitFor(() => expect(dialog).not.toBeInTheDocument())
      expect(screen.getByLabelText(/Páginas y capas · panel persistente tablet/i)).toBeInTheDocument()
      await waitFor(() => {
        const source = window.localStorage.getItem(EDITOR_WORKSPACE_PREFERENCES_KEY)
        expect(source).not.toBeNull()
        if (!source) return
        const saved = EditorWorkspacePreferencesSchema.parse(JSON.parse(source) as unknown)
        expect(saved.panelOrder).toEqual(['inspector', 'library'])
      })
    } finally {
      restoreViewport()
    }
  })
})
