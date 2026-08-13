import { useMemo, useState } from 'react'
import {
  DEFAULT_ROLE_TEMPLATES,
  type BackendScreenId,
  type ContentTypeId,
  type FieldDefinitionId,
  parseRoleId,
  type Role,
} from '../../domain'
import { Button, HelpTip, Icon } from '../primitives'
import { useEditorProjectStructure, useRoleSession } from './editor-project-context'

type ContentTypePermission = Role['contentTypes'][ContentTypeId]
type FieldPermission = Role['fields'][FieldDefinitionId]

const CAPABILITY_OPTIONS = [
  ['content.manage', 'Gestionar contenido', 'Crear y editar las entradas del sitio.'],
  ['content.export', 'Exportar contenido', 'Descargar los datos del proyecto.'],
  ['dashboard.manage', 'Gestionar paneles', 'Configurar los paneles que usa el equipo.'],
  ['themes.manage', 'Gestionar apariencia', 'Cambiar temas y estilos globales.'],
  ['settings.manage', 'Gestionar ajustes', 'Cambiar opciones generales del proyecto.'],
] as const

const CONTENT_ACTIONS: readonly (readonly [keyof ContentTypePermission, string])[] = [
  ['create', 'Crear'], ['read', 'Ver'], ['update', 'Editar'], ['delete', 'Eliminar'], ['publish', 'Publicar'], ['moderate', 'Moderar'],
]

function urlFriendly(value: string): string {
  return value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'nuevo-rol'
}

function emptyRole(templateIndex = 2): Role {
  const template = DEFAULT_ROLE_TEMPLATES[templateIndex] ?? DEFAULT_ROLE_TEMPLATES[0]
  return {
    capabilities: [...template.capabilities], contentTypes: {}, dashboardIds: [], fields: {},
    id: parseRoleId(crypto.randomUUID()), name: template.name, routes: [], slug: template.slug,
  }
}

function hasContentPermission(role: Role, contentTypeId: ContentTypeId, action: keyof ContentTypePermission): boolean {
  const permission = role.contentTypes[contentTypeId]
  return Boolean(permission && permission[action])
}

export function RoleManager() {
  const structure = useEditorProjectStructure()
  const session = useRoleSession()
  const roles = useMemo(() => Object.values(structure.cms?.roles ?? {}).sort((a, b) => a.name.localeCompare(b.name, 'es')), [structure.cms?.roles])
  const contentTypes = useMemo(() => Object.values(structure.cms?.contentTypes ?? {}).sort((a, b) => a.pluralName.localeCompare(b.pluralName, 'es')), [structure.cms?.contentTypes])
  const fields = useMemo(() => Object.values(structure.cms?.fields ?? {}).sort((a, b) => a.label.localeCompare(b.label, 'es')), [structure.cms?.fields])
  const screens = useMemo(() => Object.values(structure.cms?.backendScreens ?? {}).sort((a, b) => a.name.localeCompare(b.name, 'es')), [structure.cms?.backendScreens])
  const [selectedId, setSelectedId] = useState<string | null>(roles[0]?.id ?? null)
  const [draft, setDraft] = useState<Role>(() => emptyRole())
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteArmed, setDeleteArmed] = useState(false)
  const selected = roles.find((role) => role.id === selectedId) ?? null

  function select(role: Role): void { setSelectedId(role.id); setDraft(structuredClone(role)); setDeleteArmed(false); setMessage('') }
  function beginNew(templateIndex = 2): void { setSelectedId(null); setDraft(emptyRole(templateIndex)); setDeleteArmed(false); setMessage('Configura este perfil y guárdalo. Podrás ajustarlo después.') }
  function patch(patchValue: Partial<Role>): void { setDraft((current) => ({ ...current, ...patchValue })) }
  function toggleCapability(capability: string): void {
    patch({ capabilities: draft.capabilities.includes(capability) ? draft.capabilities.filter((item) => item !== capability) : [...draft.capabilities, capability] })
  }
  function patchContent(contentTypeId: ContentTypeId, action: keyof ContentTypePermission, enabled: boolean): void {
    const current = draft.contentTypes[contentTypeId] ?? { create: false, delete: false, moderate: false, publish: false, read: false, update: false }
    patch({ contentTypes: { ...draft.contentTypes, [contentTypeId]: { ...current, [action]: enabled } } })
  }
  function patchField(fieldId: FieldDefinitionId, access: keyof FieldPermission, enabled: boolean): void {
    const current = draft.fields[fieldId] ?? { editable: false, readable: false }
    const next = { ...current, [access]: enabled }
    patch({ fields: { ...draft.fields, [fieldId]: access === 'readable' && !enabled ? { editable: false, readable: false } : next } })
  }
  function toggleScreen(id: BackendScreenId, route: string, enabled: boolean): void {
    patch({ dashboardIds: enabled ? [...new Set([...draft.dashboardIds, id])] : draft.dashboardIds.filter((item) => item !== id), routes: enabled ? [...new Set([...draft.routes, route])] : draft.routes.filter((item) => item !== route) })
  }
  async function save(): Promise<void> {
    if (pending || !draft.name.trim()) return
    setPending(true)
    const editableDraft = {
      capabilities: draft.capabilities, contentTypes: draft.contentTypes, dashboardIds: draft.dashboardIds,
      fields: draft.fields, name: draft.name, routes: draft.routes, slug: draft.slug,
    }
    const result = selected
      ? await session.updateRole(selected.id, { ...editableDraft, name: draft.name.trim() })
      : await session.createRole({ ...draft, name: draft.name.trim(), slug: urlFriendly(draft.name) })
    if (result.ok) { setSelectedId(selected?.id ?? draft.id); setMessage(selected ? 'Rol actualizado.' : 'Rol creado. Ya puedes asignarlo a las personas del proyecto.') } else setMessage(result.error)
    setPending(false)
  }
  async function remove(): Promise<void> {
    if (!selected || pending) return
    if (!deleteArmed) { setDeleteArmed(true); setMessage('Pulsa Confirmar eliminación. No se podrá borrar si el rol todavía está asignado o se usa en un panel, menú o permiso.') ; return }
    setPending(true)
    const result = await session.deleteRole(selected.id)
    if (result.ok) { setSelectedId(null); setDraft(emptyRole()); setDeleteArmed(false); setMessage(`${selected.name} eliminado.`) } else setMessage(result.error)
    setPending(false)
  }

  return <section aria-labelledby="roles-title" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5 lg:p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><div className="flex items-center gap-1"><h3 className="text-sm font-bold text-foreground" id="roles-title">Roles y permisos</h3><HelpTip description="Define qué puede hacer cada grupo de personas en el proyecto. Los permisos se aplican al contenido, a los paneles y a la apariencia." example="Crea un rol Editor para publicar artículos sin permitir cambios de diseño." label="Roles y permisos" reference="WordPress — Roles & Capabilities" /></div><p className="text-xs leading-4 text-muted-foreground">Empieza con un perfil conocido y ajusta solo lo que necesites.</p></div>
      <Button disabled={pending} onClick={() => beginNew()} size="small" variant="secondary"><Icon name="plus" size={12} />Nuevo rol</Button>
    </div>
    <div className="grid gap-2 xl:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="grid content-start gap-1 rounded-md border border-border bg-muted/15 p-1.5"><strong className="px-1 text-xs">Perfiles del proyecto</strong>{roles.length ? roles.map((role) => <button aria-current={selected?.id === role.id ? 'page' : undefined} className={`min-h-11 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === role.id ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface hover:bg-muted'}`} key={role.id} onClick={() => select(role)} type="button"><strong className="block truncate">{role.name}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{role.capabilities.length} permisos generales</span></button>) : <p className="p-2 text-xs leading-4 text-muted-foreground">Aún no hay roles. Crea uno a partir de un perfil inicial.</p>}</div>
      <form className="grid gap-3 rounded-md border border-border bg-muted/10 p-2" onSubmit={(event) => { event.preventDefault(); void save() }}>
        <div className="grid gap-1"><label className="text-xs font-semibold" htmlFor="role-name">Nombre del rol</label><input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" id="role-name" maxLength={160} onChange={(event) => patch({ name: event.target.value })} value={draft.name} /></div>
        {!selected ? <label className="grid gap-1 text-xs font-semibold">Perfil inicial<select className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => beginNew(Number(event.target.value))} value={Math.max(0, DEFAULT_ROLE_TEMPLATES.findIndex((template) => template.name === draft.name))}>{DEFAULT_ROLE_TEMPLATES.map((template, index) => <option key={template.slug} value={index}>{template.name}</option>)}</select></label> : null}
        <fieldset className="grid gap-1 border-0 p-0"><legend className="mb-1 flex items-center gap-1 text-xs font-semibold">Permisos generales<HelpTip description="Estas opciones dan acceso a áreas completas. Mantén apagadas las que no sean necesarias." label="Permisos generales" reference="WordPress — Capabilities" /></legend><div className="grid gap-1 sm:grid-cols-2">{CAPABILITY_OPTIONS.map(([capability, label, description]) => <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9" key={capability}><input checked={draft.capabilities.includes(capability)} className="size-4 accent-current" onChange={() => toggleCapability(capability)} type="checkbox" /><span><strong className="block">{label}</strong><span className="block text-[0.625rem] text-muted-foreground">{description}</span></span></label>)}</div></fieldset>
        <details className="rounded-md border border-border bg-surface"><summary className="min-h-11 cursor-pointer px-2 py-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:py-2">Permisos por contenido</summary><div className="grid gap-2 border-t border-border p-2">{contentTypes.length ? contentTypes.map((contentType) => <fieldset className="grid gap-1 border-0 p-0" key={contentType.id}><legend className="text-xs font-semibold">{contentType.pluralName}</legend><div className="flex flex-wrap gap-1">{CONTENT_ACTIONS.map(([action, label]) => <label className="flex min-h-9 items-center gap-1 rounded border border-border px-2 text-[0.625rem]" key={action}><input checked={hasContentPermission(draft, contentType.id, action)} className="size-3.5" onChange={(event) => patchContent(contentType.id, action, event.target.checked)} type="checkbox" />{label}</label>)}</div></fieldset>) : <p className="text-xs text-muted-foreground">Crea tipos de contenido para definir permisos específicos.</p>}</div></details>
        <details className="rounded-md border border-border bg-surface"><summary className="min-h-11 cursor-pointer px-2 py-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:py-2">Acceso a paneles y campos</summary><div className="grid gap-3 border-t border-border p-2"><div className="grid gap-1"><strong className="text-xs">Paneles</strong>{screens.length ? screens.map((screen) => <label className="flex min-h-11 items-center gap-2 rounded border border-border px-2 text-xs lg:min-h-9" key={screen.id}><input checked={draft.dashboardIds.includes(screen.id)} className="size-4" onChange={(event) => toggleScreen(screen.id, screen.route, event.target.checked)} type="checkbox" />{screen.name}<span className="ml-auto text-[0.625rem] text-muted-foreground">{screen.route}</span></label>) : <p className="text-xs text-muted-foreground">Aún no hay paneles administrativos.</p>}</div><div className="grid gap-1"><strong className="text-xs">Campos</strong>{fields.length ? fields.map((field) => <div className="flex min-h-11 items-center gap-3 rounded border border-border px-2 text-xs lg:min-h-9" key={field.id}><span className="min-w-0 flex-1 truncate">{field.label}</span><label className="flex items-center gap-1 text-[0.625rem]"><input checked={draft.fields[field.id]?.readable ?? false} className="size-3.5" onChange={(event) => patchField(field.id, 'readable', event.target.checked)} type="checkbox" />Ver</label><label className="flex items-center gap-1 text-[0.625rem]"><input checked={draft.fields[field.id]?.editable ?? false} className="size-3.5" disabled={!(draft.fields[field.id]?.readable ?? false)} onChange={(event) => patchField(field.id, 'editable', event.target.checked)} type="checkbox" />Editar</label></div>) : <p className="text-xs text-muted-foreground">Aún no hay campos personalizados.</p>}</div></div></details>
        <div className="flex flex-wrap justify-end gap-1 border-t border-border pt-2">{selected ? <Button disabled={pending} onClick={() => void remove()} size="small" type="button" variant="secondary">{deleteArmed ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}<Button disabled={pending || !draft.name.trim()} isLoading={pending} loadingLabel="Guardando" size="small" type="submit"><Icon name="check" size={12} />{selected ? 'Guardar cambios' : 'Crear rol'}</Button></div>
      </form>
    </div>
    {message ? <p aria-live="polite" className="rounded-md border border-border bg-muted/25 p-2 text-xs text-muted-foreground">{message}</p> : null}
  </section>
}
