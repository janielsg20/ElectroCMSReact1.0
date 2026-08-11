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
- F00, F01 y F02 completadas.
- F03 activa.
- M03.1 repositorios locales: completada.
- M03.2 ciclo de proyecto: completada.
- M03.3 autosave/recuperación: completada.
- Microfase actual: `M03.4 — Command bus e historial` `EN_CURSO`.
- F04–F18 siguen `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31 existen solo como roadmap ampliado y están `NO_INICIADA`.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop/móvil desacopladas.
- Dominio/modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación deben compartir una sola fuente de verdad.
- Toda mutación futura relevante debe integrarse con Command Bus/History cuando aplique.
- No crear implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components o exportadores.
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
- Auditoría correctiva 2026-08-10: selección del rail, páginas y árbol ahora sigue estado real; dropdowns del Inspector usan controles nativos; alineación y vinculado de padding tienen estado; acciones futuras se muestran deshabilitadas en vez de aparentar funcionalidad.
- `src/ui-integrity-v11.css` actúa como guardrail final cross-theme para tamaños, selección, foco, legibilidad y overflow; Flow Builder ya no reduce filas/controles a ~30 px.
- Las múltiples capas CSS anticipadas deben consolidarse en primitives/componentes base cuando F04–F07/F19 entren formalmente; `ui-integrity-v11.css` es una estabilización, no sustituye esa consolidación.

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

Continuar `M03.4`: comandos reversibles, transacciones compuestas, límites configurables y persistencia de undo/redo con prueba de ramas nuevas.

No avanzar a F19 ni a otra fase por la ampliación documental.

## Riesgos abiertos

- La UI anticipada debe consolidarse para evitar acumulación indefinida de CSS/overrides.
- La densidad y legibilidad deben revalidarse cuando el editor tenga flujos funcionales reales.
- Collaboration/AI/integraciones remotas deben mantener funcionamiento local completo.
- Secrets nunca deben aparecer en frontend, logs o exports.
- Cada export target debe diagnosticar capacidades no soportadas; prohibida la pérdida silenciosa.

## Evidencia técnica base conservada

- CI/CD y Cloudflare Pages existen y han sido verificados en entregas previas.
- PWA offline, manifest y Service Worker están implementados.
- Modelo canónico v1, schemas Zod, migraciones v0→v1, breakpoints, CMS models y relaciones están implementados y probados.
- Dexie/IndexedDB, ProjectRecord, import/export y recovery journal están implementados y probados.
- Las cifras exactas de ejecuciones, bundles y suites históricas viven en `TRACKING.md` y `CHANGELOG.md`; no duplicarlas aquí.

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
