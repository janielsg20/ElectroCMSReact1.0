# PHASES — plan maestro de ElectroCMS

Cada fase se divide en microfases verificables en `DETAILED_EXECUTION_PHASES.md`. No se salta una puerta de calidad.

`UI_INTERNAL_COMPONENT_POLICY.md` es una regla transversal: toda fase que introduzca selectores, menús, popovers, pickers, diálogos, tooltips, context menus o controles equivalentes debe utilizar componentes internos del Design System y demostrar que no delega la experiencia principal a UI nativa del sistema operativo/navegador salvo excepción documentada.

| Fase | Objetivo | Secciones del prompt |
|---|---|---|
| F00 | Descubrimiento, inventario, cobertura y contratos | 1–3, 29–35 |
| F01 | Plataforma React/Tailwind, arquitectura modular y primitives internos | 3–4, 35 |
| F02 | Modelo canónico, esquemas y migraciones | 5, 14, 26 |
| F03 | Persistencia local-first, proyectos e historial | 3.1, 5, 27 |
| F04 | Application shell, navegación y workspaces responsive | 6, 8, 11, 24, 35 |
| F05 | Motor de documentos, nodos y canvas | 7, 23, 25, 35 |
| F06 | Registro de widgets y biblioteca | 9, 35 |
| F07 | Inspector, estilos, responsive y controles internos | 8, 10, 35 |
| F08 | Temas, plantillas y paquetes | 11–13, 35 |
| F09 | Contenido dinámico, CPT, taxonomías y campos | 14, 35 |
| F10 | Consultas, listings y filtros | 15, 17, 35 |
| F11 | Formularios y acciones | 16, 35 |
| F12 | Backend visual, usuarios, roles y permisos | 18, 20, 35 |
| F13 | Media y proyectos predeterminados | 19, 21, 33, 35 |
| F14 | Preview y exportación local/React | 22.1–22.2, 23, 35 |
| F15 | Exportación LAMP | 22.3, 23, 35 |
| F16 | Exportación WordPress | 22.4, 23, 35 |
| F17 | Seguridad, accesibilidad, rendimiento y auditoría de UI interna cross-platform | 24–26, 35 |
| F18 | Pruebas, aceptación, documentación y entrega base | 27–31, 35 |
| F19 | Visual Builder avanzado, selección y workspace persistente | Addendum 4–10, 39–41 + sección 35 |
| F20 | Component System, Component Studio y Design System | Addendum 12–13 + sección 35 |
| F21 | Data Types, State, Set From Variable y condiciones | Addendum 14–17 + sección 35 |
| F22 | Action Flow, Action Graph y App Events | Addendum 18–20 + sección 35 |
| F23 | DataProvider, Database Builder y Backend Queries | Addendum 21–22 + sección 35 |
| F24 | API Manager, grupos, tester y response mapping | Addendum 23 + sección 35 |
| F25 | Authentication, RBAC, roles, permisos y seguridad | Addendum 24, 31–32 + sección 35 |
| F26 | Media, routing, storyboard, responsive, localization y SEO | Addendum 25–27, 36, 39 + sección 35 |
| F27 | Custom Code, dependencias, environments e integraciones | Addendum 30–32 |
| F28 | Test Mode, Debug Panel y Automated Tests | Addendum 28–29 + sección 35 |
| F29 | Versioning, checkpoints, branching y collaboration | Addendum 35 |
| F30 | AI Builder, Agents y Command Palette | Addendum 33–34 + sección 35 |
| F31 | Export ampliado, Deployment Center y validación productiva | Addendum 37–38, 43 + sección 35 |

## Regla de continuidad

- F19–F31 son una ampliación aditiva del roadmap y no alteran el estado de F00–F18.
- La incorporación documental de estas fases no autoriza ejecutarlas antes de completar sus dependencias.
- La fase activa sigue determinada exclusivamente por `TRACKING.md`.
- Capacidades anticipadas ya existentes se auditan y consolidan en su fase propietaria; no se duplican.
- El alcance normativo ampliado se documenta en `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- La política de componentes internos se documenta en `UI_INTERNAL_COMPONENT_POLICY.md` y no requiere una fase separada para ser aplicable: entra en vigor en toda microfase visual desde su incorporación.

## Puertas globales

- G0 Alcance: inventario y matriz 1–35 completos.
- G1 Fundación: contratos públicos versionados, primitives internos de interacción y pruebas base verdes.
- G2 Editor: edición, persistencia, undo/redo, responsive y menús/pickers internos funcionales.
- G3 Studio: contenido, backend, temas y demo sobre un único estado y un Design System coherente.
- G4 Exportación: destinos instalables y equivalencia diagnosticada, incluida consistencia de controles generados.
- G5 Entrega base: aceptación F00–F18, documentación, cero funciones simuladas y cero UI nativa no autorizada en controles del producto.
- G6 Builder avanzado: selección, componentes, datos, estado y Action Flow integrados sobre una sola fuente de verdad y una familia común de menús/pickers internos.
- G7 Integraciones: database/API/auth/custom code/test mode verificados sin romper local-first ni coherencia de UI.
- G8 Plataforma ampliada: versioning, colaboración opcional, AI Builder y deployment/export ampliado con seguridad, pruebas y política cross-platform verificada.
