import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  parseTaxonomyId,
  parseTaxonomyTermId,
  type ContentTypeId,
  type DocumentId,
  type Taxonomy,
  type TaxonomyTerm,
  type TaxonomyTermId,
} from '../../domain'
import { listTaxonomies, listTaxonomyTerms } from '../../domain/project/taxonomy-engine'
import { Button, HelpTip, Icon } from '../primitives'
import { useEditorProjectStructure, useTaxonomySession } from './editor-project-context'
import { DATA_HELP } from './feature-help'

interface TaxonomyDraft {
  readonly archiveTemplateId: string
  readonly contentTypeIds: readonly ContentTypeId[]
  readonly description: string
  readonly hierarchical: boolean
  readonly pluralName: string
  readonly singularName: string
  readonly slug: string
}

interface TermDraft {
  readonly description: string
  readonly name: string
  readonly parentId: string
  readonly slug: string
}

interface ChoiceOption {
  readonly label: string
  readonly value: string
}

const EMPTY_TAXONOMY: TaxonomyDraft = {
  archiveTemplateId: '',
  contentTypeIds: [],
  description: '',
  hierarchical: true,
  pluralName: '',
  singularName: '',
  slug: '',
}

const EMPTY_TERM: TermDraft = { description: '', name: '', parentId: '', slug: '' }
const inputClass = 'min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9'

function taxonomyDraft(taxonomy: Taxonomy): TaxonomyDraft {
  return {
    archiveTemplateId: taxonomy.archiveTemplateId ?? '',
    contentTypeIds: [...taxonomy.contentTypeIds],
    description: taxonomy.description,
    hierarchical: taxonomy.hierarchical,
    pluralName: taxonomy.pluralName,
    singularName: taxonomy.singularName,
    slug: taxonomy.slug,
  }
}

function termDraft(term: TaxonomyTerm): TermDraft {
  return { description: term.description, name: term.name, parentId: term.parentId ?? '', slug: term.slug }
}

function ChoiceMenu({ label, options, value, onChange }: {
  readonly label: string
  readonly onChange: (value: string) => void
  readonly options: readonly ChoiceOption[]
  readonly value: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') setOpen(false)
    if ((event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') && !open) {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className="relative grid gap-1">
      <span className="text-xs font-semibold">{label}</span>
      <button aria-expanded={open} aria-haspopup="listbox" className={`${inputClass} flex items-center justify-between gap-2 text-left`} onClick={() => setOpen((current) => !current)} onKeyDown={onKeyDown} type="button">
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? 'Seleccionar'}</span>
        <Icon className={open ? 'rotate-180' : ''} name="chevron-down" size={13} />
      </button>
      {open ? (
        <div aria-label={label} className="absolute inset-x-0 top-full z-40 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg" role="listbox">
          {options.map((option) => (
            <button aria-selected={option.value === value} className={`flex min-h-11 w-full items-center justify-between rounded-md px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${option.value === value ? 'bg-primary-soft text-primary-strong' : 'hover:bg-muted'}`} key={option.value || '__default'} onClick={() => { onChange(option.value); setOpen(false) }} role="option" type="button">
              <span className="truncate">{option.label}</span>{option.value === value ? <Icon name="check" size={12} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TaxonomyManager() {
  const session = useTaxonomySession()
  const structure = useEditorProjectStructure()
  const help = DATA_HELP.taxonomies
  const taxonomies = useMemo(() => listTaxonomies(structure), [structure])
  const contentTypes = useMemo(
    () => Object.values(structure.cms?.contentTypes ?? {}).sort((left, right) => left.pluralName.localeCompare(right.pluralName, 'es')),
    [structure.cms?.contentTypes],
  )
  const archiveTemplates = useMemo(
    () => Object.values(structure.documents).filter((document) => document.kind === 'archive' || document.kind === 'template').sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [structure.documents],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<TaxonomyDraft>(EMPTY_TAXONOMY)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [term, setTerm] = useState<TermDraft>(EMPTY_TERM)
  const [termMessage, setTermMessage] = useState('')
  const [termDeleteArmedId, setTermDeleteArmedId] = useState<string | null>(null)
  const [termAdvancedOpen, setTermAdvancedOpen] = useState(false)

  const selected = selectedId ? taxonomies.find((item) => item.id === selectedId) ?? null : null
  const terms = useMemo(() => selected ? listTaxonomyTerms(structure, selected.id) : [], [selected, structure])
  const selectedTerm = selectedTermId ? terms.find((item) => item.id === selectedTermId) ?? null : null

  function patchDraft(patch: Partial<TaxonomyDraft>) { setDraft((current) => ({ ...current, ...patch })) }
  function patchTerm(patch: Partial<TermDraft>) { setTerm((current) => ({ ...current, ...patch })) }

  function beginNew() {
    setSelectedId(null)
    setDraft({ ...EMPTY_TAXONOMY, contentTypeIds: contentTypes[0] ? [contentTypes[0].id] : [] })
    setDeleteArmedId(null)
    setAdvancedOpen(false)
    setSelectedTermId(null)
    setTerm(EMPTY_TERM)
    setMessage('Nueva clasificación. Completa el nombre y elige qué contenido quieres organizar.')
    setTermMessage('')
  }

  function selectTaxonomy(taxonomy: Taxonomy) {
    setSelectedId(taxonomy.id)
    setDraft(taxonomyDraft(taxonomy))
    setDeleteArmedId(null)
    setAdvancedOpen(false)
    setSelectedTermId(null)
    setTerm(EMPTY_TERM)
    setMessage('')
    setTermMessage('')
  }

  function toggleContentType(contentTypeId: ContentTypeId) {
    patchDraft({ contentTypeIds: draft.contentTypeIds.includes(contentTypeId) ? draft.contentTypeIds.filter((id) => id !== contentTypeId) : [...draft.contentTypeIds, contentTypeId] })
  }

  async function saveTaxonomy() {
    if (pending) return
    if (!draft.slug.trim() || !draft.singularName.trim() || !draft.pluralName.trim()) { setMessage('Nombre singular, nombre plural y URL amigable son obligatorios.'); return }
    if (draft.contentTypeIds.length === 0) { setMessage('Elige al menos un tipo de contenido para organizar.'); return }
    setPending(true)
    if (selected) {
      const updated = await session.updateTaxonomy(selected.id, {
        archiveTemplateId: draft.archiveTemplateId ? draft.archiveTemplateId as DocumentId : null,
        contentTypeIds: [...draft.contentTypeIds],
        description: draft.description,
        hierarchical: draft.hierarchical,
        pluralName: draft.pluralName,
        singularName: draft.singularName,
        slug: draft.slug,
      })
      setMessage(updated.ok ? `${draft.pluralName} actualizada.` : updated.error)
    } else {
      const id = parseTaxonomyId(crypto.randomUUID())
      const taxonomy: Taxonomy = {
        archiveTemplateId: draft.archiveTemplateId ? draft.archiveTemplateId as DocumentId : null,
        contentTypeIds: [...draft.contentTypeIds],
        description: draft.description,
        fieldIds: [],
        hierarchical: draft.hierarchical,
        id,
        pluralName: draft.pluralName,
        singularName: draft.singularName,
        slug: draft.slug,
      }
      const created = await session.createTaxonomy(taxonomy)
      if (created.ok) { setSelectedId(id); setMessage(`${taxonomy.pluralName} creada. Ya puedes añadir categorías o etiquetas.`) } else setMessage(created.error)
    }
    setPending(false)
  }

  async function removeTaxonomy() {
    if (!selected || pending) return
    if (deleteArmedId !== selected.id) { setDeleteArmedId(selected.id); setMessage('Pulsa Confirmar eliminación. ElectroCMS protegerá cualquier clasificación que todavía esté en uso.'); return }
    setPending(true)
    const removed = await session.deleteTaxonomy(selected.id)
    if (removed.ok) {
      setSelectedId(null); setDraft(EMPTY_TAXONOMY); setDeleteArmedId(null); setSelectedTermId(null); setTerm(EMPTY_TERM); setMessage(`${selected.pluralName} eliminada.`)
    } else setMessage(removed.error)
    setPending(false)
  }

  function beginTerm() { setSelectedTermId(null); setTerm(EMPTY_TERM); setTermDeleteArmedId(null); setTermAdvancedOpen(false); setTermMessage('Nueva opción de clasificación.') }
  function selectTerm(item: TaxonomyTerm) { setSelectedTermId(item.id); setTerm(termDraft(item)); setTermDeleteArmedId(null); setTermAdvancedOpen(false); setTermMessage('') }

  async function saveTerm() {
    if (!selected || pending) return
    if (!term.name.trim() || !term.slug.trim()) { setTermMessage('Nombre y URL amigable son obligatorios.'); return }
    setPending(true)
    if (selectedTerm) {
      const updated = await session.updateTaxonomyTerm(selectedTerm.id, { description: term.description, name: term.name, parentId: term.parentId ? term.parentId as TaxonomyTermId : null, slug: term.slug })
      setTermMessage(updated.ok ? `${term.name} actualizado.` : updated.error)
    } else {
      const id = parseTaxonomyTermId(crypto.randomUUID())
      const created = await session.createTaxonomyTerm({ description: term.description, id, name: term.name, parentId: term.parentId ? term.parentId as TaxonomyTermId : null, slug: term.slug, taxonomyId: selected.id, values: {} })
      if (created.ok) { setSelectedTermId(id); setTermMessage(`${term.name} creado.`) } else setTermMessage(created.error)
    }
    setPending(false)
  }

  async function removeTerm() {
    if (!selectedTerm || pending) return
    if (termDeleteArmedId !== selectedTerm.id) { setTermDeleteArmedId(selectedTerm.id); setTermMessage('Pulsa Confirmar eliminación. No se borrará si todavía tiene elementos dependientes.'); return }
    setPending(true)
    const removed = await session.deleteTaxonomyTerm(selectedTerm.id)
    if (removed.ok) { setSelectedTermId(null); setTerm(EMPTY_TERM); setTermDeleteArmedId(null); setTermMessage(`${selectedTerm.name} eliminado.`) } else setTermMessage(removed.error)
    setPending(false)
  }

  return (
    <section aria-labelledby="classifications-title" className="grid gap-2 p-2 lg:p-1.5">
      <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="menu" size={15} /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-1"><h2 className="text-xs font-bold" id="classifications-title">Clasificaciones</h2><HelpTip description={help.description} example={help.example} label={help.label} reference={help.reference} /></div>
            <p className="text-[0.625rem] leading-4 text-muted-foreground">Organiza tu contenido como categorías o etiquetas, igual que en WordPress.</p>
          </div>
        </div>
        <Button disabled={pending || contentTypes.length === 0} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nueva</Button>
      </div>

      {contentTypes.length === 0 ? <div className="rounded-md border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">Crea primero un <strong className="text-foreground">Tipo de contenido</strong>. Después podrás organizar sus entradas con categorías o etiquetas.</div> : null}

      <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
        <div className="flex items-center justify-between gap-2 px-1 py-0.5"><strong className="text-xs">Tus clasificaciones</strong><span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{taxonomies.length}</span></div>
        {taxonomies.length === 0 ? <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">Todavía no hay clasificaciones.</div> : (
          <div aria-label="Clasificaciones creadas" className="grid gap-1" role="listbox">
            {taxonomies.map((taxonomy) => (
              <button aria-selected={selected?.id === taxonomy.id} className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === taxonomy.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={taxonomy.id} onClick={() => selectTaxonomy(taxonomy)} role="option" type="button">
                <span className="min-w-0"><strong className="block truncate text-xs">{taxonomy.pluralName}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{taxonomy.hierarchical ? 'Categorías con subcategorías' : 'Etiquetas sin niveles'}</span></span>
                <span className="text-[0.625rem] font-bold text-muted-foreground">{taxonomy.contentTypeIds.length} tipos</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void saveTaxonomy() }}>
        <div><strong className="block text-xs">{selected ? `Editar ${selected.singularName}` : 'Crear clasificación'}</strong><span className="text-[0.625rem] text-muted-foreground">Elige el nombre y qué contenidos quieres organizar.</span></div>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Nombre singular<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ singularName: event.target.value })} placeholder="Categoría" value={draft.singularName} /></label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Nombre plural<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ pluralName: event.target.value })} placeholder="Categorías" value={draft.pluralName} /></label>
        </div>
        <label className="grid gap-1 text-xs font-semibold">Descripción opcional<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchDraft({ description: event.target.value })} value={draft.description} /></label>

        <fieldset className="grid gap-1 rounded-md border border-border p-1.5">
          <legend className="flex items-center gap-1 px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Organizar estos contenidos <HelpTip description="Selecciona los tipos de contenido que usarán esta clasificación." example="Categorías puede organizar Artículos y Productos al mismo tiempo." label="Tipos de contenido asociados" reference="WordPress / JetEngine — Taxonomy Post Types" /></legend>
          {contentTypes.map((contentType) => {
            const checked = draft.contentTypeIds.includes(contentType.id)
            return <button aria-checked={checked} className={`flex min-h-11 items-center gap-2 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${checked ? 'border-primary/40 bg-primary-soft' : 'border-border bg-surface hover:bg-muted'}`} key={contentType.id} onClick={() => toggleContentType(contentType.id)} role="checkbox" type="button"><span aria-hidden="true" className={`grid size-4 place-items-center rounded border ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border'}`}>{checked ? <Icon name="check" size={11} /> : null}</span><span className="truncate font-semibold">{contentType.pluralName}</span></button>
          })}
        </fieldset>

        <div className="rounded-md border border-border bg-muted/15">
          <button aria-expanded={advancedOpen} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs font-bold hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={() => setAdvancedOpen((current) => !current)} type="button"><span><span className="block">Opciones avanzadas</span><span className="block text-[0.625rem] font-normal text-muted-foreground">URL, jerarquía y plantilla de listado.</span></span><Icon className={advancedOpen ? 'rotate-180' : ''} name="chevron-down" size={14} /></button>
          {advancedOpen ? (
            <div className="grid gap-2 border-t border-border p-2">
              <div className="grid gap-1"><div className="flex items-center gap-1"><label className="text-xs font-semibold" htmlFor="taxonomy-friendly-url">URL amigable</label><HelpTip description="Identificador usado en URLs y conexiones internas. Conviene mantenerlo corto, en minúsculas y sin espacios." example="categorias" label="URL amigable" reference="WordPress / JetEngine — Taxonomy Slug" /></div><input autoCapitalize="none" className={`${inputClass} font-mono`} id="taxonomy-friendly-url" maxLength={120} onChange={(event) => patchDraft({ slug: event.target.value.toLocaleLowerCase('en-US').replace(/\s+/g, '-') })} placeholder="categorias" spellCheck={false} value={draft.slug} /></div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface p-2"><span className="min-w-0"><strong className="block text-xs">Permitir subcategorías</strong><span className="text-[0.625rem] text-muted-foreground">Activado = categorías con niveles. Desactivado = etiquetas simples.</span></span><button aria-checked={draft.hierarchical} className={`relative h-6 w-10 shrink-0 rounded-full border ${draft.hierarchical ? 'border-primary bg-primary' : 'border-border bg-muted'}`} onClick={() => patchDraft({ hierarchical: !draft.hierarchical })} role="switch" type="button"><span className={`absolute top-0.5 size-4 rounded-full bg-surface shadow transition-transform ${draft.hierarchical ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div>
              <ChoiceMenu label="Plantilla del listado" onChange={(value) => patchDraft({ archiveTemplateId: value })} options={[{ label: 'Usar diseño general', value: '' }, ...archiveTemplates.map((document) => ({ label: document.name, value: document.id }))]} value={draft.archiveTemplateId} />
              {selected ? <p className="rounded bg-muted px-1.5 py-1 font-mono text-[0.5625rem] text-muted-foreground">ID interno: {selected.id}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-between gap-1"><div>{selected ? <Button disabled={pending} onClick={() => { void removeTaxonomy() }} size="small" variant={deleteArmedId === selected.id ? 'destructive' : 'ghost'}>{deleteArmedId === selected.id ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div><Button disabled={pending || contentTypes.length === 0} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selected ? 'Guardar cambios' : 'Crear clasificación'}</Button></div>
        <p aria-live="polite" className="min-h-4 text-[0.625rem] leading-4 text-muted-foreground">{message}</p>
      </form>

      {selected ? (
        <section aria-labelledby="classification-options-title" className="grid gap-2 rounded-md border border-border bg-surface p-2">
          <div className="flex items-start justify-between gap-2"><div><h3 className="text-xs font-bold" id="classification-options-title">Opciones · {selected.pluralName}</h3><p className="text-[0.625rem] text-muted-foreground">Añade las categorías o etiquetas que luego asignarás a tus entradas.</p></div><Button disabled={pending} onClick={beginTerm} size="small" variant="secondary"><Icon name="plus" size={12} />Opción</Button></div>
          <div className="grid gap-1 rounded-md border border-border bg-muted/10 p-1.5">
            {terms.length === 0 ? <p className="px-2 py-3 text-xs text-muted-foreground">Todavía no hay opciones.</p> : <div aria-label={`Opciones de ${selected.pluralName}`} className="grid gap-1" role="listbox">{terms.map((item) => <button aria-selected={selectedTerm?.id === item.id} className={`min-h-11 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selectedTerm?.id === item.id ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-muted'}`} key={item.id} onClick={() => selectTerm(item)} role="option" type="button"><strong className="block truncate">{item.name}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{item.parentId ? 'Subcategoría' : 'Nivel principal'}</span></button>)}</div>}
          </div>

          <form className="grid gap-2 rounded-md border border-border bg-muted/10 p-2" onSubmit={(event) => { event.preventDefault(); void saveTerm() }}>
            <strong className="text-xs">{selectedTerm ? `Editar ${selectedTerm.name}` : `Añadir ${selected.hierarchical ? 'categoría' : 'etiqueta'}`}</strong>
            <label className="grid gap-1 text-xs font-semibold">Nombre<input className={inputClass} maxLength={160} onChange={(event) => patchTerm({ name: event.target.value })} placeholder={selected.hierarchical ? 'Ej. Tecnología' : 'Ej. Destacado'} value={term.name} /></label>
            {selected.hierarchical ? <ChoiceMenu label="Categoría superior" onChange={(value) => patchTerm({ parentId: value })} options={[{ label: 'Sin categoría superior', value: '' }, ...terms.filter((item) => item.id !== selectedTerm?.id).map((item) => ({ label: item.name, value: item.id }))]} value={term.parentId} /> : null}
            <label className="grid gap-1 text-xs font-semibold">Descripción opcional<textarea className="min-h-16 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => patchTerm({ description: event.target.value })} value={term.description} /></label>
            <div className="rounded-md border border-border bg-surface"><button aria-expanded={termAdvancedOpen} className="flex min-h-11 w-full items-center justify-between px-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onClick={() => setTermAdvancedOpen((current) => !current)} type="button"><span>Opciones avanzadas</span><Icon className={termAdvancedOpen ? 'rotate-180' : ''} name="chevron-down" size={13} /></button>{termAdvancedOpen ? <div className="grid gap-1 border-t border-border p-2"><div className="flex items-center gap-1"><label className="text-xs font-semibold" htmlFor="term-friendly-url">URL amigable</label><HelpTip description="Identificador técnico de esta categoría o etiqueta en URLs y exportaciones." label="URL amigable" reference="WordPress — Term Slug" /></div><input className={`${inputClass} font-mono`} id="term-friendly-url" onChange={(event) => patchTerm({ slug: event.target.value.toLocaleLowerCase('en-US').replace(/\s+/g, '-') })} value={term.slug} />{selectedTerm ? <p className="font-mono text-[0.5625rem] text-muted-foreground">ID interno: {selectedTerm.id}</p> : null}</div> : null}</div>
            <div className="flex flex-wrap justify-between gap-1"><div>{selectedTerm ? <Button disabled={pending} onClick={() => { void removeTerm() }} size="small" variant={termDeleteArmedId === selectedTerm.id ? 'destructive' : 'ghost'}>{termDeleteArmedId === selectedTerm.id ? 'Confirmar eliminación' : 'Eliminar opción'}</Button> : null}</div><Button disabled={pending} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selectedTerm ? 'Guardar opción' : 'Crear opción'}</Button></div>
            <p aria-live="polite" className="min-h-4 text-[0.625rem] text-muted-foreground">{termMessage}</p>
          </form>
        </section>
      ) : null}
    </section>
  )
}
