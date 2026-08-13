import { useDeferredValue, useMemo, useState } from 'react'
import { createCompleteWidgetRegistry, type WidgetCategory, type WidgetDefinition } from '../../domain'
import { ChoiceField, HelpTip, Icon } from '../primitives'
import { CanonicalLayerTree } from './CanonicalLayerTree'
import { useEditorProject, useEditorProjectStructure, useEditorSelectedNodeId } from './editor-project-context'
import { WidgetLibraryCard } from './WidgetLibraryCard'
import { useWidgetLibrary, type WidgetLibrarySource } from './widget-library-context'
import type { SavedWidgetPreset } from './widget-library-preferences'

export type LibraryTab = 'widgets' | 'layers'
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

const categoryOptions = [
  { label: 'Todas las categorías', value: 'all', description: 'Muestra toda la biblioteca.' },
  ...Object.entries(categoryLabels).map(([value, label]) => ({ label, value, description: `Widgets de ${label.toLocaleLowerCase('es')}.` })),
]

const scopeLabels: Record<LibraryScope, string> = {
  all: 'Todos',
  favorites: 'Favoritos',
  recent: 'Recientes',
  saved: 'Guardados',
}

const categorySearchTerms: Record<WidgetCategory, string> = {
  structure: 'layout container contenedor section sección grid rejilla stack pila spacer espaciador divider divisor elementor flexbox',
  basic: 'heading título text texto image imagen button botón icon icono video elementor básicos',
  content: 'wordpress posts post entrada título contenido featured image imagen destacada author autor terms términos comments comentarios cms',
  dynamic: 'jetengine dynamic field campo dinámico dynamic image imagen dinámica listing listado repeater repetidor custom fields campos personalizados acf cms query',
  commerce: 'woocommerce ecommerce tienda producto carrito precio comercio',
  forms: 'jetformbuilder elementor forms formulario input campo textarea checkbox radio select enviar submit',
  filters: 'jetsmartfilters filtro filtros búsqueda search taxonomía taxonomy rango ordenar paginación',
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
    description: `Preset local de ${definition.label}. Conserva contenido, estilos y ajustes responsive.`,
    key: preset.id,
    label: preset.label,
    preset,
    source: { kind: 'saved', presetId: preset.id },
  } : null
}

function LibraryTabButton({ active, controls, icon, id, label, onClick }: {
  readonly active: boolean
  readonly controls: string
  readonly icon: 'layers' | 'columns'
  readonly id: string
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button
      aria-controls={controls}
      aria-label={label}
      aria-selected={active}
      className={`flex min-h-11 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-md px-1 text-[0.6875rem] font-bold text-primary transition-colors focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${active ? 'bg-primary-soft shadow-sm' : 'hover:bg-primary-soft'}`}
      id={id}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon name={icon} size={13} />
      <span className="truncate">{label}</span>
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
      const haystack = `${item.label} ${item.description} ${item.definition.id} ${categoryLabels[item.definition.category]} ${categorySearchTerms[item.definition.category]}`.toLocaleLowerCase('es')
      return haystack.includes(normalizedQuery)
    })
  }, [category, deferredQuery, library.preferences.favoriteWidgetIds, library.preferences.recentWidgetIds, library.preferences.savedWidgets, scope])

  return (
    <aside aria-label="Biblioteca y capas" className={`library-panel flex min-h-0 flex-col border-r border-border bg-surface ${className}`}>
      <div aria-label="Herramientas del editor" className="grid shrink-0 grid-cols-2 gap-0.5 border-b border-border bg-muted/60 p-1" role="tablist">
        <LibraryTabButton active={activeTab === 'layers'} controls="library-panel-layers" icon="layers" id="library-tab-layers" label="Capas" onClick={() => onTabChange('layers')} />
        <LibraryTabButton active={activeTab === 'widgets'} controls="library-panel-widgets" icon="columns" id="library-tab-widgets" label="Widgets" onClick={() => onTabChange('widgets')} />
      </div>

      {activeTab === 'layers' ? (
        <div aria-labelledby="library-tab-layers" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="library-panel-layers" role="tabpanel">
          <section aria-labelledby="document-title" className="border-b border-border p-2 lg:p-1.5">
            <h2 className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground" id="document-title">Documento actual</h2>
            <div className="mt-1 flex min-h-9 items-center gap-1.5 rounded-md bg-primary-soft px-2 text-xs font-semibold text-primary-strong">
              <Icon name="editor" size={14} />
              <span className="truncate">{document?.name ?? 'Documento no disponible'}</span>
            </div>
          </section>
          <section aria-labelledby="layers-title" className="p-1.5 lg:p-1">
            <div className="flex min-h-9 items-center gap-1 px-1">
              <h2 className="flex items-center gap-1 text-xs font-bold text-primary" id="layers-title"><Icon name="layers" size={13} />Estructura de la página</h2>
              <HelpTip description="Muestra contenedores y widgets según su jerarquía real. Selecciona una fila para editarla, usa el control de cuatro direcciones para arrastrarla o el menú para moverla sin arrastrar." example="Un título dentro de una sección aparece sangrado bajo esa sección." label="Estructura de la página" reference="Elementor — Navigator" />
            </div>
            <CanonicalLayerTree />
          </section>
        </div>
      ) : (
        <div aria-labelledby="library-tab-widgets" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-1.5" id="library-panel-widgets" role="tabpanel">
          <div className="mb-2 flex items-start justify-between gap-1 lg:mb-1.5">
            <span className="min-w-0">
              <span className="flex items-center gap-0.5"><strong className="block text-xs leading-4 text-primary">Widgets</strong><HelpTip description="Elige una pieza para añadirla al elemento seleccionado del lienzo. Insertar la añade directamente; el control de cuatro direcciones permite arrastrarla; la estrella la guarda en Favoritos." example="Añade un Contenedor y marca con estrella los widgets que utilizas con frecuencia." label="Biblioteca de widgets" reference="Elementor — Panel de widgets" /></span>
              <span className="block text-[0.625rem] leading-4 text-muted-foreground">{widgetDefinitions.length} elementos disponibles por categoría</span>
            </span>
            <button aria-label="Guardar widget seleccionado" className="min-h-9 shrink-0 cursor-pointer rounded-md border border-border bg-surface px-2 text-[0.625rem] font-bold text-primary-strong hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSaveSelection} onClick={() => library.saveSelectedWidget()} type="button">Guardar</button>
          </div>

          <label className="block">
            <span className="sr-only">Buscar widgets</span>
            <input aria-label="Buscar widgets" className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, función o referencia" type="search" value={query} />
          </label>

          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-1">
            <ChoiceField compact label="Filtrar por categoría" labelHidden onChange={(value) => setCategory(value as WidgetCategory | 'all')} options={categoryOptions} value={category} />
            <output aria-label={`${visibleItems.length} elementos visibles`} className="grid min-h-11 min-w-11 place-items-center rounded-md border border-border bg-muted px-1 text-[0.625rem] font-bold text-muted-foreground lg:min-h-8 lg:min-w-9">{visibleItems.length}</output>
          </div>

          <div aria-label="Filtros de biblioteca" className="mt-1.5 grid grid-cols-4 gap-0.5" role="group">
            {(Object.keys(scopeLabels) as LibraryScope[]).map((id) => (
              <button aria-pressed={scope === id} className={`min-h-11 cursor-pointer truncate rounded px-1 text-[0.625rem] font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${scope === id ? 'bg-primary text-on-primary' : 'bg-muted text-muted-foreground hover:text-foreground'}`} key={id} onClick={() => setScope(id)} type="button">{scopeLabels[id]}</button>
            ))}
          </div>

          <p aria-live="polite" className="sr-only">{visibleItems.length} widgets encontrados. {library.status}</p>
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
                  subtitle={item.preset ? `${categoryLabels[item.definition.category]} · Guardado local` : categoryLabels[item.definition.category]}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-2 grid place-items-center rounded-md border border-dashed border-border px-2 py-5 text-center">
              <Icon className="text-muted-foreground" name="search" size={18} />
              <p className="mt-2 text-xs font-semibold text-foreground">Sin elementos en este filtro</p>
              <button className="mt-2 min-h-11 cursor-pointer rounded-md border border-border bg-surface px-2 text-xs font-semibold text-primary-strong hover:bg-primary-soft lg:min-h-9" onClick={() => { setQuery(''); setCategory('all'); setScope('all') }} type="button">Mostrar todos</button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
