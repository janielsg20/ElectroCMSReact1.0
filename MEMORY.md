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
- M11.1 `COMPLETADA`.
- Microfase activa: `M11.2 — Validación y lógica condicional`.
- M11.3–M11.5 y F12–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Producción no se despliega desde este PR draft.

## Última puerta verde

M11.1 cerró con GitHub Actions run `31659028320` sobre `00c222e45dca83f18e717b9a08f8b5e016476d96`:

- lint: verde.
- typecheck: verde.
- suite completa: 92 archivos / 380 pruebas verdes.
- build: verde.
- auditoría Chromium: 20 estados, 0 overflow, 0 targets touch <44×44, 0 errores de arquitectura, 0 excepciones y 0 warnings/errors de consola.
- Cloudflare PR preview: verde.
- producción: skipped por PR draft.

## M11.1 consolidada — Builder y campos

- `FormManager` vive en `Contenido → Formularios` y usa `CmsBackend.forms`; no existe store/schema paralelo.
- 27 tipos de campo disponibles.
- Layout canónico actual = orden de controles en `FormStep.controlIds`; el schema no define filas/columnas. No inventar geometría persistente antes de que el contrato lo requiera.
- Mapeo visual solo hacia Custom Fields compatibles.
- Añadir, seleccionar, editar, reordenar y eliminar funciona con puntero, touch y teclado; DnD conserva alternativa por botones.
- `ChoiceField` es el selector ElectroCMS compartido: portal al body, límites del viewport, click exterior, Escape, ArrowUp/ArrowDown, Home/End, Tab y retorno de foco.
- `CanonicalLayerTree` y las filas del builder protegen targets >=44 px en touch y regresan a densidad compacta en escritorio.
- `HelpTip` usa portal, colisión/viewport y lenguaje orientado a tareas con referencias conocidas.

## Regla de calidad

- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al cerrar microfases de UI/runtime, ejecutar también auditoría Chromium real sobre producción compilada.
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
- Simplificar la UX nunca crea un store/modelo alternativo ni elimina funcionalidad; flujo básico y avanzado editan el mismo estado canónico.

## UI/UX vigente

- High Density + Minimal Clean, orientado a tareas de CMS visual en vez de exponer un IDE al usuario final.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación principal: `Crear | Administrar | Apariencia`; destinos `Editor | Páginas | Contenido | Diseño`.
- `Capas`: exclusivamente árbol/estructura del documento actual.
- `Widgets`: exclusivamente biblioteca insertable.
- `Inspector`: propiedades del elemento seleccionado con vocabulario común, ayudas contextuales y referencias funcionales conocidas.
- `Contenido`: tipos, clasificaciones, campos, entradas/relaciones, consultas y formularios.
- `Diseño`: apariencia global, temas y paquetes. `Páginas`: páginas/plantillas del proyecto.
- Móvil conserva `Widgets | Capas | Canvas | Props | Más`; `Más` contiene módulos globales.
- Tablet retira paneles contextuales al entrar a un módulo global.
- Divulgación progresiva obligatoria: opciones esenciales primero; parámetros técnicos o poco frecuentes dentro de `Opciones avanzadas`.
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
- Gestores CMS pesados usan lazy loading; bundle principal sin warning >500 kB.

## M11.2 activa — Validación y lógica condicional

Objetivo exacto: implementar validación de formularios y condiciones reutilizando el estado canónico, con mensajes comprensibles y foco accesible en el primer error.

Contratos ya existentes:

- `FormControlSchema`: `conditions`, `required`, tipo, mapping y metadatos del control.
- `FieldValidationSchema`: `minLength`, `maxLength`, `min`, `max`, `pattern`.
- `FieldConditionGroupSchema`: grupos `all/any` con condiciones por `fieldId`, operador y valor.
- `FormSchema`: `successMessage` y `errorMessage` ya son canónicos.
- `custom-field-engine.ts` valida integridad y referencias, pero no evalúa condiciones en runtime.
- Los React adapters de widgets de formulario solo representan controles y previenen submit; todavía no ejecutan `CmsBackend.forms`.

Reglas M11.2:

- Crear un runtime de dominio reutilizable para validación/condiciones; no incrustar reglas de negocio en `FormManager`.
- Los controles mapeados deben heredar/respetar la validación del Custom Field destino para mantener paridad cliente/destino.
- Los controles no mapeados deben validar tipo y `required`; ampliar schema solo si es necesario y compatible con proyectos existentes.
- Evaluar `FormControl.conditions` determinísticamente usando valores del mismo formulario.
- Mostrar errores junto al campo y mover foco al primer error en la experiencia de prueba/ejecución.
- Mantener `successMessage`/`errorMessage` como única fuente persistida de mensajes.
- No adelantar multipaso/borradores (M11.3), acciones post-submit (M11.4) ni seguridad/spam (M11.5).
- No iniciar M11.3 antes del gate completo de M11.2.

## Próximo paso exacto

Implementar primero el runtime puro de M11.2 con pruebas de tipo, required, reglas del Custom Field y condiciones; después conectarlo al builder mediante una experiencia de configuración/preview accesible y finalmente pasar lint + typecheck + suite completa + build + auditoría Chromium.
