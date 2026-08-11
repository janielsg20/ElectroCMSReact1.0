import type { IconName } from '../primitives/Icon'
import type { DeliveryState, NavigationSectionId } from './editor-data'

export interface DemoCapability {
  readonly title: string
  readonly description: string
  readonly state: DeliveryState
  readonly phase: string
  readonly tags?: readonly string[]
}

export interface DemoMetric {
  readonly label: string
  readonly value: string
  readonly hint: string
}

export interface DemoModule {
  readonly id: NavigationSectionId
  readonly title: string
  readonly eyebrow: string
  readonly summary: string
  readonly icon: IconName
  readonly metrics: readonly DemoMetric[]
  readonly capabilities: readonly DemoCapability[]
}

const active = (title: string, description: string, tags?: readonly string[]): DemoCapability => ({ title, description, state: 'active', phase: 'Actual', tags })
const development = (title: string, description: string, tags?: readonly string[]): DemoCapability => ({ title, description, state: 'development', phase: 'En desarrollo', tags })
const planned = (title: string, description: string, tags?: readonly string[]): DemoCapability => ({ title, description, state: 'planned', phase: 'Próxima fase', tags })

export const demoModules: readonly DemoModule[] = [
  {
    id: 'dashboard',
    title: 'Centro de control',
    eyebrow: 'Inicio · Visión global',
    summary: 'Una lectura de alta densidad del proyecto: progreso, actividad, salud, accesos rápidos y mapa completo de capacidades.',
    icon: 'sparkles',
    metrics: [
      { label: 'Proyecto', value: 'Revista Horizonte', hint: 'Local-first' },
      { label: 'Superficies', value: '17', hint: 'Demo navegable' },
      { label: 'Guardado', value: 'Local', hint: 'Autosave preparado' },
      { label: 'Salida', value: '3 modos', hint: 'Local · LAMP · WordPress' },
    ],
    capabilities: [
      development('Dashboard operativo', 'KPIs del proyecto, actividad reciente, progreso por fases, salud y accesos rápidos.', ['KPIs', 'actividad']),
      development('Mapa de implementación', 'Vista por estados Activo, En desarrollo y Próxima fase sin ocultar funcionalidades futuras.', ['fases', 'tracking']),
      planned('Centro de notificaciones', 'Alertas de validación, publicación, autosave, conflictos, tareas y errores.', ['alertas']),
      planned('Command palette', 'Búsqueda global de páginas, widgets, acciones, contenidos, campos y ajustes.', ['buscar', 'atajos']),
      planned('Recientes y favoritos', 'Proyectos, páginas, componentes, plantillas y recursos usados recientemente.', ['productividad']),
      planned('Health checks', 'Estado de proyecto, consistencia de datos, enlaces rotos, rendimiento y accesibilidad.', ['QA', 'a11y']),
    ],
  },
  {
    id: 'editor',
    title: 'Editor visual',
    eyebrow: 'Construir · Canvas',
    summary: 'Constructor visual de precisión con canvas dominante, paneles acoplables, inspector, capas y comportamiento responsive.',
    icon: 'editor',
    metrics: [
      { label: 'Canvas', value: 'Activo', hint: 'Responsive' },
      { label: 'Paneles', value: '2', hint: 'Dock · float · resize' },
      { label: 'Breakpoints', value: '3', hint: 'Mobile · Tablet · Desktop' },
      { label: 'Historial', value: 'UI lista', hint: 'Lógica progresiva' },
    ],
    capabilities: [
      active('Canvas visual responsive', 'Viewport móvil, tablet y escritorio con foco visual en el documento.', ['canvas', 'responsive']),
      active('Capas y jerarquía', 'Árbol visual de elementos con selección sincronizada con canvas e inspector.', ['layers']),
      active('Inspector contextual', 'Propiedades, acción y backend en panel lateral de alta densidad.', ['inspector']),
      active('Paneles profesionales', 'Acoplar, desacoplar, mover, redimensionar, minimizar, fijar y restaurar.', ['workspace']),
      development('Drag & drop real', 'Inserción y reordenamiento de componentes directamente sobre el lienzo.', ['DnD']),
      development('Transformaciones directas', 'Mover, escalar, redimensionar y rotar con handles visuales.', ['transform']),
      planned('Guías y snapping', 'Guías inteligentes, alineación, espaciado, reglas y magnetismo configurable.', ['snapping', 'guides']),
      planned('Zoom y navegación', 'Zoom, pan, fit-to-screen, mini mapa y navegación rápida por el documento.', ['zoom']),
      planned('Historial completo', 'Undo/redo, timeline, snapshots, comparación y recuperación segura.', ['history']),
      planned('Edición multi-selección', 'Selección múltiple, agrupación, distribución, alineación y edición masiva.', ['multi-select']),
      planned('Estados responsive', 'Overrides por breakpoint y visualización de cambios heredados.', ['breakpoints']),
      planned('Preview interactivo', 'Vista previa sin chrome del editor, rutas y estados de interacción.', ['preview']),
    ],
  },
  {
    id: 'pages',
    title: 'Páginas y rutas',
    eyebrow: 'Construir · Estructura',
    summary: 'Gestión completa de páginas, rutas, layouts, SEO y condiciones de publicación desde una sola superficie.',
    icon: 'layers',
    metrics: [
      { label: 'Páginas demo', value: '4', hint: 'Inicio · Artículos · Acerca · Contacto' },
      { label: 'Layouts', value: '3', hint: 'Globales' },
      { label: 'SEO', value: 'Preview', hint: 'Metadatos' },
      { label: 'Estados', value: '3', hint: 'Draft · Ready · Live' },
    ],
    capabilities: [
      development('Árbol de páginas', 'Jerarquías, rutas, slug, orden, duplicado y navegación por documento.'),
      planned('Layouts globales', 'Header, footer, shell, sidebar y regiones reutilizables por página.'),
      planned('Rutas dinámicas', 'Páginas generadas desde colecciones y parámetros de contenido.'),
      planned('SEO por página', 'Title, description, canonical, Open Graph, indexación y preview de snippet.'),
      planned('Estados de página', 'Borrador, revisión, lista para publicar y publicada.'),
      planned('404 y especiales', '404, búsqueda, archivos, login, mantenimiento y páginas del sistema.'),
      planned('Responsive por página', 'Overrides de layout, visibilidad y comportamiento por breakpoint.'),
      planned('Permisos de página', 'Acceso por rol, autenticación, estado de usuario y condiciones.'),
    ],
  },
  {
    id: 'components',
    title: 'Componentes y widgets',
    eyebrow: 'Construir · Biblioteca',
    summary: 'Biblioteca tipo Canva/Elementor con búsqueda, categorías, favoritos, recientes y componentes reutilizables.',
    icon: 'columns',
    metrics: [
      { label: 'Categorías', value: '9', hint: 'UI + CMS + forms' },
      { label: 'Biblioteca', value: 'Visual', hint: 'Buscar y filtrar' },
      { label: 'Reutilizables', value: 'Ready UI', hint: 'Componentes globales' },
      { label: 'Bindings', value: 'Preview', hint: 'Datos dinámicos' },
    ],
    capabilities: [
      development('Estructura', 'Container, section, columns, grid, stack, spacer, divider y layout responsive.'),
      development('Contenido básico', 'Heading, text, rich text, image, icon, video, gallery, logo y shapes.'),
      planned('Navegación', 'Top bar, nav bar, breadcrumbs, tabs, menus, mobile menu, pagination y anchors.'),
      planned('Marketing', 'Hero, feature list, testimonial, pricing, CTA, stats, logos, FAQ y footer.'),
      planned('Interacción', 'Button, dropdown, modal, drawer, tooltip, accordion, carousel y tabs.'),
      planned('CMS dinámico', 'Listing grid, dynamic field, dynamic image, repeater, taxonomy, query loop y related items.'),
      planned('Comercio', 'Producto, precio, características, stock, badge, carrito y acciones comerciales.'),
      planned('Formularios', 'Input, textarea, select, checkbox, radio, switch, upload, date, search y submit.'),
      planned('Componentes globales', 'Crear, editar, versionar, instanciar y desvincular componentes reutilizables.'),
      planned('Biblioteca profesional', 'Búsqueda, filtros, miniaturas, categorías, recientes, favoritos y drag & drop.'),
      planned('Variantes y estados', 'Default, hover, focus, active, disabled, loading, error y variantes custom.'),
      planned('Accesibilidad', 'Roles, labels, navegación por teclado, foco visible y comprobaciones semánticas.'),
    ],
  },
  {
    id: 'templates',
    title: 'Plantillas',
    eyebrow: 'Construir · Aceleradores',
    summary: 'Sistema de plantillas de frontend, backend, páginas y bloques para arrancar proyectos completos sin perder configurabilidad.',
    icon: 'window',
    metrics: [
      { label: 'Familias UI', value: '9+', hint: 'Minimal · Bento · SaaS…' },
      { label: 'Frontend', value: 'Preview', hint: 'Sitios completos' },
      { label: 'Backend', value: 'Preview', hint: 'Admin adaptable' },
      { label: 'Bloques', value: 'Preview', hint: 'Secciones reutilizables' },
    ],
    capabilities: [
      planned('Sitios completos', 'Plantillas de negocio, portfolio, revista, restaurante, comercio, SaaS y landing.'),
      planned('Frontend por estilo', 'High Density, Bento Grid, Minimal Clean, Editorial, Sophisticated Dark, SaaS, Material, Corporate y Developer Console.'),
      planned('Backends prediseñados', 'Dashboards, CRUD, inventario, contenidos, ventas, reservas y paneles por rol.'),
      planned('Páginas prediseñadas', 'Home, about, contact, blog, listing, detail, pricing, login, account y dashboard.'),
      planned('Secciones y patrones', 'Headers, heroes, grids, features, CTA, social proof, forms, pricing y footers.'),
      planned('Aplicación no destructiva', 'Aplicar plantilla completa o parcial con preview y control de reemplazos.'),
      planned('Tokens por plantilla', 'Colores, tipografía, espaciado, radios, sombras y densidad configurables.'),
      planned('Plantillas de usuario', 'Guardar proyecto, página, sección o componente como plantilla personal.'),
    ],
  },
  {
    id: 'assets',
    title: 'Recursos',
    eyebrow: 'Construir · Media',
    summary: 'Gestor central de imágenes, iconos, fuentes, documentos y recursos con optimización y referencias seguras.',
    icon: 'image',
    metrics: [
      { label: 'Media', value: 'Preview', hint: 'Grid + list' },
      { label: 'Optimización', value: 'Plan', hint: 'WebP · AVIF' },
      { label: 'Fuentes', value: 'Plan', hint: 'Locales y web' },
      { label: 'Referencias', value: 'Plan', hint: 'Uso rastreable' },
    ],
    capabilities: [
      planned('Biblioteca multimedia', 'Grid/list, carpetas, búsqueda, etiquetas, filtros y favoritos.'),
      planned('Carga y reemplazo', 'Drag & drop, carga múltiple, reemplazo sin romper referencias y metadatos.'),
      planned('Optimización de imagen', 'Resize, crop, formatos modernos, compresión, srcset y lazy loading.'),
      planned('Iconografía', 'Librería consistente, packs custom, SVG y control de stroke/tamaño.'),
      planned('Fuentes', 'Fuentes locales, variables, pesos, fallback y asignación a tokens.'),
      planned('Auditoría de uso', 'Dónde se usa cada recurso y detección de archivos huérfanos.'),
      planned('Alt text y accesibilidad', 'Texto alternativo, captions y avisos de accesibilidad.'),
      planned('Exportación de assets', 'Estructura optimizada y rutas compatibles con cada target de publicación.'),
    ],
  },
  {
    id: 'content',
    title: 'Contenido',
    eyebrow: 'Datos · CMS',
    summary: 'Edición editorial y estructurada para páginas, entradas, productos y cualquier tipo de contenido definido por el proyecto.',
    icon: 'content',
    metrics: [
      { label: 'Tipos demo', value: '4', hint: 'Page · Post · Product · Custom' },
      { label: 'Vista', value: 'Tabla', hint: 'Filtros + bulk' },
      { label: 'Drafts', value: 'Plan', hint: 'Workflow' },
      { label: 'Binding', value: 'Plan', hint: 'Canvas ↔ datos' },
    ],
    capabilities: [
      development('Listado de contenido', 'Tabla densa con búsqueda, filtros, orden, columnas y acciones masivas.'),
      planned('Editor de contenido', 'Campos estructurados, rich text, media, relaciones y validación.'),
      planned('Estados editoriales', 'Borrador, revisión, programado, publicado, archivado y papelera.'),
      planned('Contenido dinámico en canvas', 'Binding directo a texto, imagen, enlaces, listas y propiedades.'),
      planned('Acciones masivas', 'Publicar, archivar, duplicar, etiquetar, exportar y eliminar.'),
      planned('Revisiones', 'Historial de cambios, autor, comparación y restauración.'),
      planned('Importación/exportación', 'CSV/JSON y mapeo de campos para migraciones.'),
      planned('Contenido local-first', 'Persistencia local con estrategia de exportación sin depender de nube.'),
    ],
  },
  {
    id: 'collections',
    title: 'Colecciones y modelo de datos',
    eyebrow: 'Datos · Estructura',
    summary: 'Modelado tipo JetEngine/ACF para tipos de contenido, taxonomías, relaciones, consultas y vistas dinámicas.',
    icon: 'layers',
    metrics: [
      { label: 'CPT', value: 'Preview', hint: 'Custom content' },
      { label: 'Relaciones', value: 'Plan', hint: '1:1 · 1:N · N:N' },
      { label: 'Queries', value: 'Plan', hint: 'Visual builder' },
      { label: 'Taxonomías', value: 'Plan', hint: 'Jerarquía' },
    ],
    capabilities: [
      planned('Tipos de contenido', 'Crear tipos de contenido personalizados con labels, icono, capacidades y estructura.'),
      planned('Taxonomías', 'Categorías y taxonomías jerárquicas o planas asociadas a tipos de contenido.'),
      planned('Relaciones', 'Uno a uno, uno a muchos y muchos a muchos entre contenidos y usuarios.'),
      planned('Query Builder', 'Consultas visuales con filtros, orden, meta, relaciones, paginación y límites.'),
      planned('Listing Builder', 'Plantillas de tarjeta/listado conectadas a consultas dinámicas.'),
      planned('Repeater y datos anidados', 'Estructuras repetibles, grupos y contenido compuesto.'),
      planned('Options pages', 'Datos globales del sitio, negocio, contacto, branding y configuración.'),
      planned('Datos condicionales', 'Visibilidad y contenido según valor, usuario, rol, fecha o contexto.'),
    ],
  },
  {
    id: 'fields',
    title: 'Custom Fields',
    eyebrow: 'Datos · Campos',
    summary: 'Sistema de campos configurables conectado al CMS, formularios, inspector, backend y frontend.',
    icon: 'code',
    metrics: [
      { label: 'Tipos', value: '20+', hint: 'Texto · media · relation…' },
      { label: 'Grupos', value: 'Plan', hint: 'Reusable' },
      { label: 'Binding', value: 'Plan', hint: 'Visual' },
      { label: 'Validación', value: 'Plan', hint: 'Rules' },
    ],
    capabilities: [
      planned('Campos básicos', 'Texto, textarea, número, email, URL, teléfono, fecha, hora, color y boolean.'),
      planned('Campos de selección', 'Select, radio, checkbox, multi-select y opciones dinámicas.'),
      planned('Media y archivos', 'Imagen, galería, archivo, icono y video.'),
      planned('Campos avanzados', 'Repeater, group, relation, post/object, user, taxonomy y calculated.'),
      planned('Grupos de campos', 'Agrupar, ordenar, reutilizar y asignar campos por reglas de ubicación.'),
      planned('Validación y dependencias', 'Required, min/max, regex, condiciones y visibilidad dependiente.'),
      planned('Inspector directo', 'Editar valores y bindings desde el inspector sin abandonar el canvas.'),
      planned('API de valores', 'Acceso consistente desde frontend, backend, forms y exportadores.'),
    ],
  },
  {
    id: 'forms',
    title: 'Formularios y acciones',
    eyebrow: 'Datos · Interacción',
    summary: 'Constructor visual tipo JetFormBuilder con campos, validación, condiciones y acciones post-submit.',
    icon: 'form',
    metrics: [
      { label: 'Builder', value: 'Preview', hint: 'Visual' },
      { label: 'Actions', value: 'Plan', hint: 'Post-submit' },
      { label: 'Logic', value: 'Plan', hint: 'Conditional' },
      { label: 'Storage', value: 'Plan', hint: 'Local/exportable' },
    ],
    capabilities: [
      planned('Constructor visual', 'Campos arrastrables, secciones, pasos, columnas y diseño responsive.'),
      planned('Validación', 'Required, tipos, patrones, reglas custom, mensajes y validación cliente/servidor.'),
      planned('Lógica condicional', 'Mostrar, ocultar, requerir o calcular campos según condiciones.'),
      planned('Acciones post-submit', 'Guardar, crear/editar contenido, email, redirect, webhook y acciones custom.'),
      planned('Formularios de usuario', 'Registro, login, perfil, recuperación y cambio de contraseña.'),
      planned('Front-end editing', 'Crear y editar contenido desde formularios conectados al modelo de datos.'),
      planned('Multi-step', 'Pasos, progreso, validación por etapa y persistencia de borrador.'),
      planned('Spam y seguridad', 'Honeypot, rate limit, tokens, validación y protección de acciones.'),
    ],
  },
  {
    id: 'backend',
    title: 'Backend Builder',
    eyebrow: 'Operación · Administración',
    summary: 'Generador de backends configurable según el tipo de web: dashboard, CRUD, inventario, listados y herramientas por rol.',
    icon: 'settings',
    metrics: [
      { label: 'Dashboards', value: 'Preview', hint: 'Por rol' },
      { label: 'CRUD', value: 'Plan', hint: 'Auto + custom' },
      { label: 'Inventario', value: 'Plan', hint: 'Listados y stock' },
      { label: 'Widgets admin', value: 'Plan', hint: 'Reusable' },
    ],
    capabilities: [
      planned('Dashboard administrativo', 'KPIs, cards, tablas, actividad, gráficos y accesos por rol.'),
      planned('CRUD generator', 'Listar, crear, ver, editar y eliminar registros de cualquier colección.'),
      planned('Inventarios y catálogos', 'Stock, estados, categorías, filtros, variantes y movimientos.'),
      planned('Gestión editorial', 'Colas de revisión, borradores, publicaciones y acciones masivas.'),
      planned('Layouts de backend', 'Sidebar, topbar, tabs, tables, drawers, modals y formularios administrativos.'),
      planned('Permisos por módulo', 'Visibilidad y acciones según rol/capacidad.'),
      planned('Widgets de administración', 'Métricas, tablas, gráficos, activity feed, quick actions y notices.'),
      planned('Backend específico por proyecto', 'Configurar módulos distintos para negocio, restaurante, ecommerce, CMS o app interna.'),
    ],
  },
  {
    id: 'users',
    title: 'Usuarios, roles y permisos',
    eyebrow: 'Operación · Acceso',
    summary: 'Gestión de identidad y autorización para frontend y backend, con roles configurables y reglas de visibilidad.',
    icon: 'users',
    metrics: [
      { label: 'Roles demo', value: '4', hint: 'Admin · Editor · Author · Member' },
      { label: 'Permisos', value: 'Plan', hint: 'Granulares' },
      { label: 'Auth UI', value: 'Plan', hint: 'Login/logout' },
      { label: 'Visibility', value: 'Plan', hint: 'Conditional' },
    ],
    capabilities: [
      planned('Roles configurables', 'Crear roles y capacidades sin depender de perfiles rígidos.'),
      planned('Permisos granulares', 'Ver, crear, editar, publicar, eliminar y administrar por recurso.'),
      planned('Usuarios', 'Listado, búsqueda, filtros, estado, perfil y acciones administrativas.'),
      planned('Autenticación UI', 'Login, logout, registro, perfil, recuperación y estados autenticados.'),
      planned('Contenido por usuario', 'Relaciones author/owner y dashboards personalizados.'),
      planned('Visibilidad condicional', 'Mostrar componentes, páginas y acciones por rol, usuario o login.'),
      planned('Sesiones y seguridad', 'Expiración, bloqueo, políticas y registro de actividad.'),
      planned('Exportación de permisos', 'Mapear el modelo local a WordPress/LAMP según target.'),
    ],
  },
  {
    id: 'integrations',
    title: 'Integraciones',
    eyebrow: 'Operación · Conectores',
    summary: 'Capa de integración desacoplada para APIs, servicios y targets de producción sin comprometer el modo 100% local.',
    icon: 'code',
    metrics: [
      { label: 'Local-first', value: 'Sí', hint: 'Base del producto' },
      { label: 'REST', value: 'Plan', hint: 'Connectors' },
      { label: 'WordPress', value: 'Plan', hint: 'Theme + plugin' },
      { label: 'Webhooks', value: 'Plan', hint: 'Actions' },
    ],
    capabilities: [
      planned('REST APIs', 'Fuentes externas configurables con auth, headers, params y mapeo.'),
      planned('Webhooks', 'Disparadores desde formularios, contenido y workflows.'),
      planned('WordPress bridge', 'Mapeo de CPT, fields, taxonomías, usuarios y templates a paquete exportable.'),
      planned('LAMP adapter', 'Configuración de endpoints y persistencia para PHP/MySQL en servidor tradicional.'),
      planned('Servicios de email', 'Adaptadores configurables sin acoplar el core a un proveedor.'),
      planned('Servicios de media', 'CDN o almacenamiento externo como opción, nunca requisito.'),
      planned('Variables y secretos', 'Configuración por entorno con separación segura de credenciales.'),
      planned('Logs de integración', 'Estado, errores, reintentos y diagnóstico por conector.'),
    ],
  },
  {
    id: 'ai',
    title: 'Asistente IA',
    eyebrow: 'Operación · Aceleración',
    summary: 'Copiloto para generar y refinar estructura, contenido, componentes, datos y configuración sin tomar control opaco del proyecto.',
    icon: 'sparkles',
    metrics: [
      { label: 'Generación', value: 'Plan', hint: 'Layout + content' },
      { label: 'Contexto', value: 'Proyecto', hint: 'Scoped' },
      { label: 'Preview', value: 'Antes de aplicar', hint: 'Seguro' },
      { label: 'Undo', value: 'Requerido', hint: 'Reversible' },
    ],
    capabilities: [
      planned('Generar páginas', 'Crear estructura inicial desde objetivo, contenido y estilo elegido.'),
      planned('Generar secciones', 'Heroes, features, pricing, forms, dashboards y patrones.'),
      planned('Copiar y reescribir', 'Contenido, microcopy, SEO, mensajes y variantes de tono.'),
      planned('Sugerir layout', 'Mejoras de jerarquía, densidad, responsive, accesibilidad y consistencia.'),
      planned('Generar modelo de datos', 'Proponer colecciones, campos, relaciones y formularios.'),
      planned('Asistir backend', 'Proponer dashboards, CRUD, permisos y vistas administrativas.'),
      planned('Explicar cambios', 'Resumen de qué se modificará antes de aplicar una acción.'),
      planned('Aplicación reversible', 'Preview, diff y capacidad de deshacer cambios generados.'),
    ],
  },
  {
    id: 'themes',
    title: 'Temas y sistema visual',
    eyebrow: 'Publicar · Diseño',
    summary: 'Dos niveles separados: tema de la interfaz del builder y sistema visual del sitio/proyecto.',
    icon: 'palette',
    metrics: [
      { label: 'UI themes', value: '3', hint: 'Studio · Bento · Flow' },
      { label: 'Modo', value: 'Light/Dark', hint: 'Activo' },
      { label: 'Tokens', value: 'Activo', hint: 'Base visual' },
      { label: 'Site styles', value: 'Plan', hint: 'Global styles' },
    ],
    capabilities: [
      active('Temas del builder', 'Studio, Bento Motion y Flow Builder intercambiables sin alterar datos del proyecto.'),
      active('Light / Dark', 'Apariencia clara y oscura separada del tema estructural.'),
      development('Tokens de interfaz', 'Colores, superficies, bordes, foco y estados reutilizables.'),
      planned('Global Styles del sitio', 'Paleta, tipografía, espaciado, radios, sombras y escalas del proyecto.'),
      planned('Theme presets', 'Bento Grid, Minimal Clean, Editorial, Sophisticated Dark, SaaS, Material, Corporate y más.'),
      planned('Component defaults', 'Estilos base de headings, buttons, forms, cards, tables y enlaces.'),
      planned('Responsive tokens', 'Escalas y densidad adaptadas por breakpoint.'),
      planned('Style Manager', 'Editar tokens y ver impacto global con preview y rollback.'),
    ],
  },
  {
    id: 'deploy',
    title: 'Exportar y publicar',
    eyebrow: 'Publicar · Targets',
    summary: 'Pipeline de salida para ejecutar el mismo proyecto en local, servidor LAMP o WordPress sin acoplar la experiencia de autoría.',
    icon: 'upload',
    metrics: [
      { label: 'Local', value: 'Target 1', hint: 'Offline-first' },
      { label: 'LAMP', value: 'Target 2', hint: 'PHP + MySQL' },
      { label: 'WordPress', value: 'Target 3', hint: 'Theme + plugin' },
      { label: 'Checks', value: 'Plan', hint: 'Preflight' },
    ],
    capabilities: [
      planned('Build local', 'Paquete ejecutable/exportable para uso local y preview de producción.'),
      planned('Export estático', 'HTML/CSS/JS/assets optimizados cuando el proyecto no requiere backend dinámico.'),
      planned('Servidor LAMP', 'Salida preparada para Apache/PHP/MySQL con configuración y assets.'),
      planned('WordPress', 'Theme + plugin generado para templates, contenido, fields y lógica sin plugins externos obligatorios.'),
      planned('Preflight', 'Validar rutas, assets, datos, accesibilidad, SEO y configuración antes de exportar.'),
      planned('Variables por entorno', 'Local, staging y producción con valores separados.'),
      planned('Versionado de builds', 'Historial de exportaciones, notas y posibilidad de repetir una build.'),
      planned('Reporte de compatibilidad', 'Qué capacidades son directas, adaptadas o requieren configuración por target.'),
    ],
  },
  {
    id: 'settings',
    title: 'Ajustes del proyecto',
    eyebrow: 'Publicar · Configuración',
    summary: 'Configuración central de proyecto, editor, rendimiento, accesibilidad, backups, datos y comportamiento de exportación.',
    icon: 'settings',
    metrics: [
      { label: 'Proyecto', value: 'Local', hint: 'Metadata' },
      { label: 'Preferencias', value: 'Preview', hint: 'Editor' },
      { label: 'Backups', value: 'Plan', hint: 'Recovery' },
      { label: 'A11y', value: 'Plan', hint: 'Checks' },
    ],
    capabilities: [
      development('Preferencias del editor', 'Densidad, tema, paneles, breakpoints, grid, snapping y comportamiento de UI.'),
      planned('Datos del proyecto', 'Nombre, slug, idioma, zona horaria, metadata y configuración base.'),
      planned('Autosave y recuperación', 'Frecuencia, snapshots, recovery y protección ante cierres inesperados.'),
      planned('Rendimiento', 'Optimización de assets, lazy loading, splitting y límites de calidad.'),
      planned('Accesibilidad', 'Reglas, nivel objetivo, avisos y auditoría de contraste/semántica.'),
      planned('SEO global', 'Defaults, sitemap, robots, social y metadatos compartidos.'),
      planned('Import/export de proyecto', 'Backup completo portable de estructura, datos, assets y configuración.'),
      planned('Configuración por target', 'Opciones específicas para local, LAMP y WordPress.'),
    ],
  },
] as const

export function getDemoModule(id: NavigationSectionId): DemoModule {
  return demoModules.find((module) => module.id === id) ?? demoModules[0]
}
