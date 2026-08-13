import { createContext, useContext } from 'react'
import type { User, UserId } from '../../domain'

export interface ActiveUserContextValue {
  readonly activeUser: User | null
  readonly activeUserId: UserId | null
  readonly setActiveUserId: (userId: UserId | null) => void
}

export const ActiveUserContext = createContext<ActiveUserContextValue | null>(null)

export function useActiveUser(): ActiveUserContextValue {
  const value = useContext(ActiveUserContext)
  if (!value) throw new Error('El contexto de persona activa requiere ActiveUserProvider.')
  return value
}
