import type { JsonValue, Node, WidgetDefinition, WidgetInspectorField, InspectorSection } from '../../domain'

export const INSPECTOR_SECTION_ORDER = ['content', 'style', 'layout', 'responsive', 'data', 'conditions', 'animations', 'accessibility', 'advanced'] as const satisfies readonly InspectorSection[]

export const INSPECTOR_SECTION_LABELS: Record<InspectorSection, string> = {
  accessibility: 'Accesibilidad',
  advanced: 'Avanzado',
  animations: 'Animaciones',
  conditions: 'Condiciones',
  content: 'Contenido',
  data: 'Datos',
  layout: 'Layout',
  responsive: 'Responsive',
  style: 'Estilo',
}

export interface GeneratedInspectorField extends WidgetInspectorField {
  readonly source: 'default' | 'node'
  readonly value: JsonValue | undefined
}

export interface GeneratedInspectorSection {
  readonly id: InspectorSection
  readonly label: string
  readonly fields: readonly GeneratedInspectorField[]
}

export function generateInspectorSections(definition: WidgetDefinition, node: Node): readonly GeneratedInspectorSection[] {
  const fieldsBySection = new Map<InspectorSection, GeneratedInspectorField[]>()
  for (const section of INSPECTOR_SECTION_ORDER) fieldsBySection.set(section, [])
  for (const field of definition.inspector) {
    const hasNodeValue = Object.hasOwn(node.properties, field.key)
    fieldsBySection.get(field.section)?.push({
      ...field,
      source: hasNodeValue ? 'node' : 'default',
      value: hasNodeValue ? node.properties[field.key] : definition.defaults[field.key],
    })
  }
  return INSPECTOR_SECTION_ORDER.map((id) => ({
    fields: fieldsBySection.get(id) ?? [],
    id,
    label: INSPECTOR_SECTION_LABELS[id],
  }))
}

export function formatInspectorValue(value: JsonValue | undefined): string {
  if (value === undefined) return 'Sin valor'
  if (value === '') return 'Vacío'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}
