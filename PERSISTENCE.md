# Persistencia local-first

Estado: `M03.1 — Repositorios locales` aceptada; ciclo de proyectos, autosave e historial pendientes de M03.2–M03.4.

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

## Límites pendientes

- M03.2 implementará crear, duplicar, renombrar, archivar, eliminar, recuperar, importar y exportar proyectos.
- M03.3 añadirá autosave, snapshots y journal contra fallos durante escritura.
- M03.4 añadirá command bus e historial persistente con undo/redo.
- OPFS permanece detrás de un puerto futuro para blobs grandes; M03.1 no simula assets persistentes.
