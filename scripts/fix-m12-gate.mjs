import fs from 'node:fs'

const enginePath = 'src/domain/project/backend-shell-engine.ts'
let engine = fs.readFileSync(enginePath, 'utf8')
engine = engine.replaceAll('(Object.values(menu.items) as MenuItem[])', 'Object.values(menu.items)')
fs.writeFileSync(enginePath, engine)

const sectionsPath = 'src/editor-ui/editor/app-sections.ts'
let sections = fs.readFileSync(sectionsPath, 'utf8')
sections = sections.replace(" | 'backend'", '')
sections = sections.replace("  backend: {\n    description: 'Convierte y administra lienzos visuales como pantallas del backend, con navegación editable y el mismo motor del editor.',\n    icon: 'content',\n    label: 'Administración',\n    panelTitle: 'Administración visual',\n    shortLabel: 'Backend',\n  },\n", '')
sections = sections.replace("['editor', 'documents', 'content', 'backend', 'design']", "['editor', 'documents', 'content', 'design']")
fs.writeFileSync(sectionsPath, sections)

for (const path of ['.github/workflows/m12-gate-fix.yml', '.github/m12-gate-fix-trigger', 'scripts/fix-m12-gate.mjs']) {
  if (fs.existsSync(path)) fs.rmSync(path, { force: true })
}
