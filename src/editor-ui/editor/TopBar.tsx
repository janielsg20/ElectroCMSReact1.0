import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Icon } from '../primitives'
import {
  applyAppearance,
  BrowserAppearancePreferencesStore,
  readInitialAppearance,
  resolveColorMode,
  systemPrefersDark,
  type AppearancePreferences,
  type ColorMode,
  type UiTheme,
} from './appearance-preferences'

export type { UiTheme } from './appearance-preferences'

const BentoMotionIcon = lazy(() => import('./BentoMotionIcon'))

const uiThemeLabels: Record<UiTheme, string> = {
  studio: 'Studio',
  bento: 'Bento Motion',
  flow: 'Flow Builder',
}

const colorModeLabels: Record<ColorMode, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Automático',
}

interface TopBarProps {
  readonly activeSectionLabel: string
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
  readonly uiTheme: UiTheme
  readonly onUiThemeChange: (theme: UiTheme) => void
}

export function TopBar({ activeSectionLabel, darkMode, onToggleTheme, uiTheme, onUiThemeChange }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [appearance, setAppearance] = useState<AppearancePreferences>(() => readInitialAppearance())
  const [systemDark, setSystemDark] = useState(() => systemPrefersDark())
  const [appearanceStore] = useState(() => new BrowserAppearancePreferencesStore(window.localStorage))
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const settingsPanelRef = useRef<HTMLDivElement>(null)
  const pendingDarkModeRef = useRef<boolean | null>(null)
  const activeThemeLabel = uiThemeLabels[appearance.uiTheme]
  const activeColorModeLabel = colorModeLabels[appearance.colorMode]
  const resolvedDark = resolveColorMode(appearance.colorMode, systemDark) === 'dark'

  useLayoutEffect(() => {
    applyAppearance(document.documentElement, appearance, systemDark)

    if (uiTheme !== appearance.uiTheme) onUiThemeChange(appearance.uiTheme)

    if (darkMode === resolvedDark) {
      pendingDarkModeRef.current = null
    } else if (pendingDarkModeRef.current !== resolvedDark) {
      pendingDarkModeRef.current = resolvedDark
      onToggleTheme()
    }
  }, [appearance, darkMode, onToggleTheme, onUiThemeChange, resolvedDark, systemDark, uiTheme])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = (): void => setSystemDark(media.matches)

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    if (typeof media.addListener === 'function') {
      media.addListener(update)
      return () => media.removeListener(update)
    }
  }, [])

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

  function commitAppearance(next: AppearancePreferences): void {
    appearanceStore.save(next)
    setAppearance(next)
  }

  function closeSettings(): void {
    setSettingsOpen(false)
    requestAnimationFrame(() => settingsButtonRef.current?.focus())
  }

  function selectTheme(theme: UiTheme, closeAfterSelection = true): void {
    commitAppearance({ ...appearance, uiTheme: theme })
    if (closeAfterSelection) closeSettings()
  }

  function selectColorMode(colorMode: ColorMode): void {
    commitAppearance({ ...appearance, colorMode })
  }

  function handleSettingsKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSettings()
      return
    }

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const target = event.target
    if (!(target instanceof HTMLButtonElement) || target.getAttribute('role') !== 'radio') return
    const isThemeChoice = Boolean(target.dataset.themeChoice)
    const selector = isThemeChoice ? '[data-theme-choice]' : '[data-color-choice]'
    const options = Array.from(settingsPanelRef.current?.querySelectorAll<HTMLButtonElement>(selector) ?? [])
    const currentIndex = options.indexOf(target)
    if (currentIndex < 0 || options.length === 0) return
    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? options.length - 1
        : (currentIndex + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
    const next = options[nextIndex]
    if (!next) return

    if (isThemeChoice) {
      const nextTheme = next.dataset.themeChoice
      if (nextTheme === 'studio' || nextTheme === 'bento' || nextTheme === 'flow') selectTheme(nextTheme, false)
    } else {
      const nextMode = next.dataset.colorChoice
      if (nextMode === 'light' || nextMode === 'dark' || nextMode === 'system') selectColorMode(nextMode)
    }
    next.focus()
  }

  return (
    <header className="app-topbar relative z-20 col-span-full flex h-11 min-h-11 items-center border-b border-border bg-surface px-1 md:h-10 md:min-h-10">
      <a className="skip-link" href={activeSectionLabel === 'Editor' ? '#editor-canvas' : '#product-demo'}>Saltar al contenido</a>

      <div className="builder-brand flex h-full min-w-0 items-center gap-1 border-r border-border pr-1.5 md:w-[13.5rem]">
        <div className="grid size-7 shrink-0 place-items-center rounded bg-primary text-on-primary" aria-hidden="true"><Icon name="sparkles" size={14} /></div>
        <div className="min-w-0 leading-none">
          <p className="truncate text-xs font-bold">ElectroCMS</p>
          <p className="hidden truncate text-[0.625rem] text-muted-foreground sm:block">Visual Builder</p>
        </div>
        <span className="ml-auto hidden rounded border border-primary/20 bg-primary-soft px-1 py-0.5 text-[0.5625rem] font-bold text-primary-strong md:inline">DEMO</span>
      </div>

      <div className="builder-project-context ml-1 hidden min-w-0 items-center sm:flex">
        <button aria-label="Cambiar proyecto, planificado" className="project-switcher flex h-8 min-w-0 cursor-not-allowed items-center gap-1 rounded border border-transparent bg-transparent px-1.5 text-left opacity-60" data-tooltip="Cambiar proyecto · planificado" disabled type="button">
          <Icon className="shrink-0 text-muted-foreground" name="editor" size={13} />
          <span className="min-w-0 truncate text-xs font-semibold text-foreground">Revista Horizonte</span>
          <Icon className="shrink-0 text-muted-foreground" name="chevron-down" size={11} />
        </button>
      </div>

      <div className="builder-page-context ml-1 hidden min-w-0 items-center gap-1 border-l border-border pl-2 text-xs text-muted-foreground lg:flex" aria-label="Sección actual">
        <span className="truncate">Producto</span><span aria-hidden="true">/</span><strong className="truncate font-semibold text-foreground">{activeSectionLabel}</strong>
      </div>

      <div className="builder-topbar-actions ml-auto flex min-w-0 items-center gap-0.5" role="toolbar" aria-label="Acciones del proyecto">
        <div className="builder-toolgroup hidden items-center gap-px xl:flex" aria-label="Historial">
          <Button aria-label="Deshacer, no disponible" data-tooltip="Deshacer · planificado" disabled size="icon" variant="ghost"><Icon name="undo" size={15} /></Button>
          <Button aria-label="Rehacer, no disponible" data-tooltip="Rehacer · planificado" disabled size="icon" variant="ghost"><Icon name="redo" size={15} /></Button>
        </div>

        <div className="mx-0.5 hidden h-5 w-px bg-border xl:block" aria-hidden="true" />

        <div className="builder-toolgroup flex items-center gap-px" aria-label="Apariencia y vista">
          <div className="relative">
            <button
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              aria-label={`Ajustes de apariencia · Preset: ${activeThemeLabel} · Color: ${activeColorModeLabel}`}
              className={`theme-settings-trigger relative inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-focus md:h-8 ${appearance.uiTheme !== 'studio' || appearance.colorMode !== 'light' ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`}
              data-tooltip={`Apariencia · ${activeThemeLabel} · ${activeColorModeLabel}`}
              onClick={() => setSettingsOpen((current) => !current)}
              ref={settingsButtonRef}
              type="button"
            >
              <Icon name="palette" size={15} />
              <span className="hidden sm:inline">Tema</span>
              <span className="hidden max-w-32 truncate rounded bg-muted/70 px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground lg:inline">{activeThemeLabel}</span>
              <Icon className="hidden text-muted-foreground sm:block" name="chevron-down" size={11} />
              {appearance.uiTheme !== 'studio' || appearance.colorMode !== 'light' ? <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-primary ring-2 ring-surface sm:hidden" /> : null}
            </button>
            {settingsOpen ? (
              <div
                aria-label="Apariencia de la interfaz"
                className="theme-settings-popover fixed left-1/2 top-12 z-50 w-[min(32rem,calc(100vw-0.75rem))] -translate-x-1/2 rounded-lg border border-border bg-surface p-2 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.35rem)] sm:translate-x-0"
                onKeyDown={handleSettingsKeyDown}
                ref={settingsPanelRef}
                role="dialog"
              >
                <div className="mb-2 flex items-start gap-2 px-1">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="palette" size={15} /></span>
                  <div><h2 className="text-xs font-bold">Apariencia del editor</h2><p className="text-xs leading-4 text-muted-foreground">El preset cambia el lenguaje visual; el modo de color controla claro, oscuro o sistema. Los datos del proyecto no cambian.</p></div>
                </div>

                <fieldset className="min-w-0 border-0 p-0">
                  <legend className="mb-1 px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Preset visual</legend>
                  <div aria-label="Preset visual" className="grid grid-cols-1 gap-1.5 sm:grid-cols-3" role="radiogroup">
                    <button aria-checked={appearance.uiTheme === 'studio'} className={`theme-choice group min-h-20 cursor-pointer rounded-md border p-2 text-left transition-colors ${appearance.uiTheme === 'studio' ? 'border-primary bg-primary-soft' : 'border-border bg-muted/30 hover:bg-muted'}`} data-theme-choice="studio" onClick={() => selectTheme('studio')} role="radio" type="button">
                      <span className="mb-1 flex items-center justify-between"><span className="grid size-7 place-items-center rounded border border-border bg-surface text-primary"><Icon name="editor" size={14} /></span>{appearance.uiTheme === 'studio' ? <Icon className="text-primary" name="check" size={14} /> : null}</span>
                      <span className="block text-xs font-bold">Studio</span>
                      <span className="block text-xs leading-4 text-muted-foreground">Compacto y clásico</span>
                    </button>
                    <button aria-checked={appearance.uiTheme === 'bento'} className={`theme-choice theme-choice--bento group min-h-20 cursor-pointer rounded-md border p-2 text-left transition-colors ${appearance.uiTheme === 'bento' ? 'border-primary bg-primary-soft' : 'border-border bg-muted/30 hover:bg-muted'}`} data-theme-choice="bento" onClick={() => selectTheme('bento')} role="radio" type="button">
                      <span className="mb-1 flex items-center justify-between"><span className="grid size-7 place-items-center rounded border border-border bg-surface text-primary"><Suspense fallback={<Icon name="columns" size={14} />}><BentoMotionIcon className="size-6" /></Suspense></span>{appearance.uiTheme === 'bento' ? <Icon className="text-primary" name="check" size={14} /> : null}</span>
                      <span className="block text-xs font-bold">Bento Motion</span>
                      <span className="block text-xs leading-4 text-muted-foreground">Neutral y dinámico</span>
                    </button>
                    <button aria-checked={appearance.uiTheme === 'flow'} className={`theme-choice theme-choice--flow group min-h-20 cursor-pointer rounded-md border p-2 text-left transition-colors ${appearance.uiTheme === 'flow' ? 'border-primary bg-primary-soft' : 'border-border bg-muted/30 hover:bg-muted'}`} data-theme-choice="flow" onClick={() => selectTheme('flow')} role="radio" type="button">
                      <span className="mb-1 flex items-center justify-between"><span className="grid size-7 place-items-center rounded border border-border bg-surface text-primary"><Icon name="columns" size={14} /></span>{appearance.uiTheme === 'flow' ? <Icon className="text-primary" name="check" size={14} /> : null}</span>
                      <span className="block text-xs font-bold">Flow Builder</span>
                      <span className="block text-xs leading-4 text-muted-foreground">Minimal + high density</span>
                    </button>
                  </div>
                </fieldset>

                <fieldset className="mt-2 min-w-0 border-0 p-0">
                  <legend className="mb-1 px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Modo de color</legend>
                  <div aria-label="Modo de color" className="grid grid-cols-3 gap-1" role="radiogroup">
                    <button aria-checked={appearance.colorMode === 'light'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-md border px-1.5 text-xs font-semibold transition-colors ${appearance.colorMode === 'light' ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-muted/30 text-foreground hover:bg-muted'}`} data-color-choice="light" onClick={() => selectColorMode('light')} role="radio" type="button"><Icon name="sun" size={14} /><span>Claro</span></button>
                    <button aria-checked={appearance.colorMode === 'dark'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-md border px-1.5 text-xs font-semibold transition-colors ${appearance.colorMode === 'dark' ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-muted/30 text-foreground hover:bg-muted'}`} data-color-choice="dark" onClick={() => selectColorMode('dark')} role="radio" type="button"><Icon name="moon" size={14} /><span>Oscuro</span></button>
                    <button aria-checked={appearance.colorMode === 'system'} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-md border px-1.5 text-xs font-semibold transition-colors ${appearance.colorMode === 'system' ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-muted/30 text-foreground hover:bg-muted'}`} data-color-choice="system" onClick={() => selectColorMode('system')} role="radio" type="button"><Icon name="desktop" size={14} /><span>Automático</span></button>
                  </div>
                  <p className="mt-1 px-1 text-[0.625rem] leading-4 text-muted-foreground">Automático sigue <code>prefers-color-scheme</code> del sistema y cambia sin recargar.</p>
                </fieldset>
              </div>
            ) : null}
          </div>
          <Button aria-label="Previsualizar, no disponible" className="hidden md:inline-flex" data-tooltip="Preview · planificado" disabled size="icon" variant="ghost"><Icon name="eye" size={15} /></Button>
        </div>

        <Button className="builder-run-action ml-0.5" data-tooltip="Ejecución · planificada" disabled size="small"><Icon name="play" size={14} /><span className="hidden sm:inline">Run</span></Button>
      </div>
    </header>
  )
}
