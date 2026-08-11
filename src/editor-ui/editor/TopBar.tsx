import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
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
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'
import { ProjectThemeControl } from './ProjectThemeControl'
import type { ThemeScope } from '../../domain'
import { EDITOR_THEME_PRESETS, isEditorThemePresetId } from '../theme/editor-presets'

export type { UiTheme } from './appearance-preferences'

const uiThemeLabels = Object.fromEntries(EDITOR_THEME_PRESETS.map((preset) => [preset.id, preset.label])) as Record<UiTheme, string>

const colorModeLabels: Record<ColorMode, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Automático',
}

interface TopBarProps {
  readonly darkMode: boolean
  readonly onToggleTheme: () => void
  readonly uiTheme: UiTheme
  readonly onUiThemeChange: (theme: UiTheme) => void
}

export function TopBar({ darkMode, onToggleTheme, uiTheme, onUiThemeChange }: TopBarProps) {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [themeScope, setThemeScope] = useState<ThemeScope>('editor')
  const [appearance, setAppearance] = useState<AppearancePreferences>(() => readInitialAppearance())
  const [systemDark, setSystemDark] = useState(() => systemPrefersDark())
  const [historyPending, setHistoryPending] = useState(false)
  const [historyStatus, setHistoryStatus] = useState('')
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
    const firstOption = settingsPanelRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')
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
      if (isEditorThemePresetId(nextTheme)) selectTheme(nextTheme, false)
    } else {
      const nextMode = next.dataset.colorChoice
      if (nextMode === 'light' || nextMode === 'dark' || nextMode === 'system') selectColorMode(nextMode)
    }
    next.focus()
  }

  async function executeHistory(action: 'undo' | 'redo'): Promise<void> {
    if (historyPending) return
    setHistoryPending(true)
    setHistoryStatus(action === 'undo' ? 'Deshaciendo…' : 'Rehaciendo…')
    const result = action === 'undo' ? await session.undo() : await session.redo()
    setHistoryStatus(result.ok
      ? action === 'undo' ? 'Cambio deshecho.' : 'Cambio rehecho.'
      : result.error)
    setHistoryPending(false)
  }

  return (
    <header className="app-topbar relative z-20 col-span-full flex h-11 min-h-11 items-center border-b border-border bg-surface px-1 md:h-10 md:min-h-10">
      <a className="skip-link" href="#editor-canvas">Saltar al contenido</a>

      <div className="builder-brand flex h-full min-w-0 items-center gap-1 border-r border-border pr-1.5 md:w-[13.5rem]">
        <div className="grid size-7 shrink-0 place-items-center rounded bg-primary text-on-primary" aria-hidden="true"><Icon name="sparkles" size={14} /></div>
        <div className="min-w-0 leading-none">
          <p className="truncate text-xs font-bold">ElectroCMS</p>
          <p className="hidden truncate text-[0.625rem] text-muted-foreground sm:block">Visual Builder</p>
        </div>
      </div>

      <div className="builder-project-context ml-1 hidden min-w-0 items-center sm:flex">
        <div className="project-switcher flex h-8 min-w-0 items-center gap-1 rounded px-1.5 text-left">
          <Icon className="shrink-0 text-muted-foreground" name="editor" size={13} />
          <span className="min-w-0 truncate text-xs font-semibold text-foreground">Proyecto local</span>
        </div>
      </div>

      <div className="builder-page-context ml-1 hidden min-w-0 items-center gap-1 border-l border-border pl-2 text-xs text-muted-foreground lg:flex" aria-label="Sección actual">
        <span className="truncate">Documento</span><span aria-hidden="true">/</span><strong className="truncate font-semibold text-foreground">Página inicial</strong>
      </div>

      <div className="builder-topbar-actions ml-auto flex min-w-0 items-center gap-0.5" role="toolbar" aria-label="Acciones del proyecto">
        <div className="builder-toolgroup hidden items-center gap-px xl:flex" aria-label="Historial">
          <Button aria-label="Deshacer último cambio" data-tooltip="Deshacer" disabled={historyPending} onClick={() => void executeHistory('undo')} size="icon" variant="ghost"><Icon name="undo" size={15} /></Button>
          <Button aria-label="Rehacer último cambio" data-tooltip="Rehacer" disabled={historyPending} onClick={() => void executeHistory('redo')} size="icon" variant="ghost"><Icon name="redo" size={15} /></Button>
        </div>

        <div className="mx-0.5 hidden h-5 w-px bg-border xl:block" aria-hidden="true" />

        <div className="builder-toolgroup flex items-center gap-px" aria-label="Apariencia y vista">
          <div className="relative">
            <button
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              aria-label={`Ajustes de apariencia · Preset: ${activeThemeLabel} · Color: ${activeColorModeLabel}`}
              className={`theme-settings-trigger relative inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-focus md:h-8 ${appearance.uiTheme !== 'high-density' || appearance.colorMode !== 'light' ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`}
              data-tooltip={`Apariencia · ${activeThemeLabel} · ${activeColorModeLabel}`}
              onClick={() => setSettingsOpen((current) => !current)}
              ref={settingsButtonRef}
              type="button"
            >
              <Icon name="palette" size={15} />
              <span className="hidden sm:inline">Tema</span>
              <span className="hidden max-w-32 truncate rounded bg-muted/70 px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground lg:inline">{activeThemeLabel}</span>
              <Icon className="hidden text-muted-foreground sm:block" name="chevron-down" size={11} />
              {appearance.uiTheme !== 'high-density' || appearance.colorMode !== 'light' ? <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-primary ring-2 ring-surface sm:hidden" /> : null}
            </button>
            {settingsOpen ? (
              <div
                aria-label="Apariencia de la interfaz"
                className="theme-settings-popover fixed left-1/2 top-12 z-50 max-h-[calc(100dvh-3.5rem)] w-[min(42rem,calc(100vw-0.75rem))] -translate-x-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.35rem)] sm:translate-x-0"
                onKeyDown={handleSettingsKeyDown}
                ref={settingsPanelRef}
                role="dialog"
              >
                <div className="mb-2 flex items-start gap-2 px-1">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="palette" size={15} /></span>
                  <div><h2 className="text-xs font-bold">Ámbitos de tema</h2><p className="text-xs leading-4 text-muted-foreground">Editor, frontend y backend se configuran de forma independiente.</p></div>
                </div>

                <div aria-label="Ámbito de tema" className="mb-2 grid grid-cols-3 gap-1 rounded-md border border-border bg-muted/30 p-1" role="group">
                  {(['editor', 'frontend', 'backend'] as const).map((scope) => (
                    <button aria-pressed={themeScope === scope} className={`min-h-9 rounded px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus ${themeScope === scope ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface/70 hover:text-foreground'}`} key={scope} onClick={() => setThemeScope(scope)} type="button">{scope === 'editor' ? 'Editor' : scope === 'frontend' ? 'Frontend' : 'Backend'}</button>
                  ))}
                </div>

                {themeScope === 'editor' ? <><div className="mb-2 rounded-md border border-primary/20 bg-primary-soft p-2 text-xs leading-4 text-primary-strong">Este ámbito vive en <code>appearance.v1</code> y nunca se exporta con el proyecto.</div><fieldset className="min-w-0 border-0 p-0">
                  <legend className="mb-1 px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Preset visual</legend>
                  <div aria-label="Preset visual" className="grid grid-cols-1 gap-1.5 sm:grid-cols-3" role="radiogroup">
                    {EDITOR_THEME_PRESETS.map((preset) => (
                      <button
                        aria-checked={appearance.uiTheme === preset.id}
                        className={`theme-choice group min-h-20 cursor-pointer rounded-md border p-2 text-left transition-colors ${appearance.uiTheme === preset.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/30 hover:bg-muted'}`}
                        data-theme-choice={preset.id}
                        key={preset.id}
                        onClick={() => selectTheme(preset.id)}
                        role="radio"
                        tabIndex={appearance.uiTheme === preset.id ? 0 : -1}
                        type="button"
                      >
                        <span className="mb-1 flex items-center justify-between"><span className="grid size-7 place-items-center rounded border border-border bg-surface text-primary"><Icon name={preset.layout === 'studio' ? 'editor' : 'columns'} size={14} /></span>{appearance.uiTheme === preset.id ? <Icon className="text-primary" name="check" size={14} /> : null}</span>
                        <span className="block text-xs font-bold">{preset.label}</span>
                        <span className="block text-xs leading-4 text-muted-foreground">{preset.description}</span>
                      </button>
                    ))}
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
                </fieldset></> : <ProjectThemeControl key={`${themeScope}-${JSON.stringify(structure.themes[themeScope])}`} scope={themeScope} theme={structure.themes[themeScope]} />}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{historyStatus}</p>
    </header>
  )
}
