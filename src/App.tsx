import { ResponsiveEditorShell } from './editor-ui/editor/ResponsiveEditorShell'
import { EditorProjectProvider } from './editor-ui/editor/EditorProjectProvider'
import { createBrowserEditorProjectSession } from './editor-project-session'

const editorProjectSession = createBrowserEditorProjectSession()

export function App() {
  return (
    <EditorProjectProvider session={editorProjectSession}>
      <ResponsiveEditorShell />
    </EditorProjectProvider>
  )
}
