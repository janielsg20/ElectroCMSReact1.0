import { useMemo, useState } from 'react'
import {
  parseRoleId,
  type ContentTypeId,
  type FieldDefinitionId,
  type Role,
  type RoleId,
} from '../../domain'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import type { ContentPermissionAction } from '../../domain/project/rbac-engine'
import { Button, HelpTip, Icon, TextField } from '../primitives'
import { useEditorProjectStructure } from './editor-project-context'
import { useRoleSession } from './role-session-context'

const contentActions: readonly { readonly action: ContentPermissionAction; readonly label: string }[] = [
  { action: 'read', label: 'Ver' },
  { action: 'create', label: 'Crear' },
  { action: 'update', label: 'Editar' },
  { action: 'delete', label: 'Eliminar' },
  { action: 'publish', label: 'Publicar' },
  { action: 'moderate', label: 'Moderar' },
]

const capabilityOptions = [
  { key: 'cms.access', label: 'Entrar al CMS', description: 'Permite entrar al área administrativa cuando una ruta también está autorizada.' },
  { key: 'users.manage', label: 'Gestionar usuarios', description: 'Reservado para la gestión de cuentas y asignación de roles.' },
  { key: 'settings.manage', label: 'Cambiar ajustes', description: 'Permite administrar configuración sensible del proyecto.' },
  { key: 'media.manage', label: 'Gestionar medios', description: 'Permite operar la biblioteca multimedia cuando esté disponible.' },
  { key: 'audit.read', label: 'Ver auditoría', description: 'Permitirá consultar el registro de actividad de M12.5.' },
] as const

const deniedContentPermission = {
  create: false,
  delete: false,
  moderate: false,
  publish: false,
  read: false,
  update: false,
} as const

function slugFromName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'rol'
}

function ToggleButton({ active, label, onClick }: {
  readonly active: boolean
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-h-11 rounded-md border px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${active ? 'border-primary/35 bg-primary-soft text-primary-strong' : 'border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'}`}
      onClick={onClick}
      type="button"
    >
      {active ? <Icon name="check" size={11} /> : null}<span className={active ? 'ml-1' : ''}>{label}</span>
    </button>
  )
}

function RoleEditor({ role }: { readonly role: Role }) {
  const structure = useEditorProjectStructure()
  const session = useRoleSession()
  const cms = useMemo(() => projectCmsBackend(structure.cms), [structure.cms])
  const contentTypes = useMemo(() => Object.values(cms.contentTypes).sort((left, right) => left.order - right.order || left.pluralName.localeCompare(right.pluralName, 'es')), [cms.contentTypes])
  const screens = useMemo(() => Object.values(cms.backendScreens).sort((left, right) => left.name.localeCompare(right.name, 'es')), [cms.backendScreens])
  const [name, setName] = useState(role.name)
  const [capabilities, setCapabilities] = useState<readonly string[]>(role.capabilities)
  const [contentTypesPermissions, setContentTypesPermissions] = useState(() => structuredClone(role.contentTypes))
  const [fieldPermissions, setFieldPermissions] = useState(() => structuredClone(role.fields))
  const [routes, setRoutes] = useState<readonly string[]>(role.routes)
  const [dashboardIds, setDashboardIds] = useState<readonly Role['dashboardIds'][number][]>(role.dashboardIds)
  const [pending, setPending] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [notice, setNotice] = useState('')

  function toggleCapability(capability: string): void {
    setCapabilities((current) => current.includes(capability)
      ? current.filter((item) => item !== capability)
      : [...current, capability])
  }

  function toggleContentPermission(contentTypeId: ContentTypeId, action: ContentPermissionAction): void {
    setContentTypesPermissions((current) => {
      const permissions = current[contentTypeId] ?? deniedContentPermission
      return {
        ...current,
        [contentTypeId]: { ...permissions, [action]: !permissions[action] },
      }
    })
  }

  function toggleFieldPermission(fieldId: FieldDefinitionId, mode: 'readable' | 'editable'): void {
    setFieldPermissions((current) => {
      const permissions = current[fieldId] ?? { editable: false, readable: false }
      if (mode === 'editable') {
        const editable = !permissions.editable
        return { ...current, [fieldId]: { editable, readable: editable ? true : permissions.readable } }
      }
      const readable = !permissions.readable
      return { ...current, [fieldId]: { editable: readable ? permissions.editable : false, readable } }
    })
  }

  function toggleScreen(screen: (typeof screens)[number]): void {
    const active = routes.includes(screen.route)
    setRoutes((current) => active ? current.filter((route) => route !== screen.route) : [...current, screen.route])
    if (screen.kind === 'dashboard' || screen.kind === 'metrics') {
      setDashboardIds((current) => active
        ? current.filter((id) => id !== screen.id)
        : current.includes(screen.id) ? current : [...current, screen.id])
    }
  }

  async function save(): Promise<void> {
    if (pending || !name.trim()) return
    setPending(true)
    const result = await session.updateRole(role.id, {
      capabilities,
      contentTypes: contentTypesPermissions,
      dashboardIds,
      fields: fieldPermissions,
      name: name.trim(),
      routes,
    })
    setPending(false)
    setDeleteArmed(false)
    setNotice(result.ok ? 'Rol y permisos guardados.' : result.error)
  }

  async function remove(): Promise<void> {
    if (pending) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      setNotice('Pulsa de nuevo para confirmar. Un rol en uso no se puede eliminar.')
      return
    }
    setPending(true)
    const result = await session.deleteRole(role.id)
    setPending(false)
    setDeleteArmed(false)
    setNotice(result.ok ? 'Rol eliminado.' : result.error)
  }

  return (
    <div className="grid gap-3">
      {notice ? <p className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-muted-foreground" role="status">{notice}</p> : null}

      <section className="grid gap-2 rounded-lg border border-border bg-surface p-2.5" aria-labelledby="role-basics-heading">
        <div className="flex items-start justify-between gap-2">
          <div><h4 className="text-xs font-bold text-foreground" id="role-basics-heading">Rol</h4><p className="text-[0.625rem] text-muted-foreground">Los permisos no marcados se consideran denegados.</p></div>
          <span className="rounded-md border border-border bg-muted px-2 py-1 text-[0.625rem] font-semibold text-muted-foreground">Default deny</span>
        </div>
        <TextField label="Nombre del rol" onChange={(event) => setName(event.target.value)} required value={name} />
      </section>

      <section className="grid gap-2 rounded-lg border border-border bg-surface p-2.5" aria-labelledby="role-capabilities-heading">
        <div><h4 className="text-xs font-bold text-foreground" id="role-capabilities-heading">Capacidades generales</h4><p className="text-[0.625rem] text-muted-foreground">Habilitan áreas sensibles; una capacidad por sí sola no concede acceso a contenido o rutas.</p></div>
        <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
          {capabilityOptions.map((capability) => (
            <div className="grid gap-1 rounded-md border border-border bg-muted/15 p-1.5" key={capability.key}>
              <ToggleButton active={capabilities.includes(capability.key)} label={capability.label} onClick={() => toggleCapability(capability.key)} />
              <span className="px-1 text-[0.625rem] leading-4 text-muted-foreground">{capability.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2 rounded-lg border border-border bg-surface p-2.5" aria-labelledby="role-content-heading">
        <div><h4 className="text-xs font-bold text-foreground" id="role-content-heading">Acciones por contenido</h4><p className="text-[0.625rem] text-muted-foreground">Define qué puede hacer este rol en cada tipo de contenido.</p></div>
        {contentTypes.length > 0 ? contentTypes.map((contentType) => {
          const permissions = contentTypesPermissions[contentType.id] ?? deniedContentPermission
          return (
            <div className="grid gap-1.5 rounded-md border border-border bg-muted/15 p-2" key={contentType.id}>
              <strong className="text-xs text-foreground">{contentType.pluralName}</strong>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-6">
                {contentActions.map(({ action, label }) => <ToggleButton active={permissions[action]} key={action} label={label} onClick={() => toggleContentPermission(contentType.id, action)} />)}
              </div>
            </div>
          )
        }) : <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">No hay tipos de contenido todavía.</p>}
      </section>

      <section className="grid gap-2 rounded-lg border border-border bg-surface p-2.5" aria-labelledby="role-fields-heading">
        <div><h4 className="text-xs font-bold text-foreground" id="role-fields-heading">Permisos de campos</h4><p className="text-[0.625rem] text-muted-foreground">Un campo sin permiso de lectura se elimina del resultado autorizado; ocultarlo visualmente no es la barrera de seguridad.</p></div>
        <div className="grid gap-2 xl:grid-cols-2">
          {contentTypes.flatMap((contentType) => {
            const fields = contentType.fieldIds.flatMap((fieldId) => cms.fields[fieldId] ? [cms.fields[fieldId]] : [])
            if (fields.length === 0) return []
            return [(
              <div className="grid gap-1 rounded-md border border-border bg-muted/15 p-2" key={contentType.id}>
                <strong className="text-xs text-foreground">{contentType.pluralName}</strong>
                {fields.map((field) => {
                  const permission = fieldPermissions[field.id] ?? { editable: false, readable: false }
                  return (
                    <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-1" key={field.id}>
                      <span className="truncate text-xs text-muted-foreground">{field.label}</span>
                      <ToggleButton active={permission.readable} label="Ver" onClick={() => toggleFieldPermission(field.id, 'readable')} />
                      <ToggleButton active={permission.editable} label="Editar" onClick={() => toggleFieldPermission(field.id, 'editable')} />
                    </div>
                  )
                })}
              </div>
            )]
          })}
        </div>
      </section>

      <section className="grid gap-2 rounded-lg border border-border bg-surface p-2.5" aria-labelledby="role-routes-heading">
        <div><h4 className="text-xs font-bold text-foreground" id="role-routes-heading">Pantallas y rutas</h4><p className="text-[0.625rem] text-muted-foreground">Concede acceso explícito a cada pantalla administrativa. Las allow-lists adicionales de la pantalla siguen aplicándose.</p></div>
        {screens.length > 0 ? <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">{screens.map((screen) => (
          <ToggleButton active={routes.includes(screen.route)} key={screen.id} label={screen.name} onClick={() => toggleScreen(screen)} />
        ))}</div> : <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">Crea una pantalla administrativa para poder autorizar su ruta.</p>}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <Button disabled={pending} onClick={() => { void remove() }} size="small" variant={deleteArmed ? 'destructive' : 'ghost'}>{deleteArmed ? 'Confirmar eliminación' : 'Eliminar rol'}</Button>
        <Button disabled={!name.trim()} isLoading={pending} loadingLabel="Guardando" onClick={() => { void save() }} size="small"><Icon name="check" size={12} />Guardar permisos</Button>
      </div>
    </div>
  )
}

export function RolePermissionManager() {
  const session = useRoleSession()
  const structure = useEditorProjectStructure()
  const cms = useMemo(() => projectCmsBackend(structure.cms), [structure.cms])
  const roles = useMemo(() => Object.values(cms.roles).sort((left, right) => left.name.localeCompare(right.name, 'es')), [cms.roles])
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId | null>(() => roles[0]?.id ?? null)
  const [newRoleName, setNewRoleName] = useState('')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const selectedRole = selectedRoleId ? cms.roles[selectedRoleId] : undefined

  async function create(): Promise<void> {
    const name = newRoleName.trim()
    if (!name || pending) return
    setPending(true)
    const id = parseRoleId(crypto.randomUUID())
    const result = await session.createRole({
      capabilities: [],
      contentTypes: {},
      dashboardIds: [],
      fields: {},
      id,
      name,
      routes: [],
      slug: slugFromName(name),
    })
    setPending(false)
    setNotice(result.ok ? 'Rol creado sin permisos. Concede solo lo necesario.' : result.error)
    if (result.ok) {
      setSelectedRoleId(id)
      setNewRoleName('')
    }
  }

  return (
    <section aria-labelledby="role-permission-manager-heading" className="grid gap-3 rounded-lg border border-border bg-muted/10 p-2.5 lg:p-3">
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="lock" size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1"><h3 className="text-sm font-bold text-foreground" id="role-permission-manager-heading">Roles y permisos</h3><HelpTip description="Los roles conceden capacidades, acciones sobre contenido, acceso a campos y rutas. Todo lo que no se concede expresamente queda denegado." example="Un editor puede ver y editar Artículos, pero no publicar, borrar ni leer el campo interno de coste." label="Control de acceso" reference="WordPress Roles & Capabilities · RBAC" /></div>
          <p className="text-xs leading-4 text-muted-foreground">La autorización se aplica en el motor de datos; ocultar botones no sustituye estos permisos.</p>
        </div>
        <span className="rounded-md border border-border bg-surface px-2 py-1 text-[0.625rem] font-bold text-muted-foreground">M12.3</span>
      </div>

      {notice ? <p className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-muted-foreground" role="status">{notice}</p> : null}

      <div className="grid gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[minmax(12rem,1fr)_auto]">
        <TextField label="Nuevo rol" onChange={(event) => setNewRoleName(event.target.value)} placeholder="Ej. Editor de pedidos" value={newRoleName} />
        <div className="flex items-end"><Button disabled={!newRoleName.trim()} isLoading={pending} loadingLabel="Creando" onClick={() => { void create() }} size="small"><Icon name="plus" size={12} />Crear rol</Button></div>
      </div>

      {roles.length > 0 ? (
        <div className="grid gap-2 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <nav aria-label="Roles del proyecto" className="grid content-start gap-1 rounded-lg border border-border bg-surface p-1.5">
            {roles.map((role) => <button aria-current={selectedRoleId === role.id ? 'true' : undefined} className={`min-h-11 rounded-md px-2 text-left text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${selectedRoleId === role.id ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} key={role.id} onClick={() => setSelectedRoleId(role.id)} type="button">{role.name}</button>)}
          </nav>
          {selectedRole ? <RoleEditor key={JSON.stringify(selectedRole)} role={selectedRole} /> : <p className="rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">Selecciona un rol.</p>}
        </div>
      ) : <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground">No hay roles. Crea el primero: empezará sin permisos por seguridad.</p>}
    </section>
  )
}
