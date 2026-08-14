import type { AuditActor, AuditLogEntry, Result } from '../../domain'
import { useEditorProject, type EditorProjectSession } from './editor-project-context'

export interface AuditLogSession {
  setAuditActor(actor: AuditActor): void
  listAuditEntries(): Promise<Result<readonly AuditLogEntry[], string>>
  exportAuditEntries(): Promise<Result<string, string>>
}

export function requireAuditLogSession(session: EditorProjectSession): EditorProjectSession & AuditLogSession {
  const candidate = session as EditorProjectSession & Partial<AuditLogSession>
  if (typeof candidate.setAuditActor !== 'function' || typeof candidate.listAuditEntries !== 'function' || typeof candidate.exportAuditEntries !== 'function') {
    throw new Error('La sesión actual no ofrece el registro de auditoría.')
  }
  return candidate as EditorProjectSession & AuditLogSession
}

export function useAuditLogSession(): AuditLogSession {
  return requireAuditLogSession(useEditorProject())
}
