import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'

const baseControlClass = 'min-h-11 min-w-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm leading-5 text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55 lg:min-h-8 lg:px-2 lg:py-0.5 lg:text-xs lg:leading-4'
const compactControlClass = 'min-h-9 min-w-0 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:border-primary/30 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55'

export type ControlSize = 'default' | 'compact'

function controlClass(size: ControlSize): string {
  return size === 'compact' ? compactControlClass : baseControlClass
}

interface FieldMetaProps {
  readonly id: string
  readonly label: string
  readonly labelHidden?: boolean
  readonly hint?: string
  readonly error?: string
  readonly required?: boolean
}

function FieldMeta({ id, label, labelHidden = false, hint, error, required }: FieldMetaProps) {
  return (
    <>
      <label className={labelHidden ? 'sr-only' : 'text-xs font-semibold leading-4 text-muted-foreground'} htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}
      </label>
      {hint ? <p className="text-xs leading-4 text-muted-foreground" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <p className="text-xs font-medium leading-4 text-destructive" id={`${id}-error`} role="alert">{error}</p> : null}
    </>
  )
}

function describedBy(id: string, hint?: string, error?: string, external?: string): string | undefined {
  return [external, hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined
}

export interface ControlInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly controlSize?: ControlSize
}

export function ControlInput({ className = '', controlSize = 'default', type = 'text', ...props }: ControlInputProps) {
  return <input {...props} className={`${controlClass(controlSize)} appearance-none ${className}`} type={type} />
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly labelHidden?: boolean
  readonly controlSize?: ControlSize
}

export function TextArea({ id, label, error, hint, labelHidden = false, controlSize = 'default', className = '', required, ...props }: TextAreaProps) {
  const generatedId = useId()
  const areaId = id ?? generatedId
  const ariaDescription = describedBy(areaId, hint, error, props['aria-describedby'])

  return (
    <div className="grid min-w-0 gap-1">
      <label className={labelHidden ? 'sr-only' : 'text-xs font-semibold leading-4 text-muted-foreground'} htmlFor={areaId}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}
      </label>
      <textarea
        {...props}
        aria-describedby={ariaDescription}
        aria-invalid={error ? true : undefined}
        className={`${controlClass(controlSize)} min-h-20 resize-y appearance-none ${error ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20' : ''} ${className}`}
        id={areaId}
        required={required}
      />
      {hint ? <p className="text-xs leading-4 text-muted-foreground" id={`${areaId}-hint`}>{hint}</p> : null}
      {error ? <p className="text-xs font-medium leading-4 text-destructive" id={`${areaId}-error`} role="alert">{error}</p> : null}
    </div>
  )
}

export interface SelectOption {
  readonly value: string
  readonly label: string
  readonly disabled?: boolean
}

export interface SelectProps {
  readonly id?: string
  readonly label: string
  readonly labelHidden?: boolean
  readonly value: string
  readonly options: readonly SelectOption[]
  readonly onValueChange: (value: string) => void
  readonly disabled?: boolean
  readonly required?: boolean
  readonly hint?: string
  readonly error?: string
  readonly className?: string
  readonly controlSize?: ControlSize
  readonly placeholder?: string
  readonly ariaDescribedBy?: string
}

export function Select({
  id,
  label,
  labelHidden = false,
  value,
  options,
  onValueChange,
  disabled = false,
  required = false,
  hint,
  error,
  className = '',
  controlSize = 'default',
  placeholder = 'Seleccionar',
  ariaDescribedBy,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(selectedIndex, 0))
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const ariaDescription = describedBy(selectId, hint, error, ariaDescribedBy)

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePointer(event: PointerEvent): void {
      const target = event.target
      if (target instanceof Node && !rootRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => {
    if (open) setActiveIndex(Math.max(selectedIndex, 0))
  }, [open, selectedIndex])

  function enabledIndex(start: number, direction: -1 | 1): number {
    if (options.length === 0) return -1
    for (let offset = 0; offset < options.length; offset += 1) {
      const index = (start + direction * offset + options.length) % options.length
      if (!options[index]?.disabled) return index
    }
    return -1
  }

  function moveActive(direction: -1 | 1): void {
    if (options.length === 0) return
    const start = activeIndex < 0 ? (direction === 1 ? 0 : options.length - 1) : activeIndex + direction
    const next = enabledIndex(start, direction)
    if (next >= 0) setActiveIndex(next)
  }

  function choose(index: number): void {
    const option = options[index]
    if (!option || option.disabled) return
    onValueChange(option.value)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) return
    if (event.key === 'Escape') {
      if (open) event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(Math.max(selectedIndex, 0))
      } else moveActive(event.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return
      event.preventDefault()
      const start = event.key === 'Home' ? 0 : options.length - 1
      const next = enabledIndex(start, event.key === 'Home' ? 1 : -1)
      if (next >= 0) setActiveIndex(next)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(activeIndex)
      else setOpen(true)
    }
  }

  return (
    <div className="grid min-w-0 gap-1" ref={rootRef}>
      <label className={labelHidden ? 'sr-only' : 'text-xs font-semibold leading-4 text-muted-foreground'} htmlFor={selectId}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}
      </label>
      <div className="relative min-w-0">
        <button
          aria-controls={listboxId}
          aria-describedby={ariaDescription}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className={`${controlClass(controlSize)} flex w-full cursor-pointer items-center justify-between gap-2 text-left ${open ? 'border-focus ring-2 ring-focus/25' : ''} ${error ? 'border-destructive' : ''} ${className}`}
          data-electrocms-control="select"
          disabled={disabled}
          id={selectId}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleKeyDown}
          role="combobox"
          type="button"
        >
          <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-muted-foreground'}`}>{selected?.label ?? placeholder}</span>
          <svg aria-hidden="true" className={`size-3.5 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 16 16">
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </button>
        {open ? (
          <div
            aria-label={label}
            className="absolute z-[100] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-xl"
            id={listboxId}
            role="listbox"
          >
            {options.map((option, index) => (
              <button
                aria-selected={option.value === value}
                className={`flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded px-2 text-left text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${index === activeIndex ? 'bg-muted' : 'hover:bg-muted/70'} ${option.value === value ? 'font-bold text-primary-strong' : 'text-foreground'} disabled:cursor-not-allowed disabled:opacity-45`}
                disabled={option.disabled}
                key={option.value}
                onClick={() => choose(index)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                tabIndex={-1}
                type="button"
              >
                <span className="truncate">{option.label}</span>
                {option.value === value ? (
                  <svg aria-hidden="true" className="size-3.5 shrink-0" fill="none" viewBox="0 0 16 16">
                    <path d="m3.5 8.2 2.8 2.8 6.2-6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {hint ? <p className="text-xs leading-4 text-muted-foreground" id={`${selectId}-hint`}>{hint}</p> : null}
      {error ? <p className="text-xs font-medium leading-4 text-destructive" id={`${selectId}-error`} role="alert">{error}</p> : null}
    </div>
  )
}

export interface CheckboxProps {
  readonly id?: string
  readonly label: string
  readonly checked: boolean
  readonly onCheckedChange: (checked: boolean) => void
  readonly disabled?: boolean
  readonly description?: string
  readonly className?: string
}

export function Checkbox({ id, label, checked, onCheckedChange, disabled = false, description, className = '' }: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  return (
    <button
      aria-checked={checked}
      aria-describedby={description ? `${checkboxId}-description` : undefined}
      className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-left text-xs text-foreground transition-[background-color,border-color,box-shadow] duration-150 hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-45 lg:min-h-9 ${className}`}
      data-electrocms-control="checkbox"
      disabled={disabled}
      id={checkboxId}
      onClick={() => onCheckedChange(!checked)}
      role="checkbox"
      type="button"
    >
      <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded border transition-colors duration-150 ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface'}`}>
        {checked ? <svg className="size-3" fill="none" viewBox="0 0 16 16"><path d="m3.5 8.2 2.8 2.8 6.2-6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> : null}
      </span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span>{description ? <span className="block text-[0.625rem] leading-4 text-muted-foreground" id={`${checkboxId}-description`}>{description}</span> : null}</span>
    </button>
  )
}

export interface SwitchProps extends Omit<CheckboxProps, 'onCheckedChange'> {
  readonly onCheckedChange: (checked: boolean) => void
}

export function Switch({ id, label, checked, onCheckedChange, disabled = false, description, className = '' }: SwitchProps) {
  const generatedId = useId()
  const switchId = id ?? generatedId
  return (
    <button
      aria-checked={checked}
      aria-describedby={description ? `${switchId}-description` : undefined}
      className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 text-left text-xs text-foreground transition-[background-color,border-color,box-shadow] duration-150 hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-45 lg:min-h-9 ${className}`}
      data-electrocms-control="switch"
      disabled={disabled}
      id={switchId}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span>{description ? <span className="block text-[0.625rem] leading-4 text-muted-foreground" id={`${switchId}-description`}>{description}</span> : null}</span>
      <span aria-hidden="true" className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 ${checked ? 'border-primary bg-primary' : 'border-border bg-muted'}`}>
        <span className={`absolute top-0.5 size-3.5 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}

export interface RadioOption {
  readonly value: string
  readonly label: string
  readonly description?: string
  readonly disabled?: boolean
}

export interface RadioGroupProps {
  readonly label: string
  readonly value: string
  readonly options: readonly RadioOption[]
  readonly onValueChange: (value: string) => void
  readonly disabled?: boolean
  readonly className?: string
}

export function RadioGroup({ label, value, options, onValueChange, disabled = false, className = '' }: RadioGroupProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
    let nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : index + direction
    for (let count = 0; count < options.length; count += 1) {
      nextIndex = (nextIndex + options.length) % options.length
      const option = options[nextIndex]
      if (option && !option.disabled) {
        onValueChange(option.value)
        event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-radio-value="${CSS.escape(option.value)}"]`)?.focus()
        break
      }
      nextIndex += direction
    }
  }

  return (
    <div className={`grid gap-1 ${className}`}>
      <span className="text-xs font-semibold leading-4 text-muted-foreground">{label}</span>
      <div aria-label={label} className="grid gap-1" role="radiogroup">
        {options.map((option, index) => {
          const selected = option.value === value
          return (
            <button
              aria-checked={selected}
              className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-2 text-left text-xs transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:border-primary/30 hover:bg-muted/40'} disabled:cursor-not-allowed disabled:opacity-45`}
              data-electrocms-control="radio"
              data-radio-value={option.value}
              disabled={disabled || option.disabled}
              key={option.value}
              onClick={() => onValueChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              role="radio"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded-full border ${selected ? 'border-primary' : 'border-border'}`}><span className={`size-2 rounded-full transition-colors duration-150 ${selected ? 'bg-primary' : 'bg-transparent'}`} /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{option.label}</span>{option.description ? <span className="block text-[0.625rem] leading-4 text-muted-foreground">{option.description}</span> : null}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface ControlGroupProps {
  readonly label?: string
  readonly children: ReactNode
  readonly className?: string
}

export function ControlGroup({ label, children, className = '' }: ControlGroupProps) {
  return <div className={`rounded-md border border-border bg-surface p-2 ${className}`}>{label ? <p className="mb-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p> : null}{children}</div>
}
