import { describe, expect, it } from 'vitest'
import { createAuditLogEntry, describeAuditChanges, exportAuditLog } from './audit-log'
import { parseAuditLogEntryId, parseProjectId, parseTimestamp, parseUserId } from './identity'

const projectId = parseProjectId('a1000000-0000-4000-8000-000000000001')
const entryId = parseAuditLogEntryId('a2000000-0000-4000-8000-000000000001')
const userId = parseUserId('a3000000-0000-4000-8000-000000000001')
const timestamp = parseTimestamp('2026-08-13T23:00:00.000Z')

describe('M12.5 audit log', () => {
  it('resume cambios por ruta sin incluir los valores editados', () => {
    expect(describeAuditChanges({ cms: { title: 'Antes' } }, { cms: { title: 'Después', users: {} } })).toEqual([
      { kind: 'changed', path: 'proyecto.cms.title' },
      { kind: 'added', path: 'proyecto.cms.users' },
    ])
  })

  it('conserva actor, comandos y exporta un JSON portable', () => {
    const entry = createAuditLogEntry({
      action: 'execute', actor: { kind: 'person', label: 'Ana', userId }, after: { enabled: true }, before: { enabled: false },
      commandIds: ['cms.update-settings'], createdAt: timestamp, id: entryId, label: 'Editar ajustes', projectId,
    })
    const exported = exportAuditLog([entry])
    expect(entry.actor).toEqual({ kind: 'person', label: 'Ana', userId })
    expect(entry.changes).toEqual([{ kind: 'changed', path: 'proyecto.enabled' }])
    expect(exported).toContain('electrocms.audit-log')
    expect(exported).not.toContain('false')
    expect(exported).not.toContain('true')
  })
})
