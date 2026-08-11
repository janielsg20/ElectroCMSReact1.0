# Motor de plantillas

Estado: `M08.3` completada el 2026-08-11.

## Modelo canónico

`ProjectStructure.documents` conserva un único árbol por documento. Cada documento declara un `kind`: `page`, `template`, `header`, `footer`, `single`, `archive` o `not-found`.

- Una `page` puede tener `routePath` directo. Las rutas de página no se duplican.
- Los demás documentos no admiten ruta directa y usan una lista de `conditions` tipadas.
- Una condición declara `target` (`page`, `single`, `archive` o `not-found`) y opcionalmente `pathPrefix`, `contentType` y `priority`.
- Los componentes globales siguen siendo árboles independientes registrados en `globalComponents`; las instancias los referencian por ID y no copian nodos.

Los proyectos anteriores sin `routePath` siguen siendo válidos: simplemente no participan en la resolución por ruta hasta que se les asigne una ruta.

## Resolución determinista

`resolveTemplateComposition()` recibe `{ target, path, contentType? }` y devuelve `main`, `header` y `footer`.

1. Para `page`, se selecciona la página de ruta exacta.
2. Para `single`, `archive` y `not-found`, se comparan documentos del mismo tipo y `template`.
3. Header y footer se seleccionan de forma independiente.
4. Gana la mayor prioridad; después, la mayor especificidad (`contentType` y longitud de `pathPrefix`); el ID ordenado es el desempate estable.

No se ejecutan queries, contenido dinámico, rutas de aplicación ni exportadores en esta microfase; esos contratos pertenecen a F09, F10 y F14–F16.

## Mutaciones y UI

- `addDocument()` y `updateDocumentConditions()` validan toda la estructura antes de devolver el cambio.
- La sesión del editor envuelve ambas operaciones en `ProjectStructureCommand` y `ProjectCommandBus`; IndexedDB y undo/redo permanecen como única ruta persistente.
- La pestaña **Plantillas** permite crear los siete tipos y editar condiciones JSON con diagnóstico; no mantiene un árbol paralelo.

## Cobertura

Las pruebas verifican composición por ruta, prioridad/especificidad, operaciones, rutas duplicadas y undo de condiciones.
