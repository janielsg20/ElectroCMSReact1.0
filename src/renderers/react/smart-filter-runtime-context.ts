import { createContext, useContext } from 'react'
import type { SmartFilterRuntimeStore } from './smart-filter-runtime-store'

export const SmartFilterRuntimeContext = createContext<SmartFilterRuntimeStore | null>(null)

export function useSmartFilterRuntimeStore(): SmartFilterRuntimeStore {
  const store = useContext(SmartFilterRuntimeContext)
  if (!store) throw new Error('SmartFilterRuntime requiere SmartFilterRuntimeProvider.')
  return store
}
