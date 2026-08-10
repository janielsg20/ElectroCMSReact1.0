import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize = 'small' | 'medium' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly isLoading?: boolean
  readonly loadingLabel?: string
  readonly size?: ButtonSize
  readonly children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-primary bg-primary text-on-primary hover:border-primary-strong hover:bg-primary-strong',
  secondary: 'border-border bg-surface text-foreground hover:border-primary/35 hover:bg-muted',
  destructive: 'border-destructive bg-destructive text-on-destructive hover:brightness-95',
  ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted hover:text-primary-strong',
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'min-h-11 px-2.5 py-1.5 text-xs lg:min-h-8 lg:px-1.5 lg:py-0.5',
  medium: 'min-h-11 px-3 py-1.5 text-xs lg:min-h-8 lg:px-2 lg:py-0.5',
  icon: 'size-11 shrink-0 p-0 lg:size-8',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  loadingLabel = 'Procesando',
  size = 'medium',
  className = '',
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={isLoading || undefined}
      className={`inline-flex cursor-pointer touch-manipulation items-center justify-center gap-1 rounded-md border font-semibold leading-4 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      type={type}
    >
      {isLoading ? (
        <>
          <svg aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" fill="none" r="9" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
          </svg>
          <span>{loadingLabel}</span>
        </>
      ) : children}
    </button>
  )
}
