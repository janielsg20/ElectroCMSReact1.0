import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { parseDocumentId, parseNodeId, type NodeId } from './identity'
import { ProjectStructureSchema, type Node, type ProjectStructure } from './structure-schema'
import {
  copyNodes,
  deleteNodes,
  duplicateNodes,
  groupNodes,
  insertNode,
  moveNodes,
  nestNodes,
  pasteNodes,
  renameNode,
  setNodesHidden,
  setNodesLocked,
  type TreeOwner,
} from './tree-operations'
import { validateProjectStructure } from './validate-structure'

const DOCUMENT_ID = parseDocumentId('10000000-0000-4000-8000-000000000001')
const ROOT_ID = parseNodeId('10000000-0000-4000-8000-000000000002')
const FIRST_ID = parseNodeId('10000000-0000-4000-8000-000000000003')
const FIRST_CHILD_ID = parseNodeId('10000000-0000-4000-8000-000000000004')
const SECOND_ID = parseNodeId('10000000-0000-4000-8000-000000000005')
const OTHER_ROOT_ID = parseNodeId('10000000-0000-4000-8000-000000000006')
const GROUP_ID = parseNodeId('10000000-0000-4000-8000-000000000007')
const INSERTED_ID = parseNodeId('10000000-0000-4000-8000-000000000008')
const COPY_FIRST_ID = parseNodeId('20000000-0000-4000-8000-000000000001')
const COPY_CHILD_ID = parseNodeId('20000000-0000-4000-8000-000000000002')
const COPY_SECOND_ID = parseNodeId('20000000-0000-4000-8000-000000000003')

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
        rootNodeIds: [ROOT_ID, OTHER_ROOT_ID],
        nodes: {
          [ROOT_ID]: widget(ROOT_ID, 'Root', { content: [FIRST_ID, SECOND_ID] }),
          [FIRST_ID]: {
            ...widget(FIRST_ID, 'Primero', { content: [FIRST_CHILD_ID] }),
            bindings: {
              selfLabel: { kind: 'node-property', nodeId: FIRST_CHILD_ID, path: ['properties', 'label'] },
            },
          },
          [FIRST_CHILD_ID]: {
            ...widget(FIRST_CHILD_ID, 'Hijo'),
            properties: { label: 'Interno' },
            bindings: {
              parentLabel: { kind: 'node-property', nodeId: FIRST_ID, path: ['properties', 'label'] },
            },
          },
          [SECOND_ID]: widget(SECOND_ID, 'Segundo'),
          [OTHER_ROOT_ID]: widget(OTHER_ROOT_ID, 'Otro root', { content: [] }),
        },
      },
    },
    globalComponents: {},
  })
}

function documentOf(value: ProjectStructure) {
  return value.documents[DOCUMENT_ID]
}

function expectValid(value: ProjectStructure): void {
  expect(validateProjectStructure(value)).toMatchObject({ ok: true })
}

function idFactory(ids: readonly NodeId[]) {
  let index = 0
  return () => {
    const id = ids[index]
    if (!id) throw new Error('Faltan IDs para la prueba.')
    index += 1
    return id
  }
}

describe('M05.1 operaciones canónicas del árbol', () => {
  it('elimina un nodo con todos sus descendientes y mantiene el árbol válido', () => {
    const deleted = deleteNodes(structure(), OWNER, [FIRST_ID])
    expect(deleted.ok).toBe(true)
    if (!deleted.ok) return
    expect(documentOf(deleted.value).nodes[FIRST_ID]).toBeUndefined()
    expect(documentOf(deleted.value).nodes[FIRST_CHILD_ID]).toBeUndefined()
    expect(documentOf(deleted.value).nodes[ROOT_ID]?.slots.content).toEqual([SECOND_ID])
    expectValid(deleted.value)
  })

  it('no elimina un nodo bloqueado', () => {
    const source = structure()
    const node = source.documents[DOCUMENT_ID]?.nodes[FIRST_ID]
    if (!node) throw new Error('Falta el nodo de prueba.')
    node.locked = true
    expect(deleteNodes(source, OWNER, [FIRST_ID])).toMatchObject({ ok: false, error: { code: 'locked-node' } })
  })
  it('ajusta el índice al reordenar hacia delante dentro del mismo slot', () => {
    const result = moveNodes(
      structure(),
      OWNER,
      [FIRST_ID],
      { parentId: ROOT_ID, slot: 'content', index: 2 },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(documentOf(result.value)?.nodes[ROOT_ID]?.slots.content).toEqual([
      SECOND_ID,
      FIRST_ID,
    ])
  })
  it('inserta raíces e hijos respetando índice y slots', () => {
    const rootInsert = insertNode(structure(), OWNER, widget(INSERTED_ID, 'Insertado'), { parentId: null, slot: null, index: 1 })
    expect(rootInsert.ok).toBe(true)
    if (!rootInsert.ok) return
    expect(documentOf(rootInsert.value).rootNodeIds).toEqual([ROOT_ID, INSERTED_ID, OTHER_ROOT_ID])
    expectValid(rootInsert.value)

    const childInsert = insertNode(structure(), OWNER, widget(INSERTED_ID, 'Insertado'), { parentId: ROOT_ID, slot: 'content', index: 1 })
    expect(childInsert.ok).toBe(true)
    if (!childInsert.ok) return
    expect(documentOf(childInsert.value).nodes[ROOT_ID]?.slots.content).toEqual([FIRST_ID, INSERTED_ID, SECOND_ID])
    expectValid(childInsert.value)
  })

  it('mueve y anida nodos preservando orden sin mutar el input', () => {
    const source = structure()
    const moved = moveNodes(source, OWNER, [FIRST_ID, SECOND_ID], { parentId: OTHER_ROOT_ID, slot: 'content', index: 0 })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return

    expect(documentOf(source).nodes[ROOT_ID]?.slots.content).toEqual([FIRST_ID, SECOND_ID])
    expect(documentOf(moved.value).nodes[ROOT_ID]?.slots.content).toEqual([])
    expect(documentOf(moved.value).nodes[OTHER_ROOT_ID]?.slots.content).toEqual([FIRST_ID, SECOND_ID])
    expectValid(moved.value)

    const nested = nestNodes(structure(), OWNER, [SECOND_ID], FIRST_ID, 'content', 0)
    expect(nested.ok).toBe(true)
    if (!nested.ok) return
    expect(documentOf(nested.value).nodes[FIRST_ID]?.slots.content).toEqual([SECOND_ID, FIRST_CHILD_ID])
    expectValid(nested.value)
  })

  it('normaliza selección múltiple cuando contiene ancestro y descendiente', () => {
    const moved = moveNodes(structure(), OWNER, [FIRST_ID, FIRST_CHILD_ID], { parentId: OTHER_ROOT_ID, slot: 'content', index: 0 })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return

    expect(documentOf(moved.value).nodes[OTHER_ROOT_ID]?.slots.content).toEqual([FIRST_ID])
    expect(documentOf(moved.value).nodes[FIRST_ID]?.slots.content).toEqual([FIRST_CHILD_ID])
    expectValid(moved.value)
  })

  it('rechaza ciclos, padres inexistentes y destinos dentro del subárbol seleccionado', () => {
    const cyclic = moveNodes(structure(), OWNER, [FIRST_ID], { parentId: FIRST_CHILD_ID, slot: 'content', index: 0 })
    expect(cyclic).toMatchObject({ ok: false, error: { code: 'invalid-placement' } })

    const missingParent = moveNodes(structure(), OWNER, [SECOND_ID], {
      parentId: parseNodeId('99999999-9999-4999-8999-999999999999'),
      slot: 'content',
      index: 0,
    })
    expect(missingParent).toMatchObject({ ok: false, error: { code: 'parent-not-found' } })
  })

  it('agrupa hermanos en la posición del primero y conserva su orden', () => {
    const grouped = groupNodes(structure(), OWNER, [SECOND_ID, FIRST_ID], widget(GROUP_ID, 'Grupo'), 'content')
    expect(grouped.ok).toBe(true)
    if (!grouped.ok) return

    const document = documentOf(grouped.value)
    expect(document.nodes[ROOT_ID]?.slots.content).toEqual([GROUP_ID])
    expect(document.nodes[GROUP_ID]?.slots.content).toEqual([FIRST_ID, SECOND_ID])
    expectValid(grouped.value)
  })

  it('rechaza agrupaciones de nodos que no son hermanos', () => {
    const grouped = groupNodes(structure(), OWNER, [FIRST_ID, OTHER_ROOT_ID], widget(GROUP_ID, 'Grupo'))
    expect(grouped).toMatchObject({ ok: false, error: { code: 'invalid-selection' } })
  })

  it('copia un subárbol completo sin alterar sus IDs originales', () => {
    const copied = copyNodes(structure(), OWNER, [FIRST_ID])
    expect(copied.ok).toBe(true)
    if (!copied.ok) return

    expect(copied.value.rootNodeIds).toEqual([FIRST_ID])
    expect(Object.keys(copied.value.nodes).sort()).toEqual([FIRST_CHILD_ID, FIRST_ID].sort())
    expect(copied.value.nodes[FIRST_ID]?.slots.content).toEqual([FIRST_CHILD_ID])
  })

  it('pega subárboles con IDs nuevos y remapea slots y bindings internos', () => {
    const copied = copyNodes(structure(), OWNER, [FIRST_ID])
    expect(copied.ok).toBe(true)
    if (!copied.ok) return

    const pasted = pasteNodes(
      structure(),
      OWNER,
      copied.value,
      { parentId: OTHER_ROOT_ID, slot: 'content', index: 0 },
      idFactory([COPY_FIRST_ID, COPY_CHILD_ID]),
    )
    expect(pasted.ok).toBe(true)
    if (!pasted.ok) return

    const document = documentOf(pasted.value.structure)
    expect(pasted.value.insertedNodeIds).toEqual([COPY_FIRST_ID])
    expect(document.nodes[OTHER_ROOT_ID]?.slots.content).toEqual([COPY_FIRST_ID])
    expect(document.nodes[COPY_FIRST_ID]?.slots.content).toEqual([COPY_CHILD_ID])
    expect(document.nodes[COPY_FIRST_ID]?.bindings.selfLabel).toMatchObject({ kind: 'node-property', nodeId: COPY_CHILD_ID })
    expect(document.nodes[COPY_CHILD_ID]?.bindings.parentLabel).toMatchObject({ kind: 'node-property', nodeId: COPY_FIRST_ID })
    expectValid(pasted.value.structure)
  })

  it('duplica profundamente hermanos justo después de la selección', () => {
    const duplicated = duplicateNodes(structure(), OWNER, [FIRST_ID], idFactory([COPY_FIRST_ID, COPY_CHILD_ID]))
    expect(duplicated.ok).toBe(true)
    if (!duplicated.ok) return

    const document = documentOf(duplicated.value.structure)
    expect(document.nodes[ROOT_ID]?.slots.content).toEqual([FIRST_ID, COPY_FIRST_ID, SECOND_ID])
    expect(document.nodes[COPY_FIRST_ID]?.slots.content).toEqual([COPY_CHILD_ID])
    expectValid(duplicated.value.structure)
  })

  it('bloquea nodos y evita movimientos estructurales hasta desbloquearlos', () => {
    const locked = setNodesLocked(structure(), OWNER, [SECOND_ID], true)
    expect(locked.ok).toBe(true)
    if (!locked.ok) return
    expect(documentOf(locked.value).nodes[SECOND_ID]?.locked).toBe(true)

    const rejected = moveNodes(locked.value, OWNER, [SECOND_ID], { parentId: OTHER_ROOT_ID, slot: 'content', index: 0 })
    expect(rejected).toMatchObject({ ok: false, error: { code: 'locked-node' } })

    const unlocked = setNodesLocked(locked.value, OWNER, [SECOND_ID], false)
    expect(unlocked.ok).toBe(true)
    if (!unlocked.ok) return
    expect(moveNodes(unlocked.value, OWNER, [SECOND_ID], { parentId: OTHER_ROOT_ID, slot: 'content', index: 0 })).toMatchObject({ ok: true })
  })

  it('oculta múltiples nodos y renombra con validación canónica', () => {
    const hidden = setNodesHidden(structure(), OWNER, [FIRST_ID, SECOND_ID], true)
    expect(hidden.ok).toBe(true)
    if (!hidden.ok) return
    expect(documentOf(hidden.value).nodes[FIRST_ID]?.hidden).toBe(true)
    expect(documentOf(hidden.value).nodes[SECOND_ID]?.hidden).toBe(true)

    const renamed = renameNode(hidden.value, OWNER, FIRST_ID, '  Hero principal  ')
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    expect(documentOf(renamed.value).nodes[FIRST_ID]?.name).toBe('Hero principal')
    expectValid(renamed.value)
  })

  it('rechaza IDs duplicados al insertar y mantiene intacta la estructura fuente', () => {
    const source = structure()
    const inserted = insertNode(source, OWNER, widget(FIRST_ID, 'Duplicado'), { parentId: null, slot: null, index: 0 })
    expect(inserted).toMatchObject({ ok: false, error: { code: 'node-id-conflict' } })
    expect(documentOf(source).rootNodeIds).toEqual([ROOT_ID, OTHER_ROOT_ID])
  })

  it('duplica varios hermanos preservando su orden y subárboles', () => {
    const duplicated = duplicateNodes(
      structure(),
      OWNER,
      [FIRST_ID, SECOND_ID],
      idFactory([COPY_FIRST_ID, COPY_CHILD_ID, COPY_SECOND_ID]),
    )
    expect(duplicated.ok).toBe(true)
    if (!duplicated.ok) return

    expect(documentOf(duplicated.value.structure).nodes[ROOT_ID]?.slots.content).toEqual([
      FIRST_ID,
      SECOND_ID,
      COPY_FIRST_ID,
      COPY_SECOND_ID,
    ])
    expectValid(duplicated.value.structure)
  })
})
