import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../primitives'
import type { IconName } from '../primitives/Icon'

export type InspectorTab = 'content' | 'style' | 'advanced'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

const tabs: readonly { id: InspectorTab; label: string; accent: string; icon: IconName }[] = [
  { id: 'style', label: 'Propiedades', accent: 'var(--color-primary)', icon: 'settings' },
  { id: 'content', label: 'Acción', accent: 'var(--color-warning)', icon: 'cursor' },
  { id: 'advanced', label: 'Backend', accent: 'var(--color-accent-data)', icon: 'code' },
]

function PropertyRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <div className="grid gap-1"><span className="text-[0.625rem] font-semibold leading-3 text-muted-foreground">{label}</span>{children}</div>
}

function SelectControl({ value }: { readonly value: string }) {
  return <button className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded border border-[var(--color-accent-data)]/25 bg-[color-mix(in_srgb,var(--color-accent-data)_5%,var(--color-surface))] px-2 text-left text-[0.6875rem] font-semibold transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-data)_12%,var(--color-surface))] lg:min-h-8 lg:px-1.5 lg:text-[0.625rem]" type="button"><span>{value}</span><Icon className="text-[var(--color-accent-data)]" name="chevron-down" size={12} /></button>
}

function SectionTitle({ children, icon = 'settings' }: { readonly children: ReactNode; readonly icon?: IconName }) {
  return <div className="flex items-center justify-between"><h3 className="flex items-center gap-1 text-[0.6875rem] font-bold lg:text-[0.625rem]"><Icon className="text-[var(--color-accent-ai)]" name={icon} size={12} />{children}</h3><Icon className="text-[var(--color-accent-ai)]" name="chevron-down" size={12} /></div>
}

export function InspectorPanel({ activeTab, onTabChange, className = '' }: InspectorPanelProps) {
  return (
    <aside aria-label="Inspector de propiedades" className={`min-h-0 border-l border-border bg-surface ${className}`}>
      <div className="grid grid-cols-3 gap-px border-b border-border bg-border p-1.5 lg:p-1" role="tablist" aria-label="Propiedades">
        {tabs.map((tab) => <button aria-selected={activeTab === tab.id} className={`flex min-h-11 cursor-pointer items-center justify-center gap-0.5 rounded border-b-2 px-0.5 text-[0.5625rem] font-semibold transition-colors lg:min-h-8 ${activeTab === tab.id ? 'border-[var(--tab-accent)] bg-[color-mix(in_srgb,var(--tab-accent)_12%,var(--color-surface))] text-[var(--tab-accent)] shadow-sm' : 'border-transparent bg-[color-mix(in_srgb,var(--tab-accent)_5%,var(--color-surface))] text-[var(--tab-accent)] hover:bg-[color-mix(in_srgb,var(--tab-accent)_10%,var(--color-surface))]'}`} key={tab.id} onClick={() => onTabChange(tab.id)} role="tab" style={{ '--tab-accent': tab.accent } as CSSProperties} type="button"><Icon name={tab.icon} size={11} />{tab.label}</button>)}
      </div>

      <div className="h-full overflow-y-auto pb-16 lg:pb-6" role="tabpanel">
        {activeTab === 'style' ? (
          <div className="divide-y divide-border">
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="text">Editar texto</SectionTitle>
              <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground" htmlFor="hero-heading"><span className="sr-only">Contenido del texto seleccionado</span><textarea className="min-h-16 resize-y rounded border border-primary bg-surface p-1.5 text-[0.6875rem] font-semibold text-foreground outline-none ring-1 ring-primary/10 focus-visible:ring-focus lg:text-[0.625rem]" defaultValue="Historias que amplían tu horizonte." id="hero-heading" /></label>
            </section>
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="columns">Alineación y padding</SectionTitle>
              <div className="grid grid-cols-[minmax(0,1fr)_6.75rem] gap-2">
                <div className="grid gap-1.5"><PropertyRow label="Eje X"><SelectControl value="Inicio" /></PropertyRow><PropertyRow label="Eje Y"><SelectControl value="Centro" /></PropertyRow></div>
                <div className="grid grid-cols-3 gap-0.5 rounded-md bg-muted p-0.5" role="group" aria-label="Alineación visual">{Array.from({ length: 9 }, (_, index) => <button aria-label={`Posición ${index + 1}`} className={`grid size-11 cursor-pointer place-items-center rounded hover:bg-surface lg:size-8 ${index === 3 ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground'}`} key={index} type="button"><span className="size-1.5 rounded-sm bg-current" /></button>)}</div>
              </div>
            </section>
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="resize">Espaciado</SectionTitle>
              <div className="grid grid-cols-2 gap-1">{['Arriba', 'Derecha', 'Abajo', 'Izquierda'].map((side, index) => <label className="grid min-w-0 gap-0.5 text-[0.625rem] text-muted-foreground" key={side}><span>{side}</span><span className="flex min-h-11 min-w-0 items-center rounded border border-[var(--color-accent-ai)]/20 bg-[color-mix(in_srgb,var(--color-accent-ai)_4%,var(--color-surface))] px-1.5 lg:min-h-8"><input aria-label={`Padding ${side.toLowerCase()}`} className="h-11 w-0 min-w-0 flex-1 bg-transparent text-right text-[0.6875rem] text-foreground outline-none lg:h-8 lg:text-[0.625rem]" defaultValue={index % 2 === 0 ? '40' : '24'} inputMode="numeric" /><span className="ml-1">px</span></span></label>)}</div>
              <button className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1 rounded border border-[var(--color-accent-ai)]/25 bg-[color-mix(in_srgb,var(--color-accent-ai)_6%,var(--color-surface))] text-[0.6875rem] font-semibold text-[var(--color-accent-ai)] hover:bg-[color-mix(in_srgb,var(--color-accent-ai)_13%,var(--color-surface))] lg:min-h-8 lg:text-[0.625rem]" type="button"><Icon name="lock" size={12} />Vincular valores</button>
            </section>
            <section className="grid gap-1.5 p-2 lg:p-1.5">
              <SectionTitle icon="heading">Tipografía</SectionTitle>
              <div className="grid grid-cols-2 gap-1"><PropertyRow label="Peso"><SelectControl value="700 · Bold" /></PropertyRow><PropertyRow label="Tamaño"><SelectControl value="48 px" /></PropertyRow></div>
              <div className="flex items-center gap-1"><span className="size-8 rounded border border-border bg-slate-950" aria-label="Color #0F172A" /><code className="text-[0.5625rem] text-[var(--color-accent-ai)]">#0F172A</code><button className="ml-auto min-h-11 rounded border border-[var(--color-accent-ai)]/25 bg-[color-mix(in_srgb,var(--color-accent-ai)_6%,var(--color-surface))] px-2 text-[0.6875rem] font-semibold text-[var(--color-accent-ai)] lg:min-h-8 lg:px-1.5 lg:text-[0.625rem]" type="button">Cambiar</button></div>
            </section>
          </div>
        ) : null}
        {activeTab === 'content' ? <div className="grid gap-1.5 p-2 lg:p-1.5"><section className="rounded border border-warning/30 bg-[color-mix(in_srgb,var(--color-warning)_6%,var(--color-surface))] p-2 lg:p-1.5"><SectionTitle icon="cursor">Interacción al pulsar</SectionTitle><p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground lg:text-[0.625rem]">Este elemento todavía no tiene acciones configuradas.</p><button className="mt-2 min-h-11 w-full cursor-pointer rounded border border-warning/30 bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-surface))] px-2 text-[0.6875rem] font-bold text-warning lg:min-h-8 lg:text-[0.625rem]" type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={13} />Añadir acción</span></button></section><section className="rounded border border-[var(--color-accent-ai)]/25 bg-[color-mix(in_srgb,var(--color-accent-ai)_5%,var(--color-surface))] p-2 lg:p-1.5"><SectionTitle icon="eye">Estados</SectionTitle><div className="mt-1.5 grid gap-1"><SelectControl value="Predeterminado" /><SelectControl value="Al pasar el puntero" /></div></section></div> : null}
        {activeTab === 'advanced' ? <div className="grid gap-1.5 p-2 lg:p-1.5"><section className="rounded border border-[var(--color-accent-data)]/30 bg-[color-mix(in_srgb,var(--color-accent-data)_9%,var(--color-surface))] p-2 lg:p-1.5"><div className="flex gap-1.5"><Icon className="mt-0.5 shrink-0 text-[var(--color-accent-data)]" name="content" size={13} /><div><h3 className="text-[0.6875rem] font-bold text-[var(--color-accent-data)] lg:text-[0.625rem]">Contenido dinámico</h3><p className="mt-0.5 text-[0.6875rem] leading-4 text-muted-foreground lg:text-[0.625rem]">Conecta este texto a un campo del CMS.</p><button className="mt-1.5 min-h-11 rounded border border-[var(--color-accent-data)]/30 bg-surface px-2 text-[0.6875rem] font-bold text-[var(--color-accent-data)] lg:min-h-8 lg:text-[0.625rem]" type="button">Añadir binding</button></div></div></section>{['Responsive', 'Condiciones', 'Atributos HTML'].map((section) => <button className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded border border-[var(--color-accent-ai)]/25 bg-[color-mix(in_srgb,var(--color-accent-ai)_6%,var(--color-surface))] px-2 text-left text-[0.6875rem] font-semibold text-[var(--color-accent-ai)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-ai)_13%,var(--color-surface))] lg:min-h-8 lg:text-[0.625rem]" key={section} type="button"><span className="inline-flex items-center gap-1"><Icon name="code" size={12} />{section}</span><Icon name="chevron-down" size={12} /></button>)}</div> : null}
      </div>
    </aside>
  )
}
