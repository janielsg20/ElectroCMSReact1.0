# Motor responsive

Estado: `M07.4 — Motor de breakpoints` completada.

## Fuente canónica

- `ProjectStructure.breakpoints` es la única lista de breakpoints del proyecto.
- Cada breakpoint contiene ID nominal, nombre, ancho entero entre 240–10000 px, orientación y padre opcional.
- La herencia se resuelve por IDs; padres inexistentes, autoreferencias y ciclos se rechazan antes de persistir.
- El orden del array es editable y no altera IDs ni overrides existentes.

## Mutaciones

- `breakpoint-engine.ts` implementa crear, editar, reordenar y restablecer el override de un nodo.
- Toda salida se valida con `validateProjectStructure` y conserva inmutabilidad.
- `BrowserEditorProjectSession` ejecuta cada operación mediante `ProjectStructureCommand` + `ProjectCommandBus`.
- Reset elimina únicamente `node.responsive[breakpointId]`; la base y la cadena heredada permanecen intactas.
- Nodos locked rechazan el reset responsive.

## Preview y preferencias

- El canvas selecciona cualquier ID real del proyecto; los accesos Desktop/Tablet/Móvil son atajos hacia perfiles existentes.
- El frame usa el ancho exacto del breakpoint activo y un aspecto vertical/horizontal de preview.
- `workspace.v1` persiste `breakpointId` y orientación de preview; no duplica la definición del proyecto.
- Seleccionar un breakpoint adopta su orientación declarada cuando no es `any`; rotar el frame solo cambia la preferencia local.

## Accesibilidad y pruebas

- El administrador usa controles nativos, orden alternativo por botones, diálogo con Escape, trampa de foco y restauración al disparador.
- Crear, editar, reordenar y resetear disponen de pruebas puras, UI e integración IndexedDB/undo.
