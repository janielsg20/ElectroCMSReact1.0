import { useMemo, type ReactNode } from 'react'
import { SmartFilterRuntimeContext } from './smart-filter-runtime-context'
import { SmartFilterRuntimeStore } from './smart-filter-runtime-store'

export interface SmartFilterRuntimeProviderProps {
  readonly children: ReactNode
  readonly store?: SmartFilterRuntimeStore
}

export function SmartFilterRuntimeProvider({ children, store: injectedStore }: SmartFilterRuntimeProviderProps) {
  const ownedStore = useMemo(() => new SmartFilterRuntimeStore(), [])
  return (
    <SmartFilterRuntimeContext.Provider value={injectedStore ?? ownedStore}>
      {children}
    </SmartFilterRuntimeContext.Provider>
  )
}
