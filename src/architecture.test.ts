const sourceModules = import.meta.glob<string>('./**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const layers = ['domain', 'application', 'infrastructure', 'editor-ui', 'renderers', 'exporters'] as const
type Layer = (typeof layers)[number]

const allowedDependencies: Record<Layer, readonly Layer[]> = {
  domain: ['domain'],
  application: ['application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  'editor-ui': ['editor-ui', 'application', 'domain', 'renderers'],
  renderers: ['renderers', 'domain'],
  exporters: ['exporters', 'application', 'domain'],
}

const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g

function layerOf(modulePath: string): Layer | null {
  const firstSegment = modulePath.replace(/^\.\//, '').split('/')[0]
  return layers.find((layer) => layer === firstSegment) ?? null
}

function normalizePath(path: string): string {
  const segments: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '.' || segment === '') continue
    if (segment === '..') segments.pop()
    else segments.push(segment)
  }
  return `./${segments.join('/')}`
}

function importsOf(source: string): string[] {
  return [...source.matchAll(importPattern)].map((match) => match[1]).filter((value) => value !== undefined)
}

function resolveImport(importer: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const importerDirectory = importer.slice(0, importer.lastIndexOf('/'))
  const base = normalizePath(`${importerDirectory}/${specifier}`)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
  return candidates.find((candidate) => candidate in sourceModules) ?? null
}

describe('límites de arquitectura', () => {
  it('impide inversiones entre capas', () => {
    const violations: string[] = []

    for (const [importer, source] of Object.entries(sourceModules)) {
      const importerLayer = layerOf(importer)
      if (!importerLayer) continue

      for (const specifier of importsOf(source)) {
        const imported = resolveImport(importer, specifier)
        const importedLayer = imported ? layerOf(imported) : null
        if (importedLayer && !allowedDependencies[importerLayer].includes(importedLayer)) {
          violations.push(`${importerLayer}: ${importer} -> ${imported}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('impide dependencias circulares entre módulos de producción', () => {
    const productionModules = Object.keys(sourceModules).filter((path) => !path.includes('.test.'))
    const productionSet = new Set(productionModules)
    const graph = new Map(
      productionModules.map((modulePath) => [
        modulePath,
        importsOf(sourceModules[modulePath] ?? '')
          .map((specifier) => resolveImport(modulePath, specifier))
          .filter((dependency): dependency is string => dependency !== null && productionSet.has(dependency)),
      ]),
    )
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const cycles: string[] = []

    function visit(modulePath: string, trail: readonly string[]): void {
      if (visiting.has(modulePath)) {
        cycles.push([...trail, modulePath].join(' -> '))
        return
      }
      if (visited.has(modulePath)) return

      visiting.add(modulePath)
      for (const dependency of graph.get(modulePath) ?? []) visit(dependency, [...trail, modulePath])
      visiting.delete(modulePath)
      visited.add(modulePath)
    }

    for (const modulePath of productionModules) visit(modulePath, [])

    expect(cycles).toEqual([])
  })
})
