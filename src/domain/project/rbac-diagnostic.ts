import { failure, success, type Result } from '../common/result'
import type { RbacDecision } from './rbac-types'

export type RbacDiagnosticCode =
  | 'permission-denied'
  | 'record-not-found'
  | 'query-not-found'
  | 'query-field-denied'
  | 'query-relation-denied'
  | 'engine-error'

export interface RbacDiagnostic {
  readonly code: RbacDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export function rbacDiagnostic(code: RbacDiagnosticCode, message: string, path: readonly (string | number)[] = []): RbacDiagnostic {
  return { code, message, path }
}

export function requireRbacDecision(current: RbacDecision, path: readonly (string | number)[] = []): Result<void, RbacDiagnostic> {
  return current.allowed
    ? success(undefined)
    : failure(rbacDiagnostic('permission-denied', current.message, path))
}
