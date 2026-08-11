# Motor del editor

Estado: F04 y F05 completadas; M06.1–M06.3 completadas y `M06.4 — Comercio, formularios y filtros` activa.

- Command bus reversible como única vía de mutación del documento.
- Renderer incremental del árbol canónico implementado con snapshots por `NodeId`, `useSyncExternalStore`, resolución responsive validada una sola vez y error boundaries por nodo.
- Selección simple/múltiple, clipboard, historial, zoom y viewport.
- Drag/drop canónico con pointer/touch/teclado, autoscroll, indicadores y menú alternativo implementado.
- Resize y box spacing canónicos por breakpoint con handles, teclado, snapping, reglas, guías, breadcrumbs, menú contextual y comandos reversibles implementados.
- Selección simple compartida entre capas y canvas usa snapshots por nodo; el Selection Manager múltiple/formal continúa reservado a F19.
- Zoom/pan/fit, orientación, device frames y navegación de foco se persisten en `workspace.v1` y permanecen separados del documento.
- El panel de capas y el canvas comparten `EditorProjectSession`/`ProjectStructureRenderStore`; movimientos persisten por el Command Bus.
- Shell adaptativo definido en `UI_UX_LAYOUT_SYSTEM.md`.
- Documento normalizado, slots, componentes globales y overrides responsive definidos en `src/domain/project/`; `CanvasPreview` ya renderiza esos contratos y no conserva un documento visual paralelo.
- El renderer canónico consulta el `WidgetRegistry` público y resuelve adapters React externos; el switch provisional solo conserva familias pendientes de M06.4.
- Ninguna acción se marca completa sin persistencia, undo/redo y pruebas.
