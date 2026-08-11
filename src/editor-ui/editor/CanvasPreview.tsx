import { Button, Icon } from '../primitives'

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

interface CanvasPreviewProps {
  readonly viewport: ViewportMode
  readonly onViewportChange: (viewport: ViewportMode) => void
  readonly onToggleLibrary: () => void
  readonly onToggleInspector: () => void
  readonly libraryOpen: boolean
  readonly inspectorOpen: boolean
}

const viewportWidths: Record<ViewportMode, string> = {
  desktop: 'min(100%, 940px)',
  tablet: 'min(100%, 700px)',
  mobile: 'min(100%, 390px)',
}

const viewportLabels: Record<ViewportMode, string> = {
  desktop: 'Escritorio · 1440',
  tablet: 'Tablet · 768',
  mobile: 'Móvil · 390',
}

export function CanvasPreview({ viewport, onViewportChange, onToggleLibrary, onToggleInspector, libraryOpen, inspectorOpen }: CanvasPreviewProps) {
  const isDevice = viewport !== 'desktop'
  return (
    <main className="canvas-workspace relative row-start-2 min-h-0 min-w-0 overflow-hidden bg-editor-grid md:col-start-2 lg:col-start-3" id="editor-canvas" tabIndex={-1}>
      <div className="canvas-toolbar absolute inset-x-0 top-0 z-10 flex min-h-12 items-center justify-between gap-1 border-b border-border bg-surface/95 px-1.5 backdrop-blur lg:min-h-10 lg:px-1">
        <div className="flex min-w-0 items-center gap-1" role="toolbar" aria-label="Herramientas del canvas">
          <span className="hidden md:block" data-tooltip="Páginas y capas"><Button aria-label="Alternar páginas y capas" className={libraryOpen ? 'bg-primary-soft text-primary-strong' : ''} onClick={onToggleLibrary} size="icon" variant="ghost"><Icon name="panel-left" /></Button></span>
          <span data-tooltip="Seleccionar"><Button aria-label="Herramienta de selección" className="bg-primary-soft text-primary-strong" size="icon" variant="ghost"><Icon name="cursor" /></Button></span>
          <span className="hidden sm:block" data-tooltip="Estructura · planificado"><Button aria-label="Herramienta de estructura, no disponible" disabled size="icon" variant="ghost"><Icon name="columns" /></Button></span>
          <nav aria-label="Ruta de selección" className="canvas-breadcrumb ml-1 hidden min-w-0 xl:flex">
            <ol className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <li className="truncate">Inicio</li>
              <li aria-hidden="true" className="text-border">/</li>
              <li className="truncate">Hero</li>
              <li aria-hidden="true" className="text-border">/</li>
              <li aria-current="page" className="truncate font-semibold text-foreground">Encabezado</li>
            </ol>
          </nav>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-lg border border-border bg-canvas p-0.5 shadow-sm" role="group" aria-label="Viewport del documento">
          {(['mobile', 'tablet', 'desktop'] as const).map((mode) => (
            <button aria-label={viewportLabels[mode]} aria-pressed={viewport === mode} className={`grid size-11 cursor-pointer place-items-center rounded-md transition-colors lg:size-8 ${viewport === mode ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`} data-tooltip={viewportLabels[mode]} key={mode} onClick={() => onViewportChange(mode)} type="button"><Icon name={mode} size={14} /></button>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-1">
          <span className="hidden xl:block" data-tooltip="Generador IA · planificado"><Button aria-label="Generador IA, planificado" disabled size="small"><Icon name="sparkles" size={16} />Generador IA</Button></span>
          <span aria-label="Zoom del canvas: 90 por ciento" className="canvas-zoom-status hidden rounded-md bg-muted px-2 py-1 font-heading text-xs tabular-nums text-muted-foreground sm:inline">90%</span>
          <span className="hidden md:block" data-tooltip="Inspector"><Button aria-label="Alternar inspector" className={inspectorOpen ? 'bg-primary-soft text-primary-strong' : ''} onClick={onToggleInspector} size="icon" variant="ghost"><Icon name="settings" /></Button></span>
          <span className="hidden sm:block" data-tooltip="Opciones del canvas · planificadas"><Button aria-label="Opciones del canvas, planificadas" disabled size="icon" variant="ghost"><Icon name="more" /></Button></span>
        </div>
      </div>

      <div className="canvas-scroll h-full overflow-auto overscroll-contain px-2 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-14 sm:px-4 sm:pb-10 sm:pt-16 lg:px-2 lg:pb-7 lg:pt-11">
        <div className="mx-auto transition-[width] duration-200" style={{ width: viewportWidths[viewport] }}>
          <div className={isDevice ? `relative mx-auto border-slate-950 bg-slate-950 p-2 shadow-[0_24px_55px_rgba(30,20,50,.28)] ${viewport === 'mobile' ? 'max-w-[24.5rem] rounded-[2.75rem] border-[5px]' : 'rounded-[2rem] border-[4px]'}` : 'overflow-hidden rounded-xl border border-border bg-white shadow-lg'}>
            {isDevice ? <div className={`absolute left-1/2 top-3 z-20 -translate-x-1/2 bg-slate-950 ${viewport === 'mobile' ? 'h-6 w-24 rounded-full' : 'h-2 w-16 rounded-full'}`} aria-hidden="true" /> : null}
            <div className={`overflow-hidden bg-white text-slate-950 ${isDevice ? viewport === 'mobile' ? 'rounded-[2rem]' : 'rounded-[1.35rem]' : ''}`}>
              {isDevice ? <div className="flex h-8 items-end justify-between px-5 pb-1 text-[0.625rem] font-bold"><span>9:41</span><span className="flex items-end gap-1" aria-label="Señal, wifi y batería"><span className="h-2 w-2 rounded-full bg-slate-900" /><span className="h-2 w-3 rounded-t-full border-2 border-b-0 border-slate-900" /><span className="h-2 w-4 rounded-sm border-2 border-slate-900" /></span></div> : null}
              <div className="flex min-h-12 items-center gap-3 border-b border-slate-200 px-4 sm:px-5">
                <div className="grid size-8 place-items-center rounded-md bg-blue-600 text-white"><Icon name="sparkles" size={16} /></div>
                <span className="font-heading text-xs font-bold">Horizonte</span>
                {viewport === 'desktop' ? <div className="ml-auto hidden items-center gap-4 text-xs font-semibold sm:flex"><span>Explorar</span><span>Historias</span><span>Nosotros</span></div> : null}
                <button aria-label={viewport === 'desktop' ? undefined : 'Abrir menú del sitio'} className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-lg bg-slate-950 px-3 text-xs font-bold text-white sm:ml-2" type="button">{viewport === 'desktop' ? 'Suscríbete' : <Icon name="menu" size={16} />}</button>
              </div>

              <section className="relative overflow-hidden bg-slate-50 px-5 py-9 text-slate-950 sm:px-9 sm:py-12">
                <div className="absolute -right-16 -top-20 size-64 rounded-full bg-blue-200/70 blur-3xl" aria-hidden="true" />
                <div className="absolute bottom-0 right-6 size-28 rounded-full bg-cyan-200/50 blur-2xl" aria-hidden="true" />
                <div className="relative max-w-xl rounded-md outline outline-2 outline-offset-4 outline-blue-500">
                  <div aria-label="Elemento seleccionado: Encabezado" className="canvas-selection-chip absolute -top-7 left-0 inline-flex items-center gap-1 rounded-t bg-blue-600 px-2 py-1 text-[0.5625rem] font-bold text-white"><Icon name="text" size={10} />Encabezado</div>
                  <p className="font-heading text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-blue-700">Ideas para un mundo en movimiento</p>
                  <h1 className="mt-2 text-balance font-heading text-2xl font-bold leading-tight sm:text-4xl">Historias que amplían tu horizonte.</h1>
                  <p className="mt-3 max-w-md text-xs leading-5 text-slate-600 sm:text-sm">Diseño, tecnología y cultura contemporánea en una publicación independiente.</p>
                  <div className="mt-5 flex flex-wrap gap-2"><button className="min-h-11 rounded-md bg-blue-600 px-4 text-xs font-bold text-white" type="button">Leer la edición</button><button className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800" type="button">Explorar</button></div>
                </div>
              </section>

              <section className="grid grid-cols-3 gap-px bg-slate-200 text-center">
                {[['48', 'Historias'], ['12k', 'Lectores'], ['18', 'Países']].map(([value, label]) => <div className="bg-white px-1 py-4" key={label}><strong className="block font-heading text-lg">{value}</strong><span className="text-[0.5625rem] font-medium text-slate-500">{label}</span></div>)}
              </section>

              <section className="px-5 py-7 sm:px-9">
                <div className="flex items-end justify-between gap-3"><div><p className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-blue-700">Selección editorial</p><h2 className="mt-1 font-heading text-lg font-bold sm:text-xl">Últimas historias</h2></div><span className="text-[0.625rem] font-semibold text-blue-700">Ver todas</span></div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">{['Diseño humano', 'Ciudades futuras', 'Trabajo creativo'].map((title, index) => <article key={title}><div className={`aspect-[4/3] rounded-md ${index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-cyan-100' : 'bg-slate-100'}`} /><h3 className="mt-2 text-[0.625rem] font-bold sm:text-xs">{title}</h3></article>)}</div>
              </section>
            </div>
            {viewport === 'mobile' ? <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/90" aria-hidden="true" /> : null}
          </div>
          <div aria-live="polite" className="mt-1.5 flex items-center justify-center gap-1.5 text-center font-heading text-[0.625rem] text-muted-foreground"><span className="size-1.5 rounded-full bg-success" />{viewportLabels[viewport]} · Inicio</div>
        </div>
      </div>
    </main>
  )
}
