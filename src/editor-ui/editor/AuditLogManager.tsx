import { useEffect, useMemo, useState } from 'react'
import { canUseCapability, type AuditLogEntry } from '../../domain'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import { Button, HelpTip } from '../primitives'
import { useActiveUser } from './active-user-context'
import { useAuditLogSession } from './audit-log-session-context'
import { useEditorProjectStructure } from './editor-project-context'

const actionLabels = { execute: 'Cambio aplicado', redo: 'Cambio restaurado', undo: 'Cambio revertido' } as const

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function AuditLogManager() {
  const structure = useEditorProjectStructure()
  const session = useAuditLogSession()
  const { activeUserId } = useActiveUser()
  const [entries, setEntries] = useState<readonly AuditLogEntry[]>([])
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const cms = projectCmsBackend(structure.cms)
  const canView = !activeUserId || canUseCapability(cms, activeUserId, 'audit.view')
  const canExport = !activeUserId || canUseCapability(cms, activeUserId, 'audit.export')

  useEffect(() => {
    if (!canView) {
      return
    }
    let live = true
    void session.listAuditEntries().then((result) => {
      if (!live) return
      if (result.ok) { setEntries(result.value); setError('') }
      else setError(result.error)
    })
    return () => { live = false }
  }, [canView, session, structure])

  const recentEntries = useMemo(() => entries.slice(0, 20), [entries])

  async function exportEntries(): Promise<void> {
    if (!canExport || exporting) return
    setExporting(true)
    const result = await session.exportAuditEntries()
    if (!result.ok) { setError(result.error); setExporting(false); return }
    const url = URL.createObjectURL(new Blob([result.value], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'electrocms-auditoria.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return <section aria-labelledby="audit-log-title" className="grid gap-2 rounded-lg border border-border bg-surface p-3">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-1"><h3 className="text-sm font-bold text-foreground" id="audit-log-title">Registro de actividad</h3><HelpTip description="Conserva una lista local de los cambios realizados, quién los ejecutó y qué parte del proyecto se modificó. No guarda el contenido de los campos en el informe." example="Exporta el registro para revisar cambios antes de entregar un sitio." label="Registro de actividad" reference="WordPress activity log · JetEngine admin tooling" /></div><p className="mt-0.5 text-xs leading-4 text-muted-foreground">{entries.length} cambios locales registrados. El informe solo incluye rutas de cambio, no valores editados.</p></div>{canExport ? <Button isLoading={exporting} loadingLabel="Preparando" onClick={() => void exportEntries()} size="small" variant="secondary">Exportar registro</Button> : null}</div>
    {!canView ? <p className="rounded-md border border-dashed border-border bg-muted/20 p-2 text-xs leading-4 text-muted-foreground">Esta persona no tiene permiso para consultar el registro de actividad.</p> : error ? <p aria-live="polite" className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">No se pudo cargar el registro: {error}</p> : recentEntries.length ? <ol className="grid divide-y divide-border rounded-md border border-border bg-muted/10">{recentEntries.map((entry) => <li className="grid gap-1 px-2 py-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" key={entry.id}><div className="min-w-0"><strong className="block text-foreground">{entry.label}</strong><span className="block truncate text-muted-foreground">{actionLabels[entry.action]} · {entry.actor.label} · {entry.changes.map((change) => change.path).join(', ')}</span></div><time className="text-[0.625rem] text-muted-foreground" dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time></li>)}</ol> : <p className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs leading-4 text-muted-foreground">Los cambios realizados a partir de ahora aparecerán aquí.</p>}
  </section>
}
