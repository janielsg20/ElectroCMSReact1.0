# PHASES — plan maestro de ElectroCMS

Cada fase se divide en microfases verificables en `DETAILED_EXECUTION_PHASES.md`. No se salta una puerta de calidad.

| Fase | Objetivo | Secciones del prompt |
|---|---|---|
| F00 | Descubrimiento, inventario, cobertura y contratos | 1–3, 29–33 |
| F01 | Plataforma React/Tailwind y arquitectura modular | 3–4 |
| F02 | Modelo canónico, esquemas y migraciones | 5, 14, 26 |
| F03 | Persistencia local-first, proyectos e historial | 3.1, 5, 27 |
| F04 | Application shell, navegación y workspaces responsive | 6, 8, 11, 24 |
| F05 | Motor de documentos, nodos y canvas | 7, 23, 25 |
| F06 | Registro de widgets y biblioteca | 9 |
| F07 | Inspector, estilos y responsive | 8, 10 |
| F08 | Temas, plantillas y paquetes | 11–13 |
| F09 | Contenido dinámico, CPT, taxonomías y campos | 14 |
| F10 | Consultas, listings y filtros | 15, 17 |
| F11 | Formularios y acciones | 16 |
| F12 | Backend visual, usuarios, roles y permisos | 18, 20 |
| F13 | Media y proyectos predeterminados | 19, 21, 33 |
| F14 | Preview y exportación local/React | 22.1–22.2, 23 |
| F15 | Exportación LAMP | 22.3, 23 |
| F16 | Exportación WordPress | 22.4, 23 |
| F17 | Seguridad, accesibilidad y rendimiento transversal | 24–26 |
| F18 | Pruebas, aceptación, documentación y entrega base | 27–31 |
| F19 | Visual Builder avanzado, selección y workspace persistente | Addendum 4–10, 39–41 |
| F20 | Component System, Component Studio y Design System | Addendum 12–13 |
| F21 | Data Types, State, Set From Variable y condiciones | Addendum 14–17 |
| F22 | Action Flow, Action Graph y App Events | Addendum 18–20 |
| F23 | DataProvider, Database Builder y Backend Queries | Addendum 21–22 |
| F24 | API Manager, grupos, tester y response mapping | Addendum 23 |
| F25 | Authentication, RBAC, roles, permisos y seguridad | Addendum 24, 31–32 |
| F26 | Media, routing, storyboard, responsive, localization y SEO | Addendum 25–27, 36, 39 |
| F27 | Custom Code, dependencias, environments e integraciones | Addendum 30–32 |
| F28 | Test Mode, Debug Panel y Automated Tests | Addendum 28–29 |
| F29 | Versioning, checkpoints, branching y collaboration | Addendum 35 |
| F30 | AI Builder, Agents y Command Palette | Addendum 33–34 |
| F31 | Export ampliado, Deployment Center y validación productiva | Addendum 37–38, 43 |

## Regla de continuidad

- F19–F31 son una ampliación aditiva del roadmap y no alteran el estado de F00–F18.
- La incorporación documental de estas fases no autoriza ejecutarlas antes de completar sus dependencias.
- La fase activa sigue determinada exclusivamente por `TRACKING.md`.
- Capacidades anticipadas ya existentes se auditan y consolidan en su fase propietaria; no se duplican.
- El alcance normativo ampliado se documenta en `FLUTTERFLOW_PARITY_ADDENDUM.md`.

## Puertas globales

- G0 Alcance: inventario y matriz 1–33 completos.
- G1 Fundación: contratos públicos versionados y pruebas base verdes.
- G2 Editor: edición, persistencia, undo/redo y responsive funcionales.
- G3 Studio: contenido, backend, temas y demo sobre un único estado.
- G4 Exportación: destinos instalables y equivalencia diagnosticada.
- G5 Entrega base: aceptación F00–F18, documentación y cero funciones simuladas.
- G6 Builder avanzado: selección, componentes, datos, estado y Action Flow integrados sobre una sola fuente de verdad.
- G7 Integraciones: database/API/auth/custom code/test mode verificados sin romper local-first.
- G8 Plataforma ampliada: versioning, colaboración opcional, AI Builder y deployment/export ampliado con seguridad y pruebas.

