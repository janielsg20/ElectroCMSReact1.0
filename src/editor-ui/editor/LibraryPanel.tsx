import { useDeferredValue, useMemo, useState } from 'react'
import { createCompleteWidgetRegistry, type WidgetCategory, type WidgetDefinition } from '../../domain'
import { Icon } from '../primitives'
import { CanonicalLayerTree } from './CanonicalLayerTree'
import { ContentTypeManager } from './ContentTypeManager'
import { ProjectDesignPanel } from './ProjectDesignPanel'
import { TemplateManager } from './TemplateManager'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId } from './editor-project-context'
import { WidgetLibraryCard } from './WidgetLibraryCard'
import { useWidgetLibrary, type WidgetLibrarySource } from './widget-library-context'
import type { SavedWidgetPreset } from './widget-library-preferences'

export type LibraryTab = 'widgets' | 'layers' | 'templates' | 'themes' | 'content'
type LibraryScope = 'all' | 'favorites' | 'recent' | 'saved'

interface LibraryPanelProps {
  readonly activeTab: LibraryTab
  readonly onTabChange: (tab: LibraryTab) => void
  readonly className?: string
}

interface LibraryItem {
  readonly definition: WidgetDefinition
  readonly description: string
  readonly key: string
  readonly label: string
  readonly preset?: SavedWidgetPreset
  readonly source: WidgetLibrarySource
}

const widgetDefinitions = createCompleteWidgetRegistry().list()
const definitionById = new Map(widgetDefinitions.map((definition) => [definition.id, definition]))

const categoryLabels: Record<WidgetCategory, string> = {
  structure: 'Estructura',
  basic: 'Básicos',
  content: 'Contenido',
  dynamic: 'Dinámicos',
  commerce: 'Comercio',
  forms: 'Formularios',
  filters: 'Filtros',
}

const scopeLabels: Record<LibraryScope, string> = {
  all: 'Todos',
  favorites: 'Favoritos',
  recent: 'Recientes',
  saved: 'Guardados',
}

function definitionItem(definition: WidgetDefinition): LibraryItem {
  return {
    definition,
    description: definition.description,
    key: definition.id,
    label: definition.label,
    source: { kind: 'definition', widgetId: definition.id },
  }
}

function savedItem(preset: SavedWidgetPreset): LibraryItem | null {
  const definition = definitionById.get(preset.widgetType)
  return definition ? {
    definition,
    description: `Preset local de ${definition.label}. Conserva contenido, estilos y overrides responsive.`,
    key: preset.id,
    label: preset.label,
    preset,
    source: { kind: 'saved', presetId: preset.id },
  } : null
}

function PrimaryTab({
  active,
  controls,
  icon,
  id,
  label,
  compactLabel = label,
  onClick,
}: {
  readonly active: boolean
  readonly controls: string
  readonly icon: 'layers' | 'columns' | 'content' | 'palette' | 'database'
  readonly id: string
  readonly label: string
  readonly compactLabel?: string
  readonly onClick: () => void
}) {
  return (
    <button
      aria-controls={controls}
      aria-label={label}
      aria-selected={active}
      className={`library-primary-tab flex min-h-11 min-w-0 cursor-pointer items-center justify-center gap-1 rounded px-1 text-[0.6875rem] font-bold text-primary transition-colors active:bg-primary/15 focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${active ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`}
      id={id}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon name={icon} size={13} />
      <span className="library-primary-tab__full truncate">{label}</span>
      <span aria-hidden="true" className="library-primary-tab__compact truncate">{compactLabel}</span>
    </button>
  )
}

export function LibraryPanel({ activeTab, onTabChange, className = '' }: LibraryPanelProps) {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const selectedNodeId = useEditorSelectedNodeId()
  const library = useWidgetLibrary()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [category, setCategory] = useState<WidgetCategory | 'all'>('all')
  const [scope, setScope] = useState<LibraryScope>('all')
  const document = structure.documents[session.documentId]
  const selectedNode = selectedNodeId && document ? document.nodes[selectedNodeId] : undefined
  const canSaveSelection = selectedNode?.kind === 'widget' && definitionById.has(selectedNode.widgetType)

  const visibleItems = useMemo(() => {
    let items: LibraryItem[]
    if (scope === 'saved') {
      items = library.preferences.savedWidgets.flatMap((preset) => {
        const item = savedItem(preset)
        return item ? [item] : []
      })
    } else {
      const definitions = scope === 'favorites'
        ? widgetDefinitions.filter((definition) => library.preferences.favoriteWidgetIds.includes(definition.id))
        : scope === 'recent'
          ? library.preferences.recentWidgetIds.flatMap((id) => {
              const definition = definitionById.get(id)
              return definition ? [definition] : []
            })
          : widgetDefinitions
      items = definitions.map(definitionItem)
    }
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase('es')
    return items.filter((item) => {
      if (category !== 'all' && item.definition.category !== category) return false
      if (!normalizedQuery) return true
      const haystack = `${item.label} ${item.description} ${item.definition.id} ${categoryLabels[item.definition.category]}`.toLocaleLowerCase('es')
      return haystack.includes(normalizedQuery)
    })
  }, [category, deferredQuery, library.preferences.favoriteWidgetIds, library.preferences.recentWidgetIds, library.preferences.savedWidgets, scope])

  return (
    <aside aria-label="Biblioteca y capas" className={`library-panel flex min-h-0 flex-col border-r border-border bg-surface ${className}`}>
      <div className="library-primary-tabs grid shrink-0 grid-cols-5 gap-0.5 border-b border-border bg-muted/60 p-1.5 lg:p-1" role="tablist" aria-label="Panel izquierdo">
        <PrimaryTab active={activeTab === 'layers'} compactLabel="Capas" controls="library-panel-layers" icon="layers" id="library-tab-layers" label="Capas" onClick={() => onTabChange('layers')} />
        <PrimaryTab active={activeTab === 'widgets'} compactLabel="Wdg" controls="library-panel-widgets" icon="columns" id="library-tab-widgets" label="Widgets" onClick={() => onTabChange('widgets')} />
        <PrimaryTab active={activeTab === 'templates'} compactLabel="Docs" controls="library-panel-templates" icon="content" id="library-tab-templates" label="Documentos" onClick={() => onTabChange('templates')} />
        <PrimaryTab active={activeTab === 'content'} compactLabel="Datos" controls="library-panel-content" icon="database" id="library-tab-content" label="Datos" onClick={() => onTabChange('content')} />
        <PrimaryTab active={activeTab === 'themes'} compactLabel="Diseño" controls="library-panel-themes" icon="palette" id="library-tab-themes" label="Diseño" onClick={() => onTabChange('themes')} />
      </div>

      {activeTab === 'widgets' ? (
        <div aria-labelledby="library-tab-widgets" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-1.5" id="library-panel-widgets" role="tabpanel">
          <div className="mb-2 flex items-start justify-between gap-1 lg:mb-1.5">
            <span className="min-w-0"><strong className="block text-xs leading-4 text-primary">Biblioteca</strong><span className="block text-[0.625rem] leading-4 text-muted-foreground">{widgetDefinitions.length} widgets registrados</span></span>
            <button aria-label="Guardar widget seleccionado" className="min-h-9 shrink-0 cursor-pointer rounded-md border border-border bg-surface px-2 text-[0.625rem] font-bold text-primary-strong hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSaveSelection} onClick={() => library.saveSelectedWidget()} type="button"><span className="inline-flex items-center gap-1"><Icon name="plus" size={11} />Guardar</span></button>
          </div>

          <label className="relative block">
            <span className="sr-only">Buscar widgets registrados</span>
            <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground lg:left-2.5" name="search" size={16} />
            <input aria-describedby="widget-search-status" className="min-h-11 w-full rounded-md border border-primary/30 bg-surface pl-9 pr-9 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, categoría o ID" type="search" value={query} />
            {query ? <button aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setQuery('')} type="button"><Icon name="close" size={12} /></button> : null}
          </label>

          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-1">
            <label className="min-w-0"><span className="sr-only">Filtrar por categoría</span><select className="min-h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-focus" onChange={(event) => setCategory(event.target.value as WidgetCategory | 'all')} value={category}><option value="all">Todas las categorías</option>{Object.entries(categoryLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <output className="grid min-h-9 min-w-9 place-items-center rounded-md border border-border bg-muted px-1 text-[0.625rem] font-bold text-muted-foreground" aria-label={`${visibleItems.length} elementos visibles`}>{visibleItems.length}</output>
          </div>

          <div aria-label="Filtros de biblioteca" className="mt-1.5 grid grid-cols-4 gap-0.5" role="group">
            {(Object.keys(scopeLabels) as LibraryScope[]).map((id) => <button aria-pressed={scope === id} className={`min-h-9 cursor-pointer truncate rounded px-1 text-[0.625rem] font-bold focus-visible:ring-2 focus-visible:ring-focus ${scope === id ? 'bg-primary text-on-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`} key={id} onClick={() => setScope(id)} type="button">{scopeLabels[id]}</button>)}
          </div>

          <p aria-live="polite" className="sr-only" id="widget-search-status">{visibleItems.length} widgets encontrados. {library.status}</p>
          {visibleItems.length > 0 ? (
            <ul className="widget-library-grid mt-2 grid gap-1.5 lg:mt-1.5">
              {visibleItems.map((item) => (
                <WidgetLibraryCard
                  definition={item.definition}
                  description={item.description}
                  favorite={library.preferences.favoriteWidgetIds.includes(item.definition.id)}
                  key={item.key}
                  label={item.label}
                  onInsert={() => { void library.insertSource(item.source) }}
                  onRemove={item.preset ? () => library.removeSaved(item.preset?.id ?? '') : undefined}
                  onToggleFavorite={item.preset ? undefined : () => library.toggleFavorite(item.definition.id)}
                  source={item.source}
                  subtitle={`${categoryLabels[item.definition.category]} · ${item.preset ? 'Preset local' : item.definition.id}`}
                />
              ))}
            </ul>
          ) : (
            <div className="widget-empty-state mt-2 grid place-items-center rounded-md border border-dashed border-border px-2 py-5 text-center">
              <Icon className="text-muted-foreground" name="search" size={18} />
              <p className="mt-2 text-xs font-semibold text-foreground">Sin elementos en este filtro</p>
              <button className="mt-2 min-h-9 cursor-pointer rounded-md border border-border bg-surface px-2 text-xs font-semibold text-primary-strong hover:bg-primary-soft" onClick={() => { setQuery(''); setCategory('all'); setScope('all') }} type="button">Mostrar todos</button>
            </div>
          )}
        </div>
      ) : activeTab === 'layers' ? (
        <div aria-labelledby="library-tab-layers" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="library-panel-layers" role="tabpanel">
          <section className="border-b border-border p-2 lg:p-1.5" aria-labelledby="document-title">
            <h2 className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground" id="document-title">Documento actual</h2>
            <div className="mt-1 flex min-h-9 items-center gap-1.5 rounded-md bg-primary-soft px-2 text-xs font-semibold text-primary-strong"><Icon name="editor" size={14} /><span className="truncate">{document?.name ?? 'Documento no disponible'}</span></div>
          </section>
          <section className="p-1.5 lg:p-1" aria-labelledby="layers-title">
            <h2 className="flex min-h-9 items-center gap-1 px-1 text-xs font-bold text-primary" id="layers-title"><Icon name="layers" size={13} />Árbol canónico</h2>
            <CanonicalLayerTree />
          </section>
        </div>
      ) : activeTab === 'templates' ? (
        <div aria-labelledby="library-tab-templates" className="min-h-0 flex-1" id="library-panel-templates" role="tabpanel"><TemplateManager /></div>
      ) : activeTab === 'content' ? (
        <div aria-labelledby="library-tab-content" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="library-panel-content" role="tabpanel"><ContentTypeManager /></div>
      ) : (
        <div aria-labelledby="library-tab-themes" className="min-h-0 flex-1" id="library-panel-themes" role="tabpanel"><ProjectDesignPanel /></div>
      )}
    </aside>
  )
}
