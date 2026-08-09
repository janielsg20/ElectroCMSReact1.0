import type { ReactNode } from 'react'
import { Icon } from '../primitives'

export type InspectorTab = 'content' | 'style' | 'advanced'

interface InspectorPanelProps {
  readonly activeTab: InspectorTab
  readonly onTabChange: (tab: InspectorTab) => void
  readonly className?: string
}

const tabs: readonly { id: InspectorTab; label: string }[] = [
  { id: 'content', label: 'Contenido' },
  { id: 'style', label: 'Estilo' },
  { id: 'advanced', label: 'Avanzado' },
]

function PropertyRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <div className="grid grid-cols-[5.75rem_1fr] items-center gap-2"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</div>
}

function SelectControl({ value }: { readonly value: string }) {
  return <button className="flex min-h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-canvas px-3 text-left text-xs font-semibold transition-colors hover:bg-muted" type="button"><span>{value}</span><Icon name="chevron-down" size={16} /></button>
}

export function InspectorPanel({ activeTab, onTabChange, className = '' }: InspectorPanelProps) {
  return (
    <aside aria-label="Inspector de propiedades" className={`min-h-0 border-l border-border bg-surface ${className}`}>
      <div className="border-b border-border px-3 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">Seleccionado</p><h2 className="mt-0.5 font-heading text-sm font-bold">Contenido hero</h2></div><span className="rounded-md bg-primary-soft px-2 py-1 font-heading text-[0.625rem] font-bold text-primary-strong">Container</span></div>
      </div>
      <div className="grid grid-cols-3 border-b border-border px-2 pt-1" role="tablist" aria-label="Propiedades">
        {tabs.map((tab) => <button aria-selected={activeTab === tab.id} className={`min-h-11 cursor-pointer border-b-2 px-1 text-xs font-semibold transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} key={tab.id} onClick={() => onTabChange(tab.id)} role="tab" type="button">{tab.label}</button>)}
      </div>

      <div className="h-full overflow-y-auto pb-24" role="tabpanel">
        {activeTab === 'content' ? (
          <div className="grid gap-4 p-3">
            <section className="rounded-xl border border-border bg-canvas p-3"><h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Contenido</h3><div className="mt-3 grid gap-3"><PropertyRow label="Etiqueta"><SelectControl value="section" /></PropertyRow><PropertyRow label="Ancho"><SelectControl value="Contenido" /></PropertyRow><PropertyRow label="Alineación"><SelectControl value="Inicio" /></PropertyRow></div></section>
            <section className="rounded-xl border border-primary/30 bg-primary-soft p-3"><div className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-primary" name="sparkles" size={16} /><div><h3 className="text-xs font-bold text-primary-strong">Contenido dinámico</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Conecta campos CMS y consultas desde el selector de bindings.</p><button className="mt-2 min-h-10 cursor-pointer rounded-lg border border-primary/30 bg-surface px-3 text-xs font-bold text-primary-strong" type="button">Añadir binding</button></div></div></section>
          </div>
        ) : null}
        {activeTab === 'style' ? (
          <div className="divide-y divide-border">
            <section className="p-3"><h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Layout</h3><div className="mt-3 grid gap-3"><PropertyRow label="Display"><SelectControl value="Flex" /></PropertyRow><PropertyRow label="Dirección"><SelectControl value="Columna" /></PropertyRow><PropertyRow label="Gap"><div className="flex min-h-10 items-center rounded-lg border border-border bg-canvas px-3"><input aria-label="Separación" className="min-w-0 flex-1 bg-transparent text-sm outline-none" defaultValue="24" inputMode="numeric" /><span className="text-xs text-muted-foreground">px</span></div></PropertyRow></div></section>
            <section className="p-3"><h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Espaciado</h3><div className="mt-3 grid grid-cols-4 gap-1.5">{['T', 'R', 'B', 'L'].map((side) => <label className="grid gap-1 text-center text-[0.625rem] text-muted-foreground" key={side}>{side}<input className="min-h-10 min-w-0 rounded-lg border border-border bg-canvas px-1 text-center text-xs text-foreground" defaultValue={side === 'T' || side === 'B' ? '56' : '40'} inputMode="numeric" /></label>)}</div><button className="mt-3 flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-canvas text-xs font-semibold hover:bg-muted" type="button"><Icon name="lock" size={14} />Vincular valores</button></section>
            <section className="p-3"><h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Fondo</h3><div className="mt-3 flex items-center gap-2"><span className="size-10 rounded-lg border border-border bg-slate-950" /><code className="text-xs text-muted-foreground">#0F172A</code></div></section>
          </div>
        ) : null}
        {activeTab === 'advanced' ? (
          <div className="grid gap-3 p-3">{['Responsive', 'Movimiento', 'Posición', 'Atributos', 'Condiciones'].map((section) => <button className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-canvas px-3 text-left text-sm font-semibold transition-colors hover:bg-muted" key={section} type="button"><span>{section}</span><Icon name="chevron-down" size={16} /></button>)}</div>
        ) : null}
      </div>
    </aside>
  )
}
