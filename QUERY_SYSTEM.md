# Query System — ElectroCMS

Actualizado: 2026-08-12.

## Alcance

M10.1 formaliza el AST de consultas ya anticipado en `CmsBackend.queries` y añade un ejecutor local determinista. No crea un segundo modelo de consultas ni introduce estado de UI en el dominio.

## Contrato canónico

La fuente de verdad continúa siendo `QuerySchema`:

- `id`, `name`, `contentTypeId`.
- `groups`: grupos de predicados.
- `sorts`: ordenamientos por campo o campo de sistema.
- `limit`, `offset`, `pageSize`.

Cada grupo usa:

- `all`: AND entre sus predicados.
- `any`: OR entre sus predicados.

Los grupos de una consulta se combinan con AND. Una consulta sin grupos selecciona todos los registros del CPT antes de ordenar/paginar.

## Fuentes de predicado

- `status`: `ContentRecord.status`.
- `author`: `ContentRecord.authorId`.
- `field`: `ContentRecord.values[fieldId]`; el campo debe pertenecer al CPT consultado.
- `taxonomy`: términos asignados al registro para la taxonomía seleccionada; la taxonomía debe estar asociada al CPT.
- `date`: por defecto `createdAt`; admite `{ field: 'createdAt' | 'updatedAt', value: ... }` para elegir fecha del sistema explícitamente.
- `relation`: IDs de registros conectados mediante `RelationEntry`; la orientación se deduce usando el CPT origen/destino de la relación.
- `repeater`: valor del repeater completo o extracción por filas con `{ path: string[], value: ... }`.

## Operadores

Se reutilizan los operadores del schema existente:

- `equals`, `not-equals`
- `contains`
- `in`, `not-in`
- `greater-than`, `greater-or-equal`
- `less-than`, `less-or-equal`
- `between`
- `exists`

`in/not-in` requieren un array. `between` requiere exactamente dos límites. Los operadores sobre taxonomías, relaciones y repeaters usan semántica de pertenencia de colección cuando corresponde.

## Orden determinista

Cada `QuerySort` debe elegir exactamente uno:

- `fieldId`, o
- `systemField`: `createdAt | updatedAt | status | id`.

Los campos de orden deben pertenecer al CPT y ser escalares. Tipos complejos como gallery, map, relation, taxonomy, repeater y group no se aceptan como criterio de orden.

Los valores nulos/ausentes quedan al final. Si todos los criterios empatan se usa `ContentRecord.id` como desempate léxico, sin `localeCompare`, para mantener el mismo resultado entre runtimes.

## Paginación

El pipeline es:

1. limitar al `contentTypeId` de la consulta;
2. evaluar grupos/predicados;
3. ordenar;
4. calcular `totalMatched`;
5. aplicar `offset` y `limit`.

`pageSize` se conserva como metadato canónico para las capas de listing/preview de M10.2–M10.3 y no altera por sí solo el corte de resultados en M10.1.

## API de dominio

`query-engine.ts` exporta:

- `validateQueryDefinition(cms, input)`
- `executeCmsQuery(cms, input)`
- `executeSavedCmsQuery(cms, queryId)`

La ejecución nunca muta `CmsBackend` ni `ProjectStructure`.

## Diagnósticos

- `query-not-found`
- `invalid-query`
- `missing-content-type`
- `invalid-predicate`
- `invalid-sort`

Se diagnostican referencias incompatibles, campos ajenos al CPT, repeaters mal tipados, taxonomías/relaciones desconectadas, IDs auxiliares usados por una fuente incorrecta y formas inválidas de operadores.

## Integridad y persistencia

`CmsBackend.queries` sigue siendo la colección persistente de consultas guardadas. M10.2 deberá validar con `validateQueryDefinition` antes de persistir cualquier edición y ejecutar todas las mutaciones mediante `ProjectStructureCommand` + `ProjectCommandBus`, conservando IndexedDB y undo/redo.

No se permiten queries globales dentro de `Capas`. El constructor visual pertenece al workspace global `Contenido`.

## Cobertura M10.1

`src/domain/project/query-engine.test.ts` cubre:

- AND entre grupos y OR dentro de grupo;
- campos y taxonomías;
- autor;
- createdAt/updatedAt y `between`;
- relaciones;
- repeaters con extracción por ruta;
- orden estable;
- offset/limit;
- validación semántica;
- consultas guardadas por `QueryId`.

Puerta M10.1: GitHub Actions `31561625115`.

- 80 archivos de prueba verdes.
- 339 pruebas verdes.
- lint verde.
- typecheck verde.
- build Vite verde.
- Chromium browser audit verde.
- sin overflow horizontal, excepciones Runtime ni errores/warnings de consola detectados por el audit.
