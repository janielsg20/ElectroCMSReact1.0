import type { ReactNode } from 'react'
import type { Node, ResolvedNodeResponsiveState } from '../../domain'

export interface CanonicalWidgetViewProps {
  /** Fuentes ya resueltas para referencias locales `asset://`; el renderer nunca lee almacenamiento del navegador. */
  readonly mediaSources?: Readonly<Record<string, string>>
  readonly node: Node
  readonly responsive: ResolvedNodeResponsiveState
  readonly slots: Readonly<Record<string, readonly ReactNode[]>>
}

export type CanonicalWidgetRenderer = (props: CanonicalWidgetViewProps) => ReactNode
