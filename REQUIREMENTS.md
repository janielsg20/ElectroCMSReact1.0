# Requisitos y trazabilidad

El texto normativo completo vive en `PROMPT_MAESTRO_ELECTROCMS.md`. Esta matriz no lo reemplaza; impide omisiones durante la ejecución.

| Sección | Tema | Fases propietarias |
|---:|---|---|
| 1 | Rol y objetivo | F00–F18 |
| 2 | Referencia React | F00 |
| 3 | Local, plataformas, responsive | F00, F01, F03, F04, F17 |
| 4 | Arquitectura | F00–F02 |
| 5 | Modelo de proyecto | F02–F03 |
| 6 | Interfaz del editor | F04 |
| 7 | Constructor visual | F05 |
| 8 | Breakpoints | F04, F07 |
| 9 | Widgets | F06 |
| 10 | Inspector | F07 |
| 11 | Tema del CMS | F04, F08 |
| 12 | Temas frontend/backend | F08 |
| 13 | Gestor de themes | F08 |
| 14 | Contenido dinámico | F02, F09 |
| 15 | Consultas | F10 |
| 16 | Formularios | F11 |
| 17 | Filtros | F10 |
| 18 | Backend | F12 |
| 19 | Proyectos predeterminados | F13 |
| 20 | Roles/permisos | F12 |
| 21 | Media | F13 |
| 22 | Exportación | F14–F16 |
| 23 | Correspondencia | F05, F14–F16 |
| 24 | Accesibilidad | F04–F18 |
| 25 | Rendimiento | F05, F10, F13, F17 |
| 26 | Seguridad | F02–F03, F11–F17 |
| 27 | Pruebas | Todas; cierre F18 |
| 28 | Aceptación | F18 |
| 29 | Protocolo | Todas |
| 30 | Documentación | Todas; cierre F18 |
| 31 | Entregables | F18 |
| 32 | Equivalencias profesionales | F00, F13–F16 |
| 33 | Tienda demo editable | F13–F16, F18 |

## Regla de aceptación

Una fila solo puede considerarse cubierta cuando sus requisitos individuales tienen pruebas enlazadas desde `TRACKING.md`. La asignación a una fase no significa implementación.

## Equivalencias de arquitectura objetivo

Al no existir una aplicación de referencia autorizada, la correspondencia se define desde cada capacidad normativa hacia una arquitectura React original. `AUSENTE` en `REFERENCE_INVENTORY.md` nunca significa requisito descartado.

| Capacidad normativa | Equivalente objetivo | Fases |
|---|---|---|
| Navegación y shell | Estado de navegación tipado y shell responsive accesible | F01, F04 |
| Proyecto, páginas y nodos | Modelo canónico versionado, validación y migraciones | F02, F03 |
| Canvas, capas e inspector | Comandos reversibles, renderers y schemas de propiedades | F05–F07 |
| Widgets y componentes | Registro extensible con contratos por versión | F06 |
| Themes y tokens | Paquetes de tema portables para editor, frontend y backend | F08 |
| Contenido dinámico | Modelos, registros, bindings y relaciones canónicas | F09 |
| Consultas y filtros | AST declarativo validado y ejecución local segura | F10 |
| Formularios | Schema, validación, acciones y adaptadores explícitos | F11 |
| Backend y permisos | Navegación administrativa generada desde roles y capacidades | F12 |
| Presets y media | Plantillas versionadas y biblioteca local con metadatos | F13 |
| Preview | Renderers frontend/backend consumiendo el modelo canónico | F04, F12 |
| Local y React | Exportadores diagnosticables sin pérdida silenciosa | F14 |
| LAMP | Generador versionado con validación y salida reproducible | F15 |
| WordPress | Theme/plugin generado con compatibilidad declarada | F16 |
| PWA y plataformas | Núcleo web offline y adaptadores desacoplados | F01, F17 |
| Seguridad, accesibilidad y calidad | Puertas transversales verificables | F00–F18 |

## Regla contra requisitos huérfanos

- Cada sección 1–33 tiene al menos una fase propietaria en la matriz principal.
- Cada capacidad transversal conserva pruebas en su fase y en `F18` cuando corresponda.
- Las decisiones de arquitectura no pueden eliminar requisitos; solo asignarles contratos, fases y criterios verificables.
- Toda desviación futura debe registrarse en `ARCHITECTURE.md`, `TRACKING.md` y `CHANGELOG.md`.
