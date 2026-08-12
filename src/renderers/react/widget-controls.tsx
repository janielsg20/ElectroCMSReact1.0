import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'

const fieldClass = 'grid min-w-0 gap-1.5 text-sm text-foreground'
const labelClass = 'text-xs font-semibold leading-4 text-muted-foreground'
const inputClass = 'min-h-11 w-full min-w-0 appearance-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground hover:border-primary/35 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55'
const buttonClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-primary-strong hover:bg-primary-strong active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45'

export interface WidgetInputFieldProps {
  readonly label: string
  readonly name?: string
  readonly defaultValue?: string | number
  readonly required?: boolean
  readonly disabled?: boolean
  readonly type?: InputHTMLAttributes<HTMLInputElement>['type']
  readonly inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  readonly placeholder?: string
}

export function WidgetInputField({ label, name, defaultValue = '', required = false, disabled = false, type = 'text', inputMode, placeholder }: WidgetInputFieldProps) {
  const id = useId()
  return (
    <label className={fieldClass} htmlFor={id} data-electrocms-widget-control="field">
      <span className={labelClass}>{label}{required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}</span>
      <input className={inputClass} defaultValue={defaultValue} disabled={disabled} id={id} inputMode={inputMode} name={name || undefined} placeholder={placeholder} required={required} type={type} />
    </label>
  )
}

export interface WidgetTextAreaProps {
  readonly label: string
  readonly name?: string
  readonly defaultValue?: string
  readonly required?: boolean
  readonly rows?: number
  readonly disabled?: boolean
}

export function WidgetTextArea({ label, name, defaultValue = '', required = false, rows = 4, disabled = false }: WidgetTextAreaProps) {
  const id = useId()
  return (
    <label className={fieldClass} htmlFor={id} data-electrocms-widget-control="textarea">
      <span className={labelClass}>{label}{required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}</span>
      <textarea className={`${inputClass} min-h-28 resize-y`} defaultValue={defaultValue} disabled={disabled} id={id} name={name || undefined} required={required} rows={rows} />
    </label>
  )
}

export interface WidgetSelectProps {
  readonly label: string
  readonly name?: string
  readonly options: readonly string[]
  readonly defaultValue?: string
  readonly placeholder?: string
  readonly required?: boolean
  readonly disabled?: boolean
}

export function WidgetSelect({ label, name, options, defaultValue = '', placeholder = 'Seleccionar', required = false, disabled = false }: WidgetSelectProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.indexOf(defaultValue)))
  const listboxId = `${id}-listbox`

  useEffect(() => {
    if (!open) return
    function closeOutside(event: globalThis.PointerEvent): void {
      const target = event.target
      if (target instanceof Node && !rootRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  function choose(index: number): void {
    const option = options[index]
    if (option === undefined) return
    setValue(option)
    setActiveIndex(index)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'Escape') {
      if (open) event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(Math.max(0, options.indexOf(value)))
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (current + direction + options.length) % Math.max(options.length, 1))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (!open || options.length === 0) return
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(activeIndex)
      else setOpen(true)
    }
  }

  return (
    <div className={fieldClass} data-electrocms-widget-control="select" ref={rootRef}>
      <label className={labelClass} htmlFor={id}>{label}{required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}</label>
      <div className="relative min-w-0">
        <button
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-required={required || undefined}
          className={`${inputClass} flex cursor-pointer items-center justify-between gap-2 text-left ${open ? 'border-focus ring-2 ring-focus/25' : ''}`}
          disabled={disabled}
          id={id}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleKeyDown}
          role="combobox"
          type="button"
        >
          <span className={`min-w-0 flex-1 truncate ${value ? '' : 'text-muted-foreground'}`}>{value || placeholder}</span>
          <svg aria-hidden="true" className={`size-4 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
        </button>
        {open ? (
          <div aria-label={label} className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-xl" id={listboxId} role="listbox">
            {options.map((option, index) => (
              <button
                aria-selected={option === value}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded px-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${index === activeIndex ? 'bg-muted' : 'hover:bg-muted/70'} ${option === value ? 'font-semibold text-primary-strong' : 'text-foreground'}`}
                key={`${option}-${index}`}
                onClick={() => choose(index)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                tabIndex={-1}
                type="button"
              >
                <span className="truncate">{option}</span>
                {option === value ? <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 16 16"><path d="m3.5 8.2 2.8 2.8 6.2-6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {name ? <input name={name} type="hidden" value={value} /> : null}
    </div>
  )
}

interface ChoiceGroupProps {
  readonly label: string
  readonly name?: string
  readonly options: readonly string[]
  readonly defaultValue?: string
  readonly defaultSelected?: readonly string[]
  readonly multiple?: boolean
}

export function WidgetChoiceGroup({ label, name, options, defaultValue = '', defaultSelected = [], multiple = false }: ChoiceGroupProps) {
  const [radioValue, setRadioValue] = useState(defaultValue)
  const [selected, setSelected] = useState<readonly string[]>(defaultSelected)

  function toggle(option: string): void {
    setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])
  }

  function handleRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || options.length === 0) return
    event.preventDefault()
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
    const next = options[nextIndex]
    if (next === undefined) return
    setRadioValue(next)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus()
  }

  return (
    <fieldset className="grid min-w-0 gap-2 rounded-md border border-border bg-surface p-3" data-electrocms-widget-control={multiple ? 'checkbox-group' : 'radio-group'}>
      <legend className="px-1 text-xs font-semibold text-muted-foreground">{label}</legend>
      <div className="grid gap-1.5" role={multiple ? 'group' : 'radiogroup'} aria-label={label}>
        {options.map((option, index) => {
          const checked = multiple ? selected.includes(option) : radioValue === option
          return (
            <button
              aria-checked={checked}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-left text-sm transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${checked ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:border-primary/35 hover:bg-muted/40'}`}
              key={`${option}-${index}`}
              onClick={() => multiple ? toggle(option) : setRadioValue(option)}
              onKeyDown={multiple ? undefined : (event) => handleRadioKeyDown(event, index)}
              role={multiple ? 'checkbox' : 'radio'}
              tabIndex={multiple || checked || (!radioValue && index === 0) ? 0 : -1}
              type="button"
            >
              <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center border ${multiple ? 'rounded' : 'rounded-full'} ${checked ? 'border-primary bg-primary' : 'border-border bg-surface'}`}>
                {checked ? multiple ? <svg className="size-3 text-on-primary" fill="none" viewBox="0 0 16 16"><path d="m3.5 8.2 2.8 2.8 6.2-6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> : <span className="size-2 rounded-full bg-on-primary" /> : null}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
            </button>
          )
        })}
      </div>
      {name ? multiple ? selected.map((option) => <input key={option} name={name} type="hidden" value={option} />) : <input name={name} type="hidden" value={radioValue} /> : null}
    </fieldset>
  )
}

interface WidgetCheckboxProps {
  readonly label: string
  readonly name?: string
  readonly defaultChecked?: boolean
  readonly required?: boolean
}

export function WidgetCheckbox({ label, name, defaultChecked = false, required = false }: WidgetCheckboxProps) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div data-electrocms-widget-control="checkbox">
      <button aria-checked={checked} aria-required={required || undefined} className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md border px-3 text-left text-sm transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${checked ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-foreground hover:border-primary/35 hover:bg-muted/40'}`} onClick={() => setChecked((current) => !current)} role="checkbox" type="button">
        <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center rounded border ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface'}`}>{checked ? <svg className="size-3" fill="none" viewBox="0 0 16 16"><path d="m3.5 8.2 2.8 2.8 6.2-6.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> : null}</span>
        <span>{label}{required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}</span>
      </button>
      {name && checked ? <input name={name} type="hidden" value="true" /> : null}
    </div>
  )
}

interface WidgetSwitchProps {
  readonly label: string
  readonly name?: string
  readonly defaultChecked?: boolean
}

export function WidgetSwitch({ label, name, defaultChecked = false }: WidgetSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div data-electrocms-widget-control="switch">
      <button aria-checked={checked} className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 text-left text-sm text-foreground transition-[background-color,border-color,box-shadow] duration-150 hover:border-primary/35 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => setChecked((current) => !current)} role="switch" type="button">
        <span className="font-medium">{label}</span>
        <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-150 ${checked ? 'border-primary bg-primary' : 'border-border bg-muted'}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? 'translate-x-[1.3rem]' : 'translate-x-0.5'}`} /></span>
      </button>
      {name ? <input name={name} type="hidden" value={checked ? 'true' : 'false'} /> : null}
    </div>
  )
}

interface WidgetRangeProps {
  readonly label: string
  readonly min: number
  readonly max: number
  readonly defaultValue: number
  readonly step?: number
  readonly name?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function WidgetRange({ label, min, max, defaultValue, step = 1, name }: WidgetRangeProps) {
  const safeMax = max > min ? max : min + 1
  const [value, setValue] = useState(() => clamp(defaultValue, min, safeMax))
  const percentage = ((value - min) / (safeMax - min)) * 100

  function commit(next: number): void {
    setValue(clamp(Math.round(next / step) * step, min, safeMax))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    const largeStep = Math.max(step, (safeMax - min) / 10)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); commit(value - step) }
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); commit(value + step) }
    else if (event.key === 'PageDown') { event.preventDefault(); commit(value - largeStep) }
    else if (event.key === 'PageUp') { event.preventDefault(); commit(value + largeStep) }
    else if (event.key === 'Home') { event.preventDefault(); commit(min) }
    else if (event.key === 'End') { event.preventDefault(); commit(safeMax) }
  }

  function handlePointer(event: PointerEvent<HTMLButtonElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect()
    if (bounds.width <= 0) return
    const ratio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1)
    commit(min + ratio * (safeMax - min))
  }

  return (
    <div className={fieldClass} data-electrocms-widget-control="range">
      <span className="flex items-center justify-between gap-2"><span className={labelClass}>{label}</span><output className="rounded bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">{value}</output></span>
      <button aria-label={label} aria-valuemax={safeMax} aria-valuemin={min} aria-valuenow={value} className="relative h-11 w-full cursor-pointer touch-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onKeyDown={handleKeyDown} onPointerDown={handlePointer} role="slider" type="button">
        <span aria-hidden="true" className="absolute left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></span>
        <span aria-hidden="true" className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-surface shadow" style={{ left: `calc(0.5rem + (100% - 1rem) * ${percentage / 100})` }} />
      </button>
      {name ? <input name={name} type="hidden" value={value} /> : null}
    </div>
  )
}

interface WidgetDateTimeFieldProps {
  readonly label: string
  readonly name?: string
  readonly defaultValue?: string
  readonly kind: 'date' | 'time'
  readonly required?: boolean
}

export function WidgetDateTimeField({ label, name, defaultValue = '', kind, required = false }: WidgetDateTimeFieldProps) {
  return <WidgetInputField defaultValue={defaultValue} inputMode="numeric" label={label} name={name} placeholder={kind === 'date' ? 'AAAA-MM-DD' : 'HH:MM'} required={required} type="text" />
}

interface WidgetFileFieldProps {
  readonly label: string
  readonly name?: string
  readonly accept?: string
  readonly required?: boolean
}

export function WidgetFileField({ label, name, accept, required = false }: WidgetFileFieldProps) {
  const id = useId()
  const [fileName, setFileName] = useState('Ningún archivo seleccionado')
  return (
    <div className={fieldClass} data-electrocms-widget-control="file">
      <span className={labelClass}>{label}{required ? <span aria-hidden="true" className="ml-1 text-destructive">*</span> : null}</span>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/35 hover:bg-muted/40 focus-within:ring-2 focus-within:ring-focus" htmlFor={id}>
        <span className="inline-flex min-h-8 shrink-0 items-center rounded border border-border bg-muted px-2 text-xs font-semibold">Elegir archivo</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{fileName}</span>
        <input accept={accept} className="sr-only" id={id} name={name || undefined} onChange={(event) => setFileName(event.target.files?.[0]?.name ?? 'Ningún archivo seleccionado')} required={required} type="file" />
      </label>
    </div>
  )
}

interface WidgetButtonProps {
  readonly children: ReactNode
  readonly disabled?: boolean
  readonly type?: 'button' | 'submit' | 'reset'
  readonly describedBy?: string
}

export function WidgetButton({ children, disabled = false, type = 'button', describedBy }: WidgetButtonProps) {
  return <button aria-describedby={describedBy} className={buttonClass} data-electrocms-widget-control="button" disabled={disabled} type={type}>{children}</button>
}

export function WidgetList({ items, label }: { readonly items: readonly string[]; readonly label?: string }) {
  return (
    <div aria-label={label} className="grid gap-1.5" data-electrocms-widget-control="list" role="list">
      {items.map((item, index) => <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground" key={`${item}-${index}`} role="listitem"><span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /><span>{item}</span></div>)}
    </div>
  )
}
