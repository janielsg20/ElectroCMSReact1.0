export type AppSection = 'editor' | 'documents' | 'content' | 'design'

export interface AppSectionDefinition {
  readonly description: string
  readonly icon: 'editor' | 'content' | 'database' | 'palette'
  readonly label: string
  readonly panelTitle: string
  readonly shortLabel: string
}

export const APP_SECTIONS: Readonly<Record<AppSection, AppSectionDefinition>> = {
  editor: {
    description: 'Canvas, estructura y widgets del documento actual.',
    icon: 'editor',
    label: 'Editor',
    panelTitle: 'Estructura',
    shortLabel: 'Editor',
  },
  documents: {
    description: 'Páginas, plantillas y documentos del proyecto.',
    icon: 'content',
    label: 'Documentos',
    panelTitle: 'Documentos',
    shortLabel: 'Docs',
  },
  content: {
    description: 'Tipos, taxonomías, campos, registros y relaciones CMS.',
    icon: 'database',
    label: 'Contenido',
    panelTitle: 'Contenido CMS',
    shortLabel: 'CMS',
  },
  design: {
    description: 'Temas, presets y paquetes visuales del proyecto.',
    icon: 'palette',
    label: 'Diseño',
    panelTitle: 'Diseño',
    shortLabel: 'Diseño',
  },
}

export const APP_SECTION_ORDER: readonly AppSection[] = ['editor', 'documents', 'content', 'design']
