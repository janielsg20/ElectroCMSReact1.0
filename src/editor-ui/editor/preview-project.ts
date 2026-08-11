import { DEFAULT_BREAKPOINTS } from '../../domain/project/default-breakpoints'
import { parseDocumentId, parseNodeId } from '../../domain/project/identity'
import { ProjectStructureSchema } from '../../domain/project/structure-schema'

export const PREVIEW_DOCUMENT_ID = parseDocumentId('41000000-0000-4000-8000-000000000001')
export const PREVIEW_ROOT_ID = parseNodeId('41000000-0000-4000-8000-000000000002')
export const PREVIEW_HEADER_ID = parseNodeId('41000000-0000-4000-8000-000000000003')
export const PREVIEW_HERO_ID = parseNodeId('41000000-0000-4000-8000-000000000004')
export const PREVIEW_STATS_ID = parseNodeId('41000000-0000-4000-8000-000000000005')
export const PREVIEW_STORIES_ID = parseNodeId('41000000-0000-4000-8000-000000000006')

export const PREVIEW_BREAKPOINTS = {
  desktop: DEFAULT_BREAKPOINTS[0]?.id,
  tablet: DEFAULT_BREAKPOINTS[3]?.id,
  mobile: DEFAULT_BREAKPOINTS[5]?.id,
} as const

if (!PREVIEW_BREAKPOINTS.desktop || !PREVIEW_BREAKPOINTS.tablet || !PREVIEW_BREAKPOINTS.mobile) {
  throw new Error('Faltan breakpoints base para el preview canónico.')
}

const nodeBase = {
  styles: {},
  bindings: {},
  conditions: [],
  responsive: {},
  locked: false,
  hidden: false,
}

export const PREVIEW_PROJECT_STRUCTURE = ProjectStructureSchema.parse({
  breakpoints: DEFAULT_BREAKPOINTS.map((breakpoint) => ({ ...breakpoint })),
  documents: {
    [PREVIEW_DOCUMENT_ID]: {
      id: PREVIEW_DOCUMENT_ID,
      name: 'Inicio',
      kind: 'page',
      rootNodeIds: [PREVIEW_ROOT_ID],
      nodes: {
        [PREVIEW_ROOT_ID]: {
          ...nodeBase,
          id: PREVIEW_ROOT_ID,
          name: 'Página',
          kind: 'widget',
          widgetType: 'preview.page',
          properties: {},
          slots: { content: [PREVIEW_HEADER_ID, PREVIEW_HERO_ID, PREVIEW_STATS_ID, PREVIEW_STORIES_ID] },
        },
        [PREVIEW_HEADER_ID]: {
          ...nodeBase,
          id: PREVIEW_HEADER_ID,
          name: 'Navegación',
          kind: 'widget',
          widgetType: 'preview.header',
          properties: { brand: 'Horizonte', action: 'Suscríbete' },
          slots: {},
        },
        [PREVIEW_HERO_ID]: {
          ...nodeBase,
          id: PREVIEW_HERO_ID,
          name: 'Hero',
          kind: 'widget',
          widgetType: 'preview.hero',
          properties: {
            eyebrow: 'Ideas para un mundo en movimiento',
            title: 'Historias que amplían tu horizonte.',
            body: 'Diseño, tecnología y cultura contemporánea en una publicación independiente.',
            primaryAction: 'Leer la edición',
            secondaryAction: 'Explorar',
          },
          styles: { accent: 'blue' },
          slots: {},
        },
        [PREVIEW_STATS_ID]: {
          ...nodeBase,
          id: PREVIEW_STATS_ID,
          name: 'Métricas',
          kind: 'widget',
          widgetType: 'preview.stats',
          properties: {
            items: [
              { value: '48', label: 'Historias' },
              { value: '12k', label: 'Lectores' },
              { value: '18', label: 'Países' },
            ],
          },
          slots: {},
        },
        [PREVIEW_STORIES_ID]: {
          ...nodeBase,
          id: PREVIEW_STORIES_ID,
          name: 'Últimas historias',
          kind: 'widget',
          widgetType: 'preview.stories',
          properties: {
            eyebrow: 'Selección editorial',
            title: 'Últimas historias',
            items: ['Diseño humano', 'Ciudades futuras', 'Trabajo creativo'],
          },
          responsive: {
            [PREVIEW_BREAKPOINTS.mobile]: {
              properties: { title: 'Historias' },
              styles: {},
            },
          },
          slots: {},
        },
      },
    },
  },
  globalComponents: {},
})
