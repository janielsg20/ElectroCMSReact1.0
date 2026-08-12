# TRACKING — ElectroCMS

Actualizado: 2026-08-12.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F11 — Formularios y acciones`.
- Microfase actual: `M11.1 — Builder y campos`.
- Estado: `EN_CURSO`.
- Reauditoría UX/UI solicitada: `COMPLETADA` dentro de M11.1. Widgets abre a 360 px, migra solo el antiguo default de 216 px, muestra dos columnas desde 300 px útiles y conserva una columna al estrecharse. Favoritos usa estrella con explicación; el ID técnico deja de competir con nombre/categoría. Validación: lint, typecheck, build, 14 pruebas focalizadas y auditoría Chromium de producción (20 estados, 0 overflow, 0 targets touch <44 px, 0 excepciones/consola).
- Auditoría UX/UI M11.1: simplificación incremental aplicada a lienzo, Capas, Widgets, Formularios y ayudas contextuales, sin adelantar M11.2–M11.5. El builder ya permite marcar campos obligatorios y reordenarlos por drag accesible o botones, siempre mediante sesión/Command Bus. El diálogo responsive se porta a `document.body` para no quedar deformado por transformaciones del lienzo. Verificación: typecheck, lint, build y 23 pruebas focalizadas verdes; suite global 370/373 antes de corregir tres expectativas/timeouts heredados, luego verdes de forma aislada (la repetición completa serial superó 6 min sin reportar fallos). Auditoría Chromium de producción: 20 estados, 0 overflow horizontal, 0 targets touch <44×44, 0 errores de arquitectura, excepciones o consola.
- F00–F10: `COMPLETADA`.
- F11: M11.1 activa; M11.2–M11.5 `NO_INICIADA`.
- F12–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00–F08 | COMPLETADA | Base, plataforma, editor, widgets, inspector y temas |
| F09 | COMPLETADA | CPT, taxonomías, campos, registros/relaciones y binding CMS |
| F10 | COMPLETADA | Consultas, constructor visual, listings, filtros y rendimiento |
| F11 | EN_CURSO | M11.1 Builder y campos |
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

## M11.1 — alcance activo

Objetivo exacto: implementar el builder de formularios y todos sus campos/layout/mapeo con edición por teclado, puntero y touch.

Reglas de implementación:

- Reutilizar `CmsBackend.forms`, `FormSchema` y `FormControlSchema`; no crear otro modelo/store de formularios.
- Persistencia por `ProjectStructureCommand` + `ProjectCommandBus` + IndexedDB + undo/redo.
- Reutilizar el catálogo de widgets de formulario existente; los contratos anticipados no cuentan como M11.1 hasta tener builder funcional.
- El gestor global del formulario debe vivir en la arquitectura de módulos globales, no dentro de `Capas`.
- Los controles insertables siguen disponibles en `Widgets` y editables desde Inspector.
- Builder accesible: añadir/reordenar/eliminar/seleccionar controles por clic, teclado y touch; drag debe tener alternativa equivalente.
- Mapeo visual de controles a campos personalizados compatibles.
- Layout y orden deben ser canónicos y exportables; no guardar geometría efímera de UI en el proyecto.
- Mantener High Density + Minimal Clean: ~36 px escritorio y >=44 px en superficies táctiles.
- Aplicar `UX_SIMPLICITY_SYSTEM.md`: flujo común primero, opciones avanzadas colapsadas, referencias funcionales conocidas y ningún término interno obligatorio para completar tareas normales.
- No iniciar M11.2 (validación/condiciones) antes del gate completo de M11.1.

### Implementación en curso

- `form-builder-engine.ts`: CRUD, orden y mapping canónico de controles sobre `ProjectStructure.cms.forms`.
- Pruebas dedicadas del motor; corregido fixture para usar `routePath` canónico.
- Primitive `HelpTip` con icono `info`, teclado/puntero/touch y referencia funcional.
- Catálogo `feature-help.ts` para Editor, Páginas, Contenido, Diseño, tipos, clasificaciones, campos, entradas/relaciones, consultas e Inspector.
- Navegación reescrita por intención: `Crear | Administrar | Apariencia`.
- `ProjectDataPanel` usa nombres orientados a resultados y ayuda contextual.
- Inspector elimina `field.key`, `Binding`, `Nodo/Predeterminado` como vocabulario principal y usa `Dato dinámico`, `Personalizado/Global`, `Guardar/Restablecer`.
- `ContentTypeManager` aplica divulgación progresiva: configuración esencial visible y permisos/soportes/visibilidad/plantillas dentro de `Opciones avanzadas`, sin pérdida funcional.
- `UX_SIMPLICITY_SYSTEM.md` y `AGENTS.md` hacen esta dirección obligatoria para las fases siguientes.

## Bloqueos

- Ninguno técnico conocido para M11.1.
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
