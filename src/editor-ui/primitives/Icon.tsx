type IconName = 'arrow-right' | 'check' | 'close'

export interface IconProps {
  readonly name: IconName
  readonly label?: string
  readonly size?: 16 | 20 | 24
  readonly className?: string
}

const paths: Record<IconName, string> = {
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  check: 'm5 12 4 4L19 6',
  close: 'M6 6l12 12M18 6 6 18',
}

export function Icon({ name, label, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      fill="none"
      focusable="false"
      height={size}
      role={label ? 'img' : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={paths[name]} />
    </svg>
  )
}
