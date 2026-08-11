# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-11.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura: `ARCHITECTURE.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F08 completadas.
- Fase activa: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- M09.1 CPT: `COMPLETADA`.
- M09.2 Taxonomías: `COMPLETADA`.
- M09.3 Campos personalizados: `COMPLETADA`.
- Microfase activa: `M09.4 — Registros y relaciones`.
- M09.5, F10–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Puerta M09.1: run `31544864623`, lint/typecheck/suite/build verdes.
- Puerta M09.2: run `31546741841`, 304/304 pruebas y build verde.
- Puerta M09.3: run `31548253008`, 73 archivos / 312 pruebas, lint/typecheck/build verdes.
- Producción no se despliega desde este PR draft.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo crea revisiones monotónicas del proyecto y persiste en IndexedDB.
- Árbol, renderer, temas, documentos y CMS convergen en el mismo `ProjectStructure`.
- Capacidades específicas se segregan: `ThemePackageSession`, `ContentTypeSession`, `TaxonomySession`, `CustomFieldSession`.
- Estado local de UI/preferencias no duplica proyecto: `workspace.v1`, `appearance.v1`, `library.v1`, `theme-packages.v1`.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.
- Funciones futuras no se muestran como activas.

## UI/UX vigente

- Dirección: High Density + Minimal Clean + builder/IDE profesional.
- Targets aproximados: 44 px touch / 36 px escritorio denso.
- Biblioteca: Capas, Widgets, Documentos, Datos y Diseño; responde al ancho real con container queries.
- `Datos` solo expone superficies construidas y actualmente contiene `Tipos | Taxonomías | Campos`.
- Tabpanels inactivos usan el atributo HTML `hidden`.
- Apariencia local permanece en TopBar; temas/paquetes en Diseño.
- Canvas mantiene selección, breadcrumbs, resize, spacing, snapping, reglas, zoom, pan, orientación, device frames y foco.

## F05–F08 resumidas

- F05: árbol canónico, renderer granular, DnD accesible, direct manipulation, selección y viewport.
- F06: 115 widgets, adapters y biblioteca con búsqueda/filtros/favoritos/recientes/presets/DnD.
- F07: inspector generado, controles tipados, estilos seguros, breakpoints, bindings, condiciones y ARIA.
- F08: tres ámbitos de tema, presets, documentos/plantillas y paquetes theme versionados/importables.

## M09.1 completada — CPT

- CRUD canónico con ID/slug únicos, capacidades, soportes, visibilidad, orden y Single/Archive compatibles.
- Integridad al borrar.
- `ContentTypeSession` + Command Bus/IndexedDB/undo/redo.
- UI: `Datos → Tipos`.
- Documento: `CONTENT_TYPE_SYSTEM.md`.

## M09.2 completada — Taxonomías

- CRUD taxonomías/términos sobre schemas existentes.
- Asociaciones CPT↔taxonomía bidireccionales, Archive compatible, jerarquía sin ciclos.
- Borrado protegido por dependencias.
- `TaxonomySession` + Command Bus/IndexedDB/undo/redo.
- UI: `Datos → Taxonomías`.
- Documento: `TAXONOMY_SYSTEM.md`.

## M09.3 completada — Campos personalizados

- `custom-field-engine.ts` usa `FieldDefinitionSchema` como única fuente.
- CRUD para propietarios CPT/taxonomía; key única por propietario.
- 27 tipos: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map, relation, user, taxonomy, repeater, group, calculated y conditional.
- Defaults, options, conditions, childFieldIds, relationId, taxonomyId, allowedRoleIds, calculatedExpression, group/order y validaciones reforzadas.
- group/repeater no cruzan propietarios; relation/taxonomy/calculated requieren referencias/configuración reales.
- Cambio de tipo bloqueado con valores almacenados; delete bloqueado por datos, composición, condiciones, queries, forms o permisos.
- `ContentType.fieldIds` / `Taxonomy.fieldIds` sincronizados.
- `CustomFieldSession` + comandos `cms.*` + IndexedDB + undo/redo.
- UI: `Datos → Campos`, estructurada por tipo; no crea relaciones/roles ficticios.
- Documento: `CUSTOM_FIELD_SYSTEM.md`.

## M09.4 activa — Registros y relaciones

Debe formalizar `ContentRecordSchema`, `RelationSchema` y `RelationEntrySchema` con:

- CRUD de registros y estados draft/pending/published/private/archived.
- Validación de valores contra FieldDefinition y required.
- Términos compatibles con taxonomías del CPT.
- Autor existente y cronología consistente.
- Revisión explícita del requisito de revisiones de contenido; no asumir que ProjectCommandBus history sustituye automáticamente snapshots/revisiones de registros.
- CRUD de relaciones y entries con slug/endpoints/cardinalidad íntegros.
- Protección de borrado y referencias.
- Persistencia/historial de comandos.
- UI real en Datos sin adelantar bindings M09.5.
- Tests de dominio, IndexedDB/undo/redo y UI antes de avanzar.

## Riesgos y límites

- Los schemas anticipados no cuentan como implementación formal hasta tener motor, persistencia, UI y tests.
- M09.4 debe reutilizar `validateCmsBackend`; no duplicar integridad existente.
- Si se necesitan revisiones de contenido separadas, deben distinguirse semánticamente del historial global y añadirse retrocompatiblemente.
- F12 sigue siendo propietaria de gestión real de roles/usuarios.
- Collaboration, IA e integraciones remotas nunca degradan offline/local.
- Secrets no aparecen en frontend, logs, exports ni bundles.

## Próximo paso exacto

Implementar `M09.4 — Registros y relaciones`: revisar primero validadores y requisito de revisiones; después CRUD/integridad, Command Bus, UI `Datos`, pruebas completas y build antes de M09.5.
