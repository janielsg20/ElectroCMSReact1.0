import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { activeUser, type UserId } from '../../domain'
import { projectCmsBackend } from '../../domain/project/cms-defaults'
import { ActiveUserContext, type ActiveUserContextValue } from './active-user-context'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

const ACTIVE_USER_STORAGE_KEY = 'electrocms.active-user.v1'

function readStoredUserId(): UserId | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)
  return value ? value as UserId : null
}

export function ActiveUserProvider({ children }: { readonly children: ReactNode }) {
  const structure = useEditorProjectStructure()
  const session = useEditorProject()
  const [requestedUserId, setRequestedUserId] = useState<UserId | null>(readStoredUserId)
  const currentUser = activeUser(projectCmsBackend(structure.cms), requestedUserId)
  const activeUserId = currentUser?.id ?? null

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeUserId) window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUserId)
    else window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY)
  }, [activeUserId])

  useEffect(() => {
    session.setAuditActor?.(currentUser
      ? { kind: 'person', label: currentUser.displayName, userId: currentUser.id }
      : { kind: 'system', label: 'Configuración del proyecto' })
  }, [currentUser, session])

  const value = useMemo<ActiveUserContextValue>(() => ({
    activeUser: currentUser,
    activeUserId,
    setActiveUserId: setRequestedUserId,
  }), [activeUserId, currentUser])

  return <ActiveUserContext.Provider value={value}>{children}</ActiveUserContext.Provider>
}
