import { Button, Icon } from '../primitives'

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

interface CanvasPreviewProps {
  readonly viewport: ViewportMode
  readonly onViewportChange: (viewport: ViewportMode) => void
}

const viewportWidths: Record<ViewportMode, string> = {
  desktop: 'min(100%, 920px)',
  tablet: 'min(100%, 680px)',
  mobile: 'min(100%, 390px)',
}

const viewportLabels: Record<ViewportMode, string> = {
  desktop: 'Desktop · 1440',
  tablet: 'Tablet · 768',
  mobile: 'Móvil · 390',
}

export function CanvasPreview({ viewport, onViewportChange }: CanvasPreviewProps) {
  return (
    <main className="relative min-h-0 min-w-0 overflow-hidden bg-editor-grid" id="editor-canvas" tabIndex={-1}>
      <div className="absolute inset-x-0 top-0 z-10 flex min-h-12 items-center justify-between gap-2 border-b border-border bg-surface/95 px-2 backdrop-blur sm:px-3">
        <div className="flex items-center gap-1" role="toolbar" aria-label="Herramientas del canvas">
          <Button aria-label="Herramienta de selección" className="bg-primary-soft text-primary-strong" size="icon" variant="ghost"><Icon name="cursor" /></Button>
          <Button aria-label="Herramienta de estructura, no disponible" disabled size="icon" variant="ghost"><Icon name="columns" /></Button>
          <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">Inicio / Hero / Contenido</span>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-lg border border-border bg-canvas p-0.5" role="group" aria-label="Viewport del documento">
          {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
            <button aria-label={viewportLabels[mode]} aria-pressed={viewport === mode} className={`grid size-10 cursor-pointer place-items-center rounded-md transition-colors ${viewport === mode ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`} key={mode} onClick={() => onViewportChange(mode)} type="button"><Icon name={mode} size={18} /></button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="hidden rounded-md px-2 py-1 font-heading text-xs text-muted-foreground lg:inline">75%</span>
          <Button aria-label="Opciones del canvas" size="icon" variant="ghost"><Icon name="more" /></Button>
        </div>
      </div>

      <div className="h-full overflow-auto px-3 pb-20 pt-16 sm:px-8 sm:pb-12 sm:pt-20">
        <div className="mx-auto transition-[width] duration-200" style={{ width: viewportWidths[viewport] }}>
          <div className="overflow-hidden rounded-xl border border-border bg-white text-slate-950 shadow-lg">
            <div className="flex min-h-14 items-center gap-3 border-b border-slate-200 px-4 sm:px-6">
              <div className="grid size-8 place-items-center rounded-lg bg-violet-700 text-white"><Icon name="sparkles" size={16} /></div>
              <span className="font-heading text-sm font-bold">Horizonte</span>
              <div className="ml-auto hidden items-center gap-5 text-xs font-semibold sm:flex"><span>Explorar</span><span>Historias</span><span>Nosotros</span></div>
              <button className="ml-auto min-h-9 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white sm:ml-2" type="button">Suscríbete</button>
            </div>

            <section className="relative overflow-hidden bg-slate-950 px-5 py-10 text-white sm:px-10 sm:py-14">
              <div className="absolute -right-20 -top-24 size-72 rounded-full bg-violet-600/40 blur-3xl" aria-hidden="true" />
              <div className="absolute bottom-0 right-8 size-32 rounded-full bg-fuchsia-500/20 blur-2xl" aria-hidden="true" />
              <div className="relative max-w-xl rounded-lg outline outline-2 outline-offset-4 outline-violet-400">
                <div className="absolute -top-8 left-0 rounded-t-md bg-violet-600 px-2 py-1 text-[0.625rem] font-bold text-white">Contenedor · Hero</div>
                <p className="font-heading text-[0.625rem] font-bold uppercase tracking-[0.18em] text-violet-300">Ideas para un mundo en movimiento</p>
                <h1 className="mt-3 max-w-lg text-balance font-heading text-3xl font-bold leading-tight sm:text-5xl">Historias que amplían tu horizonte.</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Una revista independiente sobre diseño, tecnología y cultura contemporánea.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="min-h-11 rounded-lg bg-violet-500 px-5 text-sm font-bold text-white" type="button">Leer la edición</button>
                  <button className="min-h-11 rounded-lg border border-slate-600 px-5 text-sm font-bold text-white" type="button">Conocer el proyecto</button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-3 gap-px bg-slate-200 text-center">
              {[['48', 'Historias'], ['12k', 'Lectores'], ['18', 'Países']].map(([value, label]) => (
                <div className="bg-white px-2 py-5" key={label}><strong className="block font-heading text-xl sm:text-2xl">{value}</strong><span className="text-[0.625rem] font-medium text-slate-500 sm:text-xs">{label}</span></div>
              ))}
            </section>

            <section className="px-5 py-8 sm:px-10 sm:py-10">
              <div className="flex items-end justify-between gap-4"><div><p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-violet-700">Selección editorial</p><h2 className="mt-1 font-heading text-xl font-bold sm:text-2xl">Últimas historias</h2></div><span className="text-xs font-semibold text-violet-700">Ver todas</span></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {['Diseño humano', 'Ciudades futuras', 'Trabajo creativo'].map((title, index) => (
                  <article key={title}>
                    <div className={`aspect-[4/3] rounded-lg ${index === 0 ? 'bg-violet-200' : index === 1 ? 'bg-cyan-100' : 'bg-amber-100'}`} />
                    <p className="mt-3 text-[0.625rem] font-bold uppercase tracking-wider text-slate-500">Perspectiva</p>
                    <h3 className="mt-1 font-heading text-sm font-bold sm:text-base">{title}</h3>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <p className="mt-3 text-center font-heading text-xs text-muted-foreground">{viewportLabels[viewport]} · Página Inicio</p>
        </div>
      </div>
    </main>
  )
}
