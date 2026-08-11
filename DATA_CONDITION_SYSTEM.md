# Datos, condiciones y accesibilidad

Estado: `M07.5 — Datos, condiciones y accesibilidad` completada.

## Contrato canónico

- `node.bindings` conecta una propiedad declarada con un literal, una ruta del proyecto o una propiedad de otro nodo.
- `node.conditions` contiene grupos `all/any`, negación y predicados tipados; todos los grupos deben cumplirse para mostrar el nodo.
- `node.accessibility` admite únicamente `label`, `description`, roles semánticos permitidos y `tabIndex` -1/0.
- El schema sigue siendo retrocompatible: `accessibility` es opcional y los proyectos previos continúan válidos.

## Resolución y seguridad

- `data-condition-engine.ts` resuelve bindings y visibilidad sin React ni dependencias de almacenamiento.
- Rutas `__proto__`, `constructor` y `prototype` se bloquean; valores no JSON y comparaciones incompatibles se rechazan.
- Una ruta ausente genera diagnóstico. Los diagnósticos de ejecución son fail-visible para no ocultar contenido por un contexto incompleto.
- `exists` puede evaluar una ruta ausente como falsa sin convertirla en fallo del renderer.
- La sesión impide bindings hacia propiedades no declaradas por el `WidgetDefinition`.
- No se ejecutan DataProvider, consultas, Action Flow, secretos ni llamadas remotas.

## Renderer e inspector

- `ProjectStructureRenderStore` combina propiedades responsive y bindings antes del adapter.
- Los nodos con condiciones falsas no se renderizan; cambios en nodos fuente invalidan los snapshots dinámicos dependientes.
- El frame canónico aplica ARIA permitida. El frame de edición conserva su semántica de selección para no romper la operación del editor.
- `DataConditionAccessibilityControl` edita los tres bloques como JSON estructurado, muestra diagnósticos y aplica/resetear en una sola mutación.

## Historial y evidencia

- Update/reset usan `ProjectStructureCommand` + `ProjectCommandBus`, persisten en IndexedDB y admiten undo/redo.
- Pruebas cubren fuentes, operadores, fail-visible, ARIA, reactividad entre nodos, UI, validación, persistencia, reset y undo.
