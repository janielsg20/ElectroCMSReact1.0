import { useState } from 'react'
import type { ProjectThemeScope } from '../../domain'
import { Icon } from '../primitives'
import { ProjectThemeControl } from './ProjectThemeControl'
import { ThemePackageManager } from './ThemePackageManager'
import { useEditorProjectStructure } from './editor-project-context'

type DesignView = 'theme' | 'packages'

export function ProjectDesignPanel() {
  const structure = useEditorProjectStructure()
  const [view, setView] = useState<DesignView>('theme')
  const [themeScope, setThemeScope] = useState<ProjectThemeScope>('frontend')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-1.5">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon name="palette" size={15} /></span>
        <div className="min-w-0">
          <h2 className="text-xs font-bold">Diseño del proyecto</h2>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Frontend, backend y paquetes son exportables; la apariencia de ElectroCMS permanece local al editor.</p>
        </div>
      </div>

      <div aria-label="Gestor de diseño" className="mt-2 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/30 p-1" role="tablist">
        <button aria-controls="project-design-theme" aria-selected={view === 'theme'} className={`min-h-11 rounded px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${view === 'theme' ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface/70 hover:text-foreground'}`} onClick={() => setView('theme')} role="tab" type="button">Tema</button>
        <button aria-controls="project-design-packages" aria-selected={view === 'packages'} className={`min-h-11 rounded px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${view === 'packages' ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface/70 hover:text-foreground'}`} onClick={() => setView('packages')} role="tab" type="button">Paquetes</button>
      </div>

      {view === 'theme' ? (
        <div aria-labelledby="project-design-theme-tab" className="mt-2" id="project-design-theme" role="tabpanel">
          <div aria-label="Ámbito de tema de proyecto" className="grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/30 p-1" role="tablist">
            {(['frontend', 'backend'] as const).map((scopeId) => (
              <button aria-controls={`project-theme-${scopeId}`} aria-selected={themeScope === scopeId} className={`min-h-11 rounded px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus lg:min-h-9 ${themeScope === scopeId ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface/70 hover:text-foreground'}`} key={scopeId} onClick={() => setThemeScope(scopeId)} role="tab" type="button">{scopeId === 'frontend' ? 'Frontend' : 'Backend'}</button>
            ))}
          </div>
          <div aria-labelledby={`project-theme-${themeScope}`} className="mt-2" id={`project-theme-${themeScope}`} role="tabpanel">
            <ProjectThemeControl key={themeScope} scope={themeScope} theme={structure.themes[themeScope]} />
          </div>
        </div>
      ) : (
        <div aria-labelledby="project-design-packages-tab" className="mt-2" id="project-design-packages" role="tabpanel">
          <ThemePackageManager />
        </div>
      )}
    </div>
  )
}
