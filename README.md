# ElectroCMS React

Base documental para desarrollar un CMS visual local-first con React, TypeScript y Tailwind CSS.

## Inicio para una IA

Lee, en orden: `AGENTS.md` → `MEMORY.md` → `TRACKING.md` → microfase activa en `DETAILED_EXECUTION_PHASES.md`.

No cargues el roadmap ampliado completo salvo que la microfase lo necesite. Cuando una tarea afecte paridad tipo FlutterFlow, consulta `FLUTTERFLOW_PARITY_ADDENDUM.md` y la fase propietaria F19–F31.

## Inicio para una persona

- Alcance íntegro base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Ampliación funcional tipo FlutterFlow: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Layout accesible: `UI_UX_LAYOUT_SYSTEM.md`.
- Reglas de ingeniería: `RULES.md`.

## Alcance ampliado

El roadmap conserva F00–F18 y añade F19–F31 para Visual Builder avanzado, Component/Design System, Data & State, Action Flow, Database/Backend Queries, APIs, Auth/RBAC, Media/Routing/Responsive, Custom Code, Test/Debug, Versioning/Collaboration, AI Builder y Deployment Center.

La ampliación es aditiva: no cambia la fase activa ni autoriza saltarse dependencias ya definidas.

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

El estado real y la única microfase activa viven en `TRACKING.md`. La existencia de requisitos F19–F31 no significa que esas funciones estén implementadas.
