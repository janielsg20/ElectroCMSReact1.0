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
    <div className="grid min-w-0 gap-1">
      <label className="text-xs font-semibold leading-4 text-muted-foreground" htmlFor={inputId}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}
      </label>
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`min-h-11 min-w-0 rounded-md border bg-surface px-2.5 py-1.5 text-sm leading-5 text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55 lg:min-h-8 lg:px-2 lg:py-0.5 lg:text-xs lg:leading-4 ${error ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20' : 'border-border hover:border-primary/30'} ${className}`}
        id={inputId}
        required={required}
      />
      {hint ? <p className="text-xs leading-4 text-muted-foreground" id={hintId}>{hint}</p> : null}
      {error ? <p className="text-xs font-medium leading-4 text-destructive" id={errorId} role="alert">{error}</p> : null}
    </div>
  )
}
