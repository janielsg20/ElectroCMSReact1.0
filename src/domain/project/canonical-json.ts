import type * as z from 'zod'
import { failure, success, type Result } from '../common/result'
import { JsonValueSchema, type JsonValue } from './project-envelope'

export interface ValidationIssue {
  readonly code: string
  readonly message: string
  readonly path: readonly PropertyKey[]
}

export type CanonicalJsonError =
  | {
      readonly kind: 'invalid-json'
      readonly message: string
    }
  | {
      readonly kind: 'invalid-value'
      readonly issues: readonly ValidationIssue[]
    }

function stringifyCanonicalValue(value: JsonValue): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stringifyCanonicalValue).join(',')}]`
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stringifyCanonicalValue(value[key])}`)
    .join(',')}}`
}

function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map(({ code, message, path }) => ({ code, message, path }))
}

export function serializeCanonical<TValue>(
  schema: z.ZodType<TValue>,
  input: unknown,
): Result<string, CanonicalJsonError> {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return failure({ kind: 'invalid-value', issues: toValidationIssues(parsed.error) })
  }

  const jsonValue = JsonValueSchema.safeParse(parsed.data)

  if (!jsonValue.success) {
    return failure({ kind: 'invalid-value', issues: toValidationIssues(jsonValue.error) })
  }

  return success(stringifyCanonicalValue(jsonValue.data))
}

export function deserializeCanonical<TValue>(
  schema: z.ZodType<TValue>,
  serialized: string,
): Result<TValue, CanonicalJsonError> {
  let input: unknown

  try {
    input = JSON.parse(serialized) as unknown
  } catch {
    return failure({ kind: 'invalid-json', message: 'El documento no contiene JSON válido.' })
  }

  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return failure({ kind: 'invalid-value', issues: toValidationIssues(parsed.error) })
  }

  const jsonValue = JsonValueSchema.safeParse(parsed.data)

  if (!jsonValue.success) {
    return failure({ kind: 'invalid-value', issues: toValidationIssues(jsonValue.error) })
  }

  return success(parsed.data)
}
