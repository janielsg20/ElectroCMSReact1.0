import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { activeUser, type User, type UserId } from '../../domain'
import { useEditorProjectStructure } from './editor-project-context'

const ACTIVE_USER_STORAGE_KEY = 'electrocms.active-user.v1'

interface ActiveUserContextValue {
  readonly activeUser: User | null
  readonly activeUserId: UserId | null
  readonly setActiveUserId: (userId: UserId | null) => void
}

const ActiveUserContext = createContext<ActiveUserContextValue | null>(null)

function readStoredUserId(): UserId | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)
  return value ? value as UserId : null
}

export function ActiveUserProvider({ children }: { readonly children: ReactNode }) {
  const structure = useEditorProjectStructure()
  const [requestedUserId, setRequestedUserId] = useState<UserId | null>(readStoredUserId)
  const currentUser = activeUser(structure.cms, requestedUserId)
  const activeUserId = currentUser?.id ?? null

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeUserId) window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUserId)
    else window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY)
  }, [activeUserId])

  const value = useMemo<ActiveUserContextValue>(() => ({
    activeUser: currentUser,
    activeUserId,
    setActiveUserId: setRequestedUserId,
  }), [activeUserId, currentUser])

  return <ActiveUserContext.Provider value={value}>{children}</ActiveUserContext.Provider>
}

export function useActiveUser(): ActiveUserContextValue {
  const value = useContext(ActiveUserContext)
  if (!value) throw new Error('El contexto de persona activa requiere ActiveUserProvider.')
  return value
}
