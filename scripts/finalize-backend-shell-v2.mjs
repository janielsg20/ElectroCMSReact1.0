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

function methodBlock(source, methodName) {
  const start = source.indexOf(`  async ${methodName}(`)
  if (start < 0) throw new Error(`${methodName} method not found`)
  const open = source.indexOf('{', start)
  const block = blockAt(source, open)
  return source.slice(start, block.end)
}

function patchSession() {
  const path = 'src/editor-project-session.ts'
  let source = fs.readFileSync(path, 'utf8')
  source = addImport(source, `import {\n  createAdminShell as createAdminShellStructure,\n  deleteAdminShell as deleteAdminShellStructure,\n  updateAdminShell as updateAdminShellStructure,\n  type AdminShellInput,\n  type AdminShellUpdate,\n} from './domain/project/backend-shell-engine'\nimport type { BackendScreenId } from './domain/project/identity'\n`, './domain/project/backend-shell-engine')

  if (!source.includes('async createAdminShell(')) {
    const createTemplate = methodBlock(source, 'createForm')
    const updateTemplate = methodBlock(source, 'updateForm')
    const deleteTemplate = methodBlock(source, 'deleteForm')

    const createMethod = createTemplate
      .replace('async createForm(', 'async createAdminShell(')
      .replace(/form:\s*Form/, 'input: AdminShellInput')
      .replace(/createForm\(/g, 'createAdminShellStructure(')
      .replace(/Crear formulario/g, 'Crear shell administrativo')

    const updateMethod = updateTemplate
      .replace('async updateForm(', 'async updateAdminShell(')
      .replace(/formId:\s*FormId/, 'screenId: BackendScreenId')
      .replace(/patch:\s*FormEditablePatch/, 'patch: AdminShellUpdate')
      .replace(/updateForm\(/g, 'updateAdminShellStructure(')
      .replace(/formId/g, 'screenId')
      .replace(/Actualizar formulario/g, 'Actualizar shell administrativo')

    const deleteMethod = deleteTemplate
      .replace('async deleteForm(', 'async deleteAdminShell(')
      .replace(/formId:\s*FormId/, 'screenId: BackendScreenId')
      .replace(/deleteForm\(/g, 'deleteAdminShellStructure(')
      .replace(/formId/g, 'screenId')
      .replace(/Eliminar formulario/g, 'Eliminar shell administrativo')

    const insertion = source.indexOf('  async createForm(')
    source = source.slice(0, insertion) + `${createMethod}\n\n${updateMethod}\n\n${deleteMethod}\n\n` + source.slice(insertion)
  }
  fs.writeFileSync(path, source)
}

function patchEditorShell() {
  const path = 'src/editor-ui/editor/EditorShell.tsx'
  let source = fs.readFileSync(path, 'utf8')
  source = addImport(source, "import { BackendShellManager } from './BackendShellManager'\n", './BackendShellManager')

  source = source.replace(/type EditorSection = ([^\n]+)/, (match, union) => union.includes("'backend'") ? match : `type EditorSection = ${union} | 'backend'`)
  if (!source.includes("'backend'")) throw new Error('Backend EditorSection not added')

  if (!source.includes("label: 'Administración'")) {
    const contentIndex = source.indexOf("section: 'content'") >= 0 ? source.indexOf("section: 'content'") : source.indexOf("id: 'content'")
    if (contentIndex < 0) throw new Error('Content nav entry not found')
    const open = source.lastIndexOf('{', contentIndex)
    if (open < 0) throw new Error('Content nav object start not found')
    const block = blockAt(source, open)
    let backendItem = block.text
      .replace(/section:\s*'content'/, "section: 'backend'")
      .replace(/id:\s*'content'/, "id: 'backend'")
      .replace(/label:\s*'[^']*'/, "label: 'Administración'")
    if (backendItem === block.text) throw new Error('Could not derive backend nav item')
    source = source.slice(0, block.end) + `,\n      ${backendItem}` + source.slice(block.end)
  }

  const stateMatch = source.match(/const \[([A-Za-z0-9_]*section[A-Za-z0-9_]*),\s*([A-Za-z0-9_]+)\] = useState<EditorSection>/i)
  const sectionVar = stateMatch?.[1] ?? 'section'
  const setter = stateMatch?.[2] ?? 'setSection'

  if (!source.includes('<BackendShellManager')) {
    const switchIndex = source.indexOf("case 'content':")
    if (switchIndex >= 0) {
      source = source.slice(0, switchIndex) + `case 'backend':\n        return <BackendShellManager onOpenCanvas={() => ${setter}('canvas')} />\n      ` + source.slice(switchIndex)
    } else {
      const tokens = [`{${sectionVar} === 'content' ?`, `{activeSection === 'content' ?`, `{section === 'content' ?`]
      const token = tokens.find((candidate) => source.includes(candidate))
      if (!token) throw new Error('EditorShell section renderer not found')
      const variable = token.includes('activeSection') ? 'activeSection' : token.includes('{section ') ? 'section' : sectionVar
      source = source.replace(token, `{${variable} === 'backend' ? <BackendShellManager onOpenCanvas={() => ${setter}('canvas')} /> : ${variable} === 'content' ?`)
    }
  }

  fs.writeFileSync(path, source)
}

patchSession()
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
