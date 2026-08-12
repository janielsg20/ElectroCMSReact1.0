import { useState } from 'react'
import { ContentTypeManager } from './ContentTypeManager'
import { CustomFieldManager } from './CustomFieldManager'
import { QueryManager } from './QueryManager'
import { RecordRelationManager } from './RecordRelationManager'
import { TaxonomyManager } from './TaxonomyManager'

type DataTab = 'content-types' | 'taxonomies' | 'fields' | 'records' | 'queries'

const tabs: readonly { readonly id: DataTab; readonly label: string; readonly compact: string }[] = [
  { id: 'content-types', label: 'Tipos de contenido', compact: 'Tipos' },
  { id: 'taxonomies', label: 'Taxonomías', compact: 'Tax.' },
  { id: 'fields', label: 'Campos personalizados', compact: 'Campos' },
  { id: 'records', label: 'Registros y relaciones', compact: 'Reg.' },
  { id: 'queries', label: 'Consultas', compact: 'Queries' },
]

export function ProjectDataPanel() {
  const [activeTab, setActiveTab] = useState<DataTab>('content-types')

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="shrink-0 overflow-x-auto border-b border-border bg-muted/40 overscroll-x-contain">
        <div aria-label="Datos del proyecto" className="flex min-w-max gap-0.5 p-1" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-controls={`project-data-${tab.id}`}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
              className={`min-h-11 min-w-[5.75rem] rounded-md px-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 lg:min-w-[5.25rem] ${activeTab === tab.id ? 'bg-primary-soft text-primary-strong shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              id={`project-data-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              title={tab.label}
              type="button"
            >
              {tab.compact}
            </button>
          ))}
        </div>
      </div>

      <div aria-labelledby="project-data-tab-content-types" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" hidden={activeTab !== 'content-types'} id="project-data-content-types" role="tabpanel"><ContentTypeManager /></div>
      <div aria-labelledby="project-data-tab-taxonomies" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" hidden={activeTab !== 'taxonomies'} id="project-data-taxonomies" role="tabpanel"><TaxonomyManager /></div>
      <div aria-labelledby="project-data-tab-fields" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" hidden={activeTab !== 'fields'} id="project-data-fields" role="tabpanel"><CustomFieldManager /></div>
      <div aria-labelledby="project-data-tab-records" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" hidden={activeTab !== 'records'} id="project-data-records" role="tabpanel"><RecordRelationManager /></div>
      <div aria-labelledby="project-data-tab-queries" className="min-h-0 flex-1 overflow-hidden" hidden={activeTab !== 'queries'} id="project-data-queries" role="tabpanel"><QueryManager /></div>
    </div>
  )
}
