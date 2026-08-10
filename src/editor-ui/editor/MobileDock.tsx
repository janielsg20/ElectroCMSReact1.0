import { Icon } from '../primitives'
import type { LibraryTab } from './LibraryPanel'

export type MobilePanel = LibraryTab | 'inspector' | null

interface MobileDockProps {
  readonly activePanel: MobilePanel
  readonly onPanelChange: (panel: MobilePanel) => void
}

const dockItems = [
  { id: 'widgets' as const, label: 'Widgets', icon: 'plus' as const },
  { id: 'layers' as const, label: 'Páginas', icon: 'layers' as const },
  { id: null, label: 'Canvas', icon: 'cursor' as const },
  { id: 'inspector' as const, label: 'Propiedades', icon: 'settings' as const },
  { id: 'more' as const, label: 'Más', icon: 'more' as const },
]

export function MobileDock({ activePanel, onPanelChange }: MobileDockProps) {
  return (
    <nav aria-label="Navegación del builder" className="mobile-dock fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/98 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {dockItems.map((item) => {
          const selected = item.id !== 'more' && activePanel === item.id
          const isCanvas = item.id === null && activePanel === null
          const active = selected || isCanvas
          return (
            <li className="min-w-0" key={item.label}>
              <button
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`mobile-dock-option relative flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-0.5 text-[0.6875rem] font-medium transition-colors ${active ? 'mobile-dock-option--active text-primary-strong' : 'text-muted-foreground'}`}
                disabled={item.id === 'more'}
                onClick={() => item.id !== 'more' && onPanelChange(selected ? null : item.id)}
                title={item.id === 'more' ? 'Más herramientas · planificado' : item.label}
                type="button"
              >
                <span className="mobile-dock-option__icon grid size-7 place-items-center rounded-md"><Icon name={item.icon} size={15} /></span>
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
