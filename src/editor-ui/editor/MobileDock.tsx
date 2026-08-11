import { Icon } from '../primitives'
import type { LibraryTab } from './LibraryPanel'

export type MobilePanel = LibraryTab | 'inspector' | null

interface MobileDockProps {
  readonly activePanel: MobilePanel
  readonly onPanelChange: (panel: MobilePanel) => void
}

const dockItems = [
  { id: 'widgets' as const, label: 'Widgets', icon: 'plus' as const },
  { id: 'layers' as const, label: 'Capas', icon: 'layers' as const },
  { id: null, label: 'Canvas', icon: 'cursor' as const },
  { id: 'inspector' as const, label: 'Inspector', icon: 'settings' as const },
]

export function MobileDock({ activePanel, onPanelChange }: MobileDockProps) {
  return (
    <nav aria-label="Navegación del builder" className="mobile-dock fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-14 grid-cols-4 items-stretch">
        {dockItems.map((item) => {
          const selected = item.id !== null && activePanel === item.id
          const isCanvas = item.id === null && activePanel === null
          const active = selected || isCanvas
          const nextPanel: MobilePanel = selected ? null : item.id
          return (
            <li className="min-w-0" key={item.label}>
              <button
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`mobile-dock-option relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-0.5 text-[0.625rem] font-medium transition-colors ${active ? 'mobile-dock-option--active text-primary-strong' : 'text-muted-foreground'}`}
                onClick={() => onPanelChange(nextPanel)}
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
