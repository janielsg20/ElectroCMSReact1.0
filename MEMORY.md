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
- M09.4 Registros y relaciones: `COMPLETADA`.
- Microfase activa: `M09.5 — Binding dinámico`.
- F10–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Puerta M09.1: run `31544864623`.
- Puerta M09.2: run `31546741841`, 304 pruebas.
- Puerta M09.3: run `31548253008`, 73 archivos / 312 pruebas.
- Puerta M09.4: run `31550664429`, 76 archivos / 322 pruebas, lint/typecheck/build verdes.
- Producción no se despliega desde este PR draft.

## Regla de calidad desde F09

- No cerrar una fase solo porque compile.
- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al finalizar cada fase se abre la aplicación compilada en navegador y se realiza auditoría funcional/visual real.
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
- Targets aproximados: 44 px touch / 36 px escritorio denso.
- Biblioteca: Capas, Widgets, Documentos, Datos y Diseño; responde al ancho real con container queries.
- `Datos` contiene `Tipos | Taxonomías | Campos | Reg.`; el último tab se anuncia como `Registros y relaciones`.
- Dentro de Registros y relaciones: `Registros | Relaciones`.
- Tabpanels inactivos usan el atributo HTML `hidden`.
- Apariencia local permanece en TopBar; temas/paquetes en Diseño.
- Canvas mantiene selección, breadcrumbs, resize, spacing, snapping, reglas, zoom, pan, orientación, device frames y foco.

## F05–F08 resumidas

- F05: árbol canónico, renderer granular, DnD accesible, direct manipulation, selección y viewport.
- F06: 115 widgets, adapters y biblioteca con búsqueda/filtros/favoritos/recientes/presets/DnD.
- F07: inspector generado, controles tipados, estilos seguros, breakpoints, bindings, condiciones y ARIA.
- F08: tres ámbitos de tema, presets, documentos/plantillas y paquetes theme versionados/importables.

## F09 implementado hasta M09.4

### CPT
- CRUD canónico, soportes/capacidades/visibilidad/orden/Single/Archive, integridad, Command Bus e UI `Datos → Tipos`.

### Taxonomías
- CRUD taxonomías/términos, asociaciones CPT bidireccionales, Archive, jerarquía sin ciclos, integridad, Command Bus e UI `Datos → Taxonomías`.

### Campos personalizados
- 27 tipos sobre `FieldDefinitionSchema`, propietarios CPT/taxonomía, defaults/options/conditions/hijos/relación/taxonomía/calculado/roles, integridad y UI `Datos → Campos`.
- Campos conservados en revisiones de contenido cuentan como valores almacenados y no se pueden borrar/cambiar de tipo de forma destructiva.

### Registros, revisiones y relaciones
- `record-relation-engine.ts`: CRUD de registros, validación por FieldDefinition, estados y taxonomías.
- Borradores pueden estar incompletos; required se exige al salir de draft.
- `ContentRecordRevision` es snapshot portable distinto del undo/redo global.
- `CmsBackend.recordRevisions` es retrocompatible con default `{}`.
- CPT con soporte `revisions` crean snapshots al editar; restaurar preserva la versión reemplazada.
- Términos/campos conservados solo en revisiones están protegidos.
- CRUD Relation/RelationEntry con slug, endpoints y cardinalidad íntegros.
- Registros/relaciones conectados no se borran dejando referencias rotas.
- `RecordRelationSession` usa Command Bus + IndexedDB + undo/redo.
- UI: `Datos → Registros y relaciones → Registros | Relaciones`.
- Documento: `RECORD_RELATION_SYSTEM.md`.

## M09.5 activa — Binding dinámico

Objetivo exacto: conectar contenido a widgets y previsualizar vacío/error/loading.

- Reutilizar `BindingSourceSchema`, `NodeDataSettings`, `resolveNodeDataState` y renderer existentes de F07.
- No introducir un segundo DataProvider ni otro estado persistente.
- Añadir binding CMS canónico/serializable con referencias explícitas a registros/campos.
- Resolver propiedades de widgets y diagnosticar referencias rotas.
- Distinguir ready/empty/error.
- Loading debe ser un modo de preview explícito del editor; no fingir I/O remoto.
- Mejorar Inspector con controles funcionales de contenido sin eliminar el editor JSON avanzado para casos completos.
- Persistir cambios de bindings por el Command Bus ya existente.
- Tests de dominio, renderer, UI y persistencia.
- Gate completo antes de auditoría visual final de F09.

## Próximo paso exacto

Implementar M09.5 empezando por extender el contrato de binding y el resolver de F07; después integrar renderer/Inspector, estados de preview, tests y build. Cuando quede verde, crear preview no productivo, auditar F09 en navegador, corregir y repetir antes de activar F10.
