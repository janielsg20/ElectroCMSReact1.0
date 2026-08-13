import { useMemo, useState } from 'react'
import {
  parseBackendScreenId,
  parseMenuId,
  parseMenuItemId,
  type BackendScreen,
} from '../../domain'
import { adminShellForDocument } from '../../domain/project/backend-shell-engine'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import { Button, ChoiceField, HelpTip, Icon, TextField } from '../primitives'
import { useBackendShellSession } from './backend-shell-session-context'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

type ShellKind = Extract<BackendScreen['kind'], 'dashboard' | 'custom'>

const shellKindOptions: readonly { readonly label: string; readonly description: string; readonly value: ShellKind }[] = [
  { label: 'Dashboard', description: 'Inicio administrativo con resumen, accesos y métricas.', value: 'dashboard' },
  { label: 'Pantalla personalizada', description: 'Lienzo administrativo libre para una necesidad específica.', value: 'custom' },
]

function routeFromName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `/admin/${slug || 'inicio'}`
}

export function BackendShellManager({ onOpenCanvas }: { readonly onOpenCanvas?: () => void }) {
  const session = useEditorProject()
  const backend = useBackendShellSession()
  const structure = useEditorProjectStructure()
  const cms = projectCmsBackend(structure.cms)
  const document = structure.documents[session.documentId]
  const shell = adminShellForDocument(structure, session.documentId)
  const [screenName, setScreenName] = useState(shell?.screen.name ?? 'Panel de administración')
  const [menuLabel, setMenuLabel] = useState(shell?.menuItem.label ?? 'Inicio')
  const [kind, setKind] = useState<ShellKind>(shell?.screen.kind === 'custom' ? 'custom' : 'dashboard')
  const [pending, setPending] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [notice, setNotice] = useState<{ readonly kind: 'error' | 'success'; readonly text: string } | null>(null)
  const adminMenu = useMemo(
    () => Object.values(cms.menus).find((menu) => menu.name.toLocaleLowerCase('es') === 'administración'),
    [cms.menus],
  )

  async function create(): Promise<void> {
    if (!document || !screenName.trim() || !menuLabel.trim()) {
      setNotice({ kind: 'error', text: 'Escribe un nombre para el panel y para su acceso en la navegación.' })
      return
    }
    setPending(true)
    const result = await backend.createAdminShell({
      documentId: document.id,
      menuId: adminMenu?.id ?? parseMenuId(crypto.randomUUID()),
      menuItemId: parseMenuItemId(crypto.randomUUID()),
      menuLabel: menuLabel.trim(),
      menuName: adminMenu?.name ?? 'Administración',
      route: routeFromName(screenName),
      screenId: parseBackendScreenId(crypto.randomUUID()),
      screenKind: kind,
      screenName: screenName.trim(),
    })
    setPending(false)
    setNotice(result.ok
      ? { kind: 'success', text: 'Este lienzo ya funciona como shell administrativo editable.' }
      : { kind: 'error', text: result.error })
  }

  async function save(): Promise<void> {
    if (!shell || !screenName.trim() || !menuLabel.trim()) return
    setPending(true)
    const result = await backend.updateAdminShell(shell.screen.id, {
      menuLabel: menuLabel.trim(),
      screenKind: kind,
      screenName: screenName.trim(),
    })
    setPending(false)
    setNotice(result.ok ? { kind: 'success', text: 'Administración actualizada.' } : { kind: 'error', text: result.error })
  }

  async function remove(): Promise<void> {
    if (!shell) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      setNotice({ kind: 'success', text: 'Pulsa de nuevo para retirar este lienzo de la administración. El diseño del lienzo no se eliminará.' })
      return
    }
    setPending(true)
    const result = await backend.deleteAdminShell(shell.screen.id)
    setPending(false)
    setDeleteArmed(false)
    setNotice(result.ok
      ? { kind: 'success', text: 'El lienzo dejó de ser una pantalla administrativa; su diseño se conserva.' }
      : { kind: 'error', text: result.error })
  }

  if (!document) {
    return <p className="m-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">No hay un lienzo activo para convertir en administración.</p>
  }

  return (
    <div className="grid gap-2 p-2 lg:p-3">
      <section aria-labelledby="backend-shell-title" className="grid gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
        <div className="flex items-start gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="content" size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-bold text-foreground" id="backend-shell-title">Administración visual</h2>
              <HelpTip
                description="Convierte el lienzo actual en una pantalla administrativa. Encabezado, barra lateral y dashboard se diseñan con los mismos widgets, capas e Inspector que el resto del proyecto."
                example="Crea un dashboard para pedidos, propiedades, clientes o inventario y diseña cada bloque directamente en el lienzo."
                label="Shell administrativo"
                reference="WordPress Admin · Elementor-style visual editing"
              />
            </div>
            <p className="mt-0.5 text-xs leading-4 text-muted-foreground">No hay un editor separado: este mismo lienzo, sus capas, estilos y responsive son la interfaz administrativa.</p>
          </div>
          <span className={`rounded-md border px-2 py-1 text-[0.625rem] font-bold ${shell ? 'border-primary/25 bg-primary-soft text-primary-strong' : 'border-border bg-muted text-muted-foreground'}`}>
            {shell ? 'Administrativo' : 'Lienzo normal'}
          </span>
        </div>

        {notice ? <p className={`rounded-md px-2 py-1.5 text-xs ${notice.kind === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary-soft text-primary-strong'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

        <div className="grid gap-2 rounded-md border border-border bg-muted/15 p-2 sm:grid-cols-3">
          {['Encabezado', 'Navegación lateral', 'Dashboard'].map((label) => (
            <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-2 lg:min-h-9" key={label}>
              <Icon name="check" size={12} />
              <span className="text-[0.625rem] font-semibold text-foreground">{label} · mismo lienzo</span>
            </div>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <TextField label="Nombre del panel" onChange={(event) => setScreenName(event.target.value)} required value={screenName} />
          <ChoiceField label="Tipo de pantalla" onChange={(value) => setKind(value === 'custom' ? 'custom' : 'dashboard')} options={shellKindOptions} value={kind} />
          <TextField hint="Así aparecerá en la navegación administrativa." label="Nombre en el menú" onChange={(event) => setMenuLabel(event.target.value)} required value={menuLabel} />
          <div className="grid content-end gap-1 rounded-md border border-border bg-muted/15 px-2 py-1.5">
            <span className="text-[0.625rem] font-semibold text-muted-foreground">Lienzo utilizado</span>
            <strong className="truncate text-xs text-foreground">{document.name}</strong>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/10 p-2 text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">Cómo editarlo:</strong> vuelve al lienzo y usa Widgets, Capas e Inspector para construir encabezado, navegación y contenido. La sección Administración solo define qué lienzo actúa como pantalla y cómo aparece en el menú.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <div>{shell ? <Button disabled={pending} onClick={() => { void remove() }} size="small" variant={deleteArmed ? 'destructive' : 'ghost'}>{deleteArmed ? 'Confirmar retiro' : 'Retirar de administración'}</Button> : null}</div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {onOpenCanvas ? <Button disabled={pending} onClick={onOpenCanvas} size="small" variant="secondary"><Icon name="layers" size={12} />Editar en el lienzo</Button> : null}
            <Button isLoading={pending} loadingLabel="Guardando" onClick={() => { void (shell ? save() : create()) }} size="small">
              <Icon name="check" size={12} />{shell ? 'Guardar administración' : 'Usar este lienzo como dashboard'}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-1.5 rounded-lg border border-border bg-muted/15 p-2.5" aria-label="Navegación administrativa">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-xs text-foreground">Navegación administrativa</strong>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-[0.625rem] font-semibold text-muted-foreground">{adminMenu?.rootItemIds.length ?? 0} accesos</span>
        </div>
        {adminMenu && adminMenu.rootItemIds.length > 0 ? adminMenu.rootItemIds.map((itemId, index) => {
          const item = adminMenu.items[itemId]
          if (!item) return null
          return (
            <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-2 lg:min-h-9" key={item.id}>
              <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-[0.625rem] font-bold text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{item.label}</span>
              <span className="text-[0.625rem] text-muted-foreground">Pantalla</span>
            </div>
          )
        }) : <p className="rounded-md border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">Cuando conviertas el lienzo en dashboard, su acceso aparecerá aquí.</p>}
      </section>
    </div>
  )
}
