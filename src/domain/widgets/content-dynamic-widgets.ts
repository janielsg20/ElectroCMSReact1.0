import * as z from 'zod'
import type { JsonValue } from '../project/project-envelope'
import { WidgetRegistry, type WidgetDefinition, type WidgetInspectorField } from './widget-registry'
import { STRUCTURAL_BASIC_WIDGET_DEFINITIONS } from './structural-basic-widgets'

type Shape = z.ZodRawShape
type Field = WidgetInspectorField

const supported = { lamp: 'supported', local: 'supported', react: 'supported', wordpress: 'supported' } as const
const diagnostic = { lamp: 'diagnostic-only', local: 'supported', react: 'supported', wordpress: 'diagnostic-only' } as const
const icon = { path: 'M4 5h16v14H4zM7 9h10M7 13h7M7 17h5', viewBox: '0 0 24 24' } as const

function schema(shape: Shape): z.ZodType<Record<string, JsonValue>> {
  return z.object(shape).strict() as unknown as z.ZodType<Record<string, JsonValue>>
}

function field(key: string, label: string, control: Field['control'], section: Field['section'] = 'content', options?: readonly string[]): Field {
  return { control, key, label, options, required: true, section }
}

interface Input {
  readonly accessibility?: WidgetDefinition['accessibility']
  readonly category: 'content' | 'dynamic'
  readonly defaults: Readonly<Record<string, JsonValue>>
  readonly description: string
  readonly diagnosticExport?: boolean
  readonly fields: readonly Field[]
  readonly id: string
  readonly label: string
  readonly shape: Shape
}

function define(input: Input): WidgetDefinition {
  return {
    accessibility: input.accessibility ?? { requiresAccessibleName: false, semanticRole: 'generic' },
    category: input.category,
    defaults: input.defaults,
    description: input.description,
    exporterSupport: input.diagnosticExport ? diagnostic : supported,
    icon,
    id: input.id,
    inspector: input.fields,
    label: input.label,
    migrations: [],
    propertySchema: schema(input.shape),
    rendererId: `react.${input.id}`,
    schemaVersion: 1,
    version: '1.0.0',
  }
}

const stringList = z.array(z.string().max(2_000)).max(100)

export const CONTENT_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  define({ category: 'content', id: 'content.card', label: 'Tarjeta', description: 'Tarjeta de contenido.', defaults: { description: '', title: 'Tarjeta' }, shape: { description: z.string().max(5_000), title: z.string().max(500) }, fields: [field('title', 'Título', 'text'), field('description', 'Descripción', 'textarea')] }),
  define({ category: 'content', id: 'content.article', label: 'Artículo', description: 'Resumen semántico de artículo.', defaults: { excerpt: '', title: 'Artículo' }, shape: { excerpt: z.string().max(10_000), title: z.string().max(500) }, fields: [field('title', 'Título', 'text'), field('excerpt', 'Extracto', 'textarea')], accessibility: { requiresAccessibleName: false, semanticRole: 'article' } }),
  define({ category: 'content', id: 'content.testimonial', label: 'Testimonio', description: 'Cita y autor.', defaults: { author: 'Autor', quote: 'Testimonio' }, shape: { author: z.string().max(300), quote: z.string().max(10_000) }, fields: [field('quote', 'Cita', 'textarea'), field('author', 'Autor', 'text')] }),
  define({ category: 'content', id: 'content.team-member', label: 'Miembro de equipo', description: 'Perfil resumido de equipo.', defaults: { name: 'Nombre', role: 'Rol' }, shape: { name: z.string().max(300), role: z.string().max(300) }, fields: [field('name', 'Nombre', 'text'), field('role', 'Rol', 'text')] }),
  define({ category: 'content', id: 'content.faq', label: 'Preguntas frecuentes', description: 'Pregunta expandible.', defaults: { answer: 'Respuesta', open: false, question: 'Pregunta' }, shape: { answer: z.string().max(10_000), open: z.boolean(), question: z.string().max(1_000) }, fields: [field('question', 'Pregunta', 'text'), field('answer', 'Respuesta', 'textarea'), field('open', 'Abierta', 'boolean', 'conditions')] }),
  define({ category: 'content', id: 'content.tabs', label: 'Tabs', description: 'Pestañas declarativas.', defaults: { active: 0, items: ['Pestaña 1', 'Pestaña 2'] }, shape: { active: z.number().int().min(0).max(99), items: stringList }, fields: [field('items', 'Pestañas', 'textarea'), field('active', 'Activa', 'number')] }),
  define({ category: 'content', id: 'content.accordion', label: 'Acordeón', description: 'Lista declarativa expandible.', defaults: { items: ['Elemento 1'], openIndex: 0 }, shape: { items: stringList, openIndex: z.number().int().min(-1).max(99) }, fields: [field('items', 'Elementos', 'textarea'), field('openIndex', 'Elemento abierto', 'number')] }),
  define({ category: 'content', id: 'content.timeline', label: 'Timeline', description: 'Secuencia cronológica.', defaults: { items: ['Inicio', 'Actualidad'] }, shape: { items: stringList }, fields: [field('items', 'Hitos', 'textarea')] }),
  define({ category: 'content', id: 'content.counter', label: 'Contador', description: 'Valor numérico estático.', defaults: { label: 'Contador', suffix: '', value: 0 }, shape: { label: z.string().max(300), suffix: z.string().max(30), value: z.number().finite() }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('value', 'Valor', 'number'), field('suffix', 'Sufijo', 'text')] }),
  define({ category: 'content', id: 'content.progress', label: 'Barra de progreso', description: 'Progreso con valor accesible.', defaults: { label: 'Progreso', max: 100, value: 50 }, shape: { label: z.string().max(300), max: z.number().positive(), value: z.number().min(0) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('value', 'Valor', 'number'), field('max', 'Máximo', 'number')] }),
  define({ category: 'content', id: 'content.metric', label: 'Métricas', description: 'Métrica con etiqueta y valor.', defaults: { label: 'Métrica', value: '0' }, shape: { label: z.string().max(300), value: z.string().max(300) }, fields: [field('label', 'Etiqueta', 'text'), field('value', 'Valor', 'text')] }),
  define({ category: 'content', id: 'content.pricing-table', label: 'Tabla de precios', description: 'Plan y características.', defaults: { features: [], plan: 'Plan', price: '$0' }, shape: { features: stringList, plan: z.string().max(300), price: z.string().max(100) }, fields: [field('plan', 'Plan', 'text'), field('price', 'Precio', 'text'), field('features', 'Características', 'textarea')] }),
  define({ category: 'content', id: 'content.feature-list', label: 'Lista de características', description: 'Lista de beneficios.', defaults: { items: ['Característica'] }, shape: { items: stringList }, fields: [field('items', 'Características', 'textarea')] }),
  define({ category: 'content', id: 'content.breadcrumbs', label: 'Breadcrumbs', description: 'Ruta de navegación.', defaults: { items: ['Inicio', 'Página'] }, shape: { items: stringList }, fields: [field('items', 'Ruta', 'textarea')], accessibility: { requiresAccessibleName: true, semanticRole: 'navigation' } }),
  define({ category: 'content', id: 'content.table-of-contents', label: 'Tabla de contenido', description: 'Índice del documento.', defaults: { items: ['Sección'] }, shape: { items: stringList }, fields: [field('items', 'Secciones', 'textarea')], accessibility: { requiresAccessibleName: true, semanticRole: 'navigation' } }),
  define({ category: 'content', id: 'content.carousel', label: 'Carrusel', description: 'Carrusel declarativo sin autoplay.', defaults: { active: 0, items: ['Slide 1'] }, shape: { active: z.number().int().min(0).max(99), items: stringList }, fields: [field('items', 'Slides', 'textarea'), field('active', 'Slide activo', 'number')], diagnosticExport: true }),
  define({ category: 'content', id: 'content.slider', label: 'Slider', description: 'Slider declarativo sin autoplay.', defaults: { active: 0, items: ['Slide 1'] }, shape: { active: z.number().int().min(0).max(99), items: stringList }, fields: [field('items', 'Slides', 'textarea'), field('active', 'Slide activo', 'number')], diagnosticExport: true }),
  define({ category: 'content', id: 'content.call-to-action', label: 'Call to action', description: 'Mensaje y enlace principal.', defaults: { buttonLabel: 'Continuar', href: '#', text: '', title: 'Llamada a la acción' }, shape: { buttonLabel: z.string().max(200), href: z.string().max(4_096), text: z.string().max(5_000), title: z.string().max(500) }, fields: [field('title', 'Título', 'text'), field('text', 'Texto', 'textarea'), field('buttonLabel', 'Botón', 'text'), field('href', 'Destino', 'text', 'advanced')] }),
  define({ category: 'content', id: 'content.modal', label: 'Modal', description: 'Modal de contenido.', defaults: { label: 'Modal', open: true }, shape: { label: z.string().min(1).max(300), open: z.boolean() }, fields: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('open', 'Visible', 'boolean', 'conditions')], accessibility: { requiresAccessibleName: true, semanticRole: 'dialog' }, diagnosticExport: true }),
  define({ category: 'content', id: 'content.popup', label: 'Popup', description: 'Aviso emergente declarativo.', defaults: { label: 'Popup', open: true, text: 'Contenido' }, shape: { label: z.string().min(1).max(300), open: z.boolean(), text: z.string().max(5_000) }, fields: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('text', 'Contenido', 'textarea'), field('open', 'Visible', 'boolean', 'conditions')], accessibility: { requiresAccessibleName: true, semanticRole: 'dialog' }, diagnosticExport: true }),
]

const binding = z.string().max(500)
const dynamicFields = (fallbackLabel = 'Fallback'): readonly Field[] => [field('binding', 'Binding', 'binding', 'data'), field('fallback', fallbackLabel, 'text', 'data')]

export const DYNAMIC_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  define({ category: 'dynamic', id: 'dynamic.field', label: 'Campo dinámico', description: 'Campo enlazable con fallback.', defaults: { binding: '', fallback: 'Sin valor' }, shape: { binding, fallback: z.string().max(5_000) }, fields: dynamicFields() }),
  define({ category: 'dynamic', id: 'dynamic.image', label: 'Imagen dinámica', description: 'Imagen enlazable con fallback local.', defaults: { alt: 'Imagen dinámica', binding: '', fallback: '' }, shape: { alt: z.string().max(500), binding, fallback: z.string().max(4_096) }, fields: [field('binding', 'Binding', 'binding', 'data'), field('fallback', 'Imagen fallback', 'asset', 'data'), field('alt', 'Texto alternativo', 'text', 'accessibility')] }),
  define({ category: 'dynamic', id: 'dynamic.link', label: 'Enlace dinámico', description: 'Enlace enlazable con destino fallback.', defaults: { binding: '', fallback: '#', text: 'Enlace' }, shape: { binding, fallback: z.string().max(4_096), text: z.string().max(500) }, fields: [field('binding', 'Binding', 'binding', 'data'), field('fallback', 'Destino fallback', 'text', 'data'), field('text', 'Texto', 'text')] }),
  define({ category: 'dynamic', id: 'dynamic.repeater', label: 'Repeater', description: 'Prototipo enlazable; no ejecuta queries.', defaults: { binding: '', emptyMessage: 'Sin elementos' }, shape: { binding, emptyMessage: z.string().max(500) }, fields: [field('binding', 'Binding', 'binding', 'data'), field('emptyMessage', 'Estado vacío', 'text', 'data')], diagnosticExport: true }),
  define({ category: 'dynamic', id: 'dynamic.listing-grid', label: 'Listing grid', description: 'Grid asociado a una query futura.', defaults: { columns: 3, emptyMessage: 'Sin resultados', queryId: '' }, shape: { columns: z.number().int().min(1).max(12), emptyMessage: z.string().max(500), queryId: z.string().max(500) }, fields: [field('queryId', 'Query', 'binding', 'data'), field('columns', 'Columnas', 'number', 'layout'), field('emptyMessage', 'Estado vacío', 'text', 'data')], diagnosticExport: true }),
  define({ category: 'dynamic', id: 'dynamic.query-result', label: 'Resultado de consulta', description: 'Estado declarativo de una consulta.', defaults: { emptyMessage: 'Consulta sin ejecutar', queryId: '' }, shape: { emptyMessage: z.string().max(500), queryId: z.string().max(500) }, fields: [field('queryId', 'Query', 'binding', 'data'), field('emptyMessage', 'Estado vacío', 'text', 'data')], diagnosticExport: true }),
  define({ category: 'dynamic', id: 'dynamic.relations', label: 'Relaciones', description: 'Estado declarativo de relación.', defaults: { emptyMessage: 'Sin relaciones', relationId: '' }, shape: { emptyMessage: z.string().max(500), relationId: z.string().max(500) }, fields: [field('relationId', 'Relación', 'binding', 'data'), field('emptyMessage', 'Estado vacío', 'text', 'data')], diagnosticExport: true }),
  define({ category: 'dynamic', id: 'dynamic.related-content', label: 'Contenido relacionado', description: 'Contenido relacionado pendiente de proveedor.', defaults: { emptyMessage: 'Sin contenido relacionado', queryId: '' }, shape: { emptyMessage: z.string().max(500), queryId: z.string().max(500) }, fields: [field('queryId', 'Query', 'binding', 'data'), field('emptyMessage', 'Estado vacío', 'text', 'data')], diagnosticExport: true }),
  define({ category: 'dynamic', id: 'dynamic.conditional-field', label: 'Campo condicional', description: 'Visibilidad declarativa sin evaluar código.', defaults: { condition: 'Condición', matches: true, value: 'Valor' }, shape: { condition: z.string().max(1_000), matches: z.boolean(), value: z.string().max(5_000) }, fields: [field('condition', 'Condición', 'text', 'conditions'), field('matches', 'Coincide', 'boolean', 'conditions'), field('value', 'Valor', 'text', 'data')] }),
  define({ category: 'dynamic', id: 'dynamic.author', label: 'Autor', description: 'Autor enlazable con fallback.', defaults: { binding: '', fallback: 'Autor' }, shape: { binding, fallback: z.string().max(500) }, fields: dynamicFields('Autor fallback') }),
  define({ category: 'dynamic', id: 'dynamic.date', label: 'Fecha', description: 'Fecha enlazable y formato declarativo.', defaults: { binding: '', fallback: 'Sin fecha', format: 'medium' }, shape: { binding, fallback: z.string().max(500), format: z.enum(['short', 'medium', 'long', 'iso']) }, fields: [...dynamicFields('Fecha fallback'), field('format', 'Formato', 'select', 'data', ['short', 'medium', 'long', 'iso'])] }),
  define({ category: 'dynamic', id: 'dynamic.taxonomies', label: 'Taxonomías', description: 'Taxonomías enlazables con fallbacks.', defaults: { binding: '', items: [] }, shape: { binding, items: stringList }, fields: [field('binding', 'Binding', 'binding', 'data'), field('items', 'Valores fallback', 'textarea', 'data')] }),
  define({ category: 'dynamic', id: 'dynamic.metadata', label: 'Metadata', description: 'Par metadata enlazable.', defaults: { binding: '', key: 'meta', value: 'Sin valor' }, shape: { binding, key: z.string().max(300), value: z.string().max(5_000) }, fields: [field('binding', 'Binding', 'binding', 'data'), field('key', 'Clave', 'text', 'data'), field('value', 'Fallback', 'text', 'data')] }),
  define({ category: 'dynamic', id: 'dynamic.calculated-field', label: 'Campos calculados', description: 'Expresión declarativa; nunca se evalúa en preview.', defaults: { expression: '', fallback: 'Sin cálculo' }, shape: { expression: z.string().max(5_000), fallback: z.string().max(5_000) }, fields: [field('expression', 'Expresión', 'textarea', 'data'), field('fallback', 'Fallback', 'text', 'data')], diagnosticExport: true }),
]

export const CONTENT_DYNAMIC_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [...CONTENT_WIDGET_DEFINITIONS, ...DYNAMIC_WIDGET_DEFINITIONS]

export function createCoreWidgetRegistry(): WidgetRegistry {
  const registry = new WidgetRegistry()
  for (const definition of [...STRUCTURAL_BASIC_WIDGET_DEFINITIONS, ...CONTENT_DYNAMIC_WIDGET_DEFINITIONS]) {
    const result = registry.register(definition)
    if (!result.ok) throw new Error(`Definición interna inválida: ${definition.id}: ${result.error.map((item) => item.message).join(' ')}`)
  }
  return registry
}
