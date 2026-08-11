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
- Microfase activa: `M09.3 — Campos personalizados`.
- M09.4–M09.5, F10–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Puerta M09.1: run `31544864623`, lint/typecheck/suite/build verdes.
- Puerta M09.2: run `31546741841`, lint/typecheck, 304/304 pruebas y build verdes.
- Producción no se despliega desde este PR draft.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad de proyecto; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history.
- Undo/redo crea revisiones monotónicas nuevas y persiste en IndexedDB.
- Árbol, renderer, temas, documentos y CMS convergen en el mismo `ProjectStructure`.
- Capacidades específicas del editor se segregan (`ThemePackageSession`, `ContentTypeSession`, `TaxonomySession`) para no ensanchar el contrato base.
- `workspace.v1`, `appearance.v1`, `library.v1` y `theme-packages.v1` son estado local de producto/preferencias, no una segunda copia del proyecto.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.
- Funciones futuras no se muestran como activas.

## UI/UX vigente

- Dirección: High Density + Minimal Clean + builder/IDE profesional.
- Targets aproximados: 44 px en touch y 36 px en escritorio denso.
- Desktop usa paneles dock/float/minimize; tablet/móvil conservan las funciones construidas mediante paneles adaptados.
- Biblioteca tiene cinco áreas funcionales: Capas, Widgets, Documentos, Datos y Diseño; responde al ancho real mediante container queries.
- `Datos` usa tabs secundarios y solo expone superficies ya construidas.
- Actualmente `Datos → Tipos | Taxonomías`.
- Los tabpanels inactivos usan el atributo HTML `hidden`, no solo ocultación visual CSS.
- Apariencia del editor permanece local en TopBar; temas/paquetes viven en Diseño.
- Canvas mantiene selección, breadcrumbs, resize, spacing, snapping, reglas, zoom, pan, orientación, device frames y foco entre regiones.

## F05–F08 resumidas

- F05: árbol canónico, renderer granular, DnD accesible, manipulación directa, selección y viewport.
- F06: catálogo único de 115 widgets, adapters y biblioteca con favoritos/recientes/presets/DnD.
- F07: inspector generado, controles tipados, motor de estilos seguro, breakpoints, bindings, condiciones y ARIA.
- F08: tres ámbitos de tema, presets, motor de documentos/plantillas y paquetes theme versionados/importables.

## M09.1 completada — CPT

- `content-type-engine.ts`: list/create/update/delete con ID/slug únicos e integridad.
- Campos reales: singular/plural, descripción, icono, capacidades, soportes, público, menú, orden, Single y Archive.
- Soportes: title/editor/author/thumbnail/excerpt/revisions/custom-fields.
- Single solo acepta `single|template`; Archive solo `archive|template`.
- Borrado bloquea dependencias de campos, taxonomías, registros, relaciones, queries, forms, backend screens y roles.
- `ContentTypeSession` usa Command Bus/IndexedDB/undo/redo.
- UI: `Datos → Tipos`.
- Documento: `CONTENT_TYPE_SYSTEM.md`.

## M09.2 completada — Taxonomías

- `taxonomy-engine.ts` reutiliza `TaxonomySchema` y `TaxonomyTermSchema` sin inventar propiedades paralelas.
- Taxonomías: ID/slug únicos, singular/plural, descripción, jerárquica/plana, asociaciones múltiples CPT, `fieldIds` preservados y Archive opcional.
- `Taxonomy.contentTypeIds` y `ContentType.taxonomyIds` se sincronizan bidireccionalmente.
- Archive solo acepta `archive|template`.
- Términos: slug único por taxonomía, descripción y padre opcional.
- Plana no admite padres; padre debe ser de la misma taxonomía; ciclos se rechazan.
- No se convierte a plana con hijos existentes.
- Borrado de taxonomía bloqueado por términos/campos/queries; borrado de términos bloqueado por hijos/registros/queries.
- `TaxonomySession` usa Command Bus/IndexedDB/undo/redo real.
- UI: `Datos → Taxonomías`, con CPT múltiples, Archive y términos.
- Documento: `TAXONOMY_SYSTEM.md`.

## M09.3 activa — Campos personalizados

Usar el contrato anticipado `FieldDefinitionSchema` como fuente canónica y formalizarlo mediante:

- CRUD de campos para propietarios CPT y taxonomía.
- Todos los tipos exigidos: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map, relation, user, taxonomy, repeater, group, calculated y conditional.
- default, placeholder, descripción, required, validation, options y conditions.
- childFieldIds para group/repeater sin ciclos.
- relationId, taxonomyId, allowedRoleIds, calculatedExpression, group y order.
- Sincronización con `ContentType.fieldIds` / `Taxonomy.fieldIds`.
- Integridad al modificar/eliminar.
- Persistencia/historial canónicos.
- UI funcional en Datos sin adelantar M09.4/M09.5.
- No avanzar hasta gate completo verde.

## Riesgos y límites

- Schemas CMS anticipados no cuentan como implementación hasta tener motor, integridad, persistencia, UI y tests.
- M09.3 debe reutilizar `validateCmsBackend`; no duplicar validadores ni defaults.
- Relaciones completas pertenecen M09.4; en M09.3 un campo `relation` puede referenciar únicamente una `Relation` canónica existente, nunca simular crearla.
- Roles se formalizan funcionalmente en F12; `allowedRoleIds` solo puede usar roles canónicos existentes y no debe inventar permisos.
- Collaboration, IA e integraciones remotas nunca degradan el modo offline/local.
- Secrets no aparecen en frontend, logs, exports ni bundles.

## Próximo paso exacto

Implementar `M09.3 — Campos personalizados` desde el dominio: CRUD, validación específica por tipo, sincronización con propietarios, integridad y tests; luego Command Bus, UI `Datos → Campos`, suite completa y build antes de M09.4.
