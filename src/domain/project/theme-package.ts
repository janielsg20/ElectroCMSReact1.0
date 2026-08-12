import * as z from 'zod'
import { failure, success, type Result } from '../common/result'
import {
  deserializeCanonical,
  serializeCanonical,
  type CanonicalJsonError,
  type ValidationIssue,
} from './canonical-json'
import type { BreakpointId, DocumentId, GlobalComponentId, NodeId } from './identity'
import {
  BreakpointSchema,
  DocumentSchema,
  GlobalComponentSchema,
  type Breakpoint,
  type Document,
  type Node,
  type ProjectStructure,
} from './structure-schema'
import { ProjectThemeSchema, type ProjectTheme } from './theme-schema'
import { validateProjectStructure } from './validate-structure'

export const THEME_PACKAGE_FORMAT = 'electrocms.theme-package' as const
export const THEME_PACKAGE_SCHEMA_VERSION = 1 as const

export const ThemePackageIdSchema = z.uuid().brand<'ThemePackageId'>()
export const ThemePackageVersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+$/,
  'La versión debe usar formato semántico mayor.menor.parche.',
)
const ThemePackageTimestampSchema = z.iso.datetime({ offset: false, precision: 3 })
const ThemePackageNameSchema = z.string().trim().min(1).max(160)
const ThemePackageDescriptionSchema = z.string().trim().max(1_000)

const ThemePackageThemesSchema = z.strictObject({
  backend: ProjectThemeSchema.optional(),
  frontend: ProjectThemeSchema.optional(),
})

export const ThemePackageContentsSchema = z.strictObject({
  breakpoints: z.array(BreakpointSchema),
  documents: z.array(DocumentSchema),
  globalComponents: z.array(GlobalComponentSchema),
  themes: ThemePackageThemesSchema,
})

export const ThemePackageSchema = z.strictObject({
  contents: ThemePackageContentsSchema,
  createdAt: ThemePackageTimestampSchema,
  description: ThemePackageDescriptionSchema,
  format: z.literal(THEME_PACKAGE_FORMAT),
  name: ThemePackageNameSchema,
  packageId: ThemePackageIdSchema,
  schemaVersion: z.literal(THEME_PACKAGE_SCHEMA_VERSION),
  updatedAt: ThemePackageTimestampSchema,
  version: ThemePackageVersionSchema,
}).superRefine((themePackage, context) => {
  const duplicateIds = (values: readonly { readonly id: string }[], path: string): void => {
    const seen = new Set<string>()
    for (const [index, value] of values.entries()) {
      if (seen.has(value.id)) {
        context.addIssue({
          code: 'custom',
          message: `El ID ${value.id} está duplicado dentro del paquete.`,
          path: ['contents', path, index, 'id'],
        })
      }
      seen.add(value.id)
    }
  }
  duplicateIds(themePackage.contents.breakpoints, 'breakpoints')
  duplicateIds(themePackage.contents.documents, 'documents')
  duplicateIds(themePackage.contents.globalComponents, 'globalComponents')
})

export type ThemePackageId = z.infer<typeof ThemePackageIdSchema>
export type ThemePackage = z.infer<typeof ThemePackageSchema>
export type ThemePackageVersion = z.infer<typeof ThemePackageVersionSchema>

export interface ThemePackagePartSelection {
  readonly backendTheme: boolean
  readonly documents: boolean
  readonly frontendTheme: boolean
  readonly globalComponents: boolean
}

export interface ThemePackageCreateInput {
  readonly createdAt: string
  readonly description?: string
  readonly name: string
  readonly packageId: ThemePackageId
  readonly selection: ThemePackagePartSelection
  readonly version?: ThemePackageVersion
}

export type ThemePackageDiagnosticCode =
  | 'empty-selection'
  | 'invalid-package'
  | 'missing-component-dependency'
  | 'route-conflict'
  | 'unsupported-selection'

export interface ThemePackageDiagnostic {
  readonly code: ThemePackageDiagnosticCode
  readonly message: string
  readonly path: readonly (string | number)[]
}

export interface ThemePackageImportIdFactory {
  readonly breakpointId: () => BreakpointId
  readonly documentId: () => DocumentId
  readonly globalComponentId: () => GlobalComponentId
  readonly nodeId: () => NodeId
}

export type ThemePackageRouteConflictPolicy = 'abort' | 'suffix'

export interface ThemePackageImportOptions {
  readonly ids: ThemePackageImportIdFactory
  readonly routeConflict: ThemePackageRouteConflictPolicy
}

export interface ThemePackageImportReport {
  readonly addedBreakpoints: number
  readonly importedDocuments: number
  readonly importedGlobalComponents: number
  readonly renamedRoutes: readonly { readonly from: string; readonly to: string }[]
  readonly reusedBreakpoints: number
  readonly updatedThemeScopes: readonly ('frontend' | 'backend')[]
}

export interface ThemePackageImportResult {
  readonly report: ThemePackageImportReport
  readonly structure: ProjectStructure
}

export function parseThemePackageId(value: unknown): ThemePackageId {
  return ThemePackageIdSchema.parse(value)
}

function diagnostic(
  code: ThemePackageDiagnosticCode,
  message: string,
  path: readonly (string | number)[] = [],
): ThemePackageDiagnostic {
  return { code, message, path }
}

function normalizePath(path: readonly PropertyKey[]): readonly (string | number)[] {
  return path.map((segment) => (
    typeof segment === 'symbol' ? (segment.description ?? segment.toString()) : segment
  ))
}

function issueDiagnostic(issue: ValidationIssue): ThemePackageDiagnostic {
  return diagnostic('invalid-package', issue.message, normalizePath(issue.path))
}

function canonicalJsonDiagnostics(error: CanonicalJsonError): readonly ThemePackageDiagnostic[] {
  if (error.kind === 'invalid-json') return [diagnostic('invalid-package', error.message)]
  return error.issues.map(issueDiagnostic)
}

function selectedPartCount(selection: ThemePackagePartSelection): number {
  return Number(selection.backendTheme)
    + Number(selection.documents)
    + Number(selection.frontendTheme)
    + Number(selection.globalComponents)
}

function packagePartCount(themePackage: ThemePackage): number {
  return Number(Boolean(themePackage.contents.themes.backend))
    + Number(themePackage.contents.documents.length > 0)
    + Number(Boolean(themePackage.contents.themes.frontend))
    + Number(themePackage.contents.globalComponents.length > 0)
}

function packageUsesComponents(documents: readonly Document[]): boolean {
  return documents.some((document) => (
    Object.values(document.nodes).some((node) => node.kind === 'component-instance')
  ))
}

const FALLBACK_PACKAGE_THEME: ProjectTheme = ProjectThemeSchema.parse({
  name: 'Validación de paquete',
  schemaVersion: 1,
  tokens: {
    color: {
      background: '#ffffff',
      border: '#d1d5db',
      danger: '#b91c1c',
      focus: '#2563eb',
      muted: '#4b5563',
      onPrimary: '#ffffff',
      primary: '#2563eb',
      surface: '#f9fafb',
      text: '#111827',
    },
    density: { mode: 'comfortable', scale: 1 },
    motion: { easing: 'ease-out', fast: 150, normal: 250, slow: 400 },
    radius: { full: 9999, large: 16, medium: 10, small: 6 },
    shadow: {
      large: '0 20px 40px rgb(15 23 42 / 0.14)',
      medium: '0 8px 20px rgb(15 23 42 / 0.10)',
      small: '0 2px 8px rgb(15 23 42 / 0.08)',
    },
    spacing: { controlHeight: 44, gap: 16, section: 64, unit: 4 },
    typography: {
      baseSize: 16,
      bodyFamily: 'Inter, sans-serif',
      headingFamily: 'Inter, sans-serif',
      lineHeight: 1.5,
      scaleRatio: 1.25,
    },
  },
})

function structureFromPackage(themePackage: ThemePackage): ProjectStructure | null {
  const hasTrees = themePackage.contents.documents.length > 0
    || themePackage.contents.globalComponents.length > 0
  if (!hasTrees || themePackage.contents.breakpoints.length === 0) return null
  return {
    breakpoints: structuredClone(themePackage.contents.breakpoints),
    documents: Object.fromEntries(
      themePackage.contents.documents.map((document) => [document.id, structuredClone(document)]),
    ),
    globalComponents: Object.fromEntries(
      themePackage.contents.globalComponents.map((component) => [component.id, structuredClone(component)]),
    ),
    themes: {
      backend: structuredClone(themePackage.contents.themes.backend ?? FALLBACK_PACKAGE_THEME),
      frontend: structuredClone(themePackage.contents.themes.frontend ?? FALLBACK_PACKAGE_THEME),
    },
  }
}

export function validateThemePackage(
  input: unknown,
): Result<ThemePackage, readonly ThemePackageDiagnostic[]> {
  const parsed = ThemePackageSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => diagnostic(
      'invalid-package',
      issue.message,
      normalizePath(issue.path),
    )))
  }
  const themePackage = parsed.data
  if (packagePartCount(themePackage) === 0) {
    return failure([diagnostic('invalid-package', 'El paquete no contiene ninguna parte importable.', ['contents'])])
  }
  const hasTrees = themePackage.contents.documents.length > 0
    || themePackage.contents.globalComponents.length > 0
  if (hasTrees && themePackage.contents.breakpoints.length === 0) {
    return failure([diagnostic(
      'invalid-package',
      'Los documentos o componentes del paquete requieren sus breakpoints canónicos.',
      ['contents', 'breakpoints'],
    )])
  }
  if (packageUsesComponents(themePackage.contents.documents)
    && themePackage.contents.globalComponents.length === 0) {
    return failure([diagnostic(
      'missing-component-dependency',
      'Los documentos del paquete usan componentes globales que no fueron incluidos.',
      ['contents', 'globalComponents'],
    )])
  }
  const candidate = structureFromPackage(themePackage)
  if (candidate) {
    const validated = validateProjectStructure(candidate)
    if (!validated.ok) {
      return failure(validated.error.map((issue) => diagnostic(
        'invalid-package',
        issue.message,
        normalizePath(issue.path),
      )))
    }
  }
  return success(themePackage)
}

export function createThemePackage(
  structure: ProjectStructure,
  input: ThemePackageCreateInput,
): Result<ThemePackage, readonly ThemePackageDiagnostic[]> {
  if (selectedPartCount(input.selection) === 0) {
    return failure([diagnostic('empty-selection', 'Selecciona al menos una parte para crear el paquete.')])
  }
  const documents = input.selection.documents
    ? Object.values(structure.documents).map((document) => structuredClone(document))
    : []
  const globalComponents = input.selection.globalComponents
    ? Object.values(structure.globalComponents).map((component) => structuredClone(component))
    : []
  if (input.selection.documents
    && !input.selection.globalComponents
    && packageUsesComponents(documents)) {
    return failure([diagnostic(
      'missing-component-dependency',
      'Los documentos seleccionados usan componentes globales. Incluye Componentes para crear un paquete autocontenido.',
      ['selection', 'globalComponents'],
    )])
  }
  const hasTrees = documents.length > 0 || globalComponents.length > 0
  const created = ThemePackageSchema.safeParse({
    contents: {
      breakpoints: hasTrees ? structuredClone(structure.breakpoints) : [],
      documents,
      globalComponents,
      themes: {
        backend: input.selection.backendTheme ? structuredClone(structure.themes.backend) : undefined,
        frontend: input.selection.frontendTheme ? structuredClone(structure.themes.frontend) : undefined,
      },
    },
    createdAt: input.createdAt,
    description: input.description ?? '',
    format: THEME_PACKAGE_FORMAT,
    name: input.name,
    packageId: input.packageId,
    schemaVersion: THEME_PACKAGE_SCHEMA_VERSION,
    updatedAt: input.createdAt,
    version: input.version ?? '1.0.0',
  })
  if (!created.success) {
    return failure(created.error.issues.map((issue) => diagnostic(
      'invalid-package',
      issue.message,
      normalizePath(issue.path),
    )))
  }
  return validateThemePackage(created.data)
}

export function serializeThemePackage(
  themePackage: ThemePackage,
): Result<string, readonly ThemePackageDiagnostic[]> {
  const validated = validateThemePackage(themePackage)
  if (!validated.ok) return validated
  const serialized = serializeCanonical(ThemePackageSchema, validated.value)
  return serialized.ok ? success(serialized.value) : failure(canonicalJsonDiagnostics(serialized.error))
}

export function deserializeThemePackage(
  serialized: string,
): Result<ThemePackage, readonly ThemePackageDiagnostic[]> {
  const parsed = deserializeCanonical(ThemePackageSchema, serialized)
  if (!parsed.ok) return failure(canonicalJsonDiagnostics(parsed.error))
  return validateThemePackage(parsed.value)
}

export function updateThemePackageMetadata(
  themePackage: ThemePackage,
  patch: {
    readonly description?: string
    readonly name?: string
    readonly updatedAt: string
    readonly version?: string
  },
): Result<ThemePackage, readonly ThemePackageDiagnostic[]> {
  return validateThemePackage({
    ...themePackage,
    description: patch.description ?? themePackage.description,
    name: patch.name ?? themePackage.name,
    updatedAt: patch.updatedAt,
    version: patch.version ?? themePackage.version,
  })
}

export function duplicateThemePackage(
  themePackage: ThemePackage,
  input: {
    readonly name?: string
    readonly packageId: ThemePackageId
    readonly timestamp: string
  },
): Result<ThemePackage, readonly ThemePackageDiagnostic[]> {
  return validateThemePackage({
    ...structuredClone(themePackage),
    createdAt: input.timestamp,
    name: input.name?.trim() || `${themePackage.name} copia`,
    packageId: input.packageId,
    updatedAt: input.timestamp,
  })
}

export function bumpThemePackageVersion(
  themePackage: ThemePackage,
  level: 'major' | 'minor' | 'patch',
  updatedAt: string,
): Result<ThemePackage, readonly ThemePackageDiagnostic[]> {
  const parts = themePackage.version.split('.').map((part) => Number.parseInt(part, 10))
  const major = parts[0] ?? 0
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0
  const next = level === 'major'
    ? `${major + 1}.0.0`
    : level === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`
  return updateThemePackageMetadata(themePackage, { updatedAt, version: next })
}

function allocateUnique<TId extends string>(factory: () => TId, used: Set<string>): TId {
  let value = factory()
  while (used.has(value)) value = factory()
  used.add(value)
  return value
}

function remapNode(
  node: Node,
  nodeIds: ReadonlyMap<NodeId, NodeId>,
  breakpointIds: ReadonlyMap<BreakpointId, BreakpointId>,
  componentIds: ReadonlyMap<GlobalComponentId, GlobalComponentId>,
): Result<Node, ThemePackageDiagnostic> {
  const mappedId = nodeIds.get(node.id)
  if (!mappedId) {
    return failure(diagnostic(
      'invalid-package',
      `No existe remapeo para el nodo ${node.id}.`,
      ['nodes', node.id],
    ))
  }
  const bindings = Object.fromEntries(Object.entries(node.bindings).map(([key, source]) => {
    if (source.kind !== 'node-property') return [key, structuredClone(source)]
    const mappedSource = nodeIds.get(source.nodeId)
    return [key, mappedSource ? { ...structuredClone(source), nodeId: mappedSource } : structuredClone(source)]
  })) as Node['bindings']
  const responsive = Object.fromEntries(
    Object.entries(node.responsive).map(([breakpointId, override]) => {
      const mapped = breakpointIds.get(breakpointId as BreakpointId)
      return [mapped ?? breakpointId, structuredClone(override)]
    }),
  ) as Node['responsive']
  const slots = Object.fromEntries(Object.entries(node.slots).map(([slot, children]) => [
    slot,
    children.map((childId) => nodeIds.get(childId) ?? childId),
  ])) as Node['slots']
  if (node.kind === 'component-instance') {
    const mappedComponent = componentIds.get(node.componentId)
    if (!mappedComponent) {
      return failure(diagnostic(
        'missing-component-dependency',
        `El componente ${node.componentId} no está seleccionado para importación.`,
        ['nodes', node.id, 'componentId'],
      ))
    }
    return success({
      ...structuredClone(node),
      bindings,
      componentId: mappedComponent,
      id: mappedId,
      responsive,
      slots,
    })
  }
  return success({ ...structuredClone(node), bindings, id: mappedId, responsive, slots })
}

function remapTreeNodes(
  nodes: Readonly<Record<string, Node>>,
  nodeIds: ReadonlyMap<NodeId, NodeId>,
  breakpointIds: ReadonlyMap<BreakpointId, BreakpointId>,
  componentIds: ReadonlyMap<GlobalComponentId, GlobalComponentId>,
): Result<Record<string, Node>, ThemePackageDiagnostic> {
  const remapped: Record<string, Node> = {}
  for (const node of Object.values(nodes)) {
    const next = remapNode(node, nodeIds, breakpointIds, componentIds)
    if (!next.ok) return next
    remapped[next.value.id] = next.value
  }
  return success(remapped)
}

function nextRoute(route: string, occupied: Set<string>): string {
  if (!occupied.has(route)) return route
  const base = route === '/' ? '/imported' : route.replace(/\/$/, '')
  let suffix = 2
  let candidate = `${base}-${suffix}`
  while (occupied.has(candidate)) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  return candidate
}

function unavailableSelectionDiagnostics(
  themePackage: ThemePackage,
  selection: ThemePackagePartSelection,
): readonly ThemePackageDiagnostic[] {
  const diagnostics: ThemePackageDiagnostic[] = []
  if (selection.backendTheme && !themePackage.contents.themes.backend) {
    diagnostics.push(diagnostic(
      'unsupported-selection',
      'El paquete no contiene tema de backend.',
      ['selection', 'backendTheme'],
    ))
  }
  if (selection.frontendTheme && !themePackage.contents.themes.frontend) {
    diagnostics.push(diagnostic(
      'unsupported-selection',
      'El paquete no contiene tema de frontend.',
      ['selection', 'frontendTheme'],
    ))
  }
  if (selection.documents && themePackage.contents.documents.length === 0) {
    diagnostics.push(diagnostic(
      'unsupported-selection',
      'El paquete no contiene documentos.',
      ['selection', 'documents'],
    ))
  }
  if (selection.globalComponents && themePackage.contents.globalComponents.length === 0) {
    diagnostics.push(diagnostic(
      'unsupported-selection',
      'El paquete no contiene componentes globales.',
      ['selection', 'globalComponents'],
    ))
  }
  return diagnostics
}

export function applyThemePackage(
  structure: ProjectStructure,
  themePackageInput: unknown,
  selection: ThemePackagePartSelection,
  options: ThemePackageImportOptions,
): Result<ThemePackageImportResult, readonly ThemePackageDiagnostic[]> {
  if (selectedPartCount(selection) === 0) {
    return failure([diagnostic('empty-selection', 'Selecciona al menos una parte para importar.')])
  }
  const parsedPackage = validateThemePackage(themePackageInput)
  if (!parsedPackage.ok) return parsedPackage
  const themePackage = parsedPackage.value
  const unavailable = unavailableSelectionDiagnostics(themePackage, selection)
  if (unavailable.length > 0) return failure(unavailable)
  if (selection.documents
    && packageUsesComponents(themePackage.contents.documents)
    && !selection.globalComponents) {
    return failure([diagnostic(
      'missing-component-dependency',
      'Los documentos seleccionados requieren importar también Componentes.',
      ['selection', 'globalComponents'],
    )])
  }

  const candidate = structuredClone(structure)
  const usedBreakpointIds = new Set(candidate.breakpoints.map((breakpoint) => breakpoint.id))
  const breakpointIds = new Map<BreakpointId, BreakpointId>()
  const addedBreakpoints: Breakpoint[] = []
  let reusedBreakpoints = 0
  const importTrees = selection.documents || selection.globalComponents

  if (importTrees) {
    for (const breakpoint of themePackage.contents.breakpoints) {
      const existing = candidate.breakpoints.find((current) => (
        current.id === breakpoint.id && JSON.stringify(current) === JSON.stringify(breakpoint)
      ))
      if (existing) {
        breakpointIds.set(breakpoint.id, existing.id)
        reusedBreakpoints += 1
      } else {
        breakpointIds.set(
          breakpoint.id,
          allocateUnique(options.ids.breakpointId, usedBreakpointIds),
        )
      }
    }
    for (const breakpoint of themePackage.contents.breakpoints) {
      const mappedId = breakpointIds.get(breakpoint.id)
      if (!mappedId || candidate.breakpoints.some((current) => current.id === mappedId)) continue
      addedBreakpoints.push({
        ...structuredClone(breakpoint),
        id: mappedId,
        inheritsFrom: breakpoint.inheritsFrom
          ? (breakpointIds.get(breakpoint.inheritsFrom) ?? null)
          : null,
      })
    }
    candidate.breakpoints.push(...addedBreakpoints)
  }

  const usedComponentIds = new Set(Object.keys(candidate.globalComponents))
  const componentIds = new Map<GlobalComponentId, GlobalComponentId>()
  if (selection.globalComponents) {
    for (const component of themePackage.contents.globalComponents) {
      componentIds.set(
        component.id,
        allocateUnique(options.ids.globalComponentId, usedComponentIds),
      )
    }
  }

  const selectedDocuments = selection.documents ? themePackage.contents.documents : []
  const selectedComponents = selection.globalComponents
    ? themePackage.contents.globalComponents
    : []
  const usedNodeIds = new Set<string>([
    ...Object.values(candidate.documents).flatMap((document) => Object.keys(document.nodes)),
    ...Object.values(candidate.globalComponents).flatMap((component) => Object.keys(component.nodes)),
  ])
  const nodeIds = new Map<NodeId, NodeId>()
  const selectedNodes = [
    ...selectedDocuments.flatMap((document) => Object.values(document.nodes)),
    ...selectedComponents.flatMap((component) => Object.values(component.nodes)),
  ]
  for (const node of selectedNodes) {
    nodeIds.set(node.id, allocateUnique(options.ids.nodeId, usedNodeIds))
  }

  for (const component of selectedComponents) {
    const mappedComponentId = componentIds.get(component.id)
    if (!mappedComponentId) {
      return failure([diagnostic(
        'invalid-package',
        `No se pudo asignar un ID al componente ${component.id}.`,
        ['globalComponents', component.id],
      )])
    }
    const remappedNodes = remapTreeNodes(
      component.nodes,
      nodeIds,
      breakpointIds,
      componentIds,
    )
    if (!remappedNodes.ok) return failure([remappedNodes.error])
    candidate.globalComponents[mappedComponentId] = {
      ...structuredClone(component),
      id: mappedComponentId,
      nodes: remappedNodes.value,
      rootNodeIds: component.rootNodeIds.map((nodeId) => nodeIds.get(nodeId) ?? nodeId),
    }
  }

  const usedDocumentIds = new Set(Object.keys(candidate.documents))
  const occupiedRoutes = new Set(Object.values(candidate.documents).flatMap((document) => (
    document.kind === 'page' && document.routePath ? [document.routePath] : []
  )))
  const renamedRoutes: { from: string; to: string }[] = []
  let importedDocuments = 0
  for (const document of selectedDocuments) {
    const remappedNodes = remapTreeNodes(
      document.nodes,
      nodeIds,
      breakpointIds,
      componentIds,
    )
    if (!remappedNodes.ok) return failure([remappedNodes.error])
    const documentId = allocateUnique(options.ids.documentId, usedDocumentIds)
    let routePath = document.routePath
    if (document.kind === 'page' && routePath && occupiedRoutes.has(routePath)) {
      if (options.routeConflict === 'abort') {
        return failure([diagnostic(
          'route-conflict',
          `La ruta ${routePath} ya existe en el proyecto.`,
          ['documents', document.id, 'routePath'],
        )])
      }
      const renamed = nextRoute(routePath, occupiedRoutes)
      renamedRoutes.push({ from: routePath, to: renamed })
      routePath = renamed
    }
    if (routePath) occupiedRoutes.add(routePath)
    candidate.documents[documentId] = {
      ...structuredClone(document),
      id: documentId,
      nodes: remappedNodes.value,
      rootNodeIds: document.rootNodeIds.map((nodeId) => nodeIds.get(nodeId) ?? nodeId),
      routePath,
    }
    importedDocuments += 1
  }

  const updatedThemeScopes: ('frontend' | 'backend')[] = []
  if (selection.frontendTheme && themePackage.contents.themes.frontend) {
    candidate.themes.frontend = structuredClone(themePackage.contents.themes.frontend)
    updatedThemeScopes.push('frontend')
  }
  if (selection.backendTheme && themePackage.contents.themes.backend) {
    candidate.themes.backend = structuredClone(themePackage.contents.themes.backend)
    updatedThemeScopes.push('backend')
  }

  const validated = validateProjectStructure(candidate)
  if (!validated.ok) {
    return failure(validated.error.map((issue) => diagnostic(
      'invalid-package',
      issue.message,
      normalizePath(issue.path),
    )))
  }
  return success({
    report: {
      addedBreakpoints: addedBreakpoints.length,
      importedDocuments,
      importedGlobalComponents: selectedComponents.length,
      renamedRoutes,
      reusedBreakpoints,
      updatedThemeScopes,
    },
    structure: validated.value,
  })
}
