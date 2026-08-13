export type AppSection = 'editor' | 'documents' | 'content' | 'backend' | 'design'

export interface AppSectionDefinition {
  readonly description: string
  readonly icon: 'editor' | 'content' | 'database' | 'palette'
  readonly label: string
  readonly panelTitle: string
  readonly shortLabel: string
}

export const APP_SECTIONS: Readonly<Record<AppSection, AppSectionDefinition>> = {
  editor: {
    description: 'Diseña la página visualmente, añade elementos y ajusta sus propiedades.',
    icon: 'editor',
    label: 'Editor',
    panelTitle: 'Editor visual',
    shortLabel: 'Diseñar',
  },
  documents: {
    description: 'Gestiona las páginas y plantillas reutilizables del sitio.',
    icon: 'content',
    label: 'Páginas',
    panelTitle: 'Páginas y plantillas',
    shortLabel: 'Páginas',
  },
  content: {
    description: 'Crea y administra contenido dinámico, campos, relaciones y consultas.',
    icon: 'database',
    label: 'Contenido',
    panelTitle: 'Contenido dinámico',
    shortLabel: 'Contenido',
  },
  backend: {
    description: 'Convierte y administra lienzos visuales como pantallas del backend, con navegación editable y el mismo motor del editor.',
    icon: 'content',
    label: 'Administración',
    panelTitle: 'Administración visual',
    shortLabel: 'Backend',
  },
  design: {
    description: 'Configura la apariencia global, temas y estilos reutilizables.',
    icon: 'palette',
    label: 'Diseño',
    panelTitle: 'Diseño global',
    shortLabel: 'Diseño',
  },
}

export const APP_SECTION_ORDER: readonly AppSection[] = ['editor', 'documents', 'content', 'backend', 'design']
