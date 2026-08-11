import { useMemo, useState } from 'react'
import {
  parseTaxonomyId,
  parseTaxonomyTermId,
  type ContentTypeId,
  type DocumentId,
  type Taxonomy,
  type TaxonomyTerm,
  type TaxonomyTermId,
} from '../../domain'
import {
  listTaxonomies,
  listTaxonomyTerms,
} from '../../domain/project/taxonomy-engine'
import { Button, Icon } from '../primitives'
import { useEditorProjectStructure, useTaxonomySession } from './editor-project-context'

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

const EMPTY_TAXONOMY: TaxonomyDraft = {
  archiveTemplateId: '',
  contentTypeIds: [],
  description: '',
  hierarchical: true,
  pluralName: '',
  singularName: '',
  slug: '',
}

const EMPTY_TERM: TermDraft = {
  description: '',
  name: '',
  parentId: '',
  slug: '',
}

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
  return {
    description: term.description,
    name: term.name,
    parentId: term.parentId ?? '',
    slug: term.slug,
  }
}

export function TaxonomyManager() {
  const session = useTaxonomySession()
  const structure = useEditorProjectStructure()
  const taxonomies = useMemo(() => listTaxonomies(structure), [structure])
  const contentTypes = useMemo(
    () => Object.values(structure.cms?.contentTypes ?? {}).sort((left, right) => left.pluralName.localeCompare(right.pluralName, 'es')),
    [structure.cms?.contentTypes],
  )
  const archiveTemplates = useMemo(
    () => Object.values(structure.documents)
      .filter((document) => document.kind === 'archive' || document.kind === 'template')
      .sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [structure.documents],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<TaxonomyDraft>(EMPTY_TAXONOMY)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)

  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [term, setTerm] = useState<TermDraft>(EMPTY_TERM)
  const [termMessage, setTermMessage] = useState('')
  const [termDeleteArmedId, setTermDeleteArmedId] = useState<string | null>(null)

  const selected = selectedId ? taxonomies.find((item) => item.id === selectedId) ?? null : null
  const terms = useMemo(
    () => selected ? listTaxonomyTerms(structure, selected.id) : [],
    [selected, structure],
  )
  const selectedTerm = selectedTermId ? terms.find((item) => item.id === selectedTermId) ?? null : null

  function patchDraft(patch: Partial<TaxonomyDraft>): void {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function patchTerm(patch: Partial<TermDraft>): void {
    setTerm((current) => ({ ...current, ...patch }))
  }

  function beginNew(): void {
    setSelectedId(null)
    setDraft({ ...EMPTY_TAXONOMY, contentTypeIds: contentTypes[0] ? [contentTypes[0].id] : [] })
    setDeleteArmedId(null)
    setSelectedTermId(null)
    setTerm(EMPTY_TERM)
    setMessage('Nueva taxonomía. Debe asociarse al menos a un tipo de contenido.')
    setTermMessage('')
  }

  function selectTaxonomy(taxonomy: Taxonomy): void {
    setSelectedId(taxonomy.id)
    setDraft(taxonomyDraft(taxonomy))
    setDeleteArmedId(null)
    setSelectedTermId(null)
    setTerm(EMPTY_TERM)
    setMessage('')
    setTermMessage('')
  }

  function toggleContentType(contentTypeId: ContentTypeId): void {
    patchDraft({
      contentTypeIds: draft.contentTypeIds.includes(contentTypeId)
        ? draft.contentTypeIds.filter((id) => id !== contentTypeId)
        : [...draft.contentTypeIds, contentTypeId],
    })
  }

  async function saveTaxonomy(): Promise<void> {
    if (pending) return
    if (!draft.slug.trim() || !draft.singularName.trim() || !draft.pluralName.trim()) {
      setMessage('Slug, singular y plural son obligatorios.')
      return
    }
    if (draft.contentTypeIds.length === 0) {
      setMessage('Selecciona al menos un tipo de contenido asociado.')
      return
    }
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
      if (created.ok) {
        setSelectedId(id)
        setMessage(`${taxonomy.pluralName} creada y guardada en el proyecto.`)
      } else {
        setMessage(created.error)
      }
    }
    setPending(false)
  }

  async function removeTaxonomy(): Promise<void> {
    if (!selected || pending) return
    if (deleteArmedId !== selected.id) {
      setDeleteArmedId(selected.id)
      setMessage('Pulsa Confirmar eliminación. El motor bloqueará taxonomías usadas por términos, campos o consultas.')
      return
    }
    setPending(true)
    const removed = await session.deleteTaxonomy(selected.id)
    if (removed.ok) {
      setSelectedId(null)
      setDraft(EMPTY_TAXONOMY)
      setDeleteArmedId(null)
      setSelectedTermId(null)
      setTerm(EMPTY_TERM)
      setMessage(`${selected.pluralName} eliminada.`)
    } else {
      setMessage(removed.error)
    }
    setPending(false)
  }

  function beginTerm(): void {
    setSelectedTermId(null)
    setTerm(EMPTY_TERM)
    setTermDeleteArmedId(null)
    setTermMessage('Nuevo término.')
  }

  function selectTerm(item: TaxonomyTerm): void {
    setSelectedTermId(item.id)
    setTerm(termDraft(item))
    setTermDeleteArmedId(null)
    setTermMessage('')
  }

  async function saveTerm(): Promise<void> {
    if (!selected || pending) return
    if (!term.name.trim() || !term.slug.trim()) {
      setTermMessage('Nombre y slug del término son obligatorios.')
      return
    }
    setPending(true)
    if (selectedTerm) {
      const updated = await session.updateTaxonomyTerm(selectedTerm.id, {
        description: term.description,
        name: term.name,
        parentId: term.parentId ? term.parentId as TaxonomyTermId : null,
        slug: term.slug,
      })
      setTermMessage(updated.ok ? `${term.name} actualizado.` : updated.error)
    } else {
      const id = parseTaxonomyTermId(crypto.randomUUID())
      const created = await session.createTaxonomyTerm({
        description: term.description,
        id,
        name: term.name,
        parentId: term.parentId ? term.parentId as TaxonomyTermId : null,
        slug: term.slug,
        taxonomyId: selected.id,
        values: {},
      })
      if (created.ok) {
        setSelectedTermId(id)
        setTermMessage(`${term.name} creado.`)
      } else {
        setTermMessage(created.error)
      }
    }
    setPending(false)
  }

  async function removeTerm(): Promise<void> {
    if (!selectedTerm || pending) return
    if (termDeleteArmedId !== selectedTerm.id) {
      setTermDeleteArmedId(selectedTerm.id)
      setTermMessage('Pulsa Confirmar eliminación. Términos con hijos o referencias no se borran.')
      return
    }
    setPending(true)
    const removed = await session.deleteTaxonomyTerm(selectedTerm.id)
    if (removed.ok) {
      setSelectedTermId(null)
      setTerm(EMPTY_TERM)
      setTermDeleteArmedId(null)
      setTermMessage(`${selectedTerm.name} eliminado.`)
    } else {
      setTermMessage(removed.error)
    }
    setPending(false)
  }

  return (
    <section aria-labelledby="taxonomies-title" className="grid gap-2 p-2 lg:p-1.5">
      <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="menu" size={15} /></span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold" id="taxonomies-title">Taxonomías</h2>
            <p className="text-[0.625rem] leading-4 text-muted-foreground">Clasificación jerárquica o plana, asociaciones múltiples, archivo y términos.</p>
          </div>
        </div>
        <Button disabled={pending || contentTypes.length === 0} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nueva</Button>
      </div>

      {contentTypes.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">
          Crea primero un tipo de contenido en <strong className="text-foreground">Tipos</strong>. Una taxonomía debe pertenecer al menos a un CPT real.
        </div>
      ) : null}

      <div className="grid gap-1 rounded-md border border-border bg-surface p-1.5">
        <div className="flex items-center justify-between gap-2 px-1 py-0.5">
          <strong className="text-xs">Registradas</strong>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground">{taxonomies.length}</span>
        </div>
        {taxonomies.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">No hay taxonomías todavía.</div>
        ) : (
          <div aria-label="Taxonomías registradas" className="grid gap-1" role="listbox">
            {taxonomies.map((taxonomy) => (
              <button
                aria-selected={selected?.id === taxonomy.id}
                className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === taxonomy.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`}
                key={taxonomy.id}
                onClick={() => selectTaxonomy(taxonomy)}
                role="option"
                type="button"
              >
                <span className="min-w-0">
                  <strong className="block truncate text-xs">{taxonomy.pluralName}</strong>
                  <span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{taxonomy.slug} · {taxonomy.hierarchical ? 'jerárquica' : 'plana'}</span>
                </span>
                <span className="text-[0.625rem] font-bold text-muted-foreground">{taxonomy.contentTypeIds.length} CPT</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="grid gap-2 rounded-md border border-border bg-surface p-2" onSubmit={(event) => { event.preventDefault(); void saveTaxonomy() }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <strong className="block text-xs">{selected ? `Editar ${selected.singularName}` : 'Nueva taxonomía'}</strong>
            <span className="text-[0.625rem] text-muted-foreground">Las asociaciones CPT se mantienen bidireccionales.</span>
          </div>
          {selected ? <span className="max-w-28 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">{selected.id}</span> : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Singular<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ singularName: event.target.value })} value={draft.singularName} /></label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold">Plural<input className={inputClass} maxLength={160} onChange={(event) => patchDraft({ pluralName: event.target.value })} value={draft.pluralName} /></label>
        </div>
        <label className="grid gap-1 text-xs font-semibold">Slug<input autoCapitalize="none" className={`${inputClass} font-mono`} maxLength={120} onChange={(event) => patchDraft({ slug: event.target.value.toLocaleLowerCase('en-US') })} placeholder="categories" spellCheck={false} value={draft.slug} /></label>
        <label className="grid gap-1 text-xs font-semibold">Descripción<textarea className="min-h-20 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchDraft({ description: event.target.value })} value={draft.description} /></label>

        <label className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-2 text-xs font-semibold lg:min-h-9">
          <span><strong className="block">Jerárquica</strong><span className="font-normal text-muted-foreground">Permite relaciones padre/hijo entre términos.</span></span>
          <input checked={draft.hierarchical} className="size-4 accent-primary" onChange={(event) => patchDraft({ hierarchical: event.target.checked })} type="checkbox" />
        </label>

        <fieldset className="grid gap-1 rounded-md border border-border p-1.5">
          <legend className="px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Tipos asociados</legend>
          {contentTypes.map((contentType) => (
            <label className="flex min-h-11 items-center gap-2 rounded px-1.5 text-xs hover:bg-muted/60 lg:min-h-9" key={contentType.id}>
              <input checked={draft.contentTypeIds.includes(contentType.id)} className="size-4 accent-primary" onChange={() => toggleContentType(contentType.id)} type="checkbox" />
              <span className="min-w-0"><strong className="block truncate">{contentType.pluralName}</strong><span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{contentType.slug}</span></span>
            </label>
          ))}
        </fieldset>

        <label className="grid gap-1 text-xs font-semibold">Plantilla archive
          <select className={inputClass} onChange={(event) => patchDraft({ archiveTemplateId: event.target.value })} value={draft.archiveTemplateId}>
            <option value="">Sin plantilla específica</option>
            {archiveTemplates.map((document) => <option key={document.id} value={document.id}>{document.name} · {document.kind}</option>)}
          </select>
        </label>

        <div className="flex flex-wrap justify-between gap-1">
          <div>{selected ? <Button disabled={pending} onClick={() => { void removeTaxonomy() }} size="small" variant={deleteArmedId === selected.id ? 'destructive' : 'ghost'}>{deleteArmedId === selected.id ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}</div>
          <Button disabled={pending || contentTypes.length === 0} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selected ? 'Guardar cambios' : 'Crear taxonomía'}</Button>
        </div>
        <p aria-live="polite" className="min-h-4 text-[0.625rem] leading-4 text-muted-foreground">{message}</p>
      </form>

      {selected ? (
        <section aria-labelledby="taxonomy-terms-title" className="grid gap-2 rounded-md border border-border bg-surface p-2">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="text-xs font-bold" id="taxonomy-terms-title">Términos · {selected.pluralName}</h3><p className="text-[0.625rem] text-muted-foreground">{selected.hierarchical ? 'Admite padres sin ciclos.' : 'Taxonomía plana: todos los términos son raíz.'}</p></div>
            <Button disabled={pending} onClick={beginTerm} size="small" variant="secondary"><Icon name="plus" size={12} />Término</Button>
          </div>

          {terms.length === 0 ? <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">Sin términos.</p> : (
            <div aria-label={`Términos de ${selected.pluralName}`} className="grid gap-1" role="listbox">
              {terms.map((item) => (
                <button aria-selected={selectedTerm?.id === item.id} className={`min-h-11 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selectedTerm?.id === item.id ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:bg-muted'}`} key={item.id} onClick={() => selectTerm(item)} role="option" type="button">
                  <strong className="block truncate">{item.name}</strong><span className="block truncate font-mono text-[0.625rem] text-muted-foreground">{item.slug}{item.parentId ? ' · hijo' : ' · raíz'}</span>
                </button>
              ))}
            </div>
          )}

          <form className="grid gap-1.5 rounded-md bg-muted/20 p-1.5" onSubmit={(event) => { event.preventDefault(); void saveTerm() }}>
            <strong className="text-xs">{selectedTerm ? `Editar ${selectedTerm.name}` : 'Nuevo término'}</strong>
            <label className="grid gap-1 text-xs font-semibold">Nombre<input className={inputClass} maxLength={160} onChange={(event) => patchTerm({ name: event.target.value })} value={term.name} /></label>
            <label className="grid gap-1 text-xs font-semibold">Slug<input autoCapitalize="none" className={`${inputClass} font-mono`} maxLength={120} onChange={(event) => patchTerm({ slug: event.target.value.toLocaleLowerCase('en-US') })} value={term.slug} /></label>
            <label className="grid gap-1 text-xs font-semibold">Descripción<textarea className="min-h-16 resize-y rounded-md border border-border bg-surface p-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus" maxLength={4000} onChange={(event) => patchTerm({ description: event.target.value })} value={term.description} /></label>
            {selected.hierarchical ? (
              <label className="grid gap-1 text-xs font-semibold">Padre
                <select className={inputClass} onChange={(event) => patchTerm({ parentId: event.target.value })} value={term.parentId}>
                  <option value="">Sin padre</option>
                  {terms.filter((candidate) => candidate.id !== selectedTerm?.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                </select>
              </label>
            ) : null}
            <div className="flex flex-wrap justify-between gap-1">
              <div>{selectedTerm ? <Button disabled={pending} onClick={() => { void removeTerm() }} size="small" variant={termDeleteArmedId === selectedTerm.id ? 'destructive' : 'ghost'}>{termDeleteArmedId === selectedTerm.id ? 'Confirmar eliminación' : 'Eliminar término'}</Button> : null}</div>
              <Button disabled={pending} isLoading={pending} loadingLabel="Guardando" size="small" type="submit">{selectedTerm ? 'Guardar término' : 'Crear término'}</Button>
            </div>
            <p aria-live="polite" className="min-h-4 text-[0.625rem] leading-4 text-muted-foreground">{termMessage}</p>
          </form>
        </section>
      ) : null}

      <p className="rounded-md border border-dashed border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">Campos personalizados de taxonomía se implementan en M09.3; esta pantalla no simula todavía ese editor.</p>
    </section>
  )
}
