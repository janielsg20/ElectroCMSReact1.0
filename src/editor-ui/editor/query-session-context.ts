import type { ProjectStructure, Query, QueryId, Result } from '../../domain'
import type { QueryEditablePatch } from '../../domain/project/query-definition-engine'
import { useEditorProject, type EditorProjectSession } from './editor-project-context'

export interface QuerySession {
  createSavedQuery(query: Query): Promise<Result<ProjectStructure, string>>
  updateSavedQuery(queryId: QueryId, patch: QueryEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteSavedQuery(queryId: QueryId): Promise<Result<ProjectStructure, string>>
}

export function requireQuerySession(session: EditorProjectSession): EditorProjectSession & QuerySession {
  const candidate = session as EditorProjectSession & Partial<QuerySession>
  if (
    typeof candidate.createSavedQuery !== 'function'
    || typeof candidate.updateSavedQuery !== 'function'
    || typeof candidate.deleteSavedQuery !== 'function'
  ) throw new Error('La sesión actual no ofrece la capacidad de consultas guardadas.')
  return candidate as EditorProjectSession & QuerySession
}

export function useQuerySession(): QuerySession {
  return requireQuerySession(useEditorProject())
}
