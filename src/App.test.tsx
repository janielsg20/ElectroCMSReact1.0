import { fireEvent, render, screen, within } from '@testing-library/react'
import { App } from './App'

function firePointer(target: Element | Window, type: string, clientX: number, clientY: number) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, { clientX: { value: clientX }, clientY: { value: clientY } })
  fireEvent(target, event)
}

describe('App', () => {
  it('presenta el editor visual sin habilitar la ejecución de la app', () => {
    render(<App />)

    expect(screen.getByText(/ElectroCMS/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ejecutar app/i })).toBeDisabled()
  })

  it('expone navegación, canvas y paneles con regiones semánticas', () => {
    render(<App />)

    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'editor-canvas')
    expect(screen.getByRole('complementary', { name: /inspector de propiedades/i })).toBeInTheDocument()
  })

  it('expone una biblioteca de widgets filtrable', () => {
    render(<App />)

    const library = screen.getByRole('complementary', { name: /biblioteca y capas/i })
    fireEvent.click(within(library).getByRole('tab', { name: /componentes/i }))
    const search = within(library).getByRole('searchbox', { name: /buscar elementos/i })
    expect(search).toBeInTheDocument()
    expect(within(library).getByRole('button', { name: /contenedor/i })).toBeInTheDocument()
    fireEvent.change(search, { target: { value: 'Formulario' } })
    expect(within(library).queryByRole('button', { name: /contenedor/i })).not.toBeInTheDocument()
    expect(within(library).getByRole('button', { name: /formulario/i })).toBeInTheDocument()
  })

  it('permite colapsar y restaurar los paneles laterales en escritorio', () => {
    const originalMatchMedia = window.matchMedia ? window.matchMedia.bind(window) : undefined
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /alternar páginas y capas/i }))
    expect(screen.queryByRole('complementary', { name: /biblioteca y capas/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /alternar páginas y capas/i }))
    expect(screen.getByRole('complementary', { name: /biblioteca y capas/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /alternar inspector/i }))
    expect(screen.queryByRole('complementary', { name: /inspector de propiedades/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /alternar inspector/i }))
    expect(screen.getByRole('complementary', { name: /inspector de propiedades/i })).toBeInTheDocument()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else Reflect.deleteProperty(window, 'matchMedia')
  })

  it('redimensiona los paneles con teclado y límites accesibles', () => {
    render(<App />)

    const librarySeparator = screen.getByRole('separator', { name: /páginas y capas/i })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '192')
    fireEvent.keyDown(librarySeparator, { key: 'ArrowRight' })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '208')
    fireEvent.keyDown(librarySeparator, { key: 'Home' })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '168')

    const inspectorSeparator = screen.getByRole('separator', { name: /inspector/i })
    fireEvent.keyDown(inspectorSeparator, { key: 'ArrowLeft' })
    expect(inspectorSeparator).toHaveAttribute('aria-valuenow', '240')
    fireEvent.keyDown(inspectorSeparator, { key: 'End' })
    expect(inspectorSeparator).toHaveAttribute('aria-valuenow', '320')
  })

  it('desacopla, mueve, redimensiona, fija y minimiza una ventana con alternativas de teclado', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /desacoplar páginas y capas/i }))
    const floatingPanel = screen.getByRole('region', { name: /páginas y capas · flotante/i })
    expect(floatingPanel).toHaveStyle({ left: '60px', width: '252px' })

    fireEvent.keyDown(screen.getByRole('button', { name: /mover páginas y capas/i }), { key: 'ArrowRight' })
    expect(floatingPanel).toHaveStyle({ left: '76px' })
    fireEvent.keyDown(screen.getByRole('button', { name: /redimensionar ventana páginas y capas/i }), { key: 'ArrowRight' })
    expect(floatingPanel).toHaveStyle({ width: '268px' })

    const moveHandle = screen.getByRole('button', { name: /mover páginas y capas/i })
    firePointer(moveHandle, 'pointerdown', 500, 100)
    firePointer(window, 'pointermove', 520, 112)
    firePointer(window, 'pointerup', 520, 112)
    expect(floatingPanel).toHaveStyle({ left: '96px', top: '76px' })

    const resizeHandle = screen.getByRole('button', { name: /redimensionar ventana páginas y capas/i })
    firePointer(resizeHandle, 'pointerdown', 100, 100)
    firePointer(window, 'pointermove', 116, 116)
    firePointer(window, 'pointerup', 116, 116)
    expect(floatingPanel).toHaveStyle({ width: '284px', height: '556px' })

    const pinButton = screen.getByRole('button', { name: /fijar páginas y capas/i })
    fireEvent.click(pinButton)
    expect(screen.getByRole('button', { name: /desfijar páginas y capas/i })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /minimizar páginas y capas/i }))
    expect(screen.queryByRole('region', { name: /páginas y capas · flotante/i })).not.toBeInTheDocument()
    const edgeTab = screen.getByRole('button', { name: /restaurar páginas y capas/i })
    expect(edgeTab).toHaveClass('panel-edge-tab', 'flex-1')
    fireEvent.click(edgeTab)
    expect(screen.getByRole('region', { name: /páginas y capas · flotante/i })).toBeInTheDocument()
  })

  it('acopla paneles a ambos lados o a la barra sin ofrecer maximización', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: /maximizar/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /desacoplar inspector/i }))
    fireEvent.click(screen.getByRole('button', { name: /acoplar inspector a la izquierda/i }))
    expect(screen.getByRole('region', { name: /inspector · acoplado/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /páginas y capas · flotante/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /desacoplar inspector/i }))
    fireEvent.click(screen.getByRole('button', { name: /acoplar inspector a la barra lateral/i }))
    expect(screen.getByRole('button', { name: /restaurar inspector/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /restaurar inspector/i }))
    expect(screen.getByRole('region', { name: /inspector · flotante/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cerrar inspector/i }))
    expect(screen.queryByRole('complementary', { name: /inspector de propiedades/i })).not.toBeInTheDocument()
  })

  it('redimensiona y expande la barra lateral mostrando etiquetas compactas', () => {
    render(<App />)

    const separator = screen.getByRole('separator', { name: /redimensionar menú lateral/i })
    expect(separator).toHaveAttribute('aria-valuenow', '44')
    fireEvent.keyDown(separator, { key: 'End' })
    expect(separator).toHaveAttribute('aria-valuenow', '168')
    expect(screen.getByRole('button', { name: /contraer menú lateral/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /contraer menú lateral/i }))
    expect(screen.getByRole('button', { name: /expandir menú lateral/i })).toBeInTheDocument()
    firePointer(separator, 'pointerdown', 100, 100)
    firePointer(window, 'pointermove', 132, 100)
    firePointer(window, 'pointerup', 132, 100)
    expect(separator).toHaveAttribute('aria-valuenow', '76')
  })

  it('acopla por arrastre al borde derecho y mantiene alternativa por botones', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /desacoplar páginas y capas/i }))
    const moveHandle = screen.getByRole('button', { name: /mover páginas y capas/i })
    firePointer(moveHandle, 'pointerdown', 500, 100)
    firePointer(window, 'pointermove', window.innerWidth - 20, 140)
    expect(screen.getByText(/acoplar a la derecha/i)).toBeInTheDocument()
    firePointer(window, 'pointerup', window.innerWidth - 20, 140)
    expect(screen.getByRole('region', { name: /páginas y capas · acoplado/i })).toBeInTheDocument()
  })
})
