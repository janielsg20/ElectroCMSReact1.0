import { useState, type KeyboardEvent } from 'react'
import { PROJECT_THEME_PRESETS, ProjectThemeSchema, type ProjectTheme, type ProjectThemePresetId, type ProjectThemeScope } from '../../domain'
import { Button, Icon } from '../primitives'
import { useEditorProject } from './editor-project-context'

interface ProjectThemeControlProps {
  readonly scope: ProjectThemeScope
  readonly theme: ProjectTheme
}

const scopeLabels: Record<ProjectThemeScope, string> = {
  backend: 'backend administrativo',
  frontend: 'frontend generado',
}

function parseTheme(name: string, tokensText: string): { readonly error: string; readonly theme?: ProjectTheme } {
  let tokens: unknown
  try {
    tokens = JSON.parse(tokensText)
  } catch {
    return { error: 'Los tokens deben contener JSON válido.' }
  }
  const parsed = ProjectThemeSchema.safeParse({ name, schemaVersion: 1, tokens })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { error: `${issue?.path.join('.') || 'theme'}: ${issue?.message ?? 'Tema inválido.'}` }
  }
  return { error: '', theme: parsed.data }
}

function matchingPresetId(theme: ProjectTheme): ProjectThemePresetId | null {
  return PROJECT_THEME_PRESETS.find((preset) => JSON.stringify(preset.theme) === JSON.stringify(theme))?.id ?? null
}

export function ProjectThemeControl({ scope, theme }: ProjectThemeControlProps) {
  const session = useEditorProject()
  const [name, setName] = useState(theme.name)
  const [tokensText, setTokensText] = useState(() => JSON.stringify(theme.tokens, null, 2))
  const [selectedPresetId, setSelectedPresetId] = useState<ProjectThemePresetId>(() => matchingPresetId(theme) ?? 'bento-grid')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const parsed = parseTheme(name, tokensText)
  const preview = parsed.theme?.tokens.color ?? theme.tokens.color

  async function apply(): Promise<void> {
    if (!parsed.theme || pending) {
      setMessage(parsed.error)
      return
    }
    setPending(true)
    const result = await session.updateProjectTheme(scope, parsed.theme)
    setMessage(result.ok ? `Tema de ${scopeLabels[scope]} actualizado.` : result.error)
    setPending(false)
  }

  async function reset(): Promise<void> {
    if (pending) return
    setPending(true)
    const result = await session.resetProjectTheme(scope)
    if (result.ok) {
      const next = result.value.themes[scope]
      setName(next.name)
      setTokensText(JSON.stringify(next.tokens, null, 2))
      setMessage(`Tema de ${scopeLabels[scope]} restablecido.`)
    } else {
      setMessage(result.error)
    }
    setPending(false)
  }

  async function applyPreset(): Promise<void> {
    if (pending) return
    const preset = PROJECT_THEME_PRESETS.find((candidate) => candidate.id === selectedPresetId)
    if (!preset) {
      setMessage('El preset seleccionado ya no está disponible.')
      return
    }
    setPending(true)
    const next = structuredClone(preset.theme)
    const result = await session.updateProjectTheme(scope, next)
    if (result.ok) {
      setName(next.name)
      setTokensText(JSON.stringify(next.tokens, null, 2))
      setMessage(`${preset.label} aplicado al ${scopeLabels[scope]}. Puedes editarlo y guardarlo como tema personalizado.`)
    } else {
      setMessage(result.error)
    }
    setPending(false)
  }

  function handlePresetKeyDown(event: KeyboardEvent<HTMLButtonElement>, presetId: ProjectThemePresetId): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const currentIndex = PROJECT_THEME_PRESETS.findIndex((preset) => preset.id === presetId)
    if (currentIndex < 0) return
    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? PROJECT_THEME_PRESETS.length - 1
        : (currentIndex + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + PROJECT_THEME_PRESETS.length) % PROJECT_THEME_PRESETS.length
    const next = PROJECT_THEME_PRESETS[nextIndex]
    if (!next) return
    setSelectedPresetId(next.id)
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-project-theme-preset="${next.id}"]`)?.focus()
  }

  return (
    <section aria-labelledby={`${scope}-theme-title`} className="grid gap-2">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name={scope === 'frontend' ? 'window' : 'editor'} size={15} /></span>
        <div className="min-w-0">
          <h2 className="text-xs font-bold" id={`${scope}-theme-title`}>Tema del {scopeLabels[scope]}</h2>
          <p className="text-xs leading-4 text-muted-foreground">Estado canónico del proyecto. Sus cambios pasan por historial y no alteran la apariencia de ElectroCMS.</p>
        </div>
      </div>

      <div aria-label="Vista previa de paleta" className="grid grid-cols-5 gap-1 rounded-md border border-border bg-surface p-1.5">
        {([
          ['Fondo', preview.background],
          ['Superficie', preview.surface],
          ['Primario', preview.primary],
          ['Texto', preview.text],
          ['Borde', preview.border],
        ] as const).map(([label, color]) => (
          <span className="min-w-0" key={label} title={`${label}: ${color}`}>
            <span aria-hidden="true" className="block h-7 rounded border border-black/10" style={{ backgroundColor: color }} />
            <span className="mt-0.5 block truncate text-center text-[0.5625rem] text-muted-foreground">{label}</span>
          </span>
        ))}
      </div>

      <fieldset className="min-w-0 border-0 p-0">
        <legend className="mb-1 px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Catálogo visual</legend>
        <div aria-label={`Presets del ${scopeLabels[scope]}`} className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="radiogroup">
          {PROJECT_THEME_PRESETS.map((preset) => (
            <button
              aria-checked={selectedPresetId === preset.id}
              className={`theme-preset-card min-h-24 rounded-md border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-focus ${selectedPresetId === preset.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/25 hover:bg-muted'}`}
              data-project-theme-preset={preset.id}
              key={preset.id}
              onKeyDown={(event) => handlePresetKeyDown(event, preset.id)}
              onClick={() => setSelectedPresetId(preset.id)}
              role="radio"
              tabIndex={selectedPresetId === preset.id ? 0 : -1}
              type="button"
            >
              <span aria-hidden="true" className="mb-1 grid grid-cols-4 gap-0.5 overflow-hidden rounded border border-black/10">
                {[preset.theme.tokens.color.background, preset.theme.tokens.color.surface, preset.theme.tokens.color.primary, preset.theme.tokens.color.text].map((color) => <span className="h-3" key={color} style={{ backgroundColor: color }} />)}
              </span>
              <span className="flex items-center justify-between gap-1"><span className="text-xs font-bold">{preset.label}</span>{selectedPresetId === preset.id ? <Icon className="text-primary" name="check" size={13} /> : null}</span>
              <span className="mt-0.5 block text-[0.625rem] leading-4 text-muted-foreground">{preset.description}</span>
              <span className="mt-1 block text-[0.5625rem] font-semibold uppercase tracking-wide text-muted-foreground">{preset.traits.layout} · {preset.traits.responsiveProfile} · AA</span>
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-end"><Button disabled={pending} onClick={() => void applyPreset()} size="small" variant="secondary">Aplicar preset</Button></div>
      </fieldset>

      <label className="grid gap-1 text-xs font-semibold" htmlFor={`${scope}-theme-name`}>
        Nombre
        <input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" id={`${scope}-theme-name`} maxLength={160} onChange={(event) => setName(event.target.value)} value={name} />
      </label>

      <label className="grid gap-1 text-xs font-semibold" htmlFor={`${scope}-theme-tokens`}>
        Tokens semánticos · schema v1
        <textarea aria-describedby={`${scope}-theme-help`} className="min-h-52 resize-y rounded-md border border-border bg-canvas p-2 font-mono text-[0.625rem] leading-4 text-foreground focus-visible:ring-2 focus-visible:ring-focus" id={`${scope}-theme-tokens`} onChange={(event) => setTokensText(event.target.value)} spellCheck={false} value={tokensText} />
      </label>
      <p className="text-[0.625rem] leading-4 text-muted-foreground" id={`${scope}-theme-help`}>Color, tipografía, espaciado, radios, sombras, movimiento y densidad se validan antes de guardar. El catálogo permanece inmutable; al aplicar uno se crea una copia editable en este ámbito.</p>

      {parsed.error ? <p className="rounded-md border border-danger/35 bg-danger/10 p-2 text-xs text-danger" role="alert">{parsed.error}</p> : null}
      {message ? <p aria-live="polite" className="text-xs text-muted-foreground">{message}</p> : null}

      <div className="flex justify-end gap-1.5">
        <Button disabled={pending} onClick={() => void reset()} size="small" variant="secondary">Restablecer</Button>
        <Button disabled={pending || Boolean(parsed.error)} onClick={() => void apply()} size="small">Aplicar tema</Button>
      </div>
    </section>
  )
}
