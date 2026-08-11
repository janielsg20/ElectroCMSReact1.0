import { describe, expect, it } from 'vitest'
import type { LocalRepository, LocalRepositoryError } from '../ports/local-repository'
import { success, type Result } from '../../domain/common/result'
import { DEFAULT_BREAKPOINTS } from '../../domain/project/default-breakpoints'
import {
  parseDocumentId,
  parseNodeId,
  parseProjectId,
  parseTimestamp,
  type NodeId,
  type ProjectId,
} from '../../domain/project/identity'
import { parseProjectHistoryEntryId, type ProjectHistoryState } from '../../domain/project/project-history'
import type { ProjectRecord } from '../../domain/project/project-record'
import { ProjectStructureSchema, type Node, type ProjectStructure } from '../../domain/project/structure-schema'
import { moveNodes, renameNode, type TreeOwner } from '../../domain/project/tree-operations'
import { ProjectCommandBus } from './project-command-bus'
import { ProjectStructureCommand } from './project-structure-command'

const PROJECT_ID = parseProjectId('30000000-0000-4000-8000-000000000001')
const DOCUMENT_ID = parseDocumentId('30000000-0000-4000-8000-000000000002')
const ROOT_ID = parseNodeId('30000000-0000-4000-8000-000000000003')
const FIRST_ID = parseNodeId('30000000-0000-4000-8000-000000000004')
const SECOND_ID = parseNodeId('30000000-0000-4000-8000-000000000005')
const OWNER: TreeOwner = { kind: 'document', documentId: DOCUMENT_ID }

function widget(id: NodeId, name: string, slots: Record<string, NodeId[]> = {}): Node {
  return {
    id,
    name,
    kind: 'widget',
    widgetType: 'core.container',
    properties: {},
    styles: {},
    bindings: {},
    conditions: [],
    responsive: {},
    slots,
    locked: false,
    hidden: false,
  }
}

function structure(): ProjectStructure {
  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS.map((breakpoint) => ({ ...breakpoint })),
    documents: {
      [DOCUMENT_ID]: {
        id: DOCUMENT_ID,
        name: 'Inicio',
        kind: 'page',
        rootNodeIds: [ROOT_ID],
        nodes: {
          [ROOT_ID]: widget(ROOT_ID, 'Root', { content: [FIRST_ID, SECOND_ID] }),
          [FIRST_ID]: widget(FIRST_ID, 'Primero'),
          [SECOND_ID]: widget(SECOND_ID, 'Segundo'),
        },
      },
    },
    globalComponents: {},
  })
}

function record(revision = 0): ProjectRecord<ProjectStructure> {
  return {
    project: {
      format: 'electrocms.project',
      schemaVersion: 1,
      projectId: PROJECT_ID,
      revision,
      name: 'Proyecto árbol',
      createdAt: parseTimestamp('2026-08-10T00:00:00.000Z'),
      updatedAt: parseTimestamp(`2026-08-10T00:${String(revision).padStart(2, '0')}:00.000Z`),
      metadata: {},
      payload: structure(),
    },
    lifecycle: { state: 'active', archivedAt: null, trashedAt: null, restoreState: null },
  }
}

class MemoryRepository<TEntity, TId> implements LocalRepository<TEntity, TId> {
  readonly entities = new Map<TId, TEntity>()
  constructor(private readonly getId: (entity: TEntity) => TId) {}
  findById(id: TId): Promise<Result<TEntity | null, LocalRepositoryError>> { return Promise.resolve(success(structuredClone(this.entities.get(id) ?? null))) }
  list(): Promise<Result<readonly TEntity[], LocalRepositoryError>> { return Promise.resolve(success(structuredClone([...this.entities.values()]))) }
  listBySchemaVersion(): Promise<Result<readonly TEntity[], LocalRepositoryError>> { return this.list() }
  save(entity: TEntity): Promise<Result<void, LocalRepositoryError>> { this.entities.set(this.getId(entity), structuredClone(entity)); return Promise.resolve(success(undefined)) }
  saveMany(entities: readonly TEntity[]): Promise<Result<void, LocalRepositoryError>> { entities.forEach((entity) => this.entities.set(this.getId(entity), structuredClone(entity))); return Promise.resolve(success(undefined)) }
  remove(id: TId): Promise<Result<boolean, LocalRepositoryError>> { return Promise.resolve(success(this.entities.delete(id))) }
  close(): void {}
}

function createBus() {
  const projects = new MemoryRepository<ProjectRecord<ProjectStructure>, ProjectId>((value) => value.project.projectId)
  const histories = new MemoryRepository<ProjectHistoryState<ProjectStructure>, ProjectId>((value) => value.projectId)
  projects.entities.set(PROJECT_ID, record())
  let entry = 0
  let minute = 10
  const bus = new ProjectCommandBus(projects, histories, ProjectStructureSchema, {
    createHistoryEntryId: () => parseProjectHistoryEntryId(`${String(++entry).padStart(8, '0')}-3333-4333-8333-333333333333`),
    now: () => parseTimestamp(`2026-08-10T00:${minute++}:00.000Z`),
  })
  return { projects, histories, bus }
}

describe('M05.1 ProjectStructureCommand', () => {
  it('ejecuta rename mediante Command Bus y undo/redo restaura el árbol con revisiones monotónicas', async () => {
    const { projects, histories, bus } = createBus()
    const command = new ProjectStructureCommand('tree.rename', 'Renombrar nodo', (current) => renameNode(current, OWNER, FIRST_ID, 'Hero'))

    await expect(bus.execute(command, PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { cursor: 1 } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.documents[DOCUMENT_ID]?.nodes[FIRST_ID]?.name).toBe('Hero')
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(1)
    expect(histories.entities.get(PROJECT_ID)?.entries[0]?.commandIds).toEqual(['tree.rename'])

    await expect(bus.undo(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { cursor: 0 } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.documents[DOCUMENT_ID]?.nodes[FIRST_ID]?.name).toBe('Primero')
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(2)

    await expect(bus.redo(PROJECT_ID)).resolves.toMatchObject({ ok: true, value: { cursor: 1 } })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.documents[DOCUMENT_ID]?.nodes[FIRST_ID]?.name).toBe('Hero')
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(3)
  })

  it('registra movimientos multi-nodo como una sola entrada reversible', async () => {
    const { projects, histories, bus } = createBus()
    const command = new ProjectStructureCommand('tree.move-many', 'Mover nodos', (current) => moveNodes(
      current,
      OWNER,
      [SECOND_ID, FIRST_ID],
      { parentId: null, slot: null, index: 1 },
    ))

    await expect(bus.execute(command, PROJECT_ID)).resolves.toMatchObject({ ok: true })
    expect(projects.entities.get(PROJECT_ID)?.project.payload.documents[DOCUMENT_ID]?.rootNodeIds).toEqual([ROOT_ID, SECOND_ID, FIRST_ID])
    expect(histories.entities.get(PROJECT_ID)?.entries).toHaveLength(1)

    await bus.undo(PROJECT_ID)
    expect(projects.entities.get(PROJECT_ID)?.project.payload.documents[DOCUMENT_ID]?.rootNodeIds).toEqual([ROOT_ID])
    expect(projects.entities.get(PROJECT_ID)?.project.payload.documents[DOCUMENT_ID]?.nodes[ROOT_ID]?.slots.content).toEqual([FIRST_ID, SECOND_ID])
  })

  it('propaga fallos estructurales como command-failed sin persistir historial ni revisión', async () => {
    const { projects, histories, bus } = createBus()
    const command = new ProjectStructureCommand('tree.invalid-move', 'Movimiento inválido', (current) => moveNodes(
      current,
      OWNER,
      [ROOT_ID],
      { parentId: FIRST_ID, slot: 'content', index: 0 },
    ))

    await expect(bus.execute(command, PROJECT_ID)).resolves.toMatchObject({
      ok: false,
      error: { kind: 'command-failed', commandId: 'tree.invalid-move' },
    })
    expect(projects.entities.get(PROJECT_ID)?.project.revision).toBe(0)
    expect(histories.entities.get(PROJECT_ID)).toBeUndefined()
  })
})
