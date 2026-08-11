import { useEffect, useMemo, useState } from 'react'
import { Button, Icon } from '../primitives'
import { navigationItems, type DeliveryState, type NavigationSectionId } from './editor-data'
import { demoModules, getDemoModule, type DemoCapability } from './product-demo-data'

interface ProductDemoViewProps {
  readonly activeSection: NavigationSectionId
  readonly onSectionChange: (section: NavigationSectionId) => void
}

type CapabilityFilter = 'all' | DeliveryState

const stateCopy: Record<DeliveryState, { label: string; className: string; dot: string }> = {
  active: { label: 'Activo', className: 'border-success/25 bg-success/10 text-success', dot: 'bg-success' },
  development: { label: 'En desarrollo', className: 'border-warning/25 bg-warning/10 text-warning', dot: 'bg-warning' },
  planned: { label: 'Próxima fase', className: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground/55' },
}

function StateBadge({ state }: { readonly state: DeliveryState }) {
  const copy = stateCopy[state]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.05em] ${copy.className}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${copy.dot}`} />{copy.label}</span>
}

function CapabilityCard({ capability, selected, onSelect }: { readonly capability: DemoCapability; readonly selected: boolean; readonly onSelect: () => void }) {
  return (
    <button
      aria-pressed={selected}
      className={`group flex min-h-[4.75rem] w-full cursor-pointer flex-col gap-1 rounded-lg border p-2 text-left transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:border-primary/40 hover:bg-primary-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected ? 'border-primary bg-primary-soft/55 shadow-sm' : 'border-border bg-surface'}`}
      onClick={onSelect}
      type="button"
    >
      <span className="flex w-full items-start gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">{capability.title}</span>
        <StateBadge state={capability.state} />
      </span>
      <span className="line-clamp-2 text-[0.6875rem] leading-4 text-muted-foreground">{capability.description}</span>
      {capability.tags?.length ? <span className="mt-auto flex flex-wrap gap-1 pt-0.5">{capability.tags.map((tag) => <span className="rounded bg-muted px-1 py-0.5 text-[0.5625rem] font-semibold text-muted-foreground" key={tag}>{tag}</span>)}</span> : null}
    </button>
  )
}

function DashboardSurface({ onSectionChange }: { readonly onSectionChange: (section: NavigationSectionId) => void }) {
  const counts = demoModules.reduce((accumulator, module) => {
    module.capabilities.forEach((capability) => { accumulator[capability.state] += 1 })
    return accumulator
  }, { active: 0, development: 0, planned: 0 })

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="min-w-0 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-primary">Mapa funcional completo</p>
            <h2 className="truncate text-sm font-bold text-foreground">Todas las superficies de ElectroCMS</h2>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary-soft px-2 py-1 text-[0.625rem] font-bold text-primary-strong">Demo final · UI primero</span>
        </div>
        <div className="grid gap-1.5 p-2 sm:grid-cols-2 2xl:grid-cols-3">
          {navigationItems.map((item) => (
            <button className="group flex min-h-[5.25rem] cursor-pointer flex-col rounded-lg border border-border bg-canvas/55 p-2 text-left transition-colors hover:border-primary/35 hover:bg-primary-soft/40" key={item.id} onClick={() => onSectionChange(item.id)} type="button">
              <span className="flex items-start gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary"><Icon name={item.icon} size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1"><strong className="truncate text-xs text-foreground">{item.label}</strong><StateBadge state={item.state} /></span>
                  <span className="mt-0.5 line-clamp-2 text-[0.625rem] leading-4 text-muted-foreground">{item.description}</span>
                </span>
              </span>
              <span className="mt-auto flex items-center justify-between pt-1 text-[0.5625rem] font-semibold text-muted-foreground"><span>{item.group}</span><span className="inline-flex items-center gap-1 text-primary group-hover:text-primary-strong">Abrir <Icon name="arrow-right" size={11} /></span></span>
            </button>
          ))}
        </div>
      </section>

      <aside className="grid content-start gap-3">
        <section className="rounded-xl border border-border bg-surface p-2.5 shadow-sm">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold">Activación progresiva</h2><Icon className="text-primary" name="layers" size={15} /></div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success/10 p-2"><span className="text-[0.6875rem] font-semibold">Activo ahora</span><strong className="text-sm text-success">{counts.active}</strong></div>
            <div className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/10 p-2"><span className="text-[0.6875rem] font-semibold">En desarrollo</span><strong className="text-sm text-warning">{counts.development}</strong></div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/65 p-2"><span className="text-[0.6875rem] font-semibold">Próxima fase</span><strong className="text-sm text-muted-foreground">{counts.planned}</strong></div>
          </div>
          <p className="mt-2 text-[0.625rem] leading-4 text-muted-foreground">La demo muestra el destino visual completo. Las acciones reales se habilitan por fases sin cambiar el mapa de navegación.</p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-2.5 shadow-sm">
          <h2 className="mb-2 text-xs font-bold">Principios del producto</h2>
          <ul className="grid gap-1.5 text-[0.6875rem] text-muted-foreground">
            <li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-success" name="check" size={12} /><span><strong className="text-foreground">Local-first.</strong> Autoría y datos funcionan sin nube obligatoria.</span></li>
            <li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-success" name="check" size={12} /><span><strong className="text-foreground">High Density.</strong> Máxima información útil sin ruido visual.</span></li>
            <li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-success" name="check" size={12} /><span><strong className="text-foreground">No destructivo.</strong> Templates, IA y temas con preview y reversibilidad.</span></li>
            <li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-success" name="check" size={12} /><span><strong className="text-foreground">Tres salidas.</strong> Local, LAMP y WordPress desde un mismo modelo.</span></li>
            <li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-success" name="check" size={12} /><span><strong className="text-foreground">Responsive + accesible.</strong> Teclado, foco, touch y breakpoints desde el diseño.</span></li>
          </ul>
        </section>
      </aside>
    </div>
  )
}

export function ProductDemoView({ activeSection, onSectionChange }: ProductDemoViewProps) {
  const module = getDemoModule(activeSection)
  const [filter, setFilter] = useState<CapabilityFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedTitle, setSelectedTitle] = useState(module.capabilities[0]?.title ?? '')

  useEffect(() => {
    setFilter('all')
    setQuery('')
    setSelectedTitle(module.capabilities[0]?.title ?? '')
  }, [module.id, module.capabilities])

  const filteredCapabilities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return module.capabilities.filter((capability) => {
      if (filter !== 'all' && capability.state !== filter) return false
      if (!normalizedQuery) return true
      return `${capability.title} ${capability.description} ${(capability.tags ?? []).join(' ')}`.toLocaleLowerCase('es').includes(normalizedQuery)
    })
  }, [filter, module.capabilities, query])

  const selectedCapability = module.capabilities.find((capability) => capability.title === selectedTitle) ?? filteredCapabilities[0] ?? module.capabilities[0]
  const navItem = navigationItems.find((item) => item.id === module.id)

  return (
    <main className="product-demo-workspace col-start-1 col-end-5 row-start-2 min-h-0 min-w-0 overflow-y-auto bg-canvas p-2 pb-20 md:col-start-2 md:pb-3 lg:p-3" id="product-demo" tabIndex={-1}>
      <div className="mx-auto grid w-full max-w-[104rem] gap-3">
        <header className="rounded-xl border border-border bg-surface p-3 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary-soft text-primary"><Icon name={module.icon} size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5"><p className="text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-primary">{module.eyebrow}</p>{navItem ? <StateBadge state={navItem.state} /> : null}</div>
              <h1 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-foreground sm:text-xl">{module.title}</h1>
              <p className="mt-1 max-w-4xl text-[0.6875rem] leading-4 text-muted-foreground sm:text-xs">{module.summary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1">
              {activeSection !== 'dashboard' ? <Button onClick={() => onSectionChange('dashboard')} size="small" variant="secondary"><Icon name="layers" size={13} />Mapa completo</Button> : null}
              {activeSection !== 'editor' ? <Button onClick={() => onSectionChange('editor')} size="small"><Icon name="editor" size={13} />Abrir Editor</Button> : null}
            </div>
          </div>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {module.metrics.map((metric) => <div className="rounded-lg border border-border bg-canvas/55 px-2.5 py-2" key={metric.label}><span className="text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</span><div className="mt-0.5 flex items-end justify-between gap-2"><strong className="truncate text-sm text-foreground">{metric.value}</strong><span className="truncate text-[0.5625rem] text-muted-foreground">{metric.hint}</span></div></div>)}
          </div>
        </header>

        {activeSection === 'dashboard' ? <DashboardSurface onSectionChange={onSectionChange} /> : (
          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="min-w-0 rounded-xl border border-border bg-surface shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
                <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
                  <Icon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" name="search" size={13} />
                  <input aria-label={`Buscar capacidades en ${module.title}`} className="h-8 w-full rounded-md border border-border bg-canvas pl-7 pr-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-focus" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar función…" type="search" value={query} />
                </div>
                <div aria-label="Filtrar por estado" className="flex min-w-0 items-center gap-px rounded-md border border-border bg-muted p-0.5" role="group">
                  {([
                    ['all', 'Todo'],
                    ['active', 'Activo'],
                    ['development', 'Dev'],
                    ['planned', 'Next'],
                  ] as const).map(([id, label]) => <button aria-pressed={filter === id} className={`h-7 cursor-pointer rounded px-2 text-[0.625rem] font-bold transition-colors ${filter === id ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} key={id} onClick={() => setFilter(id)} type="button">{label}</button>)}
                </div>
                <span className="ml-auto text-[0.625rem] font-semibold text-muted-foreground">{filteredCapabilities.length} / {module.capabilities.length}</span>
              </div>

              <div className="grid gap-1.5 p-2 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredCapabilities.map((capability) => <CapabilityCard capability={capability} key={capability.title} onSelect={() => setSelectedTitle(capability.title)} selected={selectedCapability?.title === capability.title} />)}
                {filteredCapabilities.length === 0 ? <div className="col-span-full grid min-h-40 place-items-center rounded-lg border border-dashed border-border bg-canvas/50 p-4 text-center"><div><Icon className="mx-auto text-muted-foreground" name="search" size={20} /><p className="mt-2 text-xs font-bold">Sin coincidencias</p><p className="mt-1 text-[0.6875rem] text-muted-foreground">Cambia el filtro o la búsqueda.</p></div></div> : null}
              </div>
            </section>

            <aside className="min-w-0 self-start rounded-xl border border-border bg-surface shadow-sm xl:sticky xl:top-0">
              <div className="flex items-center gap-2 border-b border-border px-2.5 py-2"><span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="settings" size={13} /></span><div className="min-w-0"><p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Inspector de demo</p><h2 className="truncate text-xs font-bold">Detalle funcional</h2></div></div>
              {selectedCapability ? <div className="grid gap-3 p-2.5"><div><div className="flex flex-wrap items-center gap-1.5"><StateBadge state={selectedCapability.state} /><span className="text-[0.5625rem] font-semibold text-muted-foreground">{selectedCapability.phase}</span></div><h3 className="mt-2 text-sm font-bold text-foreground">{selectedCapability.title}</h3><p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground">{selectedCapability.description}</p></div><div className="rounded-lg border border-border bg-canvas/60 p-2"><p className="text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Contrato de la demo</p><p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground">La superficie, jerarquía y estados se muestran desde ahora. La lógica real se activa cuando la fase correspondiente esté completada y validada.</p></div>{selectedCapability.tags?.length ? <div><p className="mb-1 text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Áreas relacionadas</p><div className="flex flex-wrap gap-1">{selectedCapability.tags.map((tag) => <span className="rounded-md border border-border bg-muted px-1.5 py-1 text-[0.625rem] font-semibold text-muted-foreground" key={tag}>{tag}</span>)}</div></div> : null}<Button disabled={selectedCapability.state !== 'active'} size="small" variant={selectedCapability.state === 'active' ? 'primary' : 'secondary'}>{selectedCapability.state === 'active' ? 'Disponible en la app' : 'Se activará por fase'}</Button></div> : null}
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
