import type { AppSection } from './app-sections'

export interface FeatureHelp {
  readonly description: string
  readonly example?: string
  readonly label: string
  readonly reference: string
}

export const SECTION_HELP: Readonly<Record<AppSection, FeatureHelp>> = {
  editor: {
    label: 'Editor visual',
    description: 'Diseña la página directamente en el lienzo, añade elementos, cambia su orden y ajusta sus propiedades sin escribir código.',
    reference: 'Elementor — Editor visual y Navigator',
    example: 'Arrastra un título o una imagen al lienzo y edítalo desde Propiedades.',
  },
  documents: {
    label: 'Páginas y plantillas',
    description: 'Organiza las páginas del sitio y las plantillas reutilizables que definen partes o vistas completas.',
    reference: 'WordPress — Páginas · Elementor — Theme Builder',
    example: 'Crea una plantilla para todas las páginas de detalle de Productos.',
  },
  content: {
    label: 'Contenido dinámico',
    description: 'Crea estructuras de contenido, campos personalizados, clasificaciones, entradas, relaciones, consultas y formularios para reutilizar datos en el diseño.',
    reference: 'WordPress + ACF + JetEngine + JetFormBuilder',
    example: 'Crea “Propiedades”, añade Precio y Habitaciones, y permite registrar datos con un formulario.',
  },
  design: {
    label: 'Diseño global',
    description: 'Define la apariencia general del proyecto y reutiliza temas, presets y paquetes visuales sin editar cada elemento por separado.',
    reference: 'Elementor — Site Settings · JetStyleManager',
    example: 'Cambia tipografía, colores y estilos globales para todo el proyecto.',
  },
}

export type DataHelpId = 'content-types' | 'taxonomies' | 'fields' | 'records' | 'queries' | 'forms'

export const DATA_HELP: Readonly<Record<DataHelpId, FeatureHelp>> = {
  'content-types': {
    label: 'Tipos de contenido',
    description: 'Crea grupos de contenido propios además de páginas y entradas, como Productos, Propiedades, Servicios, Equipo o Vehículos.',
    reference: 'WordPress — Custom Post Types · JetEngine — Post Types',
    example: 'Crea “Propiedades” para guardar cada inmueble como una entrada administrable.',
  },
  taxonomies: {
    label: 'Clasificaciones',
    description: 'Organiza el contenido con categorías o etiquetas propias y permite filtrar o agrupar entradas por ellas.',
    reference: 'WordPress — Taxonomies · JetEngine — Taxonomies',
    example: 'Clasifica Propiedades por Ciudad, Tipo de inmueble o Estado.',
  },
  fields: {
    label: 'Campos personalizados',
    description: 'Añade información específica a tus contenidos con campos como precio, teléfono, galería, fecha, relación o lista repetible.',
    reference: 'Advanced Custom Fields (ACF) · JetEngine — Meta Fields',
    example: 'Añade Precio, Habitaciones y Galería al tipo de contenido Propiedades.',
  },
  records: {
    label: 'Entradas y relaciones',
    description: 'Gestiona los datos guardados y conecta contenidos relacionados sin duplicar información.',
    reference: 'WordPress — Entradas · JetEngine — Relations',
    example: 'Relaciona un Agente con varias Propiedades y reutiliza sus datos en cada ficha.',
  },
  queries: {
    label: 'Qué contenido mostrar',
    description: 'Define qué entradas deben aparecer, cómo se filtran y en qué orden. ElectroCMS guarda la selección para reutilizarla en listados y filtros.',
    reference: 'JetEngine — Query Builder',
    example: 'Mostrar solo Propiedades disponibles en Houston, ordenadas de menor a mayor precio.',
  },
  forms: {
    label: 'Formularios',
    description: 'Crea formularios visualmente, decide qué campos pedir y conecta las respuestas con campos de tu contenido cuando quieras guardar datos.',
    reference: 'JetFormBuilder · Elementor Forms',
    example: 'Crea un formulario “Solicitar información” con Nombre, Email y Teléfono.',
  },
}

export const FORM_HELP = {
  contentType: {
    label: 'Dónde guardar las respuestas',
    description: 'Conecta el formulario con un tipo de contenido para que sus campos puedan guardar información en los campos personalizados compatibles.',
    reference: 'JetFormBuilder — Insert/Update Post · JetEngine Meta Fields',
    example: 'Guardar una solicitud como una nueva entrada de Solicitudes.',
  },
  fieldType: {
    label: 'Tipo de campo',
    description: 'Define qué clase de dato pedirá este campo y qué control verá la persona que complete el formulario.',
    reference: 'JetFormBuilder — Form Fields · Elementor Forms — Fields',
    example: 'Email para correo, Número para cantidad o Selector para elegir una opción.',
  },
  mappedField: {
    label: 'Guardar valor en',
    description: 'Elige el campo personalizado donde se guardará la respuesta. ElectroCMS solo muestra destinos compatibles con el tipo de dato.',
    reference: 'JetFormBuilder — Field mapping · JetEngine/ACF — Meta Fields',
    example: 'El campo Teléfono del formulario guarda su respuesta en el campo personalizado Teléfono.',
  },
  fieldKey: {
    label: 'Clave interna del campo',
    description: 'Identificador estable que usa ElectroCMS para conectar el campo con acciones y datos. Normalmente se genera automáticamente y no necesitas cambiarlo.',
    reference: 'JetFormBuilder — Field Name · Elementor Forms — Field ID',
    example: 'telefono o email_cliente.',
  },
  order: {
    label: 'Orden de los campos',
    description: 'Define el orden en que las personas verán los campos. Puedes moverlos arriba o abajo sin arrastrar.',
    reference: 'JetFormBuilder / Elementor Forms — Orden de campos',
  },
} as const satisfies Readonly<Record<string, FeatureHelp>>

const FIELD_HELP_BY_KEY: Readonly<Record<string, FeatureHelp>> = {
  queryId: {
    label: 'Fuente de contenido',
    description: 'Elige la selección guardada que proporciona los datos a este elemento. Así puedes reutilizar el mismo contenido en varios widgets.',
    reference: 'JetEngine — Query Builder / Listing Grid',
  },
  fieldId: {
    label: 'Campo dinámico',
    description: 'Selecciona qué dato del contenido debe usar este elemento, por ejemplo Precio, Teléfono o Imagen.',
    reference: 'JetEngine — Dynamic Field · ACF Field',
  },
  taxonomy: {
    label: 'Clasificación',
    description: 'Selecciona la categoría o clasificación que este elemento utilizará para mostrar o filtrar contenido.',
    reference: 'WordPress — Taxonomies · JetSmartFilters',
  },
  visible: {
    label: 'Visibilidad',
    description: 'Decide si el elemento aparece. Las condiciones avanzadas permiten mostrarlo solo cuando se cumplan determinadas reglas.',
    reference: 'Elementor — Responsive/Display Conditions · JetEngine — Dynamic Visibility',
  },
  link: {
    label: 'Enlace',
    description: 'Define a dónde lleva el usuario al activar este elemento.',
    reference: 'Elementor — Link',
  },
}

export function getInspectorFieldHelp(key: string, control: string): FeatureHelp {
  const known = FIELD_HELP_BY_KEY[key]
  if (known) return known

  if (control === 'binding') {
    return {
      label: 'Contenido dinámico',
      description: 'Conecta esta opción con datos del proyecto para que el valor cambie automáticamente según el contenido mostrado.',
      reference: 'Elementor — Dynamic Tags · JetEngine — Dynamic Data',
    }
  }
  if (control === 'color' || control === 'spacing') {
    return {
      label: 'Estilo del elemento',
      description: 'Ajusta la apariencia visual de este elemento. El cambio se aplica al elemento seleccionado y puede restablecerse al valor global.',
      reference: 'Elementor — Style / Advanced',
    }
  }
  if (control === 'boolean') {
    return {
      label: 'Activar o desactivar',
      description: 'Activa esta característica cuando la necesites. Desactivarla conserva una configuración más simple.',
      reference: 'Elementor / JetEngine — Control de opción',
    }
  }
  return {
    label: 'Configurar opción',
    description: 'Cambia esta propiedad del elemento seleccionado. Puedes restablecerla para volver al valor predeterminado.',
    reference: 'Elementor — Panel de propiedades',
  }
}
