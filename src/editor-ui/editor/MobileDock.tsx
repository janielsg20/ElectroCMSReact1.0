import { Icon } from '../primitives'
import type { LibraryTab } from './LibraryPanel'

export type MobilePanel = LibraryTab | 'inspector' | null

interface MobileDockProps {
  readonly activePanel: MobilePanel
  readonly onPanelChange: (panel: MobilePanel) => void
}

const dockItems = [
  { id: 'widgets' as const, label: 'Elementos', icon: 'plus' as const },
  { id: 'layers' as const, label: 'Capas', icon: 'layers' as const },
  { id: null, label: 'Canvas', icon: 'cursor' as const },
  { id: 'inspector' as const, label: 'Inspector', icon: 'settings' as const },
  { id: 'more' as const, label: 'Más', icon: 'more' as const },
]

export function MobileDock({ activePanel, onPanelChange }: MobileDockProps) {
  return (
    <nav aria-label="Herramientas móviles" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {dockItems.map((item) => {
          const selected = item.id !== 'more' && activePanel === item.id
          return <li key={item.label}><button aria-current={selected ? 'page' : undefined} aria-label={item.label} className={`mobile-dock-option flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-semibold text-foreground transition-colors ${selected ? 'mobile-dock-option--active text-primary-strong' : ''}`} disabled={item.id === 'more'} onClick={() => item.id !== 'more' && onPanelChange(selected ? null : item.id)} title={item.id === 'more' ? 'Más · planificado' : item.label} type="button"><span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary"><Icon name={item.icon} size={16} /></span><span>{item.label}</span></button></li>
        })}
      </ul>
    </nav>
  )
}
