# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F04 — Application shell, navegación y workspaces responsive`.
- Microfase actual: `M04.4 — Navegación, rutas y shortcuts`.
- Estado: `EN_CURSO`.
- F00–F03: `COMPLETADA`.
- `M04.1 — Shell desktop`: `COMPLETADA`.
- `M04.2 — Shell tablet`: `COMPLETADA`.
- `M04.3 — Shell móvil`: `COMPLETADA`.
- F05–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.
- La incorporación del Addendum no cambia ni adelanta el orden real de fases.

## Ampliación de alcance 2026-08-10

- `FLUTTERFLOW_PARITY_ADDENDUM.md` creado como alcance normativo adicional.
- `PHASES.md` ampliado de F00–F18 a F00–F31 sin renumerar fases existentes.
- `DETAILED_EXECUTION_PHASES.md` ampliado con microfases M19.1–M31.8.
- `REQUIREMENTS.md` actualizado con trazabilidad de cada área del Addendum.
- `RULES.md`, `AGENTS.md`, `README.md` y `MEMORY.md` actualizados para preservar continuidad y evitar ejecución prematura.
- Capacidades faltantes se registran como `PARITY_GAP` y no se presentan como implementadas.
- No se crean implementaciones paralelas de Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.

## Roadmap ampliado

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, proyectos, autosave, recuperación y Command Bus/History |
| F04 | EN_CURSO | M04.1 desktop, M04.2 tablet y M04.3 móvil completadas; M04.4 navegación/rutas activa |
| F05–F18 | NO_INICIADA | Roadmap base restante |
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

## Cierre F03 / M03.4

- `ProjectCommandBus` implementa execute, undo y redo con revisiones monotónicas.
- `CompositeProjectCommand` agrupa mutaciones como una sola transacción lógica.
- `ProjectHistoryState` v1 persiste entries before/after, cursor y operación pendiente recuperable.
- Branching tras undo, límites configurables, conflictos sin sobrescritura y recuperación están probados.
- IndexedDB usa namespace `project-history` y conserva cursor/historial tras reapertura.

## Cierre M04.1 — Shell desktop

- Se formalizó el shell desktop existente; no se creó una segunda implementación.
- Añadido contrato `workspace.v1` en `src/editor-ui/editor/workspace-preferences.ts` con schema Zod estricto y `WorkspacePreferencesStore`.
- Persistencia local de rail, anchuras de Biblioteca/Inspector, modo docked/floating/minimized, lado de dock, bounds, pin y orden de apilado.
- Activar un panel actualiza su orden; los paneles flotantes y la barra de minimizados respetan ese orden persistente.
- La restauración limita rail/anchuras y reubica ventanas flotantes dentro del viewport actual; preferencias corruptas o de versión desconocida se ignoran de forma segura.
- `localStorage` se usa solo como adapter de preferencias de UI; estos datos no contaminan el modelo canónico del proyecto.
- Añadidas pruebas de round-trip, corrupción/versionado, limpieza, persistencia real tras remontaje y fallback seguro.
- Se corrigió la hidratación para evitar `setState` síncrono dentro de effects y renders redundantes; el log final no contiene avisos `act(...)` del workspace.
- Puerta técnica final PR #6 / run `31451142252`: lint, typecheck, 26 archivos de test / 102 pruebas y build Vite 7.3.6 correctos.

## Cierre M04.2 — Shell tablet

- Añadido `ResponsiveEditorShell` como capa adaptativa sobre el shell existente, sin duplicar el workspace desktop ni crear una segunda fuente de verdad.
- Entre 768 y 1023 px el rail se presenta completamente contraído a 44 px y el canvas conserva prioridad de espacio.
- Biblioteca e Inspector se intercambian como único panel contextual persistente; el secundario se abre como dialog lateral superpuesto y descartable.
- El overlay secundario admite resize por puntero y teclado, `Home`/`End`, valores ARIA, `Escape`, focus trap y restauración de foco al disparador.
- El panel secundario puede promoverse a persistente mediante una acción explícita; nunca quedan dos paneles persistentes simultáneos en tablet.
- Portrait 768 y landscape 1023 están cubiertos por pruebas; al cruzar a 1024 se desmontan las superficies tablet y reaparece el comportamiento desktop.
- Anchura y geometría del overlay tablet son estado efímero en React y no se escriben en `workspace.v1`; una prueba compara el payload de preferencias antes/después del resize.
- El rail tablet oculta también etiquetas y encabezados heredados cuando la preferencia desktop estaba expandida, sin modificar esa preferencia persistida.
- Puerta técnica PR #8 / run `31453249710`: lint y typecheck correctos, 27 archivos de test / 107 pruebas verdes y build Vite 7.3.6 correcto.

## Cierre M04.3 — Shell móvil

- Se formalizó la UI móvil existente como parte del mismo `ResponsiveEditorShell`; no se duplicaron Editor, Biblioteca, Inspector ni navegación.
- El scope móvil se activa explícitamente por debajo de 768 px mediante `data-mobile-shell`, conservando M04.2 al entrar en tablet.
- El canvas permanece como región prioritaria y reserva el espacio del dock inferior y safe areas sin introducir scroll horizontal de página.
- El dock se normalizó a cinco destinos: `Widgets / Páginas / Canvas / Props / Más`; el resto de módulos continúa accesible desde `Más`.
- Biblioteca, Páginas y Props usan sheets accesibles con cierre explícito, `Escape`, focus trap/restauración de foco y targets touch de al menos 44 px.
- Se corrigió el caso de navegación fuera del Editor: `Canvas` ya no queda como acción muerta y abre la navegación compacta para permitir regresar al Editor.
- Al cruzar de móvil a tablet una sheet abierta se cierra mediante el flujo normal del shell, sin arrastrar estado temporal a M04.2.
- Se añadieron guardrails de `max-width`, `overscroll-behavior`, safe-area y `prefers-reduced-motion` para 320–767 px.
- Pruebas específicas validan 320 px, 375 px, todos los destinos críticos, retorno al Editor y transición a 768 px.
- El primer run detectó dos queries ambiguas de Testing Library; se corrigieron sin cambiar la lógica de producto y se eliminó además un warning `act(...)` del setup/cleanup de viewport.
- Puerta técnica PR #9 / run `31454024650`: lint, typecheck, 28 archivos de test / 112 pruebas verdes y build Vite 7.3.6 correcto, sin warnings React del nuevo test móvil.

## Entregas UI anticipadas que continúan pendientes de su fase propietaria

- Biblioteca/árbol, canvas, inspector y themes existen visualmente y con interacciones parciales.
- `src/ui-integrity-v11.css` sigue como guardrail cross-theme para tamaño, selección, foco y overflow.
- M04.1–M04.3 formalizan shell desktop/tablet/móvil; no cierran rutas/shortcuts, themes, F05–F07 ni F19.
- La consolidación de CSS/primitives continúa de forma segura al entrar cada microfase propietaria.

## Próximo paso exacto

`M04.4 — Navegación, rutas y shortcuts`:

- implementar URLs profundas y restauración desde URL;
- asegurar comportamiento predecible de back/forward;
- añadir breadcrumbs donde aporten contexto;
- formalizar command palette y atajos documentados sin ocultar controles visibles;
- preservar el estado relevante al navegar;
- probar teclado, semántica accesible y navegación histórica antes de avanzar a M04.5.

## Bloqueos

- Ninguno para M04.4.
- F19–F31 están deliberadamente pendientes de sus dependencias, no bloqueadas.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

## Evidencia técnica histórica resumida

- CI/CD GitHub Actions + Cloudflare Pages configurados y verificados en entregas previas.
- PWA offline, manifest y Service Worker implementados.
- Modelo canónico v1, Zod, migraciones, breakpoints, CMS models y relaciones probados.
- Dexie/IndexedDB, ciclo de proyecto, import/export, recovery journal y project-history probados.
- M04.1: run `31451142252`, 102/102 pruebas, lint/typecheck/build verdes.
- M04.2: run `31453249710`, 107/107 pruebas, lint/typecheck/build verdes; pruebas específicas 768/1023 y transición a 1024.
- M04.3: run `31454024650`, 112/112 pruebas, lint/typecheck/build verdes; pruebas específicas 320/375 y transición a 768.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
