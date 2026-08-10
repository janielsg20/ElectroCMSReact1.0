import { Button, Icon } from '../primitives'

interface TopBarProps {
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
}

export function TopBar({ darkMode, onToggleTheme }: TopBarProps) {
  return (
    <header className="relative z-20 col-span-full flex min-h-14 items-center border-b border-border bg-surface px-2 shadow-sm">
      <a className="skip-link" href="#editor-canvas">Saltar al canvas</a>
      <div className="flex min-w-0 items-center gap-2 border-r border-border pr-3 lg:w-[18.25rem]">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-on-primary shadow-sm" aria-hidden="true"><Icon name="sparkles" size={18} /></div>
        <div className="min-w-0"><p className="truncate text-sm font-bold leading-5">ElectroCMS <span className="font-normal text-muted-foreground">v0.1</span></p><p className="hidden truncate text-[0.625rem] text-muted-foreground sm:block">React · local-first</p></div>
      </div>

      <button className="ml-2 hidden min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus sm:flex" type="button">
        <span className="min-w-0"><span className="block truncate text-[0.5625rem] text-muted-foreground">Proyecto</span><span className="block truncate text-xs font-semibold">Revista Horizonte</span></span><Icon className="shrink-0" name="chevron-down" size={14} />
      </button>

      <div className="ml-auto flex items-center gap-1" role="toolbar" aria-label="Acciones del proyecto">
        <button className="hidden min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-muted lg:flex" type="button">Versión 1 <Icon name="chevron-down" size={14} /></button>
        <button aria-label="Comentarios, 2 pendientes" className="relative hidden min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-muted lg:flex" type="button"><Icon name="content" size={16} />Comentarios<span className="rounded bg-destructive px-1.5 py-0.5 text-[0.625rem] font-bold text-on-destructive">2</span></button>
        <span className="hidden xl:block"><Button aria-label="Deshacer, no disponible" disabled size="icon" variant="ghost"><Icon name="undo" size={16} /></Button></span>
        <span className="hidden xl:block"><Button aria-label="Rehacer, no disponible" disabled size="icon" variant="ghost"><Icon name="redo" size={16} /></Button></span>
        <Button aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme} size="icon" variant="ghost"><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></Button>
        <span className="hidden md:block"><Button aria-label="Previsualizar, no disponible" disabled size="icon" variant="ghost"><Icon name="eye" size={18} /></Button></span>
        <Button disabled size="small"><Icon name="play" size={16} /><span className="hidden sm:inline">Ejecutar app</span></Button>
      </div>
    </header>
  )
}
