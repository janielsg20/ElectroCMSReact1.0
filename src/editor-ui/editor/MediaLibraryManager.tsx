import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { inspectMediaImport, parseMediaAssetId, type MediaAsset, type MediaAssetInput, type MediaKind } from '../../domain'
import { Button, HelpTip, Icon } from '../primitives'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('El archivo no se pudo codificar.')); reader.readAsDataURL(file) })
}

async function contentHash(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('')
}

function dimensions(file: File, mimeType: string): Promise<{ readonly width: number | null; readonly height: number | null }> {
  if (!mimeType.startsWith('image/')) return Promise.resolve({ height: null, width: null })
  return new Promise((resolve) => { const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { URL.revokeObjectURL(url); resolve({ height: image.naturalHeight || null, width: image.naturalWidth || null }) }; image.onerror = () => { URL.revokeObjectURL(url); resolve({ height: null, width: null }) }; image.src = url })
}

interface ThumbnailResult {
  readonly dataUrl: string
  readonly height: number
  readonly width: number
}

function imageThumbnail(file: File, mimeType: string): Promise<ThumbnailResult | null> {
  if (!mimeType.startsWith('image/')) return Promise.resolve(null)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file); const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 240 / Math.max(image.naturalWidth, image.naturalHeight, 1))
      const width = Math.max(1, Math.round(image.naturalWidth * scale)); const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) { resolve(null); return }
      context.drawImage(image, 0, 0, width, height)
      resolve({ dataUrl: canvas.toDataURL('image/png'), height, width })
    }
    image.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    image.src = url
  })
}

function MediaCard({ asset, onSelect, selected }: { readonly asset: MediaAsset; readonly onSelect: () => void; readonly selected: boolean }) {
  return <button aria-pressed={selected} className={`grid min-h-24 content-start gap-1 rounded-md border p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`} onClick={onSelect} type="button"><span className="grid size-7 place-items-center rounded bg-muted text-muted-foreground"><Icon name={asset.kind === 'image' || asset.kind === 'icon' ? 'image' : asset.kind === 'audio' ? 'play' : 'content'} size={14} /></span><strong className="truncate text-xs">{asset.name}</strong><span className="truncate text-[0.625rem] text-muted-foreground">{asset.kind} · {Math.ceil(asset.byteSize / 1024)} KB</span></button>
}

export function MediaLibraryManager() {
  const structure = useEditorProjectStructure(); const session = useEditorProject(); const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(''); const [selectedId, setSelectedId] = useState<string | null>(null); const [pending, setPending] = useState(false); const [message, setMessage] = useState(''); const [kind, setKind] = useState<MediaKind | 'all'>('all'); const [favoritesOnly, setFavoritesOnly] = useState(false); const [deleteArmed, setDeleteArmed] = useState(false); const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); const [selectedTagIds, setSelectedTagIds] = useState<readonly string[]>([]); const [selectedStarred, setSelectedStarred] = useState(false); const [thumbnail, setThumbnail] = useState<Readonly<{ readonly assetId: string; readonly dataUrl: string }> | null>(null)
  const assets = useMemo(() => Object.values(structure.media?.assets ?? {}).filter((asset) => (kind === 'all' || asset.kind === kind) && (!favoritesOnly || asset.starred) && `${asset.name} ${asset.fileName} ${asset.kind}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)), [favoritesOnly, kind, query, structure.media])
  const selected = selectedId ? structure.media?.assets[selectedId as keyof NonNullable<typeof structure.media>['assets']] : null
  const folders = useMemo(() => Object.values(structure.media?.folders ?? {}).sort((left, right) => left.name.localeCompare(right.name, 'es')), [structure.media?.folders])
  const tags = useMemo(() => Object.values(structure.media?.tags ?? {}).sort((left, right) => left.name.localeCompare(right.name, 'es')), [structure.media?.tags])
  const selectedThumbnail = thumbnail && thumbnail.assetId === selected?.id ? thumbnail.dataUrl : null

  useEffect(() => {
    let active = true
    if (!selected?.variants.thumbnail || !session.readMediaAssetData) return () => { active = false }
    void session.readMediaAssetData(selected.id, 'thumbnail').then((result) => {
      if (active && result.ok && result.value) setThumbnail({ assetId: selected.id, dataUrl: result.value })
    })
    return () => { active = false }
  }, [selected?.id, selected?.variants.thumbnail, session])

  async function importFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = [...(event.target.files ?? [])]; event.target.value = ''
    if (!files.length || !session.importMediaAsset) return
    setPending(true); setMessage('')
    let libraryBytes = Object.values(structure.media?.assets ?? {}).reduce((total, asset) => total + asset.byteSize + Object.values(asset.variants).reduce((variantBytes, variant) => variantBytes + variant.byteSize, 0), 0)
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer()
        const inspection = inspectMediaImport({ bytes: new Uint8Array(bytes), declaredMimeType: file.type, fileName: file.name, libraryBytes })
        if (!inspection.ok) { setMessage(inspection.error); continue }
        const [dataUrl, hash, size, generatedThumbnail] = await Promise.all([readDataUrl(file), contentHash(bytes), dimensions(file, inspection.value.mimeType), imageThumbnail(file, inspection.value.mimeType)])
        const thumbnailByteSize = generatedThumbnail ? Math.ceil((generatedThumbnail.dataUrl.length - generatedThumbnail.dataUrl.indexOf(',') - 1) * 0.75) : 0
        const asset: MediaAssetInput = { altText: '', byteSize: file.size, contentHash: hash, description: '', fileName: file.name, folderId: null, height: size.height, id: parseMediaAssetId(crypto.randomUUID()), kind: inspection.value.kind, mimeType: inspection.value.mimeType, name: file.name.replace(/\.[^.]+$/, '') || file.name, starred: false, tagIds: [], variants: generatedThumbnail ? { thumbnail: { byteSize: thumbnailByteSize, height: generatedThumbnail.height, mimeType: 'image/png', width: generatedThumbnail.width } } : {}, width: size.width }
        const result = await session.importMediaAsset(asset, dataUrl, generatedThumbnail ? { thumbnail: generatedThumbnail.dataUrl } : {})
        if (!result.ok) setMessage(result.error)
        else libraryBytes += asset.byteSize + thumbnailByteSize
      } catch { setMessage(`No se pudo importar ${file.name}.`) }
    }
    setPending(false)
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); if (!selected || !session.updateMediaAsset) return
    const form = new FormData(event.currentTarget); setPending(true); setMessage('')
    const altText = form.get('altText'); const description = form.get('description')
    const result = await session.updateMediaAsset(selected.id, { altText: typeof altText === 'string' ? altText : '', description: typeof description === 'string' ? description : '', folderId: selectedFolderId as MediaAssetInput['folderId'], starred: selectedStarred, tagIds: selectedTagIds as MediaAssetInput['tagIds'] })
    setPending(false); setMessage(result.ok ? 'Metadatos guardados.' : result.error)
  }

  async function removeSelected(): Promise<void> {
    if (!selected || !session.deleteMediaAsset) return
    if (!deleteArmed) { setDeleteArmed(true); return }
    setPending(true); const result = await session.deleteMediaAsset(selected.id); setPending(false)
    if (result.ok) { setSelectedId(null); setDeleteArmed(false); setMessage('Recurso eliminado.') } else setMessage(result.error)
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>, type: 'folder' | 'tag'): Promise<void> {
    event.preventDefault(); const form = event.currentTarget; const value = new FormData(form).get(type)
    const name = typeof value === 'string' ? value.trim() : ''
    if (!name) return
    const action = type === 'folder' ? session.createMediaFolder?.(name) : session.createMediaTag?.(name)
    if (!action) return
    setPending(true); const result = await action; setPending(false)
    if (result.ok) { form.reset(); setMessage(type === 'folder' ? 'Carpeta creada.' : 'Etiqueta creada.') } else setMessage(result.error)
  }

  function toggleTag(tagId: string): void { setSelectedTagIds((ids) => ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId]) }

  return <section className="grid gap-3 p-2 lg:p-3" aria-labelledby="media-library-title"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-1"><h2 className="text-sm font-bold text-foreground" id="media-library-title">Biblioteca multimedia</h2><HelpTip description="Guarda recursos dentro del proyecto para reutilizarlos sin depender de enlaces externos temporales." example="Importa un logotipo una sola vez y úsalo en varias páginas." label="Biblioteca multimedia" reference="WordPress Media Library · Elementor Media Manager" /></div><p className="mt-0.5 text-xs text-muted-foreground">{assets.length} recursos disponibles localmente.</p></div><input accept="image/*,video/*,audio/*,.pdf,.svg,.woff,.woff2,.ttf,.otf" className="sr-only" multiple onChange={(event) => void importFiles(event)} ref={input} type="file" /><Button disabled={!session.importMediaAsset} isLoading={pending} loadingLabel="Importando" onClick={() => input.current?.click()} size="small"><Icon name="upload" size={13} />Importar archivos</Button></div><div className="grid gap-2 rounded-lg border border-border bg-muted/10 p-2 lg:grid-cols-2"><form className="flex gap-1" onSubmit={(event) => void createOrganization(event, 'folder')}><label className="sr-only" htmlFor="media-folder">Nueva carpeta</label><input className="min-h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-xs" id="media-folder" name="folder" placeholder="Nueva carpeta" /><Button disabled={!session.createMediaFolder || pending} size="small" type="submit">Crear carpeta</Button></form><form className="flex gap-1" onSubmit={(event) => void createOrganization(event, 'tag')}><label className="sr-only" htmlFor="media-tag">Nueva etiqueta</label><input className="min-h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-xs" id="media-tag" name="tag" placeholder="Nueva etiqueta" /><Button disabled={!session.createMediaTag || pending} size="small" type="submit">Crear etiqueta</Button></form></div><label className="grid gap-1 text-xs font-semibold text-foreground"><span>Buscar recursos</span><input className="min-h-11 rounded-md border border-border bg-surface px-2 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-focus lg:min-h-9 lg:text-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, archivo o tipo" value={query} /></label><div aria-label="Filtros de recursos" className="flex flex-wrap gap-1">{(['all', 'image', 'video', 'audio', 'document', 'font', 'icon'] as const).map((item) => <Button key={item} onClick={() => setKind(item)} size="small" variant={kind === item ? 'primary' : 'secondary'}>{item === 'all' ? 'Todos' : item}</Button>)}<Button onClick={() => setFavoritesOnly((value) => !value)} size="small" variant={favoritesOnly ? 'primary' : 'secondary'}>Favoritos</Button></div>{message ? <p aria-live="polite" className="rounded-md border border-border bg-muted/20 p-2 text-xs text-muted-foreground">{message}</p> : null}<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_16rem]"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{assets.length ? assets.map((asset) => <MediaCard asset={asset} key={asset.id} onSelect={() => { setSelectedId(asset.id); setSelectedFolderId(asset.folderId); setSelectedTagIds(asset.tagIds); setSelectedStarred(asset.starred); setDeleteArmed(false) }} selected={asset.id === selectedId} />) : <p className="col-span-full rounded-md border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground">No hay recursos que coincidan con estos filtros.</p>}</div>{selected ? <form className="grid content-start gap-2 rounded-lg border border-border bg-surface p-3" onSubmit={(event) => void saveMetadata(event)}><strong className="text-xs text-foreground">{selected.name}</strong><span className="text-[0.625rem] text-muted-foreground">{selected.fileName} · {selected.width && selected.height ? `${selected.width} × ${selected.height}` : selected.mimeType}</span>{selected.variants.thumbnail ? <figure className="grid gap-1 rounded-md border border-border bg-muted/10 p-2"><span className="text-[0.625rem] font-semibold text-muted-foreground">Vista previa local</span>{selectedThumbnail ? <img alt={`Miniatura de ${selected.name}`} className="max-h-32 w-full rounded object-contain" src={selectedThumbnail} /> : <span className="grid min-h-20 place-items-center rounded bg-muted text-[0.625rem] text-muted-foreground">Cargando miniatura…</span>}<figcaption className="text-[0.5625rem] text-muted-foreground">{selected.variants.thumbnail.width} × {selected.variants.thumbnail.height} · PNG</figcaption></figure> : null}<label className="grid gap-1 text-xs font-semibold">Texto alternativo<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-base font-normal lg:min-h-9 lg:text-xs" defaultValue={selected.altText} name="altText" /></label><label className="grid gap-1 text-xs font-semibold">Descripción<textarea className="min-h-20 rounded-md border border-border bg-surface p-2 text-sm font-normal lg:text-xs" defaultValue={selected.description} name="description" /></label><fieldset className="grid gap-1"><legend className="text-xs font-semibold">Carpeta</legend><div className="flex flex-wrap gap-1"><Button onClick={() => setSelectedFolderId(null)} size="small" type="button" variant={selectedFolderId === null ? 'primary' : 'secondary'}>Sin carpeta</Button>{folders.map((folder) => <Button key={folder.id} onClick={() => setSelectedFolderId(folder.id)} size="small" type="button" variant={selectedFolderId === folder.id ? 'primary' : 'secondary'}>{folder.name}</Button>)}</div></fieldset><fieldset className="grid gap-1"><legend className="text-xs font-semibold">Etiquetas</legend><div className="flex flex-wrap gap-1">{tags.length ? tags.map((tag) => <Button key={tag.id} onClick={() => toggleTag(tag.id)} size="small" type="button" variant={selectedTagIds.includes(tag.id) ? 'primary' : 'secondary'}>{tag.name}</Button>) : <span className="text-xs text-muted-foreground">Crea una etiqueta para clasificar este recurso.</span>}</div></fieldset><Button aria-pressed={selectedStarred} onClick={() => setSelectedStarred((value) => !value)} size="small" type="button" variant={selectedStarred ? 'primary' : 'secondary'}>{selectedStarred ? '★ Favorito' : '☆ Marcar favorito'}</Button><Button isLoading={pending} loadingLabel="Guardando" size="small" type="submit">Guardar metadatos</Button><Button disabled={!session.deleteMediaAsset} onClick={() => void removeSelected()} size="small" type="button" variant="destructive">{deleteArmed ? 'Confirmar eliminación' : 'Eliminar recurso'}</Button></form> : null}</div></section>
}
