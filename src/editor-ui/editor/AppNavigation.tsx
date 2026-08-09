import { Icon } from '../primitives'
import { navigationItems } from './editor-data'

export function AppNavigation() {
  return (
    <nav aria-label="Navegación principal" className="hidden min-h-0 flex-col items-center border-r border-border bg-surface px-2 py-3 md:flex">
      <ul className="grid w-full gap-1">
        {navigationItems.map((item) => (
          <li key={item.label}>
            <button
              aria-current={item.label === 'Editor' ? 'page' : undefined}
              className={`group flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.6875rem] font-medium transition-colors ${item.label === 'Editor' ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-70`}
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
      <div className="mt-auto rounded-lg border border-border bg-canvas px-2 py-1 text-center text-[0.625rem] font-semibold text-muted-foreground">v0.1</div>
    </nav>
  )
}
