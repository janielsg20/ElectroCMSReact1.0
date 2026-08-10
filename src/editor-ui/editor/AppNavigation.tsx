import type { CSSProperties } from 'react'
import { Icon } from '../primitives'
import { navigationItems } from './editor-data'

const navigationAccents: Readonly<Record<string, string>> = {
  Inicio: 'var(--color-warning)',
  Editor: 'var(--color-primary)',
  Contenido: 'var(--color-accent-data)',
  Temas: 'var(--color-accent-ai)',
  Formularios: 'var(--color-accent-form)',
  Usuarios: 'var(--color-accent-data)',
  Ajustes: 'var(--color-muted-foreground)',
}

export function AppNavigation() {
  return (
    <nav aria-label="Navegación principal" className="hidden min-h-0 flex-col items-center overflow-y-auto border-r border-border bg-surface py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex">
      <span className="mb-0.5 text-[0.5rem] font-medium text-muted-foreground">Menú</span>
      <ul className="grid w-full gap-px">
        {navigationItems.map((item) => (
          <li key={item.label}>
            <button
              aria-current={item.label === 'Editor' ? 'page' : undefined}
              aria-label={item.label}
              className={`group relative grid min-h-11 min-w-11 w-full cursor-pointer place-items-center border-l-2 transition-colors lg:min-h-8 lg:min-w-8 ${item.label === 'Editor' ? 'border-primary bg-primary-soft text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-55`}
              disabled={!item.available}
              style={{ '--nav-accent': navigationAccents[item.label] ?? 'var(--color-muted-foreground)' } as CSSProperties}
              title={item.available ? item.label : `${item.label} · planificado`}
              type="button"
            >
              <span className="nav-accent-icon grid size-7 place-items-center rounded-md transition-[color,background-color,transform] duration-200 group-hover:scale-105 group-active:scale-95">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="sr-only">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[0.5625rem] font-bold text-primary-strong" aria-label="Perfil de Janiel">JG</div>
    </nav>
  )
}
