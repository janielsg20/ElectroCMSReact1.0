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
- `M04.1 — Shell desktop`: completada con persistencia local versionada del workspace, restauración segura y orden de paneles.
- `M04.2 — Shell tablet`: completada con rail contraído, canvas prioritario, un panel persistente y overlay secundario accesible/efímero.
- `M04.3 — Shell móvil`: completada con canvas prioritario, bottom dock de cinco destinos, sheets accesibles, safe areas y transición limpia a tablet.
- `M04.4 — Navegación, rutas y shortcuts`: completada con deep links hash, history/popstate, command palette, shortcuts y preservación del workspace.
- Microfase actual: `M04.5 — Temas del editor` `EN_CURSO`.
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
- Preferencias del workspace son estado local de UI y no forman parte del modelo canónico del proyecto.
- Tablet reutiliza el shell desktop como base mediante `ResponsiveEditorShell`; su geometría de overlay no se persiste en `workspace.v1`.
- Móvil reutiliza el mismo `EditorShell`; `ResponsiveEditorShell` solo delimita breakpoint/transiciones y los panels temporales siguen siendo estado efímero de UI.
- `activeSection` continúa siendo la única selección visual de navegación; la URL `#/sección` la refleja mediante un adapter de historial, no mediante un segundo router/estado React.
- El historial del navegador conserva la misma instancia del shell y no reinicia `workspace.v1`.

## UI/UX vigente

- Dirección visual: High Density + Minimal Clean + builder/IDE profesional.
- Desktop: rail compacto, Page/Widget Tree, canvas central y Properties Panel; paneles docked/floating/minimized/pinned y resize.
- `workspace.v1` usa `localStorage` detrás de `WorkspacePreferencesStore`; persiste rail, anchuras, modo, dock, bounds, pin y orden de Biblioteca/Inspector.
- Preferencias inválidas/corruptas se ignoran; anchuras y ventanas restauradas se ajustan a límites y viewport actual.
- Tablet 768–1023: rail presentado a 44 px, canvas prioritario, un único panel contextual persistente y panel secundario como dialog lateral redimensionable; `Escape`, focus trap y restauración de foco están implementados.
- En tablet Biblioteca/Inspector pueden intercambiarse y el secundario puede fijarse como persistente sin crear dos paneles persistentes simultáneos.
- Móvil 320–767: Topbar compacta + Canvas + bottom navigation `Widgets / Páginas / Canvas / Props / Más`; paneles se presentan como sheets, con safe areas, `Escape`, foco/restauración y targets de 44 px.
- En móvil `Canvas` fuera del Editor abre la navegación de `Más` para evitar una acción muerta y permitir volver al módulo Editor.
- Navegación profunda: hashes `#/editor`, `#/dashboard`, `#/pages`, etc.; URL inválida cae en Editor.
- Command palette: launcher visible + `Ctrl/⌘+K`, búsqueda de módulos, flechas/Enter/Escape y restauración de foco.
- Shortcuts directos documentados: `Alt+Shift+E` Editor, `Alt+Shift+H` Inicio, `Alt+Shift+P` Páginas; no se disparan en campos editables.
- Contexto superior `Producto / sección` acompaña la ruta activa como breadcrumb visible.
- Desktop objetivo: controles/filas ~32–36 px, spacing 4–8 px, rail ~44 px; touch mantiene 44 px.
- Azul reservado principalmente para selección, foco, active y primary actions.
- WCAG 2.2 AA; drag/resize/reorder siempre con alternativa de teclado/clic.
- Auditoría correctiva 2026-08-10: selección del rail, páginas y árbol sigue estado real; dropdowns del Inspector usan controles nativos; alineación y vinculado de padding tienen estado; acciones futuras se muestran deshabilitadas en vez de aparentar funcionalidad.
- `src/ui-integrity-v11.css` actúa como guardrail cross-theme; la consolidación de capas CSS continúa de forma incremental al formalizar F04–F07/F19.

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

Implementar `M04.5 — Temas del editor`: separar modo de color `light/dark/system` de preset visual `Studio/Bento Motion/Flow Builder`, persistir preferencia de UI, responder a `prefers-color-scheme` en modo automático y validar contraste/densidad/responsive por preset.

No adelantar F05 ni F19 hasta cerrar M04.5 y F04 con evidencia reproducible.

## Riesgos abiertos

- La UI anticipada debe consolidarse gradualmente para evitar acumulación indefinida de CSS/overrides.
- M04.5 debe evitar mezclar nuevamente preset visual con modo de color; ambos son preferencias de UI distintas y deben compartir tokens semánticos.
- Collaboration/AI/integraciones remotas deben mantener funcionamiento local completo.
- Secrets nunca deben aparecer en frontend, logs o exports.
- Cada export target debe diagnosticar capacidades no soportadas; prohibida la pérdida silenciosa.

## Evidencia técnica base conservada

- CI/CD y Cloudflare Pages existen y han sido verificados en entregas previas.
- PWA offline, manifest y Service Worker están implementados.
- Modelo canónico v1, schemas Zod, migraciones v0→v1, breakpoints, CMS models y relaciones están implementados y probados.
- Dexie/IndexedDB, ProjectRecord, import/export, recovery journal y `project-history` están implementados y probados.
- M03.4: 97/97 pruebas y build Vite 7.3.6 verdes.
- M04.1: GitHub Actions run `31451142252`; lint, typecheck, 26 archivos de test / 102 pruebas y build Vite 7.3.6 verdes, sin avisos React de hidratación del workspace.
- M04.2: PR #8 / run `31453249710`; 27 archivos / 107 pruebas, lint/typecheck/build verdes.
- M04.3: PR #9 / run `31454024650`; 28 archivos / 112 pruebas, lint/typecheck/build verdes.
- M04.4: PR #10 / run `31454811218`; 30 archivos / 120 pruebas, lint/typecheck/build verdes; log final sin warnings React del flujo de navegación.
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
