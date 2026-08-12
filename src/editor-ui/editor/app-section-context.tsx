import { createContext, useContext } from 'react'
import type { AppSection } from './app-sections'

export interface AppSectionContextValue {
  readonly section: AppSection
  readonly setSection: (section: AppSection) => void
}

export const AppSectionContext = createContext<AppSectionContextValue | null>(null)

export function useAppSection(): AppSectionContextValue {
  const value = useContext(AppSectionContext)
  if (!value) throw new Error('useAppSection debe usarse dentro de AppSectionProvider')
  return value
}
