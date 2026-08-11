import { useState } from 'react'
import { ContentTypeManager } from './ContentTypeManager'
import { TaxonomyManager } from './TaxonomyManager'

type DataTab = 'content-types' | 'taxonomies'

export function ProjectDataPanel() {
  const [activeTab, setActiveTab] = useState<DataTab>('content-types')

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div aria-label="Datos del proyecto" className="grid shrink-0 grid-cols-2 gap-0.5 border-b border-border bg-muted/40 p-1" role="tablist">
        <button
          aria-controls="project-data-content-types"
          aria-selected={activeTab === 'content-types'}
          className={`min-h-11 rounded-md px-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${activeTab === 'content-types' ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          id="project-data-tab-content-types"
          onClick={() => setActiveTab('content-types')}
          role="tab"
          type="button"
        >
          Tipos
        </button>
        <button
          aria-controls="project-data-taxonomies"
          aria-selected={activeTab === 'taxonomies'}
          className={`min-h-11 rounded-md px-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${activeTab === 'taxonomies' ? 'bg-primary-soft text-primary-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          id="project-data-tab-taxonomies"
          onClick={() => setActiveTab('taxonomies')}
          role="tab"
          type="button"
        >
          Taxonomías
        </button>
      </div>

      <div
        aria-labelledby="project-data-tab-content-types"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        hidden={activeTab !== 'content-types'}
        id="project-data-content-types"
        role="tabpanel"
      >
        <ContentTypeManager />
      </div>
      <div
        aria-labelledby="project-data-tab-taxonomies"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        hidden={activeTab !== 'taxonomies'}
        id="project-data-taxonomies"
        role="tabpanel"
      >
        <TaxonomyManager />
      </div>
    </div>
  )
}
