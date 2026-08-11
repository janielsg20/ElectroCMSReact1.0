import * as z from 'zod'
import type { JsonValue } from '../project/project-envelope'
import { createCoreWidgetRegistry } from './content-dynamic-widgets'
import type { WidgetDefinition, WidgetInspectorField } from './widget-registry'

type Category = 'commerce' | 'forms' | 'filters'
type Field = WidgetInspectorField

const SUPPORTED = { lamp: 'supported', local: 'supported', react: 'supported', wordpress: 'supported' } as const
const RUNTIME_REQUIRED = { lamp: 'diagnostic-only', local: 'supported', react: 'supported', wordpress: 'diagnostic-only' } as const

function schema(shape: z.ZodRawShape): z.ZodType<Record<string, JsonValue>> {
  return z.strictObject(shape) as unknown as z.ZodType<Record<string, JsonValue>>
}

function field(key: string, label: string, control: Field['control'], section: Field['section'] = 'content', options?: readonly string[]): Field {
  return { control, key, label, options, required: true, section }
}

interface Input {
  readonly accessibility?: WidgetDefinition['accessibility']
  readonly category: Category
  readonly defaults: Readonly<Record<string, JsonValue>>
  readonly description: string
  readonly fields: readonly Field[]
  readonly id: string
  readonly label: string
  readonly runtime?: boolean
  readonly shape: z.ZodRawShape
}

function define(input: Input): WidgetDefinition {
  return {
    accessibility: input.accessibility ?? { requiresAccessibleName: false, semanticRole: 'generic' },
    category: input.category,
    defaults: input.defaults,
    description: input.description,
    exporterSupport: input.runtime ? RUNTIME_REQUIRED : SUPPORTED,
    icon: { path: input.category === 'commerce' ? 'M5 6h14l-1 8H7zM9 18h.01M16 18h.01' : input.category === 'forms' ? 'M5 5h14v14H5zM8 9h8M8 13h5' : 'M4 6h16M7 12h10M10 18h4', viewBox: '0 0 24 24' },
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

const strings = z.array(z.string().max(2_000)).max(1_000)
const moneyFields = [field('value', 'Valor', 'text'), field('currency', 'Moneda', 'text', 'data')] as const

export const COMMERCE_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  define({ category: 'commerce', id: 'commerce.product-card', label: 'Tarjeta de producto', description: 'Resumen enlazable de producto.', defaults: { href: '#', image: '', price: '$0', title: 'Producto' }, shape: { href: z.string().max(4_096), image: z.string().max(4_096), price: z.string().max(100), title: z.string().max(500) }, fields: [field('title', 'Producto', 'text', 'accessibility'), field('price', 'Precio', 'text'), field('image', 'Imagen', 'asset'), field('href', 'Destino', 'text', 'advanced')], accessibility: { requiresAccessibleName: true, semanticRole: 'article' } }),
  define({ category: 'commerce', id: 'commerce.product-grid', label: 'Grid de productos', description: 'Estado declarativo de un listado comercial.', defaults: { columns: 3, emptyMessage: 'Sin productos', queryId: '' }, shape: { columns: z.number().int().min(1).max(12), emptyMessage: z.string().max(500), queryId: z.string().max(500) }, fields: [field('queryId', 'Query', 'binding', 'data'), field('columns', 'Columnas', 'number', 'layout'), field('emptyMessage', 'Estado vacío', 'text', 'data')], runtime: true }),
  define({ category: 'commerce', id: 'commerce.price', label: 'Precio', description: 'Precio actual declarativo.', defaults: { currency: 'USD', value: '0.00' }, shape: { currency: z.string().max(20), value: z.string().max(100) }, fields: moneyFields }),
  define({ category: 'commerce', id: 'commerce.previous-price', label: 'Precio anterior', description: 'Precio anterior semánticamente tachado.', defaults: { currency: 'USD', value: '0.00' }, shape: { currency: z.string().max(20), value: z.string().max(100) }, fields: moneyFields }),
  define({ category: 'commerce', id: 'commerce.variations', label: 'Variaciones', description: 'Opciones declarativas de producto.', defaults: { label: 'Variación', options: [] }, shape: { label: z.string().max(300), options: strings }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('options', 'Opciones', 'textarea')], accessibility: { requiresAccessibleName: true, semanticRole: 'group' }, runtime: true }),
  define({ category: 'commerce', id: 'commerce.buy-button', label: 'Botón de compra', description: 'Enlace de compra con destino explícito.', defaults: { disabled: false, href: '#', label: 'Comprar' }, shape: { disabled: z.boolean(), href: z.string().max(4_096), label: z.string().max(300) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('href', 'Destino', 'text', 'advanced'), field('disabled', 'Deshabilitado', 'boolean', 'conditions')], accessibility: { requiresAccessibleName: true, semanticRole: 'link' }, runtime: true }),
  define({ category: 'commerce', id: 'commerce.add-to-cart', label: 'Añadir al carrito', description: 'Contrato de acción de carrito no ejecutado en preview.', defaults: { href: '#', label: 'Añadir al carrito', productId: '' }, shape: { href: z.string().max(4_096), label: z.string().max(300), productId: z.string().max(500) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('productId', 'Producto', 'binding', 'data'), field('href', 'Destino exportable', 'text', 'advanced')], accessibility: { requiresAccessibleName: true, semanticRole: 'link' }, runtime: true }),
  define({ category: 'commerce', id: 'commerce.cart-count', label: 'Contador del carrito', description: 'Cantidad declarativa del carrito.', defaults: { count: 0, label: 'Carrito' }, shape: { count: z.number().int().nonnegative(), label: z.string().max(300) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('count', 'Cantidad de preview', 'number', 'data')], accessibility: { requiresAccessibleName: true, semanticRole: 'status' }, runtime: true }),
  define({ category: 'commerce', id: 'commerce.inventory', label: 'Inventario', description: 'Estado de inventario de preview.', defaults: { label: 'Inventario', quantity: 0 }, shape: { label: z.string().max(300), quantity: z.number().int().nonnegative() }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('quantity', 'Cantidad', 'number', 'data')], accessibility: { requiresAccessibleName: true, semanticRole: 'status' }, runtime: true }),
  define({ category: 'commerce', id: 'commerce.stock-badge', label: 'Badge de stock', description: 'Badge declarativo de disponibilidad.', defaults: { label: 'En stock', state: 'available' }, shape: { label: z.string().max(300), state: z.enum(['available', 'low', 'out']) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('state', 'Estado', 'select', 'conditions', ['available', 'low', 'out'])], accessibility: { requiresAccessibleName: true, semanticRole: 'status' } }),
  define({ category: 'commerce', id: 'commerce.wishlist', label: 'Wishlist', description: 'Estado declarativo de favoritos.', defaults: { active: false, itemId: '', label: 'Wishlist' }, shape: { active: z.boolean(), itemId: z.string().max(500), label: z.string().max(300) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('itemId', 'Elemento', 'binding', 'data'), field('active', 'Activo', 'boolean', 'conditions')], accessibility: { requiresAccessibleName: true, semanticRole: 'status' }, runtime: true }),
  define({ category: 'commerce', id: 'commerce.checkout', label: 'Checkout', description: 'Estado de checkout; nunca procesa pagos en preview.', defaults: { message: 'Checkout no ejecutado', state: 'idle' }, shape: { message: z.string().max(1_000), state: z.enum(['idle', 'ready', 'error']) }, fields: [field('state', 'Estado de preview', 'select', 'conditions', ['idle', 'ready', 'error']), field('message', 'Mensaje', 'textarea', 'data')], runtime: true }),
  define({ category: 'commerce', id: 'commerce.order-summary', label: 'Resumen de pedido', description: 'Resumen declarativo de líneas y total.', defaults: { items: [], total: '$0' }, shape: { items: strings, total: z.string().max(100) }, fields: [field('items', 'Líneas', 'textarea', 'data'), field('total', 'Total', 'text', 'data')], runtime: true }),
  define({ category: 'commerce', id: 'commerce.product-gallery', label: 'Galería de producto', description: 'Galería declarativa de recursos.', defaults: { alt: 'Galería de producto', images: [] }, shape: { alt: z.string().max(500), images: strings }, fields: [field('images', 'Imágenes', 'asset'), field('alt', 'Nombre accesible', 'text', 'accessibility')], accessibility: { requiresAccessibleName: true, semanticRole: 'list' } }),
  define({ category: 'commerce', id: 'commerce.related-products', label: 'Productos relacionados', description: 'Estado declarativo de productos relacionados.', defaults: { emptyMessage: 'Sin productos relacionados', queryId: '' }, shape: { emptyMessage: z.string().max(500), queryId: z.string().max(500) }, fields: [field('queryId', 'Query', 'binding', 'data'), field('emptyMessage', 'Estado vacío', 'text', 'data')], runtime: true }),
]

interface FormFieldInput {
  readonly id: string
  readonly label: string
  readonly valueSchema?: z.ZodType
  readonly value?: JsonValue
  readonly extraDefaults?: Readonly<Record<string, JsonValue>>
  readonly extraShape?: z.ZodRawShape
  readonly extraFields?: readonly Field[]
}

function formField(input: FormFieldInput): WidgetDefinition {
  return define({
    category: 'forms', id: input.id, label: input.label, description: `Campo ${input.label.toLocaleLowerCase('es')} declarativo.`,
    defaults: { label: input.label, name: input.id.replace('form.', ''), required: false, value: input.value ?? '', ...input.extraDefaults },
    shape: { label: z.string().max(300), name: z.string().max(300), required: z.boolean(), value: input.valueSchema ?? z.string().max(10_000), ...input.extraShape },
    fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('name', 'Nombre', 'text', 'advanced'), field('required', 'Obligatorio', 'boolean', 'conditions'), field('value', 'Valor de preview', 'text'), ...(input.extraFields ?? [])],
    accessibility: { requiresAccessibleName: true, semanticRole: 'input' }, runtime: true,
  })
}

export const FORM_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  define({ category: 'forms', id: 'form.container', label: 'Contenedor de formulario', description: 'Formulario declarativo que no envía datos en preview.', defaults: { action: '', label: 'Formulario', method: 'post' }, shape: { action: z.string().max(4_096), label: z.string().max(300), method: z.enum(['get', 'post']) }, fields: [field('label', 'Nombre accesible', 'text', 'accessibility'), field('method', 'Método', 'select', 'advanced', ['get', 'post']), field('action', 'Destino exportable', 'text', 'advanced')], accessibility: { requiresAccessibleName: true, semanticRole: 'form' }, runtime: true }),
  formField({ id: 'form.text', label: 'Texto' }),
  formField({ id: 'form.number', label: 'Número', value: 0, valueSchema: z.number(), extraDefaults: { max: 100, min: 0 }, extraShape: { max: z.number(), min: z.number() }, extraFields: [field('min', 'Mínimo', 'number'), field('max', 'Máximo', 'number')] }),
  formField({ id: 'form.email', label: 'Email' }),
  formField({ id: 'form.phone', label: 'Teléfono' }),
  formField({ id: 'form.url', label: 'URL' }),
  formField({ id: 'form.textarea', label: 'Textarea', extraDefaults: { rows: 4 }, extraShape: { rows: z.number().int().min(1).max(100) }, extraFields: [field('rows', 'Filas', 'number', 'layout')] }),
  formField({ id: 'form.select', label: 'Selector', extraDefaults: { options: [] }, extraShape: { options: strings }, extraFields: [field('options', 'Opciones', 'textarea')] }),
  formField({ id: 'form.radio', label: 'Radio', extraDefaults: { options: [] }, extraShape: { options: strings }, extraFields: [field('options', 'Opciones', 'textarea')] }),
  formField({ id: 'form.checkbox', label: 'Checkbox', value: false, valueSchema: z.boolean() }),
  formField({ id: 'form.switch', label: 'Switch', value: false, valueSchema: z.boolean() }),
  formField({ id: 'form.date', label: 'Fecha' }),
  formField({ id: 'form.time', label: 'Hora' }),
  formField({ id: 'form.file', label: 'Archivo', extraDefaults: { accept: '' }, extraShape: { accept: z.string().max(500) }, extraFields: [field('accept', 'Tipos aceptados', 'text', 'advanced')] }),
  formField({ id: 'form.image', label: 'Imagen', extraDefaults: { accept: 'image/*' }, extraShape: { accept: z.string().max(500) }, extraFields: [field('accept', 'Tipos aceptados', 'text', 'advanced')] }),
  define({ category: 'forms', id: 'form.repeater', label: 'Repeater', description: 'Grupo repetible declarativo.', defaults: { items: [], maxItems: 10 }, shape: { items: strings, maxItems: z.number().int().min(1).max(1_000) }, fields: [field('items', 'Elementos de preview', 'textarea'), field('maxItems', 'Máximo', 'number', 'advanced')], runtime: true }),
  define({ category: 'forms', id: 'form.conditional-fields', label: 'Campos condicionales', description: 'Condición declarativa sin evaluación externa.', defaults: { condition: '', matches: true }, shape: { condition: z.string().max(1_000), matches: z.boolean() }, fields: [field('condition', 'Condición', 'text', 'conditions'), field('matches', 'Coincide en preview', 'boolean', 'conditions')], runtime: true }),
  define({ category: 'forms', id: 'form.captcha', label: 'CAPTCHA opcional', description: 'Placeholder explícito de CAPTCHA; no genera tokens.', defaults: { enabled: false, provider: 'none' }, shape: { enabled: z.boolean(), provider: z.enum(['none', 'recaptcha', 'turnstile']) }, fields: [field('enabled', 'Habilitado', 'boolean', 'conditions'), field('provider', 'Proveedor', 'select', 'advanced', ['none', 'recaptcha', 'turnstile'])], runtime: true }),
  define({ category: 'forms', id: 'form.submit', label: 'Botón de envío', description: 'Submit declarativo deshabilitado en preview.', defaults: { disabled: true, label: 'Enviar' }, shape: { disabled: z.boolean(), label: z.string().max(300) }, fields: [field('label', 'Etiqueta', 'text', 'accessibility'), field('disabled', 'Deshabilitado', 'boolean', 'conditions')], accessibility: { requiresAccessibleName: true, semanticRole: 'button' }, runtime: true }),
  define({ category: 'forms', id: 'form.status-message', label: 'Mensajes de estado', description: 'Estado accesible de formulario.', defaults: { message: 'Formulario listo', state: 'idle' }, shape: { message: z.string().max(2_000), state: z.enum(['idle', 'success', 'error']) }, fields: [field('state', 'Estado', 'select', 'conditions', ['idle', 'success', 'error']), field('message', 'Mensaje', 'textarea', 'accessibility')], accessibility: { requiresAccessibleName: false, semanticRole: 'status' } }),
]

function filterDefinition(id: string, label: string, defaults: Readonly<Record<string, JsonValue>>, shape: z.ZodRawShape, fields: readonly Field[]): WidgetDefinition {
  return define({ category: 'filters', id, label, description: `${label} declarativo; no ejecuta consultas en preview.`, defaults, shape, fields, runtime: true })
}

export const FILTER_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  filterDefinition('filter.search', 'Búsqueda', { label: 'Buscar', query: '' }, { label: z.string().max(300), query: z.string().max(2_000) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('query', 'Consulta de preview', 'text', 'data')]),
  filterDefinition('filter.select', 'Selector', { label: 'Filtrar', options: [], value: '' }, { label: z.string().max(300), options: strings, value: z.string().max(2_000) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('options', 'Opciones', 'textarea'), field('value', 'Valor', 'text', 'data')]),
  filterDefinition('filter.range', 'Rango', { label: 'Rango', max: 100, min: 0, value: 50 }, { label: z.string().max(300), max: z.number(), min: z.number(), value: z.number() }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('min', 'Mínimo', 'number'), field('max', 'Máximo', 'number'), field('value', 'Valor', 'number', 'data')]),
  filterDefinition('filter.checkboxes', 'Checkboxes', { label: 'Opciones', options: [], selected: [] }, { label: z.string().max(300), options: strings, selected: strings }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('options', 'Opciones', 'textarea'), field('selected', 'Seleccionadas', 'textarea', 'data')]),
  filterDefinition('filter.radio', 'Radio', { label: 'Opciones', options: [], value: '' }, { label: z.string().max(300), options: strings, value: z.string().max(2_000) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('options', 'Opciones', 'textarea'), field('value', 'Valor', 'text', 'data')]),
  filterDefinition('filter.date', 'Fecha', { label: 'Fecha', value: '' }, { label: z.string().max(300), value: z.string().max(100) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('value', 'Fecha', 'text', 'data')]),
  filterDefinition('filter.taxonomy', 'Taxonomía', { label: 'Taxonomía', selected: [], terms: [], taxonomy: '' }, { label: z.string().max(300), selected: strings, taxonomy: z.string().max(500), terms: strings }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('taxonomy', 'Taxonomía', 'binding', 'data'), field('terms', 'Términos', 'textarea'), field('selected', 'Seleccionados', 'textarea', 'data')]),
  filterDefinition('filter.sort', 'Ordenamiento', { label: 'Ordenar', options: [], value: '' }, { label: z.string().max(300), options: strings, value: z.string().max(500) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('options', 'Opciones', 'textarea'), field('value', 'Orden', 'text', 'data')]),
  filterDefinition('filter.pagination', 'Paginación', { page: 1, totalPages: 1 }, { page: z.number().int().min(1), totalPages: z.number().int().min(1) }, [field('page', 'Página', 'number', 'data'), field('totalPages', 'Total', 'number', 'data')]),
  filterDefinition('filter.load-more', 'Carga progresiva', { disabled: true, label: 'Cargar más', state: 'idle' }, { disabled: z.boolean(), label: z.string().max(300), state: z.enum(['idle', 'loading', 'done']) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('state', 'Estado', 'select', 'conditions', ['idle', 'loading', 'done']), field('disabled', 'Deshabilitado', 'boolean', 'conditions')]),
  filterDefinition('filter.reset', 'Botón de restablecimiento', { disabled: false, label: 'Restablecer' }, { disabled: z.boolean(), label: z.string().max(300) }, [field('label', 'Etiqueta', 'text', 'accessibility'), field('disabled', 'Deshabilitado', 'boolean', 'conditions')]),
]

export const COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  ...COMMERCE_WIDGET_DEFINITIONS,
  ...FORM_WIDGET_DEFINITIONS,
  ...FILTER_WIDGET_DEFINITIONS,
]

export function createCompleteWidgetRegistry() {
  const registry = createCoreWidgetRegistry()
  for (const definition of COMMERCE_FORM_FILTER_WIDGET_DEFINITIONS) {
    const result = registry.register(definition)
    if (!result.ok) throw new Error(`Definición interna inválida: ${definition.id}: ${result.error.map((item) => item.message).join(' ')}`)
  }
  return registry
}
