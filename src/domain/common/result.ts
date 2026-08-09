export type Result<TValue, TError> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError }

export function success<TValue>(value: TValue): Result<TValue, never> {
  return { ok: true, value }
}

export function failure<TError>(error: TError): Result<never, TError> {
  return { ok: false, error }
}

export function mapResult<TValue, TNext, TError>(
  result: Result<TValue, TError>,
  transform: (value: TValue) => TNext,
): Result<TNext, TError> {
  return result.ok ? success(transform(result.value)) : result
}
