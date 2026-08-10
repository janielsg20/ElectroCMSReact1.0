import { Icon } from '../primitives'
import { navigationItems } from './editor-data'

export function AppNavigation() {
  return (
    <nav aria-label="Navegación principal" className="hidden min-h-0 flex-col items-center border-r border-border bg-surface px-1.5 py-2 md:flex">
      <ul className="grid w-full gap-1">
        {navigationItems.map((item) => (
          <li key={item.label}>
            <button
              aria-current={item.label === 'Editor' ? 'page' : undefined}
              className={`group flex min-h-12 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[0.625rem] font-semibold transition-colors ${item.label === 'Editor' ? 'bg-primary-soft text-primary-strong shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-55`}
              disabled={!item.available}
              title={item.available ? item.label : `${item.label} · planificado`}
              type="button"
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-strong" aria-label="Perfil de Janiel">JG</div>
    </nav>
  )
}
