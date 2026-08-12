# F10 — Query, Listing y Smart Filters

Actualizado: 2026-08-12.

## Estado

`F10 — Consultas, listings y filtros`: `COMPLETADA`.

Puerta final reproducible: GitHub Actions run `31608617420`, head `02c99a54d6536535159a3fcbc857c9e131fb3904`.

## Fuente de verdad

`ProjectStructure.cms.queries` es la única colección persistente de consultas. El builder, listings y filtros no mantienen una segunda definición de query.

- Persistencia: `ProjectStructureCommand` + `ProjectCommandBus` + IndexedDB + undo/redo.
- Validación: `validateQueryDefinition`.
- Ejecución: `executeCmsQuery`.
- CRUD de consultas guardadas: `query-definition-engine.ts`.
- El runtime React consume estos contratos y no replica la semántica de filtrado.

## M10.1 — Query Engine

`QuerySchema` soporta grupos AND/OR, predicados por status, field, taxonomy, author, date, relation y repeater; orden por campos escalares o sistema; limit, offset y pageSize.

El motor es puro y determinista. El filtrado y orden ocurren antes de offset/limit y se conserva `totalMatched`. Las referencias incompatibles se diagnostican antes de ejecutar.

## M10.2 — Builder y preview

`Contenido → Consultas` permite crear, editar y eliminar queries guardadas con edición accesible y diagnóstico inline. El preview ejecuta `executeCmsQuery`, por lo que builder y runtime comparten exactamente la misma semántica.

Las colecciones grandes usan una ventana virtualizada de resultados. No se insertan registros ficticios para simular resultados.

## M10.3 — Listings

`executeCmsListing` y `executeCmsListingQuery` dividen la ventana canónica de la query para presentación sin mutar la consulta guardada.

`ListingGridRuntime` repite la plantilla del listing por cada registro y usa `ListingRecordProvider` para resolver bindings en contexto. Los estados empty/error y la paginación son accesibles.

Cada página del listing ejecuta el Query Engine una sola vez y pagina el resultado de esa ejecución; no se recalcula la misma query para obtener metadatos separados.

## M10.4 — Smart Filters

Los once widgets de filtros del catálogo tienen runtime funcional:

- búsqueda;
- selector;
- rango;
- checkboxes;
- radio;
- fecha;
- taxonomía;
- ordenamiento;
- paginación;
- carga progresiva;
- reset.

`smart-filter-engine.ts` compone una `Query` transitoria a partir de la query guardada. El resultado puede ejecutarse en tiempo real o mediante botón Aplicar y nunca modifica `cms.queries`.

El store de filtros comparte estado con listings, conserva estado mediante URL/localStorage cuando corresponde, publica contador de resultados y reinicia paginación cuando cambia el filtro.

Los controles visibles usan la gramática ElectroCMS y mantienen alternativas accesibles; la experiencia principal no depende de la apariencia nativa del sistema operativo.

## M10.5 — Composición y rendimiento

### Debounce y cancelación

Cada filtro realtime puede programar una actualización con debounce. Un nuevo valor cancela el anterior y Apply/Reset cancelan tareas pendientes antes de aplicar el nuevo estado.

### Caché

`listing-runtime-cache.ts` mantiene una caché LRU efímera. La identidad del `CmsBackend` forma parte de la validez: al cambiar el backend, el resultado previo no puede reutilizarse como si siguiera vigente.

La caché es aceleración de runtime, no estado del proyecto y nunca se persiste.

### Índice

`query-index.ts` construye índices transitorios seguros para reducir candidatos por CPT, status, autor, igualdad escalar y taxonomía cuando la forma de la query permite hacerlo sin cambiar significado.

El índice solamente reduce el conjunto candidato. `queryMatches`/Query Engine continúan siendo la autoridad final, por lo que un índice incompleto o no aplicable degrada a evaluación normal y no a resultados distintos.

Las métricas exponen registros fuente, candidatos e índice utilizado para poder medir la optimización.

### Code splitting

Los gestores CMS globales se cargan con `React.lazy` + `Suspense`. Vite separa además runtime React, schema runtime, DnD, almacenamiento y catálogo.

En la puerta final el entry principal es `372.23 kB` (`98.82 kB gzip`) y no existe warning de chunk >500 kB. Los gestores CMS lazy quedan aproximadamente entre 12 y 25 kB cada uno.

## Accesibilidad y responsive

El audit Chromium cubre desktop, tablet, móvil portrait/landscape y módulos CMS. El CI contiene una aserción adicional (`scripts/assert-browser-audit.mjs`) que falla si cualquier estado touch auditado expone un target menor de 44×44 CSS px.

Esto permite conservar High Density en escritorio (~36 px) sin sacrificar targets táctiles.

## Puerta final F10

Run `31608617420`:

- lint: verde;
- typecheck: verde;
- 88 archivos / 364 pruebas: verdes;
- build: verde;
- browser audit: verde, 14 estados;
- horizontal overflow: 0;
- targets touch <44×44: 0;
- architecture errors: 0;
- runtime exceptions: 0;
- warnings/errors de consola de la app: 0;
- entry: 372.23 kB, sin warning >500 kB;
- Cloudflare PR preview: verde;
- producción: omitida por PR draft.

## Regla para fases posteriores

F11 puede reutilizar consultas/listings/filtros como fuentes o destinos cuando su microfase lo autorice, pero no debe crear otro Query Engine, otro store global de filtros ni persistir cachés/índices como parte del proyecto.
