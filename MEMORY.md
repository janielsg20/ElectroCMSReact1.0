# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-12.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress. La experiencia final debe resultar familiar y sencilla para usuarios de WordPress, Elementor, ACF y la suite JetEngine, aunque la arquitectura interna sea avanzada.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura: `ARCHITECTURE.md`.
- UX para usuario final: `UX_SIMPLICITY_SYSTEM.md` junto a `UI_UX_LAYOUT_SYSTEM.md` y `design-system/electrocms/MASTER.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F10 completadas.
- Fase activa: `F11 — Formularios y acciones`.
- Microfase activa: `M11.1 — Builder y campos`.
- F12–F18 y F19–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- M11.1 incorpora edición canónica de `required` y orden de campos mediante drag pointer/touch/teclado, conservando botones subir/bajar. El diálogo de tamaños usa portal al body; no colocarlo dentro de superficies transformadas del canvas.
- Widgets usa 360 px como ancho desktop inicial y dos columnas desde 300 px útiles; migra exclusivamente el default histórico de 216 px y respeta cualquier ancho personalizado. La estrella significa Favoritos y el control de cuatro direcciones significa arrastrar; ambos conservan explicación accesible.
- Puerta final F10: run `31608617420`, 88 archivos / 364 pruebas, lint/typecheck/build/browser audit verdes.
- Producción no se despliega desde este PR draft.

## Regla de calidad

- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al finalizar cada fase se abre la aplicación compilada en Chromium y se realiza auditoría funcional/visual real.
- La auditoría cubre desktop/tablet/móvil, overflow, jerarquía, densidad, foco/teclado, accesibilidad, consola y funciones visibles no implementadas.
- `assert-browser-audit.mjs` bloquea CI si cualquier estado touch auditado contiene un target <44×44 CSS px.
- No cerrar una fase solo porque compile.
- Última auditoría UX: Chromium producción, 20 estados, sin overflow, targets touch deficientes, errores de arquitectura, excepciones ni consola. Suite focal 23 pruebas verde; la global llegó a 370/373, se corrigieron las tres expectativas/timeouts y pasaron aisladas, pero el rerun serial total excedió el límite de 6 minutos.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo persiste en IndexedDB.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History, Query, Forms ni Export.
- Estado local de UI/preferencias no duplica proyecto.
- Funciones futuras no se muestran como activas.
- Simplificar la UX nunca crea un store/modelo alternativo ni elimina funcionalidad; flujo básico y avanzado editan el mismo estado canónico.

## UI/UX vigente

- High Density + Minimal Clean, pero orientado a tareas de CMS visual en vez de exponer un IDE al usuario final.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación principal visible: grupos `Crear | Administrar | Apariencia`; destinos `Editor | Páginas | Contenido | Diseño`.
- `Capas`: exclusivamente árbol/estructura del documento actual.
- `Widgets`: exclusivamente biblioteca insertable.
- `Inspector`: propiedades del elemento seleccionado con vocabulario común, ayudas contextuales y referencias funcionales conocidas.
- `Contenido`: tipos de contenido, clasificaciones, campos, entradas/relaciones y consultas; los gestores globales futuros siguen esta arquitectura.
- `Diseño`: apariencia global, temas y paquetes. `Páginas`: páginas/plantillas del proyecto.
- Móvil conserva acceso a `Widgets | Capas | Canvas | Props | Más`; `Más` contiene módulos globales.
- Tablet retira paneles contextuales al entrar a un módulo global.
- Nunca volver a ubicar módulos globales de CMS/proyecto dentro de Capas o Widgets.
- Divulgación progresiva obligatoria: opciones esenciales primero; parámetros técnicos o poco frecuentes dentro de `Opciones avanzadas`.
- Toda opción no obvia debe usar ayuda contextual ElectroCMS accesible por teclado/puntero/touch.
- Cuando exista equivalencia clara, la ayuda referencia WordPress, Elementor, ACF, JetEngine, JetFormBuilder, JetSmartFilters o JetStyleManager según `UX_SIMPLICITY_SYSTEM.md`.
- No usar nombres de schemas, AST, stores, IDs internos, fases o microfases como lenguaje principal del producto.

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
- El builder debe usar modelo mental JetFormBuilder/Elementor Forms: campo → propósito → dato relacionado → opciones avanzadas; la arquitectura interna no se expone como flujo principal.
- >=44×44 en touch; densidad compacta en escritorio.
- No iniciar M11.2 hasta pasar el gate completo de M11.1.

## Trabajo M11.1 ya iniciado

- Existe `form-builder-engine.ts` canónico con CRUD, orden y mapeo de controles y pruebas dedicadas.
- La navegación y los gestores CMS en la rama F11 comenzaron una refactorización transversal de simplicidad sin alterar contratos.
- Existe el primitive accesible `HelpTip` y el catálogo `feature-help.ts` para explicar opciones y equivalencias funcionales.
- `ContentTypeManager` aplica flujo esencial + `Opciones avanzadas`; el Inspector oculta claves técnicas del lenguaje principal y explica cada propiedad con ayuda contextual.
- Auditoría UX/UI incremental: Capas se nombra como estructura de página y refuerza la jerarquía visual; Widgets explica inserción/arrastre y se distribuye en dos columnas solo cuando el panel conserva tarjetas legibles. `HelpTip` usa posicionamiento dentro del viewport, scroll/resize y Escape para evitar popovers recortados.
- La auditoría Chromium de producción cubrió 17 estados desktop/tablet/móvil sin overflow, targets touch <44, excepciones ni avisos de consola. Se corrigió una regla heredada que comprimía el árbol de Capas al aplicar ancho completo a todos sus botones.

## Próximo paso exacto

Cerrar la refactorización UX de los gestores tocados por M11.1, montar el gestor visual de formularios sobre el motor canónico y validar lint + typecheck + suite completa + build + auditoría Chromium antes de iniciar M11.2.
