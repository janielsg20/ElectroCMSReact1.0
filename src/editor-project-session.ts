import { failure, moveNodes, parseProjectHistoryEntryId, parseProjectId, parseTimestamp, ProjectStructureSchema, resizeNode, success, updateNodeSpacing, type BreakpointId, type NodeId, type NodePlacement, type NodeSize, type NodeSpacing, type ProjectId, type ProjectRecord, type ProjectStructure, type Result } from './domain'
import { ProjectCommandBus, ProjectStructureCommand, type ProjectCommandBusError } from './application'
import { createProjectHistoryRepository, createProjectRecordRepository, ElectroCmsLocalDatabase } from './infrastructure'
import { ProjectStructureRenderStore } from './renderers'
import { STARTER_DOCUMENT_ID, STARTER_PROJECT_STRUCTURE, STARTER_SELECTED_NODE_ID } from './editor-ui/editor/starter-project-structure'
import type { EditorProjectSession } from './editor-ui/editor/editor-project-context'

const EDITOR_PROJECT_ID = parseProjectId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1')
const EDITOR_DATABASE_NAME = 'electrocms-editor-project-v2'

function now() {
  return parseTimestamp(new Date().toISOString())
}

function initialRecord(projectId: ProjectId): ProjectRecord<ProjectStructure> {
  const timestamp = now()
  return {
    lifecycle: { archivedAt: null, restoreState: null, state: 'active', trashedAt: null },
    project: {
      createdAt: timestamp,
      format: 'electrocms.project',
      metadata: {},
      name: 'Proyecto local',
      payload: structuredClone(STARTER_PROJECT_STRUCTURE),
      projectId,
      revision: 0,
      schemaVersion: 1,
      updatedAt: timestamp,
    },
  }
}

function commandErrorMessage(error: ProjectCommandBusError): string {
  if (error.kind === 'command-failed' || error.kind === 'invalid-command-output' || error.kind === 'history-conflict') return error.message
  if (error.kind === 'persistence') return error.cause.message
  if (error.kind === 'not-found') return 'El proyecto local no existe.'
  if (error.kind === 'pending-operation') return 'Hay una operación pendiente de reconciliación.'
  if (error.kind === 'nothing-to-undo') return 'No hay cambios para deshacer.'
  return 'No hay cambios para rehacer.'
}

class BrowserEditorProjectSession implements EditorProjectSession {
  readonly documentId = STARTER_DOCUMENT_ID
  readonly initialSelectedNodeId = STARTER_SELECTED_NODE_ID
  readonly store = new ProjectStructureRenderStore(STARTER_PROJECT_STRUCTURE)
  readonly #database = new ElectroCmsLocalDatabase(EDITOR_DATABASE_NAME)
  readonly #projects = createProjectRecordRepository(this.#database, ProjectStructureSchema)
  readonly #histories = createProjectHistoryRepository(this.#database, ProjectStructureSchema)
  readonly #bus = new ProjectCommandBus(this.#projects, this.#histories, ProjectStructureSchema, {
    createHistoryEntryId: () => parseProjectHistoryEntryId(crypto.randomUUID()),
    now,
  })
  readonly #ready: Promise<Result<void, string>>

  constructor() {
    this.#ready = this.#initialize()
  }

  async moveNodes(nodeIds: readonly NodeId[], placement: NodePlacement): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'tree.move',
      nodeIds.length === 1 ? 'Mover capa' : 'Mover capas',
      (structure) => moveNodes(
        structure,
        { documentId: this.documentId, kind: 'document' },
        nodeIds,
        placement,
      ),
    ))
  }

  async resizeNode(nodeId: NodeId, size: NodeSize, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'canvas.resize',
      'Redimensionar nodo',
      (structure) => resizeNode(structure, {
        breakpointId,
        nodeId,
        owner: { documentId: this.documentId, kind: 'document' },
      }, size),
    ))
  }

  async updateNodeSpacing(nodeId: NodeId, spacing: NodeSpacing, breakpointId?: BreakpointId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand(
      'canvas.spacing',
      'Editar espaciado',
      (structure) => updateNodeSpacing(structure, {
        breakpointId,
        nodeId,
        owner: { documentId: this.documentId, kind: 'document' },
      }, spacing),
    ))
  }

  async undo(): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const undone = await this.#bus.undo(EDITOR_PROJECT_ID)
    if (!undone.ok) return failure(commandErrorMessage(undone.error))
    return this.#publishPersistedStructure()
  }

  async redo(): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const redone = await this.#bus.redo(EDITOR_PROJECT_ID)
    if (!redone.ok) return failure(commandErrorMessage(redone.error))
    return this.#publishPersistedStructure()
  }

  async #initialize(): Promise<Result<void, string>> {
    const loaded = await this.#projects.findById(EDITOR_PROJECT_ID)
    if (!loaded.ok) return failure(loaded.error.message)
    if (!loaded.value) {
      const saved = await this.#projects.save(initialRecord(EDITOR_PROJECT_ID))
      return saved.ok ? success(undefined) : failure(saved.error.message)
    }
    const replaced = this.store.replaceStructure(loaded.value.project.payload)
    return replaced.ok ? success(undefined) : failure('El proyecto local persistido no es estructuralmente válido.')
  }

  async #publishPersistedStructure(): Promise<Result<ProjectStructure, string>> {
    const loaded = await this.#projects.findById(EDITOR_PROJECT_ID)
    if (!loaded.ok) return failure(loaded.error.message)
    if (!loaded.value) return failure('El proyecto local desapareció después del comando.')
    const replaced = this.store.replaceStructure(loaded.value.project.payload)
    return replaced.ok ? success(replaced.value) : failure('El comando persistido no pudo publicarse en el renderer.')
  }

  async #execute(command: ProjectStructureCommand): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#ready
    if (!ready.ok) return ready
    const executed = await this.#bus.execute(command, EDITOR_PROJECT_ID)
    if (!executed.ok) return failure(commandErrorMessage(executed.error))
    return this.#publishPersistedStructure()
  }
}

export function createBrowserEditorProjectSession(): EditorProjectSession {
  return new BrowserEditorProjectSession()
}
