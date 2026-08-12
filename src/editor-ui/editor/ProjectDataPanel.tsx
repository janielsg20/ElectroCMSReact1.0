import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from 'react'

type DataTab = 'content-types' | 'taxonomies' | 'fields' | 'records' | 'queries'

interface DataTabDefinition {
  readonly compact: string
  readonly id: DataTab
  readonly label: string
  readonly overflow: 'auto' | 'hidden'
  readonly panel: LazyExoticComponent<ComponentType>
  readonly title: string
}

const ContentTypeManager = lazy(() => import('./ContentTypeManager').then((module) => ({ default: module.ContentTypeManager })))
const TaxonomyManager = lazy(() => import('./TaxonomyManager').then((module) => ({ default: module.TaxonomyManager })))
const CustomFieldManager = lazy(() => import('./CustomFieldManager').then((module) => ({ default: module.CustomFieldManager })))
const RecordRelationManager = lazy(() => import('./RecordRelationManager').then((module) => ({ default: module.RecordRelationManager })))
const QueryManager = lazy(() => import('./QueryManager').then((module) => ({ default: module.QueryManager })))

const tabs: readonly DataTabDefinition[] = [
  { id: 'content-types', label: 'Tipos', compact: 'Tipos', title: 'Tipos de contenido', overflow: 'auto', panel: ContentTypeManager },
  { id: 'taxonomies', label: 'Taxonomías', compact: 'Tax.', title: 'Taxonomías', overflow: 'auto', panel: TaxonomyManager },
  { id: 'fields', label: 'Campos', compact: 'Campos', title: 'Campos personalizados', overflow: 'auto', panel: CustomFieldManager },
  { id: 'records', label: 'Registros y relaciones', compact: 'Reg.', title: 'Registros y relaciones', overflow: 'auto', panel: RecordRelationManager },
  { id: 'queries', label: 'Consultas', compact: 'Queries', title: 'Consultas', overflow: 'hidden', panel: QueryManager },
]

function DataPanelFallback({ label }: { readonly label: string }) {
  return (
    <div aria-live="polite" className="grid min-h-32 place-items-center p-4 text-center text-xs text-muted-foreground" role="status">
      <span>
        <strong className="block text-foreground">Cargando {label.toLocaleLowerCase('es')}…</strong>
        <span className="mt-1 block text-[0.625rem]">Solo se carga el módulo activo para mantener el editor ligero.</span>
      </span>
    </div>
  )
}

export function ProjectDataPanel() {
  const [activeTab, setActiveTab] = useState<DataTab>('content-types')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  if (!active) throw new Error('El módulo de datos requiere al menos una pestaña.')
  const ActivePanel = active.panel

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="shrink-0 overflow-x-auto border-b border-border bg-muted/40 overscroll-x-contain">
        <div aria-label="Datos del proyecto" className="flex min-w-max gap-0.5 p-1" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-controls={`project-data-${tab.id}`}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
              className={`min-h-11 min-w-[5.75rem] shrink-0 rounded-md px-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:min-w-[5.25rem] ${activeTab === tab.id ? 'bg-primary-soft text-primary-strong shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              id={`project-data-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              title={tab.title}
              type="button"
            >
              {tab.compact}
            </button>
          ))}
        </div>
      </div>

      <div
        aria-labelledby={`project-data-tab-${active.id}`}
        className={`min-h-0 flex-1 ${active.overflow === 'hidden' ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}
        id={`project-data-${active.id}`}
        role="tabpanel"
      >
        <Suspense fallback={<DataPanelFallback label={active.label} />}>
          <ActivePanel />
        </Suspense>
      </div>
    </div>
  )
}
