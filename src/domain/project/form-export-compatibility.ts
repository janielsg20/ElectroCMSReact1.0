import type { Form } from './cms-schema'
import { FORM_ACTION_KINDS, formActionDefinition } from './form-action-catalog'
import type { FormActionKind } from './form-action-engine'
import { formSecurityRequirements, type FormSecurityRequirements } from './form-security-contract'

export type FormExportTarget = 'local' | 'react' | 'lamp' | 'wordpress'
export type FormTargetAvailability = 'editor-preview-only' | 'planned'
export type FormCompatibilityStatus = 'contract-ready' | 'adapter-required' | 'exporter-pending' | 'not-applicable'

export interface FormActionCompatibility {
  readonly kind: FormActionKind
  readonly label: string
  readonly status: FormCompatibilityStatus
}

export interface FormSecurityCompatibility {
  readonly csrf: FormCompatibilityStatus
  readonly honeypot: FormCompatibilityStatus
  readonly outputEscaping: FormCompatibilityStatus
  readonly rateLimit: FormCompatibilityStatus
  readonly serverFileRevalidation: FormCompatibilityStatus
  readonly serverInputValidation: FormCompatibilityStatus
}

export interface FormExportCompatibility {
  readonly actions: readonly FormActionCompatibility[]
  readonly availability: FormTargetAvailability
  readonly label: string
  readonly ownerPhase: 'F14' | 'F15' | 'F16'
  readonly security: FormSecurityCompatibility
  readonly securityRequirements: FormSecurityRequirements
  readonly target: FormExportTarget
}

const targetMetadata: Readonly<Record<FormExportTarget, {
  readonly availability: FormTargetAvailability
  readonly label: string
  readonly ownerPhase: 'F14' | 'F15' | 'F16'
}>> = {
  local: { availability: 'editor-preview-only', label: 'Local', ownerPhase: 'F14' },
  react: { availability: 'planned', label: 'React', ownerPhase: 'F14' },
  lamp: { availability: 'planned', label: 'LAMP', ownerPhase: 'F15' },
  wordpress: { availability: 'planned', label: 'WordPress', ownerPhase: 'F16' },
}

const previewNativeActions = new Set<FormActionKind>(['show-message', 'save-local', 'redirect'])
const domainLocalActions = new Set<FormActionKind>(['save-record', 'create-content', 'update-content', 'update-relation'])

function actionStatus(target: FormExportTarget, kind: FormActionKind): FormCompatibilityStatus {
  if (target === 'local' && previewNativeActions.has(kind)) return 'contract-ready'
  if (target === 'local' && domainLocalActions.has(kind)) return 'adapter-required'
  return target === 'local' ? 'adapter-required' : 'exporter-pending'
}

function securityStatus(target: FormExportTarget, required: boolean): FormCompatibilityStatus {
  if (!required) return 'not-applicable'
  return target === 'local' ? 'adapter-required' : 'exporter-pending'
}

export function formExportCompatibility(form: Form, target: FormExportTarget): FormExportCompatibility {
  const metadata = targetMetadata[target]
  const requirements = formSecurityRequirements(form)
  return {
    actions: FORM_ACTION_KINDS.map((kind) => ({
      kind,
      label: formActionDefinition(kind).label,
      status: actionStatus(target, kind),
    })),
    availability: metadata.availability,
    label: metadata.label,
    ownerPhase: metadata.ownerPhase,
    security: {
      csrf: securityStatus(target, requirements.csrf),
      honeypot: securityStatus(target, requirements.honeypot),
      outputEscaping: securityStatus(target, requirements.outputEscaping),
      rateLimit: securityStatus(target, requirements.rateLimit),
      serverFileRevalidation: securityStatus(target, requirements.serverFileRevalidation),
      serverInputValidation: securityStatus(target, requirements.serverInputValidation),
    },
    securityRequirements: requirements,
    target,
  }
}

export function formExportCompatibilityMatrix(form: Form): readonly FormExportCompatibility[] {
  return (Object.keys(targetMetadata) as FormExportTarget[]).map((target) => formExportCompatibility(form, target))
}
