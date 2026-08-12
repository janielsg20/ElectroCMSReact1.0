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
- F00–F10 completadas.
- Fase activa: `F11 — Formularios y acciones`.
- Microfase activa: `M11.1 — Builder y campos`.
- F12–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Puerta final F10: run `31608617420`, 88 archivos / 364 pruebas, lint/typecheck/build/browser audit verdes.
- Producción no se despliega desde este PR draft.

## Regla de calidad

- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al finalizar cada fase se abre la aplicación compilada en Chromium y se realiza auditoría funcional/visual real.
- La auditoría cubre desktop/tablet/móvil, overflow, jerarquía, densidad, foco/teclado, accesibilidad, consola y funciones visibles no implementadas.
- `assert-browser-audit.mjs` bloquea CI si cualquier estado touch auditado contiene un target <44×44 CSS px.
- No cerrar una fase solo porque compile.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo persiste en IndexedDB.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History, Query, Forms ni Export.
- Estado local de UI/preferencias no duplica proyecto.
- Funciones futuras no se muestran como activas.

## UI/UX vigente

- High Density + Minimal Clean + builder/IDE profesional.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación global: `Editor | Documentos | Contenido | Diseño`.
- `Capas`: exclusivamente árbol/estructura del documento actual.
- `Widgets`: exclusivamente biblioteca insertable.
- `Inspector`: configuración del nodo seleccionado, incluidos bindings.
- `Contenido`: herramientas CMS globales, incluidas Consultas; los nuevos gestores globales siguen esta arquitectura.
- `Diseño`: temas/paquetes. `Documentos`: documentos/plantillas.
- Móvil: `Widgets | Capas | Canvas | Props | Más`; `Más` contiene módulos globales.
- Tablet retira paneles contextuales al entrar a un módulo global.
- Nunca volver a ubicar módulos globales de CMS/proyecto dentro de Capas o Widgets.

## F09 completada

- CPT, taxonomías, 27 tipos de campo, registros/revisiones/relaciones y binding CMS completos.
- Sesiones específicas reutilizan Command Bus + IndexedDB + undo/redo.
- Documentos: `CONTENT_TYPE_SYSTEM.md`, `TAXONOMY_SYSTEM.md`, `CUSTOM_FIELD_SYSTEM.md`, `RECORD_RELATION_SYSTEM.md`, `DYNAMIC_BINDING_SYSTEM.md`.

## F10 completada — Query / Listing / Filters

- `QuerySchema` sigue siendo la única definición canónica de consultas.
- `query-engine.ts`: validación semántica, ejecución determinista, métricas e índice opcional seguro.
- `QueryManager`: CRUD/preview accesible bajo Contenido, persistido por Command Bus.
- Listings repiten plantilla por registro, paginan la ventana canónica y ejecutan Query Engine una sola vez por página.
- Smart Filters: 11 tipos, realtime/apply, URL/localStorage, contador, pagination/load-more/reset y composición sin mutar query guardada.
- Runtime store con debounce/cancelación; caché LRU con invalidación por identidad CMS.
- `query-index.ts` reduce candidatos de manera semánticamente segura.
- Gestores CMS pesados usan lazy loading.
- Bundle principal pasó de ~639.70 kB a 372.23 kB; sin warning >500 kB.
- Audit final: 14 estados, 0 overflow, 0 targets touch <44, 0 architecture errors, 0 runtime exceptions y 0 warnings/errors de consola de la app.

## M11.1 activa — Builder y campos

Requisitos exactos:

- Reutilizar `CmsBackend.forms`, `FormSchema` y `FormControlSchema`.
- No crear un store/schema paralelo de formularios.
- CRUD y cambios persistentes por Command Bus + IndexedDB + undo/redo.
- Todos los campos previstos por el alcance y catálogo existente deben poder componerse en el builder.
- Layout, orden y mapeo visual a Custom Fields.
- Añadir, seleccionar, reordenar y eliminar mediante teclado, puntero y touch; DnD con alternativa por una sola activación/teclado.
- Formularios como gestor global; controles insertables en Widgets e Inspector.
- Controles y menús de la UI del builder deben usar diseño ElectroCMS, no apariencia nativa dependiente del sistema.
- >=44×44 en touch; densidad compacta en escritorio.
- No iniciar M11.2 hasta pasar el gate completo de M11.1.

## Próximo paso exacto

Auditar `FormSchema`/`FormControlSchema`, validaciones CMS existentes y patrones de sesiones de CPT/Queries. Implementar primero un `form-engine.ts` canónico para CRUD/orden/mapeo de controles sin introducir validación/condiciones de M11.2; después exponer `FormSession`, persistencia/undo-redo y montar el gestor visual funcional con sus pruebas.
