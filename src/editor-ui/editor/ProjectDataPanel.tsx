import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { HelpTip, Icon } from '../primitives'
import { DATA_HELP, type DataHelpId, type FeatureHelp } from './feature-help'

type DataTab = DataHelpId | 'backend'

interface DataTabDefinition {
  readonly compact: string
  readonly help?: FeatureHelp
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
const FormManager = lazy(() => import('./FormManager').then((module) => ({ default: module.FormManager })))
const BackendAdminWorkspace = lazy(() => import('./BackendAdminWorkspace').then((module) => ({ default: module.BackendAdminWorkspace })))

const backendHelp: FeatureHelp = {
  label: 'Administración visual',
  description: 'Construye el shell y conecta CRUD, vistas guardadas, filtros y formularios a los mismos datos del proyecto.',
  reference: 'WordPress Admin · Elementor-style visual editing',
  example: 'Convierte un lienzo en Dashboard y añade una tabla de pedidos filtrada por una consulta guardada.',
}

const tabs: readonly DataTabDefinition[] = [
  { id: 'content-types', label: 'Tipos de contenido', compact: 'Tipos', title: 'Tipos de contenido', overflow: 'auto', panel: ContentTypeManager },
  { id: 'taxonomies', label: 'Clasificaciones', compact: 'Clasificar', title: 'Categorías y clasificaciones', overflow: 'auto', panel: TaxonomyManager },
  { id: 'fields', label: 'Campos personalizados', compact: 'Campos', title: 'Campos personalizados', overflow: 'auto', panel: CustomFieldManager },
  { id: 'records', label: 'Entradas y relaciones', compact: 'Entradas', title: 'Entradas y relaciones', overflow: 'auto', panel: RecordRelationManager },
  { id: 'queries', label: 'Qué contenido mostrar', compact: 'Consultas', title: 'Consultas de contenido', overflow: 'hidden', panel: QueryManager },
  { id: 'forms', label: 'Formularios', compact: 'Formularios', title: 'Formularios', overflow: 'auto', panel: FormManager },
  { id: 'backend', label: 'Administración', compact: 'Admin', title: 'Administración visual', overflow: 'auto', panel: BackendAdminWorkspace, help: backendHelp },
]

function DataPanelFallback({ label }: { readonly label: string }) {
  return (
    <div aria-live="polite" className="grid min-h-32 place-items-center p-4 text-center text-xs text-muted-foreground" role="status">
      <span>
        <strong className="block text-foreground">Cargando {label.toLocaleLowerCase('es')}…</strong>
        <span className="mt-1 block text-[0.625rem]">Solo cargamos la herramienta que estás usando para mantener ElectroCMS rápido.</span>
      </span>
    </div>
  )
}

export function ProjectDataPanel() {
  const [activeTab, setActiveTab] = useState<DataTab>('content-types')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  if (!active) throw new Error('El módulo de contenido requiere al menos una pestaña.')
  const ActivePanel = active.panel
  const help = active.help ?? DATA_HELP[active.id as DataHelpId]

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="shrink-0 border-b border-border bg-surface">
        <div className="flex items-center gap-2 px-2 py-1.5 lg:px-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name={active.id === 'forms' ? 'form' : active.id === 'backend' ? 'content' : 'database'} size={14} /></span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs text-foreground">{help.label}</strong>
            <span className="block truncate text-[0.625rem] text-muted-foreground">{help.description}</span>
          </div>
          <HelpTip description={help.description} example={help.example} label={help.label} reference={help.reference} />
        </div>
        <div className="overflow-x-auto border-t border-border bg-muted/30 overscroll-x-contain">
          <div aria-label="Herramientas de contenido" className="flex min-w-max gap-0.5 p-1" role="tablist">
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
