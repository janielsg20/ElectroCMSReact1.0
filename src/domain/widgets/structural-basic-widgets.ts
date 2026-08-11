import * as z from 'zod'
import type { JsonValue } from '../project/project-envelope'
import type {
  WidgetDefinition,
  WidgetExportSupport,
  WidgetExportTarget,
  WidgetInspectorField,
} from './widget-registry'
import { WidgetRegistry } from './widget-registry'

type Field = WidgetInspectorField
type ExportMatrix = Readonly<Record<WidgetExportTarget, WidgetExportSupport>>

const ALL_SUPPORTED: ExportMatrix = {
  lamp: 'supported',
  local: 'supported',
  react: 'supported',
  wordpress: 'supported',
}

const EMBED_SUPPORT: ExportMatrix = {
  lamp: 'diagnostic-only',
  local: 'supported',
  react: 'supported',
  wordpress: 'diagnostic-only',
}

const INTERACTIVE_SUPPORT: ExportMatrix = {
  lamp: 'diagnostic-only',
  local: 'supported',
  react: 'supported',
  wordpress: 'diagnostic-only',
}

function propertySchema(shape: z.ZodRawShape): z.ZodType<Record<string, JsonValue>> {
  return z.object(shape).strict() as unknown as z.ZodType<Record<string, JsonValue>>
}

function field(
  key: string,
  label: string,
  control: Field['control'],
  section: Field['section'] = 'content',
  options?: readonly string[],
): Field {
  return { control, key, label, options, required: true, section }
}

interface DefinitionInput {
  readonly accessibility?: WidgetDefinition['accessibility']
  readonly category: WidgetDefinition['category']
  readonly defaults: Readonly<Record<string, JsonValue>>
  readonly description: string
  readonly exporterSupport?: ExportMatrix
  readonly iconPath: string
  readonly id: string
  readonly inspector: readonly Field[]
  readonly label: string
  readonly schema: z.ZodRawShape
}

function defineWidget(input: DefinitionInput): WidgetDefinition {
  return {
    accessibility: input.accessibility ?? { requiresAccessibleName: false, semanticRole: 'generic' },
    category: input.category,
    defaults: input.defaults,
    description: input.description,
    exporterSupport: input.exporterSupport ?? ALL_SUPPORTED,
    icon: { path: input.iconPath, viewBox: '0 0 24 24' },
    id: input.id,
    inspector: input.inspector,
    label: input.label,
    migrations: [],
    propertySchema: propertySchema(input.schema),
    rendererId: `react.${input.id}`,
    schemaVersion: 1,
    version: '1.0.0',
  }
}

const containerIcon = 'M4 4h16v16H4zM8 8h8v8H8z'
const layoutIcon = 'M4 5h16v5H4zM4 14h7v5H4zM15 14h5v5h-5z'
const textIcon = 'M5 5h14M12 5v14M8 19h8'
const mediaIcon = 'M4 5h16v14H4zM7 15l3-3 2 2 3-4 3 5'

export const STRUCTURAL_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  defineWidget({
    category: 'structure', defaults: { label: 'Sección' }, description: 'Región semántica de página.', iconPath: containerIcon,
    id: 'layout.section', inspector: [field('label', 'Nombre accesible', 'text', 'accessibility')], label: 'Sección',
    schema: { label: z.string().max(120) }, accessibility: { requiresAccessibleName: false, semanticRole: 'region' },
  }),
  defineWidget({
    category: 'structure', defaults: { maxWidth: 1200 }, description: 'Contenedor de ancho limitado.', iconPath: containerIcon,
    id: 'layout.container', inspector: [field('maxWidth', 'Ancho máximo', 'number', 'layout')], label: 'Contenedor',
    schema: { maxWidth: z.number().int().min(240).max(2560) },
  }),
  defineWidget({
    category: 'structure', defaults: { align: 'stretch', direction: 'row', gap: 16, justify: 'start', wrap: true }, description: 'Distribución flexible de elementos.', iconPath: layoutIcon,
    id: 'layout.flex', inspector: [field('direction', 'Dirección', 'select', 'layout', ['row', 'column']), field('gap', 'Separación', 'number', 'layout'), field('align', 'Alineación', 'select', 'layout', ['start', 'center', 'end', 'stretch']), field('justify', 'Distribución', 'select', 'layout', ['start', 'center', 'end', 'between']), field('wrap', 'Permitir salto', 'boolean', 'responsive')], label: 'Flex container',
    schema: { align: z.enum(['start', 'center', 'end', 'stretch']), direction: z.enum(['row', 'column']), gap: z.number().int().min(0).max(256), justify: z.enum(['start', 'center', 'end', 'between']), wrap: z.boolean() },
  }),
  defineWidget({
    category: 'structure', defaults: { columns: 3, gap: 16 }, description: 'Cuadrícula responsive.', iconPath: layoutIcon,
    id: 'layout.grid', inspector: [field('columns', 'Columnas', 'number', 'layout'), field('gap', 'Separación', 'number', 'layout')], label: 'Grid',
    schema: { columns: z.number().int().min(1).max(12), gap: z.number().int().min(0).max(256) },
  }),
  defineWidget({
    category: 'structure', defaults: { columns: 2, gap: 16 }, description: 'Composición por columnas iguales.', iconPath: layoutIcon,
    id: 'layout.columns', inspector: [field('columns', 'Columnas', 'number', 'layout'), field('gap', 'Separación', 'number', 'layout')], label: 'Columnas',
    schema: { columns: z.number().int().min(1).max(12), gap: z.number().int().min(0).max(256) },
  }),
  defineWidget({
    category: 'structure', defaults: { align: 'center', gap: 12 }, description: 'Fila horizontal de elementos.', iconPath: layoutIcon,
    id: 'layout.row', inspector: [field('gap', 'Separación', 'number', 'layout'), field('align', 'Alineación', 'select', 'layout', ['start', 'center', 'end', 'stretch'])], label: 'Fila',
    schema: { align: z.enum(['start', 'center', 'end', 'stretch']), gap: z.number().int().min(0).max(256) },
  }),
  defineWidget({
    category: 'structure', defaults: { gap: 12 }, description: 'Pila vertical de elementos.', iconPath: layoutIcon,
    id: 'layout.stack', inspector: [field('gap', 'Separación', 'number', 'layout')], label: 'Stack',
    schema: { gap: z.number().int().min(0).max(256) },
  }),
  defineWidget({
    category: 'structure', defaults: { size: 32 }, description: 'Espacio vacío controlado.', iconPath: 'M5 4v16M19 4v16M5 12h14M8 9l-3 3 3 3M16 9l3 3-3 3',
    id: 'layout.spacer', inspector: [field('size', 'Tamaño', 'number', 'layout')], label: 'Spacer',
    schema: { size: z.number().int().min(0).max(1024) }, accessibility: { requiresAccessibleName: false, semanticRole: 'presentation' },
  }),
  defineWidget({
    category: 'structure', defaults: { color: '#cbd5e1', thickness: 1 }, description: 'Divisor visual entre regiones.', iconPath: 'M4 12h16',
    id: 'layout.divider', inspector: [field('thickness', 'Grosor', 'number', 'style'), field('color', 'Color', 'color', 'style')], label: 'Divider',
    schema: { color: z.string().regex(/^#[0-9a-fA-F]{6}$/), thickness: z.number().int().min(1).max(16) }, accessibility: { requiresAccessibleName: false, semanticRole: 'separator' },
  }),
  defineWidget({
    category: 'structure', defaults: { activeTab: 0, label: 'Pestañas' }, description: 'Contenedor estructural de pestañas.', exporterSupport: INTERACTIVE_SUPPORT, iconPath: containerIcon,
    id: 'layout.tabs-container', inspector: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('activeTab', 'Pestaña activa', 'number', 'content')], label: 'Tabs container',
    schema: { activeTab: z.number().int().min(0).max(99), label: z.string().min(1).max(120) }, accessibility: { requiresAccessibleName: true, semanticRole: 'tablist' },
  }),
  defineWidget({
    category: 'structure', defaults: { allowMultiple: false, label: 'Acordeón' }, description: 'Contenedor estructural de acordeón.', exporterSupport: INTERACTIVE_SUPPORT, iconPath: containerIcon,
    id: 'layout.accordion-container', inspector: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('allowMultiple', 'Apertura múltiple', 'boolean', 'content')], label: 'Accordion container',
    schema: { allowMultiple: z.boolean(), label: z.string().min(1).max(120) }, accessibility: { requiresAccessibleName: true, semanticRole: 'group' },
  }),
  defineWidget({
    category: 'structure', defaults: { label: 'Modal', open: true }, description: 'Superficie modal accesible.', exporterSupport: INTERACTIVE_SUPPORT, iconPath: containerIcon,
    id: 'layout.modal', inspector: [field('label', 'Título accesible', 'text', 'accessibility'), field('open', 'Visible', 'boolean', 'conditions')], label: 'Modal',
    schema: { label: z.string().min(1).max(120), open: z.boolean() }, accessibility: { requiresAccessibleName: true, semanticRole: 'dialog' },
  }),
  defineWidget({
    category: 'structure', defaults: { label: 'Panel lateral', open: true, side: 'right' }, description: 'Panel lateral superpuesto.', exporterSupport: INTERACTIVE_SUPPORT, iconPath: containerIcon,
    id: 'layout.drawer', inspector: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('side', 'Lado', 'select', 'layout', ['left', 'right']), field('open', 'Visible', 'boolean', 'conditions')], label: 'Drawer',
    schema: { label: z.string().min(1).max(120), open: z.boolean(), side: z.enum(['left', 'right']) }, accessibility: { requiresAccessibleName: true, semanticRole: 'complementary' },
  }),
  defineWidget({
    category: 'structure', defaults: { label: 'Panel off-canvas', open: true, side: 'left' }, description: 'Panel desplazable fuera del canvas.', exporterSupport: INTERACTIVE_SUPPORT, iconPath: containerIcon,
    id: 'layout.off-canvas', inspector: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('side', 'Lado', 'select', 'layout', ['left', 'right']), field('open', 'Visible', 'boolean', 'conditions')], label: 'Off-canvas',
    schema: { label: z.string().min(1).max(120), open: z.boolean(), side: z.enum(['left', 'right']) }, accessibility: { requiresAccessibleName: true, semanticRole: 'complementary' },
  }),
  defineWidget({
    category: 'structure', defaults: { offset: 0 }, description: 'Contenedor fijado durante el desplazamiento.', iconPath: containerIcon,
    id: 'layout.sticky-container', inspector: [field('offset', 'Separación superior', 'number', 'layout')], label: 'Sticky container',
    schema: { offset: z.number().int().min(0).max(1024) },
  }),
]

export const BASIC_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  defineWidget({ category: 'basic', defaults: { text: 'Texto' }, description: 'Fragmento de texto en línea.', iconPath: textIcon, id: 'content.text', inspector: [field('text', 'Texto', 'textarea')], label: 'Texto', schema: { text: z.string().max(20_000) } }),
  defineWidget({ category: 'basic', defaults: { level: 2, text: 'Título' }, description: 'Título semántico H1–H6.', iconPath: textIcon, id: 'content.heading', inspector: [field('text', 'Título', 'text'), field('level', 'Nivel', 'select', 'accessibility', ['1', '2', '3', '4', '5', '6'])], label: 'Título H1–H6', schema: { level: z.number().int().min(1).max(6), text: z.string().max(500) }, accessibility: { requiresAccessibleName: false, semanticRole: 'heading' } }),
  defineWidget({ category: 'basic', defaults: { text: 'Escribe un párrafo.' }, description: 'Párrafo de contenido.', iconPath: textIcon, id: 'content.paragraph', inspector: [field('text', 'Párrafo', 'textarea')], label: 'Párrafo', schema: { text: z.string().max(20_000) }, accessibility: { requiresAccessibleName: false, semanticRole: 'paragraph' } }),
  defineWidget({ category: 'basic', defaults: { content: 'Texto con formato' }, description: 'Contenido enriquecido seguro.', iconPath: textIcon, id: 'content.rich-text', inspector: [field('content', 'Contenido', 'textarea')], label: 'Rich text', schema: { content: z.string().max(50_000) } }),
  defineWidget({ category: 'basic', defaults: { alt: 'Descripción de la imagen', src: '' }, description: 'Imagen con texto alternativo.', iconPath: mediaIcon, id: 'media.image', inspector: [field('src', 'Imagen', 'asset'), field('alt', 'Texto alternativo', 'text', 'accessibility')], label: 'Imagen', schema: { alt: z.string().max(500), src: z.string().max(4_096) }, accessibility: { requiresAccessibleName: true, semanticRole: 'img' } }),
  defineWidget({ category: 'basic', defaults: { alt: 'Galería', images: [] }, description: 'Colección accesible de imágenes.', iconPath: mediaIcon, id: 'media.gallery', inspector: [field('images', 'Imágenes', 'asset'), field('alt', 'Nombre accesible', 'text', 'accessibility')], label: 'Galería', schema: { alt: z.string().min(1).max(500), images: z.array(z.string().max(4_096)).max(100) }, accessibility: { requiresAccessibleName: true, semanticRole: 'list' } }),
  defineWidget({ category: 'basic', defaults: { label: 'Icono', symbol: '★' }, description: 'Icono con nombre accesible.', iconPath: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z', id: 'content.icon', inspector: [field('symbol', 'Símbolo', 'text'), field('label', 'Nombre accesible', 'text', 'accessibility')], label: 'Icono', schema: { label: z.string().min(1).max(120), symbol: z.string().min(1).max(8) }, accessibility: { requiresAccessibleName: true, semanticRole: 'img' } }),
  defineWidget({ category: 'basic', defaults: { disabled: false, href: '#', text: 'Botón' }, description: 'Acción navegable con destino explícito.', iconPath: 'M5 8h14v8H5z', id: 'content.button', inspector: [field('text', 'Etiqueta', 'text', 'accessibility'), field('href', 'Destino', 'text', 'advanced'), field('disabled', 'Deshabilitado', 'boolean', 'conditions')], label: 'Botón', schema: { disabled: z.boolean(), href: z.string().max(4_096), text: z.string().min(1).max(200) }, accessibility: { requiresAccessibleName: true, semanticRole: 'link' } }),
  defineWidget({ category: 'basic', defaults: { alt: 'Logotipo', src: '', text: 'Marca' }, description: 'Identidad visual con fallback textual.', iconPath: mediaIcon, id: 'content.logo', inspector: [field('src', 'Logotipo', 'asset'), field('text', 'Marca', 'text'), field('alt', 'Texto alternativo', 'text', 'accessibility')], label: 'Logotipo', schema: { alt: z.string().min(1).max(500), src: z.string().max(4_096), text: z.string().max(200) }, accessibility: { requiresAccessibleName: true, semanticRole: 'img' } }),
  defineWidget({ category: 'basic', defaults: { caption: '', controls: true, src: '' }, description: 'Reproductor de video nativo.', iconPath: mediaIcon, id: 'media.video', inspector: [field('src', 'Video', 'asset'), field('caption', 'Descripción', 'text', 'accessibility'), field('controls', 'Controles', 'boolean')], label: 'Video', schema: { caption: z.string().max(500), controls: z.boolean(), src: z.string().max(4_096) }, accessibility: { requiresAccessibleName: false, semanticRole: 'video' } }),
  defineWidget({ category: 'basic', defaults: { controls: true, label: 'Audio', src: '' }, description: 'Reproductor de audio nativo.', iconPath: mediaIcon, id: 'media.audio', inspector: [field('src', 'Audio', 'asset'), field('label', 'Nombre accesible', 'text', 'accessibility'), field('controls', 'Controles', 'boolean')], label: 'Audio', schema: { controls: z.boolean(), label: z.string().min(1).max(500), src: z.string().max(4_096) }, accessibility: { requiresAccessibleName: true, semanticRole: 'audio' } }),
  defineWidget({ category: 'basic', defaults: { html: '<p>HTML seguro</p>' }, description: 'HTML mostrado como fuente segura hasta exportación.', exporterSupport: EMBED_SUPPORT, iconPath: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16', id: 'embed.html', inspector: [field('html', 'HTML', 'textarea', 'advanced')], label: 'HTML', schema: { html: z.string().max(100_000) } }),
  defineWidget({ category: 'basic', defaults: { src: '', title: 'Contenido incrustado' }, description: 'Iframe aislado con título obligatorio.', exporterSupport: EMBED_SUPPORT, iconPath: containerIcon, id: 'embed.iframe', inspector: [field('src', 'URL', 'text'), field('title', 'Título accesible', 'text', 'accessibility')], label: 'Iframe', schema: { src: z.string().max(4_096), title: z.string().min(1).max(500) }, accessibility: { requiresAccessibleName: true, semanticRole: 'document' } }),
  defineWidget({ category: 'basic', defaults: { address: 'Houston, Texas', label: 'Mapa', src: '' }, description: 'Mapa incrustado con fallback local.', exporterSupport: EMBED_SUPPORT, iconPath: mediaIcon, id: 'embed.map', inspector: [field('src', 'URL del mapa', 'text'), field('address', 'Dirección', 'text'), field('label', 'Nombre accesible', 'text', 'accessibility')], label: 'Mapa', schema: { address: z.string().max(1_000), label: z.string().min(1).max(500), src: z.string().max(4_096) }, accessibility: { requiresAccessibleName: true, semanticRole: 'region' } }),
  defineWidget({ category: 'basic', defaults: { color: '#2563eb', shape: 'rectangle' }, description: 'Forma geométrica decorativa.', iconPath: 'M5 5h14v14H5z', id: 'visual.shape', inspector: [field('shape', 'Forma', 'select', 'content', ['rectangle', 'circle', 'triangle']), field('color', 'Color', 'color', 'style')], label: 'Formas', schema: { color: z.string().regex(/^#[0-9a-fA-F]{6}$/), shape: z.enum(['rectangle', 'circle', 'triangle']) }, accessibility: { requiresAccessibleName: false, semanticRole: 'presentation' } }),
  defineWidget({ category: 'basic', defaults: { fill: '#2563eb', label: 'Gráfico SVG', path: 'M4 4h16v16H4z' }, description: 'Gráfico SVG sanitizado a un path.', exporterSupport: EMBED_SUPPORT, iconPath: 'M4 4h16v16H4z', id: 'visual.svg', inspector: [field('path', 'Path SVG', 'textarea', 'advanced'), field('fill', 'Relleno', 'color', 'style'), field('label', 'Nombre accesible', 'text', 'accessibility')], label: 'SVG', schema: { fill: z.string().regex(/^#[0-9a-fA-F]{6}$/), label: z.string().min(1).max(500), path: z.string().min(1).max(20_000).refine((value) => !/[<>]/.test(value), 'El path SVG no admite markup.') }, accessibility: { requiresAccessibleName: true, semanticRole: 'img' } }),
  defineWidget({ category: 'basic', defaults: { color: '#cbd5e1', thickness: 1 }, description: 'Separador semántico.', iconPath: 'M4 12h16', id: 'content.separator', inspector: [field('thickness', 'Grosor', 'number', 'style'), field('color', 'Color', 'color', 'style')], label: 'Separador', schema: { color: z.string().regex(/^#[0-9a-fA-F]{6}$/), thickness: z.number().int().min(1).max(16) }, accessibility: { requiresAccessibleName: false, semanticRole: 'separator' } }),
  defineWidget({ category: 'basic', defaults: { caption: 'Tabla', headers: ['Columna 1', 'Columna 2'], rows: [['Dato 1', 'Dato 2']] }, description: 'Tabla de datos con encabezados.', iconPath: containerIcon, id: 'content.table', inspector: [field('caption', 'Título', 'text', 'accessibility'), field('headers', 'Encabezados', 'textarea'), field('rows', 'Filas', 'textarea')], label: 'Tabla', schema: { caption: z.string().min(1).max(500), headers: z.array(z.string().max(500)).min(1).max(50), rows: z.array(z.array(z.string().max(5_000)).max(50)).max(1_000) }, accessibility: { requiresAccessibleName: true, semanticRole: 'table' } }),
  defineWidget({ category: 'basic', defaults: { items: ['Elemento 1', 'Elemento 2'], ordered: false }, description: 'Lista ordenada o no ordenada.', iconPath: textIcon, id: 'content.list', inspector: [field('items', 'Elementos', 'textarea'), field('ordered', 'Lista ordenada', 'boolean')], label: 'Lista', schema: { items: z.array(z.string().max(5_000)).max(1_000), ordered: z.boolean() }, accessibility: { requiresAccessibleName: false, semanticRole: 'list' } }),
  defineWidget({ category: 'basic', defaults: { code: 'const listo = true', language: 'typescript' }, description: 'Bloque de código preformateado.', iconPath: 'M8 7l-5 5 5 5M16 7l5 5-5 5', id: 'content.code', inspector: [field('code', 'Código', 'textarea'), field('language', 'Lenguaje', 'text', 'accessibility')], label: 'Código', schema: { code: z.string().max(100_000), language: z.string().min(1).max(100) }, accessibility: { requiresAccessibleName: false, semanticRole: 'code' } }),
]

export const STRUCTURAL_BASIC_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  ...STRUCTURAL_WIDGET_DEFINITIONS,
  ...BASIC_WIDGET_DEFINITIONS,
]

export function createStructuralBasicWidgetRegistry(): WidgetRegistry {
  const registry = new WidgetRegistry()
  for (const definition of STRUCTURAL_BASIC_WIDGET_DEFINITIONS) {
    const result = registry.register(definition)
    if (!result.ok) {
      throw new Error(`Definición interna inválida: ${definition.id}: ${result.error.map((item) => item.message).join(' ')}`)
    }
  }
  return registry
}
