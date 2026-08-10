import type { IconName } from '../primitives/Icon'

export type NavigationSectionId =
  | 'dashboard'
  | 'editor'
  | 'pages'
  | 'components'
  | 'templates'
  | 'assets'
  | 'content'
  | 'collections'
  | 'fields'
  | 'forms'
  | 'backend'
  | 'users'
  | 'integrations'
  | 'ai'
  | 'themes'
  | 'deploy'
  | 'settings'

export type DeliveryState = 'active' | 'development' | 'planned'
export type NavigationGroup = 'Construir' | 'Datos' | 'Operación' | 'Publicar'

export interface NavigationItem {
  readonly id: NavigationSectionId
  readonly label: string
  readonly icon: IconName
  readonly group: NavigationGroup
  readonly state: DeliveryState
  readonly phase: string
  readonly description: string
}

export interface WidgetItem {
  readonly label: string
  readonly icon: IconName
  readonly category: 'Estructura' | 'Básicos' | 'Dinámicos' | 'Formularios'
}

export const navigationItems: readonly NavigationItem[] = [
  { id: 'dashboard', label: 'Inicio', icon: 'sparkles', group: 'Construir', state: 'development', phase: 'Demo final', description: 'Panel general, progreso, actividad y accesos rápidos.' },
  { id: 'editor', label: 'Editor', icon: 'editor', group: 'Construir', state: 'active', phase: 'Actual', description: 'Canvas visual, capas, inspector, ventanas y responsive.' },
  { id: 'pages', label: 'Páginas', icon: 'layers', group: 'Construir', state: 'development', phase: 'Próxima', description: 'Rutas, jerarquía, SEO, layouts y estados de página.' },
  { id: 'components', label: 'Componentes', icon: 'columns', group: 'Construir', state: 'development', phase: 'Próxima', description: 'Biblioteca de widgets, componentes y patrones reutilizables.' },
  { id: 'templates', label: 'Plantillas', icon: 'window', group: 'Construir', state: 'planned', phase: 'Planificada', description: 'Plantillas completas de frontend, backend y secciones.' },
  { id: 'assets', label: 'Recursos', icon: 'image', group: 'Construir', state: 'planned', phase: 'Planificada', description: 'Imágenes, iconos, fuentes, archivos y optimización.' },
  { id: 'content', label: 'Contenido', icon: 'content', group: 'Datos', state: 'development', phase: 'Próxima', description: 'Entradas, páginas, productos y contenido estructurado.' },
  { id: 'collections', label: 'Colecciones', icon: 'layers', group: 'Datos', state: 'planned', phase: 'Planificada', description: 'Tipos de contenido, taxonomías, relaciones y consultas.' },
  { id: 'fields', label: 'Campos', icon: 'code', group: 'Datos', state: 'planned', phase: 'Planificada', description: 'Custom Fields, grupos, validación, relaciones y binding.' },
  { id: 'forms', label: 'Formularios', icon: 'form', group: 'Datos', state: 'planned', phase: 'Planificada', description: 'Builder de formularios, acciones, validación y lógica.' },
  { id: 'backend', label: 'Backend', icon: 'settings', group: 'Operación', state: 'planned', phase: 'Planificada', description: 'Generador de paneles administrativos, CRUD e inventarios.' },
  { id: 'users', label: 'Usuarios', icon: 'users', group: 'Operación', state: 'planned', phase: 'Planificada', description: 'Usuarios, roles, permisos, sesiones y acceso condicional.' },
  { id: 'integrations', label: 'Integraciones', icon: 'code', group: 'Operación', state: 'planned', phase: 'Planificada', description: 'APIs, WordPress, servicios y conectores externos.' },
  { id: 'ai', label: 'IA', icon: 'sparkles', group: 'Operación', state: 'planned', phase: 'Planificada', description: 'Generación asistida, contenido, layout y automatizaciones.' },
  { id: 'themes', label: 'Temas', icon: 'palette', group: 'Publicar', state: 'active', phase: 'Actual', description: 'Temas del editor, tokens y estilos globales del sitio.' },
  { id: 'deploy', label: 'Exportar', icon: 'upload', group: 'Publicar', state: 'planned', phase: 'Planificada', description: 'Local, build estático, LAMP y paquete WordPress.' },
  { id: 'settings', label: 'Ajustes', icon: 'settings', group: 'Publicar', state: 'development', phase: 'Próxima', description: 'Proyecto, preferencias, rendimiento, accesibilidad y backup.' },
] as const

export const widgets: readonly WidgetItem[] = [
  { label: 'Contenedor', icon: 'columns', category: 'Estructura' },
  { label: 'Columnas', icon: 'columns', category: 'Estructura' },
  { label: 'Encabezado', icon: 'heading', category: 'Básicos' },
  { label: 'Texto', icon: 'text', category: 'Básicos' },
  { label: 'Imagen', icon: 'image', category: 'Básicos' },
  { label: 'Botón', icon: 'button', category: 'Básicos' },
  { label: 'Listado CMS', icon: 'content', category: 'Dinámicos' },
  { label: 'Campo dinámico', icon: 'code', category: 'Dinámicos' },
  { label: 'Formulario', icon: 'form', category: 'Formularios' },
  { label: 'Buscar', icon: 'search', category: 'Formularios' },
] as const

export const layerItems = [
  { id: 'page', label: 'Página · Inicio', depth: 0, icon: 'editor' as const },
  { id: 'header', label: 'Header', depth: 1, icon: 'columns' as const },
  { id: 'hero', label: 'Hero principal', depth: 1, icon: 'image' as const },
  { id: 'hero-content', label: 'Contenido hero', depth: 2, icon: 'columns' as const },
  { id: 'title', label: 'Título', depth: 3, icon: 'heading' as const },
  { id: 'actions', label: 'Acciones', depth: 3, icon: 'button' as const },
  { id: 'featured', label: 'Artículos destacados', depth: 1, icon: 'content' as const },
] as const
