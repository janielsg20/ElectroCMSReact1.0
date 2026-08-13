import { useMemo, useState } from 'react'
import { canAccessScreen, visibleMenuItemIds, type BackendScreenId } from '../../domain'
import { listBackendScreens } from '../../domain/project/backend-shell-engine'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import { Button, HelpTip, Icon } from '../primitives'
import { AdminCrudViewsManager } from './AdminCrudViewsManager'
import { BackendShellManager } from './BackendShellManager'
import { RoleManager } from './RoleManager'
import { UserManager } from './UserManager'
import { useActiveUser } from './active-user-context'
import { useAppSection } from './app-section-context'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

const kindLabels: Readonly<Record<string, string>> = {
  calendar: 'Calendario', chart: 'Gráfico', custom: 'Pantalla personalizada', dashboard: 'Dashboard', detail: 'Detalle', form: 'Formulario', kanban: 'Kanban', listing: 'Listado', table: 'Tabla',
}

export function BackendAdminWorkspace() {
  const structure = useEditorProjectStructure()
  const session = useEditorProject()
  const { activeUser, activeUserId } = useActiveUser()
  const { setSection } = useAppSection()
  const screens = useMemo(() => listBackendScreens(structure), [structure])
  const visibleScreens = useMemo(() => {
    const cms = projectCmsBackend(structure.cms)
    return activeUserId ? screens.filter((screen) => canAccessScreen(cms, activeUserId, screen.id)) : screens
  }, [activeUserId, screens, structure.cms])
  const visibleMenuItems = useMemo(() => {
    if (!activeUserId) return []
    const menu = Object.values(projectCmsBackend(structure.cms).menus).find((item) => item.name.toLocaleLowerCase('es') === 'administración')
    return menu ? visibleMenuItemIds(projectCmsBackend(structure.cms), activeUserId, menu.id).flatMap((itemId) => {
      const item = menu.items[itemId]
      return item ? [item] : []
    }) : []
  }, [activeUserId, structure.cms])
  const [selectedScreenId, setSelectedScreenId] = useState<BackendScreenId | null>(screens[0]?.id ?? null)
  const selectedScreen = visibleScreens.find((screen) => screen.id === selectedScreenId) ?? visibleScreens[0]

  function editSelectedCanvas(): void {
    if (!selectedScreen || !session.selectDocument) return
    session.selectDocument(selectedScreen.documentId)
    setSection('editor')
  }

  return <div className="grid gap-3 p-2 lg:p-3">
    <section aria-labelledby="administration-workspace-title" className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 shadow-sm"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="content" size={16} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><h2 className="text-sm font-bold text-foreground" id="administration-workspace-title">Administración del proyecto</h2><HelpTip description="Organiza los paneles que usarán quienes gestionen el sitio. Cada panel reutiliza el mismo contenido, formularios y diseño del proyecto." example="Crea un dashboard de pedidos y conéctalo a una tabla de pedidos pendientes." label="Paneles de administración" reference="WordPress Admin · JetEngine admin tooling" /></div><p className="mt-0.5 text-xs leading-4 text-muted-foreground">Los datos se preparan en Contenido; aquí decides cómo se gestionan en el panel administrativo.</p></div></section>
    <div className="grid gap-3 xl:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)]"><aside aria-label="Paneles administrativos" className="grid content-start gap-2 rounded-lg border border-border bg-muted/15 p-2"><div className="flex items-center justify-between gap-2 px-1"><strong className="text-xs text-foreground">Paneles disponibles</strong><span className="rounded bg-surface px-1.5 py-1 text-[0.625rem] font-bold text-muted-foreground">{visibleScreens.length}</span></div>{activeUser ? <p className="px-1 text-[0.625rem] text-muted-foreground">Vista de: <strong>{activeUser.displayName}</strong></p> : <p className="px-1 text-[0.625rem] leading-4 text-muted-foreground">Modo de configuración: elige una persona abajo para comprobar sus permisos.</p>}{visibleScreens.length ? <div className="grid gap-1" role="list">{visibleScreens.map((screen) => <button aria-current={screen.id === selectedScreenId ? 'page' : undefined} className={`grid min-h-11 gap-0.5 rounded-md border px-2 py-1.5 text-left focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${screen.id === selectedScreenId ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:bg-muted'}`} key={screen.id} onClick={() => setSelectedScreenId(screen.id)} role="listitem" type="button"><span className="truncate text-xs font-semibold">{screen.name}</span><span className="truncate text-[0.625rem] text-muted-foreground">{kindLabels[screen.kind] ?? 'Panel'} · {screen.route}</span></button>)}</div> : <p className="rounded-md border border-dashed border-border bg-surface p-3 text-xs leading-4 text-muted-foreground">{activeUser ? 'Esta persona no tiene acceso a ningún panel todavía.' : 'Añade un panel para configurar una vista administrativa.'}</p>}{activeUser && visibleMenuItems.length ? <div className="grid gap-1 border-t border-border pt-2"><strong className="px-1 text-xs text-foreground">En el menú</strong>{visibleMenuItems.map((item) => <span className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs" key={item.id}>{item.label}</span>)}</div> : null}</aside><div className="min-w-0">{selectedScreen ? <div className="grid gap-2"><div className="flex justify-end"><Button disabled={!session.selectDocument} onClick={editSelectedCanvas} size="small" variant="secondary"><Icon name="layers" size={13} />Editar diseño del panel</Button></div><AdminCrudViewsManager screenId={selectedScreen.id} /></div> : <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground">Añade y asigna un panel para configurar una vista administrativa.</p>}</div></div>
    <details className="rounded-lg border border-border bg-surface" open={screens.length === 0}><summary className="min-h-11 cursor-pointer px-3 py-3 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:py-2">Añadir el lienzo actual como panel</summary><BackendShellManager /></details>
    <RoleManager />
    <UserManager />
  </div>
}
