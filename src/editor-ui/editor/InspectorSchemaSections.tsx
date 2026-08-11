import type { IconName } from '../primitives'
import { Icon } from '../primitives'
import type { Node, WidgetDefinition, InspectorSection } from '../../domain'
import { generateInspectorSections } from './inspector-schema-model'
import { InspectorFieldControl } from './InspectorFieldControl'
import { CanonicalStyleControl } from './CanonicalStyleControl'

interface InspectorSchemaSectionsProps {
  readonly definition: WidgetDefinition
  readonly node: Node
}

const sectionIcons: Record<InspectorSection, IconName> = {
  accessibility: 'eye',
  advanced: 'settings',
  animations: 'play',
  conditions: 'code',
  content: 'content',
  data: 'code',
  layout: 'columns',
  responsive: 'mobile',
  style: 'palette',
}

export function InspectorSchemaSections({ definition, node }: InspectorSchemaSectionsProps) {
  const sections = generateInspectorSections(definition, node)
  const firstPopulated = sections.findIndex((section) => section.fields.length > 0)

  return (
    <div className="divide-y divide-border" data-testid="generated-inspector-sections">
      {sections.map((section, index) => {
        const fieldCount = section.fields.length + (section.id === 'style' ? 1 : 0)
        return (
        <details className="group" key={section.id} open={index === firstPopulated}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-2 text-xs font-bold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus lg:min-h-9 lg:px-1.5">
            <Icon className="text-muted-foreground" name={sectionIcons[section.id]} size={12} />
            <span className="min-w-0 flex-1">{section.label}</span>
            <span aria-label={`${fieldCount} campos`} className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] tabular-nums text-muted-foreground">{fieldCount}</span>
            <Icon className="text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" name="chevron-down" size={11} />
          </summary>
          <div className="grid gap-1.5 px-2 pb-2 lg:px-1.5 lg:pb-1.5">
            {section.id === 'style' ? <CanonicalStyleControl key={`${node.id}-${JSON.stringify(node.styles)}`} node={node} /> : null}
            {section.fields.length > 0 ? section.fields.map((field) => <InspectorFieldControl definition={definition} field={field} key={`${node.id}-${field.key}-${field.source}-${JSON.stringify(field.value)}`} node={node} />) : section.id === 'style' ? null : <p className="rounded-md border border-dashed border-border p-2 text-[0.625rem] leading-4 text-muted-foreground">Sin campos declarados para este widget.</p>}
          </div>
        </details>
        )
      })}
    </div>
  )
}
