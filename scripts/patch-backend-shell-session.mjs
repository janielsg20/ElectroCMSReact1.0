import fs from 'node:fs'

const path = 'src/editor-project-session.ts'
let source = fs.readFileSync(path, 'utf8')

if (!source.includes("./domain/project/backend-shell-engine")) {
  const importMarker = "from './domain/project/form-builder-engine'"
  const markerIndex = source.indexOf(importMarker)
  if (markerIndex < 0) throw new Error('form-builder-engine import not found')
  const lineEnd = source.indexOf('\n', markerIndex)
  source = source.slice(0, lineEnd + 1) + `import {\n  createAdminShell as createAdminShellStructure,\n  deleteAdminShell as deleteAdminShellStructure,\n  updateAdminShell as updateAdminShellStructure,\n  type AdminShellInput,\n  type AdminShellUpdate,\n} from './domain/project/backend-shell-engine'\nimport type { BackendScreenId } from './domain/project/identity'\n` + source.slice(lineEnd + 1)
}

function methodBlock(methodName) {
  const start = source.indexOf(`  async ${methodName}(`)
  if (start < 0) throw new Error(`${methodName} method not found`)
  const open = source.indexOf('{', start)
  if (open < 0) throw new Error(`${methodName} body not found`)
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }
  throw new Error(`${methodName} body is unbalanced`)
}

if (!source.includes('async createAdminShell(')) {
  const createTemplate = methodBlock('createForm')
  const updateTemplate = methodBlock('updateForm')
  const deleteTemplate = methodBlock('deleteForm')

  const createMethod = createTemplate
    .replace('async createForm(', 'async createAdminShell(')
    .replace('form: Form', 'input: AdminShellInput')
    .replace(/createForm\(structure, form\)/g, 'createAdminShellStructure(structure, input)')
    .replace(/Crear formulario/g, 'Crear shell administrativo')

  const updateMethod = updateTemplate
    .replace('async updateForm(', 'async updateAdminShell(')
    .replace('formId: FormId', 'screenId: BackendScreenId')
    .replace('patch: FormEditablePatch', 'patch: AdminShellUpdate')
    .replace(/updateForm\(structure, formId, patch\)/g, 'updateAdminShellStructure(structure, screenId, patch)')
    .replace(/Actualizar formulario/g, 'Actualizar shell administrativo')

  const deleteMethod = deleteTemplate
    .replace('async deleteForm(', 'async deleteAdminShell(')
    .replace('formId: FormId', 'screenId: BackendScreenId')
    .replace(/deleteForm\(structure, formId\)/g, 'deleteAdminShellStructure(structure, screenId)')
    .replace(/Eliminar formulario/g, 'Eliminar shell administrativo')

  const insertion = source.indexOf('  async createForm(')
  source = source.slice(0, insertion) + `${createMethod}\n\n${updateMethod}\n\n${deleteMethod}\n\n` + source.slice(insertion)
}

fs.writeFileSync(path, source)
