# RECORD_RELATION_SYSTEM — M09.4

Estado: `COMPLETADA`.

## Objetivo

Formalizar registros de contenido, borradores, revisiones y relaciones sobre el mismo `ProjectStructure.cms`, sin crear almacenamiento o historial paralelo.

## Registros

La fuente canónica continúa siendo `ContentRecordSchema`.

- Estados: `draft`, `pending`, `published`, `private`, `archived`.
- Cada registro pertenece a un CPT existente.
- Autor opcional solo puede apuntar a un usuario canónico existente.
- Valores solo pueden usar campos pertenecientes al CPT.
- Términos solo pueden pertenecer a taxonomías asociadas al CPT.
- `createdAt` y `updatedAt` mantienen cronología válida.
- Un borrador puede permanecer incompleto; al salir de `draft` se aplican los campos `required`.
- `record-relation-engine.ts` refuerza tipos, opciones y límites de los valores antes de aceptar una mutación.

## Revisiones de contenido

Las revisiones de contenido son distintas del historial global de comandos.

- `ProjectHistoryState` sigue siendo exclusivamente el undo/redo local de operaciones del proyecto.
- `ContentRecordRevision` es un snapshot portable dentro de `CmsBackend`.
- `recordRevisions` es retrocompatible: proyectos anteriores sin la colección se normalizan a `{}`.
- Solo los CPT cuyo soporte incluye `revisions` generan revisión al editar.
- Restaurar una revisión conserva primero la versión reemplazada como nueva revisión.
- El snapshot mantiene ID del registro, estado, valores, taxonomías, autor y timestamps lógicos.
- Campos y términos que sobreviven únicamente dentro de una revisión quedan protegidos frente a borrado/cambio incompatible para que la restauración siga siendo posible.

## Relaciones

`RelationSchema` y `RelationEntrySchema` siguen siendo las únicas fuentes de verdad.

- Slug único por relación.
- Extremos source/target deben ser CPT existentes.
- Cardinalidades soportadas: `one-to-one`, `one-to-many`, `many-to-many`.
- Las entradas deben conectar registros cuyo CPT coincide con cada extremo.
- Pares duplicados se rechazan.
- El validador canónico aplica las restricciones de cardinalidad.
- Cambiar una relación se rechaza si las conexiones existentes quedarían inválidas.
- Eliminar una relación se bloquea si todavía existen entries, campos o consultas dependientes.
- Eliminar un registro se bloquea si participa en una relación.

## Persistencia e historial

La capacidad `RecordRelationSession` está segregada del contrato base del editor.

Todas las mutaciones persistentes usan:

`ProjectStructureCommand → ProjectCommandBus → IndexedDB → ProjectStructureRenderStore`

Los comandos `cms.*` cubren registros, restauración de revisiones, relaciones y entries. Los timestamps e IDs de revisión son generados por la sesión y no por React.

La integración prueba que una edición con revisión participa correctamente en undo/redo y que la integridad referencial permanece activa después de persistir.

## UI/UX

La superficie funcional vive en:

`Biblioteca → Datos → Registros y relaciones`

Dentro se separan dos tabs:

- `Registros`: selección de CPT, listado, alta/edición, estado, campos, taxonomías, revisiones, restauración y borrado protegido.
- `Relaciones`: CRUD de Relation y conexión/desconexión de registros.

Reglas visuales:

- High Density + Minimal Clean.
- Targets aproximados de 44 px en touch y 36 px en escritorio.
- Tab exterior accesible `Registros y relaciones`, visualmente compacto como `Reg.`.
- Subtabs internos `Registros | Relaciones` para mantener jerarquía semántica inequívoca.
- Confirmación de dos pasos para operaciones destructivas/restauraciones.
- `aria-live` para feedback de mutaciones.
- No se muestran bindings de M09.5 como si ya existieran.

## Validación

Gate de cierre M09.4: GitHub Actions run `31550664429`.

- Lint: verde.
- Typecheck: verde.
- Suite: **76 archivos / 322 pruebas verdes**.
- Build de producción: verde con Vite 7.3.6.
- Deploy producción: omitido por PR draft.

La advertencia de chunk principal >500 kB permanece como deuda de rendimiento para una fase propietaria; no invalida la corrección funcional de M09.4.
