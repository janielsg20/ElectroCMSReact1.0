import { Icon } from '../primitives'
import { useAppSection } from './app-section-context'
import { APP_SECTIONS } from './app-sections'
import { ProjectDataPanel } from './ProjectDataPanel'
import { ProjectDesignPanel } from './ProjectDesignPanel'
import { TemplateManager } from './TemplateManager'

export function AppSectionWorkspace() {
  const { section } = useAppSection()
  if (section === 'editor') return null

  const definition = APP_SECTIONS[section]

  return (
    <main aria-label={definition.panelTitle} className="app-section-workspace col-start-2 col-end-5 row-start-2 min-h-0 overflow-hidden bg-canvas" id={`app-section-${section}`}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-primary-soft text-primary"><Icon name={definition.icon} size={16} /></span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-foreground">{definition.panelTitle}</h1>
            <p className="truncate text-[0.625rem] text-muted-foreground">{definition.description}</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          {section === 'documents' ? <div className="h-full overflow-y-auto p-2 lg:p-3"><TemplateManager /></div> : null}
          {section === 'content' ? <ProjectDataPanel /> : null}
          {section === 'design' ? <ProjectDesignPanel /> : null}
        </div>
      </div>
    </main>
  )
}
