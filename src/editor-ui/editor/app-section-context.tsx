import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import type { AppSection } from './app-sections'

interface AppSectionContextValue {
  readonly section: AppSection
  readonly setSection: (section: AppSection) => void
}

const AppSectionContext = createContext<AppSectionContextValue | null>(null)

export function AppSectionProvider({ children }: PropsWithChildren) {
  const [section, setSection] = useState<AppSection>('editor')
  const value = useMemo<AppSectionContextValue>(() => ({ section, setSection }), [section])
  return <AppSectionContext.Provider value={value}>{children}</AppSectionContext.Provider>
}

export function useAppSection(): AppSectionContextValue {
  const value = useContext(AppSectionContext)
  if (!value) throw new Error('useAppSection debe usarse dentro de AppSectionProvider')
  return value
}
