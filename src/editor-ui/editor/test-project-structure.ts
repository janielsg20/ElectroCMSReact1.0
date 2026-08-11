import {
  DEFAULT_BREAKPOINTS,
  ProjectStructureSchema,
  parseDocumentId,
  parseNodeId,
  type JsonValue,
  type Node,
  type NodeId,
} from '../../domain'

export const TEST_DOCUMENT_ID = parseDocumentId('dddddddd-dddd-4ddd-8ddd-dddddddddd01')

const ids = {
  header: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'),
  brand: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'),
  navigation: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'),
  navExplore: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04'),
  navStories: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05'),
  subscribe: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06'),
  hero: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa07'),
  heroContent: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa08'),
  heroEyebrow: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa09'),
  heroHeading: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10'),
  heroText: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'),
  heroActions: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12'),
  readButton: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13'),
  exploreButton: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14'),
  metrics: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15'),
  storiesMetric: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa16'),
  readersMetric: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa17'),
  countriesMetric: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa18'),
  storiesSection: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa19'),
  sectionHeading: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa20'),
  sectionTitle: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa21'),
  cards: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa22'),
  designCard: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa23'),
  citiesCard: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa24'),
  creativeCard: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa25'),
} as const

export const TEST_SELECTED_NODE_ID = ids.heroContent

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

const mobileBreakpointId = DEFAULT_BREAKPOINTS[4]?.id
if (!mobileBreakpointId) throw new Error('Falta el breakpoint móvil predeterminado.')

const nodes: Record<NodeId, Node> = {
  [ids.header]: widgetNode(ids.header, 'Header', 'layout.site-header', {}, { content: [ids.brand, ids.navigation, ids.subscribe] }),
  [ids.brand]: widgetNode(ids.brand, 'Marca', 'content.brand', { text: 'Proyecto' }),
  [ids.navigation]: {
    ...widgetNode(ids.navigation, 'Navegación', 'layout.navigation', {}, { content: [ids.navExplore, ids.navStories] }),
    responsive: { [mobileBreakpointId]: { hidden: true, properties: {}, styles: {} } },
  },
  [ids.navExplore]: widgetNode(ids.navExplore, 'Explorar', 'content.link', { href: '#explorar', text: 'Explorar' }),
  [ids.navStories]: widgetNode(ids.navStories, 'Historias', 'content.link', { href: '#historias', text: 'Historias' }),
  [ids.subscribe]: widgetNode(ids.subscribe, 'Suscríbete', 'content.button', { text: 'Suscríbete' }),
  [ids.hero]: widgetNode(ids.hero, 'Hero principal', 'layout.hero', {}, { content: [ids.heroContent] }),
  [ids.heroContent]: widgetNode(ids.heroContent, 'Contenido hero', 'layout.hero-content', {}, { content: [ids.heroEyebrow, ids.heroHeading, ids.heroText, ids.heroActions] }),
  [ids.heroEyebrow]: widgetNode(ids.heroEyebrow, 'Antetítulo', 'content.eyebrow', { text: 'Estructura canónica de prueba' }),
  [ids.heroHeading]: widgetNode(ids.heroHeading, 'Encabezado', 'content.heading', { level: 1, text: 'Documento de prueba' }),
  [ids.heroText]: widgetNode(ids.heroText, 'Introducción', 'content.text', { text: 'Contenido técnico para verificar el renderer y la manipulación directa.' }),
  [ids.heroActions]: widgetNode(ids.heroActions, 'Acciones', 'layout.actions', {}, { content: [ids.readButton, ids.exploreButton] }),
  [ids.readButton]: widgetNode(ids.readButton, 'Leer la edición', 'content.button', { text: 'Leer la edición' }),
  [ids.exploreButton]: widgetNode(ids.exploreButton, 'Explorar', 'content.button', { text: 'Explorar' }),
  [ids.metrics]: widgetNode(ids.metrics, 'Métricas', 'layout.metrics', {}, { content: [ids.storiesMetric, ids.readersMetric, ids.countriesMetric] }),
  [ids.storiesMetric]: widgetNode(ids.storiesMetric, 'Historias', 'content.metric', { label: 'Historias', value: '48' }),
  [ids.readersMetric]: widgetNode(ids.readersMetric, 'Lectores', 'content.metric', { label: 'Lectores', value: '12k' }),
  [ids.countriesMetric]: widgetNode(ids.countriesMetric, 'Países', 'content.metric', { label: 'Países', value: '18' }),
  [ids.storiesSection]: widgetNode(ids.storiesSection, 'Últimas historias', 'layout.section', {}, { content: [ids.sectionHeading, ids.cards] }),
  [ids.sectionHeading]: widgetNode(ids.sectionHeading, 'Encabezado de sección', 'layout.section-heading', {}, { content: [ids.sectionTitle] }),
  [ids.sectionTitle]: widgetNode(ids.sectionTitle, 'Últimas historias', 'content.heading', { level: 2, text: 'Últimas historias' }),
  [ids.cards]: widgetNode(ids.cards, 'Tarjetas editoriales', 'layout.cards', {}, { content: [ids.designCard, ids.citiesCard, ids.creativeCard] }),
  [ids.designCard]: widgetNode(ids.designCard, 'Diseño humano', 'content.card', { title: 'Diseño humano' }),
  [ids.citiesCard]: widgetNode(ids.citiesCard, 'Ciudades futuras', 'content.card', { title: 'Ciudades futuras' }),
  [ids.creativeCard]: widgetNode(ids.creativeCard, 'Trabajo creativo', 'content.card', { title: 'Trabajo creativo' }),
}

export const TEST_PROJECT_STRUCTURE = ProjectStructureSchema.parse({
  breakpoints: DEFAULT_BREAKPOINTS,
  documents: {
    [TEST_DOCUMENT_ID]: {
      id: TEST_DOCUMENT_ID,
      kind: 'page',
      name: 'Inicio',
      nodes,
      rootNodeIds: [ids.header, ids.hero, ids.metrics, ids.storiesSection],
    },
  },
  globalComponents: {},
})
