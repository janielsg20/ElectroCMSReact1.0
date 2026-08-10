import type { ReactNode } from 'react'
import { Icon } from '../primitives'
import type { IconName } from '../primitives/Icon'

export type InspectorTab = 'content' | 'style' | 'advanced'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

const tabs: readonly { id: InspectorTab; label: string; icon: IconName }[] = [
  { id: 'style', label: 'Propiedades', icon: 'settings' },
  { id: 'content', label: 'Acción', icon: 'cursor' },
  { id: 'advanced', label: 'Backend', icon: 'code' },
]

function PropertyRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <div className="grid gap-1"><span className="text-xs font-semibold leading-4 text-muted-foreground">{label}</span>{children}</div>
}

function SelectControl({ value }: { readonly value: string }) {
  return <button className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded border border-border bg-surface px-2 text-left text-xs font-semibold transition-colors hover:border-primary hover:bg-primary-soft lg:min-h-8 lg:px-1.5" type="button"><span className="truncate">{value}</span><Icon className="shrink-0 text-muted-foreground" name="chevron-down" size={12} /></button>
}

function SectionTitle({ children, icon = 'settings' }: { readonly children: ReactNode; readonly icon?: IconName }) {
  return <h3 className="flex items-center gap-1 text-xs font-bold"><Icon className="text-muted-foreground" name={icon} size={12} />{children}</h3>
}

function SelectedWidgetSummary() {
  return (
    <div className="inspector-selection shrink-0 border-b border-border px-2 py-1.5 lg:px-1.5 lg:py-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="grid size-7 shrink-0 place-items-center rounded border border-border bg-muted text-primary lg:size-6"><Icon name="heading" size={13} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold leading-4 text-foreground">Encabezado</p>
          <p className="truncate text-[0.6875rem] leading-4 text-muted-foreground">Hero / Texto</p>
        </div>
        <button aria-label="Opciones del elemento seleccionado" className="grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" type="button"><Icon name="more" size={13} /></button>
      </div>
    </div>
  )
}

export function InspectorPanel({ activeTab, onTabChange, className = '' }: InspectorPanelProps) {
  return (
    <aside aria-label="Inspector de propiedades" className={`inspector-panel flex min-h-0 flex-col border-l border-border bg-surface ${className}`}>
      <SelectedWidgetSummary />

      <div className="grid shrink-0 grid-cols-3 gap-px border-b border-border bg-border p-1.5 lg:p-1" role="tablist" aria-label="Propiedades">
        {tabs.map((tab) => <button aria-controls="inspector-active-panel" aria-selected={activeTab === tab.id} className={`flex min-h-11 cursor-pointer items-center justify-center gap-0.5 rounded border-b-2 px-0.5 text-xs font-semibold transition-colors active:bg-primary/15 lg:min-h-8 ${activeTab === tab.id ? 'border-primary bg-primary-soft text-primary-strong shadow-sm' : 'border-transparent bg-surface text-foreground hover:bg-primary-soft hover:text-primary-strong'}`} id={`inspector-tab-${tab.id}`} key={tab.id} onClick={() => onTabChange(tab.id)} role="tab" type="button"><Icon name={tab.icon} size={11} />{tab.label}</button>)}
      </div>

      <div aria-labelledby={`inspector-tab-${activeTab}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-16 lg:pb-6" id="inspector-active-panel" role="tabpanel">
        {activeTab === 'style' ? (
          <div className="divide-y divide-border">
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="text">Contenido</SectionTitle>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground" htmlFor="hero-heading"><span className="sr-only">Contenido del texto seleccionado</span><textarea className="min-h-16 resize-y rounded border border-primary bg-surface p-1.5 text-xs font-semibold text-foreground outline-none ring-1 ring-primary/10 focus-visible:ring-focus" defaultValue="Historias que amplían tu horizonte." id="hero-heading" /></label>
            </section>

            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="columns">Layout</SectionTitle>
              <div className="grid grid-cols-[minmax(0,1fr)_8.75rem] gap-2 lg:grid-cols-[minmax(0,1fr)_6.75rem]">
                <div className="grid gap-1.5"><PropertyRow label="Horizontal"><SelectControl value="Inicio" /></PropertyRow><PropertyRow label="Vertical"><SelectControl value="Centro" /></PropertyRow></div>
                <div className="grid grid-cols-3 gap-0.5 rounded-md bg-muted p-0.5" role="group" aria-label="Alineación visual">{Array.from({ length: 9 }, (_, index) => <button aria-label={`Posición ${index + 1}`} className={`grid size-11 cursor-pointer place-items-center rounded hover:bg-surface lg:size-8 ${index === 3 ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground'}`} key={index} type="button"><span className="size-1.5 rounded-sm bg-current" /></button>)}</div>
              </div>
            </section>

            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="resize">Padding</SectionTitle>
              <div className="grid grid-cols-2 gap-1">{['Arriba', 'Derecha', 'Abajo', 'Izquierda'].map((side, index) => <label className="grid min-w-0 gap-0.5 text-xs text-muted-foreground" key={side}><span>{side}</span><span className="flex min-h-11 min-w-0 items-center rounded border border-border bg-surface px-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-focus lg:min-h-8"><input aria-label={`Padding ${side.toLowerCase()}`} className="h-11 w-0 min-w-0 flex-1 bg-transparent text-right text-xs text-foreground outline-none lg:h-8" defaultValue={index % 2 === 0 ? 40 : 24} inputMode="numeric" min={0} type="number" /><span className="ml-1">px</span></span></label>)}</div>
              <button className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1 rounded border border-border bg-surface text-xs font-semibold text-primary hover:border-primary hover:bg-primary-soft lg:min-h-8" type="button"><Icon name="lock" size={12} />Vincular valores</button>
            </section>

            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="heading">Tipografía</SectionTitle>
              <div className="grid grid-cols-2 gap-1"><PropertyRow label="Peso"><SelectControl value="700 · Bold" /></PropertyRow><PropertyRow label="Tamaño"><SelectControl value="48 px" /></PropertyRow></div>
              <div className="flex items-center gap-1"><span aria-label="Color #0F172A" className="size-8 rounded border border-border bg-slate-950" role="img" /><code className="text-xs text-muted-foreground">#0F172A</code><button className="ml-auto min-h-11 rounded border border-border bg-surface px-2 text-xs font-semibold text-primary hover:border-primary hover:bg-primary-soft active:bg-primary/15 lg:min-h-8 lg:px-1.5" type="button">Cambiar</button></div>
            </section>
          </div>
        ) : null}

        {activeTab === 'content' ? <div className="grid gap-1.5 p-2 lg:p-1.5"><section className="rounded border border-warning/30 bg-[color-mix(in_srgb,var(--color-warning)_6%,var(--color-surface))] p-2 lg:p-1.5"><SectionTitle icon="cursor">Acciones</SectionTitle><p className="mt-1 text-xs leading-4 text-muted-foreground">Este elemento todavía no tiene acciones configuradas.</p><button className="mt-2 min-h-11 w-full cursor-pointer rounded border border-warning/30 bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-surface))] px-2 text-xs font-bold text-warning lg:min-h-8" type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={13} />Añadir acción</span></button></section><section className="rounded border border-border bg-surface p-2 lg:p-1.5"><SectionTitle icon="eye">Estados visuales</SectionTitle><div className="mt-1.5 grid gap-1"><SelectControl value="Predeterminado" /><SelectControl value="Al pasar el puntero" /></div></section></div> : null}

        {activeTab === 'advanced' ? <div className="grid gap-1.5 p-2 lg:p-1.5"><section className="rounded border border-primary/30 bg-primary-soft p-2 lg:p-1.5"><div className="flex gap-1.5"><Icon className="mt-0.5 shrink-0 text-primary" name="content" size={13} /><div><h3 className="text-xs font-bold text-primary-strong">Contenido dinámico</h3><p className="mt-0.5 text-xs leading-4 text-muted-foreground">Conecta este texto a un campo del CMS.</p><button className="mt-1.5 min-h-11 rounded border border-primary/30 bg-surface px-2 text-xs font-bold text-primary lg:min-h-8" type="button">Añadir binding</button></div></div></section>{['Responsive', 'Condiciones', 'Atributos HTML'].map((section) => <button aria-label={`${section}, planificado`} className="flex min-h-11 w-full cursor-not-allowed items-center justify-between rounded border border-border bg-surface px-2 text-left text-xs font-semibold text-muted-foreground opacity-70 lg:min-h-8" disabled key={section} type="button"><span className="inline-flex items-center gap-1"><Icon name="code" size={12} />{section}</span><Icon name="chevron-down" size={12} /></button>)}</div> : null}
      </div>
    </aside>
  )
}
