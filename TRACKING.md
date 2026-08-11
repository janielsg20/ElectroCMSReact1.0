# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

> Este archivo mantiene el estado operativo actual y las puertas recientes. El historial detallado de implementaciones, commits, bundles y gates anteriores permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- Microfase actual: `M09.1 — CPT`.
- Estado: `EN_CURSO`.
- F00–F08: `COMPLETADA`.
- Auditoría extraordinaria F04/M04.1: `COMPLETADA`; no altera su cierre histórico.
- F10–F18: `NO_INICIADA` salvo contratos/documentación anticipados que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional tipo FlutterFlow.
- Última puerta funcional: GitHub Actions run `31543564627` — lint, typecheck, suite completa y build verdes; deploy de producción omitido por tratarse de un PR draft.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, autosave, recuperación y Command Bus/History |
| F04 | COMPLETADA | Shell desktop/tablet/móvil, workspace persistente y apariencia del editor |
| F05 | COMPLETADA | Árbol, renderer, DnD, manipulación directa, selección y viewport |
| F06 | COMPLETADA | Registro versionado, 115 widgets, adapters y biblioteca funcional |
| F07 | COMPLETADA | Inspector, controles, estilos, responsive, bindings, condiciones y ARIA |
| F08 | COMPLETADA | Temas, presets, plantillas y paquetes versionados |
| F09 | EN_CURSO | M09.1 CPT activa; M09.2–M09.5 pendientes |
| F10 | NO_INICIADA | Consultas, listings y filtros |
| F11 | NO_INICIADA | Formularios y acciones |
| F12 | NO_INICIADA | Backend visual, usuarios, roles y permisos |
| F13 | NO_INICIADA | Medios y assets |
| F14 | NO_INICIADA | Navegación/routing |
| F15 | NO_INICIADA | Export local/React |
| F16 | NO_INICIADA | Export LAMP/WordPress |
| F17 | NO_INICIADA | Hardening, accesibilidad y auditoría final |
| F18 | NO_INICIADA | Cierre roadmap base |
| F19 | NO_INICIADA | Visual Builder avanzado y workspace |
| F20 | NO_INICIADA | Component/Design System |
| F21 | NO_INICIADA | Data Types, State, Variables y condiciones |
| F22 | NO_INICIADA | Action Flow/Graph y App Events |
| F23 | NO_INICIADA | Database Builder y Backend Queries |
| F24 | NO_INICIADA | API Manager/Tester/Mapping |
| F25 | NO_INICIADA | Authentication/RBAC/Security |
| F26 | NO_INICIADA | Media/Routing/Storyboard/Responsive/Localization/SEO |
| F27 | NO_INICIADA | Custom Code/Dependencies/Environments/Integrations |
| F28 | NO_INICIADA | Test Mode/Debug/Automated Tests |
| F29 | NO_INICIADA | Versioning/Branching/Collaboration |
| F30 | NO_INICIADA | AI Builder/Agents/Command Palette |
| F31 | NO_INICIADA | Export ampliado/Deployment/Production validation |

## Microfases completadas recientes

### F05 — motor canónico

- M05.1 Operaciones del árbol: `COMPLETADA`.
- M05.2 Canvas y renderer: `COMPLETADA`.
- M05.3 Drag/drop y alternativas accesibles: `COMPLETADA`.
- M05.4 Direct manipulation: `COMPLETADA`.
- M05.5 Selección, zoom y viewport: `COMPLETADA`.

### F06 — widgets y biblioteca

- M06.1 Contrato de widget: `COMPLETADA`.
- M06.2 Estructurales y básicos: `COMPLETADA`.
- M06.3 Contenido y dinámicos: `COMPLETADA`.
- M06.4 Comercio, formularios y filtros: `COMPLETADA`.
- M06.5 UX de biblioteca: `COMPLETADA`.

### F07 — inspector, estilos y responsive

- M07.1 Inspector generado por schema: `COMPLETADA`.
- M07.2 Controles y validación: `COMPLETADA`.
- M07.3 Motor de estilos: `COMPLETADA`.
- M07.4 Motor de breakpoints: `COMPLETADA`.
- M07.5 Datos, condiciones y accesibilidad: `COMPLETADA`.

### F08 — temas, plantillas y paquetes

- M08.1 Tres ámbitos de tema: `COMPLETADA`.
- M08.2 Presets visuales: `COMPLETADA`.
- M08.3 Motor de plantillas: `COMPLETADA`.
- M08.4 Paquetes theme: `COMPLETADA`.
- F08: `COMPLETADA`.

## Cierre de auditoría F04/M04.1

La auditoría solicitada reabrió temporalmente F04 sin invalidar su evidencia histórica. Queda cerrada con estas correcciones principales:

- cancelación reversible de drag/resize y normalización de coordenadas de puntero;
- popover de Apariencia aislado de reglas compactas de TopBar;
- targets táctiles de 44 px donde corresponde;
- canvas toolbar en tres regiones con container queries y sin información inferior duplicada;
- separación entre Apariencia local y recursos exportables del proyecto;
- `Plantillas` renombrada visualmente a `Documentos` para reflejar páginas + plantillas;
- cuatro tabs de Biblioteca adaptadas a paneles estrechos, con `Documentos` → `Docs` solo visualmente y nombre accesible intacto;
- verificación responsive previa en 1440, 1024, 812, 768 y 375 px sin overflow horizontal de página.

La arquitectura resultante es `TopBar → Apariencia local` y `Biblioteca → Diseño → Tema/Paquetes` para recursos del proyecto.

## Cierre M08.4 — Paquetes theme

- Añadido `ThemePackageSchema` con formato `electrocms.theme-package`, schema v1, UUID tipado y SemVer.
- Partes implementadas: tema frontend, tema backend, documentos/plantillas, componentes globales y breakpoints dependientes.
- Crear paquete exige selección explícita; documentos con `component-instance` requieren incluir sus componentes.
- Biblioteca local en IndexedDB namespace `theme-packages.v1`; save/list/remove no altera `ProjectStructure`.
- Edición de nombre/descripcion/versión, duplicado y bump major/minor/patch.
- Importación valida JSON canónico y guarda localmente; nunca aplica automáticamente.
- Exportación produce JSON canónico versionado.
- Aplicación seleccionable por partes remapea document/component/node/breakpoint IDs, slots, bindings, responsive y referencias `component-instance`.
- Breakpoints idénticos se reutilizan; incompatibles se importan con IDs nuevos.
- Conflictos de ruta usan política explícita `abort` o `suffix`; la ruta existente nunca se sobrescribe silenciosamente.
- La estructura candidata completa vuelve a pasar `validateProjectStructure` antes de persistir.
- Aplicar paquete entra por `ProjectStructureCommand` + `ProjectCommandBus`; integración prueba undo real.
- `ThemePackageSession` está segregada del contrato base del editor para no acoplar canvas/capas/inspector a una capacidad que no usan.
- UI `Diseño → Paquetes`: creación, biblioteca, contenido incluido, SemVer, duplicado, import/export, eliminación en dos pasos, selección de partes y conflicto de rutas.
- Accesibilidad: tabs/listbox/fieldset, mensajes `aria-live`, foco visible y targets touch/desktop acordes al sistema High Density.
- Contrato detallado: `THEME_PACKAGE_SYSTEM.md`.

### Puerta M08.4

- Run previo funcional: `31543564627`.
- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `VERDE`.
- Build de producción: `VERDE`.
- Deploy producción: `SKIPPED` porque el branch permanece dentro de PR draft.

## F09 / M09.1 — alcance activo

Objetivo inmediato: formalizar CPT sobre el backend canónico existente, sin contar schemas anticipados como implementación terminada.

Debe cubrir antes de pasar a M09.2:

- crear, leer, editar y eliminar tipos de contenido;
- slug único y estable;
- nombres singular/plural, descripción e icono;
- capacidades configurables;
- soportes (`title`, `editor`, `author`, `thumbnail`, `excerpt`, `revisions`, `custom-fields`);
- visibilidad pública y presencia en menú;
- orden;
- vínculo opcional a plantilla `single` y `archive`, validando que la referencia sea compatible;
- persistencia local e historial reversible para mutaciones del proyecto/backend;
- UI funcional, responsive y accesible; ninguna pantalla o acción ficticia;
- pruebas de invariantes, persistencia y undo/redo;
- puerta lint + typecheck + suite + build antes de activar M09.2.

## Bloqueos

- Ninguno técnico conocido para iniciar M09.1.
- El contrato `CmsBackendSchema`/`validateCmsBackend` ya existe como trabajo anticipado, pero debe integrarse al estado/persistencia real en F09; por sí solo no cierra ninguna microfase.
- F19–F31 continúan deliberadamente pendientes de sus dependencias.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. Documentación, tipos anticipados o prototipos visuales no cuentan como implementación formal.

## Evidencia histórica resumida

- M04.5: run `31455514122`, 132/132 pruebas.
- M05.1: run `31456269215`, 150/150 pruebas.
- M05.2–M07.5: gates locales verdes documentados en `CHANGELOG.md`.
- M08.1: 246/246 pruebas en su puerta local.
- M08.2: 271/271 pruebas en su puerta local.
- M08.3: 60 archivos / 276 pruebas, lint/typecheck/build verdes.
- M08.4: run `31543564627`, lint/typecheck/suite/build verdes.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
- Temas: `THEME_SYSTEM.md`.
- Paquetes: `THEME_PACKAGE_SYSTEM.md`.
- Historial detallado: `CHANGELOG.md`.
