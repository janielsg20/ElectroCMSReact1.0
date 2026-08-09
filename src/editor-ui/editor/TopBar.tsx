import { Button, Icon } from '../primitives'

interface TopBarProps {
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
}

export function TopBar({ darkMode, onToggleTheme }: TopBarProps) {
  return (
    <header className="relative z-20 col-span-full flex min-h-16 items-center gap-2 border-b border-border bg-surface px-3 shadow-sm md:px-4">
      <a className="skip-link" href="#editor-canvas">Saltar al canvas</a>
      <div className="flex min-w-0 items-center gap-2 md:w-[18rem]">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-sm" aria-hidden="true">
          <Icon name="sparkles" size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold leading-5">ElectroCMS</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">Studio local-first</p>
        </div>
        <span className="hidden rounded-full border border-border bg-muted px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-muted-foreground xl:inline">Prototipo UI</span>
      </div>

      <button
        className="hidden min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-canvas px-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus md:flex"
        type="button"
      >
        <span className="min-w-0">
          <span className="block truncate text-xs text-muted-foreground">Proyecto</span>
          <span className="block truncate text-sm font-semibold">Revista Horizonte</span>
        </span>
        <Icon className="ml-auto shrink-0" name="chevron-down" size={16} />
      </button>

      <div className="ml-auto flex items-center gap-1.5" role="toolbar" aria-label="Acciones del proyecto">
        <Button aria-label="Deshacer, no disponible en el prototipo" disabled size="icon" variant="ghost"><Icon name="undo" /></Button>
        <Button aria-label="Rehacer, no disponible en el prototipo" className="hidden sm:inline-flex" disabled size="icon" variant="ghost"><Icon name="redo" /></Button>
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <Button aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme} size="icon" variant="ghost">
          <Icon name={darkMode ? 'sun' : 'moon'} />
        </Button>
        <Button className="hidden lg:inline-flex" disabled size="small" variant="secondary"><Icon name="play" size={16} />Vista previa</Button>
        <Button disabled size="small"><Icon name="upload" size={16} />Publicar</Button>
      </div>
    </header>
  )
}
