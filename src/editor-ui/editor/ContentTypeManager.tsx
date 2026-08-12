import { useMemo, useState } from 'react'
import {
  parseContentTypeId,
  type ContentType,
  type DocumentId,
} from '../../domain'
import { listContentTypes } from '../../domain/project/content-type-engine'
import { Button, HelpTip, Icon } from '../primitives'
import { useContentTypeSession, useEditorProjectStructure } from './editor-project-context'
import { DATA_HELP } from './feature-help'

const SUPPORT_OPTIONS = [
  ['title', 'Título'],
  ['editor', 'Editor de contenido'],
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
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const help = DATA_HELP['content-types']

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
    setAdvancedOpen(false)
    setMessage('Nuevo tipo de contenido. Escribe el nombre y guarda; las opciones avanzadas ya tienen valores recomendados.')
  }

  function selectContentType(contentType: ContentType): void {
    setSelectedId(contentType.id)
    setDraft(draftFromContentType(contentType))
    setDeleteArmedId(null)
    setAdvancedOpen(false)
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
      setMessage('El orden debe ser un número entero mayor o igual a 0.')
      return
    }
    if (!draft.slug.trim() || !draft.singularName.trim() || !draft.pluralName.trim()) {
      setMessage('Nombre singular, nombre plural y URL amigable son obligatorios.')
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
        setMessage(`${contentType.pluralName} creado. Ahora puedes añadir campos o entradas.`)
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
      setMessage('Pulsa Confirmar eliminación. ElectroCMS impedirá borrar este tipo si todavía lo usan campos, entradas, relaciones u otras partes del proyecto.')
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
            <div className="flex items-center gap-1">
              <h2 className="text-xs font-bold" id="content-types-title">Tipos de contenido</h2>
              <HelpTip description={help.description} example={help.example} label={help.label} reference={help.reference} />
            </div>
            <p className="text-[0.625rem] leading-4 text-muted-foreground">Crea contenido propio como Productos, Propiedades, Servicios o Equipo.</p>
          </div>
        </div>
        <Button disabled={pending} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nuevo</Button>
      </div>

      <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
        <div className="flex items-center justify-between gap-2 px-1 py-0.5">
          <strong className="text-xs">Tus tipos de contenido</strong>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{contentTypes.length}</span>
        </div>
        {contentTypes.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">Todavía no has creado ningún tipo de contenido.</div>
        ) : (
          <div aria-label="Tipos de contenido creados" className="grid gap-1" role="listbox">
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
                  <span className="block truncate text-[0.625rem] text-muted-foreground">/{contentType.slug} · {contentType.public ? 'visible en el sitio' : 'uso interno'}</span>
                </span>
                <span className="text-[0.625rem] font-bold text-muted-foreground">Editar</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void save() }}>
        <div>
          <strong className="block text-xs">{selected ? `Editar ${selected.singularName}` : 'Crear tipo de contenido'}</strong>
          <span className="text-[0.625rem] text-muted-foreground">Empieza por lo esencial. ElectroCMS configura valores seguros para el resto.</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Nombre singular<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => patchDraft({ singularName: event.target.value })} placeholder="Propiedad" value={draft.singularName} /></label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Nombre plural<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => patchDraft({ pluralName: event.target.value })} placeholder="Propiedades" value={draft.pluralName} /></label>
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label className="text-xs font-semibold" htmlFor="content-type-slug">URL amigable</label>
            <HelpTip description="Identificador corto usado en URLs y conexiones internas. Conviene usar minúsculas, sin espacios y no cambiarlo después de publicar." example="propiedades" label="URL amigable" reference="WordPress — Post Type Slug" />
          </div>
          <input autoCapitalize="none" className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" id="content-type-slug" maxLength={120} onChange={(event) => patchDraft({ slug: event.target.value.toLocaleLowerCase('en-US').replace(/\s+/g, '-') })} placeholder="propiedades" spellCheck={false} value={draft.slug} />
        </div>

        <label className="grid gap-1 text-xs font-semibold">Descripción opcional<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchDraft({ description: event.target.value })} placeholder="Qué información guardará este contenido" value={draft.description} /></label>

        <div className="rounded-md border border-border bg-muted/15">
          <button
            aria-expanded={advancedOpen}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs font-bold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9"
            onClick={() => setAdvancedOpen((current) => !current)}
            type="button"
          >
            <span><span className="block">Opciones avanzadas</span><span className="block text-[0.625rem] font-normal text-muted-foreground">No necesitas cambiarlas para la mayoría de sitios.</span></span>
            <Icon name="chevron-down" size={14} />
          </button>

          {advancedOpen ? (
            <div className="grid gap-2 border-t border-border p-2">
              <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-1.5">
                <label className="grid min-w-0 gap-1 text-xs font-semibold">Icono del menú<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" maxLength={160} onChange={(event) => patchDraft({ icon: event.target.value })} placeholder="content" value={draft.icon} /></label>
                <label className="grid gap-1 text-xs font-semibold">Orden<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" min={0} onChange={(event) => patchDraft({ order: event.target.value })} type="number" value={draft.order} /></label>
              </div>

              <div className="grid gap-1">
                <div className="flex items-center gap-1"><span className="text-xs font-semibold">Permisos</span><HelpTip description="Define las capacidades internas usadas por roles y permisos. Los valores predeterminados permiten leer, crear, editar y eliminar este contenido." label="Permisos del contenido" reference="WordPress — Roles & Capabilities · JetEngine" /></div>
                <input className="min-h-11 rounded-md border border-border bg-surface px-2 font-mono text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patchDraft({ capabilities: event.target.value })} value={draft.capabilities} />
              </div>

              <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Características del tipo de contenido">
                <legend className="col-span-2 mb-1 flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">Características <HelpTip description="Elige las herramientas editoriales disponibles en cada entrada de este contenido." label="Características disponibles" reference="WordPress — Post Type Supports" /></legend>
                {SUPPORT_OPTIONS.map(([support, label]) => (
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9" key={support}>
                    <input checked={draft.supports.includes(support)} className="size-4 accent-current" onChange={() => toggleSupport(support)} type="checkbox" />
                    <span className="truncate">{label}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="grid grid-cols-2 gap-1 border-0 p-0" aria-label="Visibilidad del tipo de contenido">
                <legend className="col-span-2 mb-1 flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">Visibilidad <HelpTip description="Controla si este contenido puede mostrarse públicamente y si aparece entre las herramientas de administración." label="Visibilidad" reference="WordPress — public / show_in_menu" /></legend>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9"><input checked={draft.public} className="size-4 accent-current" onChange={(event) => patchDraft({ public: event.target.checked })} type="checkbox" />Visible en el sitio</label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9"><input checked={draft.showInMenu} className="size-4 accent-current" onChange={(event) => patchDraft({ showInMenu: event.target.checked })} type="checkbox" />Mostrar al administrar</label>
              </fieldset>

              <div className="grid gap-1.5">
                <div className="flex items-center gap-1"><span className="text-xs font-semibold">Plantillas automáticas</span><HelpTip description="Asigna el diseño que ElectroCMS utilizará para cada entrada individual y para la lista general de este contenido." label="Plantillas automáticas" reference="Elementor — Theme Builder: Single / Archive · JetThemeCore" /></div>
                <label className="grid gap-1 text-xs">Página individual<select className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patchDraft({ singleTemplateId: event.target.value })} value={draft.singleTemplateId}><option value="">Usar diseño general</option>{singleTemplates.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>
                <label className="grid gap-1 text-xs">Listado general<select className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patchDraft({ archiveTemplateId: event.target.value })} value={draft.archiveTemplateId}><option value="">Usar diseño general</option>{archiveTemplates.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>
              </div>

              {selected ? <p className="rounded bg-muted px-1.5 py-1 font-mono text-[0.5625rem] text-muted-foreground">ID interno: {selected.id}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-1 border-t border-border pt-2">
          {selected ? <Button disabled={pending} onClick={() => void removeSelected()} size="small" type="button" variant="secondary">{deleteArmedId === selected.id ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}
          <Button disabled={pending || !draft.slug.trim() || !draft.singularName.trim() || !draft.pluralName.trim()} size="small" type="submit"><Icon name="check" size={12} />{selected ? 'Guardar cambios' : 'Crear'}</Button>
        </div>
      </form>

      {message ? <p aria-live="polite" className="rounded-md border border-border bg-muted/25 p-2 text-xs text-muted-foreground">{message}</p> : null}
      <p className="text-[0.625rem] leading-4 text-muted-foreground">Después de crear el tipo, usa las pestañas Campos, Clasificaciones y Entradas para añadir la información que necesitas.</p>
    </section>
  )
}
