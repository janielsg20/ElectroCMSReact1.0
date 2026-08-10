# DETAILED EXECUTION PHASES

Formato: `entrada → trabajo → evidencia de salida`. Cada microfase debe dejar pruebas y documentación acordes a su riesgo.

## F00 — Descubrimiento y contrato documental

### M00.1 — Fundación documental y auditoría de alcance

- Entrada: prompt maestro Flutter original.
- Trabajo: convertir plataforma a React/Tailwind, crear reglas, memoria, tracking y plan.
- Salida: 33 secciones preservadas; documentos canónicos enlazados.

### M00.2 — Inventario de la referencia React

- Inventariar rutas, componentes, estados, modelos, persistencia, previews y exportadores existentes.
- Clasificar cada capacidad: completa, parcial, simulada, ausente o defectuosa.
- Salida: `REFERENCE_INVENTORY.md` y evidencia por archivo; si no existe código, bloqueo explícito.

### M00.3 — Matriz de cobertura y equivalencias

- Mapear referencia React → arquitectura React objetivo y secciones 1–33 → fases/microfases.
- Registrar sustituciones sin pérdida funcional.
- Salida: `REQUIREMENTS.md` sin requisitos huérfanos.

### M00.4 — Arquitectura y ADR iniciales

- Definir límites de dominio, UI, infraestructura, persistencia, preview y exportadores.
- Seleccionar dependencias mediante criterios documentados, no por conveniencia.
- Puerta G0: alcance completo, riesgos y criterios de aceptación trazables.

## F01 — Plataforma React/Tailwind y arquitectura modular

### M01.1 — Scaffold y calidad

- Crear React + TypeScript estricto + Tailwind, scripts de lint, typecheck, test y build.
- Salida: aplicación mínima accesible y pipeline local verde.

### M01.2 — Capas y contratos

- Crear paquetes o módulos para dominio, aplicación, infraestructura, UI y exportación.
- Añadir pruebas que impidan dependencias circulares o inversiones de capa.

### M01.3 — Tokens y primitives

- Implementar tokens semánticos, reset, tipografía, iconos SVG y primitives accesibles.
- Validar light/dark, focus visible, reduced motion y targets táctiles.

### M01.4 — PWA y adaptadores de plataforma

- Preparar funcionamiento instalable/offline sin acoplar dominio a Service Worker o envolturas.
- Documentar contratos futuros para desktop y móvil.
- Puerta G1: build reproducible y núcleo ejecutable sin red.

## F02 — Modelo canónico, esquemas y migraciones

### M02.1 — Identidad y versionado

- Definir IDs, timestamps, metadatos, versiones de esquema y envelopes de proyecto.
- Probar serialización determinista y validación.

### M02.2 — Documentos, nodos y propiedades responsive

- Modelar árboles, slots, estilos, bindings, condiciones, componentes globales y breakpoints.
- Probar invariantes, ciclos, referencias rotas y herencia.

### M02.3 — Modelos CMS y backend

- Modelar CPT, taxonomías, campos, registros, consultas, formularios, roles, menús y pantallas.
- Probar relaciones 1:1, 1:N y N:N.

### M02.4 — Migraciones

- Crear registry de migraciones forward, backup previo y diagnóstico de versiones incompatibles.
- Salida: fixtures de al menos dos versiones y recuperación probada.

## F03 — Persistencia local-first, proyectos e historial

### M03.1 — Repositorios locales

- Implementar almacenamiento transaccional/indexado con abstracción de repositorio.
- Probar cierre/reapertura, errores de cuota y corrupción detectable.

### M03.2 — Ciclo de proyecto

- Crear, duplicar, renombrar, archivar, eliminar, recuperar, importar y exportar proyectos.
- Añadir confirmación, undo o recuperación para operaciones destructivas.

### M03.3 — Guardado incremental y recuperación

- Implementar autosave debounce, snapshots, journal y recuperación tras cierre inesperado.
- Probar fallos durante escritura sin pérdida del último estado válido.

### M03.4 — Command bus e historial

- Implementar comandos reversibles, transacciones compuestas y límites configurables.
- Probar undo/redo, ramas nuevas e historial persistente.

## F04 — Application shell, navegación y workspaces responsive

### M04.1 — Shell desktop

- Header, navegación, panel izquierdo, canvas, inspector y status bar redimensionables.
- Persistir posición, orden, visibilidad y anchuras del workspace.

### M04.2 — Shell tablet

- Rail contraído, un panel persistente y overlays accesibles para panel secundario.
- Verificar landscape/portrait y restauración de foco.

### M04.3 — Shell móvil

- Canvas prioritario; navegación compacta; paneles como sheets o pantallas completas.
- Ninguna función desaparece; verificar 320/375 px sin overflow de página.

### M04.4 — Navegación, rutas y shortcuts

- URLs profundas, back predecible, breadcrumbs donde aplique, command palette y atajos documentados.
- Probar teclado, lector de pantalla y preservación de estado.

### M04.5 — Temas del editor

- Implementar claro, oscuro, automático y presets del prompt con tokens, no valores dispersos.
- Probar contraste y densidad por preset.

## F05 — Motor de documentos, nodos y canvas

### M05.1 — Operaciones del árbol

- Insertar, mover, anidar, agrupar, copiar, pegar, duplicar, bloquear, ocultar y renombrar.
- Probar invariantes y selección múltiple.

### M05.2 — Canvas y renderer

- Renderizar el modelo canónico con aislamiento de errores y actualizaciones granulares.
- Medir que cambios locales no rerendericen todo el árbol.

### M05.3 — Drag/drop y alternativas accesibles

- Drag real con umbral, indicadores, autoscroll, teclado y menús “mover a/antes/después”.
- Probar pointer, touch y teclado por separado.

### M05.4 — Direct manipulation

- Resize, guías, reglas, snapping, espaciado, breadcrumbs y menú contextual.
- Toda acción debe generar comando reversible.

### M05.5 — Selección, zoom y viewport

- Zoom, pan, orientación, device frames y foco entre canvas/paneles.
- Validar focus no oculto y región bidimensional contenida.

## F06 — Registro de widgets y biblioteca

### M06.1 — Contrato de widget

- Definir schema, defaults, renderer, inspector, icono, migraciones y soporte por exportador.
- Rechazar widgets incompletos o incompatibles de forma diagnosticable.

### M06.2 — Estructurales y básicos

- Implementar todos los elementos estructurales y básicos de la sección 9 con pruebas.

### M06.3 — Contenido y dinámicos

- Implementar tarjetas, listings, relaciones, metadata, campos calculados y condicionales.

### M06.4 — Comercio, formularios y filtros

- Implementar widgets declarativos para comercio, formularios y filtros, sin simular backends.

### M06.5 — UX de biblioteca

- Búsqueda, categorías, filtros, favoritos, recientes, miniaturas, guardados e inserción por clic/drag.

## F07 — Inspector, estilos y responsive

### M07.1 — Inspector generado por schema

- Generar secciones Contenido, Estilo, Layout, Responsive, Datos, Condiciones, Animaciones, Accesibilidad y Avanzado.

### M07.2 — Controles y validación

- Implementar controles tipados, defaults seguros, errores inline, reset e historial.

### M07.3 — Motor de estilos

- Resolver tokens, clases, estados, CSS seguro, herencia y salida determinista.

### M07.4 — Motor de breakpoints

- Editar, crear, ordenar y heredar breakpoints; resetear overrides y previsualizar orientación.

### M07.5 — Datos, condiciones y accesibilidad

- Bindings, visibilidad y atributos ARIA con validación y diagnóstico.

## F08 — Temas, plantillas y paquetes

### M08.1 — Tres ámbitos de tema

- Separar editor, frontend y backend con tokens independientes.

### M08.2 — Presets visuales

- Implementar todos los presets enumerados en secciones 11–12 y validar AA.

### M08.3 — Motor de plantillas

- Páginas, headers, footers, single, archive, 404, componentes globales y condiciones.

### M08.4 — Paquetes theme

- Crear, editar, duplicar, versionar, importar, exportar y seleccionar partes sin sobrescritura accidental.

## F09 — Contenido dinámico, CPT, taxonomías y campos

### M09.1 — CPT

- CRUD de tipos, capacidades, soportes, visibilidad y plantillas single/archive.

### M09.2 — Taxonomías

- Jerárquicas/no jerárquicas, asociaciones múltiples, campos y archivos.

### M09.3 — Campos personalizados

- Implementar todos los tipos de sección 14, incluido repeater, grupo, relación, calculado y condicional.

### M09.4 — Registros y relaciones

- CRUD, validación, borradores, revisiones y relaciones con integridad referencial.

### M09.5 — Binding dinámico

- Conectar contenido a widgets y previsualizar estados vacío/error/loading.

## F10 — Consultas, listings y filtros

### M10.1 — AST de consultas

- AND/OR, campos, taxonomía, autor, fecha, orden, límites, offset, relaciones y repeaters.

### M10.2 — Constructor visual y preview

- Edición accesible, validación, diagnóstico, consultas guardadas y resultados virtualizados.

### M10.3 — Listings y grids

- Plantillas repetibles, paginación, estados y bindings.

### M10.4 — Filtros inteligentes

- Todos los tipos y modos de sección 17, URL, estado persistente y contador.

### M10.5 — Composición y rendimiento

- Filtros combinados, caché, cancelación, debounce e indexación medidos.

## F11 — Formularios y acciones

### M11.1 — Builder y campos

- Todos los campos, layout, mapeo y edición por teclado/puntero/touch.

### M11.2 — Validación y condiciones

- Cliente/destino, mensajes accesibles, foco al primer error y campos condicionales.

### M11.3 — Multipaso y borradores

- Progreso, back, autosave, recuperación y confirmación al descartar.

### M11.4 — Pipeline de acciones

- Guardar/crear/actualizar, usuarios, login, local, redirect, relaciones, archivos y webhooks opcionales.

### M11.5 — Seguridad y contratos de exportación

- CSRF en destinos, sanitización, límites y matriz de compatibilidad.

## F12 — Backend visual, usuarios, roles y permisos

### M12.1 — Shell administrativo editable

- Header, sidebar, navegación y dashboard sobre el mismo motor de plantillas.

### M12.2 — CRUD y vistas

- Tablas, forms, detalle, calendario, kanban, métricas, filtros, bulk y saved views.

### M12.3 — RBAC

- Roles, capacidades, permisos de campo/acción/ruta y denegación por defecto.

### M12.4 — Contexto de usuario

- Menús y pantallas adaptados a rol sin filtrar datos no autorizados.

### M12.5 — Auditoría

- Registro de acciones, cambios, actor y exportación de auditoría.

## F13 — Media y proyectos predeterminados

### M13.1 — Biblioteca multimedia

- Importar, buscar, carpetas/etiquetas, metadatos, variantes, alt y deduplicación.

### M13.2 — Seguridad y rendimiento de media

- MIME real, tamaño, rutas, thumbnails, WebP/AVIF, lazy load y cuotas.

### M13.3 — Blueprints predeterminados

- Implementar los 20 tipos de proyecto de sección 19 como modelos versionados.

### M13.4 — Tienda demo única y editable

- Identidad, claim, colores, producto y dashboard comparten un único estado entre workspaces.

### M13.5 — professionalStudio

- Etiquetar Demo interactiva, Modelado portable y Planificado; preservar manifiesto por destino.

## F14 — Preview y exportación local/React

### M14.1 — Contrato común de render

- Preview y generadores consumen modelo canónico y fixtures compartidos.

### M14.2 — Preview frontend/backend

- Estados, breakpoints, roles, rutas y datos editados sin bifurcar el proyecto.

### M14.3 — Paquete local

- Exportar/reimportar con assets, manifest, integridad, storefront y admin offline enlazados.

### M14.4 — Generador React

- Proyecto legible, instalable, editable, compilable, desplegable y sin secretos/datos falsos permanentes.

### M14.5 — Equivalencia visual y diagnósticos

- Golden/screenshot, matriz widget-destino y bloqueo ante pérdida silenciosa.

## F15 — Exportación LAMP

### M15.1 — Contrato e instalador

- Requisitos, configuración segura, esquema y migraciones idempotentes.

### M15.2 — Frontend y autenticación

- Rutas, templates, sesiones, hashing y controles de acceso.

### M15.3 — CRUD y contenido dinámico

- CPT, campos, taxonomías, relaciones, consultas, forms y filtros persistentes.

### M15.4 — Media y seguridad

- Uploads, MIME, CSRF, XSS, SQL parametrizado, path traversal y permisos.

### M15.5 — Prueba instalable

- Instalar desde cero, operar demo editada y comparar con preview.

## F16 — Exportación WordPress

### M16.1 — Theme

- `style.css`, `functions.php`, templates, assets, headers, footers, single, archive y 404.

### M16.2 — Plugin companion

- CPT, taxonomías, campos, forms, filtros, consultas, endpoints, roles y menús sin plugins obligatorios.

### M16.3 — Instalación y migración

- Activación idempotente, versionado, desinstalación segura y contenido inicial opcional.

### M16.4 — Seguridad WordPress

- Nonces, capabilities, sanitización, escaping, consultas y uploads.

### M16.5 — Equivalencia

- Instalar theme+plugin, operar demo editada y comparar contra preview.

## F17 — Seguridad, accesibilidad y rendimiento transversal

### M17.1 — Threat model

- Importaciones, código personalizado, rutas, exportadores, archivos, auth y supply chain.

### M17.2 — Auditoría WCAG 2.2 AA

- Teclado, screen reader, contraste, reflow, zoom, foco, drag alternativo, errores y reduced motion.

### M17.3 — Presupuestos de rendimiento

- Bundle, inicio, input, frame, memoria, proyectos grandes, listas y canvas.

### M17.4 — Hardening y recuperación

- Corrupción, backups, verificación de paquetes, migraciones fallidas y diagnósticos.

## F18 — Pruebas, aceptación, documentación y entrega

### M18.1 — Matriz de pruebas obligatorias

- Cubrir cada punto de sección 27 con unit, integration, browser y export-install tests.

### M18.2 — Criterios 1–25

- Adjuntar evidencia reproducible por criterio; lo no probado permanece incompleto.

### M18.3 — Documentación final

- Completar todos los archivos de sección 30, instalación, compilación y exportación.

### M18.4 — Proyectos demo y destinos

- Ejecutar el mismo proyecto editado en Local, React, LAMP y WordPress.

### M18.5 — Release candidate

- Lint, typecheck, tests, build, accesibilidad, seguridad y rendimiento sin bloqueos.
- Puerta G5: entregables de sección 31 completos y sin funciones simuladas.

# AMPLIACIÓN FLUTTERFLOW-PARITY

Las fases F19–F31 implementan `FLUTTERFLOW_PARITY_ADDENDUM.md`. Son posteriores a las dependencias existentes, no reabren F00–F18 y no cambian la microfase activa por su sola incorporación documental.

## F19 — Visual Builder avanzado y workspace

### M19.1 — Auditoría PARITY_GAP
- Entrada: Addendum + implementación real acumulada en F00–F18.
- Trabajo: clasificar builder, pages, tree, canvas, inspector, responsive y ventanas como completa/parcial/ausente/bloqueada.
- Salida: matriz trazable sin duplicar capacidades existentes.

### M19.2 — Selection Manager central
- Crear selección única para page/node/multiselect/hover/editing/insertion target.
- Sincronizar Canvas ↔ Widget Tree ↔ Inspector ↔ Breadcrumbs.
- Pruebas de selección, foco, eliminación y selección inválida.

### M19.3 — Page Manager y Page Selector
- CRUD, carpetas, rutas, params, favoritos, recientes, página inicial y cambio rápido.
- Preservar permisos, SEO y metadata sin duplicar modelos existentes.

### M19.4 — Widget Tree profesional
- Expand/collapse, rename, visibility, lock, reorder, nesting, copy/paste y búsqueda.
- Drag con alternativa por clic/teclado.

### M19.5 — Canvas avanzado
- Viewports, zoom/pan/fit/center, grids, rulers, guides, snapping, safe areas y orientaciones.
- Toda mutación pasa por Command Bus.

### M19.6 — Workspace persistente y ventanas
- Consolidar dock left/right, floating, minimized, pinned, resize, snap y restore.
- Persistir layout por proyecto/usuario local y eliminar overrides UI redundantes.

### M19.7 — Builder móvil/tablet
- Móvil: Topbar + Canvas + Widgets/Pages/Canvas/Properties/More + tool sheets.
- Tablet: rail compacto, panel contextual y overlays accesibles.
- Verificar 320/375/768/landscape, safe areas, teclado y touch.

### M19.8 — Puerta G6-A
- Lint/typecheck/tests/build + browser + accesibilidad.
- Sin overflow, funciones simuladas ni fuentes de verdad duplicadas.

## F20 — Component System y Design System

### M20.1 — Modelo de componentes
- Parameters tipados, defaults, required, slots, callbacks, variants y lifecycle.

### M20.2 — Component State y bindings
- Estado interno, actions, backend bindings y herencia sin romper instancias.

### M20.3 — Component Studio
- Canvas, Tree, Parameters, State, Actions, Variants, Slots y Preview.

### M20.4 — Design System Manager
- Colors, typography, spacing, radius, borders, shadows, icons, assets, breakpoints y variants.

### M20.5 — Migración y actualización de instancias
- Cambios compatibles/incompatibles, diagnósticos, migrations y referencias.

### M20.6 — Validación
- Pruebas de instancias, slots, callbacks, state y tokens; cero hardcodes evitables.

## F21 — Data Types, State y Set From Variable

### M21.1 — Tipos universales
- String, Number, Boolean, Date/DateTime, Color, File/Image, Enum, Object, List, Map, Reference.

### M21.2 — Custom Data Types
- Builder visual, campos, nullable, defaults, lists, relations y validation.

### M21.3 — Enums y Constants
- CRUD, orden, metadata, tipos, environments y referencias seguras.

### M21.4 — State scopes
- Widget, Component, Page, App, Session y Persistent State.

### M21.5 — Set From Variable
- Fuente estática, state, params, auth user, query, API, record, function, output, constant y conditional.

### M21.6 — Conditional Value Builder
- If/Else/Else If, AND/OR/NOT y comparadores tipados con diagnóstico.

### M21.7 — Persistencia y pruebas
- Migraciones, recovery y tests de resolución/reactividad sin ciclos.

## F22 — Action Flow, Graph y App Events

### M22.1 — Modelo y registro de acciones
- Trigger/action schemas versionados, inputs/outputs y validación.

### M22.2 — Triggers
- Click, double click, long press, hover, change, submit, focus/blur, page/component lifecycle.

### M22.3 — Acciones base
- Navigation, dialogs/sheets, state, variables, notices, delay y loops.

### M22.4 — Acciones de datos
- Query/API/CRUD/upload/download y outputs tipados.

### M22.5 — Conditional branches y errores
- True/false/error paths, retries cuando proceda y cancelación.

### M22.6 — Action Graph Editor
- Nodes, edges, zoom, pan, reconnect, duplicate, delete e inspector.

### M22.7 — App Events
- Event Bus visual con parameters, scope, trigger/listen/unsubscribe.

### M22.8 — Command Bus y pruebas
- Edición del graph reversible; runtime probado sin mezclar editor/runtime.

## F23 — Database Builder y Backend Queries

### M23.1 — DataProvider contract
- Interfaz desacoplada; ningún widget depende de proveedor concreto.

### M23.2 — Provider local
- Integrar IndexedDB/local actual mediante adapter común.

### M23.3 — Database Schema Builder
- Tables/collections, fields, indexes, defaults y validation.

### M23.4 — Relaciones
- 1:1, 1:N, N:N con integridad y migrations.

### M23.5 — Backend Queries
- Single/list/count/aggregate/pagination/filter/sort/relations.

### M23.6 — Bindings a página/widget/componente
- Loading/empty/error/success y cancelación.

### M23.7 — Adapters futuros
- Contratos para REST, MySQL/LAMP, WordPress y SQLite sin volverlos obligatorios.

### M23.8 — Tests
- Integridad, consultas, paginación, fallos y compatibilidad local-first.

## F24 — API Manager

### M24.1 — Modelo y grupos
- GET/POST/PUT/PATCH/DELETE, folders/groups y environments.

### M24.2 — Request Builder
- URL, headers, path/query params, body, auth y variables.

### M24.3 — API Tester
- Ejecutar request; mostrar response/status/headers/duration/errors sin filtrar secretos.

### M24.4 — Response Mapping
- JSON path, type, nullable, list y transform.

### M24.5 — Set From Variable integration
- Exponer respuestas y outputs tipados.

### M24.6 — Action/Backend Query integration
- APIs como acción y fuente de datos declarativa.

### M24.7 — Seguridad y tests
- CORS/configuración, timeouts, cancelación, redaction y pruebas.

## F25 — Authentication, RBAC y seguridad

### M25.1 — AuthProvider
- Contrato provider-agnostic y sesiones.

### M25.2 — Local Auth
- Registro/login/logout/reset/session restore local seguro.

### M25.3 — Custom REST y WordPress adapters
- Integraciones opcionales sin acoplar core.

### M25.4 — Roles/Permissions/Capabilities
- Pages, routes, widgets, actions, CMS y admin modules.

### M25.5 — Protected routes y visibility
- Denegación por defecto y condiciones por rol.

### M25.6 — Secrets y environments
- Secretos fuera del frontend y exports; redaction en debug.

### M25.7 — Security tests
- Authz/authn, session, injection, storage y export.

## F26 — Media, routing, storyboard, responsive y localization

### M26.1 — Media Manager ampliado
- Assets, folders, search, metadata, alt, optimize, replace, references y dedupe.

### M26.2 — Route Manager
- Paths, dynamic segments, params, query, redirects, protected routes y deep links.

### M26.3 — Storyboard
- Pages, routes, dialogs, transitions, zoom/pan y broken-route diagnostics.

### M26.4 — Responsive Property System avanzado
- inherit/override/reset para layout, visibility, typography, spacing y sizing.

### M26.5 — Animation Inspector
- Load/action/hover/transition/loop/conditional respetando reduced motion.

### M26.6 — Localization
- Locales, translation keys, preview locale y fallback.

### M26.7 — SEO y accessibility audit
- Metadata Web + auditoría WCAG integrada antes de exportar.

### M26.8 — Tests responsive/mobile
- Mobile/tablet/desktop, keyboard, touch, screen reader y reduced motion.

## F27 — Custom Code, dependencies, environments e integrations

### M27.1 — Custom Functions
- Funciones puras tipadas, inputs/outputs y tests.

### M27.2 — Custom Actions
- Async, outputs, error handling e integración Action Flow.

### M27.3 — Custom Components
- React custom components registrados mediante contrato seguro.

### M27.4 — Code Files y Code Editor
- Highlighting, diagnostics, references, formatting y typecheck/compile.

### M27.5 — Dependency Manager
- Package/version, compatibility, conflicts y security warnings.

### M27.6 — Environment Manager
- Development/Preview/Production y variables por entorno.

### M27.7 — Function/Integration adapters
- Backend functions y categorías auth/database/storage/payments/maps/analytics/email/messaging/AI/CMS/commerce.

### M27.8 — Sandbox/security
- Estrategia de aislamiento para código no confiable y supply-chain checks.

## F28 — Test Mode y Debug

### M28.1 — Runtime/Test Mode
- Separar editor del runtime ejecutable y conservar proyecto sin mutaciones accidentales.

### M28.2 — Debug Console
- Actions, events, API calls, state changes, errors, warnings y performance.

### M28.3 — State Inspector
- Scopes, valores, origen y updates observables.

### M28.4 — Action/API tracing
- Timeline correlacionada con redaction de secretos.

### M28.5 — Test Builder foundation
- Unit, Component, Integration y E2E con stable test IDs.

### M28.6 — Reports
- Resultados reproducibles, filtros y enlaces a elemento/acción.

### M28.7 — Puerta G7
- Tests del propio Test Mode/Debug y cero contaminación de producción.

## F29 — Versioning y Collaboration

### M29.1 — Named versions y checkpoints
- Extender History; no duplicar Command Bus.

### M29.2 — Restore
- Restore seguro, backup y compatibilidad de schema.

### M29.3 — Logical branch model
- projectVersionId, parentVersionId, branchName y reglas de divergencia.

### M29.4 — Comments
- Asociados a project/page/widget/component con open/resolved.

### M29.5 — Presence architecture
- Contratos futuros para cursors/presence sin dependencia online obligatoria.

### M29.6 — Collaboration roles y activity
- View/Edit y activity history auditable.

### M29.7 — Offline compatibility
- Modo local permanece completo cuando colaboración no existe.

## F30 — AI Builder, Agents y Command Palette

### M30.1 — AI command architecture
- Todo cambio AI produce comandos validados y reversibles.

### M30.2 — Generate page/component/layout/content
- Generación estructurada contra schemas, nunca JSX arbitrario como fuente de verdad.

### M30.3 — Modify selection
- Operaciones limitadas a selección y confirmables según riesgo.

### M30.4 — Generate Action Flow/schema/API mappings
- Salidas tipadas y validadas antes de persistir.

### M30.5 — Error explanation
- Diagnósticos con contexto sin ocultar error original.

### M30.6 — Agent registry
- UI, Accessibility, SEO, Database, API, Testing y Refactor con permisos explícitos.

### M30.7 — Command Palette
- Buscar pages/widgets/components/actions/variables/data/APIs/media/settings; objetivo Ctrl/Cmd+K.

### M30.8 — Seguridad y pruebas
- Ningún agent persiste directamente; tests de permisos, undo y entradas inválidas.

## F31 — Export ampliado y Deployment Center

### M31.1 — Project Settings central
- App/project IDs, icons, targets, environments, auth, integrations y dependencies.

### M31.2 — Export source ampliado
- Source, assets, config, schema, migrations y `.env.example` sin secretos.

### M31.3 — Build abstraction
- Un pipeline diagnosticable para Local, React, LAMP, WordPress y adapters futuros.

### M31.4 — Deployment Center
- Target, environment, build status, errors e history.

### M31.5 — Deployment adapters
- Local server, GitHub/Cloudflare, Vercel, FTP/SFTP, WordPress y custom server como adapters opcionales.

### M31.6 — Pre-deploy validation
- Lint, typecheck, tests, broken refs, accessibility, routes, API config, secrets y build.

### M31.7 — Production verification
- Smoke/E2E por target, rollback/diagnóstico cuando aplique y evidencia enlazada.

### M31.8 — Puerta G8 / aceptación ampliada
- Alcance de `FLUTTERFLOW_PARITY_ADDENDUM.md` trazable, probado y sin funciones simuladas.
- El resultado mantiene local-first y exportaciones existentes mientras añade capacidades avanzadas.
