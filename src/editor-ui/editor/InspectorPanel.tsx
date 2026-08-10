import type { ReactNode } from 'react'
import { Icon } from '../primitives'

export type InspectorTab = 'content' | 'style' | 'advanced'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

const tabs: readonly { id: InspectorTab; label: string }[] = [
  { id: 'style', label: 'Diseño' },
  { id: 'content', label: 'Acciones' },
  { id: 'advanced', label: 'Datos' },
]

function PropertyRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <div className="grid gap-1.5"><span className="text-[0.6875rem] font-semibold text-muted-foreground">{label}</span>{children}</div>
}

function SelectControl({ value }: { readonly value: string }) {
  return <button className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-canvas px-3 text-left text-xs font-semibold transition-colors hover:bg-muted" type="button"><span>{value}</span><Icon name="chevron-down" size={16} /></button>
}

function SectionTitle({ children }: { readonly children: ReactNode }) {
  return <div className="flex items-center justify-between"><h3 className="text-xs font-bold">{children}</h3><Icon className="text-muted-foreground" name="chevron-down" size={16} /></div>
}

export function InspectorPanel({ activeTab, onTabChange, className = '' }: InspectorPanelProps) {
  return (
    <aside aria-label="Inspector de propiedades" className={`min-h-0 border-l border-border bg-surface ${className}`}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-3">
        <div className="min-w-0"><p className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">Seleccionado</p><h2 className="truncate text-sm font-bold">Encabezado principal</h2></div>
        <span className="rounded-md bg-primary-soft px-2 py-1 font-heading text-[0.625rem] font-bold text-primary-strong">Texto</span>
      </div>
      <div className="grid grid-cols-3 border-b border-border bg-canvas/60 px-2 pt-1" role="tablist" aria-label="Propiedades">
        {tabs.map((tab) => <button aria-selected={activeTab === tab.id} className={`min-h-11 cursor-pointer border-b-2 px-1 text-xs font-semibold transition-colors ${activeTab === tab.id ? 'border-primary bg-surface text-primary-strong' : 'border-transparent text-muted-foreground hover:text-foreground'}`} key={tab.id} onClick={() => onTabChange(tab.id)} role="tab" type="button">{tab.label}</button>)}
      </div>

      <div className="h-full overflow-y-auto pb-24" role="tabpanel">
        {activeTab === 'style' ? (
          <div className="divide-y divide-border">
            <section className="grid gap-3 p-3">
              <SectionTitle>Contenido</SectionTitle>
              <label className="grid gap-1.5 text-[0.6875rem] font-semibold text-muted-foreground" htmlFor="hero-heading">Editar texto<textarea className="min-h-20 resize-y rounded-lg border border-primary bg-canvas p-3 text-sm font-semibold text-foreground outline-none ring-2 ring-primary/10 focus-visible:ring-focus" defaultValue="Historias que amplían tu horizonte." id="hero-heading" /></label>
            </section>
            <section className="grid gap-3 p-3">
              <SectionTitle>Alineación y distribución</SectionTitle>
              <div className="grid grid-cols-[minmax(0,1fr)_9.25rem] gap-3">
                <div className="grid gap-2"><PropertyRow label="Eje X"><SelectControl value="Inicio" /></PropertyRow><PropertyRow label="Eje Y"><SelectControl value="Centro" /></PropertyRow></div>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Alineación visual">{Array.from({ length: 9 }, (_, index) => <button aria-label={`Posición ${index + 1}`} className={`grid size-11 cursor-pointer place-items-center rounded-md hover:bg-surface ${index === 3 ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground'}`} key={index} type="button"><span className="size-2 rounded-sm bg-current" /></button>)}</div>
              </div>
            </section>
            <section className="grid gap-3 p-3">
              <SectionTitle>Espaciado</SectionTitle>
              <div className="grid grid-cols-4 gap-1.5">{['Arriba', 'Derecha', 'Abajo', 'Izquierda'].map((side, index) => <label className="grid gap-1 text-center text-[0.625rem] text-muted-foreground" key={side}><span>{side[0]}</span><span className="flex min-h-11 items-center rounded-lg border border-border bg-canvas px-1"><input aria-label={`Padding ${side.toLowerCase()}`} className="h-11 min-w-0 flex-1 bg-transparent text-center text-xs text-foreground outline-none" defaultValue={index % 2 === 0 ? '40' : '24'} inputMode="numeric" /><span>px</span></span></label>)}</div>
              <button className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-canvas text-xs font-semibold hover:bg-muted" type="button"><Icon name="lock" size={14} />Vincular valores</button>
            </section>
            <section className="grid gap-3 p-3">
              <SectionTitle>Tipografía</SectionTitle>
              <div className="grid grid-cols-2 gap-2"><PropertyRow label="Peso"><SelectControl value="700 · Bold" /></PropertyRow><PropertyRow label="Tamaño"><SelectControl value="48 px" /></PropertyRow></div>
              <div className="flex items-center gap-2"><span className="size-9 rounded-lg border border-border bg-slate-950" aria-label="Color #0F172A" /><code className="text-xs text-muted-foreground">#0F172A</code><button className="ml-auto min-h-11 rounded-lg border border-border px-3 text-xs font-semibold" type="button">Cambiar</button></div>
            </section>
          </div>
        ) : null}
        {activeTab === 'content' ? <div className="grid gap-3 p-3"><section className="rounded-xl border border-border bg-canvas p-3"><SectionTitle>Interacción al pulsar</SectionTitle><p className="mt-2 text-xs leading-5 text-muted-foreground">Este elemento todavía no tiene acciones configuradas.</p><button className="mt-3 min-h-11 w-full cursor-pointer rounded-lg border border-primary/30 bg-primary-soft px-3 text-xs font-bold text-primary-strong" type="button"><span className="inline-flex items-center gap-2"><Icon name="plus" size={16} />Añadir acción</span></button></section><section className="rounded-xl border border-border p-3"><SectionTitle>Estados</SectionTitle><div className="mt-3 grid gap-2"><SelectControl value="Predeterminado" /><SelectControl value="Al pasar el puntero" /></div></section></div> : null}
        {activeTab === 'advanced' ? <div className="grid gap-3 p-3"><section className="rounded-xl border border-primary/30 bg-primary-soft p-3"><div className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-primary" name="content" size={16} /><div><h3 className="text-xs font-bold text-primary-strong">Contenido dinámico</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Conecta este texto a un campo del CMS.</p><button className="mt-2 min-h-11 rounded-lg border border-primary/30 bg-surface px-3 text-xs font-bold text-primary-strong" type="button">Añadir binding</button></div></div></section>{['Responsive', 'Condiciones', 'Atributos HTML'].map((section) => <button className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-canvas px-3 text-left text-sm font-semibold transition-colors hover:bg-muted" key={section} type="button"><span>{section}</span><Icon name="chevron-down" size={16} /></button>)}</div> : null}
      </div>
    </aside>
  )
}
