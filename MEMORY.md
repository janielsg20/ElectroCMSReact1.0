# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-12.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura: `ARCHITECTURE.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F09 completadas.
- Fase activa: `F10 — Consultas, listings y filtros`.
- Microfase activa: `M10.1 — AST de consultas`.
- F11–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Puerta M09.1: run `31544864623`.
- Puerta M09.2: run `31546741841`, 304 pruebas.
- Puerta M09.3: run `31548253008`, 73 archivos / 312 pruebas.
- Puerta M09.4: run `31550664429`, 76 archivos / 322 pruebas.
- Puerta final F09: run `31560809320`, lint/typecheck/tests/build/browser audit verdes.
- Producción no se despliega desde este PR draft.

## Regla de calidad desde F09

- No cerrar una fase solo porque compile.
- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al finalizar cada fase se abre la aplicación compilada en Chromium y se realiza auditoría funcional/visual real.
- La auditoría comprueba desktop/tablet/móvil, overflow, solapamientos, jerarquía, densidad, iconografía, estados, foco/teclado, accesibilidad, consola y funciones visibles no implementadas.
- Los hallazgos se corrigen, se repite gate y se vuelve a auditar antes de activar la fase siguiente.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo crea revisiones monotónicas del proyecto y persiste en IndexedDB.
- Árbol, renderer, temas, documentos y CMS convergen en el mismo `ProjectStructure`.
- Capacidades específicas se segregan: `ThemePackageSession`, `ContentTypeSession`, `TaxonomySession`, `CustomFieldSession`, `RecordRelationSession`.
- Estado local de UI/preferencias no duplica proyecto: `workspace.v1`, `appearance.v1`, `library.v1`, `theme-packages.v1`.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.
- Funciones futuras no se muestran como activas.

## UI/UX vigente

- Dirección: High Density + Minimal Clean + builder/IDE profesional.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación principal global: `Editor | Documentos | Contenido | Diseño`.
- `Capas`: exclusivamente árbol/estructura del documento actual.
- `Widgets`: exclusivamente biblioteca insertable.
- `Inspector`: propiedades/configuración del nodo seleccionado, incluidos bindings dinámicos.
- `Contenido`: `Tipos | Taxonomías | Campos | Reg.`; `Reg.` se anuncia como `Registros y relaciones`.
- Dentro de Registros y relaciones: `Registros | Relaciones`.
- `Diseño`: temas y paquetes exportables. Apariencia local permanece en TopBar.
- `Documentos`: documentos/plantillas del proyecto.
- Móvil: `Widgets | Capas | Canvas | Props | Más`; `Más` contiene módulos globales.
- Tablet: los paneles contextuales se retiran al entrar a un módulo global.
- Nunca volver a ubicar módulos globales de CMS/proyecto dentro de Capas o Widgets.
- Gate Chromium final F09: sin overflow horizontal, sin errores de consola/excepciones y 0 targets bajo 44 px en mobile-375, mobile-more y cms-mobile.

## F05–F08 resumidas

- F05: árbol canónico, renderer granular, DnD accesible, direct manipulation, selección y viewport.
- F06: 115 widgets, adapters y biblioteca con búsqueda/filtros/favoritos/recientes/presets/DnD.
- F07: inspector generado, controles tipados, estilos seguros, breakpoints, bindings, condiciones y ARIA.
- F08: tres ámbitos de tema, presets, documentos/plantillas y paquetes theme versionados/importables.

## F09 completada

### CPT
- CRUD canónico, soportes/capacidades/visibilidad/orden/Single/Archive, integridad, Command Bus e UI `Contenido → Tipos`.

### Taxonomías
- CRUD taxonomías/términos, asociaciones CPT bidireccionales, Archive, jerarquía sin ciclos, integridad, Command Bus e UI `Contenido → Taxonomías`.

### Campos personalizados
- 27 tipos sobre `FieldDefinitionSchema`, propietarios CPT/taxonomía, defaults/options/conditions/hijos/relación/taxonomía/calculado/roles, integridad e UI `Contenido → Campos`.
- Campos conservados en revisiones cuentan como valores almacenados y no se eliminan/cambian destructivamente.

### Registros, revisiones y relaciones
- `record-relation-engine.ts`: CRUD de registros, validación por FieldDefinition, estados y taxonomías.
- Borradores pueden estar incompletos; required se exige al salir de draft.
- `ContentRecordRevision` es snapshot portable distinto del undo/redo global.
- CPT con soporte `revisions` crean snapshots al editar; restaurar preserva la versión reemplazada.
- CRUD Relation/RelationEntry con slug, endpoints y cardinalidad íntegros.
- `RecordRelationSession` usa Command Bus + IndexedDB + undo/redo.
- UI: `Contenido → Registros y relaciones → Registros | Relaciones`.
- Documento: `RECORD_RELATION_SYSTEM.md`.

### Binding dinámico
- `BindingSourceSchema` admite `cms-record-field` y `cms-record-property` sin segundo DataProvider.
- `resolveNodeDataState` valida registro/campo/CPT y resuelve propiedades del widget.
- Estados canónicos: `ready | empty | error`.
- Preview transitorio: `auto | loading | empty | error`; nunca se persiste.
- Inspector permite propiedad destino, registro, campo compatible y preparar/quitar/aplicar binding.
- Integridad bloquea borrar registros/campos aún referenciados.
- Renderer invalida bindings cuando cambia el CMS.
- Documento: `DYNAMIC_BINDING_SYSTEM.md`.

## M10.1 activa — AST de consultas

Objetivo: formalizar un AST canónico para consultas de contenido con AND/OR, campos, taxonomías, autor, fecha, orden, límites, offset, relaciones y repeaters.

- Reutilizar `QueryDefinitionSchema`/contratos CMS existentes si ya anticipan el modelo; no crear un query engine paralelo.
- Añadir validación semántica y ejecución local determinista sobre `ProjectStructure.cms`.
- Mantener referencias íntegras a CPT/campos/taxonomías/relaciones.
- No mostrar constructor visual de M10.2 antes de implementarlo.
- Gate completo antes de M10.2.

## Próximo paso exacto

Auditar los contratos de query ya existentes en `cms-schema.ts`/`validate-cms.ts`, comparar con M10.1 y completar únicamente los huecos del AST y del ejecutor local. Añadir tests de AND/OR, campos, taxonomía, autor, fecha, orden, limit/offset, relaciones y repeaters; después ejecutar lint/typecheck/suite/build antes de activar M10.2.
