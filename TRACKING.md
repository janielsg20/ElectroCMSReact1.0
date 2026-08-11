# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F05 — Motor de documentos, nodos y canvas`.
- Microfase actual: `M05.2 — Canvas y renderer`.
- Estado: `EN_CURSO`.
- F00–F04: `COMPLETADA`.
- `M05.1 — Operaciones del árbol`: `COMPLETADA`.
- F05: `EN_CURSO` en M05.2.
- F06–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.
- Sección 35 del Prompt Maestro: `UI interna cross-platform / no native chrome`, incorporada como regla normativa transversal sin alterar la microfase activa.

## Roadmap ampliado

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, proyectos, autosave, recuperación y Command Bus/History |
| F04 | COMPLETADA | Shell desktop/tablet/móvil, navegación profunda, shortcuts y temas del editor |
| F05 | EN_CURSO | M05.1 árbol completada; M05.2 canvas/renderer activa |
| F06–F18 | NO_INICIADA | Roadmap base restante |
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

## Política transversal incorporada — Sección 35

- Nuevo documento normativo `UI_INTERNAL_COMPONENT_POLICY.md`, definido como Sección 35 del Prompt Maestro por referencia.
- Regla principal: un control no cumple solo por estar estilizado si al activarlo Android, Windows, macOS, iOS o el navegador abre su menú/picker visual nativo.
- Select/Listbox, Combobox, DropdownMenu, ContextMenu, Popover, Tooltip, Dialog/AlertDialog, BottomSheet, ColorPicker, Date/TimePicker, MediaPicker, IconPicker y Token/Variable Picker deben ser componentes internos del Design System.
- Quedan prohibidos como experiencia final de producto, salvo excepción documentada: `<select>`, `<datalist>`, color/date/time pickers nativos, `window.alert/confirm/prompt`, context menus nativos para acciones de ElectroCMS y tooltips basados solo en `title`.
- En desktop el control puede usar popover/menu; en tablet overlay/drawer; en móvil sheet/full-screen picker interno. La función no se delega al OS por cambiar de plataforma.
- Excepciones nativas permitidas únicamente en fronteras de plataforma/seguridad: archivos/carpetas, permisos, biometría, share sheet, impresión, instalación PWA u otras superficies protegidas por sandbox.
- `DETAILED_EXECUTION_PHASES_UI_INTERNAL_COMPONENTS.md` mapea la política a microfases existentes y añade `M17.5 — Auditoría de UI interna cross-platform` como gate transversal.
- La política entra en vigor inmediatamente para cualquier UI nueva o modificada. Controles nativos heredados se registran y sustituyen en su fase propietaria; no se consideran conformes por estar estilizados.
- La incorporación documental no cambia el estado de F05/M05.2 ni autoriza adelantar fases.

## Cierres relevantes previos

- F03 cerró persistencia local-first, ProjectCommandBus e historial reversible persistente.
- F04 cerró shell responsive, navegación profunda, command palette/shortcuts y `appearance.v1`.
- M04.5 / PR #11 / run `31455514122`: 32 archivos / 132 pruebas y build Vite 7.3.6 verdes.

## Cierre M05.1 — Operaciones del árbol

- Añadido `hidden` como propiedad base canónica de nodo con default retrocompatible `false`; los overrides responsive continúan pudiendo sobrescribirla por breakpoint.
- `resolveNodeResponsiveState` parte de `node.hidden` y después aplica la cadena de overrides responsive.
- Nuevo `src/domain/project/tree-operations.ts` opera directamente sobre `ProjectStructure`; no existe un árbol UI paralelo.
- Implementadas operaciones: insertar, mover, anidar, agrupar, copiar, pegar, duplicar, bloquear, ocultar y renombrar.
- Las operaciones multi-nodo normalizan la selección: si un ancestro y su descendiente están seleccionados, el subárbol se procesa una sola vez.
- Move/nest rechazan nodos bloqueados, padres bloqueados, padres inexistentes y destinos dentro del propio subárbol.
- Group exige nodos hermanos del mismo contenedor, conserva el orden original e inserta el grupo en la posición del primero.
- Copy/paste y duplicate copian subárboles completos, generan IDs nuevos y remapean slots y bindings internos `node-property`.
- Cada mutación termina pasando `validateProjectStructure`; ciclos, padres múltiples, huérfanos y referencias rotas no pueden persistirse silenciosamente.
- Nuevo `ProjectStructureCommand` adapta una mutación de árbol al `ProjectCommandBus<ProjectStructure>` existente, sin crear otra capa de history.
- Pruebas de integración verifican execute/undo/redo, revisiones monotónicas, movimiento multi-nodo como una sola entrada y rechazo de comandos inválidos sin revisión/historial.
- El primer CI detectó que el fixture tipado histórico de `structure.test.ts` debía declarar `hidden`; el schema de entrada ya era retrocompatible mediante default y solo se ajustó el fixture explícito.
- Puerta técnica PR #12 / run `31456269215`: lint, typecheck, **34 archivos de test / 150 pruebas verdes** y build Vite 7.3.6 correcto.

## Entregas UI anticipadas que continúan pendientes de su fase propietaria

- El árbol visual, canvas e inspector existen con UI anticipada, pero F05 es quien formaliza ahora su motor funcional.
- `src/ui-integrity-v11.css` sigue como guardrail cross-theme para tamaño, selección, foco y overflow.
- M05.1 formaliza operaciones de dominio; no cierra renderer, drag/drop, direct manipulation ni Selection Manager futuro de F19.
- Cualquier control nativo detectado en Inspector/Canvas/Tree/biblioteca se considera deuda de conformidad con Sección 35 y se reemplaza cuando su microfase propietaria entre en curso.

## Próximo paso exacto

`M05.2 — Canvas y renderer`:

- renderizar `ProjectStructure` canónico sin duplicar datos en un modelo visual paralelo;
- aislar errores de nodos para que un fallo local no derribe el canvas;
- resolver base + responsive mediante el contrato existente;
- asegurar updates granulares y medir que un cambio local no rerenderice todo el árbol;
- respetar `hidden`, slots, orden y nodos bloqueados en la representación;
- añadir pruebas de renderer y rendimiento antes de avanzar a M05.3;
- toda UI nueva/modificada durante M05.2 debe cumplir Sección 35; en M05.3 los menús `Mover a / Antes de / Después de` y contextuales serán internos, no nativos.

## Bloqueos

- Ninguno para M05.2.
- F19–F31 siguen deliberadamente pendientes de sus dependencias.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

Para microfases visuales, una funcionalidad que siga abriendo UI nativa no autorizada permanece incompleta aunque sus pruebas funcionales básicas pasen.

## Evidencia técnica histórica resumida

- M04.1: run `31451142252`, 102/102 pruebas.
- M04.2: run `31453249710`, 107/107 pruebas.
- M04.3: run `31454024650`, 112/112 pruebas.
- M04.4: run `31454811218`, 120/120 pruebas.
- M04.5: run `31455514122`, 132/132 pruebas.
- M05.1: run `31456269215`, 150/150 pruebas, lint/typecheck/build verdes.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Sección 35 / política UI interna: `UI_INTERNAL_COMPONENT_POLICY.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases base: `DETAILED_EXECUTION_PHASES.md`.
- Microfases Sección 35: `DETAILED_EXECUTION_PHASES_UI_INTERNAL_COMPONENTS.md`.
- Memoria: `MEMORY.md`.
