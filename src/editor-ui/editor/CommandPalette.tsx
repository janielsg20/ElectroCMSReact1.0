import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Icon } from '../primitives'
import { navigationItems, type NavigationSectionId } from './editor-data'

interface CommandPaletteProps {
  readonly onNavigate: (section: NavigationSectionId) => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    if (!normalized) return navigationItems
    return navigationItems.filter((item) => `${item.label} ${item.description} ${item.group}`.toLocaleLowerCase('es').includes(normalized))
  }, [query])
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, results.length - 1))

  function close(restoreFocus = true): void {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function choose(section: NavigationSectionId): void {
    onNavigate(section)
    close(false)
  }

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    function handleGlobalShortcut(event: globalThis.KeyboardEvent): void {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
        return
      }
      if (isEditableTarget(event.target)) return
      if (!event.altKey || !event.shiftKey) return
      const shortcutSection: NavigationSectionId | null = key === 'e' ? 'editor' : key === 'h' ? 'dashboard' : key === 'p' ? 'pages' : null
      if (!shortcutSection) return
      event.preventDefault()
      onNavigate(shortcutSection)
    }

    window.addEventListener('keydown', handleGlobalShortcut)
    return () => window.removeEventListener('keydown', handleGlobalShortcut)
  }, [onNavigate])

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => {
        const bounded = Math.min(current, results.length - 1)
        return (bounded + direction + results.length) % results.length
      })
      return
    }
    if (event.key === 'Enter' && document.activeElement === inputRef.current) {
      const item = results[safeActiveIndex]
      if (!item) return
      event.preventDefault()
      choose(item.id)
      return
    }
    if (event.key !== 'Tab') return
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir paleta de comandos"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-2 z-30 inline-flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-md transition-colors hover:border-primary/35 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:bottom-8 lg:min-h-8 lg:px-1.5 lg:py-0.5"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <Icon name="search" size={14} />
        <span>Comandos</span>
        <kbd className="hidden rounded border border-border bg-canvas px-1 text-[0.5625rem] text-muted-foreground sm:inline">Ctrl/⌘ K</kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-start bg-slate-950/45 px-2 pt-[max(4rem,12vh)] backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
          <div aria-label="Paleta de comandos" aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-lg" onKeyDown={handleDialogKeyDown} role="dialog">
            <div className="flex items-center gap-2 border-b border-border p-2">
              <Icon className="shrink-0 text-primary" name="search" size={16} />
              <input
                aria-activedescendant={results[safeActiveIndex] ? `command-${results[safeActiveIndex]?.id}` : undefined}
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                aria-label="Buscar comando"
                className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }}
                placeholder="Ir a Editor, Páginas, Contenido…"
                ref={inputRef}
                role="combobox"
                value={query}
              />
              <Button aria-label="Cerrar paleta de comandos" onClick={() => close()} size="icon" variant="ghost"><Icon name="close" size={15} /></Button>
            </div>

            <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-1.5" id="command-palette-results" role="listbox">
              {results.length > 0 ? results.map((item, index) => (
                <button
                  aria-selected={index === safeActiveIndex}
                  className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left ${index === safeActiveIndex ? 'bg-primary-soft text-primary-strong' : 'text-foreground hover:bg-muted'}`}
                  id={`command-${item.id}`}
                  key={item.id}
                  onClick={() => choose(item.id)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded border border-border bg-canvas text-primary"><Icon name={item.icon} size={14} /></span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-xs">Ir a {item.label}</strong><span className="block truncate text-[0.625rem] text-muted-foreground">{item.group} · {item.description}</span></span>
                  <span className="text-[0.5625rem] font-bold uppercase text-muted-foreground">{item.phase}</span>
                </button>
              )) : <p className="px-3 py-8 text-center text-xs text-muted-foreground">No hay comandos que coincidan con “{query}”.</p>}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-muted/40 px-3 py-2 text-[0.625rem] text-muted-foreground">
              <span><kbd>↑↓</kbd> seleccionar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> cerrar</span><span><kbd>Alt+Shift+E</kbd> Editor</span><span><kbd>Alt+Shift+H</kbd> Inicio</span><span><kbd>Alt+Shift+P</kbd> Páginas</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
