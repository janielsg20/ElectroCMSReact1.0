# Sistema de inspector

Estado: F07 completada (`M07.1–M07.5`).

## Fuente declarativa

- `WidgetDefinition.inspector` es la única fuente de campos del inspector para widgets registrados.
- Cada descriptor define clave, etiqueta, control, sección, obligatoriedad y opciones.
- `generateInspectorSections` agrupa los descriptores en un orden estable: Contenido, Estilo, Layout, Responsive, Datos, Condiciones, Animaciones, Accesibilidad y Avanzado.
- El valor efectivo procede de `node.properties` cuando existe una clave propia; en caso contrario usa `definition.defaults`.
- La UI identifica explícitamente el origen `Nodo` o `Predeterminado`.

## M07.1 implementada

- Las nueve secciones se muestran como grupos nativos `details/summary`, con conteo y estados vacíos honestos.
- Cada campo muestra etiqueta, clave, tipo previsto, valor efectivo, opciones y obligatoriedad.
- Un widget sin definición registrada no genera controles ni datos ficticios.
- Estado canónico visible: hidden, locked, número de overrides responsive y estilos persistidos.
- El inspector mantiene targets táctiles, foco visible y overflow interno en desktop, tablet y móvil.

## M07.2 implementada

- `InspectorFieldControl` resuelve texto, textarea/JSON, número, booleano, select, color, asset y binding mediante controles nativos.
- Un formulario por campo acumula el draft y emite una sola mutación al aplicar; no crea historial por pulsación.
- `EditorProjectSession.updateWidgetProperty` valida el objeto efectivo completo con `propertySchema` antes de persistir.
- Errores de parseo/schema se muestran junto al campo con `role=alert`.
- Reset elimina el valor explícito y recupera el default; update/reset usan `setNodeProperties` mediante `ProjectStructureCommand` y `ProjectCommandBus`.
- Nodos locked y claves no declaradas rechazan edición.
- Integración IndexedDB cubre invalidación, persistencia, reset y undo.

## M07.3 implementada

- `CanonicalStyleControl` edita clases, declaraciones y estados estructurados dentro de Estilo.
- CSS libre, selectores y at-rules no se aceptan; cada valor pasa por el compilador seguro descrito en `STYLE_ENGINE.md`.
- Aplicar y resetear crea una sola mutación reversible; ancho, alto, margen y padding administrados por canvas se conservan.
- El renderer usa el mismo compilador neutral a React que consumirán los exportadores.

## M07.4 implementada

- Administrador canónico de breakpoints, orden, herencia, orientación, selección y reset; contrato en `RESPONSIVE_ENGINE.md`.

## M07.5 implementada

- `DataConditionAccessibilityControl` edita bindings, condiciones y ARIA como JSON estructurado validado.
- Fuentes, operadores, diagnóstico, visibilidad, atributos permitidos, persistencia y límites se documentan en `DATA_CONDITION_SYSTEM.md`.
- Cada aplicar/resetear crea una sola operación reversible.

## Límites conservados

- M07.1 es lectura declarativa; no renderiza inputs que aparenten editar sin persistir.
- Bindings y condiciones no ejecutan DataProvider, consultas, Action Flow ni integraciones remotas de fases futuras.
