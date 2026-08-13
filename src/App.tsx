import { createRoleEnabledEditorProjectSession } from './editor-project-role-session'
import { AppSectionProvider } from './editor-ui/editor/AppSectionProvider'
import { EditorProjectProvider } from './editor-ui/editor/EditorProjectProvider'
import { ResponsiveEditorShell } from './editor-ui/editor/ResponsiveEditorShell'

const editorProjectSession = createRoleEnabledEditorProjectSession()

export function App() {
  return (
    <EditorProjectProvider session={editorProjectSession}>
      <AppSectionProvider>
        <ResponsiveEditorShell />
      </AppSectionProvider>
    </EditorProjectProvider>
  )
}
