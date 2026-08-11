# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- Microfase actual: `M09.4 — Registros y relaciones`.
- Estado: `EN_CURSO`.
- F00–F08: `COMPLETADA`.
- `M09.1 — CPT`: `COMPLETADA`.
- `M09.2 — Taxonomías`: `COMPLETADA`.
- `M09.3 — Campos personalizados`: `COMPLETADA`.
- `M09.4–M09.5`: pendientes, con M09.4 activa.
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
| F09 | EN_CURSO | M09.1–M09.3 completadas; M09.4 Registros y relaciones activa |
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

### Dominio e integridad

- `custom-field-engine.ts` formaliza `FieldDefinitionSchema` sin crear schemas alternativos.
- CRUD para propietarios CPT y taxonomía con key única por propietario.
- 27 tipos exigidos: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map, relation, user, taxonomy, repeater, group, calculated y conditional.
- Validación de defaults por tipo, opciones únicas, condiciones del mismo propietario y roles existentes.
- group/repeater admiten hijos del mismo propietario y se benefician de la detección de ciclos de `validateCmsBackend`.
- relation solo referencia una Relation canónica existente y compatible; taxonomy solo una taxonomía existente/compatible; calculated exige expresión.
- Cambiar tipo queda bloqueado si existen valores almacenados.
- `ContentType.fieldIds` / `Taxonomy.fieldIds` se sincronizan con create/delete.
- Borrado protegido por valores, composición, condiciones, queries, formularios y permisos de rol.
- Cada candidato valida `CmsBackend` y después `ProjectStructure` completo.

### Persistencia/UI

- `CustomFieldSession` está segregada del contrato base.
- Comandos `cms.create-custom-field`, `cms.update-custom-field` y `cms.delete-custom-field` usan el mismo Command Bus/IndexedDB/history.
- Integración real cubre `create → update → undo → redo → delete → undo`.
- `Datos` ahora expone tabs secundarios `Tipos | Taxonomías | Campos` con tabpanels semánticamente `hidden` cuando están inactivos.
- UI estructurada por tipo: propietario, label/key, validación, opciones, hijos, relación/taxonomía, calculated, default, condiciones y roles.
- La UI no crea relaciones ni roles ficticios; remite honestamente a M09.4/F12.
- Registros y bindings siguen fuera hasta M09.4/M09.5.
- Documento: `CUSTOM_FIELD_SYSTEM.md`.

### Puerta M09.3

GitHub Actions run `31548253008`:

- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `73 archivos / 312 pruebas VERDES`.
- Build producción: `VERDE`.
- Deploy producción: `SKIPPED` por PR draft.

## M09.4 — alcance activo

Objetivo: CRUD de registros, validación, borradores, revisiones y relaciones con integridad referencial.

Antes de avanzar a M09.5 debe cubrir:

- CRUD canónico de `ContentRecord` con estados draft/pending/published/private/archived.
- Validación de valores contra los `FieldDefinition` reales del CPT, incluidos required, tipos, opciones y taxonomías.
- TaxonomyTermIds compatibles con las taxonomías asociadas al CPT.
- Autor solo si existe un usuario canónico.
- Cronología y actualización de timestamps consistente.
- Definir explícitamente el alcance de revisiones de contenido sin confundirlas con ProjectCommandBus/history.
- CRUD de `Relation` y `RelationEntry`.
- Slug único de relación y endpoints CPT existentes.
- Cardinalidades one-to-one, one-to-many y many-to-many con integridad.
- Proteger eliminación de registros/relaciones cuando existan referencias incompatibles.
- Persistencia/historial por Command Bus.
- UI funcional dentro de `Datos`, responsive y accesible; sin adelantar bindings de M09.5.
- Tests de dominio, IndexedDB/undo/redo y UI.
- Gate lint + typecheck + suite + build antes de activar M09.5.

## Bloqueos / decisiones por resolver dentro de M09.4

- `ContentRecordSchema`, `RelationSchema` y `RelationEntrySchema` ya existen como contratos anticipados, pero no cuentan como implementación formal.
- El requisito de “revisiones” debe revisarse contra el prompt/reglas y el history de proyecto antes de introducir una nueva colección. No se asumirá que el history global equivale automáticamente a revisiones de contenido.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde. Tipos, documentación o prototipos anticipados no cierran una microfase.

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
- Historial: `CHANGELOG.md`.
