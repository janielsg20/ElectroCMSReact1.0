# Motor del editor

Estado: motor interactivo planificado para F04–F07; modelo estructural subyacente aceptado en M02.2.

- Command bus reversible como única vía de mutación del documento.
- Renderer incremental del árbol canónico.
- Selección simple/múltiple, clipboard, historial, zoom y viewport.
- Drag/drop con alternativas por clic y teclado.
- Shell adaptativo definido en `UI_UX_LAYOUT_SYSTEM.md`.
- Documento normalizado, slots, componentes globales y overrides responsive definidos en `src/domain/project/`; todavía no existe edición visual de estos contratos.
- Ninguna acción se marca completa sin persistencia, undo/redo y pruebas.
