import { Icon } from '../primitives'
import { navigationItems } from './editor-data'

export function AppNavigation() {
  return (
    <nav aria-label="Navegación principal" className="hidden min-h-0 flex-col items-center overflow-y-auto border-r border-border bg-surface py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex">
      <span className="mb-1 text-[0.5625rem] font-medium text-muted-foreground">Menú</span>
      <ul className="grid w-full gap-0.5">
        {navigationItems.map((item) => (
          <li key={item.label}>
            <button
              aria-current={item.label === 'Editor' ? 'page' : undefined}
              aria-label={item.label}
              className={`group relative grid min-h-11 min-w-11 w-full cursor-pointer place-items-center border-l-2 transition-colors ${item.label === 'Editor' ? 'border-primary bg-primary-soft text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-55`}
              disabled={!item.available}
              title={item.available ? item.label : `${item.label} · planificado`}
              type="button"
            >
              <Icon name={item.icon} size={18} />
              <span className="sr-only">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[0.625rem] font-bold text-primary-strong" aria-label="Perfil de Janiel">JG</div>
    </nav>
  )
}
