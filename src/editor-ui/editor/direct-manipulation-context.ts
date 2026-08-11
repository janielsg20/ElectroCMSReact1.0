import { createContext, useContext } from 'react'
import type { BreakpointId, NodeId } from '../../domain'

export interface MenuPosition {
  readonly x: number
  readonly y: number
}

export interface DirectManipulationEnvironment {
  readonly breakpointId: BreakpointId
  announce(message: string): void
  openContextMenu(nodeId: NodeId, position: MenuPosition): void
}

export const DirectManipulationContext = createContext<DirectManipulationEnvironment | null>(null)

export function useDirectManipulation(): DirectManipulationEnvironment {
  const value = useContext(DirectManipulationContext)
  if (!value) throw new Error('La manipulación directa requiere un entorno de canvas.')
  return value
}
