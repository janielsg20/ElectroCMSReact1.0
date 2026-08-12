import { createBrowserEditorProjectSession } from './editor-project-session'
import { AppSectionProvider } from './editor-ui/editor/app-section-context'
import { EditorProjectProvider } from './editor-ui/editor/EditorProjectProvider'
import { ResponsiveEditorShell } from './editor-ui/editor/ResponsiveEditorShell'

const editorProjectSession = createBrowserEditorProjectSession()

export function App() {
  return (
    <EditorProjectProvider session={editorProjectSession}>
      <AppSectionProvider>
        <ResponsiveEditorShell />
      </AppSectionProvider>
    </EditorProjectProvider>
  )
}
