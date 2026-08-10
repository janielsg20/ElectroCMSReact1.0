import { Button, Icon } from '../primitives'

interface TopBarProps {
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
}

export function TopBar({ darkMode, onToggleTheme }: TopBarProps) {
  return (
    <header className="relative z-20 col-span-full flex min-h-14 items-center gap-2 border-b border-border bg-surface px-2 shadow-sm sm:px-3">
      <a className="skip-link" href="#editor-canvas">Saltar al canvas</a>
      <div className="flex min-w-0 items-center gap-2 md:w-[17rem]">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-on-primary shadow-sm" aria-hidden="true">
          <Icon name="sparkles" size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-5">ElectroCMS <span className="font-normal text-muted-foreground">v0.1</span></p>
          <p className="hidden truncate text-[0.6875rem] text-muted-foreground sm:block">Editor local-first</p>
        </div>
        <span className="hidden rounded-md border border-border bg-muted px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-muted-foreground xl:inline">Prototipo UI</span>
      </div>

      <button
        className="hidden min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-lg px-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus md:flex"
        type="button"
      >
        <span className="min-w-0">
          <span className="block truncate text-[0.625rem] text-muted-foreground">Proyecto activo</span>
          <span className="block truncate text-xs font-semibold">Revista Horizonte</span>
        </span>
        <Icon className="ml-auto shrink-0" name="chevron-down" size={16} />
      </button>

      <div className="ml-auto flex items-center gap-1.5" role="toolbar" aria-label="Acciones del proyecto">
        <span className="hidden rounded-lg bg-muted px-2.5 py-2 text-xs font-semibold text-muted-foreground xl:inline">Versión 1</span>
        <span className="hidden sm:block"><Button aria-label="Deshacer, no disponible en el prototipo" disabled size="icon" variant="ghost"><Icon name="undo" /></Button></span>
        <span className="hidden sm:block"><Button aria-label="Rehacer, no disponible en el prototipo" disabled size="icon" variant="ghost"><Icon name="redo" /></Button></span>
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <Button aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme} size="icon" variant="ghost">
          <Icon name={darkMode ? 'sun' : 'moon'} />
        </Button>
        <span className="hidden lg:block"><Button disabled size="small" variant="secondary"><Icon name="eye" size={16} />Previsualizar</Button></span>
        <Button disabled size="small"><Icon name="play" size={16} /><span className="hidden sm:inline">Publicar</span></Button>
      </div>
    </header>
  )
}
