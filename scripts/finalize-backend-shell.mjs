import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (fs.existsSync('scripts/patch-backend-shell-session.mjs')) {
  run(process.execPath, ['scripts/patch-backend-shell-session.mjs'])
}

const path = 'src/editor-ui/editor/EditorShell.tsx'
let source = fs.readFileSync(path, 'utf8')

if (!source.includes("./BackendShellManager")) {
  const imports = [...source.matchAll(/^import .*$/gm)]
  const lastImport = imports.at(-1)
  if (!lastImport) throw new Error('No imports found in EditorShell')
  const insertion = (lastImport.index ?? 0) + lastImport[0].length
  source = source.slice(0, insertion) + "\nimport { BackendShellManager } from './BackendShellManager'" + source.slice(insertion)
}

source = source.replace(
  /type EditorSection = ([^\n]+)/,
  (match, union) => union.includes("'backend'") ? match : `type EditorSection = ${union} | 'backend'`,
)

if (!source.includes("'backend'")) throw new Error('EditorSection backend value was not added')

if (!/['\"]Administración['\"]/.test(source)) {
  const navPatterns = [
    /\{[^{}\n]*(?:id|section):\s*'content'[^{}]*\}/,
    /\{[^{}\n]*(?:id|section):\s*"content"[^{}]*\}/,
  ]
  let navMatch = null
  for (const pattern of navPatterns) {
    navMatch = source.match(pattern)
    if (navMatch) break
  }
  if (!navMatch?.[0]) throw new Error('Content navigation item not found')
  let backendItem = navMatch[0]
    .replace(/(['"])content\1/g, "$1backend$1")
    .replace(/label:\s*(['"])[^'"]+\1/, "label: 'Administración'")
  if (backendItem === navMatch[0]) throw new Error('Could not derive backend navigation item')
  source = source.replace(navMatch[0], `${navMatch[0]},\n      ${backendItem}`)
}

const stateMatch = source.match(/const \[([A-Za-z0-9_]*section[A-Za-z0-9_]*),\s*([A-Za-z0-9_]+)\] = useState<EditorSection>/i)
const sectionVar = stateMatch?.[1] ?? 'section'
const setter = stateMatch?.[2] ?? 'setSection'

if (!source.includes('<BackendShellManager')) {
  const switchPattern = new RegExp(`case ['\"]content['\"]:\\s*return`)
  const switchMatch = source.match(switchPattern)
  if (switchMatch?.index !== undefined) {
    source = source.slice(0, switchMatch.index)
      + `case 'backend':\n        return <BackendShellManager onOpenCanvas={() => ${setter}('canvas')} />\n      `
      + source.slice(switchMatch.index)
  } else {
    const contentTernary = new RegExp(`\\{${sectionVar} === ['\"]content['\"] \\?`)
    if (contentTernary.test(source)) {
      source = source.replace(contentTernary, `{${sectionVar} === 'backend' ? <BackendShellManager onOpenCanvas={() => ${setter}('canvas')} /> : ${sectionVar} === 'content' ?`)
    } else {
      throw new Error('Could not locate EditorShell section renderer')
    }
  }
}

fs.writeFileSync(path, source)

for (const temporary of [
  '.github/workflows/backend-shell-session-patch.yml',
  '.github/backend-shell-session-patch-trigger',
  'scripts/patch-backend-shell-session.mjs',
  '.github/workflows/backend-shell-finalize.yml',
  '.github/backend-shell-finalize-trigger',
  'scripts/finalize-backend-shell.mjs',
]) {
  if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true })
}
