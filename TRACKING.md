# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F04 — Application shell, navegación y workspaces responsive`.
- Microfase actual: `M04.1 — Shell desktop`.
- Estado: `EN_CURSO`.
- F00–F03: `COMPLETADA`.
- F05–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.
- La incorporación del Addendum no cambia ni adelanta el orden real de fases.

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
| F03 | COMPLETADA | Persistencia local-first, proyectos, autosave, recuperación y Command Bus/History |
| F04 | EN_CURSO | Application shell responsive; M04.1 activa |
| F05–F18 | NO_INICIADA | Roadmap base restante |
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

## Cierre F03 / M03.4

- Implementado `ProjectHistoryState` schema v1 con entradas `before`/`after`, cursor, operación pendiente recuperable e invariantes de proyecto/cursor/operación.
- Implementado `ProjectCommandBus` con execute, undo y redo; todos conservan revisiones monotónicas al restaurar estados lógicos anteriores.
- Implementado `CompositeProjectCommand`: varios comandos se evalúan como una sola transacción lógica; un fallo intermedio no persiste parciales.
- Implementadas ramas nuevas: ejecutar después de undo corta la cola de redo antes de registrar el nuevo paso.
- Implementado límite `maxEntries` conservando la ventana reversible más reciente.
- Persistencia IndexedDB añadida mediante namespace `project-history`; cursor e historial sobreviven cierre/reapertura.
- Protocolo preparar→guardar proyecto→confirmar historial; `recover()` reaplica una operación pendiente o reconcilia cursor si el proyecto ya alcanzó el target.
- Cambios externos incompatibles producen `history-conflict`; no se sobrescriben silenciosamente.
- Puerta técnica PR #5 / run `31449931973`: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` correctos; 24 archivos de test y 97/97 pruebas verdes, Vite 7.3.6.

## Entregas UI anticipadas

- Existe un shell high-density con navegación, Page/Widget Tree, canvas, inspector y status bar.
- Biblioteca e Inspector admiten dock, float, minimize, pin, restore y resize con alternativas de teclado.
- Móvil usa navegación de builder y tool sheets.
- Auditoría correctiva 2026-08-10: se reforzó el estado activo del sidebar, se aumentaron filas/targets compactos, Páginas y Árbol de widgets cambian selección real, y los falsos dropdowns del Inspector se sustituyeron por selects accesibles.
- La matriz de alineación y el vínculo de padding expresan y modifican estado; controles futuros del topbar, biblioteca, inspector y canvas se muestran deshabilitados/planificados en vez de simular interacción.
- `src/ui-integrity-v11.css` estabiliza tamaños, selected/focus states, overflow y legibilidad entre Studio, Bento Motion y Flow Builder.
- Estas entregas anticipadas no cierran por sí solas M04.1 ni F05–F07/F19.
- Ahora que F04 está activa, M04.1 debe consolidar el shell existente y eliminar overrides redundantes de forma segura, no crear una segunda UI.

## Próximo paso exacto

`M04.1 — Shell desktop`:

- formalizar header, navegación, panel izquierdo, canvas, inspector y status bar redimensionables;
- persistir posición, orden, visibilidad y anchuras del workspace;
- reutilizar el shell anticipado existente y consolidar tokens/primitives/CSS donde corresponda;
- probar restauración del workspace y no avanzar a M04.2 hasta cerrar la salida de M04.1.

## Bloqueos

- Ninguno para M04.1.
- F19–F31 están deliberadamente pendientes de sus dependencias, no bloqueadas.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

## Evidencia técnica histórica resumida

- CI/CD GitHub Actions + Cloudflare Pages configurados y verificados en entregas previas.
- PWA offline, manifest y Service Worker implementados.
- Modelo canónico v1, Zod, migraciones, breakpoints, CMS models y relaciones probados.
- Dexie/IndexedDB, ciclo de proyecto, import/export, recovery journal y project-history probados.
- UI high-density responsive fue verificada previamente en 320/375/768/1024/1440/812×375; cambios futuros de F04 requieren nueva validación antes de afirmarlos como verificados.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
