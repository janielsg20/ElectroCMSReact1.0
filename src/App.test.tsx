import { fireEvent, render, screen, within } from '@testing-library/react'
import { App } from './App'

vi.mock('lottie-react', () => ({ default: () => <span data-testid="lottie-icon" /> }))

function firePointer(target: Element | Window, type: string, clientX: number, clientY: number) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, { clientX: { value: clientX }, clientY: { value: clientY } })
  fireEvent(target, event)
}

describe('App', () => {
  it('presenta el editor visual sin habilitar la ejecución de la app', () => {
    render(<App />)

    expect(screen.getByText(/ElectroCMS/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run/i })).toBeDisabled()
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
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '216')
    fireEvent.keyDown(librarySeparator, { key: 'ArrowRight' })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '232')
    fireEvent.keyDown(librarySeparator, { key: 'Home' })
    expect(librarySeparator).toHaveAttribute('aria-valuenow', '184')

    const inspectorSeparator = screen.getByRole('separator', { name: /inspector/i })
    fireEvent.keyDown(inspectorSeparator, { key: 'ArrowLeft' })
    expect(inspectorSeparator).toHaveAttribute('aria-valuenow', '304')
    fireEvent.keyDown(inspectorSeparator, { key: 'End' })
    expect(inspectorSeparator).toHaveAttribute('aria-valuenow', '360')
  })

  it('desacopla, mueve, redimensiona, fija y minimiza una ventana con alternativas de teclado', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /desacoplar páginas y capas/i }))
    const floatingPanel = screen.getByRole('region', { name: /páginas y capas · flotante/i })
    expect(floatingPanel).toHaveStyle({ left: '60px', width: '268px' })

    fireEvent.keyDown(screen.getByRole('button', { name: /mover páginas y capas/i }), { key: 'ArrowRight' })
    expect(floatingPanel).toHaveStyle({ left: '76px' })
    fireEvent.keyDown(screen.getByRole('button', { name: /redimensionar ventana páginas y capas/i }), { key: 'ArrowRight' })
    expect(floatingPanel).toHaveStyle({ width: '284px' })

    const moveHandle = screen.getByRole('button', { name: /mover páginas y capas/i })
    firePointer(moveHandle, 'pointerdown', 500, 100)
    firePointer(window, 'pointermove', 520, 112)
    firePointer(window, 'pointerup', 520, 112)
    expect(floatingPanel).toHaveStyle({ left: '96px', top: '76px' })

    const resizeHandle = screen.getByRole('button', { name: /redimensionar ventana páginas y capas/i })
    firePointer(resizeHandle, 'pointerdown', 100, 100)
    firePointer(window, 'pointermove', 116, 116)
    firePointer(window, 'pointerup', 116, 116)
    expect(floatingPanel).toHaveStyle({ width: '300px', height: '556px' })

    const pinButton = screen.getByRole('button', { name: /fijar páginas y capas/i })
    fireEvent.click(pinButton)
    expect(screen.getByRole('button', { name: /desfijar páginas y capas/i })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /minimizar páginas y capas/i }))
    expect(screen.queryByRole('region', { name: /páginas y capas · flotante/i })).not.toBeInTheDocument()
    const edgeTab = screen.getByRole('button', { name: /restaurar páginas y capas/i })
    expect(edgeTab).toHaveClass('panel-edge-tab', 'flex-1')
    fireEvent.click(edgeTab)
    expect(screen.getByRole('region', { name: /páginas y capas · flotante/i })).toBeInTheDocument()
  }, 15_000)

  it('acopla paneles a ambos lados o a la barra sin ofrecer maximizar ni cerrar', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: /maximizar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cerrar (inspector|páginas y capas)/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /desacoplar inspector/i }))
    fireEvent.click(screen.getByRole('button', { name: /acoplar inspector a la izquierda/i }))
    expect(screen.getByRole('region', { name: /inspector · acoplado/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /páginas y capas · flotante/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /desacoplar inspector/i }))
    fireEvent.click(screen.getByRole('button', { name: /acoplar inspector a la barra lateral/i }))
    expect(screen.getByRole('button', { name: /restaurar inspector/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /restaurar inspector/i }))
    expect(screen.getByRole('region', { name: /inspector · flotante/i })).toBeInTheDocument()
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

  it('muestra las tres guías de acoplamiento y cancela el arrastre sin cambiar el panel', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /desacoplar páginas y capas/i }))
    const moveHandle = screen.getByRole('button', { name: /mover páginas y capas/i })
    firePointer(moveHandle, 'pointerdown', 500, 100)
    expect(screen.queryByText('Barra lateral')).not.toBeInTheDocument()
    firePointer(window, 'pointermove', 508, 108)
    expect(screen.getByText('Barra lateral')).toBeInTheDocument()
    expect(screen.getByText('Acoplar a la izquierda')).toBeInTheDocument()
    expect(screen.getByText('Acoplar a la derecha')).toBeInTheDocument()
    firePointer(window, 'pointercancel', 20, 100)
    expect(screen.getByRole('region', { name: /páginas y capas · flotante/i })).toBeInTheDocument()
    expect(screen.queryByText('Barra lateral')).not.toBeInTheDocument()
  })

  it('conecta pestañas y paneles con semántica accesible y selección explícita', () => {
    render(<App />)

    const pagesTab = screen.getByRole('tab', { name: /páginas/i })
    expect(pagesTab).toHaveAttribute('aria-controls', 'library-panel-layers')
    expect(screen.getByRole('tabpanel', { name: /páginas/i })).toHaveAttribute('id', 'library-panel-layers')
    expect(screen.getAllByRole('button', { name: /^inicio/i }).find((button) => button.getAttribute('aria-current') === 'page')).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /contenido hero/i })).toHaveAttribute('aria-selected', 'true')

    const propertiesTab = screen.getByRole('tab', { name: /propiedades/i })
    expect(propertiesTab).toHaveAttribute('aria-controls', 'inspector-active-panel')
    expect(screen.getByRole('tabpanel', { name: /propiedades/i })).toHaveAttribute('id', 'inspector-active-panel')
  })

  it('aplica el tema Bento Motion desde los ajustes del header sin sustituir Studio', () => {
    render(<App />)

    const settings = screen.getByRole('button', { name: /ajustes de apariencia/i })
    expect(document.documentElement).toHaveAttribute('data-ui-theme', 'studio')
    fireEvent.click(settings)

    const appearance = screen.getByRole('dialog', { name: /apariencia de la interfaz/i })
    expect(within(appearance).getByRole('radio', { name: /studio/i })).toHaveAttribute('aria-checked', 'true')
    const bento = within(appearance).getByRole('radio', { name: /bento motion/i })
    expect(bento).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(bento)

    expect(document.documentElement).toHaveAttribute('data-ui-theme', 'bento')
    expect(screen.queryByRole('dialog', { name: /apariencia de la interfaz/i })).not.toBeInTheDocument()
    expect(settings).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(settings)
    const reopened = screen.getByRole('dialog', { name: /apariencia de la interfaz/i })
    expect(within(reopened).getByRole('radio', { name: /bento motion/i })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(within(reopened).getByRole('radio', { name: /studio/i }))
    expect(document.documentElement).toHaveAttribute('data-ui-theme', 'studio')
  })

  it('aplica Flow Builder como tema independiente', () => {
    render(<App />)

    const settings = screen.getByRole('button', { name: /ajustes de apariencia/i })
    fireEvent.click(settings)
    const appearance = screen.getByRole('dialog', { name: /apariencia de la interfaz/i })
    const flow = within(appearance).getByRole('radio', { name: /flow builder/i })
    expect(flow).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(flow)

    expect(document.documentElement).toHaveAttribute('data-ui-theme', 'flow')
    expect(screen.queryByRole('dialog', { name: /apariencia de la interfaz/i })).not.toBeInTheDocument()
    expect(settings).toHaveAttribute('aria-expanded', 'false')
  })

  it('cierra los ajustes de apariencia con Escape y devuelve el foco al disparador', () => {
    render(<App />)

    const settings = screen.getByRole('button', { name: /ajustes de apariencia/i })
    fireEvent.click(settings)
    const appearance = screen.getByRole('dialog', { name: /apariencia de la interfaz/i })
    const studio = within(appearance).getByRole('radio', { name: /studio/i })
    fireEvent.keyDown(studio, { key: 'ArrowRight' })
    expect(document.documentElement).toHaveAttribute('data-ui-theme', 'bento')
    expect(within(appearance).getByRole('radio', { name: /bento motion/i })).toHaveFocus()
    fireEvent.keyDown(appearance, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: /apariencia de la interfaz/i })).not.toBeInTheDocument()
  })
})
