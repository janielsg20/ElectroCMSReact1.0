# Persistencia local-first

Estado: `M03.1 — Repositorios locales`, `M03.2 — Ciclo de proyecto`, `M03.3 — Guardado incremental y recuperación` y `M03.4 — Command bus e historial` aceptadas. F03 completada.

## Contrato M03.1

El puerto `LocalRepository` vive en `src/application/ports/local-repository.ts`. Expone búsqueda, listado, listado indexado por versión, guardado simple o por lote, eliminación y cierre. Todas las operaciones asíncronas devuelven `Result`; una excepción de IndexedDB no atraviesa el límite de infraestructura.

Errores públicos:

- `quota-exceeded`: la escritura fue revertida y puede recuperarse liberando espacio o exportando datos.
- `corrupt-data`: huella, JSON, schema, ID o versión no coinciden; el contenido no se devuelve como válido.
- `closed`: la conexión fue cerrada y debe reabrirse explícitamente.
- `unavailable`: IndexedDB no está soportado o disponible.
- `storage-failure`: fallo recuperable no clasificado, sin afirmar que la escritura se completó.

## Adaptador IndexedDB

`ElectroCmsLocalDatabase` usa Dexie sobre IndexedDB. La tabla `records` tiene clave primaria compuesta `[namespace+id]` e índices por namespace, `[namespace+schemaVersion]` y fecha de actualización. Los namespaces evitan colisiones entre futuros repositorios de proyectos, assets, historial u otros agregados.

`IndexedDbRepository` valida y serializa canónicamente antes de abrir la transacción. `saveMany()` prepara todos los registros y ejecuta un único `bulkPut` dentro de una transacción `rw`; cualquier error aborta el lote completo. Las lecturas verifican huella de integridad, schema, ID y versión antes de devolver una entidad.

La huella actual detecta alteraciones accidentales del registro local; no es una firma criptográfica ni sustituye la comprobación de paquetes exportados prevista en F14/F17.

## Pruebas de salida

- CRUD y consulta mediante el índice compuesto de versión.
- Persistencia tras cerrar una conexión y abrir una instancia nueva sobre la misma base.
- `QuotaExceededError` tipado y rollback total de una escritura por lote.
- Alteración directa detectada sin devolver contenido corrupto.
- Conexión cerrada distinguible de un fallo genérico.

Las pruebas Node usan `fake-indexeddb` como implementación aislada de la API. Producción usa IndexedDB real del navegador; no incluye ese paquete en el bundle de runtime.

## Contrato M03.2

`ProjectRecord` envuelve el envelope portable con un estado local estricto: `active`, `archived` o `trashed`. La papelera conserva `restoreState`, `trashedAt` y, cuando corresponde, `archivedAt`; combinaciones incoherentes se rechazan por schema.

`ProjectLifecycleService` implementa:

- Crear con ID y timestamps inyectados, revisión cero, nombre y payload validados.
- Duplicar con nueva identidad, fechas nuevas, revisión cero y copia independiente de metadata/payload.
- Renombrar y archivar incrementando revisión.
- Eliminar mediante papelera recuperable y restaurar al estado activo o archivado anterior.
- Exportar el envelope canónico sin estado local de catálogo.
- Importar v0/v1 mediante el registry de migraciones, siempre como activo.
- Rechazar conflictos de ID o importarlos como duplicado con identidad nueva; nunca sobrescribir silenciosamente.
- Propagar fallos del repositorio como errores tipados sin afirmar éxito.

La factoría `createProjectRecordRepository()` conecta el schema de `ProjectRecord` con el namespace IndexedDB `projects`. Una prueba de integración crea un proyecto y lo recupera desde una conexión nueva.

## Contrato M03.3

`ProjectRecoveryState` persiste por proyecto en el namespace `project-recovery`:

- Snapshots completos del último estado válido, con ID, revisión y timestamp.
- Journal versionado con revisión base, revisión objetivo, target validado y estado `pending`, `committed`, `recovered` o `superseded`.
- Límites configurables para snapshots y entradas finalizadas; una entrada pendiente nunca se elimina por poda.

El protocolo de `ProjectAutosaveService.save()` es:

1. Validar proyecto activo y revisión consecutiva.
2. Persistir snapshot y journal pendiente.
3. Guardar el nuevo `ProjectRecord` mediante la transacción del repositorio.
4. Marcar el journal como confirmado.

Si el paso 3 falla, el proyecto anterior permanece intacto y el journal permite reintentar. Si falla el paso 4, el guardado se reporta como completado con reconciliación pendiente. `recover()` distingue estos casos, reaplica secuencias pendientes, reconcilia commits ya escritos, descarta entradas superadas y nunca sobrescribe una revisión incompatible.

Si la lectura del proyecto detecta corrupción, se restaura el snapshot válido más reciente y se reaplican journals confirmados posteriores. La prueba de integración cierra IndexedDB con una entrada pendiente, abre una conexión nueva y recupera la revisión objetivo.

`DebouncedProjectAutosave` sustituye cambios pendientes durante la ventana configurable, guarda solo el último y permite `flush()` o `cancel()` explícitos. Todavía no conecta eventos de la UI anticipada; esa integración pertenece a las fases funcionales del editor.

## Contrato M03.4

`ProjectHistoryState` persiste por `projectId` en el namespace IndexedDB `project-history`. El schema v1 conserva entradas reversibles con estado `before`/`after`, etiqueta, IDs de los comandos que componen la operación, cursor aplicado y una operación pendiente recuperable.

`ProjectCommandBus` implementa el contrato de ADR-003 sin depender de React:

- `execute()` aplica un `ReversibleProjectCommand` puro, valida su salida y registra un único paso reversible.
- `CompositeProjectCommand` ejecuta varios comandos en memoria como una transacción lógica; si uno falla no se persiste ningún cambio parcial y, si todos pasan, se crea una sola entrada de historial.
- `undo()` restaura el extremo `before`; `redo()` restaura `after`. Ambos crean una revisión nueva (`current + 1`) en vez de retroceder el contador persistente.
- Ejecutar después de `undo` corta la cola de redo y crea una rama nueva determinista.
- `maxEntries` limita el historial conservando una cadena reversible coherente dentro de la ventana retenida.
- Cambios externos que ya no coinciden con el cursor producen `history-conflict`; nunca fuerzan una sobrescritura silenciosa.

Cada execute/undo/redo usa el protocolo preparar→proyecto→confirmar:

1. Persistir el historial con `pending`, cursor de origen y target completo.
2. Persistir el `ProjectRecord` objetivo.
3. Avanzar el cursor y limpiar `pending`.

Si falla el paso 2, `recover()` reaplica el target solo cuando el proyecto todavía coincide con el origen lógico. Si falla el paso 3, detecta que el proyecto ya coincide con el target y reconcilia únicamente el cursor. Cualquier tercer estado produce conflicto y queda sin sobrescribir.

La integración con `createProjectHistoryRepository()` fue probada cerrando y reabriendo IndexedDB: el cursor y las entradas sobreviven a la reapertura y `undo` sigue funcionando con revisión monotónica.

## Límites pendientes

- Conectar comandos concretos del árbol, canvas, inspector y workspaces pertenece a F04/F05/F07/F19; M03.4 entrega el contrato común, no implementaciones paralelas de UI.
- OPFS permanece detrás de un puerto futuro para blobs grandes; F03 no simula assets persistentes.
