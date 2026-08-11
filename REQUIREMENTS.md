# Requisitos y trazabilidad

El texto normativo completo vive en `PROMPT_MAESTRO_ELECTROCMS.md` y se amplía mediante `FLUTTERFLOW_PARITY_ADDENDUM.md` y `UI_INTERNAL_COMPONENT_POLICY.md`. Esta matriz no los reemplaza; impide omisiones durante la ejecución.

| Sección | Tema | Fases propietarias |
|---:|---|---|
| 1 | Rol y objetivo | F00–F31 |
| 2 | Referencia React | F00 |
| 3 | Local, plataformas, responsive | F00, F01, F03, F04, F17, F19, F26 |
| 4 | Arquitectura | F00–F02, F19–F31 según módulo |
| 5 | Modelo de proyecto | F02–F03, F21, F23, F29, F31 |
| 6 | Interfaz del editor | F04, F19 |
| 7 | Constructor visual | F05, F19 |
| 8 | Breakpoints | F04, F07, F19, F26 |
| 9 | Widgets | F06, F19–F20 |
| 10 | Inspector | F07, F19 |
| 11 | Tema del CMS | F04, F08, F20 |
| 12 | Temas frontend/backend | F08, F20 |
| 13 | Gestor de themes | F08, F20 |
| 14 | Contenido dinámico | F02, F09, F21, F23 |
| 15 | Consultas | F10, F23 |
| 16 | Formularios | F11, F22 |
| 17 | Filtros | F10, F23 |
| 18 | Backend | F12, F23, F25 |
| 19 | Proyectos predeterminados | F13 |
| 20 | Roles/permisos | F12, F25 |
| 21 | Media | F13, F26 |
| 22 | Exportación | F14–F16, F31 |
| 23 | Correspondencia | F05, F14–F16, F31 |
| 24 | Accesibilidad | F04–F31 |
| 25 | Rendimiento | F05, F10, F13, F17, F19, F28, F31 |
| 26 | Seguridad | F02–F03, F11–F17, F24–F31 |
| 27 | Pruebas | Todas; cierre base F18 y ampliado F31 |
| 28 | Aceptación | F18, F31 |
| 29 | Protocolo | Todas |
| 30 | Documentación | Todas; cierres F18/F31 |
| 31 | Entregables | F18, F31 |
| 32 | Equivalencias profesionales | F00, F13–F16, F19–F31 |
| 33 | Tienda demo editable | F13–F16, F18 |
| 34 | Ampliación FlutterFlow-parity | F19–F31 |
| 35 | UI interna cross-platform; prohibición de menús/pickers nativos no autorizados | F01, F04–F20, F21–F26, F28, F30–F31; auditoría principal F17/F18 |

## Requisito transversal — UI interna cross-platform

`UI_INTERNAL_COMPONENT_POLICY.md` define el contrato verificable de la sección 35. Como mínimo:

- Los controles de producto no pueden depender de `<select>`, `<datalist>`, `input[type="color"]`, date/time pickers nativos, `alert/confirm/prompt`, context menus nativos o tooltips basados únicamente en `title` cuando exista equivalente interno.
- Listbox, Combobox, Dropdown, ContextMenu, Popover, Tooltip, Dialog, ColorPicker, Date/Time Picker, MediaPicker y equivalentes deben usar el Design System de ElectroCMS.
- El Inspector es una superficie crítica: cambiar propiedades no debe abrir UI ajena de Android, Windows, macOS, iOS o del navegador.
- Desktop puede usar popover/dropdown; tablet overlays/drawers; móvil sheets/full-screen pickers internos. La función y semántica permanecen equivalentes.
- Los componentes internos deben implementar accesibilidad completa y conservar o superar la semántica/teclado del control nativo reemplazado.
- Solo se autorizan superficies nativas que sean frontera real de seguridad/plataforma: archivos/carpetas, permisos, biometría, share sheet, print dialog, instalación PWA u otras protegidas por sandbox. Toda excepción se documenta.
- Los proyectos generados deben respetar el mismo principio cuando utilicen componentes generados por ElectroCMS.

## Addendum de paridad funcional

`FLUTTERFLOW_PARITY_ADDENDUM.md` añade las siguientes áreas propietarias sin modificar las secciones base:

| Área del Addendum | Fase propietaria |
|---|---|
| Builder avanzado, Pages, Widget Tree, Canvas, Inspector, ventanas y mobile builder | F19 |
| Component System, Component Studio y Design System | F20 |
| Data Types, Enums, Constants, State, Set From Variable y Conditional Values | F21 |
| Action Flow, Action Graph, outputs y App Events | F22 |
| DataProvider, Database Builder y Backend Queries | F23 |
| API Manager, API Groups, Tester y Response Mapping | F24 |
| Authentication, sessions, RBAC, secrets y seguridad | F25 |
| Media, Routing, Storyboard, Responsive, Animations, Localization, SEO | F26 |
| Custom Functions/Actions/Components, Code Files, Dependencies, Environments, Integrations | F27 |
| Test Mode, Debug, State Inspector, tracing y Automated Tests | F28 |
| Versioning, checkpoints, branching, comments y collaboration | F29 |
| AI Builder, Agents y Command Palette | F30 |
| Project Settings, export ampliado, Deployment Center y pre-deploy validation | F31 |

## Regla de aceptación

Una fila solo puede considerarse cubierta cuando sus requisitos individuales tienen pruebas enlazadas desde `TRACKING.md`. La asignación a una fase no significa implementación.

Las áreas del Addendum se registran como `NO_INICIADA` hasta que su microfase propietaria entre formalmente en curso. La existencia de UI anticipada o prototipos no cierra una fase futura.

La sección 35 tampoco puede considerarse cubierta solo porque un control “se vea” estilizado. Debe probarse que al activarlo no delega su UI principal al OS/navegador salvo excepción documentada.

## Equivalencias de arquitectura objetivo

Al no existir una aplicación de referencia autorizada como fuente de código, la correspondencia se define desde cada capacidad normativa hacia una arquitectura React original. `AUSENTE` o `PARITY_GAP` nunca significa requisito descartado.

| Capacidad normativa | Equivalente objetivo | Fases |
|---|---|---|
| Navegación y shell | Estado de navegación tipado y shell responsive accesible | F01, F04, F19 |
| Proyecto, páginas y nodos | Modelo canónico versionado, validación y migraciones | F02, F03, F19 |
| Canvas, capas e inspector | Command Bus, Selection Manager, renderers y schemas | F05–F07, F19 |
| Controles interactivos cross-platform | Primitives internos accesibles + adaptive presentation + política de excepciones | F01, F04–F07, F17, F19–F20, F26, F28 |
| Widgets y componentes | Registro extensible + Component System | F06, F20 |
| Themes y tokens | Paquetes portables + Design System Manager | F08, F20 |
| Contenido dinámico | Modelos, registros, bindings y relaciones canónicas | F09, F21, F23 |
| Estado y variables | State scopes + Set From Variable + condiciones | F21 |
| Lógica visual | Action Flow/Graph + App Events | F22 |
| Database/backend queries | DataProvider + Database Builder + Queries | F23 |
| APIs | API Manager + Tester + Mapping | F24 |
| Auth y permisos | AuthProvider + RBAC + protected routes | F25 |
| Media/routing/responsive | Managers especializados sobre modelo común | F13, F26 |
| Custom code | Contracts + editor + sandbox + dependency manager | F27 |
| Testing/debug | Runtime/Test Mode + tracing + automated tests | F28 |
| Versioning/collaboration | History extendido + checkpoints + branch model | F29 |
| AI Builder | Agents que emiten comandos validados | F30 |
| Preview/export/deploy | Renderers y pipelines diagnosticables sin pérdida silenciosa | F14–F16, F31 |
| PWA y plataformas | Núcleo web offline y adaptadores desacoplados | F01, F17, F31 |
| Seguridad, accesibilidad y calidad | Puertas transversales verificables | F00–F31 |

## Regla contra requisitos huérfanos

- Cada sección del Prompt Maestro tiene al menos una fase propietaria en la matriz principal.
- Cada área del Addendum tiene exactamente una fase principal F19–F31 y puede tener dependencias transversales.
- `UI_INTERNAL_COMPONENT_POLICY.md` es transversal y debe ser revisada en toda microfase con impacto visual/interactivo.
- Cada capacidad transversal conserva pruebas en su fase y en el cierre correspondiente.
- Las decisiones de arquitectura no pueden eliminar requisitos; solo asignarles contratos, fases y criterios verificables.
- Toda desviación futura debe registrarse en `ARCHITECTURE.md`, `TRACKING.md` y `CHANGELOG.md`.
