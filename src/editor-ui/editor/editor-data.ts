import type { IconName } from '../primitives/Icon'

export type NavigationSectionId = 'editor'

export interface NavigationItem {
  readonly id: NavigationSectionId
  readonly label: string
  readonly icon: IconName
  readonly description: string
}

export const navigationItems: readonly NavigationItem[] = [
  {
    id: 'editor',
    label: 'Editor',
    icon: 'editor',
    description: 'Canvas, capas, inspector y vista responsive.',
  },
] as const
