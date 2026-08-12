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
- M10.1 AST de consultas: `COMPLETADA`.
- Microfase activa: `M10.2 — Constructor visual y preview`.
- F11–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Puerta final F09: run `31560809320`.
- Puerta M10.1: run `31561625115`, 80 archivos / 339 pruebas, lint/typecheck/build/browser audit verdes.
- Producción no se despliega desde este PR draft.

## Regla de calidad

- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al finalizar cada fase se abre la aplicación compilada en Chromium y se realiza auditoría funcional/visual real.
- La auditoría cubre desktop/tablet/móvil, overflow, jerarquía, densidad, foco/teclado, accesibilidad, consola y funciones visibles no implementadas.
- No cerrar una fase solo porque compile.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo persiste en IndexedDB.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History, Query ni Export.
- Estado local de UI/preferencias no duplica proyecto.
- Funciones futuras no se muestran como activas.

## UI/UX vigente

- High Density + Minimal Clean + builder/IDE profesional.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación global: `Editor | Documentos | Contenido | Diseño`.
- `Capas`: exclusivamente árbol/estructura del documento actual.
- `Widgets`: exclusivamente biblioteca insertable.
- `Inspector`: configuración del nodo seleccionado, incluidos bindings.
- `Contenido`: herramientas CMS globales; M10.2 añadirá `Consultas` aquí.
- `Diseño`: temas/paquetes. `Documentos`: documentos/plantillas.
- Móvil: `Widgets | Capas | Canvas | Props | Más`; `Más` contiene módulos globales.
- Tablet retira paneles contextuales al entrar a un módulo global.
- Nunca volver a ubicar módulos globales de CMS/proyecto dentro de Capas o Widgets.

## F09 completada

- CPT, taxonomías, 27 tipos de campo, registros/revisiones/relaciones y binding CMS completos.
- Sesiones específicas reutilizan Command Bus + IndexedDB + undo/redo.
- Documentos: `CONTENT_TYPE_SYSTEM.md`, `TAXONOMY_SYSTEM.md`, `CUSTOM_FIELD_SYSTEM.md`, `RECORD_RELATION_SYSTEM.md`, `DYNAMIC_BINDING_SYSTEM.md`.

## M10.1 completada — AST de consultas

- Reutiliza `QuerySchema`; no crea schema paralelo.
- `query-engine.ts`: `validateQueryDefinition`, `executeCmsQuery`, `executeSavedCmsQuery`.
- Grupos externos AND; grupo `all`=AND, `any`=OR.
- Fuentes: status, field, taxonomy, author, date, relation, repeater.
- Operadores completos del schema; validación de operandos/referencias.
- Date permite elegir createdAt/updatedAt mediante valor estructurado documentado.
- Repeater permite extracción por ruta en filas.
- Orden determinista con desempate por ID; offset/limit después de filtrado/orden; `totalMatched` preservado.
- Cobertura: 6 pruebas nuevas; suite total 339/339.
- Documento: `QUERY_SYSTEM.md`.

## M10.2 activa — Constructor visual y preview

Requisitos exactos:
- edición accesible;
- validación y diagnóstico inline;
- consultas guardadas reales en `cms.queries`;
- preview ejecutado por `executeCmsQuery`;
- resultados virtualizados para colecciones grandes;
- persistencia/undo/redo por Command Bus;
- constructor bajo `Contenido`, nunca Capas;
- CPT, grupos all/any, predicados, orden, limit, offset, pageSize;
- no implementar Listings M10.3 antes del gate de M10.2.

## Próximo paso exacto

Crear CRUD canónico de queries guardadas con protecciones de referencias, exponer una `QuerySession` segregada en `editor-project-context.ts`, integrarla en `BrowserEditorProjectSession` y probar IndexedDB + undo/redo. Solo después montar `QueryManager` dentro de `ProjectDataPanel` y validar la UI en Chromium.
