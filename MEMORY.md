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
- F00–F04 completadas.
- F03 dejó repositorios locales, ciclo de proyecto, autosave/recuperación y Command Bus/historial reversibles con persistencia IndexedDB.
- F04 cerró shell desktop/tablet/móvil, navegación profunda, command palette/shortcuts y apariencia del editor.
- Fase activa: `F05 — Motor de documentos, nodos y canvas`.
- Microfase actual: `M05.1 — Operaciones del árbol` `EN_CURSO`.
- F06–F18 siguen `NO_INICIADA`; F19–F31 continúan `NO_INICIADA`.

## Decisiones vigentes

- Núcleo web local-first/PWA; envolturas desktop/móvil desacopladas.
- Dominio/modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación deben compartir una sola fuente de verdad.
- Toda mutación relevante de F05 debe integrarse con `ProjectCommandBus`/`ProjectHistoryState` cuando aplique.
- Undo/redo restaura estados lógicos anteriores creando revisiones nuevas; la revisión persistente nunca retrocede.
- No crear implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History o exportadores.
- Integraciones externas son adapters/providers opcionales.
- AI Agents futuros no persisten directamente; producen comandos validados.
- Custom Code futuro requiere aislamiento, diagnostics, typecheck y seguridad.
- `workspace.v1` y `appearance.v1` son preferencias locales de UI y no forman parte del modelo canónico del proyecto.
- `activeSection` continúa siendo la única selección visual de navegación; la URL `#/sección` la refleja mediante History API, no mediante un segundo router/estado React.

## UI/UX vigente

- Dirección visual: High Density + Minimal Clean + builder/IDE profesional.
- Desktop: rail compacto, Page/Widget Tree, canvas central y Properties Panel; paneles docked/floating/minimized/pinned y resize.
- Tablet 768–1023: rail 44 px, canvas prioritario, un panel persistente y secundario overlay accesible/redimensionable.
- Móvil 320–767: Topbar compacta + Canvas + bottom navigation `Widgets / Páginas / Canvas / Props / Más`, sheets, safe areas y targets táctiles de 44 px.
- Navegación profunda: `#/editor`, `#/dashboard`, `#/pages`, etc.; URL inválida cae en Editor.
- Command palette visible + `Ctrl/⌘+K`; shortcuts directos `Alt+Shift+E/H/P`; no se disparan en campos editables.
- Apariencia: preset visual y modo de color están separados. Presets `Studio / Bento Motion / Flow Builder`; modos `Claro / Oscuro / Automático`.
- `appearance.v1` persiste `{ version, uiTheme, colorMode }`; Automático sigue `prefers-color-scheme` en vivo.
- La apariencia se aplica antes de montar React para reducir flash; fallback seguro sigue Studio + claro.
- Contraste WCAG AA automatizado para Studio/Bento/Flow en claro y oscuro.
- Azul reservado principalmente para selección, foco, active y primary actions; `theme-color`/manifest usan `#2563EB`/`#2563eb`.
- `src/ui-integrity-v11.css` actúa como guardrail cross-theme; la consolidación de capas CSS continúa incrementalmente al formalizar fases propietarias.

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
- F30: AI Builder, Agents y Command Palette avanzado.
- F31: Project Settings, export ampliado, Deployment Center y pre-deploy validation.

## Próximo paso exacto

Implementar `M05.1 — Operaciones del árbol`: insertar, mover, anidar, agrupar, copiar, pegar, duplicar, bloquear, ocultar y renombrar nodos; preservar invariantes estructurales; integrar mutaciones con Command Bus/history; probar ciclos, padres inválidos, orden, duplicación profunda y operaciones multi-nodo.

No adelantar M05.2 ni F19 hasta cerrar M05.1 con evidencia reproducible.

## Riesgos abiertos

- F05 debe construir sobre el modelo canónico y Command Bus existentes; prohibido crear un árbol UI independiente como fuente de verdad.
- La selección múltiple necesaria en M05.1 debe mantenerse acotada a las operaciones de árbol y no sustituir prematuramente el Selection Manager formal de F19.
- La UI anticipada debe consolidarse gradualmente para evitar acumulación indefinida de CSS/overrides.
- Collaboration/AI/integraciones remotas deben mantener funcionamiento local completo.
- Secrets nunca deben aparecer en frontend, logs o exports.
- Cada export target debe diagnosticar capacidades no soportadas; prohibida la pérdida silenciosa.

## Evidencia técnica base conservada

- CI/CD y Cloudflare Pages existen y han sido verificados.
- PWA offline, manifest y Service Worker están implementados.
- Modelo canónico v1, schemas Zod, migraciones v0→v1, breakpoints, CMS models y relaciones están implementados y probados.
- Dexie/IndexedDB, ProjectRecord, import/export, recovery journal y `project-history` están implementados y probados.
- M03.4: 97/97 pruebas y build Vite 7.3.6 verdes.
- M04.1: run `31451142252`; 102/102 pruebas.
- M04.2: run `31453249710`; 107/107 pruebas.
- M04.3: run `31454024650`; 112/112 pruebas.
- M04.4: run `31454811218`; 120/120 pruebas.
- M04.5: PR #11 / run `31455514122`; lint, typecheck, 32 archivos / 132 pruebas, contraste AA de seis variantes y build Vite 7.3.6 verdes.
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
