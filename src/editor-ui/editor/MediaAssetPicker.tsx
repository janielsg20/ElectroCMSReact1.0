import { useMemo } from 'react'
import { mediaAssetUrl, type MediaAsset, type MediaKind } from '../../domain/project/media-library'
import { Button, Icon } from '../primitives'
import { useEditorProjectStructure } from './editor-project-context'

interface MediaAssetPickerProps {
  readonly disabled: boolean
  readonly multiple: boolean
  readonly nodeWidgetType: string
  readonly onChange: (value: string) => void
  readonly value: string
}

function assetKindsFor(widgetType: string): readonly MediaKind[] {
  if (widgetType === 'media.video') return ['video']
  if (widgetType === 'media.audio') return ['audio']
  return ['icon', 'image']
}

function selectedUrls(value: string, multiple: boolean): readonly string[] {
  if (!multiple) return value ? [value] : []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function MediaAssetPicker({ disabled, multiple, nodeWidgetType, onChange, value }: MediaAssetPickerProps) {
  const structure = useEditorProjectStructure()
  const assets = useMemo(() => {
    const kinds = assetKindsFor(nodeWidgetType)
    return Object.values(structure.media?.assets ?? {}).filter((asset) => kinds.includes(asset.kind)).sort((left, right) => left.name.localeCompare(right.name, 'es'))
  }, [nodeWidgetType, structure.media?.assets])
  const selected = selectedUrls(value, multiple)
  const selectedAsset = !multiple ? assets.find((asset) => mediaAssetUrl(asset.id) === selected[0]) : undefined

  function select(asset: MediaAsset): void {
    const url = mediaAssetUrl(asset.id)
    if (!multiple) { onChange(url); return }
    onChange(JSON.stringify(selected.includes(url) ? selected.filter((item) => item !== url) : [...selected, url]))
  }

  return <div className="mt-1 grid gap-1.5 rounded-md border border-border bg-muted/10 p-1.5" data-testid="media-asset-picker">
    <div className="flex items-center gap-1 text-[0.625rem] text-muted-foreground"><Icon name="image" size={12} /><span>{multiple ? 'Selecciona uno o varios recursos locales.' : 'Selecciona un recurso local o conserva un enlace externo.'}</span></div>
    {assets.length ? <div aria-label="Recursos disponibles" className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto" role="listbox">{assets.map((asset) => {
      const url = mediaAssetUrl(asset.id); const active = selected.includes(url)
      return <button aria-selected={active} className={`min-h-11 rounded-md border px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${active ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`} disabled={disabled} key={asset.id} onClick={() => select(asset)} role="option" type="button"><span className="flex items-center gap-1"><Icon name={asset.kind === 'image' || asset.kind === 'icon' ? 'image' : asset.kind === 'video' ? 'play' : 'content'} size={12} /><strong className="truncate text-[0.625rem]">{asset.name}</strong></span><span className="block truncate text-[0.5625rem] text-muted-foreground">{asset.kind} · {asset.fileName}</span></button>
    })}</div> : <p className="rounded border border-dashed border-border bg-surface p-2 text-[0.625rem] text-muted-foreground">No hay recursos compatibles. Impórtalos desde Contenido → Biblioteca multimedia.</p>}
    {selected.length ? <Button disabled={disabled} onClick={() => onChange(multiple ? '[]' : '')} size="small" type="button" variant="ghost">Quitar {multiple ? 'selección' : 'recurso'}</Button> : null}
    {selectedAsset ? <p className="rounded bg-primary-soft px-2 py-1 text-[0.625rem] font-semibold text-primary-strong">Recurso seleccionado: {selectedAsset.name}</p> : null}
    {!multiple ? <label className="grid gap-1 text-[0.625rem] font-semibold text-muted-foreground">URL externa<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder="https://…" value={selectedAsset ? '' : value} /></label> : <details><summary className="cursor-pointer text-[0.625rem] font-semibold text-muted-foreground">Editar enlaces externos</summary><textarea className="mt-1 min-h-16 w-full rounded-md border border-border bg-surface p-2 font-mono text-[0.625rem] text-foreground focus-visible:ring-2 focus-visible:ring-focus" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} /></details>}
  </div>
}
