# TRACKING — ElectroCMS

Actualizado: 2026-08-12.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F11 — Formularios y acciones`.
- Microfase actual: `M11.4 — Pipeline de acciones`.
- Estado: `EN_CURSO`.
- F00–F10: `COMPLETADA`.
- F11: M11.1 `COMPLETADA`; M11.2 `COMPLETADA`; M11.3 `COMPLETADA`; M11.4 activa; M11.5 `NO_INICIADA`.
- F12–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.
- Producción no se despliega desde el PR draft #23.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00–F08 | COMPLETADA | Base, plataforma, editor, widgets, inspector y temas |
| F09 | COMPLETADA | CPT, taxonomías, campos, registros/relaciones y binding CMS |
| F10 | COMPLETADA | Consultas, constructor visual, listings, filtros y rendimiento |
| F11 | EN_CURSO | M11.1–M11.3 completadas; M11.4 Pipeline de acciones activa |
| F12–F18 | NO_INICIADA | Roadmap base restante |
| F19–F31 | NO_INICIADA | Paridad funcional ampliada |

## Arquitectura de navegación CMS/builder vigente

- Navegación principal orientada a tareas: grupos `Crear | Administrar | Apariencia`; destinos `Editor | Páginas | Contenido | Diseño`.
- `Capas` contiene exclusivamente el árbol/estructura del documento actual.
- `Widgets` contiene exclusivamente la biblioteca insertable.
- `Inspector` contiene propiedades del elemento seleccionado, incluidos datos dinámicos, con ayuda contextual y sin exponer claves internas como lenguaje principal.
- `Contenido` es el workspace global para tipos, clasificaciones, campos, entradas/relaciones, consultas y formularios.
- `Diseño` contiene apariencia global, temas y paquetes exportables.
- Móvil: `Widgets | Capas | Canvas | Props | Más`; `Más` abre módulos globales.
- Tablet: los paneles contextuales se retiran al abrir un módulo global.
- Regla transversal: `UX_SIMPLICITY_SYSTEM.md` exige divulgación progresiva, vocabulario de usuario y ayuda `ⓘ` con referencias funcionales conocidas cuando aporten aprendizaje.

## F09 completada

- M09.1 CPT: CRUD canónico, soportes/capacidades/visibilidad y plantillas Single/Archive.
- M09.2 Taxonomías: CRUD, términos, jerarquía y asociaciones bidireccionales.
- M09.3 Campos personalizados: 27 tipos, defaults, opciones, condiciones, relaciones, roles y campos compuestos.
- M09.4 Registros/relaciones: CRUD, revisiones portables, cardinalidad e integridad referencial.
- M09.5 Binding dinámico: `cms-record-field` / `cms-record-property`, preview ready/loading/empty/error e integridad.
- Puerta final F09: run `31560809320` verde.

## F10 completada — Consultas, listings y filtros

- `QuerySchema` sigue siendo el contrato canónico; Query Engine determinista con grupos, operadores, sort, offset/limit, métricas e índice seguro.
- `QueryManager` ofrece CRUD/preview persistido por Command Bus.
- Listings repiten plantillas por registro, paginan la ventana canónica y ejecutan la query una sola vez por página.
- Smart Filters: 11 tipos, realtime/apply, URL/localStorage, contador, pagination/load-more/reset.
- Debounce/cancelación, caché LRU e invalidación por identidad CMS.
- Gestores CMS pesados usan lazy loading; bundle principal sin warning >500 kB.
- Puerta final F10: run `31608617420`, 88 archivos / 364 pruebas, build/Chromium/preview verdes.

## M11.1 completada — Builder y campos

- `FormManager` usa `ProjectStructure.cms.forms`; no existe store/schema paralelo.
- 27 tipos de campo y mapping visual solo a Custom Fields compatibles.
- Layout canónico = orden de controles en `FormStep.controlIds`.
- Alta, edición, selección, DnD y botones alternativos para reordenar con teclado/puntero/touch.
- `ChoiceField` compartido con portal, colisión de viewport y navegación completa por teclado.
- Puerta final: run `31659028320` sobre `00c222e45dca83f18e717b9a08f8b5e016476d96`: 92 archivos / 380 pruebas, build y Chromium verdes, 0 overflow, 0 targets touch <44×44, 0 excepciones/consola, preview verde.

## M11.2 completada — Validación y lógica condicional

- `form-runtime.ts` evalúa `required`, tipos, formatos y restricciones heredadas del Custom Field destino.
- `FormControl.conditions` se evalúa determinísticamente: `all/any` dentro del grupo y grupos alternativos.
- Los controles ocultos no generan errores.
- Errores inline y foco programático al primer control inválido.
- `successMessage` / `errorMessage` siguen siendo la única fuente persistida de mensajes.
- `FieldConditionEditor` reemplaza JSON técnico y se reutiliza en Formularios y Campos personalizados.
- El builder bloquea condiciones autorreferenciales o cuyo campo origen no esté representado por otro control mapeado.
- Runtime de validación expuesto por la API pública del dominio.
- Puerta final M11.2: run `31660891827` (run #559), lint/typecheck/tests/build/Chromium y Cloudflare preview verdes; producción skipped por PR draft.

## M11.3 completada — Multipaso y borradores

- `Form.steps` permanece como única definición persistente de progresión; no se creó store paralelo.
- `form-step-runtime.ts`: renombrar, dividir, mover y fusionar pasos preservando orden e invariantes de controles.
- `FormStepSettings`: configuración visual de pasos y `draftSaving`, con controles ElectroCMS y confirmación al fusionar.
- `FormValidationPreview`: progreso accesible, Paso N de M, Atrás/Siguiente, validación del paso actual y comprobación final.
- `form-draft-storage.ts`: borrador versionado `v1` en `localStorage`, tolerante a corrupción/cuota y limitado a controles existentes.
- Autosave local solo cuando `draftSaving=true`; recuperación del último paso y valores al reabrir la vista de prueba.
- Descartar respuestas exige doble confirmación y limpia el borrador; no envía datos al CMS.
- Pruebas dedicadas cubren invariantes de pasos, round-trip/limpieza del storage, bloqueo por error, navegación, recuperación y descarte.

### Puerta final M11.3

GitHub Actions run `31664445460` sobre `3c0510fcea5a72d75a88d175ac830a8b1996ba75`:

- lint: `VERDE`.
- typecheck: `VERDE`.
- suite completa: `98 archivos / 400 pruebas VERDES`.
- build Vite: `VERDE`.
- Chromium browser audit: `VERDE`.
- 20 estados visuales auditados.
- horizontal overflow: `0`.
- targets táctiles <44×44: `0`, incluyendo `forms-mobile`.
- architecture errors: `0`.
- runtime exceptions: `0`.
- console warnings/errors de la app: `0`.
- preview artifact: `VERDE`; Cloudflare PR preview iniciado desde build validado.
- producción: `SKIPPED` por PR draft.

## M11.4 — alcance activo

Objetivo: ejecutar `Form.actions` en orden mediante un pipeline canónico y observable, sin simular integraciones externas inexistentes.

Reglas de implementación:

- Reutilizar `FormActionSchema`; no crear una segunda taxonomía de acciones.
- Pipeline secuencial y determinista; cada acción produce resultado/diagnóstico antes de continuar.
- Separar acciones resolubles localmente de capacidades que requieren adapter externo.
- Si falta un adapter real para email, webhook, autenticación, subida u otra integración, devolver diagnóstico explícito; nunca reportar éxito falso.
- Mapear valores de controles a Custom Fields una sola vez y conservar el resultado para acciones de contenido.
- Preparar acciones de guardar/crear/actualizar contenido, usuario/login, local, redirect, mensaje, relaciones, archivos y webhook según el contrato existente.
- UI del pipeline en Formularios con `ChoiceField`, orden explícito, configuración comprensible y divulgación progresiva.
- No implementar todavía seguridad/CSRF/sanitización/compatibilidad de exportadores propia de M11.5.
- No iniciar M11.5 antes de gate completo de M11.4.

## Bloqueos

- Ninguno técnico conocido para M11.4.
- Integraciones externas no conectadas deben representarse como capacidades no disponibles, no como bloqueos ocultos ni éxito simulado.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde: lint + typecheck + suite completa + build + auditoría Chromium. Desde F09, la fase tampoco se cierra sin auditoría visual real y corrección de inconsistencias UI/UX/layout detectadas.

## Documentos de control

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md` y `UX_SIMPLICITY_SYSTEM.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Memoria corta: `MEMORY.md`.
- Temas: `THEME_SYSTEM.md`; paquetes: `THEME_PACKAGE_SYSTEM.md`.
- CPT: `CONTENT_TYPE_SYSTEM.md`; taxonomías: `TAXONOMY_SYSTEM.md`; campos: `CUSTOM_FIELD_SYSTEM.md`.
- Registros/relaciones: `RECORD_RELATION_SYSTEM.md`; binding: `DYNAMIC_BINDING_SYSTEM.md`.
- Consultas: `QUERY_SYSTEM.md`; F10 consolidada: `F10_QUERY_LISTING_FILTER_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
