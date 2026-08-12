# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- Microfase actual: `M09.5 — Binding dinámico`.
- Estado: `EN_CURSO`.
- F00–F08: `COMPLETADA`.
- `M09.1 — CPT`: `COMPLETADA`.
- `M09.2 — Taxonomías`: `COMPLETADA`.
- `M09.3 — Campos personalizados`: `COMPLETADA`.
- `M09.4 — Registros y relaciones`: `COMPLETADA`.
- `M09.5`: activa.
- F10–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.
- Auditoría extraordinaria F04/M04.1: `COMPLETADA` sin invalidar el cierre histórico de F04.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, autosave, recuperación y Command Bus/History |
| F04 | COMPLETADA | Shell responsive, workspace persistente y apariencia local |
| F05 | COMPLETADA | Árbol, renderer, DnD, manipulación directa, selección y viewport |
| F06 | COMPLETADA | Registro versionado, 115 widgets, adapters y biblioteca |
| F07 | COMPLETADA | Inspector, estilos, responsive, bindings, condiciones y ARIA |
| F08 | COMPLETADA | Temas, presets, plantillas y paquetes versionados |
| F09 | EN_CURSO | M09.1–M09.4 completadas; M09.5 Binding dinámico activa |
| F10–F18 | NO_INICIADA | Roadmap base restante |
| F19–F31 | NO_INICIADA | Paridad funcional ampliada |

## Cierre auditoría UI/UX F04/M04.1

- Drag/resize cancelable sin persistir interacciones incompletas.
- Coordenadas inválidas de puntero no producen CSS `NaN`.
- Apariencia del editor aislada de temas exportables.
- Toolbar del canvas en tres regiones y adaptada por container width.
- Eliminado estado inferior redundante del canvas.
- Popover de Apariencia compatible con bottom dock móvil.
- Biblioteca adaptada a panel estrecho sin solapamientos.
- `Documentos` puede mostrarse visualmente como `Docs` manteniendo el nombre accesible.
- Con `Datos`, la navegación usa cinco destinos y compactación por container query, no por viewport global.

## F08 completada

- M08.1 Tres ámbitos de tema: `COMPLETADA`.
- M08.2 Presets visuales: `COMPLETADA`.
- M08.3 Motor de plantillas: `COMPLETADA`.
- M08.4 Paquetes theme: `COMPLETADA`.
- Gate M08.4: run `31543564627`, lint/typecheck/suite/build verdes.

## Cierre M09.1 — CPT

- `ProjectStructure.cms` integra `CmsBackendSchema` de forma retrocompatible.
- `content-type-engine.ts` implementa CRUD con ID/slug únicos, capacidades, soportes, visibilidad, orden y Single/Archive compatibles.
- Borrado protegido por dependencias CMS.
- `ContentTypeSession` usa Command Bus + IndexedDB + undo/redo.
- UI: `Datos → Tipos`.
- Documento: `CONTENT_TYPE_SYSTEM.md`.
- Gate: run `31544864623`, lint/typecheck/suite/build verdes.

## Cierre M09.2 — Taxonomías

- `taxonomy-engine.ts` reutiliza `TaxonomySchema`/`TaxonomyTermSchema`.
- Asociaciones CPT↔taxonomía bidireccionales; Archive compatible; jerarquía sin ciclos.
- Borrado protegido por términos, campos, registros/queries cuando corresponda.
- `TaxonomySession` usa Command Bus + IndexedDB + undo/redo.
- UI: `Datos → Taxonomías`.
- Documento: `TAXONOMY_SYSTEM.md`.
- Gate: run `31546741841`, lint/typecheck, 304/304 pruebas y build verdes.

## Cierre M09.3 — Campos personalizados

- `custom-field-engine.ts` formaliza `FieldDefinitionSchema` sin crear schemas alternativos.
- CRUD para propietarios CPT y taxonomía; 27 tipos exigidos; defaults/options/conditions/hijos/relación/taxonomía/calculado/roles validados.
- `ContentType.fieldIds` / `Taxonomy.fieldIds` sincronizados.
- Borrado/cambio de tipo protegido por datos y dependencias; desde M09.4 también considera valores conservados en revisiones.
- `CustomFieldSession` usa Command Bus/IndexedDB/undo/redo.
- UI: `Datos → Campos`.
- Documento: `CUSTOM_FIELD_SYSTEM.md`.
- Gate: run `31548253008`, 73 archivos / 312 pruebas, lint/typecheck/build verdes.

## Cierre M09.4 — Registros y relaciones

### Dominio e integridad

- `record-relation-engine.ts` formaliza CRUD de `ContentRecord`, `Relation` y `RelationEntry`.
- Estados reales: draft/pending/published/private/archived.
- Los borradores pueden estar incompletos; al salir de draft se aplican required y validación de valores.
- Valores solo usan campos del CPT y términos compatibles con sus taxonomías.
- Slug/endpoints/cardinalidad de relaciones se validan contra `validateCmsBackend`.
- Registros conectados, relaciones con entries/campos/queries y cambios de cardinalidad incompatibles quedan bloqueados.
- `ContentRecordRevision` se añade como snapshot portable distinto del history global; `recordRevisions` es retrocompatible con default `{}`.
- Solo CPT con soporte `revisions` generan snapshots al editar; restaurar preserva antes la versión reemplazada.
- Campos y términos conservados únicamente dentro de revisiones quedan protegidos para no romper restauraciones futuras.

### Persistencia/UI

- `RecordRelationSession` está segregada del contrato base.
- La sesión genera timestamps/IDs de revisión y todas las mutaciones pasan por `ProjectStructureCommand` + `ProjectCommandBus` + IndexedDB.
- Integración cubre revisionado + undo/redo, relaciones y protección referencial.
- UI: `Datos → Registros y relaciones`; visualmente el tab exterior se compacta como `Reg.`.
- Subtabs internos: `Registros | Relaciones`.
- Registros permiten estado, campos, términos, revisiones/restauración y borrado protegido.
- Relaciones permiten CRUD y conectar/desconectar registros.
- No se muestran bindings de M09.5 como funcionales antes de su cierre.
- Documento: `RECORD_RELATION_SYSTEM.md`.

### Puerta M09.4

GitHub Actions run `31550664429`:

- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `76 archivos / 322 pruebas VERDES`.
- Build producción Vite 7.3.6: `VERDE`.
- Deploy producción: `SKIPPED` por PR draft.

## M09.5 — alcance activo

Objetivo exacto: conectar contenido a widgets y previsualizar estados vacío/error/loading.

Antes de cerrar F09 debe cubrir:

- Reutilizar `BindingSourceSchema`, `NodeDataSettings` y `resolveNodeDataState`; no crear otro DataProvider.
- Añadir una fuente de binding CMS canónica y serializable para registros/campos reales.
- Validar recordId/fieldId y compatibilidad con el CPT.
- Resolver valores hacia propiedades declaradas del widget usando el mismo inspector/renderer de F07.
- Distinguir estados de resolución `ready`, `empty` y `error`.
- Añadir preview local/transitorio de `loading`, `empty`, `error` sin falsear un backend remoto.
- Evolucionar la UI del Inspector desde JSON crudo hacia controles funcionales de contenido donde sea posible, manteniendo el editor avanzado JSON para el contrato completo.
- Mantener undo/redo de configuración de bindings por Command Bus.
- Tests de dominio, renderer, persistencia/UI y estados de preview.
- Gate lint + typecheck + suite + build.
- Después del gate técnico, ejecutar auditoría visual real de toda F09 en navegador, corregir hallazgos y repetir gate/auditoría antes de activar F10.

## Bloqueos

- Ninguno técnico conocido para M09.5.
- El modo `loading` será una simulación explícita de preview del editor, no una afirmación de I/O remoto inexistente.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde. Una fase tampoco se cerrará desde F09 en adelante sin auditoría visual en navegador de la aplicación compilada y corrección de inconsistencias UI/UX/layout detectadas.

## Documentos de control

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Memoria corta: `MEMORY.md`.
- Temas: `THEME_SYSTEM.md`.
- Paquetes: `THEME_PACKAGE_SYSTEM.md`.
- CPT: `CONTENT_TYPE_SYSTEM.md`.
- Taxonomías: `TAXONOMY_SYSTEM.md`.
- Campos: `CUSTOM_FIELD_SYSTEM.md`.
- Registros/relaciones: `RECORD_RELATION_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
