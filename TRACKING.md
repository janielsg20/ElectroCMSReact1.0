# TRACKING — ElectroCMS

Actualizado: 2026-08-10.

## Estado global

- Fase actual: `F05 — Motor de documentos, nodos y canvas`.
- Microfase actual: `M05.1 — Operaciones del árbol`.
- Estado: `EN_CURSO`.
- F00–F04: `COMPLETADA`.
- `M04.1 — Shell desktop`: `COMPLETADA`.
- `M04.2 — Shell tablet`: `COMPLETADA`.
- `M04.3 — Shell móvil`: `COMPLETADA`.
- `M04.4 — Navegación, rutas y shortcuts`: `COMPLETADA`.
- `M04.5 — Temas del editor`: `COMPLETADA`.
- F05: `EN_CURSO` en M05.1.
- F06–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
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
| F04 | COMPLETADA | Shell desktop/tablet/móvil, navegación profunda, shortcuts y temas del editor |
| F05 | EN_CURSO | Motor de documentos, nodos y canvas; M05.1 activa |
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
- Puerta técnica final PR #6 / run `31451142252`: lint, typecheck, 26 archivos de test / 102 pruebas y build Vite 7.3.6 correctos.

## Cierre M04.2 — Shell tablet

- `ResponsiveEditorShell` adapta el shell existente sin duplicar el workspace desktop.
- Entre 768 y 1023 px el rail se presenta contraído a 44 px y el canvas conserva prioridad de espacio.
- Biblioteca e Inspector se intercambian como único panel contextual persistente; el secundario se abre como dialog lateral superpuesto, redimensionable y descartable.
- El overlay soporta puntero/teclado, `Home`/`End`, ARIA, `Escape`, focus trap y restauración de foco.
- La geometría tablet es efímera y no se escribe en `workspace.v1`.
- Puerta técnica PR #8 / run `31453249710`: 27 archivos / 107 pruebas, lint/typecheck/build verdes.

## Cierre M04.3 — Shell móvil

- Se formalizó la UI móvil existente dentro del mismo `ResponsiveEditorShell`.
- Canvas prioritario, dock `Widgets / Páginas / Canvas / Props / Más`, sheets accesibles, safe areas y targets táctiles de 44 px.
- `Canvas` fuera del Editor abre navegación compacta para evitar una acción muerta.
- Al cruzar a 768 px se cierra la sheet temporal y M04.2 toma control sin trasladar geometría móvil.
- Puerta técnica PR #9 / run `31454024650`: 28 archivos / 112 pruebas, lint/typecheck/build verdes.

## Cierre M04.4 — Navegación, rutas y shortcuts

- Rutas profundas canónicas `#/sección` con History API, sin segundo router ni segundo `activeSection`.
- `popstate` restaura sección sin desmontar el shell y conserva `workspace.v1`.
- `Producto / sección` funciona como breadcrumb visible.
- `CommandPalette` con launcher, búsqueda, combobox/listbox, flechas, Enter, Escape y restauración de foco.
- Atajos: `Ctrl/⌘+K`, `Alt+Shift+E`, `Alt+Shift+H`, `Alt+Shift+P`.
- Puerta técnica PR #10 / run `31454811218`: 30 archivos / 120 pruebas, lint/typecheck/build verdes y log sin warnings React del flujo nuevo.

## Cierre M04.5 — Temas del editor / cierre F04

- Añadido contrato versionado `appearance.v1`, separado de `workspace.v1` y del modelo canónico del proyecto.
- El preset visual (`Studio`, `Bento Motion`, `Flow Builder`) y el modo de color (`Claro`, `Oscuro`, `Automático`) son preferencias independientes.
- El selector de apariencia usa dos `radiogroup` accesibles; preset y color se operan por clic, flechas, `Home`/`End`, `Escape` y restauración de foco.
- El modo `Automático` sigue `prefers-color-scheme` mediante `matchMedia` y reacciona a cambios del sistema sin recargar.
- `main.tsx` aplica la preferencia persistida antes de montar React para reducir el flash de apariencia; defaults seguros siguen siendo Studio + claro.
- Preferencias corruptas, de versión desconocida o con campos extra se ignoran y recuperan defaults seguros.
- Se alineó `theme-color` HTML con el azul de marca `#2563EB`; el manifest ya usa `#2563eb`.
- El gate de contraste WCAG AA ahora cubre seis variantes: Studio/Bento/Flow × claro/oscuro.
- Pruebas específicas validan contrato/persistencia, corrupción, separación preset/color, navegación por teclado, restauración y cambios dinámicos de `prefers-color-scheme`.
- El primer run de PR #11 detectó dos infracciones de lint (ref durante render y `matchMedia` no ligado); se corrigieron sin relajar reglas.
- Puerta técnica PR #11 / run `31455514122`: lint, typecheck, 32 archivos de test / 132 pruebas verdes y build Vite 7.3.6 correcto.
- Con M04.1–M04.5 cerradas, `F04 — Application shell, navegación y workspaces responsive` queda `COMPLETADA`.

## Entregas UI anticipadas que continúan pendientes de su fase propietaria

- Biblioteca/árbol, canvas e inspector existen visualmente y con interacciones parciales.
- `src/ui-integrity-v11.css` sigue como guardrail cross-theme para tamaño, selección, foco y overflow.
- F04 formaliza shell responsive, navegación y apariencia; no cierra el motor funcional de nodos/canvas F05, widgets F06–F07 ni F19.
- La consolidación de CSS/primitives continúa de forma segura al entrar cada microfase propietaria.

## Próximo paso exacto

`M05.1 — Operaciones del árbol`:

- implementar insertar, mover, anidar, agrupar, copiar, pegar, duplicar, bloquear, ocultar y renombrar nodos;
- conservar invariantes estructurales del modelo canónico;
- integrar las mutaciones relevantes con el Command Bus/historial reversible de F03;
- soportar selección múltiple sin crear un Selection Manager paralelo al futuro F19;
- probar ciclos, padres inválidos, orden, duplicación profunda, bloqueo/ocultación y operaciones multi-nodo;
- no avanzar a M05.2 hasta cerrar M05.1 con evidencia reproducible.

## Bloqueos

- Ninguno para M05.1.
- F19–F31 están deliberadamente pendientes de sus dependencias, no bloqueadas.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

## Evidencia técnica histórica resumida

- CI/CD GitHub Actions + Cloudflare Pages configurados y verificados.
- PWA offline, manifest y Service Worker implementados.
- Modelo canónico v1, Zod, migraciones, breakpoints, CMS models y relaciones probados.
- Dexie/IndexedDB, ciclo de proyecto, import/export, recovery journal y project-history probados.
- M04.1: run `31451142252`, 102/102 pruebas.
- M04.2: run `31453249710`, 107/107 pruebas.
- M04.3: run `31454024650`, 112/112 pruebas.
- M04.4: run `31454811218`, 120/120 pruebas.
- M04.5: run `31455514122`, 132/132 pruebas y contraste AA Studio/Bento/Flow claro/oscuro.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
