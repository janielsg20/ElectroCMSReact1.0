# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

## Estado global

- Fase actual: `F06 — Registro de widgets y biblioteca`.
- Microfase actual: `M06.5 — UX de biblioteca`.
- Estado: `EN_CURSO`.
- F00–F04: `COMPLETADA`.
- `M05.1 — Operaciones del árbol`: `COMPLETADA`.
- `M05.2 — Canvas y renderer`: `COMPLETADA`.
- `M05.3 — Drag/drop y alternativas accesibles`: `COMPLETADA`.
- `M05.4 — Direct manipulation`: `COMPLETADA`.
- `M05.5 — Selección, zoom y viewport`: `COMPLETADA`.
- F05: `COMPLETADA`.
- `M06.1 — Contrato de widget`: `COMPLETADA`.
- `M06.2 — Estructurales y básicos`: `COMPLETADA`.
- `M06.3 — Contenido y dinámicos`: `COMPLETADA`.
- `M06.4 — Comercio, formularios y filtros`: `COMPLETADA`.
- F06: `EN_CURSO` en M06.5.
- F07–F18: `NO_INICIADA` salvo entregas UI anticipadas que no cierran sus fases funcionales.
- F19–F31: `NO_INICIADA`; añadidas como ampliación documental de paridad funcional tipo FlutterFlow.

## Roadmap ampliado

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, proyectos, autosave, recuperación y Command Bus/History |
| F04 | COMPLETADA | Shell desktop/tablet/móvil, workspace persistente y temas del editor |
| F05 | COMPLETADA | Árbol, renderer, DnD, manipulación directa, selección simple y viewport |
| F06 | EN_CURSO | M06.1–M06.4 completadas; M06.5 UX de biblioteca activa |
| F07–F18 | NO_INICIADA | Roadmap base restante |
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

## Cierres relevantes previos

- F03 cerró persistencia local-first, ProjectCommandBus e historial reversible persistente.
- F04 cerró shell responsive, workspace persistente y `appearance.v1`; la navegación aspiracional y su command palette se retiraron después para que la UI muestre solo áreas construidas.
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

## Cierre M05.2 — Canvas y renderer

- `CanvasPreview` dejó de renderizar un documento HTML duplicado y consume `ProjectStructure` mediante `CanonicalProjectRenderer`.
- `ProjectStructureRenderStore` valida cada reemplazo, conserva el modelo normalizado como única fuente y publica snapshots estables por `NodeId` con `useSyncExternalStore`.
- La resolución responsive de estructuras ya validadas evita revalidar el árbol completo por cada nodo.
- El renderer conserva orden de raíces y slots, expande componentes globales y representa `hidden` y `locked` por breakpoint.
- Cada nodo dispone de error boundary local; un adapter defectuoso no derriba ramas hermanas ni el documento completo.
- Una prueba de conteo de renders demuestra que actualizar un nodo no repinta su ancestro ni sus hermanos.
- Pruebas adicionales cubren orden, responsive, locked, componentes globales, rechazo atómico de estructuras inválidas y recuperación local de errores.
- Puerta local: lint, typecheck, **35 archivos / 156 pruebas** y build Vite 7.3.6 verdes.
- La verificación con navegador se intentó tras iniciar Vite; el CLI temporal no pudo iniciar su daemon por restricciones del runtime. Tests DOM y build sí completaron correctamente.

## Cierre M05.3 — Drag/drop y alternativas accesibles

- El panel dejó de consumir `layerItems`: deriva raíces, slots, profundidad y orden directamente del documento canónico.
- `@dnd-kit` aporta sensores independientes para pointer (umbral 4 px), touch (delay 180 ms/tolerancia 6 px) y teclado sortable, además de autoscroll.
- Cada capa muestra handle accesible, estado locked, anuncios de screen reader e indicador de inserción antes/después.
- El menú alternativo permite elegir destino y mover antes, después o dentro sin arrastrar.
- `BrowserEditorProjectSession` compone IndexedDB, `ProjectCommandBus`, `ProjectStructureCommand` y el render store; la UI nunca escribe el árbol ni crea history paralelo.
- Corregido el cálculo de índice al mover hacia delante dentro del mismo contenedor.
- Los chunks de DnD y persistencia local se separaron del entry principal para mantener el bundle principal bajo 500 kB.
- Puerta local: lint, typecheck, **36 archivos / 162 pruebas** y build Vite 7.3.6 verdes; entry principal 435.61 kB, DnD 56.94 kB y persistencia 96.43 kB.

## Cierre M05.4 — Direct manipulation

- Nuevo contrato puro de dominio para tamaño y box spacing canónicos, límites, locked state y snapping a retícula/guías.
- Los cambios se escriben en el override del breakpoint activo mediante `ProjectStructureCommand` y el `ProjectCommandBus` persistente.
- Cuatro handles accesibles admiten pointer/touch y flechas; el menú contextual permite editar ancho, alto, padding y margen sin arrastrar.
- Reglas horizontal/vertical y guías de snapping quedan superpuestas dentro de la región bidimensional del canvas.
- Breadcrumbs y árbol consumen la misma selección simple; el store de selección usa snapshots booleanos por nodo para evitar rerenders globales.
- Undo/redo del header ya ejecuta el history real y republica el estado aceptado por persistencia.
- Puerta local: lint, typecheck, **38 archivos / 169 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 451.84 kB.

## Cierre M05.5 — Selección, zoom y viewport

- Zoom, pan, fit, herramienta activa, orientación y viewport se integran de forma retrocompatible en `workspace.v1`.
- El pan está acotado, la región bidimensional mantiene overflow interno y zoom/pan nunca modifican `ProjectStructure`.
- Device frames móvil/tablet alternan orientación; toolbar y teclado controlan zoom/pan/fit.
- Foco explícito entre Capas/Canvas/Inspector mediante botones y `Alt+1/2/3`, con anillo visible en el viewport.
- Puerta local: lint, typecheck, **40 archivos / 175 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 457.58 kB.
- F05 queda completada y F06 comienza en M06.1.

## Cierre M06.1 — Contrato de widget

- Definido `WidgetDefinition` versionado con schema/defaults, rendererId, inspector declarativo, icono SVG, accesibilidad, migraciones y soporte por exportador.
- `WidgetRegistry` valida contratos completos, evita duplicados y mantiene el dominio libre de React/DOM/exportadores concretos.
- Diagnósticos tipados distinguen errores y warnings de compatibilidad Local/React/LAMP/WordPress.
- Puerta local: lint, typecheck, **41 archivos / 179 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 457.59 kB.

## Cierre M06.2 — Estructurales y básicos

- Registradas las 15 definiciones estructurales y 20 básicas exigidas por la sección 9 con schema/defaults, inspector, icono, accesibilidad y matriz completa de exportadores.
- `ReactWidgetAdapterRegistry` resuelve `rendererId` fuera del dominio y verifica correspondencia 1:1 para las 35 definiciones.
- `renderCanonicalWidget` valida defaults + overrides y usa el registro antes del fallback; los casos equivalentes fueron retirados del switch provisional.
- HTML nunca se interpreta en el preview y los iframes inválidos se aíslan en `about:blank` con sandbox.
- La revisión React mantuvo adapters a nivel de módulo, sin hooks/estado duplicado ni componentes inline, y evitó imports barrel en la nueva capa.
- Puerta local: lint, typecheck, **43 archivos / 188 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry principal 483.30 kB.

## Cierre M06.3 — Contenido y dinámicos

- Registradas 20 definiciones de contenido y 14 dinámicas; el catálogo acumulado alcanza 69 widgets sin un segundo registro.
- Cada definición valida defaults, expone todas sus propiedades en inspector y declara soporte Local/React/LAMP/WordPress.
- Los adapters React representan fallbacks, bindings y estados vacíos sin ejecutar queries, relaciones, expresiones ni condiciones externas.
- Retirados del switch provisional los casos `content.card` y `content.metric` ya cubiertos por el registro.
- El chunk `widget-catalog` de 130.36 kB mantiene el entry principal en 379.66 kB y elimina el warning de 500 kB.
- Puerta local: lint, typecheck, **45 archivos / 197 pruebas**, build Vite 7.3.6 y `git diff --check` verdes.

## Cierre M06.4 — Comercio, formularios y filtros

- Registradas 15 definiciones de comercio, 20 de formularios y 11 filtros; el catálogo acumulado alcanza 115 widgets.
- Checkout, carrito, wishlist, CAPTCHA, submit, queries, filtros y carga progresiva se representan como contratos/estados declarativos sin backend simulado.
- Campos y filtros usan controles HTML nativos; destinos inseguros o ausentes se bloquean y el preview impide submit remoto.
- El chunk `widget-catalog` crece a 153.39 kB mientras el entry principal permanece en 379.66 kB.
- Puerta local: lint, typecheck, **47 archivos / 206 pruebas**, build Vite 7.3.6 y `git diff --check` verdes.

## Ajuste de integridad de alcance durante M06.5

- Retirada por decisión de producto la “demo final” y sus datos: dashboard, módulos futuros, métricas, rutas profundas, command palette y navegación a páginas no implementadas.
- Eliminados controles inertes que aparentaban funciones futuras: Run, preview, IA, bindings, acciones, backend, páginas y creación/inserción aún inexistentes.
- El runtime arranca con `Proyecto local / Página inicial`, una estructura canónica mínima de cuatro nodos y una base IndexedDB v2 separada de la antigua demo.
- La biblioteca consume directamente las 115 definiciones del `WidgetRegistry`, con búsqueda real y catálogo informativo; no afirma inserción hasta que exista el comando correspondiente.
- El inspector dejó de mantener inputs decorativos: muestra selección, estado, propiedades, estilos y overrides tomados del nodo canónico.
- Desktop conserva rail, canvas, paneles acoplables/flotantes, capas, direct manipulation, historial, responsive, zoom/pan y apariencia; móvil queda reducido a Widgets, Capas, Canvas e Inspector.
- `M06.5` continúa `EN_CURSO`: este ajuste no implementa favoritos, recientes, filtros por categoría ni inserción click/drag.
- Puerta local posterior a la limpieza: lint, typecheck, **46 archivos / 200 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 316.13 kB y catálogo 153.39 kB.

## Próximo paso exacto

`M06.5 — UX de biblioteca`:

- conservar el catálogo ya conectado a las 115 definiciones reales y su búsqueda;
- implementar categorías, filtros, favoritos, recientes, miniaturas y widgets guardados;
- insertar por clic y drag mediante el Command Bus, con alternativa completa sin arrastre;
- persistir solo preferencias de biblioteca fuera del documento.

## Bloqueos

- Ninguno para M06.5.
- F19–F31 siguen deliberadamente pendientes de sus dependencias.

## Criterio para cambiar de microfase

No avanzar hasta cerrar la microfase activa con evidencia reproducible. La documentación o prototipos anticipados no cuentan como implementación formal.

## Evidencia técnica histórica resumida

- M04.1: run `31451142252`, 102/102 pruebas.
- M04.2: run `31453249710`, 107/107 pruebas.
- M04.3: run `31454024650`, 112/112 pruebas.
- M04.4: run `31454811218`, 120/120 pruebas.
- M04.5: run `31455514122`, 132/132 pruebas.
- M05.1: run `31456269215`, 150/150 pruebas, lint/typecheck/build verdes.
- M05.2: puerta local, 156/156 pruebas, lint/typecheck/build verdes; publicación/CI aún no ejecutados.
- M05.3: puerta local, 162/162 pruebas, lint/typecheck/build verdes; publicación/CI aún no ejecutados.
- M05.4: puerta local, 169/169 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M05.5: puerta local, 175/175 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.1: puerta local, 179/179 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.2: puerta local, 188/188 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.3: puerta local, 197/197 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- M06.4: puerta local, 206/206 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- Ajuste de alcance en M06.5: puerta local, 200/200 pruebas, lint/typecheck/build y `git diff --check` verdes; publicación/CI aún no ejecutados.
- Historial detallado de commits, runs, bundles y resultados anteriores: `CHANGELOG.md`.

## Documentos de control

- Alcance base: `PROMPT_MAESTRO_ELECTROCMS.md`.
- Alcance ampliado: `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Trazabilidad: `REQUIREMENTS.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md`.
- Microfases: `DETAILED_EXECUTION_PHASES.md`.
- Memoria: `MEMORY.md`.
