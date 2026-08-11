import type { ReactNode } from 'react'
import type { Node, ResolvedNodeResponsiveState } from '../../domain'

export interface CanonicalWidgetViewProps {
  readonly node: Node
  readonly responsive: ResolvedNodeResponsiveState
  readonly slots: Readonly<Record<string, readonly ReactNode[]>>
}

export type CanonicalWidgetRenderer = (props: CanonicalWidgetViewProps) => ReactNode
