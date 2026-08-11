import * as z from 'zod'
import {
  BreakpointIdSchema,
  DocumentIdSchema,
  GlobalComponentIdSchema,
  NodeIdSchema,
} from './identity'
import { JsonValueSchema } from './project-envelope'

const LabelSchema = z.string().trim().min(1).max(160)
const PropertyKeySchema = z.string().min(1).max(160)
const PropertyMapSchema = z.record(PropertyKeySchema, JsonValueSchema)

export const BreakpointSchema = z.strictObject({
  id: BreakpointIdSchema,
  name: LabelSchema,
  width: z.number().int().min(240).max(10_000),
  orientation: z.enum(['any', 'portrait', 'landscape']),
  inheritsFrom: BreakpointIdSchema.nullable(),
})

export const BindingSourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('literal'),
    value: JsonValueSchema,
  }),
  z.strictObject({
    kind: z.literal('project-path'),
    path: z.array(PropertyKeySchema).min(1),
  }),
  z.strictObject({
    kind: z.literal('node-property'),
    nodeId: NodeIdSchema,
    path: z.array(PropertyKeySchema).min(1),
  }),
])

export const ConditionPredicateSchema = z.strictObject({
  source: BindingSourceSchema,
  operator: z.enum([
    'equals',
    'not-equals',
    'contains',
    'greater-than',
    'greater-or-equal',
    'less-than',
    'less-or-equal',
    'exists',
  ]),
  value: JsonValueSchema,
})

export const ConditionGroupSchema = z.strictObject({
  operator: z.enum(['all', 'any']),
  negate: z.boolean(),
  predicates: z.array(ConditionPredicateSchema).min(1),
})

export const NodeResponsiveOverrideSchema = z.strictObject({
  properties: PropertyMapSchema,
  styles: PropertyMapSchema,
  hidden: z.boolean().optional(),
})

const NodeBaseShape = {
  id: NodeIdSchema,
  name: LabelSchema,
  properties: PropertyMapSchema,
  styles: PropertyMapSchema,
  bindings: z.record(PropertyKeySchema, BindingSourceSchema),
  conditions: z.array(ConditionGroupSchema),
  responsive: z.record(BreakpointIdSchema, NodeResponsiveOverrideSchema),
  slots: z.record(PropertyKeySchema, z.array(NodeIdSchema)),
  locked: z.boolean(),
  hidden: z.boolean().default(false),
} as const

export const NodeSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    ...NodeBaseShape,
    kind: z.literal('widget'),
    widgetType: z.string().trim().min(1).max(160),
  }),
  z.strictObject({
    ...NodeBaseShape,
    kind: z.literal('component-instance'),
    componentId: GlobalComponentIdSchema,
  }),
])

const NodeTreeShape = {
  rootNodeIds: z.array(NodeIdSchema),
  nodes: z.record(NodeIdSchema, NodeSchema),
} as const

export const DocumentSchema = z.strictObject({
  id: DocumentIdSchema,
  name: LabelSchema,
  kind: z.enum(['page', 'template', 'header', 'footer', 'single', 'archive', 'not-found']),
  ...NodeTreeShape,
})

export const GlobalComponentSchema = z.strictObject({
  id: GlobalComponentIdSchema,
  name: LabelSchema,
  ...NodeTreeShape,
})

export const ProjectStructureSchema = z.strictObject({
  breakpoints: z.array(BreakpointSchema).min(1),
  documents: z.record(DocumentIdSchema, DocumentSchema),
  globalComponents: z.record(GlobalComponentIdSchema, GlobalComponentSchema),
})

export type Breakpoint = z.infer<typeof BreakpointSchema>
export type BindingSource = z.infer<typeof BindingSourceSchema>
export type ConditionPredicate = z.infer<typeof ConditionPredicateSchema>
export type ConditionGroup = z.infer<typeof ConditionGroupSchema>
export type NodeResponsiveOverride = z.infer<typeof NodeResponsiveOverrideSchema>
export type Node = z.infer<typeof NodeSchema>
export type Document = z.infer<typeof DocumentSchema>
export type GlobalComponent = z.infer<typeof GlobalComponentSchema>
export type ProjectStructure = z.infer<typeof ProjectStructureSchema>
