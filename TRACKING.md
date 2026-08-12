# TRACKING — ElectroCMS

Actualizado: 2026-08-12.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F10 — Consultas, listings y filtros`.
- Microfase actual: `M10.2 — Constructor visual y preview`.
- Estado: `EN_CURSO`.
- F00–F09: `COMPLETADA`.
- M10.1 — AST de consultas: `COMPLETADA`.
- M10.2: activa.
- M10.3–M10.5: `NO_INICIADA`.
- F11–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00–F08 | COMPLETADA | Base, plataforma, editor, widgets, inspector y temas |
| F09 | COMPLETADA | CPT, taxonomías, campos, registros/relaciones y binding CMS |
| F10 | EN_CURSO | M10.1 completa; M10.2 activa |
| F11–F18 | NO_INICIADA | Roadmap base restante |
| F19–F31 | NO_INICIADA | Paridad funcional ampliada |

## Arquitectura de navegación CMS/builder vigente

- Navegación principal: `Editor | Documentos | Contenido | Diseño`.
- `Capas` contiene exclusivamente el árbol/estructura del documento actual.
- `Widgets` contiene exclusivamente la biblioteca insertable.
- `Inspector` contiene propiedades y configuración del nodo seleccionado, incluidos bindings dinámicos.
- `Contenido` es el workspace global para CPT, taxonomías, campos, registros/relaciones y consultas.
- `Diseño` contiene temas y paquetes exportables.
- `Documentos` contiene documentos/plantillas del proyecto.
- Móvil: `Widgets | Capas | Canvas | Props | Más`; `Más` abre módulos globales.
- Tablet: los paneles contextuales de Capas/Inspector se retiran al abrir un módulo global.
- Nunca insertar gestores globales de proyecto dentro de Capas o Widgets.

## Cierre auditoría UI/UX del shell

- Biblioteca contextual reducida a Capas/Widgets.
- Sidebar principal expone Editor/Documentos/Contenido/Diseño.
- Targets táctiles medidos en Chromium: 0 controles bajo 44 px en `mobile-375`, `mobile-more` y `cms-mobile`.
- Sin overflow horizontal en 1440, 1024, 768, 375 ni landscape auditado.
- Sin excepciones Runtime ni errores/warnings de consola en el gate visual final F09.

## F08 completada

- M08.1 Tres ámbitos de tema: `COMPLETADA`.
- M08.2 Presets visuales: `COMPLETADA`.
- M08.3 Motor de plantillas: `COMPLETADA`.
- M08.4 Paquetes theme: `COMPLETADA`.
- Gate M08.4: run `31543564627`, lint/typecheck/suite/build verdes.

## F09 completada

### M09.1 — CPT
- CRUD canónico, capacidades/soportes/visibilidad/orden y Single/Archive.
- `ContentTypeSession` por Command Bus + IndexedDB + undo/redo.
- UI: `Contenido → Tipos`.
- Documento: `CONTENT_TYPE_SYSTEM.md`.
- Gate: `31544864623`.

### M09.2 — Taxonomías
- CRUD taxonomías/términos, asociaciones CPT bidireccionales, Archive y jerarquía sin ciclos.
- `TaxonomySession` por Command Bus + IndexedDB + undo/redo.
- UI: `Contenido → Taxonomías`.
- Documento: `TAXONOMY_SYSTEM.md`.
- Gate: `31546741841`, 304 pruebas.

### M09.3 — Campos personalizados
- 27 tipos sobre `FieldDefinitionSchema`; propietarios CPT/taxonomía, defaults/options/conditions/hijos/relación/taxonomía/calculado/roles.
- `CustomFieldSession` por Command Bus/IndexedDB/undo/redo.
- UI: `Contenido → Campos`.
- Documento: `CUSTOM_FIELD_SYSTEM.md`.
- Gate: `31548253008`, 73 archivos / 312 pruebas.

### M09.4 — Registros y relaciones
- `record-relation-engine.ts`: CRUD, estados, validación, revisiones portables y relaciones con cardinalidad/integridad.
- `RecordRelationSession` por Command Bus + IndexedDB + undo/redo.
- UI: `Contenido → Registros y relaciones → Registros | Relaciones`.
- Documento: `RECORD_RELATION_SYSTEM.md`.
- Gate: `31550664429`, 76 archivos / 322 pruebas.

### M09.5 — Binding dinámico
- `BindingSourceSchema` soporta `cms-record-field` y `cms-record-property` sin segundo DataProvider.
- Resolver canónico `ready | empty | error`; preview transitorio `auto | loading | empty | error`.
- Inspector permite propiedad destino, registro, campo compatible y aplicar/quitar binding.
- Integridad protege registros/campos referenciados; renderer invalida al cambiar CMS.
- Documento: `DYNAMIC_BINDING_SYSTEM.md`.

### Puerta final F09

Run `31560809320` sobre `e08216f4d7f970e5e96ac580d01bec8511e68c56`:
- lint/typecheck/tests/build/browser audit: `VERDE`.
- sin overflow horizontal, excepciones Runtime ni errores/warnings de consola.
- producción: `SKIPPED` por PR draft.

## Cierre M10.1 — AST de consultas

- Se reutiliza `QuerySchema`; no existe un segundo modelo paralelo.
- `query-engine.ts` añade validación semántica y ejecución local pura/determinista.
- Grupos de consulta se combinan con AND; `all` usa AND y `any` usa OR dentro de cada grupo.
- Fuentes cubiertas: estado, campo, taxonomía, autor, fecha, relación y repeater.
- Operadores cubiertos: equals/not-equals/contains/in/not-in/comparadores/between/exists.
- `date` puede seleccionar `createdAt` o `updatedAt` sin ampliar el schema mediante el valor estructurado documentado.
- `repeater` puede resolver valores completos o una ruta por fila.
- Orden múltiple por campo escalar o sistema; nulos al final; desempate por ID léxico sin locale-dependent sorting.
- Offset/limit se aplican después de filtrado/orden y se informa `totalMatched`.
- Consultas guardadas se ejecutan por `QueryId`.
- Referencias de campo/taxonomía/relación se validan contra el CPT consultado.
- API exportada: `validateQueryDefinition`, `executeCmsQuery`, `executeSavedCmsQuery`.
- Documento: `QUERY_SYSTEM.md`.

### Puerta M10.1

GitHub Actions run `31561625115`:
- lint: `VERDE`.
- typecheck: `VERDE`.
- suite completa: `80 archivos / 339 pruebas VERDES`.
- pruebas nuevas de query engine: `6/6 VERDES`.
- build Vite: `VERDE`.
- Chromium browser audit: `VERDE`.
- horizontal overflow: 0 estados.
- architecture errors: 0.
- Runtime exceptions: 0.
- console warnings/errors capturados: 0.
- producción: `SKIPPED` por PR draft.

## M10.2 — alcance activo

Objetivo exacto: constructor visual y preview para consultas guardadas con edición accesible, validación, diagnóstico y resultados virtualizados.

Reglas de implementación:
- El constructor pertenece a `Contenido`, nunca a `Capas`/`Widgets`.
- Persistencia mediante el mismo `ProjectStructure.cms.queries`, Command Bus, IndexedDB y undo/redo.
- Cada guardado debe pasar `validateQueryDefinition`.
- Preview debe usar `executeCmsQuery`; no duplicar semántica en React.
- UI estructurada para CPT, grupos AND/OR, predicados, orden, limit/offset/pageSize.
- Diagnósticos inline y estados vacíos reales.
- Resultados grandes deben virtualizarse sin inventar datos.
- Gate completo antes de M10.3.

## Bloqueos

- Ninguno técnico conocido para M10.2.
- Warning no bloqueante de Vite: chunk principal >500 kB; se abordará con code splitting/rendimiento antes del cierre de F10 si sigue presente.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde. Desde F09, una fase tampoco se cierra sin auditoría visual real en navegador de la aplicación compilada y corrección de inconsistencias UI/UX/layout detectadas.

## Documentos de control

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Memoria corta: `MEMORY.md`.
- Temas: `THEME_SYSTEM.md`; paquetes: `THEME_PACKAGE_SYSTEM.md`.
- CPT: `CONTENT_TYPE_SYSTEM.md`; taxonomías: `TAXONOMY_SYSTEM.md`; campos: `CUSTOM_FIELD_SYSTEM.md`.
- Registros/relaciones: `RECORD_RELATION_SYSTEM.md`; binding dinámico: `DYNAMIC_BINDING_SYSTEM.md`.
- Consultas: `QUERY_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
