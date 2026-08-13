import fs from 'node:fs'

function blockAt(source, openIndex) {
  let depth = 0
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return { end: index + 1, text: source.slice(openIndex, index + 1) }
    }
  }
  throw new Error('Unbalanced block')
}

function addImport(source, text, marker) {
  if (source.includes(marker)) return source
  const imports = [...source.matchAll(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm)]
  const lastImport = imports.at(-1)
  if (!lastImport) throw new Error('No import block found')
  const insertion = (lastImport.index ?? 0) + lastImport[0].length
  return source.slice(0, insertion) + text + source.slice(insertion)
}

function methodRange(source, methodName) {
  const start = source.indexOf(`  async ${methodName}(`)
  if (start < 0) return null
  const open = source.indexOf('{', start)
  const block = blockAt(source, open)
  return { start, end: block.end }
}

function replaceMethod(source, methodName, replacement) {
  const range = methodRange(source, methodName)
  if (!range) throw new Error(`${methodName} method not found`)
  return source.slice(0, range.start) + replacement + source.slice(range.end)
}

function patchSession() {
  const path = 'src/editor-project-session.ts'
  let source = fs.readFileSync(path, 'utf8')
  source = addImport(source, `import {\n  createAdminShell as createAdminShellStructure,\n  deleteAdminShell as deleteAdminShellStructure,\n  updateAdminShell as updateAdminShellStructure,\n  type AdminShellInput,\n  type AdminShellUpdate,\n} from './domain/project/backend-shell-engine'\nimport type { BackendScreenId } from './domain/project/identity'\n`, './domain/project/backend-shell-engine')

  const createMethod = `  async createAdminShell(input: AdminShellInput): Promise<Result<ProjectStructure, string>> {\n    return this.#execute(new ProjectStructureCommand('cms.create-admin-shell', \`Crear shell administrativo \${input.screenName}\`, (structure) => {\n      const created = createAdminShellStructure(structure, input)\n      return created.ok ? success(created.value) : failure({ code: 'invalid-tree' as const, message: created.error[0]?.message ?? 'El shell administrativo no es válido.' })\n    }))\n  }`
  const updateMethod = `  async updateAdminShell(screenId: BackendScreenId, patch: AdminShellUpdate): Promise<Result<ProjectStructure, string>> {\n    return this.#execute(new ProjectStructureCommand('cms.update-admin-shell', 'Actualizar shell administrativo', (structure) => {\n      const updated = updateAdminShellStructure(structure, screenId, patch)\n      return updated.ok ? success(updated.value) : failure({ code: 'invalid-tree' as const, message: updated.error[0]?.message ?? 'El shell administrativo no es válido.' })\n    }))\n  }`
  const deleteMethod = `  async deleteAdminShell(screenId: BackendScreenId): Promise<Result<ProjectStructure, string>> {\n    return this.#execute(new ProjectStructureCommand('cms.delete-admin-shell', 'Eliminar shell administrativo', (structure) => {\n      const deleted = deleteAdminShellStructure(structure, screenId)\n      return deleted.ok ? success(deleted.value) : failure({ code: 'invalid-tree' as const, message: deleted.error[0]?.message ?? 'El shell administrativo no se puede retirar.' })\n    }))\n  }`

  if (methodRange(source, 'createAdminShell')) source = replaceMethod(source, 'createAdminShell', createMethod)
  else source = source.replace('  async createForm(', `${createMethod}\n\n  async createForm(`)
  if (methodRange(source, 'updateAdminShell')) source = replaceMethod(source, 'updateAdminShell', updateMethod)
  else source = source.replace('  async updateForm(', `${updateMethod}\n\n  async updateForm(`)
  if (methodRange(source, 'deleteAdminShell')) source = replaceMethod(source, 'deleteAdminShell', deleteMethod)
  else source = source.replace('  async deleteForm(', `${deleteMethod}\n\n  async deleteForm(`)

  fs.writeFileSync(path, source)
}

function patchSchema() {
  const path = 'src/domain/project/cms-schema.ts'
  let source = fs.readFileSync(path, 'utf8')
  source = source.replace(
    "z.enum(['dashboard', 'table', 'form', 'detail', 'calendar', 'kanban', 'chart', 'metrics', 'listing'])",
    "z.enum(['dashboard', 'table', 'form', 'detail', 'calendar', 'kanban', 'chart', 'metrics', 'listing', 'custom'])",
  )
  if (!source.includes('export type MenuItem = z.infer<typeof MenuItemSchema>')) {
    source = source.replace(
      'export type Menu = z.infer<typeof MenuSchema>',
      'export type MenuItem = z.infer<typeof MenuItemSchema>\nexport type Menu = z.infer<typeof MenuSchema>',
    )
  }
  fs.writeFileSync(path, source)
}

function patchBackendEngine() {
  const path = 'src/domain/project/backend-shell-engine.ts'
  let source = fs.readFileSync(path, 'utf8')
  source = source.replace(
    "import type { BackendScreen, Menu } from './cms-schema'",
    "import type { BackendScreen, Menu, MenuItem } from './cms-schema'",
  )
  source = source.replace("readonly menuItem: Menu['items'][string]", 'readonly menuItem: MenuItem')
  source = source.replace(
    "function menuContainingScreen(structure: ProjectStructure, screenId: BackendScreenId): { readonly menu: Menu; readonly item: Menu['items'][string] } | null {",
    'function menuContainingScreen(structure: ProjectStructure, screenId: BackendScreenId): { readonly menu: Menu; readonly item: MenuItem } | null {',
  )
  source = source.replace(
    "    const item = Object.values(menu.items).find((candidate) => candidate.kind === 'screen' && candidate.screenId === screenId)",
    "    const item = (Object.values(menu.items) as MenuItem[]).find((candidate) => candidate.kind === 'screen' && candidate.screenId === screenId)",
  )
  source = source.replace(
    '    const removedIds = Object.values(menu.items)\n      .filter((item) => item.kind === \'screen\' && item.screenId === screenId)',
    "    const removedIds = (Object.values(menu.items) as MenuItem[])\n      .filter((item) => item.kind === 'screen' && item.screenId === screenId)",
  )
  source = source.replace('    for (const item of Object.values(menu.items)) {', '    for (const item of Object.values(menu.items) as MenuItem[]) {')
  fs.writeFileSync(path, source)
}

function patchEditorShell() {
  const path = 'src/editor-ui/editor/EditorShell.tsx'
  let source = fs.readFileSync(path, 'utf8')
  source = addImport(source, "import { BackendShellManager } from './BackendShellManager'\n", './BackendShellManager')
  fs.writeFileSync(path, source)
}

patchSession()
patchSchema()
patchBackendEngine()
patchEditorShell()

for (const temporary of [
  '.github/workflows/backend-shell-session-patch.yml',
  '.github/backend-shell-session-patch-trigger',
  'scripts/patch-backend-shell-session.mjs',
  '.github/workflows/backend-shell-finalize.yml',
  '.github/backend-shell-finalize-trigger',
  'scripts/finalize-backend-shell.mjs',
  '.github/workflows/backend-shell-finalize-v2.yml',
  '.github/backend-shell-finalize-v2-trigger',
  'scripts/finalize-backend-shell-v2.mjs',
]) {
  if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true })
}
