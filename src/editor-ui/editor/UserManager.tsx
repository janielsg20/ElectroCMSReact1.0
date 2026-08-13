import { useMemo, useState } from 'react'
import { parseUserId, type User, type UserStatus } from '../../domain'
import { Button, HelpTip, Icon } from '../primitives'
import { useActiveUser } from './active-user-context'
import { useEditorProjectStructure, useUserSession } from './editor-project-context'

const STATUS_OPTIONS: readonly { readonly label: string, readonly value: UserStatus }[] = [
  { label: 'Activa', value: 'active' },
  { label: 'Invitada', value: 'invited' },
  { label: 'Suspendida', value: 'suspended' },
]

function newUser(roleId?: string): User {
  return {
    displayName: '',
    email: '',
    id: parseUserId(crypto.randomUUID()),
    roleIds: roleId ? [roleId as User['roleIds'][number]] : [],
    status: 'active',
  }
}

export function UserManager() {
  const structure = useEditorProjectStructure()
  const session = useUserSession()
  const { activeUserId, setActiveUserId } = useActiveUser()
  const users = useMemo(() => Object.values(structure.cms?.users ?? {}).sort((a, b) => a.displayName.localeCompare(b.displayName, 'es')), [structure.cms?.users])
  const roles = useMemo(() => Object.values(structure.cms?.roles ?? {}).sort((a, b) => a.name.localeCompare(b.name, 'es')), [structure.cms?.roles])
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null)
  const [draft, setDraft] = useState<User>(() => newUser(roles[0]?.id))
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteArmed, setDeleteArmed] = useState(false)
  const selected = users.find((user) => user.id === selectedId) ?? null

  function select(user: User): void { setSelectedId(user.id); setDraft(structuredClone(user)); setDeleteArmed(false); setMessage('') }
  function beginNew(): void { setSelectedId(null); setDraft(newUser(roles[0]?.id)); setDeleteArmed(false); setMessage(roles.length ? 'Completa los datos y asigna al menos un rol.' : 'Crea primero un rol para poder dar acceso a una persona.') }
  function patch(patchValue: Partial<User>): void { setDraft((current) => ({ ...current, ...patchValue })) }
  function toggleRole(roleId: User['roleIds'][number]): void {
    patch({ roleIds: draft.roleIds.includes(roleId) ? draft.roleIds.filter((id) => id !== roleId) : [...draft.roleIds, roleId] })
  }
  async function save(): Promise<void> {
    if (pending || !draft.displayName.trim() || !draft.email.trim() || draft.roleIds.length === 0) return
    setPending(true)
    const patchValue = { displayName: draft.displayName.trim(), email: draft.email.trim(), roleIds: draft.roleIds, status: draft.status }
    const result = selected ? await session.updateUser(selected.id, patchValue) : await session.createUser({ ...draft, ...patchValue })
    if (result.ok) { setSelectedId(selected?.id ?? draft.id); setMessage(selected ? 'Persona actualizada.' : 'Persona creada. Puedes usarla para comprobar sus permisos.') } else setMessage(result.error)
    setPending(false)
  }
  async function remove(): Promise<void> {
    if (!selected || pending) return
    if (!deleteArmed) { setDeleteArmed(true); setMessage('Pulsa Confirmar eliminación. No se podrá borrar si esta persona creó contenido.') ; return }
    setPending(true)
    const result = await session.deleteUser(selected.id)
    if (result.ok) { if (activeUserId === selected.id) setActiveUserId(null); setSelectedId(null); setDraft(newUser(roles[0]?.id)); setDeleteArmed(false); setMessage(`${selected.displayName} eliminada.`) } else setMessage(result.error)
    setPending(false)
  }

  return <section aria-labelledby="people-title" className="grid gap-2 rounded-lg border border-border bg-surface p-2.5 lg:p-3">
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-1"><h3 className="text-sm font-bold text-foreground" id="people-title">Personas y acceso</h3><HelpTip description="Crea las personas que usarán el panel y asigna los roles que definen lo que pueden ver y hacer." example="Asigna el rol Editor a Ana para que pueda publicar artículos, sin cambiar el diseño." label="Personas y acceso" reference="WordPress — Usuarios" /></div><p className="text-xs leading-4 text-muted-foreground">Selecciona una persona para comprobar el panel tal como lo verá ella.</p></div><Button disabled={pending} onClick={beginNew} size="small" variant="secondary"><Icon name="plus" size={12} />Nueva persona</Button></div>
    <div className="grid gap-2 xl:grid-cols-[13rem_minmax(0,1fr)]"><div className="grid content-start gap-1 rounded-md border border-border bg-muted/15 p-1.5"><strong className="px-1 text-xs">Personas del proyecto</strong>{users.length ? users.map((user) => <button aria-current={selected?.id === user.id ? 'page' : undefined} className={`min-h-11 rounded-md border px-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selected?.id === user.id ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface hover:bg-muted'}`} key={user.id} onClick={() => select(user)} type="button"><strong className="block truncate">{user.displayName}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{user.email}</span></button>) : <p className="p-2 text-xs leading-4 text-muted-foreground">Aún no hay personas. Crea una después de definir un rol.</p>}</div>
      <form className="grid gap-3 rounded-md border border-border bg-muted/10 p-2" onSubmit={(event) => { event.preventDefault(); void save() }}><div className="grid gap-2 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold" htmlFor="user-name">Nombre<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" id="user-name" maxLength={160} onChange={(event) => patch({ displayName: event.target.value })} value={draft.displayName} /></label><label className="grid gap-1 text-xs font-semibold" htmlFor="user-email">Correo<input className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" id="user-email" onChange={(event) => patch({ email: event.target.value })} type="email" value={draft.email} /></label></div><label className="grid gap-1 text-xs font-semibold">Estado<select className="min-h-11 rounded-md border border-border bg-surface px-2 text-xs font-normal focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => patch({ status: event.target.value as UserStatus })} value={draft.status}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><fieldset className="grid gap-1 border-0 p-0"><legend className="text-xs font-semibold">Roles asignados</legend>{roles.length ? <div className="grid gap-1 sm:grid-cols-2">{roles.map((role) => <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2 text-xs lg:min-h-9" key={role.id}><input checked={draft.roleIds.includes(role.id)} className="size-4 accent-current" onChange={() => toggleRole(role.id)} type="checkbox" /><span><strong className="block">{role.name}</strong><span className="block text-[0.625rem] text-muted-foreground">{role.capabilities.length} permisos generales</span></span></label>)}</div> : <p className="rounded-md border border-dashed border-border bg-surface p-2 text-xs text-muted-foreground">Antes crea un rol en la sección Roles y permisos.</p>}</fieldset>{selected?.id === activeUserId ? <p className="rounded-md border border-primary/30 bg-primary-soft p-2 text-xs text-primary-strong">Esta es la persona usada ahora para comprobar los permisos.</p> : selected ? <Button disabled={selected.status === 'suspended'} onClick={() => setActiveUserId(selected.id)} size="small" type="button" variant="secondary">Usar para comprobar permisos</Button> : null}<div className="flex flex-wrap justify-end gap-1 border-t border-border pt-2">{selected ? <Button disabled={pending} onClick={() => void remove()} size="small" type="button" variant="secondary">{deleteArmed ? 'Confirmar eliminación' : 'Eliminar'}</Button> : null}<Button disabled={pending || !draft.displayName.trim() || !draft.email.trim() || draft.roleIds.length === 0} isLoading={pending} loadingLabel="Guardando" size="small" type="submit"><Icon name="check" size={12} />{selected ? 'Guardar cambios' : 'Crear persona'}</Button></div></form></div>
    {activeUserId ? <div className="flex justify-end"><Button onClick={() => setActiveUserId(null)} size="small" type="button" variant="ghost">Volver al modo de configuración</Button></div> : null}
    {message ? <p aria-live="polite" className="rounded-md border border-border bg-muted/25 p-2 text-xs text-muted-foreground">{message}</p> : null}
  </section>
}
