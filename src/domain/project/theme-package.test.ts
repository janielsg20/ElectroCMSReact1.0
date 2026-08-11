import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import {
  parseBreakpointId,
  parseDocumentId,
  parseGlobalComponentId,
  parseNodeId,
} from './identity'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import { DEFAULT_PROJECT_THEMES } from './theme-schema'
import {
  applyThemePackage,
  bumpThemePackageVersion,
  createThemePackage,
  deserializeThemePackage,
  duplicateThemePackage,
  parseThemePackageId,
  serializeThemePackage,
  type ThemePackageImportIdFactory,
  type ThemePackagePartSelection,
} from './theme-package'

const ids = {
  component: parseGlobalComponentId('77777777-7777-4777-8777-777777777777'),
  componentNode: parseNodeId('88888888-8888-4888-8888-888888888888'),
  document: parseDocumentId('99999999-9999-4999-8999-999999999999'),
  documentNode: parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  package: parseThemePackageId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  packageCopy: parseThemePackageId('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
}

const allParts: ThemePackagePartSelection = {
  backendTheme: true,
  documents: true,
  frontendTheme: true,
  globalComponents: true,
}

function structure(): ProjectStructure {
  return ProjectStructureSchema.parse({
    breakpoints: [structuredClone(DEFAULT_BREAKPOINTS[0])],
    documents: {
      [ids.document]: {
        conditions: [],
        id: ids.document,
        kind: 'page',
        name: 'Inicio',
        nodes: {
          [ids.documentNode]: {
            accessibility: { label: 'Componente principal' },
            bindings: {},
            componentId: ids.component,
            conditions: [],
            hidden: false,
            id: ids.documentNode,
            kind: 'component-instance',
            locked: false,
            name: 'Hero global',
            properties: {},
            responsive: {},
            slots: {},
            styles: {},
          },
        },
        rootNodeIds: [ids.documentNode],
        routePath: '/home',
      },
    },
    globalComponents: {
      [ids.component]: {
        id: ids.component,
        name: 'Hero',
        nodes: {
          [ids.componentNode]: {
            bindings: {},
            conditions: [],
            hidden: false,
            id: ids.componentNode,
            kind: 'widget',
            locked: false,
            name: 'Título',
            properties: { text: 'Hola' },
            responsive: {},
            slots: {},
            styles: {},
            widgetType: 'basic.text',
          },
        },
        rootNodeIds: [ids.componentNode],
      },
    },
    themes: structuredClone(DEFAULT_PROJECT_THEMES),
  })
}

function idFactory(): ThemePackageImportIdFactory {
  const breakpointIds = [parseBreakpointId('dddddddd-dddd-4ddd-8ddd-dddddddddddd')]
  const documentIds = [parseDocumentId('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')]
  const componentIds = [parseGlobalComponentId('ffffffff-ffff-4fff-8fff-ffffffffffff')]
  const nodeIds = [
    parseNodeId('10101010-1010-4010-8010-101010101010'),
    parseNodeId('20202020-2020-4020-8020-202020202020'),
  ]
  return {
    breakpointId: () => breakpointIds.shift() ?? parseBreakpointId(crypto.randomUUID()),
    documentId: () => documentIds.shift() ?? parseDocumentId(crypto.randomUUID()),
    globalComponentId: () => componentIds.shift() ?? parseGlobalComponentId(crypto.randomUUID()),
    nodeId: () => nodeIds.shift() ?? parseNodeId(crypto.randomUUID()),
  }
}

describe('theme packages', () => {
  it('creates a self-contained package and round-trips canonical JSON', () => {
    const created = createThemePackage(structure(), {
      createdAt: '2026-08-11T22:00:00.000Z',
      description: 'Paquete reutilizable',
      name: 'Starter profesional',
      packageId: ids.package,
      selection: allParts,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.value.contents.documents).toHaveLength(1)
    expect(created.value.contents.globalComponents).toHaveLength(1)
    expect(created.value.contents.breakpoints).toHaveLength(1)

    const serialized = serializeThemePackage(created.value)
    expect(serialized.ok).toBe(true)
    if (!serialized.ok) return
    const restored = deserializeThemePackage(serialized.value)
    expect(restored.ok).toBe(true)
    if (restored.ok) expect(restored.value).toEqual(created.value)
  })

  it('requires components when selected documents depend on them', () => {
    const created = createThemePackage(structure(), {
      createdAt: '2026-08-11T22:00:00.000Z',
      name: 'Documentos aislados',
      packageId: ids.package,
      selection: { ...allParts, globalComponents: false },
    })
    expect(created.ok).toBe(false)
    if (!created.ok) expect(created.error[0]?.code).toBe('missing-component-dependency')
  })

  it('duplicates metadata and bumps semantic versions without mutating the source', () => {
    const created = createThemePackage(structure(), {
      createdAt: '2026-08-11T22:00:00.000Z',
      name: 'Starter',
      packageId: ids.package,
      selection: { backendTheme: false, documents: false, frontendTheme: true, globalComponents: false },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const duplicated = duplicateThemePackage(created.value, {
      packageId: ids.packageCopy,
      timestamp: '2026-08-11T22:10:00.000Z',
    })
    expect(duplicated.ok).toBe(true)
    if (!duplicated.ok) return
    expect(duplicated.value.packageId).toBe(ids.packageCopy)
    expect(created.value.packageId).toBe(ids.package)

    const bumped = bumpThemePackageVersion(duplicated.value, 'minor', '2026-08-11T22:11:00.000Z')
    expect(bumped.ok).toBe(true)
    if (bumped.ok) expect(bumped.value.version).toBe('1.1.0')
  })

  it('aborts route conflicts or resolves them non-destructively with a suffix', () => {
    const source = structure()
    const created = createThemePackage(source, {
      createdAt: '2026-08-11T22:00:00.000Z',
      name: 'Sitio',
      packageId: ids.package,
      selection: allParts,
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const aborted = applyThemePackage(source, created.value, allParts, {
      ids: idFactory(),
      routeConflict: 'abort',
    })
    expect(aborted.ok).toBe(false)
    if (!aborted.ok) expect(aborted.error[0]?.code).toBe('route-conflict')

    const imported = applyThemePackage(source, created.value, allParts, {
      ids: idFactory(),
      routeConflict: 'suffix',
    })
    expect(imported.ok).toBe(true)
    if (!imported.ok) return
    expect(Object.keys(imported.value.structure.documents)).toHaveLength(2)
    expect(Object.keys(imported.value.structure.globalComponents)).toHaveLength(2)
    expect(imported.value.report.renamedRoutes).toEqual([{ from: '/home', to: '/home-2' }])
    expect(imported.value.report.reusedBreakpoints).toBe(1)
    expect(imported.value.structure.documents[ids.document]?.routePath).toBe('/home')
  })

  it('rejects invalid JSON and selections that a package does not contain', () => {
    const invalidJson = deserializeThemePackage('{')
    expect(invalidJson.ok).toBe(false)
    if (!invalidJson.ok) expect(invalidJson.error[0]?.code).toBe('invalid-package')

    const created = createThemePackage(structure(), {
      createdAt: '2026-08-11T22:00:00.000Z',
      name: 'Solo frontend',
      packageId: ids.package,
      selection: { backendTheme: false, documents: false, frontendTheme: true, globalComponents: false },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const imported = applyThemePackage(structure(), created.value, {
      backendTheme: true,
      documents: false,
      frontendTheme: false,
      globalComponents: false,
    }, { ids: idFactory(), routeConflict: 'abort' })
    expect(imported.ok).toBe(false)
    if (!imported.ok) expect(imported.error[0]?.code).toBe('unsupported-selection')
  })
})
