import type { RoleId } from './identity'

export interface RbacSubject {
  readonly roleIds: readonly RoleId[]
}

export type RbacDecisionCode = 'allowed' | 'deny-by-default' | 'resource-not-found' | 'permission-denied'

export interface RbacDecision {
  readonly allowed: boolean
  readonly code: RbacDecisionCode
  readonly matchedRoleIds: readonly RoleId[]
  readonly message: string
}
