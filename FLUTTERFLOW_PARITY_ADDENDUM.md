# ADDENDUM MAESTRO — PARIDAD FUNCIONAL TIPO FLUTTERFLOW

## 1. Naturaleza y compatibilidad

Este documento amplía de forma aditiva `PROMPT_MAESTRO_ELECTROCMS.md`. Forma parte del alcance normativo de ElectroCMS y debe leerse junto con el Prompt Maestro.

Reglas obligatorias:

- No reemplaza ni elimina requisitos existentes.
- No renumera F00–F18 ni reabre fases completadas.
- No altera la microfase activa ni obliga a detener el desarrollo actual.
- Las capacidades ya implementadas se auditan y amplían; no se duplican en sistemas paralelos.
- FlutterFlow se usa como referencia de categorías funcionales, flujos y calidad de experiencia; no se copia código, branding, textos, assets ni composición propietaria.
- ElectroCMS conserva React + TypeScript + Tailwind CSS, local-first, PWA, exportación Local/React/LAMP/WordPress y arquitectura canónica desacoplada.
- Toda integración externa debe ser opcional mediante adapters/providers.

## 2. Objetivo ampliado

ElectroCMS debe evolucionar a un visual application builder profesional capaz de construir visualmente sitios, aplicaciones web, CMS, dashboards, paneles administrativos, backends y flujos de datos/lógica, con una experiencia comparable en alcance a FlutterFlow y adaptada a la arquitectura propia de ElectroCMS.

Debe combinar:

- Visual App Builder.
- Website/Page Builder.
- Component Builder.
- CMS y Backend Builder.
- Database/Data Model Builder.
- API Manager.
- Action/Logic Flow Builder.
- State Manager.
- Authentication/RBAC Builder.
- Responsive Builder.
- Design System Manager.
- Testing/Debug Environment.
- Custom Code Extension System.
- AI-assisted Builder.
- Export/Deployment Center.

## 3. Regla PARITY_GAP

Toda capacidad profesional relevante presente en FlutterFlow y ausente o parcial en ElectroCMS se registra como `PARITY_GAP` con:

- capacidad;
- estado `COMPLETA`, `PARCIAL`, `AUSENTE` o `BLOQUEADA`;
- módulo afectado;
- prioridad;
- dependencias;
- fase/microfase propietaria;
- arquitectura propuesta;
- criterios de aceptación;
- pruebas requeridas.

La existencia de un gap no autoriza implementaciones fuera de fase.

## 4. Arquitectura del Builder

El workspace debe organizar conceptualmente cuatro superficies coordinadas:

1. Navigation Menu / Project Navigation.
2. Toolbar / Builder Controls.
3. Canvas / Visual Workspace.
4. Properties Panel / Inspector contextual.

ElectroCMS mantiene además su sistema avanzado de paneles docked/floating/minimized/pinned, resize y persistencia de workspace.

## 5. Navigation System

Debe proporcionar acceso, según disponibilidad y fase, a:

- Dashboard.
- Editor.
- Pages.
- Widget Tree.
- Widget Palette.
- Components.
- Storyboard.
- Data Manager.
- Database.
- Data Types.
- Enums.
- Constants.
- App State.
- APIs.
- Media.
- Authentication.
- Roles/Permissions.
- Backend.
- Functions/Workflows.
- App Events.
- Custom Code.
- Tests.
- AI Tools/Agents.
- Themes/Design System.
- Integrations.
- Settings.
- Export/Deployment.
- Versioning/Collaboration.

Debe soportar modo compacto/expandido, búsqueda, iconos SVG, tooltips, teclado, persistencia de tamaño y accesibilidad.

## 6. Page Manager y Page Selector

Permitir crear, duplicar, renombrar, eliminar, archivar, organizar en carpetas, buscar, filtrar, marcar inicial, definir ruta/slug, parámetros, query params, permisos, autenticación requerida, roles, SEO y configuración responsive.

El Page Selector debe permitir cambio rápido entre páginas, componentes, plantillas, recientes y favoritos sin abandonar el canvas.

## 7. Widget Palette y Widget Tree

La biblioteca debe cubrir Layout, Content, Interaction, Forms, Data, Navigation, CMS y Commerce, reutilizando el registro de widgets existente.

El Widget Tree debe representar jerarquía padre/hijo y sincronizar selección con Canvas e Inspector.

Funciones mínimas:

- expand/collapse;
- select;
- rename;
- visibility;
- lock;
- copy/paste;
- duplicate/delete;
- reorder/nesting;
- búsqueda/filtros;
- drag/drop con alternativa por clic y teclado.

## 8. Canvas y Selection Manager

El Canvas debe soportar desktop, laptop, tablet, mobile y viewport personalizado con zoom, pan, fit, center, grids, rulers, guides, snapping, safe areas, orientations y breakpoints.

El Selection Manager central debe coordinar como mínimo:

- selectedPageId;
- selectedNodeId;
- selectedNodeIds;
- hoverNodeId;
- editingNodeId;
- insertionTarget;
- activeInspectorSection.

La selección debe permanecer sincronizada Canvas ↔ Widget Tree ↔ Inspector ↔ Breadcrumbs.

## 9. Direct Manipulation

Permitir seleccionar, mover, resize, reorder, align, distribute, duplicate, delete, copy, paste, lock, hide y multi-selection cuando corresponda.

Toda mutación debe pasar por Command Bus y ser reversible cuando sea aplicable.

## 10. Properties Panel contextual

El Inspector debe variar según página, widget, componente, binding, acción o elemento dinámico.

Secciones mínimas:

- Properties/Content.
- Layout.
- Style.
- Responsive.
- Visibility/Conditions.
- Actions.
- Backend Query/Data.
- Animations.
- Accessibility.
- Advanced.

Debe mostrar claramente el elemento seleccionado y sus propiedades relevantes.

## 11. Responsive Builder

Cada propiedad responsive debe soportar `inherit`, `override` y `reset`.

Debe cubrir visibilidad, layout, tamaño, tipografía, spacing y orden por breakpoint, preservando los seis breakpoints base del modelo actual y permitiendo personalizados.

## 12. Component System y Component Studio

Los componentes reutilizables deben soportar:

- parameters;
- defaults/required;
- typed values;
- callbacks;
- slots/child content;
- variants;
- component state;
- actions;
- lifecycle;
- backend bindings.

Component Studio debe ofrecer Canvas, Tree, Parameters, State, Actions, Variants, Slots y Preview.

## 13. Design System Manager

Gestionar tokens de color, tipografía, spacing, radius, borders, shadows, icons, assets, breakpoints y component variants. Evitar hardcodes cuando exista token equivalente.

## 14. Data Types, Enums y Constants

Soportar String, Number, Boolean, Date/DateTime, Color, File/Image, Enum, Object, List, Map, Reference y Custom Data Type.

Crear administradores visuales para Custom Data Types, Enums y Constants, con validación, defaults, nullable, listas y relaciones.

## 15. State Management

Scopes mínimos:

- Widget State.
- Component State.
- Page State.
- App State.
- Session State.
- Persistent State.

Cada variable define name, type, default, nullable, persisted y validation.

## 16. Set From Variable

Una propiedad puede obtener valores desde:

- static value;
- App/Page/Component/Widget State;
- page/component parameters;
- authenticated user;
- backend query;
- API response;
- database record;
- custom function;
- action output;
- constant;
- conditional value.

## 17. Conditional Logic

Constructor visual con If/Else/Else If, AND/OR/NOT, equals/not equals, greater/less, contains, empty/null y expresiones tipadas seguras.

## 18. Action Flow Editor

Triggers mínimos:

- click/double click/long press;
- hover;
- change/submit;
- focus/blur;
- page load/dispose;
- component initialization.

Acciones mínimas:

- Navigate/Back.
- Dialog/Drawer/Bottom Sheet.
- Update State/Set Variable.
- Backend Query.
- API Call.
- Create/Update/Delete Record.
- Upload/Download.
- Conditional.
- Delay/Loop.
- Snackbar/Alert.
- Custom Action.
- Workflow.
- App Event.

## 19. Action Graph y Outputs

Representar triggers, nodes, edges, true/false paths, errors y outputs. Soportar zoom, pan, drag, reconnect, duplicate, delete e inspect node.

Outputs reutilizables: API response, record ID, file URL, custom return, auth user, query result y otros resultados tipados.

## 20. App Events

Event Bus visual con eventos personalizados, parámetros, scope, trigger/listen/unsubscribe. Debe desacoplar componentes y módulos sin romper el dominio.

## 21. DataProvider y Database Builder

Definir `DataProvider` desacoplado. Providers iniciales/futuros:

- Local/IndexedDB.
- SQLite adapter futuro.
- REST.
- MySQL/LAMP.
- WordPress.
- adapters externos opcionales.

Database Builder debe definir tablas/colecciones, fields, indexes, defaults, validation y relaciones 1:1, 1:N, N:N.

## 22. Backend Query System

Queries sobre página, widget o componente: single record, list, pagination, count, aggregate y filtered query, con filters, sorting y relaciones.

## 23. API Manager

Soportar GET/POST/PUT/PATCH/DELETE, URL, headers, path/query params, body, auth y environments.

Incluye API Groups, API Tester, request/response inspector, status, headers, duration, errors y Response Mapping por JSON path/type/list/nullable/transform.

## 24. Authentication y RBAC

AuthProvider desacoplado con Local, Custom REST, WordPress y adapters opcionales futuros. Flujos: register, login, logout, forgot/reset password, verify email y session restore.

Roles/Permissions/Capabilities aplicables a pages, routes, widgets, actions, CMS content y admin modules.

## 25. Media Manager

Gestionar images, SVG, video, audio, fonts y documents con upload/import, folders, search, metadata, alt, optimize, replace, references y deduplicación.

## 26. Animations

Animation Inspector para On Load, On Action, Hover, Transition, Loop y Conditional; propiedades opacity, scale, translate, rotate y blur. Siempre respetar `prefers-reduced-motion`.

## 27. Routing, Storyboard y Deep Links

Route Manager con dynamic segments, params, query params, protected routes, redirects, deep links y transitions.

Storyboard debe mostrar páginas, rutas, transiciones, dialogs y componentes principales con zoom/pan y detección de rutas rotas.

## 28. Test Mode y Debug Panel

Separar Editor Mode y Runtime/Test Mode.

Debug Panel debe registrar actions, events, API calls, state changes, errors, warnings y performance.

## 29. Automated Tests

Preparar Test Builder para Unit, Component, Integration y E2E con identificadores estables de elementos y reportes reproducibles.

## 30. Custom Code

Diferenciar:

- Custom Functions.
- Custom Actions.
- Custom Components React.
- Code Files.

Code Editor con syntax highlighting, diagnostics, typecheck/compile, references y formatting. Código no confiable no se ejecuta en el proceso principal sin aislamiento.

## 31. Dependency Manager y Environments

Gestionar packages/versions, compatibilidad, conflictos y security warnings.

Environments mínimos: Development, Preview y Production con variables separadas. Secretos nunca se incrustan en frontend/exportaciones.

## 32. Backend/Cloud Functions e Integrations

Function System desacoplado con targets locales y generación Node/PHP según export target, además de adapters serverless futuros.

Integration Manager extensible para auth, database, storage, payments, maps, analytics, email, messaging, AI, CMS y commerce.

## 33. AI Builder y Agents

Arquitectura de IA para:

- generar página/componente/layout/contenido;
- modificar selección;
- crear Action Flow;
- sugerir schema;
- generar API mapping;
- explicar errores.

Agents especializados posibles: UI, Accessibility, SEO, Database, API, Testing y Refactor.

Toda modificación AI debe convertirse en comandos del Command Bus; ningún agente modifica estado persistido directamente.

## 34. Search / Command Palette

Búsqueda universal para pages, widgets, components, actions, variables, data types, APIs, media y settings. Atajo objetivo `Ctrl/Cmd + K`.

## 35. Versioning y Collaboration

Extender History con checkpoints, named versions y restore sin duplicar el Command Bus.

Preparar modelo de branch lógico, comments, presence, view/edit roles y activity history. El modo local debe seguir funcionando sin colaboración online.

## 36. Localization, Accessibility y SEO

Localization Manager con locales, default locale, translation keys, preview locale y fallback.

Auditoría WCAG 2.2 AA integrada para labels, roles, keyboard, focus, contrast, reduced motion, semantics y alt text.

SEO Web: title, description, canonical, Open Graph, Twitter cards, structured metadata, robots y sitemap.

## 37. Project Settings y Deployment Center

Centralizar app name, project ID, icons, targets, environments, authentication, integrations, dependencies y deployment.

Deployment Center debe mostrar target, environment, build status, errors e history.

Adapters objetivo: local server, GitHub/Cloudflare, Vercel, FTP/SFTP, WordPress y custom server, siempre opcionales.

## 38. Export System ampliado

Mantener Local, React, LAMP y WordPress. Añadir export de source/assets/config/schema/migrations/environment example y validación pre-deploy.

Antes de producción validar lint, typecheck, tests, broken references, accessibility, routes, API config, secrets y build.

## 39. Mobile Builder Experience

No comprimir el escritorio. La interfaz móvil usa:

- Topbar compacta.
- Canvas dominante.
- Bottom navigation: Widgets, Pages, Canvas, Properties, More.
- Widget Palette, Page Tree y Properties como tool sheets.
- Safe areas, keyboard avoidance, focus management y touch targets.

Tablet usa rail compacto, canvas central, panel contextual y overlays/sheets secundarios.

Desktop mantiene high density con controles ~32 px, spacing 4–8 px, rail ~44 px y paneles redimensionables.

## 40. Sistema de ventanas

Mantener y ampliar estados docked left/right, floating, minimized y pinned con drag, resize, snap, dock preview, restore y alternativas de teclado. Persistir layout del workspace por proyecto/usuario local.

## 41. UI/UX objetivo

ElectroCMS usa una gramática propia de visual builder profesional:

- High Density.
- Minimal Clean.
- Enterprise/IDE-like.
- neutral surfaces;
- subtle borders;
- minimal shadows;
- clear selection;
- restrained accent.

Azul reservado principalmente para selection, focus, active state y primary actions.

## 42. No regresión y consolidación

- No crear implementaciones paralelas de capacidades existentes.
- Antes de implementar: localizar → auditar → comparar → ampliar → probar → documentar.
- No acumular CSS, mocks o adapters temporales indefinidamente.
- Cuando una capacidad anticipada entra en fase formal, consolidar primitives/tokens/componentes y eliminar overrides redundantes.

## 43. Criterio final de éxito ampliado

Un usuario debe poder, de forma visual:

1. Crear proyecto.
2. Definir Design System.
3. Crear páginas y rutas.
4. Insertar widgets.
5. Crear componentes reutilizables.
6. Definir estados y variables.
7. Crear modelos y relaciones de datos.
8. Conectar datos y queries.
9. Configurar APIs.
10. Añadir autenticación y roles.
11. Crear lógica mediante Action Flow.
12. Crear condiciones/eventos.
13. Configurar responsive.
14. Crear backend administrativo.
15. Probar y depurar.
16. Extender con custom code.
17. Usar asistencia AI opcional.
18. Exportar código/proyecto.
19. Validar y desplegar.

Todo manteniendo local-first, accesibilidad, responsive, High Density y Minimal Clean.

## 44. Fases propietarias de este Addendum

Este Addendum se implementará únicamente después de las dependencias existentes mediante F19–F31 definidas en `PHASES.md` y microfases de `DETAILED_EXECUTION_PHASES.md`.

La microfase activa actual no cambia por incorporar este alcance documental.
