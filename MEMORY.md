# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-11.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura aceptada: `ARCHITECTURE.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F07 completadas.
- Fase activa: `F08 — Temas, plantillas y paquetes`.
- `M08.1–M08.2` completadas; `M08.3 — Motor de plantillas` `EN_CURSO`.
- F09–F18 y F19–F31 permanecen `NO_INICIADA`.
- Puerta más reciente: lint/typecheck, 59 archivos y 271/271 pruebas, build Vite 7.3.6 y `git diff --check` verdes.

## Decisiones vigentes

- Dominio y modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación comparten una sola fuente de verdad.
- Toda mutación persistente del editor usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro historial.
- Árbol y canvas consumen `ProjectStructure`; la UI no mantiene árboles ni documentos paralelos.
- Undo/redo crea revisiones monotónicas nuevas y persiste en IndexedDB.
- `workspace.v1`, `appearance.v1` y `library.v1` son preferencias locales de UI, no datos del proyecto.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.
- Funciones futuras no se muestran como activas; se registran como `PARITY_GAP` en su fase propietaria.

## UI/UX vigente

- Dirección: High Density + Minimal Clean + builder/IDE profesional.
- Desktop usa rail, paneles dock/float/minimize y canvas prioritario; tablet y móvil conservan todas las funciones construidas mediante paneles adaptados.
- La navegación expone solo Editor; se retiraron dashboard, módulos, rutas, IA, preview/run y controles aspiracionales.
- Presets de editor: Studio, Bento Motion y Flow Builder; color Claro/Oscuro/Automático en `appearance.v1`.
- Canvas mantiene selección compartida, breadcrumbs, resize, spacing, snapping, reglas, zoom, pan, orientación, device frames y foco entre regiones.

## F05 — motor canónico completado

- `tree-operations.ts`: insert, move, nest, group, copy/paste, duplicate, lock, hide y rename con validación integral.
- `CanonicalProjectRenderer` y `ProjectStructureRenderStore` renderizan roots/slots/componentes globales con snapshots granulares por nodo y error boundaries locales.
- Capas usa sensores DnD pointer/touch/teclado, autoscroll, anuncios y menú antes/después/dentro.
- Direct manipulation persiste tamaño y espaciado responsive mediante Command Bus; locked rechaza mutaciones.
- `workspace.v1` persiste zoom 25–200 %, pan, fit, viewport, orientación y paneles.

## F06 — widgets y biblioteca completados

- `WidgetDefinition` declara ID/versión, schema/defaults, renderer, inspector, icono SVG, migraciones, accesibilidad y soporte Local/React/LAMP/WordPress.
- Catálogo único: 15 estructurales, 20 básicos, 20 de contenido, 14 dinámicos, 15 de comercio, 20 de formulario y 11 filtros; total 115.
- `ReactWidgetAdapterRegistry` vive fuera del dominio; adapters sensibles muestran estados honestos sin ejecutar backend, queries, pagos ni envíos.
- HTML/iframes/destinos inseguros se aíslan o bloquean; controles usan semántica nativa.
- Biblioteca: búsqueda diferida, categorías, favoritos, recientes, guardados, miniaturas y DnD pointer/touch/teclado.
- `library.v1` persiste preferencias y hasta 50 presets locales; un preset conserva propiedades, estilos y responsive, nunca hijos/bindings/condiciones.
- `insertWidget` valida contra el registro, genera ID, inserta dentro del contenedor seleccionado o después de la selección y pasa por Command Bus.
- F06 cerró con 209/209 pruebas; entry 329.71 kB y catálogo separado 153.39 kB.

## M07.1 completada

- El inspector genera Contenido, Estilo, Layout, Responsive, Datos, Condiciones, Animaciones, Accesibilidad y Avanzado desde `WidgetDefinition.inspector`.
- Cada campo muestra descriptor, valor efectivo y origen Nodo/Predeterminado; no existen inputs inertes.
- `INSPECTOR_SYSTEM.md` conserva el contrato detallado.

## M07.2 completada

- Controles nativos tipados, JSON para valores complejos, error inline, defaults seguros y reset.
- Update/reset validan el schema completo y pasan por Command Bus; integración IndexedDB cubre undo.
- `INSPECTOR_SYSTEM.md` conserva el contrato detallado.

## M07.3 completada

- `style-engine.ts` resuelve tokens y herencia, ordena clases/declaraciones/estados y genera CSS limitado por `data-style-scope`.
- Solo admite propiedades y estados declarados; bloquea CSS arbitrario, `url()`, `expression`, ciclos de token y valores inyectables.
- Preview y futuros exportadores comparten `compileCanonicalStyles`; el renderer no contiene otro compilador.
- `CanonicalStyleControl` edita clases, declaraciones y estados estructurados; geometría de canvas queda protegida.
- Update/reset validan y persisten mediante Command Bus; integración IndexedDB cubre undo.
- `STYLE_ENGINE.md` conserva el contrato detallado.

## M07.4 completada

- Breakpoints canónicos editables: alta, nombre, ancho, orientación, orden y herencia con rechazo de ciclos.
- Canvas selecciona cualquier breakpoint, usa su ancho real y persiste solo ID/orientación de preview en `workspace.v1`.
- Reset elimina únicamente el override activo del nodo y es reversible por Command Bus.
- `RESPONSIVE_ENGINE.md` conserva el contrato detallado.

## M07.5 completada

- Bindings literales, rutas de proyecto y referencias entre nodos resuelven propiedades antes del adapter.
- Condiciones tipadas controlan visibilidad con diagnóstico fail-visible; fuentes dinámicas futuras no se simulan.
- ARIA canónica admite label, description, roles permitidos y tabIndex -1/0.
- Inspector, renderer, IndexedDB y undo comparten el contrato de `DATA_CONDITION_SYSTEM.md`.

## M08.1 completada

- Editor es una preferencia local en `appearance.v1`; frontend y backend viven como temas canónicos independientes en `ProjectStructure.themes`.
- Cada tema usa schema v1 y tokens semánticos estrictos para color, tipografía, spacing, radius, shadow, motion y density.
- Las estructuras anteriores reciben defaults seguros; update/reset pasan por Command Bus, IndexedDB y undo/redo.
- El renderer usa frontend por defecto y admite backend explícito; ambos alimentan `compileCanonicalStyles` sin compartir tokens.
- El gestor visible separa los tres ámbitos y no convierte Studio/Bento/Flow en salida exportable.
- `THEME_SYSTEM.md` conserva el contrato detallado.

## M08.2 completada

- El editor ofrece nueve presets normativos con claro/oscuro, tokens y migración de Studio/Bento/Flow dentro de `appearance.v1`.
- Frontend/backend comparten once presets inmutables; aplicar crea una copia editable solo en el ámbito elegido mediante historial.
- Los catálogos declaran layout, bordes, componentes, elevación, densidad, responsive y accesibilidad sin reemplazar contenido o breakpoints.
- 20 variantes del editor y 11 temas de proyecto verifican automáticamente contraste WCAG AA.

## Alcance activo M08.3

- Formalizar páginas, templates, headers, footers, single, archive, 404 y componentes globales sobre `ProjectStructure`.
- Añadir condiciones deterministas y operaciones reversibles sin duplicar documentos ni árboles.

## Riesgos y límites

- El inspector debe usar el registro existente y no duplicar schemas ni defaults.
- Ediciones futuras deben converger en Command Bus y resolver overrides por breakpoint.
- Collaboration, AI e integraciones remotas nunca degradan el modo offline/local.
- Secrets no aparecen en frontend, logs, exports ni bundles.

## Próximo paso exacto

Implementar `M08.3 — Motor de plantillas` sobre los documentos y componentes globales canónicos existentes.
