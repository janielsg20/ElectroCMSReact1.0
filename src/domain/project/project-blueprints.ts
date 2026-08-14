import * as z from 'zod'

export const PROJECT_BLUEPRINT_IDS = [
  'online-store', 'blog', 'real-estate-portal', 'academy-lms', 'appointments', 'crm', 'business-directory', 'creative-portfolio', 'inventory', 'restaurant',
  'events', 'memberships', 'marketplace', 'job-board', 'clinic', 'property-management', 'help-desk', 'nonprofit', 'vehicle-catalog', 'tattoo-studio',
] as const

export const ProjectBlueprintIdSchema = z.enum(PROJECT_BLUEPRINT_IDS)
export const ProjectBlueprintCoverageSchema = z.strictObject({
  backend: z.literal(true), contentTypes: z.literal(true), dashboard: z.literal(true), demoContent: z.literal(true), fields: z.literal(true), filters: z.literal(true), forms: z.literal(true), pages: z.literal(true), queries: z.literal(true), relations: z.literal(true), roles: z.literal(true), taxonomies: z.literal(true), templates: z.literal(true),
})
export const ProjectBlueprintSchema = z.strictObject({
  description: z.string().trim().min(1).max(500), id: ProjectBlueprintIdSchema, name: z.string().trim().min(1).max(160), primaryContentLabel: z.string().trim().min(1).max(160), primaryContentSlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), version: z.literal(1), coverage: ProjectBlueprintCoverageSchema,
})

export type ProjectBlueprintId = z.infer<typeof ProjectBlueprintIdSchema>
export type ProjectBlueprint = z.infer<typeof ProjectBlueprintSchema>

const COMPLETE_COVERAGE: z.infer<typeof ProjectBlueprintCoverageSchema> = { backend: true, contentTypes: true, dashboard: true, demoContent: true, fields: true, filters: true, forms: true, pages: true, queries: true, relations: true, roles: true, taxonomies: true, templates: true }

function blueprint(id: ProjectBlueprintId, name: string, primaryContentLabel: string, primaryContentSlug: string, description: string): ProjectBlueprint {
  return { coverage: COMPLETE_COVERAGE, description, id, name, primaryContentLabel, primaryContentSlug, version: 1 }
}

export const PROJECT_BLUEPRINTS: readonly ProjectBlueprint[] = [
  blueprint('online-store', 'Tienda en línea', 'Producto', 'product', 'Catálogo, compra y gestión de productos.'),
  blueprint('blog', 'Blog y artículos', 'Artículo', 'article', 'Publicación editorial con categorías y autores.'),
  blueprint('real-estate-portal', 'Portal inmobiliario', 'Propiedad', 'property', 'Inmuebles, agentes y solicitudes.'),
  blueprint('academy-lms', 'Academia y cursos', 'Curso', 'course', 'Cursos, lecciones e inscripciones.'),
  blueprint('appointments', 'Citas y reservaciones', 'Reserva', 'booking', 'Disponibilidad, reservas y confirmaciones.'),
  blueprint('crm', 'CRM y clientes', 'Cliente', 'customer', 'Clientes, oportunidades y seguimiento.'),
  blueprint('business-directory', 'Directorio de empresas', 'Empresa', 'business', 'Fichas de negocio, categorías y contacto.'),
  blueprint('creative-portfolio', 'Portafolio creativo', 'Proyecto', 'project', 'Proyectos, colecciones y solicitudes.'),
  blueprint('inventory', 'Inventario y almacén', 'Artículo', 'item', 'Existencias, ubicaciones y movimientos.'),
  blueprint('restaurant', 'Restaurante y pedidos', 'Plato', 'menu-item', 'Menú, pedidos y reservas.'),
  blueprint('events', 'Eventos y entradas', 'Evento', 'event', 'Eventos, asistentes y venta de entradas.'),
  blueprint('memberships', 'Membresías', 'Plan', 'membership-plan', 'Planes, acceso y suscripciones.'),
  blueprint('marketplace', 'Marketplace', 'Anuncio', 'listing', 'Vendedores, publicaciones y solicitudes.'),
  blueprint('job-board', 'Bolsa de empleo', 'Vacante', 'job', 'Vacantes, empresas y candidaturas.'),
  blueprint('clinic', 'Clínica y servicios', 'Servicio', 'service', 'Servicios, pacientes y citas.'),
  blueprint('property-management', 'Gestión de propiedades', 'Unidad', 'unit', 'Unidades, contratos y mantenimientos.'),
  blueprint('help-desk', 'Help desk y tickets', 'Ticket', 'ticket', 'Solicitudes, prioridades y seguimiento.'),
  blueprint('nonprofit', 'ONG y donaciones', 'Campaña', 'campaign', 'Campañas, donantes y aportes.'),
  blueprint('vehicle-catalog', 'Catálogo de vehículos', 'Vehículo', 'vehicle', 'Vehículos, marcas y solicitudes.'),
  blueprint('tattoo-studio', 'Estudio de tatuajes', 'Reserva', 'tattoo-booking', 'Artistas, portafolio, reservas y consentimiento.'),
].map((item) => ProjectBlueprintSchema.parse(item))

export function getProjectBlueprint(id: ProjectBlueprintId): ProjectBlueprint | undefined {
  return PROJECT_BLUEPRINTS.find((item) => item.id === id)
}
