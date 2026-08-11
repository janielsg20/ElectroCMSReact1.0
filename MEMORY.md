# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-11.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual, lógica/estado/datos visuales y exportadores Local, React, LAMP y WordPress.

## Alcance normativo

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Ampliación funcional tipo FlutterFlow: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- FlutterFlow se usa como referencia de capacidades y flujos profesionales, no como fuente de código/branding/activos propietarios.
- Toda capacidad faltante del Addendum se registra como `PARITY_GAP` y se implementa solo en su fase propietaria.

## Estado real

- React 19 + TypeScript estricto + Tailwind 4 + Vite + PWA local-first.
- F00–F04 completadas.
- F03 dejó repositorios locales, autosave/recovery y `ProjectCommandBus`/history persistente.
- F04 cerró shell responsive, workspace persistente y apariencia; las rutas/módulos aspiracionales y la command palette se retiraron por integridad de alcance.
- F05 completada.
- `M05.1 — Operaciones del árbol`: `COMPLETADA`.
- `M05.2 — Canvas y renderer`: `COMPLETADA` con puerta local de 156 pruebas.
- `M05.3 — Drag/drop y alternativas accesibles`: `COMPLETADA` con puerta local de 162 pruebas.
- `M05.4 — Direct manipulation`: `COMPLETADA` con puerta local de 169 pruebas.
- `M05.5 — Selección, zoom y viewport`: `COMPLETADA` con puerta local de 175 pruebas.
- Fase activa: `F06 — Registro de widgets y biblioteca`; `M06.1 — Contrato de widget` `COMPLETADA`.
- `M06.2 — Estructurales y básicos`: `COMPLETADA` con puerta local de 188 pruebas.
- `M06.3 — Contenido y dinámicos`: `COMPLETADA` con puerta local de 197 pruebas.
- `M06.4 — Comercio, formularios y filtros`: `COMPLETADA` con puerta local de 206 pruebas.
- Microfase actual: `M06.5 — UX de biblioteca` `EN_CURSO`.
- F07–F18 siguen `NO_INICIADA`; F19–F31 continúan `NO_INICIADA`.

## Decisiones vigentes

- Núcleo web local-first/PWA; dominio/modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación deben compartir una sola fuente de verdad.
- Toda mutación relevante de F05 usa `ProjectCommandBus`/`ProjectHistoryState`; prohibido crear otro history.
- El árbol funcional vive en `ProjectStructure`; la UI nunca mantiene un árbol paralelo como fuente de verdad.
- `tree-operations.ts` valida cada mutación con `validateProjectStructure` antes de devolverla.
- Selección múltiple de M05.1 es solo un input de operaciones; no sustituye el Selection Manager formal reservado para F19.
- `hidden` es estado base canónico del nodo con default `false`; overrides responsive pueden sobrescribirlo.
- Copy/paste/duplicate profundo debe remapear IDs, slots y referencias internas `node-property`.
- Nodos bloqueados no pueden moverse ni recibir hijos mediante operaciones estructurales hasta desbloquearse.
- Undo/redo restaura estados lógicos anteriores creando revisiones nuevas; la revisión persistente nunca retrocede.
- `workspace.v1` y `appearance.v1` son preferencias locales de UI, no datos del proyecto.
- No crear implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History o Export.

## UI/UX vigente

- Dirección visual: High Density + Minimal Clean + builder/IDE profesional.
- Desktop, tablet y móvil formalizados por F04.
- La navegación principal expone solo el Editor; no se muestran módulos, rutas ni comandos de áreas no implementadas.
- Presets `Studio / Bento Motion / Flow Builder`; modos `Claro / Oscuro / Automático` mediante `appearance.v1`.
- Contraste WCAG AA automatizado para los tres presets en claro/oscuro.
- Árbol, canvas, selección simple, resize, espaciado y history ya consumen la sesión canónica; zoom/pan/viewport continúa activo en M05.5.

## M05.1 — contrato implementado

- `src/domain/project/tree-operations.ts`: insert, move, nest, group, copy, paste, duplicate, lock, hide y rename.
- `TreeOwner` permite operar documentos o componentes globales mediante el mismo motor.
- `NodePlacement` representa raíz o `parentId + slot + index`.
- Move/nest rechazan ciclos obvios, destinos inválidos y locked state antes del validator global.
- Group requiere hermanos, preserva orden e inserta el grupo donde estaba el primer seleccionado.
- Copy genera `TreeClipboard` serializable; paste/duplicate crea IDs nuevos y remapea referencias internas.
- `ProjectStructureCommand` implementa `ReversibleProjectCommand<ProjectStructure>` y usa el bus de F03.
- Tests nuevos: 13 de operaciones de árbol + 3 de integración Command Bus.
- Evidencia: PR #12 / run `31456269215`, 34 archivos / 150 pruebas, lint/typecheck/build Vite 7.3.6 verdes.

## M05.2 — contrato implementado

- `CanonicalProjectRenderer` consume documentos, slots y componentes globales directamente desde `ProjectStructure`.
- `ProjectStructureRenderStore` usa snapshots por nodo y `useSyncExternalStore`; un cambio local no repinta ancestros ni hermanos.
- Reemplazos inválidos se rechazan sin alterar el snapshot vigente.
- `resolveValidatedNodeResponsiveState` evita validación global repetida durante render incremental.
- `hidden`, `locked`, orden y herencia responsive están cubiertos por tests.
- Cada nodo tiene error boundary recuperable e independiente.
- `CanvasPreview` usa una estructura inicial canónica mínima; no mantiene HTML de documento paralelo ni datos de demo.
- El adapter visual mínimo no sustituye el Widget Registry formal de F06.
- Evidencia local: lint, typecheck, 35 archivos / 156 pruebas y build Vite 7.3.6 verdes.

## M05.3 — contrato implementado

- `CanonicalLayerTree` deriva el árbol visible de `ProjectStructure`; eliminado `layerItems` como fuente paralela.
- Sensores DnD: pointer con umbral 4 px, touch con delay/tolerancia y teclado con coordenadas sortable.
- DnD incluye autoscroll, anuncios accesibles e indicador de inserción antes/después.
- El menú alternativo permite mover a un destino antes, después o dentro sin drag.
- `EditorProjectSession` comparte el mismo render store entre árbol y canvas.
- `BrowserEditorProjectSession` persiste en IndexedDB y ejecuta `moveNodes` exclusivamente mediante `ProjectStructureCommand` + `ProjectCommandBus`.
- Los movimientos hacia delante en el mismo contenedor corrigen el índice después de retirar el origen.
- Evidencia local: lint, typecheck, 36 archivos / 162 pruebas y build Vite 7.3.6 verdes.

## M05.4 — contrato implementado

- Tamaño, padding y margen se guardan como estilos canónicos por breakpoint; el DOM solo aporta el tamaño inicial de una interacción.
- Resize dispone de cuatro handles, pointer/touch, flechas en pasos de 8 px y `Shift` en pasos de 32 px.
- Snapping prioriza guías cercanas y usa una retícula de 8 px; reglas y guías quedan contenidas dentro del canvas.
- El menú contextual ofrece tamaño y espaciado completos sin arrastrar; nodos locked rechazan toda mutación.
- Selección simple compartida sincroniza árbol, canvas y breadcrumbs sin reemplazar el Selection Manager formal de F19.
- Suscripciones booleanas por nodo evitan repintar todos los frames al cambiar la selección.
- Undo/redo del header publica de nuevo el estado persistido mediante el mismo `ProjectCommandBus`.
- Evidencia local: lint, typecheck, 38 archivos / 169 pruebas, build Vite 7.3.6 y `git diff --check` verdes.

## M05.5 — contrato implementado

- Zoom 25–200 %, pan acotado ±2000 px, fit-to-screen, select/pan tools y orientación forman parte de `workspace.v1`, no del documento.
- `workspace.v1` restaura canvas y viewport y migra registros anteriores mediante defaults seguros.
- Device frames móvil/tablet alternan portrait/landscape; desktop conserva su frame de trabajo.
- Pointer y flechas operan pan; `+`, `-` y `0` controlan zoom/fit.
- Controles visibles y `Alt+1/2/3` mueven foco entre Capas, Canvas e Inspector.
- El viewport es una región enfocada, con overflow bidimensional contenido y foco visible.
- Evidencia local: lint, typecheck, 40 archivos / 175 pruebas, build Vite 7.3.6 y `git diff --check` verdes.

## M06.1 — contrato implementado

- `WidgetDefinition` neutral a React declara schema/defaults, rendererId, inspector, icono, accesibilidad, migraciones y matriz de exportadores.
- `WidgetRegistry` rechaza IDs/versiones inválidos, defaults incompatibles, renderer/inspector ausentes, claves duplicadas, iconos inseguros, migraciones incompletas y registros duplicados.
- Exportadores `diagnostic-only` generan warning y `unsupported` error; nunca se omite compatibilidad.
- Evidencia local: lint, typecheck, 41 archivos / 179 pruebas, build Vite 7.3.6 y `git diff --check` verdes.

## M06.2 — contrato implementado

- 35 definiciones cubren exactamente 15 widgets estructurales y 20 básicos de la sección 9.
- Cada propiedad default dispone de control declarativo de inspector y valida con el schema de su definición.
- `ReactWidgetAdapterRegistry` vive fuera del dominio y exige adapter para cada `rendererId` registrado.
- El renderer canónico fusiona defaults + propiedades responsive, valida antes de renderizar y delega familias futuras al fallback.
- HTML se muestra como fuente segura; iframe/map aceptan solo destinos permitidos y mantienen sandbox.
- Evidencia local: lint, typecheck, 43 archivos / 188 pruebas, build Vite 7.3.6 y `git diff --check` verdes; entry 483.30 kB.

## M06.3 — contrato implementado

- 20 widgets de contenido y 14 dinámicos amplían el catálogo único hasta 69 definiciones.
- Cada propiedad dispone de inspector declarativo y todos los defaults validan contra su schema.
- Bindings, queries, relaciones, condiciones y cálculos solo muestran valores locales, fallbacks o estados vacíos; el preview no ejecuta runtimes futuros.
- `content.card` y `content.metric` ya se resuelven por registro y fueron retirados del fallback provisional.
- El catálogo/adapters vive en un chunk de 130.36 kB y el entry principal queda en 379.66 kB.
- Evidencia local: lint, typecheck, 45 archivos / 197 pruebas, build Vite 7.3.6 y `git diff --check` verdes.

## M06.4 — contrato implementado

- 15 widgets de comercio, 20 de formularios y 11 filtros elevan el catálogo acumulado a 115 definiciones.
- Acciones sensibles dependientes de runtime son `diagnostic-only` para LAMP/WordPress y nunca se simulan en preview.
- Controles HTML nativos cubren entradas y filtros; submit remoto se previene y acciones sin destino aparecen deshabilitadas.
- `widget-catalog` pesa 153.39 kB y el entry continúa en 379.66 kB.
- Evidencia local: lint, typecheck, 47 archivos / 206 pruebas, build Vite 7.3.6 y `git diff --check` verdes.

## Ajuste de alcance vigente en M06.5

- La UI debe reflejar solo funciones implementadas y verificables; no se conservan placeholders, botones inertes ni superficies de fases futuras.
- Eliminadas `ProductDemoView`, `product-demo-data`, navegación multi-módulo, rutas profundas, command palette, páginas ficticias y controles Run/preview/IA.
- El starter real es `Proyecto local / Página inicial`; la sesión usa IndexedDB `electrocms-editor-project-v2` para no restaurar el antiguo contenido ficticio.
- La biblioteca muestra y busca las 115 definiciones reales como catálogo de solo lectura. Insertar, favoritos, recientes, filtros y guardados siguen pendientes de M06.5.
- El inspector es de solo lectura sobre el nodo canónico; tamaño y espaciado continúan editándose mediante direct manipulation y Command Bus.
- El dock móvil contiene únicamente Widgets, Capas, Canvas e Inspector.
- Evidencia local del ajuste: lint, typecheck, 46 archivos / 200 pruebas, build Vite 7.3.6 y `git diff --check` verdes; entry 316.13 kB.

## Roadmap ampliado F19–F31

- F19: Visual Builder avanzado, Selection Manager, Pages/Tree/Canvas/Workspace/mobile builder.
- F20: Component System, Component Studio y Design System.
- F21: Data Types, State, Variables y condiciones.
- F22: Action Flow/Graph y App Events.
- F23: Database Builder y Backend Queries.
- F24: API Manager/Tester/Mapping.
- F25: Authentication/RBAC/Security.
- F26: Media/Routing/Storyboard/Responsive/Localization/SEO.
- F27: Custom Code/Dependencies/Environments/Integrations.
- F28: Test Mode/Debug/Automated Tests.
- F29: Versioning/Branching/Collaboration.
- F30: AI Builder/Agents/Command Palette avanzado.
- F31: Export ampliado/Deployment/Production validation.

## Próximo paso exacto

Continuar `M06.5 — UX de biblioteca` sobre el catálogo real de 115 definiciones ya conectado.

Cubrir búsqueda, categorías, filtros, favoritos, recientes, miniaturas, guardados e inserción click/drag antes de cerrar F06.

## Riesgos abiertos

- M06.5 debe insertar mediante el Command Bus y no crear una lista UI paralela al `WidgetRegistry`.
- Los adapters de preview y exportación deben resolver las mismas definiciones registradas.
- Collaboration/AI/integraciones remotas deben mantener funcionamiento local completo.
- Secrets nunca deben aparecer en frontend, logs o exports.

## Evidencia técnica base conservada

- M04.1: 102/102 pruebas.
- M04.2: 107/107 pruebas.
- M04.3: 112/112 pruebas.
- M04.4: 120/120 pruebas.
- M04.5: 132/132 pruebas.
- M05.1: 150/150 pruebas, lint/typecheck/build verdes.
- M05.2: 156/156 pruebas, lint/typecheck/build verdes localmente.
- M05.3: 162/162 pruebas, lint/typecheck/build verdes localmente.
- M05.4: 169/169 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
- M05.5: 175/175 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
- M06.1: 179/179 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
- M06.2: 188/188 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
- M06.3: 197/197 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
- M06.4: 206/206 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
- Ajuste de alcance M06.5: 200/200 pruebas, lint/typecheck/build y `git diff --check` verdes localmente.
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
