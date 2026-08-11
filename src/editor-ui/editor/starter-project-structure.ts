import {
  DEFAULT_BREAKPOINTS,
  ProjectStructureSchema,
  parseDocumentId,
  parseNodeId,
  type JsonValue,
  type Node,
  type NodeId,
} from '../../domain'

export const STARTER_DOCUMENT_ID = parseDocumentId('dddddddd-dddd-4ddd-8ddd-dddddddddd02')

const ids = {
  section: parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'),
  container: parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02'),
  heading: parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03'),
  paragraph: parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb04'),
} as const

export const STARTER_SELECTED_NODE_ID = ids.container

function widgetNode(
  id: NodeId,
  name: string,
  widgetType: string,
  properties: Readonly<Record<string, JsonValue>> = {},
  slots: Readonly<Record<string, readonly NodeId[]>> = {},
): Node {
  return {
    bindings: {},
    conditions: [],
    hidden: false,
    id,
    kind: 'widget',
    locked: false,
    name,
    properties: { ...properties },
    responsive: {},
    slots: Object.fromEntries(Object.entries(slots).map(([key, value]) => [key, [...value]])),
    styles: {},
    widgetType,
  }
}

export const STARTER_PROJECT_STRUCTURE = ProjectStructureSchema.parse({
  breakpoints: DEFAULT_BREAKPOINTS,
  documents: {
    [STARTER_DOCUMENT_ID]: {
      id: STARTER_DOCUMENT_ID,
      kind: 'page',
      name: 'Página inicial',
      routePath: '/',
      nodes: {
        [ids.section]: widgetNode(ids.section, 'Sección', 'layout.section', { label: 'Sección principal' }, { content: [ids.container] }),
        [ids.container]: widgetNode(ids.container, 'Contenedor', 'layout.container', { maxWidth: 1200 }, { content: [ids.heading, ids.paragraph] }),
        [ids.heading]: widgetNode(ids.heading, 'Título', 'content.heading', { level: 1, text: 'Proyecto local' }),
        [ids.paragraph]: widgetNode(ids.paragraph, 'Texto', 'content.paragraph', { text: 'Estructura base del editor visual.' }),
      },
      rootNodeIds: [ids.section],
    },
  },
  globalComponents: {},
})
