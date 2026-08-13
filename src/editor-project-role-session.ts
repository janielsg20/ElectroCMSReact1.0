import {
  failure,
  parseProjectHistoryEntryId,
  parseProjectId,
  parseTimestamp,
  ProjectStructureSchema,
  success,
  type ProjectStructure,
  type Result,
  type Role,
  type RoleId,
} from './domain'
import {
  createRole as createRoleInStructure,
  deleteRole as deleteRoleInStructure,
  updateRole as updateRoleInStructure,
  type RoleEditablePatch,
} from './domain/project/role-engine'
import { ProjectCommandBus, ProjectStructureCommand, type ProjectCommandBusError } from './application'
import {
  createProjectHistoryRepository,
  createProjectRecordRepository,
  ElectroCmsLocalDatabase,
} from './infrastructure'
import { createBrowserEditorProjectSession } from './editor-project-session'
import type { EditorProjectSession } from './editor-ui/editor/editor-project-context'

const ROLE_PROJECT_ID = parseProjectId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1')
const ROLE_DATABASE_NAME = 'electrocms-editor-project-v2'

export interface RoleMutationSession {
  createRole(role: Role): Promise<Result<ProjectStructure, string>>
  updateRole(roleId: RoleId, patch: RoleEditablePatch): Promise<Result<ProjectStructure, string>>
  deleteRole(roleId: RoleId): Promise<Result<ProjectStructure, string>>
}

function now() {
  return parseTimestamp(new Date().toISOString())
}

function commandErrorMessage(error: ProjectCommandBusError): string {
  if (error.kind === 'command-failed' || error.kind === 'invalid-command-output' || error.kind === 'history-conflict') return error.message
  if (error.kind === 'persistence') return error.cause.message
  if (error.kind === 'not-found') return 'El proyecto local no existe.'
  if (error.kind === 'pending-operation') return 'Hay una operación pendiente de reconciliación.'
  if (error.kind === 'nothing-to-undo') return 'No hay cambios para deshacer.'
  return 'No hay cambios para rehacer.'
}

class RoleMutationAdapter implements RoleMutationSession {
  readonly #session: EditorProjectSession
  readonly #projects: ReturnType<typeof createProjectRecordRepository<ProjectStructure>>
  readonly #bus: ProjectCommandBus<ProjectStructure>

  constructor(session: EditorProjectSession, databaseName: string) {
    this.#session = session
    const database = new ElectroCmsLocalDatabase(databaseName)
    this.#projects = createProjectRecordRepository(database, ProjectStructureSchema)
    const histories = createProjectHistoryRepository(database, ProjectStructureSchema)
    this.#bus = new ProjectCommandBus(this.#projects, histories, ProjectStructureSchema, {
      createHistoryEntryId: () => parseProjectHistoryEntryId(crypto.randomUUID()),
      now,
    })
  }

  async createRole(role: Role): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.create-role', `Crear rol ${role.name}`, (structure) => {
      const created = createRoleInStructure(structure, role)
      return created.ok
        ? success(created.value)
        : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El rol no es válido.' })
    }))
  }

  async updateRole(roleId: RoleId, patch: RoleEditablePatch): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.update-role', 'Editar rol y permisos', (structure) => {
      const updated = updateRoleInStructure(structure, roleId, patch)
      return updated.ok
        ? success(updated.value)
        : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El rol no es válido.' })
    }))
  }

  async deleteRole(roleId: RoleId): Promise<Result<ProjectStructure, string>> {
    return this.#execute(new ProjectStructureCommand('cms.delete-role', 'Eliminar rol', (structure) => {
      const deleted = deleteRoleInStructure(structure, roleId)
      return deleted.ok
        ? success(deleted.value)
        : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El rol no se puede eliminar.' })
    }))
  }

  async #readyProject(): Promise<Result<void, string>> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const loaded = await this.#projects.findById(ROLE_PROJECT_ID)
      if (!loaded.ok) return failure(loaded.error.message)
      if (loaded.value) return success(undefined)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
    return failure('El proyecto local todavía no está preparado para editar roles.')
  }

  async #execute(command: ProjectStructureCommand): Promise<Result<ProjectStructure, string>> {
    const ready = await this.#readyProject()
    if (!ready.ok) return ready
    const executed = await this.#bus.execute(command, ROLE_PROJECT_ID)
    if (!executed.ok) return failure(commandErrorMessage(executed.error))
    const loaded = await this.#projects.findById(ROLE_PROJECT_ID)
    if (!loaded.ok) return failure(loaded.error.message)
    if (!loaded.value) return failure('El proyecto local desapareció después de editar permisos.')
    const published = this.#session.store.replaceStructure(loaded.value.project.payload)
    return published.ok ? success(published.value) : failure('Los permisos guardados no pudieron publicarse en el editor.')
  }
}

export type RoleEnabledEditorProjectSession = EditorProjectSession & RoleMutationSession

export function createRoleEnabledEditorProjectSession(databaseName = ROLE_DATABASE_NAME): RoleEnabledEditorProjectSession {
  const session = createBrowserEditorProjectSession(databaseName)
  const roles = new RoleMutationAdapter(session, databaseName)
  return Object.assign(session, {
    createRole: roles.createRole.bind(roles),
    deleteRole: roles.deleteRole.bind(roles),
    updateRole: roles.updateRole.bind(roles),
  })
}
