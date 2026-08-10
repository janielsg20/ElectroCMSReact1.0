import { Button, Icon } from '../primitives'

interface TopBarProps {
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
}

export function TopBar({ darkMode, onToggleTheme }: TopBarProps) {
  return (
    <header className="relative z-20 col-span-full flex min-h-12 items-center border-b border-border bg-surface px-1.5 shadow-sm lg:min-h-10 lg:px-1">
      <a className="skip-link" href="#editor-canvas">Saltar al canvas</a>
      <div className="flex min-w-0 items-center gap-1.5 border-r border-border pr-2 lg:w-[14.75rem] lg:gap-1 lg:pr-1.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-on-primary shadow-sm lg:size-8" aria-hidden="true"><Icon name="sparkles" size={16} /></div>
        <div className="min-w-0"><p className="truncate text-sm font-bold leading-4 lg:text-xs">ElectroCMS <span className="font-normal text-muted-foreground">v0.1</span></p><p className="hidden truncate text-xs leading-4 text-muted-foreground sm:block">React · local-first</p></div>
      </div>

      <button className="ml-1.5 hidden min-h-11 min-w-0 cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-1.5 text-left text-primary transition-colors hover:bg-primary hover:text-on-primary focus-visible:ring-2 focus-visible:ring-focus sm:flex lg:min-h-8" type="button">
        <Icon className="shrink-0" name="editor" size={13} /><span className="min-w-0"><span className="block truncate text-xs">Proyecto</span><span className="block truncate text-xs font-semibold">Revista Horizonte</span></span><Icon className="shrink-0" name="chevron-down" size={12} />
      </button>

      <div className="ml-auto flex items-center gap-1" role="toolbar" aria-label="Acciones del proyecto">
        <button className="hidden min-h-8 cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary lg:flex" type="button"><Icon name="upload" size={12} />Versión 1 <Icon name="chevron-down" size={12} /></button>
        <button aria-label="Comentarios, 2 pendientes" className="relative hidden min-h-8 cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary lg:flex" type="button"><Icon name="content" size={12} />Comentarios<span className="rounded bg-destructive px-1 py-0.5 text-xs font-bold text-on-destructive">2</span></button>
        <span className="hidden xl:block"><Button aria-label="Deshacer, no disponible" disabled size="icon" variant="ghost"><Icon name="undo" size={16} /></Button></span>
        <span className="hidden xl:block"><Button aria-label="Rehacer, no disponible" disabled size="icon" variant="ghost"><Icon name="redo" size={16} /></Button></span>
        <Button aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} className="text-primary hover:bg-primary-soft" onClick={onToggleTheme} size="icon" variant="ghost"><Icon name={darkMode ? 'sun' : 'moon'} size={16} /></Button>
        <span className="hidden md:block"><Button aria-label="Previsualizar, no disponible" className="text-[var(--color-accent-data)]" disabled size="icon" variant="ghost"><Icon name="eye" size={16} /></Button></span>
        <Button disabled size="small"><Icon name="play" size={16} /><span className="hidden sm:inline">Ejecutar app</span></Button>
      </div>
    </header>
  )
}
