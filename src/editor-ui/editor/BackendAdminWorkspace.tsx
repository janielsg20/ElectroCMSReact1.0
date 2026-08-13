import { adminShellForDocument } from '../../domain/project/backend-shell-engine'
import { AdminCrudViewsManager } from './AdminCrudViewsManager'
import { BackendShellManager } from './BackendShellManager'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

export function BackendAdminWorkspace() {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const shell = adminShellForDocument(structure, session.documentId)

  return (
    <div className="grid gap-2">
      <BackendShellManager />
      {shell ? <div className="px-2 pb-2 lg:px-3 lg:pb-3"><AdminCrudViewsManager screenId={shell.screen.id} /></div> : null}
    </div>
  )
}
