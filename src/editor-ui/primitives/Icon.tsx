export type IconName =
  | 'arrow-right'
  | 'button'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'code'
  | 'columns'
  | 'content'
  | 'cursor'
  | 'desktop'
  | 'dock-left'
  | 'dock-right'
  | 'editor'
  | 'eye'
  | 'form'
  | 'heading'
  | 'image'
  | 'layers'
  | 'lock'
  | 'menu'
  | 'minus'
  | 'mobile'
  | 'moon'
  | 'more'
  | 'palette'
  | 'panel-left'
  | 'pin'
  | 'play'
  | 'plus'
  | 'redo'
  | 'resize'
  | 'search'
  | 'settings'
  | 'sparkles'
  | 'sun'
  | 'tablet'
  | 'text'
  | 'undo'
  | 'upload'
  | 'users'
  | 'window'
  | 'move'

export interface IconProps {
  readonly name: IconName
  readonly label?: string
  readonly size?: number
  readonly className?: string
}

const paths: Record<IconName, string> = {
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  button: 'M5 8h14v8H5zM8 12h8',
  check: 'm5 12 4 4L19 6',
  'chevron-down': 'm7 9 5 5 5-5',
  close: 'M6 6l12 12M18 6 6 18',
  code: 'm9 18-6-6 6-6m6 0 6 6-6 6',
  columns: 'M4 5h16v14H4zM12 5v14',
  content: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  cursor: 'm5 3 12 9-6 1-3 6z',
  desktop: 'M3 5h18v12H3zM8 21h8M12 17v4',
  'dock-left': 'M3 4h18v16H3zM9 4v16M5.5 8h1M5.5 12h1M5.5 16h1',
  'dock-right': 'M3 4h18v16H3zM15 4v16M17.5 8h1M17.5 12h1M17.5 16h1',
  editor: 'M4 4h16v16H4zM8 8h8M8 12h5M8 16h7',
  eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12zm9.5-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  form: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h4',
  heading: 'M5 5v14M19 5v14M5 12h14',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01',
  layers: 'm12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  lock: 'M6 10h12v10H6zM8 10V7a4 4 0 0 1 8 0v3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  minus: 'M5 12h14',
  mobile: 'M7 2h10v20H7zM11 18h2',
  moon: 'M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  palette: 'M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4 9 9 0 0 0 0-5zM7.5 10h.01M10 6.5h.01M15 7h.01M17 11h.01',
  'panel-left': 'M3 4h18v16H3zM9 4v16',
  pin: 'm9 3 6 6-2 2 3 3-2 2-3-3-4 4-1-1 4-4-3-3zM5 19l-2 2',
  play: 'm8 5 11 7-11 7z',
  plus: 'M12 5v14M5 12h14',
  redo: 'M20 7h-7a6 6 0 0 0-6 6v4m13-10-4-4m4 4-4 4',
  resize: 'M8 20 20 8M14 20l6-6M18 20l2-2',
  search: 'm21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.9 4.9l2 2M17.1 17.1l2 2M19.1 4.9l-2 2M6.9 17.1l-2 2M2 12h3M19 12h3M12 2v3M12 19v3',
  sparkles: 'm12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  tablet: 'M5 3h14v18H5zM10 17h4',
  text: 'M5 6h14M12 6v12M8 18h8',
  undo: 'M4 7h7a6 6 0 0 1 6 6v4M4 7l4-4M4 7l4 4',
  upload: 'M12 16V4m-5 5 5-5 5 5M5 20h14',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  window: 'M3 5h18v14H3zM3 9h18M6 7h.01M9 7h.01',
  move: 'M12 2v20M2 12h20m-4-4 4 4-4 4M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4',
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
