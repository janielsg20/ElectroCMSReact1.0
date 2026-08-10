import type { CSSProperties } from 'react'
import { Icon } from '../primitives'
import type { LibraryTab } from './LibraryPanel'

export type MobilePanel = LibraryTab | 'inspector' | null

interface MobileDockProps {
  readonly activePanel: MobilePanel
  readonly onPanelChange: (panel: MobilePanel) => void
}

const dockItems = [
  { id: 'widgets' as const, label: 'Elementos', icon: 'plus' as const, accent: 'var(--color-accent-form)' },
  { id: 'layers' as const, label: 'Capas', icon: 'layers' as const, accent: 'var(--color-accent-data)' },
  { id: null, label: 'Canvas', icon: 'cursor' as const, accent: 'var(--color-primary)' },
  { id: 'inspector' as const, label: 'Inspector', icon: 'settings' as const, accent: 'var(--color-accent-ai)' },
  { id: 'more' as const, label: 'Más', icon: 'more' as const, accent: 'var(--color-warning)' },
]

export function MobileDock({ activePanel, onPanelChange }: MobileDockProps) {
  return (
    <nav aria-label="Herramientas móviles" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {dockItems.map((item) => {
          const selected = item.id !== 'more' && activePanel === item.id
          return <li key={item.label}><button aria-current={selected ? 'page' : undefined} aria-label={item.label} className={`mobile-dock-option flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 text-[0.5625rem] font-semibold transition-colors ${selected ? 'mobile-dock-option--active' : ''}`} disabled={item.id === 'more'} onClick={() => item.id !== 'more' && onPanelChange(selected ? null : item.id)} style={{ '--mobile-accent': item.accent } as CSSProperties} title={item.id === 'more' ? 'Más · planificado' : item.label} type="button"><span className="grid size-7 place-items-center rounded-md bg-[color-mix(in_srgb,var(--mobile-accent)_16%,transparent)] text-[var(--mobile-accent)]"><Icon name={item.icon} size={16} /></span><span className="text-[var(--mobile-accent)]">{item.label}</span></button></li>
        })}
      </ul>
    </nav>
  )
}
