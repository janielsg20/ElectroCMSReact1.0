import type { IconName } from '../primitives/Icon'

export interface NavigationItem {
  readonly label: string
  readonly icon: IconName
  readonly available: boolean
}

export interface WidgetItem {
  readonly label: string
  readonly icon: IconName
  readonly category: 'Estructura' | 'Básicos' | 'Dinámicos' | 'Formularios'
}

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Inicio', icon: 'sparkles', available: false },
  { label: 'Editor', icon: 'editor', available: true },
  { label: 'Contenido', icon: 'content', available: false },
  { label: 'Temas', icon: 'palette', available: false },
  { label: 'Formularios', icon: 'form', available: false },
  { label: 'Usuarios', icon: 'users', available: false },
  { label: 'Ajustes', icon: 'settings', available: false },
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
