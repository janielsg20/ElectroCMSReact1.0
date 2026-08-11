import { navigationItems, type NavigationSectionId } from './editor-data'

export const DEFAULT_NAVIGATION_SECTION: NavigationSectionId = 'editor'

const navigationSectionIds = new Set<NavigationSectionId>(navigationItems.map((item) => item.id))

export function navigationHash(section: NavigationSectionId): string {
  return `#/${section}`
}

export function navigationUrl(section: NavigationSectionId): string {
  return `${window.location.pathname}${window.location.search}${navigationHash(section)}`
}

export function sectionFromHash(hash: string): NavigationSectionId | null {
  const value = decodeURIComponent(hash.replace(/^#\/?/, '').split(/[?&]/, 1)[0] ?? '').trim()
  return navigationSectionIds.has(value as NavigationSectionId) ? value as NavigationSectionId : null
}

export function sectionFromLocation(location: Pick<Location, 'hash'>): NavigationSectionId {
  return sectionFromHash(location.hash) ?? DEFAULT_NAVIGATION_SECTION
}

export function writeNavigationHistory(section: NavigationSectionId, mode: 'push' | 'replace' = 'push'): void {
  const url = navigationUrl(section)
  const state = { ...(window.history.state ?? {}), electrocmsSection: section }
  if (mode === 'replace') window.history.replaceState(state, '', url)
  else window.history.pushState(state, '', url)
}
