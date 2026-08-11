# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-10.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual, lógica/estado/datos visuales y exportadores Local, React, LAMP y WordPress.

## Alcance normativo

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Ampliación funcional tipo FlutterFlow: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- FlutterFlow se usa como referencia de capacidades y flujos profesionales, no como fuente de código/branding/activos propietarios.
- Toda capacidad faltante del Addendum se registra como `PARITY_GAP` y se implementa solo en su fase propietaria.

## Estado real

- React 19 + TypeScript estricto + Tailwind 4 + Vite + PWA local-first.
- F00–F04 completadas.
- F03 dejó repositorios locales, autosave/recovery y `ProjectCommandBus`/history persistente.
- F04 cerró shell responsive, navegación profunda, command palette/shortcuts y apariencia.
- Fase activa: `F05 — Motor de documentos, nodos y canvas`.
- `M05.1 — Operaciones del árbol`: `COMPLETADA`.
- Microfase actual: `M05.2 — Canvas y renderer` `EN_CURSO`.
- F06–F18 siguen `NO_INICIADA`; F19–F31 continúan `NO_INICIADA`.

## Decisiones vigentes

- Núcleo web local-first/PWA; dominio/modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación deben compartir una sola fuente de verdad.
- Toda mutación relevante de F05 usa `ProjectCommandBus`/`ProjectHistoryState`; prohibido crear otro history.
- El árbol funcional vive en `ProjectStructure`; la UI nunca mantiene un árbol paralelo como fuente de verdad.
- `tree-operations.ts` valida cada mutación con `validateProjectStructure` antes de devolverla.
- Selección múltiple de M05.1 es solo un input de operaciones; no sustituye el Selection Manager formal reservado para F19.
- `hidden` es estado base canónico del nodo con default `false`; overrides responsive pueden sobrescribirlo.
- Copy/paste/duplicate profundo debe remapear IDs, slots y referencias internas `node-property`.
- Nodos bloqueados no pueden moverse ni recibir hijos mediante operaciones estructurales hasta desbloquearse.
- Undo/redo restaura estados lógicos anteriores creando revisiones nuevas; la revisión persistente nunca retrocede.
- `workspace.v1` y `appearance.v1` son preferencias locales de UI, no datos del proyecto.
- No crear implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History o Export.

## UI/UX vigente

- Dirección visual: High Density + Minimal Clean + builder/IDE profesional.
- Desktop, tablet y móvil formalizados por F04.
- Navegación profunda `#/sección`, command palette y shortcuts formalizados.
- Presets `Studio / Bento Motion / Flow Builder`; modos `Claro / Oscuro / Automático` mediante `appearance.v1`.
- Contraste WCAG AA automatizado para los tres presets en claro/oscuro.
- El árbol visual/canvas actual sigue siendo una superficie anticipada hasta que F05 conecte el motor canónico a la representación.

## M05.1 — contrato implementado

- `src/domain/project/tree-operations.ts`: insert, move, nest, group, copy, paste, duplicate, lock, hide y rename.
- `TreeOwner` permite operar documentos o componentes globales mediante el mismo motor.
- `NodePlacement` representa raíz o `parentId + slot + index`.
- Move/nest rechazan ciclos obvios, destinos inválidos y locked state antes del validator global.
- Group requiere hermanos, preserva orden e inserta el grupo donde estaba el primer seleccionado.
- Copy genera `TreeClipboard` serializable; paste/duplicate crea IDs nuevos y remapea referencias internas.
- `ProjectStructureCommand` implementa `ReversibleProjectCommand<ProjectStructure>` y usa el bus de F03.
- Tests nuevos: 13 de operaciones de árbol + 3 de integración Command Bus.
- Evidencia: PR #12 / run `31456269215`, 34 archivos / 150 pruebas, lint/typecheck/build Vite 7.3.6 verdes.

## Roadmap ampliado F19–F31

- F19: Visual Builder avanzado, Selection Manager, Pages/Tree/Canvas/Workspace/mobile builder.
- F20: Component System, Component Studio y Design System.
- F21: Data Types, State, Variables y condiciones.
- F22: Action Flow/Graph y App Events.
- F23: Database Builder y Backend Queries.
- F24: API Manager/Tester/Mapping.
- F25: Authentication/RBAC/Security.
- F26: Media/Routing/Storyboard/Responsive/Localization/SEO.
- F27: Custom Code/Dependencies/Environments/Integrations.
- F28: Test Mode/Debug/Automated Tests.
- F29: Versioning/Branching/Collaboration.
- F30: AI Builder/Agents/Command Palette avanzado.
- F31: Export ampliado/Deployment/Production validation.

## Próximo paso exacto

Implementar `M05.2 — Canvas y renderer`: consumir `ProjectStructure` canónico, aislar errores por nodo, resolver responsive/hidden y asegurar actualizaciones granulares para que cambios locales no rerendericen todo el árbol.

No adelantar M05.3 ni F19 hasta cerrar M05.2 con evidencia reproducible.

## Riesgos abiertos

- F05 debe conectar el canvas anticipado al modelo canónico sin duplicar datos en estado React de presentación.
- El renderer debe evitar que un nodo defectuoso derribe el canvas completo.
- El renderer debe medir y probar granularidad de rerender antes de declararse optimizado.
- Collaboration/AI/integraciones remotas deben mantener funcionamiento local completo.
- Secrets nunca deben aparecer en frontend, logs o exports.

## Evidencia técnica base conservada

- M04.1: 102/102 pruebas.
- M04.2: 107/107 pruebas.
- M04.3: 112/112 pruebas.
- M04.4: 120/120 pruebas.
- M04.5: 132/132 pruebas.
- M05.1: 150/150 pruebas, lint/typecheck/build verdes.
- Las cifras históricas y publicaciones viven en `TRACKING.md` y `CHANGELOG.md`.

## Punteros

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Fases: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Estado: `TRACKING.md`.
- Diseño: `design-system/electrocms/MASTER.md`, `UI_UX_LAYOUT_SYSTEM.md`.
- Arquitectura: `ARCHITECTURE.md`.
- Modelo: `DATA_MODELS.md`.
- Persistencia: `PERSISTENCE.md`.
- CI/CD: `CI_CD.md`.
