import * as z from 'zod'

export const ProfessionalCapabilityStatusSchema = z.enum(['interactive-demo', 'portable-model', 'planned'])
export const ProfessionalDestinationSchema = z.enum(['local', 'react', 'lamp', 'wordpress'])
export const ProfessionalStudioManifestSchema = z.strictObject({
  capabilities: z.record(z.string().min(1), ProfessionalCapabilityStatusSchema),
  destination: ProfessionalDestinationSchema,
  version: z.literal(1),
})

export type ProfessionalCapabilityStatus = z.infer<typeof ProfessionalCapabilityStatusSchema>
export type ProfessionalDestination = z.infer<typeof ProfessionalDestinationSchema>
export type ProfessionalStudioManifest = z.infer<typeof ProfessionalStudioManifestSchema>

const common = { media: 'interactive-demo', projectModel: 'interactive-demo', roles: 'portable-model', templates: 'portable-model' } as const

export function professionalStudioManifest(destination: ProfessionalDestination): ProfessionalStudioManifest {
  return { capabilities: { ...common, export: destination === 'local' ? 'interactive-demo' : 'planned' }, destination, version: 1 }
}

/** Añade el diagnóstico portable al paquete sin alterar su contenido ni inventar soporte. */
export function withProfessionalStudioManifest<T extends object>(destination: ProfessionalDestination, payload: T): T & { readonly professionalStudio: ProfessionalStudioManifest } {
  return { ...payload, professionalStudio: professionalStudioManifest(destination) }
}
