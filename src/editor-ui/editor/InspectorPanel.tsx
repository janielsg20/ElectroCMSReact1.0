import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../primitives'

export type InspectorTab = 'content' | 'style' | 'advanced'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

const tabs: readonly { id: InspectorTab; label: string; accent: string }[] = [
  { id: 'style', label: 'Propiedades', accent: 'var(--color-primary)' },
  { id: 'content', label: 'Acción', accent: 'var(--color-warning)' },
  { id: 'advanced', label: 'Backend', accent: 'var(--color-accent-data)' },
]

function PropertyRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <div className="grid gap-1"><span className="text-[0.625rem] font-semibold leading-3 text-muted-foreground">{label}</span>{children}</div>
}

function SelectControl({ value }: { readonly value: string }) {
  return <button className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-canvas px-2 text-left text-xs font-semibold transition-colors hover:bg-muted lg:min-h-8 lg:px-1.5" type="button"><span>{value}</span><Icon name="chevron-down" size={14} /></button>
}

function SectionTitle({ children }: { readonly children: ReactNode }) {
  return <div className="flex items-center justify-between"><h3 className="text-xs font-bold">{children}</h3><Icon className="text-muted-foreground" name="chevron-down" size={16} /></div>
}

export function InspectorPanel({ activeTab, onTabChange, className = '' }: InspectorPanelProps) {
  return (
    <aside aria-label="Inspector de propiedades" className={`min-h-0 border-l border-border bg-surface ${className}`}>
      <div className="grid grid-cols-3 gap-px border-b border-border bg-border p-1.5 lg:p-1" role="tablist" aria-label="Propiedades">
        {tabs.map((tab) => <button aria-selected={activeTab === tab.id} className={`min-h-11 cursor-pointer rounded border-b-2 px-1 text-[0.625rem] font-semibold transition-colors lg:min-h-8 ${activeTab === tab.id ? 'border-[var(--tab-accent)] bg-surface text-[var(--tab-accent)] shadow-sm' : 'border-transparent bg-muted text-muted-foreground hover:bg-surface hover:text-foreground'}`} key={tab.id} onClick={() => onTabChange(tab.id)} role="tab" style={{ '--tab-accent': tab.accent } as CSSProperties} type="button">{tab.label}</button>)}
      </div>

      <div className="h-full overflow-y-auto pb-16 lg:pb-6" role="tabpanel">
        {activeTab === 'style' ? (
          <div className="divide-y divide-border">
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle>Editar texto</SectionTitle>
              <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground" htmlFor="hero-heading"><span className="sr-only">Contenido del texto seleccionado</span><textarea className="min-h-16 resize-y rounded border border-primary bg-surface p-1.5 text-xs font-semibold text-foreground outline-none ring-1 ring-primary/10 focus-visible:ring-focus" defaultValue="Historias que amplían tu horizonte." id="hero-heading" /></label>
            </section>
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle>Alineación y padding</SectionTitle>
              <div className="grid grid-cols-[minmax(0,1fr)_6.75rem] gap-2">
                <div className="grid gap-1.5"><PropertyRow label="Eje X"><SelectControl value="Inicio" /></PropertyRow><PropertyRow label="Eje Y"><SelectControl value="Centro" /></PropertyRow></div>
                <div className="grid grid-cols-3 gap-0.5 rounded-md bg-muted p-0.5" role="group" aria-label="Alineación visual">{Array.from({ length: 9 }, (_, index) => <button aria-label={`Posición ${index + 1}`} className={`grid size-11 cursor-pointer place-items-center rounded hover:bg-surface lg:size-8 ${index === 3 ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground'}`} key={index} type="button"><span className="size-1.5 rounded-sm bg-current" /></button>)}</div>
              </div>
            </section>
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle>Espaciado</SectionTitle>
              <div className="grid grid-cols-2 gap-1">{['Arriba', 'Derecha', 'Abajo', 'Izquierda'].map((side, index) => <label className="grid min-w-0 gap-0.5 text-[0.625rem] text-muted-foreground" key={side}><span>{side}</span><span className="flex min-h-11 min-w-0 items-center rounded border border-border bg-canvas px-1.5 lg:min-h-8"><input aria-label={`Padding ${side.toLowerCase()}`} className="h-11 w-0 min-w-0 flex-1 bg-transparent text-right text-xs text-foreground outline-none lg:h-8" defaultValue={index % 2 === 0 ? '40' : '24'} inputMode="numeric" /><span className="ml-1">px</span></span></label>)}</div>
              <button className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-canvas text-xs font-semibold hover:bg-muted lg:min-h-8" type="button"><Icon name="lock" size={14} />Vincular valores</button>
            </section>
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle>Tipografía</SectionTitle>
              <div className="grid grid-cols-2 gap-1"><PropertyRow label="Peso"><SelectControl value="700 · Bold" /></PropertyRow><PropertyRow label="Tamaño"><SelectControl value="48 px" /></PropertyRow></div>
              <div className="flex items-center gap-1.5"><span className="size-8 rounded border border-border bg-slate-950" aria-label="Color #0F172A" /><code className="text-[0.625rem] text-muted-foreground">#0F172A</code><button className="ml-auto min-h-11 rounded-md border border-border px-2 text-xs font-semibold lg:min-h-8 lg:px-1.5" type="button">Cambiar</button></div>
            </section>
          </div>
        ) : null}
        {activeTab === 'content' ? <div className="grid gap-1.5 p-2 lg:p-1.5"><section className="rounded-md border border-border bg-canvas p-2 lg:p-1.5"><SectionTitle>Interacción al pulsar</SectionTitle><p className="mt-1 text-xs leading-4 text-muted-foreground">Este elemento todavía no tiene acciones configuradas.</p><button className="mt-2 min-h-11 w-full cursor-pointer rounded-md border border-primary/30 bg-primary-soft px-2 text-xs font-bold text-primary-strong lg:min-h-8" type="button"><span className="inline-flex items-center gap-1.5"><Icon name="plus" size={14} />Añadir acción</span></button></section><section className="rounded-md border border-border p-2 lg:p-1.5"><SectionTitle>Estados</SectionTitle><div className="mt-1.5 grid gap-1"><SelectControl value="Predeterminado" /><SelectControl value="Al pasar el puntero" /></div></section></div> : null}
        {activeTab === 'advanced' ? <div className="grid gap-1.5 p-2 lg:p-1.5"><section className="rounded-md border border-primary/30 bg-primary-soft p-2 lg:p-1.5"><div className="flex gap-1.5"><Icon className="mt-0.5 shrink-0 text-primary" name="content" size={14} /><div><h3 className="text-xs font-bold text-primary-strong">Contenido dinámico</h3><p className="mt-0.5 text-xs leading-4 text-muted-foreground">Conecta este texto a un campo del CMS.</p><button className="mt-1.5 min-h-11 rounded-md border border-primary/30 bg-surface px-2 text-xs font-bold text-primary-strong lg:min-h-8" type="button">Añadir binding</button></div></div></section>{['Responsive', 'Condiciones', 'Atributos HTML'].map((section) => <button className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-canvas px-2 text-left text-xs font-semibold transition-colors hover:bg-muted lg:min-h-8" key={section} type="button"><span>{section}</span><Icon name="chevron-down" size={14} /></button>)}</div> : null}
      </div>
    </aside>
  )
}
