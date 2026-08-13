# TRACKING — ElectroCMS

Actualizado: 2026-08-12.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F11 — Formularios y acciones`.
- Microfase actual: `M11.2 — Validación y lógica condicional`.
- Estado: `EN_CURSO`.
- F00–F10: `COMPLETADA`.
- F11: M11.1 `COMPLETADA`; M11.2 activa; M11.3–M11.5 `NO_INICIADA`.
- F12–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00–F08 | COMPLETADA | Base, plataforma, editor, widgets, inspector y temas |
| F09 | COMPLETADA | CPT, taxonomías, campos, registros/relaciones y binding CMS |
| F10 | COMPLETADA | Consultas, constructor visual, listings, filtros y rendimiento |
| F11 | EN_CURSO | M11.1 completada; M11.2 Validación y lógica condicional activa |
| F12–F18 | NO_INICIADA | Roadmap base restante |
| F19–F31 | NO_INICIADA | Paridad funcional ampliada |

## Arquitectura de navegación CMS/builder vigente

- Navegación principal orientada a tareas: grupos `Crear | Administrar | Apariencia`; destinos `Editor | Páginas | Contenido | Diseño`.
- `Capas` contiene exclusivamente el árbol/estructura del documento actual.
- `Widgets` contiene exclusivamente la biblioteca insertable.
- `Inspector` contiene propiedades del elemento seleccionado, incluidos datos dinámicos, con ayuda contextual y sin exponer claves internas como lenguaje principal.
- `Contenido` es el workspace global para tipos de contenido, clasificaciones, campos, entradas/relaciones, consultas y gestores globales de fases posteriores.
- `Diseño` contiene apariencia global, temas y paquetes exportables.
- `Páginas` contiene páginas y plantillas del proyecto.
- Móvil: `Widgets | Capas | Canvas | Props | Más`; `Más` abre módulos globales.
- Tablet: los paneles contextuales de Capas/Inspector se retiran al abrir un módulo global.
- Nunca insertar gestores globales de proyecto dentro de Capas o Widgets.
- Regla transversal: `UX_SIMPLICITY_SYSTEM.md` exige divulgación progresiva, vocabulario de usuario y ayuda `ⓘ` con referencia funcional WordPress/Elementor/ACF/JetEngine cuando corresponda.

## F09 completada

- M09.1 CPT: CRUD canónico, soportes/capacidades/visibilidad y plantillas Single/Archive.
- M09.2 Taxonomías: CRUD, términos, jerarquía, asociaciones bidireccionales y Archive.
- M09.3 Campos personalizados: 27 tipos, propietarios, defaults, opciones, condiciones, relaciones, roles y campos compuestos.
- M09.4 Registros/relaciones: CRUD, revisiones portables, cardinalidad e integridad referencial.
- M09.5 Binding dinámico: `cms-record-field` / `cms-record-property`, preview ready/loading/empty/error e integridad.
- Puerta final F09: run `31560809320` verde.

## F10 completada — Consultas, listings y filtros

### M10.1 — AST y Query Engine

- `QuerySchema` continúa siendo el único contrato canónico.
- Grupos AND/OR, status, field, taxonomy, author, date, relation y repeater.
- Operadores completos del schema y orden determinista.
- `validateQueryDefinition`, `executeCmsQuery` y `executeSavedCmsQuery`.
- `offset/limit` posteriores a filtrado/orden y `totalMatched` preservado.
- Gate: run `31561625115`.

### M10.2 — Constructor visual y preview

- `QueryManager` vive en `Contenido → Consultas`.
- CRUD de queries guardadas por Command Bus + IndexedDB + undo/redo.
- Edición accesible de CPT, grupos, predicados, sort, limit, offset y pageSize.
- Diagnóstico inline y preview real por `executeCmsQuery`.
- Resultados grandes virtualizados; no existen datos simulados como sustituto del motor.

### M10.3 — Listings y grids

- `executeCmsListing`/`executeCmsListingQuery` consumen el Query Engine canónico.
- Plantilla repetible por registro mediante contexto transitorio del renderer.
- Paginación accesible, estados empty/error y bindings por registro.
- Una página de listing ejecuta el Query Engine una sola vez y pagina en memoria la ventana canónica `offset/limit`.

### M10.4 — Filtros inteligentes

- 11 tipos funcionales: búsqueda, selector, rango, checkboxes, radio, fecha, taxonomía, ordenamiento, paginación, carga progresiva y reset.
- Modos tiempo real y botón aplicar.
- Estado compartido con listings/queries sin mutar la query persistida.
- URL + localStorage, contador de resultados, reset y paginación.
- Controles visuales ElectroCMS para filtros; no se depende de la apariencia nativa del sistema para la experiencia principal.
- Gate M10.4: run `31602249619`, lint/typecheck/tests/build/Chromium/Cloudflare preview verdes.

### M10.5 — Composición y rendimiento

- Filtros combinados continúan componiéndose sobre la query canónica transitoria.
- Debounce y cancelación de entradas pendientes cubiertos con fake timers.
- Caché LRU de listings con invalidación al cambiar la identidad del CMS.
- `query-index.ts` reduce candidatos de forma segura para content type/status/igualdad escalar; nunca usa shortcuts semánticamente inseguros.
- Métricas del Query Engine informan candidatos/evaluados/uso de índice.
- Eliminada la doble ejecución de la query por página de listing.
- Gestores CMS pesados usan `React.lazy`/`Suspense` y se cargan bajo demanda.
- Vite separa runtime React, Zod, DnD, almacenamiento y catálogo de widgets.
- Chunk principal reducido de ~639.70 kB a `372.23 kB`; desapareció el warning >500 kB.
- Gestores CMS lazy quedan aproximadamente entre 12–25 kB cada uno.

### Puerta final F10

GitHub Actions run `31608617420` sobre `02c99a54d6536535159a3fcbc857c9e131fb3904`:

- lint: `VERDE`.
- typecheck: `VERDE`.
- suite completa: `88 archivos / 364 pruebas VERDES`.
- build Vite: `VERDE`.
- Chromium browser audit: `VERDE`.
- 14 estados visuales auditados.
- horizontal overflow: `0`.
- targets táctiles <44×44: `0` en `mobile-375`, `mobile-landscape`, `mobile-more` y `cms-mobile`.
- architecture errors: `0`.
- Runtime exceptions: `0`.
- console warnings/errors de la app capturados: `0`.
- `assert-browser-audit.mjs` convierte los targets táctiles <44×44 en fallo real de CI.
- build principal: `372.23 kB` (`98.82 kB gzip`).
- Cloudflare PR preview: `VERDE`.
- producción: `SKIPPED` por PR draft.
- Documento consolidado: `F10_QUERY_LISTING_FILTER_SYSTEM.md`.

## M11.1 completada — Builder y campos

Objetivo cumplido: builder de formularios con todos los tipos de campo previstos por el catálogo, layout canónico basado en el orden de `FormStep.controlIds`, mapeo visual compatible a Custom Fields y edición por teclado, puntero y touch.

### Implementación consolidada

- `form-builder-engine.ts` mantiene CRUD, orden y mapping canónico de controles sobre `ProjectStructure.cms.forms`; no existe store/schema paralelo.
- Persistencia y undo/redo continúan por `ProjectStructureCommand` + `ProjectCommandBus` + IndexedDB.
- `FormManager` vive en `Contenido → Formularios`, nunca dentro de `Capas`.
- 27 tipos de campo disponibles desde el builder.
- El mapping solo ofrece Custom Fields compatibles con el tipo del control y protege cambios de CPT que invalidarían referencias.
- Orden canónico de controles persistido en `FormStep.controlIds`; drag pointer/touch/teclado conserva alternativa accesible mediante botones subir/bajar.
- Selección, alta, edición, orden y eliminación mantienen targets >=44×44 en touch y densidad compacta en escritorio.
- `ChoiceField` es el selector ElectroCMS compartido: portal a `document.body`, límites de viewport, cierre exterior/Escape, ArrowUp/ArrowDown/Home/End, Tab y retorno de foco.
- `HelpTip` y divulgación progresiva mantienen lenguaje de usuario y referencias funcionales JetFormBuilder/Elementor Forms.
- Capas funciona como árbol ARIA expandible/contraíble y los controles principales de la UX tocada dejaron de depender de selects nativos del sistema.

### Puerta final M11.1

GitHub Actions run `31659028320` sobre `00c222e45dca83f18e717b9a08f8b5e016476d96`:

- lint: `VERDE`.
- typecheck: `VERDE`.
- suite completa: `92 archivos / 380 pruebas VERDES`.
- build Vite: `VERDE`.
- Chromium browser audit: `VERDE`.
- 20 estados visuales auditados.
- horizontal overflow: `0`.
- targets táctiles <44×44: `0`.
- architecture errors: `0`.
- runtime exceptions: `0`.
- console warnings/errors de la app: `0`.
- Cloudflare PR preview: `VERDE`.
- producción: `SKIPPED` por PR draft.

## M11.2 — alcance activo

Objetivo: validación de formularios y lógica condicional reutilizando los contratos canónicos existentes, con mensajes comprensibles, equivalencia cliente/destino y foco accesible en el primer error.

Reglas de implementación:

- Reutilizar `FormSchema`, `FormControlSchema`, `FieldValidationSchema` y `FieldConditionGroupSchema`; no crear un motor paralelo desconectado del CMS.
- Las condiciones persistidas en `FormControl.conditions` deben evaluarse de forma determinista sobre los valores del mismo formulario.
- La validación de controles mapeados debe respetar las reglas del Custom Field destino para que cliente y persistencia compartan semántica.
- Los controles no mapeados deben mantener al menos validación coherente con tipo y `required`; cualquier ampliación del schema debe ser compatible con proyectos existentes y pasar migración/validación canónica.
- Mensajes de error junto al campo, resumen/estado accesible cuando corresponda y foco programático en el primer control inválido.
- `successMessage` y `errorMessage` siguen siendo propiedades canónicas del formulario; no duplicarlas en estado persistente de UI.
- La configuración común permanece visible; condiciones y restricciones poco frecuentes usan divulgación progresiva.
- No implementar todavía multipaso/borradores (M11.3), acciones post-submit (M11.4) ni seguridad/spam (M11.5).
- No iniciar M11.3 antes de gate completo de M11.2.

### Auditoría inicial M11.2

- `FormControlSchema` ya contiene `conditions` y `required`.
- `FieldDefinitionSchema` ya contiene `validation` (`minLength`, `maxLength`, `min`, `max`, `pattern`) y `conditions`.
- `custom-field-engine.ts` valida integridad/referencias, pero no evalúa condiciones en runtime.
- Los adapters React actuales de widgets de formulario representan controles HTML y previenen el submit; todavía no consumen `CmsBackend.forms`, por lo que M11.2 debe crear un runtime de dominio reutilizable sin fingir backend de envío.

## Bloqueos

- Ninguno técnico conocido para M11.2.
- El warning de bundle >500 kB quedó resuelto durante M10.5.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde. Desde F09, una fase tampoco se cierra sin auditoría visual real en navegador de la aplicación compilada y corrección de inconsistencias UI/UX/layout detectadas. La auditoría debe comprobar además que los flujos comunes no requieren comprender nombres técnicos internos.

## Documentos de control

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md` y `UX_SIMPLICITY_SYSTEM.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Memoria corta: `MEMORY.md`.
- Temas: `THEME_SYSTEM.md`; paquetes: `THEME_PACKAGE_SYSTEM.md`.
- CPT: `CONTENT_TYPE_SYSTEM.md`; taxonomías: `TAXONOMY_SYSTEM.md`; campos: `CUSTOM_FIELD_SYSTEM.md`.
- Registros/relaciones: `RECORD_RELATION_SYSTEM.md`; binding dinámico: `DYNAMIC_BINDING_SYSTEM.md`.
- Consultas: `QUERY_SYSTEM.md`; F10 consolidada: `F10_QUERY_LISTING_FILTER_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
