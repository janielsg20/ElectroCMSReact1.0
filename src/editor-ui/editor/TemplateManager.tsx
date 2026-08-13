import { useMemo, useState } from 'react'
import { parseDocumentId, type Document, type DocumentId, type TemplateCondition } from '../../domain'
import { Button, Icon } from '../primitives'
import { useAppSection } from './app-section-context'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

const creatableKinds = ['page', 'template', 'header', 'footer', 'single', 'archive', 'not-found'] as const
type CreatableKind = typeof creatableKinds[number]

const kindLabels: Record<CreatableKind, string> = {
  page: 'Página', template: 'Plantilla', header: 'Header', footer: 'Footer', single: 'Single', archive: 'Archive', 'not-found': '404',
}

function defaultConditions(kind: CreatableKind): TemplateCondition[] {
  if (kind === 'page') return []
  return [{ priority: 0, target: kind === 'template' || kind === 'header' || kind === 'footer' ? 'page' : kind }]
}

function suggestedPageRoute(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `/${slug || 'nueva-pagina'}`
}

function parseConditions(value: string): { readonly error?: string; readonly value?: TemplateCondition[] } {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return { error: 'Las condiciones deben ser una lista JSON.' }
    return { value: parsed as TemplateCondition[] }
  } catch {
    return { error: 'Las condiciones deben contener JSON válido.' }
  }
}

export function TemplateManager() {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const { setSection } = useAppSection()
  const documents = useMemo(() => Object.values(structure.documents).sort((left, right) => left.name.localeCompare(right.name)), [structure.documents])
  const [kind, setKind] = useState<CreatableKind>('template')
  const [name, setName] = useState('')
  const [routePath, setRoutePath] = useState('/nueva-pagina')
  const [routeManuallyEdited, setRouteManuallyEdited] = useState(false)
  const [selectedId, setSelectedId] = useState<DocumentId | null>(null)
  const selected = selectedId ? structure.documents[selectedId] : undefined
  const [conditionsText, setConditionsText] = useState('[]')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)

  function selectDocument(document: Document): void {
    setSelectedId(document.id)
    setConditionsText(JSON.stringify(document.conditions, null, 2))
    setStatus('')
  }

  function editSelectedDocument(): void {
    if (!selected || !session.selectDocument) return
    session.selectDocument(selected.id)
    setSection('editor')
  }

  async function create(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed || pending) { setStatus('Escribe un nombre para el documento.'); return }
    if (kind === 'page' && !routePath.trim()) { setStatus('Las páginas requieren una ruta.'); return }
    if (!session.createDocument) { setStatus('El gestor de plantillas no está disponible en esta sesión.'); return }
    const document: Document = {
      conditions: defaultConditions(kind),
      id: parseDocumentId(crypto.randomUUID()),
      kind,
      name: trimmed,
      nodes: {},
      rootNodeIds: [],
      ...(kind === 'page' ? { routePath: routePath.trim() } : {}),
    }
    setPending(true)
    const result = await session.createDocument(document)
    setPending(false)
    setStatus(result.ok ? `${kindLabels[kind]} creada y guardada en el historial.` : result.error)
    if (result.ok) {
      setName('')
      setRoutePath('/nueva-pagina')
      setRouteManuallyEdited(false)
      selectDocument(document)
    }
  }

  async function saveConditions(): Promise<void> {
    if (!selected || selected.kind === 'page' || pending) return
    if (!session.updateDocumentConditions) { setStatus('El gestor de plantillas no está disponible en esta sesión.'); return }
    const parsed = parseConditions(conditionsText)
    if (!parsed.value) { setStatus(parsed.error ?? 'Las condiciones no son válidas.'); return }
    setPending(true)
    const result = await session.updateDocumentConditions(selected.id, parsed.value)
    setPending(false)
    setStatus(result.ok ? 'Condiciones actualizadas con historial reversible.' : result.error)
  }

  return <section aria-labelledby="template-manager-title" className="min-h-0 overflow-y-auto p-2 lg:p-1.5">
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="content" size={15} /></span>
      <div><h2 className="text-xs font-bold" id="template-manager-title">Documentos del proyecto</h2><p className="text-[0.625rem] leading-4 text-muted-foreground">Páginas y plantillas canónicas. Las condiciones deciden header, footer y plantilla sin copiar nodos.</p></div>
    </div>

    <fieldset className="mt-2 grid gap-1.5 border-0 p-0">
      <legend className="px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Crear documento</legend>
      <label className="grid gap-1 text-xs font-semibold">Tipo<select className="min-h-9 rounded-md border border-border bg-surface px-2 text-xs font-normal" onChange={(event) => {
        const nextKind = event.target.value as CreatableKind
        setKind(nextKind)
        if (nextKind === 'page' && !routeManuallyEdited) setRoutePath(suggestedPageRoute(name))
      }} value={kind}>{creatableKinds.map((value) => <option key={value} value={value}>{kindLabels[value]}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-semibold">Nombre<input className="min-h-9 rounded-md border border-border bg-surface px-2 text-xs font-normal" maxLength={160} onChange={(event) => {
        const nextName = event.target.value
        setName(nextName)
        if (kind === 'page' && !routeManuallyEdited) setRoutePath(suggestedPageRoute(nextName))
      }} value={name} /></label>
      {kind === 'page' ? <label className="grid gap-1 text-xs font-semibold">Ruta<input className="min-h-9 rounded-md border border-border bg-surface px-2 text-xs font-normal" onChange={(event) => { setRoutePath(event.target.value); setRouteManuallyEdited(true) }} value={routePath} /></label> : null}
      <Button disabled={pending} onClick={() => void create()} size="small"><Icon name="plus" size={13} />Crear {kindLabels[kind]}</Button>
    </fieldset>

    <div className="mt-2 grid gap-1" role="list" aria-label="Documentos del proyecto">
      {documents.map((document) => <button aria-pressed={selected?.id === document.id} className={`min-h-10 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus ${selected?.id === document.id ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface hover:bg-muted'}`} key={document.id} onClick={() => selectDocument(document)} role="listitem" type="button"><span className="flex items-center justify-between gap-2"><strong className="truncate">{document.name}</strong><span className="shrink-0 text-[0.5625rem] font-bold uppercase tracking-wide">{kindLabels[document.kind]}</span></span><span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground">{document.routePath ?? `${document.conditions.length} condición(es)`}</span></button>)}
    </div>

    {selected ? <div className="mt-2 grid gap-1.5 rounded-md border border-border bg-muted/20 p-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="block text-xs">{selected.name}</strong><span className="block text-[0.625rem] text-muted-foreground">Abre este documento en el mismo editor visual.</span></div><Button disabled={!session.selectDocument} onClick={editSelectedDocument} size="small"><Icon name="editor" size={13} />Editar en el editor</Button></div>{selected.kind !== 'page' ? <><label className="grid gap-1 text-xs font-semibold" htmlFor="template-conditions">Condiciones · JSON tipado<textarea className="min-h-28 resize-y rounded-md border border-border bg-surface p-2 font-mono text-[0.625rem] font-normal leading-4" id="template-conditions" onChange={(event) => setConditionsText(event.target.value)} spellCheck={false} value={conditionsText} /></label><p className="text-[0.625rem] leading-4 text-muted-foreground">Cada regla requiere <code>target</code> y puede usar <code>pathPrefix</code>, <code>contentType</code> y <code>priority</code>. La coincidencia es determinista.</p><Button disabled={pending} onClick={() => void saveConditions()} size="small" variant="secondary">Guardar condiciones</Button></> : null}</div> : null}
    {status ? <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">{status}</p> : null}
  </section>
}
