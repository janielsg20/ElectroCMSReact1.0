import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Icon } from '../primitives'
import { APP_SECTIONS, type AppSection } from './app-sections'
import { ProjectDataPanel } from './ProjectDataPanel'
import { ProjectDesignPanel } from './ProjectDesignPanel'
import { TemplateManager } from './TemplateManager'

interface AppNavigationProps { readonly expanded: boolean; readonly width: number; readonly onToggleExpanded: () => void; readonly onResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void; readonly onResizeKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }
const groups = [{ label: 'Builder', sections: ['editor', 'documents'] }, { label: 'CMS', sections: ['content'] }, { label: 'Proyecto', sections: ['design'] }] as const satisfies readonly { readonly label: string; readonly sections: readonly AppSection[] }[]

function ModuleWorkspace({ section, close }: { readonly section: Exclude<AppSection, 'editor'>; readonly close: () => void }) {
  const item = APP_SECTIONS[section]
  return (
    <section
      aria-label={`${item.panelTitle} · módulo principal`}
      className="fixed bottom-6 right-0 top-10 z-20 hidden min-h-0 flex-col bg-canvas md:flex"
      data-primary-module={section}
      role="region"
      style={{ left: 'var(--rail-width)' }}
    >
      <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-primary-soft text-primary"><Icon name={item.icon} size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{section === 'content' ? 'CMS' : section === 'documents' ? 'Builder' : 'Proyecto'}</p>
          <h1 className="truncate text-sm font-bold text-foreground">{item.panelTitle}</h1>
        </div>
        <p className="hidden max-w-xl truncate text-[0.625rem] text-muted-foreground xl:block">{item.description}</p>
        <button aria-label={`Volver al Editor desde ${item.panelTitle}`} className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus" onClick={close} title="Volver al editor" type="button"><Icon name="editor" size={14} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {section === 'documents' ? <div className="h-full overflow-y-auto p-2 lg:p-3"><TemplateManager /></div> : section === 'content' ? <ProjectDataPanel /> : <ProjectDesignPanel />}
      </div>
    </section>
  )
}

export function AppNavigation({ expanded, width, onToggleExpanded, onResizePointerDown, onResizeKeyDown }: AppNavigationProps) {
  const [active, setActive] = useState<AppSection>('editor')
  return <><nav aria-label="Navegación principal" className="app-navigation relative hidden min-h-0 border-r border-border bg-surface md:block"><div className="flex h-full min-h-0 flex-col overflow-hidden py-1"><div className={`builder-rail-head flex h-12 shrink-0 items-center px-1 lg:h-9 ${expanded ? 'justify-between' : 'justify-center'}`}>{expanded ? <span className="truncate px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">ElectroCMS</span> : null}<button aria-label={expanded ? 'Contraer menú lateral' : 'Expandir menú lateral'} aria-pressed={expanded} className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:size-8" onClick={onToggleExpanded} type="button"><Icon name="panel-left" size={14} /></button></div><div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">{groups.map((group, index) => <section aria-label={group.label} className={index ? 'mt-2 border-t border-border/70 pt-2' : 'pt-1'} key={group.label}>{expanded ? <h2 className="mb-1 truncate px-2 text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{group.label}</h2> : null}<div className="grid gap-0.5">{group.sections.map((section) => { const item = APP_SECTIONS[section]; const selected = active === section; return <button aria-current={selected ? 'page' : undefined} aria-label={item.label} className={`nav-option group relative flex min-h-11 w-full items-center rounded-md px-1 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${expanded ? 'justify-start gap-1.5' : 'justify-center'}`} data-active={selected ? 'true' : 'false'} key={section} onClick={() => setActive(section)} title={item.description} type="button">{selected ? <span aria-hidden="true" className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" /> : null}<span className="nav-accent-icon grid size-8 shrink-0 place-items-center rounded-md"><Icon name={item.icon} size={15} /></span>{expanded ? <span className="min-w-0 text-left"><span className="block truncate text-xs font-semibold">{item.label}</span><span className="block truncate text-[0.5625rem] text-muted-foreground">{item.shortLabel}</span></span> : <span className="sr-only">{item.label}</span>}</button>})}</div></section>)}</div><div className={`flex min-h-10 items-center border-t border-border px-1.5 text-[0.625rem] text-muted-foreground ${expanded ? 'gap-1.5' : 'justify-center'}`}><span className="size-2 rounded-full bg-success" />{expanded ? <span>Proyecto local</span> : null}</div></div><button aria-label="Redimensionar menú lateral" aria-orientation="vertical" aria-valuemax={168} aria-valuemin={44} aria-valuenow={width} className="group absolute -right-3 inset-y-0 z-30 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={onResizeKeyDown} onPointerDown={onResizePointerDown} role="separator" type="button"><span className="h-full w-px bg-transparent group-hover:bg-primary" /></button></nav>{active !== 'editor' ? <ModuleWorkspace close={() => setActive('editor')} section={active} /> : null}</>
}
