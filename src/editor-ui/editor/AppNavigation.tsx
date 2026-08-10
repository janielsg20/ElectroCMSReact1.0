import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { Icon } from '../primitives'
import { navigationItems } from './editor-data'

const navigationAccents: Readonly<Record<string, string>> = {
  Inicio: 'var(--color-warning)',
  Editor: 'var(--color-primary)',
  Contenido: 'var(--color-accent-data)',
  Temas: 'var(--color-accent-ai)',
  Formularios: 'var(--color-accent-form)',
  Usuarios: 'var(--color-accent-data)',
  Ajustes: 'var(--color-destructive)',
}

interface AppNavigationProps {
  readonly expanded: boolean
  readonly width: number
  readonly onToggleExpanded: () => void
  readonly onResizePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  readonly onResizeKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function AppNavigation({ expanded, width, onToggleExpanded, onResizePointerDown, onResizeKeyDown }: AppNavigationProps) {
  return (
    <nav aria-label="Navegación principal" className="relative hidden min-h-0 border-r border-border bg-surface md:block">
      <div className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className={`flex h-7 shrink-0 items-center px-1 ${expanded ? 'justify-between' : 'justify-center'}`}>
          {expanded ? <span className="truncate text-[0.5rem] font-bold uppercase tracking-[0.08em] text-primary">Menú principal</span> : null}
          <button aria-label={expanded ? 'Contraer menú lateral' : 'Expandir menú lateral'} aria-pressed={expanded} className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-sm bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-on-primary" onClick={onToggleExpanded} title={expanded ? 'Contraer menú' : 'Mostrar nombres del menú'} type="button"><Icon name="panel-left" size={12} /></button>
        </div>
        <ul className="grid w-full gap-px px-0.5">
          {navigationItems.map((item) => (
            <li key={item.label}>
              <button
                aria-current={item.label === 'Editor' ? 'page' : undefined}
                aria-label={item.label}
                className={`nav-option group relative flex min-h-11 w-full cursor-pointer items-center rounded-sm border-l-2 px-0.5 transition-[background-color,color,border-color] duration-200 lg:min-h-8 ${expanded ? 'justify-start gap-1' : 'justify-center'} ${item.label === 'Editor' ? 'border-[var(--nav-accent)]' : 'border-transparent hover:border-[var(--nav-accent)]'} disabled:cursor-not-allowed disabled:opacity-65`}
                disabled={!item.available}
                style={{ '--nav-accent': navigationAccents[item.label] ?? 'var(--color-primary)' } as CSSProperties}
                title={item.available ? item.label : `${item.label} · planificado`}
                type="button"
              >
                <span className="nav-accent-icon grid size-7 shrink-0 place-items-center rounded-sm transition-[color,background-color] duration-200">
                  <Icon name={item.icon} size={14} />
                </span>
                {expanded ? <span className="min-w-0 truncate text-[0.5625rem] font-semibold text-[var(--nav-accent)]">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className={`mt-auto flex h-8 shrink-0 items-center px-1 ${expanded ? 'gap-1' : 'justify-center'}`}>
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-accent-ai)_18%,transparent)] text-[0.5rem] font-bold text-[var(--color-accent-ai)]" aria-label="Perfil de Janiel">JG</div>
          {expanded ? <span className="truncate text-[0.5625rem] font-semibold text-[var(--color-accent-ai)]">Janiel</span> : null}
        </div>
      </div>
      <button aria-label="Redimensionar menú lateral" aria-orientation="vertical" aria-valuemax={168} aria-valuemin={44} aria-valuenow={width} className="group absolute -right-3 inset-y-0 z-30 hidden w-6 cursor-col-resize touch-none place-items-center lg:grid" onKeyDown={onResizeKeyDown} onPointerDown={onResizePointerDown} role="separator" title="Arrastrar o usar flechas; Inicio/Fin para límites" type="button"><span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" /></button>
    </nav>
  )
}
