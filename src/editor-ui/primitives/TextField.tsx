import { useId, type InputHTMLAttributes } from 'react'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly label: string
  readonly error?: string
  readonly hint?: string
}

export function TextField({ id, label, error, hint, className = '', required, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="grid gap-1.5">
      <label className="font-medium text-foreground" htmlFor={inputId}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}
      </label>
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`min-h-11 rounded-lg border bg-surface px-3 py-2 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/35 disabled:cursor-not-allowed disabled:opacity-45 ${error ? 'border-destructive' : 'border-border'} ${className}`}
        id={inputId}
        required={required}
      />
      {hint ? <p className="text-sm leading-5 text-muted-foreground" id={hintId}>{hint}</p> : null}
      {error ? <p className="text-sm font-medium leading-5 text-destructive" id={errorId} role="alert">{error}</p> : null}
    </div>
  )
}
