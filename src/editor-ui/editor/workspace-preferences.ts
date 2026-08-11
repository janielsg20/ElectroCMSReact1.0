import * as z from 'zod'
import { BreakpointIdSchema, type BreakpointId } from '../../domain/project/identity'
import type { DockSide, PanelBounds, PanelMode, WorkspacePanel } from './PanelWindow'

const WorkspacePanelSchema = z.enum(['library', 'inspector'])
const PanelModeSchema = z.enum(['docked', 'floating', 'minimized'])
const DockSideSchema = z.enum(['left', 'right'])
const PanelBoundsSchema = z.strictObject({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
})

const WorkspacePanelStateSchema = z.strictObject({
  mode: PanelModeSchema,
  restoreMode: z.enum(['docked', 'floating']),
  dockSide: DockSideSchema,
  pinned: z.boolean(),
  bounds: PanelBoundsSchema,
})

export const DEFAULT_CANVAS_WORKSPACE = {
  breakpointId: null,
  orientation: 'portrait',
  panX: 0,
  panY: 0,
  tool: 'select',
  viewport: 'mobile',
  zoom: 90,
} as const satisfies CanvasWorkspaceState

const CanvasWorkspaceStateSchema = z.strictObject({
  breakpointId: BreakpointIdSchema.nullable().default(null),
  orientation: z.enum(['portrait', 'landscape']),
  panX: z.number().finite().min(-2000).max(2000),
  panY: z.number().finite().min(-2000).max(2000),
  tool: z.enum(['select', 'pan']),
  viewport: z.enum(['desktop', 'tablet', 'mobile']),
  zoom: z.number().finite().min(25).max(200),
})

export const EDITOR_WORKSPACE_PREFERENCES_VERSION = 1 as const
export const EDITOR_WORKSPACE_PREFERENCES_KEY = 'electrocms.editor.workspace.v1'

export interface WorkspacePanelState {
  readonly mode: PanelMode
  readonly restoreMode: 'docked' | 'floating'
  readonly dockSide: Exclude<DockSide, 'rail'>
  readonly pinned: boolean
  readonly bounds: PanelBounds
}

export type WorkspaceState = Record<WorkspacePanel, WorkspacePanelState>

export interface CanvasWorkspaceState {
  readonly breakpointId: BreakpointId | null
  readonly orientation: 'portrait' | 'landscape'
  readonly panX: number
  readonly panY: number
  readonly tool: 'select' | 'pan'
  readonly viewport: 'desktop' | 'tablet' | 'mobile'
  readonly zoom: number
}

export interface EditorWorkspacePreferences {
  readonly schemaVersion: typeof EDITOR_WORKSPACE_PREFERENCES_VERSION
  readonly railWidth: number
  readonly libraryWidth: number
  readonly inspectorWidth: number
  readonly workspace: WorkspaceState
  readonly panelOrder: readonly WorkspacePanel[]
  readonly canvas: CanvasWorkspaceState
}

export const EditorWorkspacePreferencesSchema: z.ZodType<EditorWorkspacePreferences> = z.strictObject({
  schemaVersion: z.literal(EDITOR_WORKSPACE_PREFERENCES_VERSION),
  railWidth: z.number().finite(),
  libraryWidth: z.number().finite(),
  inspectorWidth: z.number().finite(),
  workspace: z.strictObject({
    library: WorkspacePanelStateSchema,
    inspector: WorkspacePanelStateSchema,
  }),
  panelOrder: z.tuple([WorkspacePanelSchema, WorkspacePanelSchema]),
  canvas: CanvasWorkspaceStateSchema.default(DEFAULT_CANVAS_WORKSPACE),
}).superRefine((value, context) => {
  if (new Set(value.panelOrder).size !== 2) {
    context.addIssue({ code: 'custom', path: ['panelOrder'], message: 'El orden del workspace debe contener ambos paneles una sola vez.' })
  }
  const docked = (['library', 'inspector'] as const).filter((panel) => value.workspace[panel].mode === 'docked')
  if (docked.length === 2 && value.workspace[docked[0]].dockSide === value.workspace[docked[1]].dockSide) {
    context.addIssue({ code: 'custom', path: ['workspace'], message: 'Dos paneles acoplados no pueden ocupar el mismo lado.' })
  }
})

export interface WorkspacePreferencesStore {
  load(): EditorWorkspacePreferences | null
  save(preferences: EditorWorkspacePreferences): boolean
  clear(): void
}

export class BrowserWorkspacePreferencesStore implements WorkspacePreferencesStore {
  constructor(private readonly storage: Storage, private readonly key = EDITOR_WORKSPACE_PREFERENCES_KEY) {}

  load(): EditorWorkspacePreferences | null {
    try {
      const source = this.storage.getItem(this.key)
      if (!source) return null
      const parsedJson: unknown = JSON.parse(source)
      const parsed = EditorWorkspacePreferencesSchema.safeParse(parsedJson)
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }

  save(preferences: EditorWorkspacePreferences): boolean {
    const parsed = EditorWorkspacePreferencesSchema.safeParse(preferences)
    if (!parsed.success) return false
    try {
      this.storage.setItem(this.key, JSON.stringify(parsed.data))
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key)
    } catch {
      // Las preferencias del shell son recuperables y no deben bloquear el editor.
    }
  }
}
