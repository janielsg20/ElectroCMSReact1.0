# TRACKING — ElectroCMS

Actualizado: 2026-08-13.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F12 — Backend visual, usuarios y permisos`.
- Microfase actual: `M12.1 — Shell administrativo editable`.
- Estado: `EN_CURSO — gate final en validación`.
- F00–F11: `COMPLETADA`.
- F12: M12.1 activa; M12.2–M12.5 `NO_INICIADA`.
- F13–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.
- Producción no se despliega desde el PR draft #23.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00–F08 | COMPLETADA | Base, plataforma, editor, widgets, inspector y temas |
| F09 | COMPLETADA | CPT, taxonomías, campos, registros/relaciones y binding CMS |
| F10 | COMPLETADA | Consultas, constructor visual, listings, filtros y rendimiento |
| F11 | COMPLETADA | Formularios, validación, multipaso, acciones y seguridad portable |
| F12 | EN_CURSO | M12.1 Shell administrativo editable en gate final |
| F13–F18 | NO_INICIADA | Roadmap base restante |
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

## F11 completada — Formularios y acciones

### M11.1 — Builder y campos

- `FormManager` usa `ProjectStructure.cms.forms`; no existe store/schema paralelo.
- 27 tipos de campo, mapping visual solo a Custom Fields compatibles y orden canónico en `FormStep.controlIds`.
- DnD + botones alternativos con teclado/puntero/touch.
- `ChoiceField` compartido con portal y navegación completa por teclado.
- Puerta: run `31659028320`, 92 archivos / 380 pruebas, build/Chromium verdes.

### M11.2 — Validación y lógica condicional

- `form-runtime.ts` valida `required`, tipos, formatos y restricciones heredadas.
- Condiciones `all/any`; campos ocultos no generan errores.
- Errores inline + foco al primer inválido.
- `FieldConditionEditor` visual compartido por Formularios y Campos personalizados.
- Puerta: run `31660891827` / #559 verde.

### M11.3 — Multipaso y borradores

- `Form.steps` permanece como única definición persistente de progresión.
- `form-step-runtime.ts` renombra, divide, mueve y fusiona pasos preservando invariantes.
- `FormStepSettings` + preview Paso N/M, Atrás/Siguiente y validación por paso.
- Borradores `v1` en localStorage solo cuando `draftSaving=true`, recuperación y descarte confirmado.
- Puerta: run `31664445460`, 98 archivos / 400 pruebas, build/Chromium verdes; 20 estados, 0 overflow, 0 touch targets <44×44, 0 excepciones/consola.

### M11.4 — Pipeline de acciones

- 12 `FormAction` canónicas; catálogo único con configuración y referencias funcionales.
- Pipeline secuencial: valida/mapea una vez y corta ante fallo o adapter ausente.
- Editor visual para añadir/configurar/reordenar/eliminar acciones.
- Preview seguro: mensaje, local y redirect sin navegación real.
- Adapter local real para guardar/crear/actualizar contenido y actualizar relaciones reutilizando motores M09.
- Integraciones externas sin adapter nunca simulan éxito.
- Puerta: run `31665873773` / #591 verde.

### M11.5 — Seguridad y compatibilidad de exportación

- `form-security-contract.ts`: normalización portable, controles conocidos, límites de bytes/strings/colecciones/profundidad y política de archivos por tamaño/MIME/extensión.
- No se aplica HTML escaping irreversible al valor almacenado; el escape de salida pertenece al renderer/exportador.
- El pipeline ejecuta `prepareSecureFormPayload` antes del mapping y antes de cualquier adapter; payload inseguro produce `security-failed`.
- `csrfProtection` es requisito portable para destinos con servidor; el editor no fabrica tokens.
- Requisitos declarados: revalidación del servidor, rate limit, honeypot, escape de salida, revalidación de archivos y CAPTCHA opcional.
- `form-export-compatibility.ts` mantiene matriz honesta Local/React/LAMP/WordPress: vista previa/contrato, adapter requerido o exportador pendiente; no declara exportadores futuros como terminados.
- `FormSecuritySettings` permite editar CSRF y explica seguridad/destinos con lenguaje de usuario; no expone fases internas.
- Contratos de seguridad/compatibilidad exportados por la API pública.

### Puerta final M11.5 / F11

GitHub Actions run `31666856391` (run #608) sobre el head validado de M11.5:

- lint: `VERDE`.
- typecheck: `VERDE`.
- suite completa: `VERDE`.
- build Vite: `VERDE`.
- Chromium browser audit: `VERDE`.
- browser audit artifact: `VERDE`.
- PR preview build artifact: `VERDE`.
- Cloudflare PR preview: `VERDE`.
- producción: `SKIPPED` por PR draft.

**F11: COMPLETADA.**

## F12 — Backend visual, usuarios y permisos

### M12.1 activa — Shell administrativo editable

Objetivo: crear un shell administrativo visual y persistente con header, sidebar, navegación y dashboard, usando el mismo motor de documentos/nodos/plantillas del frontend.

Decisiones de arquitectura:

- `BackendScreen.documentId` enlaza cada pantalla administrativa con un `Document` normal; no se crea otro canvas ni otro árbol de nodos.
- `Menu` / `MenuItem` siguen siendo la fuente canónica de navegación administrativa.
- Header/sidebar/dashboard se modelan con documentos/componentes existentes y referencias del CMS; no se crea un segundo motor visual.
- `backend-shell-engine.ts` mantiene creación/edición/eliminación de la pantalla y su navegación como una sola mutación validada.
- `BrowserEditorProjectSession` expone esas mutaciones exclusivamente mediante `ProjectStructureCommand` + `ProjectCommandBus`.
- `BackendScreen.kind` admite `custom` además de las vistas administrativas estructuradas para representar shells y dashboards libres sin crear otro schema.
- M12.1 no adelanta CRUD adaptable de M12.2 ni RBAC/contexto/auditoría de M12.3–M12.5.
- UI de backend debe ser responsive, High Density + Minimal Clean, con controles ElectroCMS y targets táctiles >=44 px.

Criterio de salida de M12.1:

- Shell administrativo editable y persistente.
- Header, sidebar/navegación y dashboard representados por contratos canónicos existentes.
- Un BackendScreen puede abrir su mismo `Document` en el editor visual.
- Navegación administrativa editable sin IDs técnicos en flujo principal.
- Gate completo: lint + typecheck + suite + build + Chromium.

### Validación M12.1

- Los errores iniciales de integración (schema `custom`, sesión administrativa y tipado de menús) fueron corregidos antes del gate final.
- El gate final se ejecuta sobre una rama limpia sin workflows/scripts temporales de parcheo.

## Bloqueos

- Ninguno técnico conocido para M12.1.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde: lint + typecheck + suite completa + build + auditoría Chromium. Desde F09, la fase tampoco se cierra sin auditoría visual real y corrección de inconsistencias UI/UX/layout detectadas.

## Documentos de control

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md` y `UX_SIMPLICITY_SYSTEM.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Memoria corta: `MEMORY.md`.
- Backend: `BACKEND_BUILDER.md`.
- Historial: `CHANGELOG.md`.
