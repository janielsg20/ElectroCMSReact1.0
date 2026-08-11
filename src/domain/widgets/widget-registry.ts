import * as z from 'zod'
import { failure, success, type Result } from '../common/result'
import type { JsonValue } from '../project/project-envelope'

export const WIDGET_EXPORT_TARGETS = ['local', 'react', 'lamp', 'wordpress'] as const
export type WidgetExportTarget = typeof WIDGET_EXPORT_TARGETS[number]
export type WidgetExportSupport = 'supported' | 'diagnostic-only' | 'unsupported'
export type WidgetCategory = 'structure' | 'basic' | 'content' | 'dynamic' | 'commerce' | 'forms' | 'filters'
export type InspectorSection = 'content' | 'style' | 'layout' | 'responsive' | 'data' | 'conditions' | 'animations' | 'accessibility' | 'advanced'

export interface WidgetInspectorField {
  readonly key: string
  readonly label: string
  readonly control: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'spacing' | 'asset' | 'binding'
  readonly section: InspectorSection
  readonly required: boolean
  readonly options?: readonly string[]
}

export interface WidgetMigration {
  readonly fromVersion: number
  readonly toVersion: number
  migrate(properties: Readonly<Record<string, JsonValue>>): Readonly<Record<string, JsonValue>>
}

export interface WidgetDefinition {
  readonly id: string
  readonly version: string
  readonly schemaVersion: number
  readonly category: WidgetCategory
  readonly label: string
  readonly description: string
  readonly propertySchema: z.ZodType<Record<string, JsonValue>>
  readonly defaults: Readonly<Record<string, JsonValue>>
  readonly rendererId: string
  readonly inspector: readonly WidgetInspectorField[]
  readonly icon: { readonly viewBox: string; readonly path: string }
  readonly migrations: readonly WidgetMigration[]
  readonly exporterSupport: Readonly<Record<WidgetExportTarget, WidgetExportSupport>>
  readonly accessibility: { readonly semanticRole: string; readonly requiresAccessibleName: boolean }
}

export type WidgetRegistryDiagnosticCode =
  | 'duplicate-widget'
  | 'invalid-id'
  | 'invalid-version'
  | 'invalid-defaults'
  | 'missing-renderer'
  | 'missing-inspector'
  | 'duplicate-inspector-key'
  | 'invalid-icon'
  | 'invalid-migrations'
  | 'unsupported-exporter'
  | 'diagnostic-only-exporter'
  | 'widget-not-found'

export interface WidgetRegistryDiagnostic {
  readonly code: WidgetRegistryDiagnosticCode
  readonly message: string
  readonly path?: string
  readonly severity: 'error' | 'warning'
}

const widgetIdPattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/
const semanticVersionPattern = /^\d+\.\d+\.\d+$/
const svgViewBoxPattern = /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/

function error(code: WidgetRegistryDiagnosticCode, message: string, path?: string): WidgetRegistryDiagnostic {
  return { code, message, path, severity: 'error' }
}

export function diagnoseWidgetDefinition(definition: WidgetDefinition): readonly WidgetRegistryDiagnostic[] {
  const diagnostics: WidgetRegistryDiagnostic[] = []
  if (!widgetIdPattern.test(definition.id)) diagnostics.push(error('invalid-id', 'El ID debe usar un namespace estable, por ejemplo content.heading.', 'id'))
  if (!semanticVersionPattern.test(definition.version) || !Number.isInteger(definition.schemaVersion) || definition.schemaVersion < 1) diagnostics.push(error('invalid-version', 'La versión semántica y schemaVersion deben ser válidas.', 'version'))
  if (!definition.rendererId.trim()) diagnostics.push(error('missing-renderer', 'El widget debe declarar un rendererId.', 'rendererId'))
  if (definition.inspector.length === 0) diagnostics.push(error('missing-inspector', 'El widget debe declarar al menos un campo de inspector.', 'inspector'))
  const inspectorKeys = new Set<string>()
  for (const [index, field] of definition.inspector.entries()) {
    if (inspectorKeys.has(field.key)) diagnostics.push(error('duplicate-inspector-key', `La clave ${field.key} está duplicada.`, `inspector.${index}.key`))
    inspectorKeys.add(field.key)
    if (field.control === 'select' && (!field.options || field.options.length === 0)) diagnostics.push(error('missing-inspector', `El select ${field.key} requiere opciones.`, `inspector.${index}.options`))
  }
  if (!svgViewBoxPattern.test(definition.icon.viewBox) || !definition.icon.path.trim() || /[<>]/.test(definition.icon.path)) diagnostics.push(error('invalid-icon', 'El icono debe declarar viewBox y path SVG sin markup ejecutable.', 'icon'))
  const defaults = definition.propertySchema.safeParse(definition.defaults)
  if (!defaults.success) diagnostics.push(error('invalid-defaults', defaults.error.issues.map((issue) => issue.message).join(' '), 'defaults'))
  const migrations = [...definition.migrations].sort((left, right) => left.fromVersion - right.fromVersion)
  if (definition.schemaVersion > 1 && (migrations.length !== definition.schemaVersion - 1 || migrations.some((migration, index) => migration.fromVersion !== index + 1 || migration.toVersion !== index + 2))) {
    diagnostics.push(error('invalid-migrations', 'Las migraciones deben formar una cadena consecutiva desde schema 1.', 'migrations'))
  }
  return diagnostics
}

export class WidgetRegistry {
  readonly #definitions = new Map<string, WidgetDefinition>()

  register(definition: WidgetDefinition): Result<WidgetDefinition, readonly WidgetRegistryDiagnostic[]> {
    if (this.#definitions.has(definition.id)) return failure([error('duplicate-widget', `El widget ${definition.id} ya está registrado.`, 'id')])
    const diagnostics = diagnoseWidgetDefinition(definition)
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) return failure(diagnostics)
    this.#definitions.set(definition.id, definition)
    return success(definition)
  }

  get(widgetId: string): WidgetDefinition | undefined {
    return this.#definitions.get(widgetId)
  }

  list(): readonly WidgetDefinition[] {
    return [...this.#definitions.values()]
  }

  diagnoseExporter(widgetId: string, target: WidgetExportTarget): readonly WidgetRegistryDiagnostic[] {
    const definition = this.#definitions.get(widgetId)
    if (!definition) return [error('widget-not-found', `El widget ${widgetId} no está registrado.`)]
    const support = definition.exporterSupport[target]
    if (support === 'supported') return []
    return [{
      code: support === 'unsupported' ? 'unsupported-exporter' : 'diagnostic-only-exporter',
      message: support === 'unsupported'
        ? `${definition.label} no admite exportación ${target}.`
        : `${definition.label} requiere diagnóstico adicional para exportar a ${target}.`,
      path: `exporterSupport.${target}`,
      severity: support === 'unsupported' ? 'error' : 'warning',
    }]
  }
}
