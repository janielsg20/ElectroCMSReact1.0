# ElectroCMS React

Base documental para desarrollar un CMS visual local-first con React, TypeScript y Tailwind CSS.

## Inicio para una IA

Lee, en orden: `AGENTS.md` → `MEMORY.md` → `TRACKING.md` → microfase activa en `DETAILED_EXECUTION_PHASES.md`.

## Inicio para una persona

- Alcance íntegro: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Plan: `PHASES.md`.
- Layout accesible: `UI_UX_LAYOUT_SYSTEM.md`.
- Reglas de ingeniería: `RULES.md`.

## Desarrollo local

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Verificación completa:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## CI/CD

El workflow `.github/workflows/ci-cd.yml` ejecuta lint, typecheck, tests y build. Los pushes a `main` despliegan `dist` en Cloudflare Pages después de superar todas las comprobaciones. Consulta `CI_CD.md` para credenciales y operación.

## Estado

Scaffold técnico funcional de React + TypeScript + Tailwind. El editor visual y los módulos CMS todavía no están implementados; consulta `TRACKING.md`.

