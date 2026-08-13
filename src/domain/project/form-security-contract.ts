import type { Form } from './cms-schema'
import type { JsonValue } from './project-envelope'
import type { FormRuntimeValues } from './form-runtime'

export type FormSecurityDiagnosticCode =
  | 'unknown-control'
  | 'payload-too-large'
  | 'value-too-large'
  | 'too-many-items'
  | 'too-many-properties'
  | 'value-too-deep'
  | 'invalid-file-size'
  | 'invalid-file-mime'
  | 'invalid-file-extension'

export interface FormSecurityDiagnostic {
  readonly code: FormSecurityDiagnosticCode
  readonly controlId: string | null
  readonly message: string
  readonly path: readonly (number | string)[]
}

export interface FormPayloadPolicy {
  readonly maxArrayItems: number
  readonly maxDepth: number
  readonly maxObjectProperties: number
  readonly maxPayloadBytes: number
  readonly maxStringLength: number
}

export interface PortableFileDescriptor {
  readonly extension: string
  readonly mime: string
  readonly name: string
  readonly size: number
}

export interface FormFilePolicy {
  readonly allowedExtensions: readonly string[]
  readonly allowedMimeTypes: readonly string[]
  readonly maxBytes: number
}

export interface FormSecurityRequirements {
  readonly captcha: 'optional'
  readonly csrf: boolean
  readonly honeypot: true
  readonly outputEscaping: true
  readonly rateLimit: true
  readonly serverFileRevalidation: true
  readonly serverInputValidation: true
}

export type SecureFormPayloadResult =
  | { readonly ok: true; readonly values: Readonly<Record<string, JsonValue>> }
  | { readonly ok: false; readonly diagnostics: readonly FormSecurityDiagnostic[] }

export type FileSecurityResult =
  | { readonly ok: true; readonly file: PortableFileDescriptor }
  | { readonly ok: false; readonly diagnostics: readonly FormSecurityDiagnostic[] }

export const DEFAULT_FORM_PAYLOAD_POLICY: FormPayloadPolicy = {
  maxArrayItems: 250,
  maxDepth: 8,
  maxObjectProperties: 100,
  maxPayloadBytes: 256 * 1024,
  maxStringLength: 64 * 1024,
}

export const DEFAULT_FORM_FILE_POLICY: FormFilePolicy = {
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxBytes: 10 * 1024 * 1024,
}

const textEncoder = new TextEncoder()

function diagnostic(
  code: FormSecurityDiagnosticCode,
  message: string,
  controlId: string | null,
  path: readonly (number | string)[],
): FormSecurityDiagnostic {
  return { code, controlId, message, path }
}

function normalizedString(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .normalize('NFC')
}

function sanitizeValue(
  value: JsonValue,
  policy: FormPayloadPolicy,
  diagnostics: FormSecurityDiagnostic[],
  controlId: string,
  path: readonly (number | string)[],
  depth: number,
): JsonValue {
  if (depth > policy.maxDepth) {
    diagnostics.push(diagnostic('value-too-deep', 'El valor supera la profundidad portable permitida.', controlId, path))
    return null
  }

  if (typeof value === 'string') {
    const normalized = normalizedString(value)
    if (normalized.length > policy.maxStringLength) {
      diagnostics.push(diagnostic('value-too-large', `El valor supera ${policy.maxStringLength} caracteres.`, controlId, path))
    }
    return normalized
  }

  if (Array.isArray(value)) {
    if (value.length > policy.maxArrayItems) {
      diagnostics.push(diagnostic('too-many-items', `El valor supera ${policy.maxArrayItems} elementos.`, controlId, path))
    }
    return value.slice(0, policy.maxArrayItems).map((item, index) => sanitizeValue(item, policy, diagnostics, controlId, [...path, index], depth + 1))
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length > policy.maxObjectProperties) {
      diagnostics.push(diagnostic('too-many-properties', `El valor supera ${policy.maxObjectProperties} propiedades.`, controlId, path))
    }
    return Object.fromEntries(entries.slice(0, policy.maxObjectProperties).map(([key, item]) => [
      normalizedString(key),
      sanitizeValue(item, policy, diagnostics, controlId, [...path, key], depth + 1),
    ]))
  }

  return value
}

function payloadBytes(values: Readonly<Record<string, JsonValue>>): number {
  return textEncoder.encode(JSON.stringify(values)).byteLength
}

export function prepareSecureFormPayload(
  form: Form,
  values: FormRuntimeValues,
  policy: FormPayloadPolicy = DEFAULT_FORM_PAYLOAD_POLICY,
): SecureFormPayloadResult {
  const diagnostics: FormSecurityDiagnostic[] = []
  const safeValues: Record<string, JsonValue> = {}

  for (const [controlId, value] of Object.entries(values)) {
    if (!form.controls[controlId]) {
      diagnostics.push(diagnostic('unknown-control', 'El payload contiene un campo que no pertenece al formulario.', controlId, [controlId]))
      continue
    }
    if (value === undefined) continue
    safeValues[controlId] = sanitizeValue(value, policy, diagnostics, controlId, [controlId], 0)
  }

  const bytes = payloadBytes(safeValues)
  if (bytes > policy.maxPayloadBytes) {
    diagnostics.push(diagnostic('payload-too-large', `El formulario supera el límite portable de ${policy.maxPayloadBytes} bytes.`, null, []))
  }

  return diagnostics.length > 0 ? { ok: false, diagnostics } : { ok: true, values: safeValues }
}

function normalizedExtension(extension: string): string {
  return extension.trim().toLowerCase().replace(/^\./, '')
}

export function validatePortableFileDescriptor(
  file: PortableFileDescriptor,
  policy: FormFilePolicy = DEFAULT_FORM_FILE_POLICY,
): FileSecurityResult {
  const diagnostics: FormSecurityDiagnostic[] = []
  const extension = normalizedExtension(file.extension)
  const mime = file.mime.trim().toLowerCase()
  const name = normalizedString(file.name).trim()
  const normalized: PortableFileDescriptor = { extension, mime, name, size: file.size }

  if (!Number.isFinite(file.size) || file.size < 0 || file.size > policy.maxBytes) {
    diagnostics.push(diagnostic('invalid-file-size', `El archivo supera el límite de ${policy.maxBytes} bytes o tiene un tamaño inválido.`, null, ['size']))
  }
  if (!policy.allowedMimeTypes.map((item) => item.toLowerCase()).includes(mime)) {
    diagnostics.push(diagnostic('invalid-file-mime', 'El tipo MIME del archivo no está permitido.', null, ['mime']))
  }
  if (!policy.allowedExtensions.map(normalizedExtension).includes(extension)) {
    diagnostics.push(diagnostic('invalid-file-extension', 'La extensión del archivo no está permitida.', null, ['extension']))
  }

  return diagnostics.length > 0 ? { ok: false, diagnostics } : { ok: true, file: normalized }
}

export function formSecurityRequirements(form: Form): FormSecurityRequirements {
  return {
    captcha: 'optional',
    csrf: form.csrfProtection,
    honeypot: true,
    outputEscaping: true,
    rateLimit: true,
    serverFileRevalidation: true,
    serverInputValidation: true,
  }
}
