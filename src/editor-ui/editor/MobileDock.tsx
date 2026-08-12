import { Icon } from '../primitives'
import type { LibraryTab } from './LibraryPanel'
import { useAppSection } from './app-section-context'

export type MobilePanel = LibraryTab | 'inspector' | 'more' | null

type DockItemId = 'widgets' | 'layers' | 'canvas' | 'inspector' | 'more'

interface MobileDockProps {
  readonly activePanel: MobilePanel
  readonly onPanelChange: (panel: MobilePanel) => void
}

const dockItems = [
  { id: 'widgets' as const, label: 'Widgets', icon: 'plus' as const },
  { id: 'layers' as const, label: 'Capas', icon: 'layers' as const },
  { id: 'canvas' as const, label: 'Canvas', icon: 'cursor' as const },
  { id: 'inspector' as const, label: 'Props', icon: 'settings' as const },
  { id: 'more' as const, label: 'Más', icon: 'more' as const },
]

export function MobileDock({ activePanel, onPanelChange }: MobileDockProps) {
  const { section, setSection } = useAppSection()

  function selectItem(id: DockItemId): void {
    if (id === 'more') {
      onPanelChange(activePanel === 'more' ? null : 'more')
      return
    }

    setSection('editor')
    if (id === 'canvas') {
      onPanelChange(null)
      return
    }

    const panel: Exclude<MobilePanel, 'more' | null> = id
    onPanelChange(activePanel === panel && section === 'editor' ? null : panel)
  }

  return (
    <nav aria-label="Navegación del builder" className="mobile-dock fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-14 grid-cols-5 items-stretch">
        {dockItems.map((item) => {
          const active = item.id === 'more'
            ? activePanel === 'more' || section !== 'editor'
            : item.id === 'canvas'
              ? section === 'editor' && activePanel === null
              : section === 'editor' && activePanel === item.id

          return (
            <li className="min-w-0" key={item.id}>
              <button
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`mobile-dock-option relative flex h-full min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-0.5 text-[0.625rem] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus ${active ? 'mobile-dock-option--active text-primary-strong' : 'text-muted-foreground'}`}
                onClick={() => selectItem(item.id)}
                title={item.label}
                type="button"
              >
                <span aria-hidden="true" className={`absolute inset-x-[28%] top-0 h-0.5 rounded-b-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
                <span className={`mobile-dock-option__icon grid size-7 place-items-center rounded ${active ? 'bg-primary-soft text-primary-strong' : 'bg-transparent text-muted-foreground'}`}>
                  <Icon name={item.icon} size={15} />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
