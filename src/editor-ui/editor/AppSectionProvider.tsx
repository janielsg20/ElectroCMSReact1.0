import { useMemo, useState, type PropsWithChildren } from 'react'
import { AppSectionContext, type AppSectionContextValue } from './app-section-context'
import type { AppSection } from './app-sections'

export function AppSectionProvider({ children }: PropsWithChildren) {
  const [section, setSection] = useState<AppSection>('editor')
  const value = useMemo<AppSectionContextValue>(() => ({ section, setSection }), [section])
  return <AppSectionContext.Provider value={value}>{children}</AppSectionContext.Provider>
}
