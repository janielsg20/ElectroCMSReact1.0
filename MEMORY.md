# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-12.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress. La experiencia final debe resultar familiar y sencilla para usuarios de WordPress, Elementor, ACF y la suite JetEngine, aunque la arquitectura interna sea avanzada.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura: `ARCHITECTURE.md`.
- UX: `UX_SIMPLICITY_SYSTEM.md`, `UI_UX_LAYOUT_SYSTEM.md` y `design-system/electrocms/MASTER.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F10 completadas.
- Fase activa: `F11 — Formularios y acciones`.
- M11.1 `COMPLETADA` — Builder y campos.
- M11.2 `COMPLETADA` — Validación y lógica condicional.
- M11.3 `COMPLETADA` — Multipaso y borradores.
- Microfase activa: `M11.4 — Pipeline de acciones`.
- M11.5 y F12–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Producción no se despliega desde el PR draft #23.

## Última puerta verde

M11.3 cerró con GitHub Actions run `31664445460` sobre `3c0510fcea5a72d75a88d175ac830a8b1996ba75`:

- lint: verde.
- typecheck: verde.
- suite completa: 98 archivos / 400 pruebas verdes.
- build: verde.
- auditoría Chromium: 20 estados, 0 overflow, 0 targets touch <44×44 —incluido `forms-mobile`—, 0 errores de arquitectura, 0 excepciones y 0 warnings/errors de consola.
- preview artifact: verde y Cloudflare preview lanzado desde build validado.
- producción: skipped por PR draft.

## Formularios consolidados hasta M11.3

### Builder

- `FormManager` vive en `Contenido → Formularios` y usa `CmsBackend.forms`; no existe store/schema paralelo.
- 27 tipos de campo disponibles.
- Layout canónico = orden de controles en `FormStep.controlIds`.
- Mapeo visual solo hacia Custom Fields compatibles.
- Añadir, seleccionar, editar, reordenar y eliminar funciona con puntero, touch y teclado; DnD conserva botones alternativos.
- `ChoiceField` es el selector ElectroCMS compartido: portal al body, límites del viewport, click exterior, Escape, flechas, Home/End, Tab y retorno de foco.

### Validación y condiciones

- `form-runtime.ts` valida `required`, tipo, formato y restricciones heredadas del Custom Field destino.
- `FormControl.conditions` usa grupos `all/any`; múltiples grupos funcionan como alternativas.
- Controles ocultos no generan errores.
- Errores junto al campo y foco al primer inválido.
- `successMessage`/`errorMessage` son la única fuente persistida de mensajes.
- `FieldConditionEditor` reemplazó el JSON técnico y se reutiliza en Formularios y Campos personalizados.
- El builder impide condiciones autorreferenciales o sin control origen mapeado.

### Multipaso y borradores

- `Form.steps` es la única definición persistente de progreso.
- `form-step-runtime.ts` renombra, divide, mueve y fusiona pasos preservando invariantes.
- `FormStepSettings` permite configurar pasos y `draftSaving` visualmente.
- `FormValidationPreview` muestra progreso, Paso N/M, Atrás/Siguiente y valida el paso actual antes de avanzar.
- `form-draft-storage.ts` guarda borradores de respuestas versionados `v1` en localStorage solo cuando `draftSaving=true`.
- Recuperación restaura valores y último paso; descarte exige confirmación y limpia el borrador.
- Los borradores de respuestas son estado transitorio local y no duplican `ProjectStructure`.

## M11.4 activa — Pipeline de acciones

Objetivo exacto: ejecutar `Form.actions` secuencialmente usando el contrato existente y adapters explícitos para capacidades externas.

Reglas:

- `FormActionSchema` sigue siendo la única taxonomía canónica.
- Ejecutar acciones en orden y detener/diagnosticar fallos determinísticamente.
- Mapear controles a Custom Fields una sola vez por submit.
- Acciones externas sin adapter real deben fallar con diagnóstico; nunca fingir éxito.
- Cubrir los kinds existentes: `save-record`, `create-content`, `update-content`, `register-user`, `sign-in`, `send-email`, `save-local`, `redirect`, `show-message`, `webhook`, `update-relation`, `upload-file`.
- UI de acciones dentro de Formularios con orden, configuración comprensible, controles ElectroCMS y divulgación progresiva.
- M11.5 queda fuera hasta que M11.4 tenga gate completo.

## Regla de calidad

- Cada microfase pasa lint + typecheck + suite completa + build antes de avanzar.
- Al cerrar microfases de UI/runtime, ejecutar además auditoría Chromium sobre producción compilada.
- Browser audit cubre desktop/tablet/móvil, overflow, targets touch, arquitectura, excepciones y consola.
- `assert-browser-audit.mjs` bloquea CI si cualquier estado touch auditado contiene un target <44×44 CSS px.
- No cerrar una fase solo porque compile.

## Decisiones vigentes

- `ProjectStructure` es la única fuente de verdad; `ProjectStructure.cms` contiene el backend CMS.
- Dominio/modelo independientes de React, Tailwind, almacenamiento y exportadores.
- Toda mutación persistente usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro history global.
- Undo/redo persiste en IndexedDB.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History, Query, Forms ni Export.
- Estado local de UI/preferencias o borradores de respuestas no duplica el proyecto.
- Funciones futuras no se muestran como activas.
- Simplificar UX nunca crea un store/modelo alternativo ni elimina funcionalidad.

## UI/UX vigente

- High Density + Minimal Clean, orientado a tareas de CMS visual en vez de exponer un IDE.
- Targets: ~44 px touch / ~36 px escritorio denso.
- Navegación principal: `Crear | Administrar | Apariencia`; destinos `Editor | Páginas | Contenido | Diseño`.
- `Capas`: exclusivamente árbol/estructura del documento actual.
- `Widgets`: exclusivamente biblioteca insertable.
- `Inspector`: propiedades del elemento seleccionado con vocabulario común y ayudas contextuales.
- `Contenido`: tipos, clasificaciones, campos, entradas/relaciones, consultas y formularios.
- Móvil conserva `Widgets | Capas | Canvas | Props | Más`; `Más` contiene módulos globales.
- Divulgación progresiva obligatoria; parámetros técnicos poco frecuentes van a avanzado.
- No usar nombres de schemas, AST, stores, IDs internos, fases o microfases como lenguaje principal del producto.

## F09/F10 consolidadas

- F09: CPT, taxonomías, 27 tipos de campo, registros/revisiones/relaciones y binding CMS completos.
- F10: Query Engine, QueryManager, listings, 11 Smart Filters, debounce/cancelación, caché LRU, índice seguro y lazy loading completados.
- Bundle principal sin warning >500 kB antes de iniciar F11.

## Próximo paso exacto

Implementar primero un ejecutor puro de acciones para M11.4 con resultado por acción, mapping único de valores y adapters explícitos; probar orden, corte en fallo y ausencia de adapters. Después conectar constructor/orden de acciones al `FormManager`, pasar gate completo y saltar a M11.5 sin preguntar.
