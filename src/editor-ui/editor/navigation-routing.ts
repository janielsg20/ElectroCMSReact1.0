import { navigationItems, type NavigationSectionId } from './editor-data'

export const DEFAULT_NAVIGATION_SECTION: NavigationSectionId = 'editor'

interface NavigationHistoryState {
  readonly schemaVersion: 1
  readonly electrocmsSection: NavigationSectionId
}

export function navigationHash(section: NavigationSectionId): string {
  return `#/${section}`
}

export function navigationUrl(section: NavigationSectionId): string {
  return `${window.location.pathname}${window.location.search}${navigationHash(section)}`
}

export function sectionFromHash(hash: string): NavigationSectionId | null {
  const value = decodeURIComponent(hash.replace(/^#\/?/, '').split(/[?&]/, 1)[0] ?? '').trim()
  return navigationItems.find((item) => item.id === value)?.id ?? null
}

export function sectionFromLocation(location: Pick<Location, 'hash'>): NavigationSectionId {
  return sectionFromHash(location.hash) ?? DEFAULT_NAVIGATION_SECTION
}

export function writeNavigationHistory(section: NavigationSectionId, mode: 'push' | 'replace' = 'push'): void {
  const url = navigationUrl(section)
  const state: NavigationHistoryState = { schemaVersion: 1, electrocmsSection: section }
  if (mode === 'replace') window.history.replaceState(state, '', url)
  else window.history.pushState(state, '', url)
}
