import { useState, type ReactNode } from 'react'
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
  return <div className="grid min-w-0 gap-1"><span className="text-xs font-semibold leading-4 text-muted-foreground">{label}</span>{children}</div>
}

interface SelectControlProps {
  readonly label: string
  readonly value: string
  readonly options: readonly string[]
}

function SelectControl({ label, value, options }: SelectControlProps) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select aria-label={label} className="inspector-select min-h-11 w-full cursor-pointer appearance-none rounded-md border border-border bg-surface px-2 pr-8 text-left text-xs font-semibold text-foreground outline-none transition-[border-color,background-color,box-shadow] hover:border-primary/60 hover:bg-primary-soft/35 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" defaultValue={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <Icon aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" name="chevron-down" size={12} />
    </label>
  )
}

function SectionTitle({ children, icon = 'settings' }: { readonly children: ReactNode; readonly icon?: IconName }) {
  return <h3 className="flex items-center gap-1 text-xs font-bold"><Icon className="text-muted-foreground" name={icon} size={12} />{children}</h3>
}

function SelectedWidgetSummary() {
  return (
    <div className="inspector-selection shrink-0 border-b border-border px-2 py-1.5 lg:px-1.5 lg:py-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted text-primary"><Icon name="heading" size={14} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold leading-4 text-foreground">Encabezado</p>
          <p className="truncate text-xs leading-4 text-muted-foreground">Hero / Texto</p>
        </div>
        <button aria-label="Opciones del elemento seleccionado, planificado" className="grid size-9 shrink-0 cursor-not-allowed place-items-center rounded-md text-muted-foreground opacity-50" data-tooltip="Opciones · planificado" disabled type="button"><Icon name="more" size={13} /></button>
      </div>
    </div>
  )
}

export function InspectorPanel({ activeTab, onTabChange, className = '' }: InspectorPanelProps) {
  const [alignment, setAlignment] = useState(3)
  const [linkedPadding, setLinkedPadding] = useState(false)

  return (
    <aside aria-label="Inspector de propiedades" className={`inspector-panel flex min-h-0 flex-col border-l border-border bg-surface ${className}`}>
      <SelectedWidgetSummary />

      <div className="grid shrink-0 grid-cols-3 gap-px border-b border-border bg-border p-1.5 lg:p-1" role="tablist" aria-label="Propiedades">
        {tabs.map((tab) => <button aria-controls="inspector-active-panel" aria-selected={activeTab === tab.id} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-md border-b-2 px-1 text-xs font-semibold transition-colors active:bg-primary/15 focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${activeTab === tab.id ? 'border-primary bg-primary-soft text-primary-strong shadow-sm' : 'border-transparent bg-surface text-foreground hover:bg-primary-soft hover:text-primary-strong'}`} id={`inspector-tab-${tab.id}`} key={tab.id} onClick={() => onTabChange(tab.id)} role="tab" type="button"><Icon name={tab.icon} size={12} /><span className="truncate">{tab.label}</span></button>)}
      </div>

      <div aria-labelledby={`inspector-tab-${activeTab}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-16 lg:pb-6" id="inspector-active-panel" role="tabpanel">
        {activeTab === 'style' ? (
          <div className="divide-y divide-border">
            <section className="grid gap-2 p-2 lg:p-1.5">
              <SectionTitle icon="text">Contenido</SectionTitle>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground" htmlFor="hero-heading"><span className="sr-only">Contenido del texto seleccionado</span><textarea className="min-h-20 resize-y rounded-md border border-primary/70 bg-surface p-2 text-xs font-semibold text-foreground outline-none ring-1 ring-primary/10 focus-visible:ring-2 focus-visible:ring-focus" defaultValue="Historias que amplían tu horizonte." id="hero-heading" /></label>
            </section>

            <section className="grid gap-2 p-2 lg:p-1.5">
              <SectionTitle icon="columns">Layout</SectionTitle>
              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_7.5rem]">
                <div className="grid min-w-0 grid-cols-2 gap-1.5 xl:grid-cols-1"><PropertyRow label="Horizontal"><SelectControl label="Alineación horizontal" options={['Inicio', 'Centro', 'Final', 'Estirar']} value="Inicio" /></PropertyRow><PropertyRow label="Vertical"><SelectControl label="Alineación vertical" options={['Inicio', 'Centro', 'Final', 'Estirar']} value="Centro" /></PropertyRow></div>
                <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1" role="group" aria-label="Alineación visual">{Array.from({ length: 9 }, (_, index) => <button aria-label={`Posición ${index + 1}`} aria-pressed={alignment === index} className={`grid size-11 cursor-pointer place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-focus lg:size-9 ${alignment === index ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground hover:bg-surface hover:text-foreground'}`} key={index} onClick={() => setAlignment(index)} type="button"><span className="size-1.5 rounded-sm bg-current" /></button>)}</div>
              </div>
            </section>

            <section className="grid gap-2 p-2 lg:p-1.5">
              <SectionTitle icon="resize">Padding</SectionTitle>
              <div className="grid grid-cols-2 gap-1.5">{['Arriba', 'Derecha', 'Abajo', 'Izquierda'].map((side, index) => <label className="grid min-w-0 gap-0.5 text-xs text-muted-foreground" key={side}><span>{side}</span><span className="flex min-h-11 min-w-0 items-center rounded-md border border-border bg-surface px-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-focus lg:min-h-9"><input aria-label={`Padding ${side.toLowerCase()}`} className="h-11 w-0 min-w-0 flex-1 bg-transparent text-right text-xs text-foreground outline-none lg:h-9" defaultValue={index % 2 === 0 ? 40 : 24} inputMode="numeric" min={0} type="number" /><span className="ml-1">px</span></span></label>)}</div>
              <button aria-pressed={linkedPadding} className={`flex min-h-11 w-full cursor-pointer items-center justify-center gap-1 rounded-md border text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${linkedPadding ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-primary hover:border-primary hover:bg-primary-soft'}`} onClick={() => setLinkedPadding((current) => !current)} type="button"><Icon name="lock" size={12} />{linkedPadding ? 'Valores vinculados' : 'Vincular valores'}</button>
            </section>

            <section className="grid gap-2 p-2 lg:p-1.5">
              <SectionTitle icon="heading">Tipografía</SectionTitle>
              <div className="grid grid-cols-2 gap-1.5"><PropertyRow label="Peso"><SelectControl label="Peso tipográfico" options={['400 · Regular', '500 · Medium', '600 · Semibold', '700 · Bold', '800 · Extra Bold']} value="700 · Bold" /></PropertyRow><PropertyRow label="Tamaño"><SelectControl label="Tamaño tipográfico" options={['12 px', '14 px', '16 px', '24 px', '32 px', '40 px', '48 px', '64 px']} value="48 px" /></PropertyRow></div>
              <div className="flex items-center gap-1.5"><span aria-label="Color #0F172A" className="size-9 rounded-md border border-border bg-slate-950" role="img" /><code className="text-xs text-muted-foreground">#0F172A</code><button aria-label="Cambiar color, planificado" className="ml-auto min-h-9 cursor-not-allowed rounded-md border border-border bg-surface px-2 text-xs font-semibold text-muted-foreground opacity-50" data-tooltip="Editor de color · planificado" disabled type="button">Cambiar</button></div>
            </section>
          </div>
        ) : null}

        {activeTab === 'content' ? <div className="grid gap-2 p-2 lg:p-1.5"><section className="rounded-md border border-warning/30 bg-[color-mix(in_srgb,var(--color-warning)_6%,var(--color-surface))] p-2 lg:p-1.5"><SectionTitle icon="cursor">Acciones</SectionTitle><p className="mt-1 text-xs leading-4 text-muted-foreground">Este elemento todavía no tiene acciones configuradas.</p><button aria-label="Añadir acción, planificado" className="mt-2 min-h-11 w-full cursor-not-allowed rounded-md border border-warning/25 bg-muted/50 px-2 text-xs font-bold text-muted-foreground opacity-60 lg:min-h-9" data-tooltip="Action Flow · planificado" disabled type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={13} />Añadir acción</span></button></section><section className="rounded-md border border-border bg-surface p-2 lg:p-1.5"><SectionTitle icon="eye">Estados visuales</SectionTitle><div className="mt-1.5 grid gap-1.5"><SelectControl label="Estado base" options={['Predeterminado', 'Focus', 'Active', 'Disabled']} value="Predeterminado" /><SelectControl label="Estado interactivo" options={['Al pasar el puntero', 'Focus visible', 'Al presionar']} value="Al pasar el puntero" /></div></section></div> : null}

        {activeTab === 'advanced' ? <div className="grid gap-2 p-2 lg:p-1.5"><section className="rounded-md border border-primary/30 bg-primary-soft p-2 lg:p-1.5"><div className="flex gap-1.5"><Icon className="mt-0.5 shrink-0 text-primary" name="content" size={13} /><div><h3 className="text-xs font-bold text-primary-strong">Contenido dinámico</h3><p className="mt-0.5 text-xs leading-4 text-muted-foreground">Conecta este texto a un campo del CMS.</p><button aria-label="Añadir binding, planificado" className="mt-1.5 min-h-9 cursor-not-allowed rounded-md border border-primary/20 bg-surface px-2 text-xs font-bold text-muted-foreground opacity-60" data-tooltip="Binding dinámico · planificado" disabled type="button">Añadir binding</button></div></div></section>{['Responsive', 'Condiciones', 'Atributos HTML'].map((section) => <button aria-label={`${section}, planificado`} className="flex min-h-11 w-full cursor-not-allowed items-center justify-between rounded-md border border-border bg-surface px-2 text-left text-xs font-semibold text-muted-foreground opacity-60 lg:min-h-9" disabled key={section} type="button"><span className="inline-flex items-center gap-1"><Icon name="code" size={12} />{section}</span><Icon name="chevron-down" size={12} /></button>)}</div> : null}
      </div>
    </aside>
  )
}
