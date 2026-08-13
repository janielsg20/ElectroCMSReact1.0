import fs from 'node:fs'

const enginePath = 'src/domain/project/backend-shell-engine.ts'
let engine = fs.readFileSync(enginePath, 'utf8')
engine = engine.replace('(Object.values(menu.items) as MenuItem[])', 'Object.values(menu.items)')
engine = engine.replace('for (const item of Object.values(menu.items) as MenuItem[])', 'for (const item of Object.values(menu.items))')
fs.writeFileSync(enginePath, engine)

const shellPath = 'src/editor-ui/editor/EditorShell.tsx'
let shell = fs.readFileSync(shellPath, 'utf8')
shell = shell.replace("import { BackendShellManager } from './BackendShellManager'\n", '')
fs.writeFileSync(shellPath, shell)

for (const path of [
  '.github/workflows/backend-shell-lint-fix.yml',
  '.github/backend-shell-lint-fix-trigger',
  'scripts/fix-backend-shell-lint.mjs',
]) {
  if (fs.existsSync(path)) fs.rmSync(path, { force: true })
}
