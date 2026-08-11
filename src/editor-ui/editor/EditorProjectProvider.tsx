import { useState, type PropsWithChildren } from 'react'
import { EditorProjectContext, EditorSelectionContext, type EditorProjectSession, type EditorSelection } from './editor-project-context'
import { WidgetLibraryProvider } from './WidgetLibraryProvider'

interface EditorProjectProviderProps extends PropsWithChildren {
  readonly session: EditorProjectSession
}

export function EditorProjectProvider({ children, session }: EditorProjectProviderProps) {
  const [selection] = useState<EditorSelection>(() => {
    let selectedNodeId = session.initialSelectedNodeId ?? null
    const listeners = new Set<() => void>()
    return {
      getSelectedNodeId: () => selectedNodeId,
      selectNode: (nodeId) => {
        if (selectedNodeId === nodeId) return
        selectedNodeId = nodeId
        for (const listener of [...listeners]) listener()
      },
      subscribe: (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    }
  })

  return (
    <EditorProjectContext value={session}>
      <EditorSelectionContext value={selection}>
        <WidgetLibraryProvider>{children}</WidgetLibraryProvider>
      </EditorSelectionContext>
    </EditorProjectContext>
  )
}
