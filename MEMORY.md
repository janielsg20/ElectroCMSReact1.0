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
- M11.4 `COMPLETADA` — Pipeline de acciones.
- Microfase activa: `M11.5 — Seguridad y compatibilidad de exportación`.
- F12–F31 permanecen pendientes salvo contratos anticipados que no cuentan como implementación formal.
- Producción no se despliega desde el PR draft #23.

## Última puerta verde

M11.4 cerró con GitHub Actions run `31665873773` (run #591) sobre `94f550b3a4cbf40f3ff9479c3a5d2736825bbf8a`:

- lint: verde.
- typecheck: verde.
- suite completa: verde.
- build: verde.
- auditoría Chromium: verde.
- browser audit artifact y PR preview artifact: verdes.
- Cloudflare preview usa el build validado.
- producción: skipped por PR draft.

## Formularios consolidados hasta M11.4

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

### Pipeline de acciones

- `FormActionSchema` conserva 12 kinds canónicos; no existe taxonomía paralela.
- `form-action-engine.ts`: valida una vez, mapea valores una vez, ejecuta secuencialmente y corta en el primer fallo.
- `form-action-catalog.ts`: nombres de usuario, configuración y referencias funcionales de las 12 acciones.
- `FormActionSettings`: añadir/configurar/reordenar/eliminar mediante controles ElectroCMS.
- Preview seguro ejecuta `show-message`, `save-local` y `redirect`; redirect no navega fuera del editor.
- Email/webhook/auth/upload u otra integración sin adapter real retorna `adapter-missing`; nunca simula éxito.
- `form-project-action-adapter.ts` implementa localmente `save-record`, `create-content`, `update-content` y `update-relation` reutilizando `record-relation-engine`.
- Acciones reales de contenido crean/actualizan registros y relaciones en una copia del `ProjectStructure`; los adapters de producción posteriores decidirán persistencia/transportes según destino.

## M11.5 activa — Seguridad y compatibilidad

Objetivo exacto: cerrar F11 con contratos portables de seguridad y una matriz honesta de compatibilidad por destino.

Reglas:

- Normalizar/validar payloads antes de adapters: controles conocidos, límites de tamaño y estructuras portables.
- Política de archivos: MIME, extensión y tamaño; la verificación final pertenece al destino/servidor.
- `csrfProtection` expresa exigencia portable para destinos con servidor; no generar tokens falsos en el editor local.
- Rate limiting, honeypot y CAPTCHA se modelan como requisitos/capacidades del destino; no fingir middleware inexistente.
- Escapar salida en renderer/exportador, no aplicar HTML escaping irreversible a valores almacenados.
- Matriz de compatibilidad Local/React/LAMP/WordPress debe reflejar el estado real y distinguir nativo, requiere adapter y todavía no implementado.
- UI en Formularios con lenguaje de usuario, divulgación progresiva y sin jerga de schemas/IDs.
- F11 no se marca completa hasta gate total de M11.5.

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

Implementar `form-security-contract.ts` y `form-export-compatibility.ts` con pruebas; conectar `FormSecuritySettings` al builder, pasar gate completo de M11.5, cerrar F11 y saltar directamente a F12 sin preguntar.
