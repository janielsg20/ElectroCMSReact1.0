import { Icon } from '../primitives'
import { useAppSection } from './app-section-context'
import { APP_SECTIONS, type AppSection } from './app-sections'

const mobileSections: readonly AppSection[] = ['editor', 'documents', 'content', 'design']

export function MobileModuleMenu({ onNavigate }: { readonly onNavigate: () => void }) {
  const { section: activeSection, setSection } = useAppSection()

  function navigate(section: AppSection): void {
    setSection(section)
    onNavigate()
  }

  return (
    <nav aria-label="Módulos principales" className="grid gap-1.5 p-2">
      {mobileSections.map((section) => {
        const item = APP_SECTIONS[section]
        const active = activeSection === section
        return (
          <button
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 w-full items-center gap-2 rounded-lg border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus ${active ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`}
            key={section}
            onClick={() => navigate(section)}
            type="button"
          >
            <span className={`grid size-10 shrink-0 place-items-center rounded-md ${active ? 'bg-primary text-on-primary' : 'bg-muted text-muted-foreground'}`}><Icon name={item.icon} size={17} /></span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{item.label}</strong>
              <span className="block text-xs leading-4 text-muted-foreground">{item.description}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
