# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-10.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual, lógica/estado/datos visuales y exportadores Local, React, LAMP y WordPress.

## Alcance normativo

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Ampliación funcional tipo FlutterFlow: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- La ampliación añade F19–F31 sin renumerar ni reabrir F00–F18.
- FlutterFlow se usa como referencia de capacidades y flujos profesionales, no como fuente de código/branding/activos propietarios.
- Toda capacidad faltante del Addendum se registra como `PARITY_GAP` y se implementa solo en su fase propietaria.

## Estado real

- React 19 + TypeScript estricto + Tailwind 4 + Vite + PWA local-first.
- F00, F01, F02 y F03 completadas.
- M03.1 repositorios locales: completada.
- M03.2 ciclo de proyecto: completada.
- M03.3 autosave/recuperación: completada.
- M03.4 Command Bus e historial: completada con execute/undo/redo, transacciones compuestas, branching, límite configurable, recuperación y persistencia IndexedDB.
- Fase activa: `F04 — Application shell, navegación y workspaces responsive`.
- Microfase actual: `M04.1 — Shell desktop` `EN_CURSO`.
- F05–F18 siguen `NO_INICIADA`; F19–F31 continúan `NO_INICIADA`.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop/móvil desacopladas.
- Dominio/modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación deben compartir una sola fuente de verdad.
- Toda mutación futura relevante debe integrarse con `ProjectCommandBus`/`ProjectHistoryState` cuando aplique.
- Undo/redo restaura estados lógicos anteriores creando revisiones nuevas; la revisión persistente nunca retrocede.
- No crear implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History o exportadores.
- Integraciones externas son adapters/providers opcionales.
- AI Agents futuros no persisten directamente; producen comandos validados.
- Custom Code futuro requiere aislamiento, diagnostics, typecheck y seguridad.

## UI/UX vigente

- Dirección visual: High Density + Minimal Clean + builder/IDE profesional.
- Desktop: rail compacto, Page/Widget Tree, canvas central y Properties Panel; paneles docked/floating/minimized/pinned y resize.
- Tablet: rail compacto + canvas + panel contextual/overlays.
- Móvil: Topbar compacta + Canvas + bottom navigation `Widgets / Pages / Canvas / Properties / More` + tool sheets.
- Desktop objetivo: controles/filas ~32–36 px, spacing 4–8 px, rail ~44 px; touch mantiene 44 px.
- Azul reservado principalmente para selección, foco, active y primary actions.
- WCAG 2.2 AA; drag/resize/reorder siempre con alternativa de teclado/clic.
- Auditoría correctiva 2026-08-10: selección del rail, páginas y árbol sigue estado real; dropdowns del Inspector usan controles nativos; alineación y vinculado de padding tienen estado; acciones futuras se muestran deshabilitadas en vez de aparentar funcionalidad.
- `src/ui-integrity-v11.css` actúa como guardrail final cross-theme para tamaños, selección, foco, legibilidad y overflow; Flow Builder ya no reduce filas/controles a ~30 px.
- Al entrar formalmente F04 debe comenzar la consolidación de capas CSS/primitives sin perder las correcciones de v11.

## Roadmap ampliado F19–F31

- F19: Visual Builder avanzado, Selection Manager, Pages/Tree/Canvas/Workspace/mobile builder.
- F20: Component System, Component Studio y Design System.
- F21: Data Types, State, Set From Variable y Conditional Values.
- F22: Action Flow, Action Graph y App Events.
- F23: DataProvider, Database Builder y Backend Queries.
- F24: API Manager/Tester/Response Mapping.
- F25: Authentication, sessions, RBAC y security.
- F26: Media, Routing, Storyboard, Responsive, Animations, Localization, SEO.
- F27: Custom Code, Dependencies, Environments, Integrations.
- F28: Test Mode, Debug, State Inspector y Automated Tests.
- F29: Versioning, checkpoints, branching, comments/collaboration.
- F30: AI Builder, Agents y Command Palette.
- F31: Project Settings, export ampliado, Deployment Center y pre-deploy validation.

## Próximo paso exacto

Implementar `M04.1 — Shell desktop`: formalizar header, navegación, panel izquierdo, canvas, inspector y status bar redimensionables; persistir posición, orden, visibilidad y anchuras del workspace. Consolidar el prototipo anticipado existente en vez de crear otro shell.

No adelantar M04.2 ni F19 hasta cerrar M04.1 con evidencia reproducible.

## Riesgos abiertos

- La UI anticipada debe consolidarse ahora que F04 entra formalmente para evitar acumulación indefinida de CSS/overrides.
- La persistencia de workspace debe usar un contrato propio de preferencias, no contaminar el modelo canónico del documento.
- Collaboration/AI/integraciones remotas deben mantener funcionamiento local completo.
- Secrets nunca deben aparecer en frontend, logs o exports.
- Cada export target debe diagnosticar capacidades no soportadas; prohibida la pérdida silenciosa.

## Evidencia técnica base conservada

- CI/CD y Cloudflare Pages existen y han sido verificados en entregas previas.
- PWA offline, manifest y Service Worker están implementados.
- Modelo canónico v1, schemas Zod, migraciones v0→v1, breakpoints, CMS models y relaciones están implementados y probados.
- Dexie/IndexedDB, ProjectRecord, import/export, recovery journal y `project-history` están implementados y probados.
- M03.4: GitHub Actions run `31449931973`; lint, typecheck, 24 archivos de test / 97 pruebas y build Vite 7.3.6 verdes.
- Las cifras históricas y publicaciones viven en `TRACKING.md` y `CHANGELOG.md`.

## Punteros

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Fases: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Estado: `TRACKING.md`.
- Diseño: `design-system/electrocms/MASTER.md`, `UI_UX_LAYOUT_SYSTEM.md`.
- Arquitectura: `ARCHITECTURE.md`.
- Modelo: `DATA_MODELS.md`.
- Persistencia: `PERSISTENCE.md`.
- CI/CD: `CI_CD.md`.
