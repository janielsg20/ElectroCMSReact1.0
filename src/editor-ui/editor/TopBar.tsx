import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Icon } from '../primitives'

const BentoMotionIcon = lazy(() => import('./BentoMotionIcon'))

export type UiTheme = 'studio' | 'bento'

interface TopBarProps {
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
  readonly uiTheme: UiTheme
  readonly onUiThemeChange: (theme: UiTheme) => void
}

export function TopBar({ darkMode, onToggleTheme, uiTheme, onUiThemeChange }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const settingsPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!settingsOpen) return
    const firstOption = settingsPanelRef.current?.querySelector<HTMLButtonElement>('[role="radio"]')
    firstOption?.focus()

    function closeOnOutsidePointer(event: PointerEvent): void {
      const target = event.target
      if (!(target instanceof Node) || settingsPanelRef.current?.contains(target) || settingsButtonRef.current?.contains(target)) return
      setSettingsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [settingsOpen])

  function closeSettings(): void {
    setSettingsOpen(false)
    requestAnimationFrame(() => settingsButtonRef.current?.focus())
  }

  function selectTheme(theme: UiTheme): void {
    onUiThemeChange(theme)
    closeSettings()
  }

  function handleSettingsKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSettings()
      return
    }

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const target = event.target
    if (!(target instanceof HTMLElement) || target.getAttribute('role') !== 'radio') return
    const options = Array.from(settingsPanelRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])
    const currentIndex = options.indexOf(target as HTMLButtonElement)
    if (currentIndex < 0 || options.length === 0) return
    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? options.length - 1
        : (currentIndex + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
    const next = options[nextIndex]
    const nextTheme = next?.dataset.themeChoice
    if (!next || (nextTheme !== 'studio' && nextTheme !== 'bento')) return
    onUiThemeChange(nextTheme)
    next.focus()
  }

  return (
    <header className="app-topbar relative z-20 col-span-full flex min-h-12 items-center border-b border-border bg-surface px-1.5 shadow-sm lg:min-h-10 lg:px-1">
      <a className="skip-link" href="#editor-canvas">Saltar al canvas</a>
      <div className="flex min-w-0 items-center gap-1.5 border-r border-border pr-2 lg:w-[14.75rem] lg:gap-1 lg:pr-1.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-on-primary shadow-sm lg:size-8" aria-hidden="true"><Icon name="sparkles" size={16} /></div>
        <div className="min-w-0"><p className="truncate text-sm font-bold leading-4 lg:text-xs">ElectroCMS <span className="font-normal text-muted-foreground">v0.1</span></p><p className="hidden truncate text-xs leading-4 text-muted-foreground sm:block">React · local-first</p></div>
      </div>

      <button className="project-switcher ml-1.5 hidden min-h-11 min-w-0 cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-1.5 text-left text-primary transition-colors hover:bg-primary hover:text-on-primary focus-visible:ring-2 focus-visible:ring-focus sm:flex lg:min-h-8" type="button">
        <Icon className="shrink-0" name="editor" size={13} /><span className="min-w-0"><span className="block truncate text-xs">Proyecto</span><span className="block truncate text-xs font-semibold">Revista Horizonte</span></span><Icon className="shrink-0" name="chevron-down" size={12} />
      </button>

      <div className="ml-auto flex items-center gap-1" role="toolbar" aria-label="Acciones del proyecto">
        <button className="hidden min-h-8 cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary lg:flex" type="button"><Icon name="upload" size={12} />Versión 1 <Icon name="chevron-down" size={12} /></button>
        <button aria-label="Comentarios, 2 pendientes" className="relative hidden min-h-8 cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary lg:flex" type="button"><Icon name="content" size={12} />Comentarios<span className="rounded bg-destructive px-1 py-0.5 text-xs font-bold text-on-destructive">2</span></button>
        <span className="hidden xl:block"><Button aria-label="Deshacer, no disponible" disabled size="icon" variant="ghost"><Icon name="undo" size={16} /></Button></span>
        <span className="hidden xl:block"><Button aria-label="Rehacer, no disponible" disabled size="icon" variant="ghost"><Icon name="redo" size={16} /></Button></span>
        <div className="relative">
          <button
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            aria-label="Ajustes de apariencia"
            className={`theme-settings-trigger relative inline-grid size-11 cursor-pointer place-items-center rounded-md border border-transparent text-primary transition-[background-color,border-color,box-shadow] duration-200 hover:bg-primary-soft active:bg-primary/15 focus-visible:ring-2 focus-visible:ring-focus lg:size-8 ${uiTheme === 'bento' ? 'bg-primary-soft' : ''}`}
            onClick={() => setSettingsOpen((current) => !current)}
            ref={settingsButtonRef}
            type="button"
          >
            <Icon name="settings" size={16} />
            {uiTheme === 'bento' ? <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-primary ring-2 ring-surface" /> : null}
          </button>
          {settingsOpen ? (
            <div
              aria-label="Apariencia de la interfaz"
              className="theme-settings-popover fixed left-1/2 top-12 z-50 w-[min(20rem,calc(100vw-0.75rem))] -translate-x-1/2 rounded-xl border border-border bg-surface p-2 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.35rem)] sm:translate-x-0"
              onKeyDown={handleSettingsKeyDown}
              ref={settingsPanelRef}
              role="dialog"
            >
              <div className="mb-1.5 flex items-start gap-2 px-1">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Icon name="palette" size={15} /></span>
                <div><h2 className="text-xs font-bold">Apariencia</h2><p className="text-xs leading-4 text-muted-foreground">Cambia el lenguaje visual sin alterar tu proyecto.</p></div>
              </div>
              <div aria-label="Tema de diseño" className="grid grid-cols-2 gap-1.5" role="radiogroup">
                <button aria-checked={uiTheme === 'studio'} className={`theme-choice group min-h-24 cursor-pointer rounded-lg border p-2 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ${uiTheme === 'studio' ? 'border-primary bg-primary-soft shadow-sm' : 'border-border bg-muted/50 hover:border-primary/60 hover:bg-primary-soft/60'}`} data-theme-choice="studio" onClick={() => selectTheme('studio')} role="radio" type="button">
                  <span className="mb-1.5 grid size-8 place-items-center rounded-md border border-border bg-surface text-primary"><Icon name="editor" size={15} /></span>
                  <span className="block text-xs font-bold">Studio</span>
                  <span className="block text-xs leading-4 text-muted-foreground">Compacto y clásico</span>
                </button>
                <button aria-checked={uiTheme === 'bento'} className={`theme-choice theme-choice--bento group min-h-24 cursor-pointer rounded-lg border p-2 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ${uiTheme === 'bento' ? 'border-primary bg-primary-soft shadow-sm' : 'border-border bg-muted/50 hover:border-primary/60 hover:bg-primary-soft/60'}`} data-theme-choice="bento" onClick={() => selectTheme('bento')} role="radio" type="button">
                  <span className="mb-1.5 grid size-8 place-items-center rounded-md border border-border bg-surface text-primary">
                    <Suspense fallback={<Icon name="columns" size={15} />}><BentoMotionIcon className="size-7" /></Suspense>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold">Bento Motion<span className="rounded-full bg-primary px-1 text-[0.625rem] text-on-primary">Nuevo</span></span>
                  <span className="block text-xs leading-4 text-muted-foreground">Neutral y dinámico</span>
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-1 rounded-md bg-muted px-1.5 py-1 text-xs text-muted-foreground"><Icon name="check" size={12} />El movimiento respeta la preferencia del sistema.</p>
            </div>
          ) : null}
        </div>
        <Button aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} className="text-primary hover:bg-primary-soft" onClick={onToggleTheme} size="icon" variant="ghost"><Icon name={darkMode ? 'sun' : 'moon'} size={16} /></Button>
        <span className="hidden md:block"><Button aria-label="Previsualizar, no disponible" className="text-[var(--color-accent-data)]" disabled size="icon" variant="ghost"><Icon name="eye" size={16} /></Button></span>
        <Button disabled size="small"><Icon name="play" size={16} /><span className="hidden sm:inline">Ejecutar app</span></Button>
      </div>
    </header>
  )
}
