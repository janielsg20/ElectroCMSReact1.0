import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { parseDocumentId, parseNodeId, type NodeId } from './identity'
import { ProjectStructureSchema, type Node, type ProjectStructure } from './structure-schema'
import { type TreeOwner } from './tree-operations'
import { readCanonicalNodeSpacing, resizeNode, snapValue, updateNodeSpacing } from './direct-manipulation'

const DOCUMENT_ID = parseDocumentId('40000000-0000-4000-8000-000000000001')
const NODE_ID = parseNodeId('40000000-0000-4000-8000-000000000002')
const OWNER: TreeOwner = { documentId: DOCUMENT_ID, kind: 'document' }

function widget(id: NodeId): Node {
  return {
    bindings: {},
    conditions: [],
    hidden: false,
    id,
    kind: 'widget',
    locked: false,
    name: 'Contenedor',
    properties: {},
    responsive: {},
    slots: {},
    styles: {},
    widgetType: 'layout.container',
  }
}

function structure(): ProjectStructure {
  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS,
    documents: {
      [DOCUMENT_ID]: {
        id: DOCUMENT_ID,
        kind: 'page',
        name: 'Inicio',
        nodes: { [NODE_ID]: widget(NODE_ID) },
        rootNodeIds: [NODE_ID],
      },
    },
    globalComponents: {},
  })
}

describe('M05.4 manipulación directa canónica', () => {
  it('prioriza guías cercanas y usa retícula de ocho píxeles fuera del umbral', () => {
    expect(snapValue(317, [320])).toEqual({ source: 'guide', value: 320 })
    expect(snapValue(313, [320])).toEqual({ source: 'grid', value: 312 })
  })

  it('guarda tamaño en el breakpoint activo sin mutar el input', () => {
    const source = structure()
    const breakpointId = DEFAULT_BREAKPOINTS[0]?.id
    if (!breakpointId) throw new Error('Falta breakpoint desktop.')
    const result = resizeNode(source, { breakpointId, nodeId: NODE_ID, owner: OWNER }, { height: 184, width: 456 })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(source.documents[DOCUMENT_ID]?.nodes[NODE_ID]?.responsive).toEqual({})
    expect(result.value.documents[DOCUMENT_ID]?.nodes[NODE_ID]?.responsive[breakpointId]?.styles).toMatchObject({ height: 184, width: 456 })
  })

  it('persiste padding y margen completos y rechaza nodos bloqueados', () => {
    const spacing = {
      margin: { bottom: 8, left: 16, right: 16, top: 8 },
      padding: { bottom: 24, left: 32, right: 32, top: 24 },
    }
    const updated = updateNodeSpacing(structure(), { nodeId: NODE_ID, owner: OWNER }, spacing)
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(readCanonicalNodeSpacing(updated.value.documents[DOCUMENT_ID]?.nodes[NODE_ID]?.styles ?? {})).toEqual(spacing)

    const locked = structure()
    const node = locked.documents[DOCUMENT_ID]?.nodes[NODE_ID]
    if (!node) throw new Error('Falta nodo.')
    node.locked = true
    expect(resizeNode(locked, { nodeId: NODE_ID, owner: OWNER }, { height: 80, width: 80 })).toMatchObject({ ok: false, error: { code: 'locked-node' } })
  })
})
