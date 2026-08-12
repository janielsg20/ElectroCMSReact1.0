import { useMemo, useState } from 'react'
import {
  parseContentTypeId,
  type ContentType,
  type DocumentId,
} from '../../domain'
import { listContentTypes } from '../../domain/project/content-type-engine'
import { Button, Icon } from '../primitives'
import { useContentTypeSession, useEditorProjectStructure } from './editor-project-context'

const SUPPORT_OPTIONS = [
  ['title', 'Título'],
  ['editor', 'Editor'],
  ['author', 'Autor'],
  ['thumbnail', 'Imagen destacada'],
  ['excerpt', 'Extracto'],
  ['revisions', 'Revisiones'],
  ['custom-fields', 'Campos personalizados'],
] as const satisfies readonly (readonly [ContentType['supports'][number], string])[]

interface ContentTypeDraft {
  readonly archiveTemplateId: string
  readonly capabilities: string
  readonly description: string
  readonly icon: string
  readonly order: string
  readonly pluralName: string
  readonly public: boolean
  readonly showInMenu: boolean
  readonly singleTemplateId: string
  readonly singularName: string
  readonly slug: string
  readonly supports: readonly ContentType['supports'][number][]
}

const EMPTY_DRAFT: ContentTypeDraft = {
  archiveTemplateId: '',
  capabilities: 'content.read, content.create, content.edit, content.delete',
  description: '',
  icon: 'content',
  order: '10',
  pluralName: '',
  public: true,
  showInMenu: true,
  singleTemplateId: '',
  singularName: '',
  slug: '',
  supports: ['title', 'editor'],
}

function draftFromContentType(contentType: ContentType): ContentTypeDraft {
  return {
    archiveTemplateId: contentType.archiveTemplateId ?? '',
    capabilities: contentType.capabilities.join(', '),
    description: contentType.description,
    icon: contentType.icon,
    order: String(contentType.order),
    pluralName: contentType.pluralName,
    public: contentType.public,
    showInMenu: contentType.showInMenu,
    singleTemplateId: contentType.singleTemplateId ?? '',
    singularName: contentType.singularName,
    slug: contentType.slug,
    supports: [...contentType.supports],
  }
}

function parseCapabilities(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

function templateOptions(
  documents: ReturnType<typeof useEditorProjectStructure>['documents'],
  kind: 'single' | 'archive',
): readonly { readonly id: DocumentId; readonly name: string; readonly kind: string }[] {
  return Object.values(documents)
    .filter((document) => document.kind === kind || document.kind === 'template')
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
    .map((document) => ({ id: document.id, kind: document.kind, name: document.name }))
}

export function ContentTypeManager() {
  const session = useContentTypeSession()
  const structure = useEditorProjectStructure()
  const contentTypes = useMemo(() => listContentTypes(structure), [structure])
  const singleTemplates = useMemo(() => templateOptions(structure.documents, 'single'), [structure.documents])
  const archiveTemplates = useMemo(() => templateOptions(structure.documents, 'archive'), [structure.documents])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ContentTypeDraft>(EMPTY_DRAFT)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)

  const selected = selectedId
    ? contentTypes.find((contentType) => contentType.id === selectedId) ?? null
    : null

  function patchDraft(patch: Partial<ContentTypeDraft>): void {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function beginNew(): void {
    setSelectedId(null)
    setDraft(EMPTY_DRAFT)
    setDeleteArmedId(null)
    setMessage('Nuevo tipo de contenido. Completa los campos y guarda cuando esté listo.')
  }

  function selectContentType(contentType: ContentType): void {
    setSelectedId(contentType.id)
    setDraft(draftFromContentType(contentType))
    setDeleteArmedId(null)
    setMessage('')
  }

  function toggleSupport(support: ContentType['supports'][number]): void {
    patchDraft({
      supports: draft.supports.includes(support)
        ? draft.supports.filter((item) => item !== support)
        : [...draft.supports, support],
    })
  }

  async function save(): Promise<void> {
    if (pending) return
    const order = Number.parseInt(draft.order, 10)
    if (!Number.isInteger(order) || order < 0) {
      setMessage('El orden debe ser un entero mayor o igual a 0.')
      return
    }
    if (!draft.slug.trim() || !draft.singularName.trim() || !draft.pluralName.trim()) {
      setMessage('Slug, nombre singular y nombre plural son obligatorios.')
      return
    }

    setPending(true)
    if (selected) {
      const updated = await session.updateContentType(selected.id, {
        archiveTemplateId: draft.archiveTemplateId ? draft.archiveTemplateId as DocumentId : null,
        capabilities: parseCapabilities(draft.capabilities),
        description: draft.description,
        icon: draft.icon,
        order,
        pluralName: draft.pluralName,
        public: draft.public,
        showInMenu: draft.showInMenu,
        singleTemplateId: draft.singleTemplateId ? draft.singleTemplateId as DocumentId : null,
        singularName: draft.singularName,
        slug: draft.slug,
        supports: [...draft.supports],
      })
      setMessage(updated.ok ? `${draft.pluralName} actualizado.` : updated.error)
    } else {
      const id = parseContentTypeId(crypto.randomUUID())
      const contentType: ContentType = {
        archiveTemplateId: draft.archiveTemplateId ? draft.archiveTemplateId as DocumentId : null,
        capabilities: parseCapabilities(draft.capabilities),
        description: draft.description,
        fieldIds: [],
        icon: draft.icon,
        id,
        order,
        pluralName: draft.pluralName,
        public: draft.public,
        showInMenu: draft.showInMenu,
        singleTemplateId: draft.singleTemplateId ? draft.singleTemplateId as DocumentId : null,
        singularName: draft.singularName,
        slug: draft.slug,
        supports: [...draft.supports],
        taxonomyIds: [],
      }
      const created = await session.createContentType(contentType)
      if (created.ok) {
        setSelectedId(id)
        setMessage(`${contentType.pluralName} creado y guardado en el proyecto.`)
      } else {
        setMessage(created.error)
      }
    }
    setPending(false)
  }

  async function removeSelected(): Promise<void> {
    if (!selected || pending) return
    if (deleteArmedId !== selected.id) {
      setDeleteArmedId(selected.id)
      setMessage('Pulsa Confirmar eliminación. El motor bloqueará el borrado si existen campos, registros, relaciones u otras dependencias.')
      return
    }
    setPending(true)
    const removed = await session.deleteContentType(selected.id)
    if (removed.ok) {
      setSelectedId(null)
      setDraft(EMPTY_DRAFT)
      setDeleteArmedId(null)
      setMessage(`${selected.pluralName} eliminado.`)
    } else {
      setMessage(removed.error)
    }
    setPending(false)
  }

  return (
    <section aria-labelledby="content-types-title" className="grid gap-2 p-2 lg:p-1.5">
      <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="database" size={15} /></span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold" id="content-types-title">Tipos de contenido</h2>
            <p className="text-[0.625rem] leading-4 text-muted-foreground">CPT canónicos del proyecto: estructura, visibilidad, capacidades y plantillas.</p>
          </div>
        </div>
        <Button disabled={pending} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nuevo</Button>
      </div>

      <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
        <div className="flex items-center justify-between gap-2 px-1 py-0.5">
          <strong className="text-xs">Registrados</strong>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{contentTypes.length}</span>
        </div>
        {contentTypes.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">No hay tipos de contenido todavía.</div>
        ) : (
          <div aria-label="Tipos de contenido registrados" className="grid gap-1" role="listbox">
            {contentTypes.map((contentType) => (
              <button
                aria-selected={selected?.id === contentType.id}
                className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === contentType.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`}
                key={contentType.id}
                onClick={() => selectContentType(contentType)}
                role="option"
                type="button"
              >
                <span className="min-w-0">
                  <strong className="block truncate text-xs">{contentType.pluralName}</strong>
                  <span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{contentType.slug} · {contentType.public ? 'público' : 'privado'}</span>
                </span>
                <span className="text-[0.625rem] font-bold text-muted-foreground">#{contentType.order}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void save() }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <strong className="block text-xs">{selected ? `Editar ${selected.singularName}` : 'Nuevo CPT'}</strong>
            <span className="text-[0.625rem] text-muted-foreground">{selected ? 'El ID y las asociaciones permanecen estables entre ediciones.' : 'Se genera un ID canónico al guardar.'}</span>
          </div>
          {selected ? <span className="max-w-28 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">{selected.id}</span> : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Singular<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => patchDraft({ singularName: event.target.value })} value={draft.singularName} /></label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Plural<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => patchDraft({ pluralName: event.target.value })} value={draft.pluralName} /></label>
        </div>

        <label className="grid gap-1 text-xs font-semibold">Slug<input autoCapitalize="none" className="min-h-11 rounded-md border border-border bg-surface px-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={120} onChange={(event) => patchDraft({ slug: event.target.value.toLocaleLowerCase('en-US') })} placeholder="articles" spellCheck={false} value={draft.slug} /></label>
        <label className="grid gap-1 text-xs font-semibold">Descripción<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchDraft({ description: event.target.value })} value={draft.description} /></label>

        <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-1.5">
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Icono<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => patchDraft({ icon: event.target.value })} placeholder="content" value={draft.icon} /></label>
          <label className="grid gap-1 text-xs font-semibold">Orden<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" min={0} onChange={(event) => patchDraft({ order: event.target.value })} type="number" value={draft.order} /></label>
        </div>

        <label className="grid gap-1 text-xs font-semibold">Capacidades<span className="text-[0.625rem] font-normal text-muted-foreground">Separadas por comas. Ej.: content.read, content.edit</span><input className="min-h-11 rounded-md border border-border bg-surface px-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patchDraft({ capabilities: event.target.value })} value={draft.capabilities} /></label>

        <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Soportes del tipo de contenido">
          <legend className="col-span-2 mb-1 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">Soportes</legend>
          {SUPPORT_OPTIONS.map(([support, label]) => (
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs lg:min-h-9" key={support}>
              <input checked={draft.supports.includes(support)} className="size-4 accent-current" onChange={() => toggleSupport(support)} type="checkbox" />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Visibilidad del tipo de contenido">
          <legend className="col-span-2 mb-1 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">Visibilidad</legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs lg:min-h-9"><input checked={draft.public} className="size-4 accent-current" onChange={(event) => patchDraft({ public: event.target.checked })} type="checkbox" />Público</label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs lg:min-h-9"><input checked={draft.showInMenu} className="size-4 accent-current" onChange={(event) => patchDraft({ showInMenu: event.target.checked })} type="checkbox" />Mostrar en menú</label>
        </fieldset>

        <div className="grid gap-1.5">
          <label className="grid gap-1 text-xs font-semibold">Plantilla single<select className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patchDraft({ singleTemplateId: event.target.value })} value={draft.singleTemplateId}><option value="">Sin plantilla específica</option>{singleTemplates.map((document) => <option key={document.id} value={document.id}>{document.name} · {document.kind}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-semibold">Plantilla archive<select className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patchDraft({ archiveTemplateId: event.target.value })} value={draft.archiveTemplateId}><option value="">Sin plantilla específica</option>{archiveTemplates.map((document) => <option key={document.id} value={document.id}>{document.name} · {document.kind}</option>)}</select></label>
        </div>

        <div className="flex flex-wrap justify-end gap-1 border-t border-border pt-2">
          {selected ? <Button disabled={pending} onClick={() => void removeSelected()} size="small" type="button" variant="secondary">{deleteArmedId === selected.id ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}
          <Button disabled={pending || !draft.slug.trim() || !draft.singularName.trim() || !draft.pluralName.trim()} size="small" type="submit"><Icon name="check" size={12} />{selected ? 'Guardar cambios' : 'Crear tipo'}</Button>
        </div>
      </form>

      {message ? <p aria-live="polite" className="rounded-md border border-border bg-muted/25 p-2 text-xs text-muted-foreground">{message}</p> : null}
      <p className="text-[0.625rem] leading-4 text-muted-foreground">Taxonomías, campos personalizados, registros y relaciones se gestionan en los tabs de Datos. El binding dinámico se incorpora en M09.5.</p>
    </section>
  )
}
