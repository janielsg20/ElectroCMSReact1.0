# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F03 — Persistencia local-first, proyectos e historial`.
- Microfase actual: `M03.4 — Command bus e historial`.
- Estado: `EN_CURSO`.
- F00–F02: `COMPLETADA`.
- F04–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran las fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.
- La incorporación del Addendum no cambia ni adelanta la microfase activa.

## Ampliación de alcance 2026-08-10

- `FLUTTERFLOW_PARITY_ADDENDUM.md` creado como alcance normativo adicional.
- `PHASES.md` ampliado de F00–F18 a F00–F31 sin renumerar fases existentes.
- `DETAILED_EXECUTION_PHASES.md` ampliado con microfases M19.1–M31.8.
- `REQUIREMENTS.md` actualizado con trazabilidad de cada área del Addendum.
- `RULES.md`, `AGENTS.md`, `README.md` y `MEMORY.md` actualizados para preservar continuidad y evitar ejecución prematura.
- Nueva regla: capacidades faltantes se registran como `PARITY_GAP` y no se presentan como implementadas.
- Nueva regla: no crear implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.

## Roadmap ampliado

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | EN_CURSO | Persistencia e historial; M03.4 activa |
| F04–F18 | NO_INICIADA | Roadmap base existente |
| F19 | NO_INICIADA | Visual Builder avanzado y workspace |
| F20 | NO_INICIADA | Component/Design System |
| F21 | NO_INICIADA | Data Types, State, Variables y condiciones |
| F22 | NO_INICIADA | Action Flow/Graph y App Events |
| F23 | NO_INICIADA | Database Builder y Backend Queries |
| F24 | NO_INICIADA | API Manager/Tester/Mapping |
| F25 | NO_INICIADA | Authentication/RBAC/Security |
| F26 | NO_INICIADA | Media/Routing/Storyboard/Responsive/Localization/SEO |
| F27 | NO_INICIADA | Custom Code/Dependencies/Environments/Integrations |
| F28 | NO_INICIADA | Test Mode/Debug/Automated Tests |
| F29 | NO_INICIADA | Versioning/Branching/Collaboration |
| F30 | NO_INICIADA | AI Builder/Agents/Command Palette |
| F31 | NO_INICIADA | Export ampliado/Deployment/Production validation |

## Entregas UI anticipadas

- Existe un shell high-density con navegación, Page/Widget Tree, canvas, inspector y status bar.
- Biblioteca e Inspector admiten dock, float, minimize, pin, restore y resize con alternativas de teclado.
- Móvil usa navegación de builder y tool sheets.
- Estas entregas son prototipos/implementaciones anticipadas y no cierran F04–F07 ni F19.
- Cuando las fases propietarias entren en curso se debe consolidar el CSS/estructura y eliminar overrides redundantes.

## Próximo paso exacto

`M03.4 — Command bus e historial`:

- comandos reversibles;
- transacciones compuestas;
- undo/redo;
- ramas nuevas;
- límites configurables;
- persistencia del historial;
- pruebas de recuperación e invariantes.

## Bloqueos

- Ninguno para M03.4.
- F19–F31 están deliberadamente pendientes de sus dependencias, no bloqueadas.

## Criterio para cambiar de fase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación de funciones futuras no cuenta como implementación.

## Evidencia técnica histórica resumida

- CI/CD GitHub Actions + Cloudflare Pages configurados y verificados en entregas previas.
- PWA offline, manifest y Service Worker implementados.
- Modelo canónico v1, Zod, migraciones, breakpoints, CMS models y relaciones probados.
- Dexie/IndexedDB, ciclo de proyecto, import/export y recovery journal probados.
- UI high-density responsive fue verificada previamente en 320/375/768/1024/1440/812×375; cualquier cambio posterior requiere nueva validación antes de afirmarlo como verificado.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
