# TRACKING — ElectroCMS

Actualizado: 2026-08-12.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F10 — Consultas, listings y filtros`.
- Microfase actual: `M10.1 — AST de consultas`.
- Estado: `EN_CURSO`.
- F00–F09: `COMPLETADA`.
- `M09.1 — CPT`: `COMPLETADA`.
- `M09.2 — Taxonomías`: `COMPLETADA`.
- `M09.3 — Campos personalizados`: `COMPLETADA`.
- `M09.4 — Registros y relaciones`: `COMPLETADA`.
- `M09.5 — Binding dinámico`: `COMPLETADA`.
- F10: activa en M10.1.
- F11–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.

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
| F09 | COMPLETADA | CPT, taxonomías, campos, registros/relaciones y binding CMS |
| F10 | EN_CURSO | M10.1 AST de consultas activa |
| F11–F18 | NO_INICIADA | Roadmap base restante |
| F19–F31 | NO_INICIADA | Paridad funcional ampliada |

## Arquitectura de navegación CMS/builder vigente

La reorganización posterior a F09 queda validada y pasa a ser contrato UI:

- Navegación principal: `Editor | Documentos | Contenido | Diseño`.
- `Capas` contiene exclusivamente el árbol/estructura del documento actual.
- `Widgets` contiene exclusivamente la biblioteca insertable.
- `Inspector` contiene propiedades y configuración del nodo seleccionado, incluidos bindings dinámicos.
- `Contenido` es un workspace global con `Tipos | Taxonomías | Campos | Reg.`.
- `Diseño` contiene temas y paquetes exportables.
- `Documentos` contiene documentos/plantillas del proyecto.
- En móvil el dock mantiene cinco destinos: `Widgets | Capas | Canvas | Props | Más`; `Más` abre los módulos globales.
- En tablet, al abrir un módulo global se retiran los paneles contextuales de Capas/Inspector para evitar jerarquías mezcladas.
- No volver a insertar gestores globales de proyecto dentro de Capas o Widgets.

## Cierre auditoría UI/UX del shell

- Drag/resize cancelable sin persistir interacciones incompletas.
- Coordenadas inválidas de puntero no producen CSS `NaN`.
- Apariencia del editor aislada de temas exportables.
- Toolbar del canvas adaptada al ancho real.
- Biblioteca contextual reducida a Capas/Widgets sin módulos globales.
- Sidebar principal expone Editor/Documentos/Contenido/Diseño.
- Móvil conserva cinco destinos y usa `Más` para navegación global.
- Targets táctiles medidos en Chromium: 0 controles bajo 44 px en móvil, `Más` y CMS móvil del gate final.
- Sin overflow horizontal en 1440, 1024, 768, 375 ni landscape auditado.
- Sin excepciones Runtime ni errores/warnings de consola en el gate visual final.

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
- UI: `Contenido → Tipos`.
- Documento: `CONTENT_TYPE_SYSTEM.md`.
- Gate: run `31544864623`, lint/typecheck/suite/build verdes.

## Cierre M09.2 — Taxonomías

- `taxonomy-engine.ts` reutiliza `TaxonomySchema`/`TaxonomyTermSchema`.
- Asociaciones CPT↔taxonomía bidireccionales; Archive compatible; jerarquía sin ciclos.
- Borrado protegido por términos, campos, registros/queries cuando corresponde.
- `TaxonomySession` usa Command Bus + IndexedDB + undo/redo.
- UI: `Contenido → Taxonomías`.
- Documento: `TAXONOMY_SYSTEM.md`.
- Gate: run `31546741841`, lint/typecheck, 304/304 pruebas y build verdes.

## Cierre M09.3 — Campos personalizados

- `custom-field-engine.ts` formaliza `FieldDefinitionSchema` sin crear schemas alternativos.
- CRUD para propietarios CPT y taxonomía; 27 tipos exigidos; defaults/options/conditions/hijos/relación/taxonomía/calculado/roles validados.
- `ContentType.fieldIds` / `Taxonomy.fieldIds` sincronizados.
- Borrado/cambio de tipo protegido por datos y dependencias; M09.4 también considera valores conservados en revisiones.
- `CustomFieldSession` usa Command Bus/IndexedDB/undo/redo.
- UI: `Contenido → Campos`.
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
- `ContentRecordRevision` es snapshot portable distinto del history global; `recordRevisions` es retrocompatible con default `{}`.
- Solo CPT con soporte `revisions` generan snapshots al editar; restaurar preserva antes la versión reemplazada.
- Campos y términos conservados únicamente dentro de revisiones quedan protegidos.

### Persistencia/UI

- `RecordRelationSession` está segregada del contrato base.
- Todas las mutaciones pasan por `ProjectStructureCommand` + `ProjectCommandBus` + IndexedDB.
- Integración cubre revisionado + undo/redo, relaciones y protección referencial.
- UI: `Contenido → Registros y relaciones`; visualmente el tab se compacta como `Reg.`.
- Subtabs internos: `Registros | Relaciones`.
- Documento: `RECORD_RELATION_SYSTEM.md`.

### Puerta M09.4

GitHub Actions run `31550664429`:

- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `76 archivos / 322 pruebas VERDES`.
- Build producción Vite: `VERDE`.
- Deploy producción: `SKIPPED` por PR draft.

## Cierre M09.5 — Binding dinámico

- `BindingSourceSchema` amplía el contrato F07 con `cms-record-field` y `cms-record-property` serializables.
- `resolveNodeDataState` resuelve registros/campos reales y valida existencia y pertenencia al CPT.
- Los valores se proyectan a propiedades declaradas del widget mediante el mismo renderer/Inspector existente.
- Estados canónicos: `ready | empty | error`.
- Preview transitorio: `auto | loading | empty | error`; nunca se guarda en `ProjectStructure`.
- `loading` es simulación explícita del editor y no afirma I/O remoto.
- Inspector ofrece selección de propiedad destino, registro y campo compatible, preparar/quitar binding y aplicar por el Command Bus.
- El editor JSON avanzado de F07 continúa disponible para condiciones/casos completos; no se creó otro DataProvider.
- Borrado de registros/campos referenciados por bindings queda bloqueado por integridad.
- Theme packages que perderían dependencias CMS se rechazan.
- Renderer invalida nodos dinámicos cuando cambia solo `ProjectStructure.cms`.
- Cobertura principal: `cms-binding-integrity.test.ts`, `dynamic-binding-control.test.tsx`, `cms-binding-preview.test.tsx` más contratos F07.
- Documento: `DYNAMIC_BINDING_SYSTEM.md`.

## Puerta final F09

GitHub Actions run `31560809320` sobre `e08216f4d7f970e5e96ac580d01bec8511e68c56`:

- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `VERDE`.
- Build: `VERDE`.
- Browser UI audit Chromium: `VERDE`.
- Desktop, tablet y móvil sin overflow horizontal del documento.
- `mobile-375`, `mobile-more` y `cms-mobile`: 0 targets táctiles bajo 44 px.
- Runtime exceptions: 0.
- Console warnings/errors capturados: 0.
- Producción: `SKIPPED`; PR draft no despliega producción.

## M10.1 — alcance activo

Objetivo exacto: formalizar un AST canónico de consultas para contenido dinámico.

Debe cubrir AND/OR, campos, taxonomías, autor, fecha, orden, límites, offset, relaciones y repeaters sin introducir un motor paralelo al CMS existente. Antes de avanzar a M10.2 debe existir validación semántica, ejecución local determinista y pruebas de integridad/rendimiento básico sobre el modelo canónico.

## Bloqueos

- Ninguno técnico conocido para M10.1.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde. Desde F09 en adelante, una fase tampoco se cierra sin auditoría visual real en navegador de la aplicación compilada y corrección de inconsistencias UI/UX/layout detectadas.

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
- Binding dinámico: `DYNAMIC_BINDING_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
