import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseBreakpointId,
  parseDocumentId,
  parseGlobalComponentId,
  parseNodeId,
  type NodeId,
} from './identity'
import { ProjectStructureSchema } from './structure-schema'
import { resolveNodeResponsiveState, validateProjectStructure } from './validate-structure'

const DOCUMENT_ID = parseDocumentId('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
const ROOT_NODE_ID = parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const CHILD_NODE_ID = parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const COMPONENT_ID = parseGlobalComponentId('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
const COMPONENT_NODE_ID = parseNodeId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
const MISSING_NODE_ID = parseNodeId('99999999-9999-4999-8999-999999999999')
const MISSING_BREAKPOINT_ID = parseBreakpointId('99999999-9999-4999-8999-999999999999')

function nodeBase(id: NodeId, slots: Record<string, NodeId[]> = {}) {
  return {
    id,
    name: `Nodo ${id.slice(0, 4)}`,
    properties: { label: 'Base' },
    styles: { gap: 24 },
    bindings: {},
    conditions: [],
    responsive: {},
    slots,
    locked: false,
  }
}

function widgetNode(id: NodeId, slots: Record<string, NodeId[]> = {}) {
  return {
    ...nodeBase(id, slots),
    kind: 'widget' as const,
    widgetType: 'core.container',
  }
}

function componentNode(id: NodeId, componentId: ReturnType<typeof parseGlobalComponentId>) {
  return {
    ...nodeBase(id),
    kind: 'component-instance' as const,
    componentId,
  }
}

function validStructure() {
  const desktopId = DEFAULT_BREAKPOINTS[0]?.id
  const tabletPortraitId = DEFAULT_BREAKPOINTS[3]?.id
  const mobileSmallId = DEFAULT_BREAKPOINTS[5]?.id
  if (!desktopId || !tabletPortraitId || !mobileSmallId) throw new Error('Faltan breakpoints base.')

  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS.map((breakpoint) => ({ ...breakpoint })),
    documents: {
      [DOCUMENT_ID]: {
        id: DOCUMENT_ID,
        name: 'Inicio',
        kind: 'page',
        rootNodeIds: [ROOT_NODE_ID],
        nodes: {
          [ROOT_NODE_ID]: {
            ...widgetNode(ROOT_NODE_ID, { content: [CHILD_NODE_ID] }),
            responsive: {
              [desktopId]: {
                properties: {},
                styles: { color: 'violet' },
              },
              [tabletPortraitId]: {
                properties: { label: 'Tablet' },
                styles: { gap: 16 },
              },
              [mobileSmallId]: {
                properties: {},
                styles: { gap: 8 },
                hidden: false,
              },
            },
          },
          [CHILD_NODE_ID]: {
            ...widgetNode(CHILD_NODE_ID),
            bindings: {
              text: {
                kind: 'node-property',
                nodeId: ROOT_NODE_ID,
                path: ['properties', 'label'],
              },
            },
          },
        },
      },
    },
    globalComponents: {
      [COMPONENT_ID]: {
        id: COMPONENT_ID,
        name: 'Tarjeta global',
        rootNodeIds: [COMPONENT_NODE_ID],
        nodes: {
          [COMPONENT_NODE_ID]: widgetNode(COMPONENT_NODE_ID),
        },
      },
    },
  })
}

function diagnosticCodes(input: unknown): string[] {
  const result = validateProjectStructure(input)
  return result.ok ? [] : result.error.map((diagnostic) => diagnostic.code)
}

describe('estructura canónica de documentos', () => {
  it('valida árboles normalizados, slots, bindings y componentes', () => {
    const result = validateProjectStructure(validStructure())
    expect(result.ok).toBe(true)
  })

  it('resuelve overrides siguiendo toda la cadena de herencia', () => {
    const mobileSmallId = DEFAULT_BREAKPOINTS[5]?.id
    if (!mobileSmallId) throw new Error('Falta el breakpoint móvil pequeño.')

    const resolved = resolveNodeResponsiveState(
      validStructure(),
      parseNodeId(ROOT_NODE_ID),
      parseBreakpointId(mobileSmallId),
    )

    expect(resolved).toEqual({
      ok: true,
      value: {
        properties: { label: 'Tablet' },
        styles: { gap: 8, color: 'violet' },
        hidden: false,
      },
    })
  })

  it('diagnostica ciclos, referencias ausentes, padres múltiples y huérfanos', () => {
    const cyclic = validStructure()
    const document = cyclic.documents[DOCUMENT_ID]
    document.nodes[CHILD_NODE_ID] = {
      ...document.nodes[CHILD_NODE_ID],
      slots: { content: [ROOT_NODE_ID] },
    }
    const cyclicCodes = diagnosticCodes(cyclic)
    expect(cyclicCodes).toContain('node-cycle')
    expect(cyclicCodes).toContain('multiple-node-parents')

    const broken = validStructure()
    broken.documents[DOCUMENT_ID].nodes[ROOT_NODE_ID] = {
      ...broken.documents[DOCUMENT_ID].nodes[ROOT_NODE_ID],
      slots: { content: [MISSING_NODE_ID] },
    }
    const brokenCodes = diagnosticCodes(broken)
    expect(brokenCodes).toContain('missing-node-reference')
    expect(brokenCodes).toContain('orphan-node')
  })

  it('diagnostica herencia cíclica y overrides sin breakpoint', () => {
    const structure = validStructure()
    const first = structure.breakpoints[0]
    const second = structure.breakpoints[1]
    if (!first || !second) throw new Error('Faltan breakpoints para la prueba.')
    const firstId = first.id
    const secondId = second.id

    structure.breakpoints[0] = { ...first, inheritsFrom: secondId }
    structure.breakpoints[1] = { ...second, inheritsFrom: firstId }
    structure.documents[DOCUMENT_ID].nodes[ROOT_NODE_ID] = {
      ...structure.documents[DOCUMENT_ID].nodes[ROOT_NODE_ID],
      responsive: {
        ...structure.documents[DOCUMENT_ID].nodes[ROOT_NODE_ID].responsive,
        [MISSING_BREAKPOINT_ID]: { properties: {}, styles: {} },
      },
    }

    const codes = diagnosticCodes(structure)
    expect(codes).toContain('breakpoint-cycle')
    expect(codes).toContain('missing-breakpoint-override')
  })

  it('diagnostica bindings y componentes globales rotos o recursivos', () => {
    const brokenBinding = validStructure()
    brokenBinding.documents[DOCUMENT_ID].nodes[CHILD_NODE_ID] = {
      ...brokenBinding.documents[DOCUMENT_ID].nodes[CHILD_NODE_ID],
      bindings: {
        text: {
          kind: 'node-property',
          nodeId: MISSING_NODE_ID,
          path: ['properties', 'label'],
        },
      },
    }
    expect(diagnosticCodes(brokenBinding)).toContain('missing-binding-node')

    const recursiveComponents = validStructure()
    const secondComponentId = parseGlobalComponentId('77777777-7777-4777-8777-777777777777')
    const secondComponentNodeId = parseNodeId('88888888-8888-4888-8888-888888888888')
    recursiveComponents.globalComponents[COMPONENT_ID].nodes[COMPONENT_NODE_ID] = componentNode(
      COMPONENT_NODE_ID,
      secondComponentId,
    )
    recursiveComponents.globalComponents[secondComponentId] = {
      id: secondComponentId,
      name: 'Componente recursivo',
      rootNodeIds: [secondComponentNodeId],
      nodes: {
        [secondComponentNodeId]: componentNode(secondComponentNodeId, COMPONENT_ID),
      },
    }
    expect(diagnosticCodes(recursiveComponents)).toContain('component-cycle')
  })

  it('genera JSON Schema estricto para el payload estructural', () => {
    const jsonSchema = ProjectStructureSchema.toJSONSchema()
    expect(jsonSchema).toMatchObject({ type: 'object', additionalProperties: false })
  })
})
