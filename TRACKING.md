# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F04 — Application shell, navegación y workspaces responsive`.
- Microfase actual: `M04.2 — Shell tablet`.
- Estado: `EN_CURSO`.
- F00–F03: `COMPLETADA`.
- `M04.1 — Shell desktop`: `COMPLETADA`.
- F05–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.
- La incorporación del Addendum no cambia ni adelanta el orden real de fases.

## Ampliación de alcance 2026-08-10

- `FLUTTERFLOW_PARITY_ADDENDUM.md` creado como alcance normativo adicional.
- `PHASES.md` ampliado de F00–F18 a F00–F31 sin renumerar fases existentes.
- `DETAILED_EXECUTION_PHASES.md` ampliado con microfases M19.1–M31.8.
- `REQUIREMENTS.md` actualizado con trazabilidad de cada área del Addendum.
- `RULES.md`, `AGENTS.md`, `README.md` y `MEMORY.md` actualizados para preservar continuidad y evitar ejecución prematura.
- Capacidades faltantes se registran como `PARITY_GAP` y no se presentan como implementadas.
- No se crean implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.

## Roadmap ampliado

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, proyectos, autosave, recuperación y Command Bus/History |
| F04 | EN_CURSO | M04.1 desktop completada; M04.2 tablet activa |
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

- `ProjectCommandBus` implementa execute, undo y redo con revisiones monotónicas.
- `CompositeProjectCommand` agrupa mutaciones como una sola transacción lógica.
- `ProjectHistoryState` v1 persiste entries before/after, cursor y operación pendiente recuperable.
- Branching tras undo, límites configurables, conflictos sin sobrescritura y recuperación están probados.
- IndexedDB usa namespace `project-history` y conserva cursor/historial tras reapertura.

## Cierre M04.1 — Shell desktop

- Se formalizó el shell desktop existente; no se creó una segunda implementación.
- Añadido contrato `workspace.v1` en `src/editor-ui/editor/workspace-preferences.ts` con schema Zod estricto y `WorkspacePreferencesStore`.
- Persistencia local de rail, anchuras de Biblioteca/Inspector, modo docked/floating/minimized, lado de dock, bounds, pin y orden de apilado.
- Activar un panel actualiza su orden; los paneles flotantes y la barra de minimizados respetan ese orden persistente.
- La restauración limita rail/anchuras y reubica ventanas flotantes dentro del viewport actual; preferencias corruptas o de versión desconocida se ignoran de forma segura.
- `localStorage` se usa solo como adapter de preferencias de UI; estos datos no contaminan el modelo canónico del proyecto.
- Añadidas pruebas de round-trip, corrupción/versionado, limpieza, persistencia real tras remontaje y fallback seguro.
- Se corrigió la hidratación para evitar `setState` síncrono dentro de effects y renders redundantes; el log final no contiene avisos `act(...)` del workspace.
- Puerta técnica final PR #6 / run `31451142252`: lint, typecheck, 26 archivos de test / 102 pruebas y build Vite 7.3.6 correctos.

## Entregas UI anticipadas que continúan pendientes de su fase propietaria

- Biblioteca/árbol, canvas, inspector, dock móvil y themes existen visualmente y con interacciones parciales.
- `src/ui-integrity-v11.css` sigue como guardrail cross-theme para tamaño, selección, foco y overflow.
- M04.1 formaliza únicamente el shell desktop y su workspace; no cierra tablet/móvil, rutas, themes, F05–F07 ni F19.
- La consolidación de CSS/primitives continúa de forma segura al entrar cada microfase propietaria.

## Próximo paso exacto

`M04.2 — Shell tablet`:

- mantener rail contraído y canvas como región prioritaria;
- permitir un solo panel contextual persistente a la vez;
- presentar el panel secundario como overlay accesible y descartable;
- comprobar landscape y portrait;
- retener/restaurar foco y soportar `Escape`;
- reutilizar `workspace.v1` sin persistir geometría efímera del overlay como layout desktop.

## Bloqueos

- Ninguno para M04.2.
- F19–F31 están deliberadamente pendientes de sus dependencias, no bloqueadas.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

## Evidencia técnica histórica resumida

- CI/CD GitHub Actions + Cloudflare Pages configurados y verificados en entregas previas.
- PWA offline, manifest y Service Worker implementados.
- Modelo canónico v1, Zod, migraciones, breakpoints, CMS models y relaciones probados.
- Dexie/IndexedDB, ciclo de proyecto, import/export, recovery journal y project-history probados.
- M04.1: run `31451142252`, 102/102 pruebas, lint/typecheck/build verdes.
- Evidencia responsive histórica existe para 320/375/768/1024/1440/812×375; M04.2 debe volver a validar específicamente tablet antes de cerrar.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
