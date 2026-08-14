import * as z from 'zod'
import { failure, success, type Result } from '../common/result'

const Text = z.string().trim().min(1).max(160)
const OptionalText = z.string().trim().max(500)
const Color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa un color hexadecimal de seis dígitos.')

export const EditableDemoStoreSchema = z.strictObject({
  identity: z.strictObject({ claim: OptionalText, contact: OptionalText, logoUrl: z.string().trim().max(4_096), name: Text }),
  colors: z.strictObject({ primary: Color, surface: Color }),
  featuredProduct: z.strictObject({ callToAction: Text, mediaUrl: z.string().trim().max(4_096), name: Text, price: Text, stock: z.number().int().nonnegative() }),
  dashboard: z.strictObject({ metricOrder: z.array(z.enum(['sales', 'orders', 'stock'])).length(3), visibleMetrics: z.array(z.enum(['sales', 'orders', 'stock'])).min(1).max(3) }),
})

export type EditableDemoStore = z.infer<typeof EditableDemoStoreSchema>
export type EditableDemoStorePatch = Partial<EditableDemoStore>

export const DEFAULT_EDITABLE_DEMO_STORE: EditableDemoStore = Object.freeze({
  identity: { claim: 'Objetos útiles, elegidos con calma.', contact: 'hola@tienda.local', logoUrl: '', name: 'Tienda local' },
  colors: { primary: '#2563eb', surface: '#ffffff' },
  featuredProduct: { callToAction: 'Ver producto', mediaUrl: '', name: 'Producto destacado', price: '€49', stock: 12 },
  dashboard: { metricOrder: ['sales', 'orders', 'stock'], visibleMetrics: ['sales', 'orders', 'stock'] },
})

export function editableDemoStore(structure: { readonly demoStore?: EditableDemoStore }): EditableDemoStore {
  return structuredClone(structure.demoStore ?? DEFAULT_EDITABLE_DEMO_STORE)
}

export function updateEditableDemoStore<T extends { readonly demoStore?: EditableDemoStore }>(structure: T, patch: EditableDemoStorePatch): Result<T, string> {
  const current = editableDemoStore(structure)
  const candidate = EditableDemoStoreSchema.safeParse({
    ...current,
    ...patch,
    colors: { ...current.colors, ...patch.colors },
    dashboard: { ...current.dashboard, ...patch.dashboard },
    featuredProduct: { ...current.featuredProduct, ...patch.featuredProduct },
    identity: { ...current.identity, ...patch.identity },
  })
  if (!candidate.success) return failure(candidate.error.issues[0]?.message ?? 'La tienda demo no es válida.')
  return success({ ...structuredClone(structure), demoStore: candidate.data })
}
