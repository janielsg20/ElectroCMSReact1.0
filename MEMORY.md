# MEMORY — contexto corto de ElectroCMS

Actualizado: 2026-08-11.

> La auditoría visual F04/M04.1 quedó cerrada: Biblioteca responde a su ancho real, el canvas evita colisiones, Apariencia permanece local al editor y `Diseño` concentra recursos exportables. M08.4 quedó implementada y validada después de esa auditoría.

## Objetivo

Construir ElectroCMS como CMS/visual app builder local-first en React + TypeScript + Tailwind CSS, con editor no-code, contenido dinámico, backend visual y exportadores Local, React, LAMP y WordPress.

## Fuentes de verdad

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Estado: `TRACKING.md`; plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Reglas: `RULES.md`; arquitectura aceptada: `ARCHITECTURE.md`.
- FlutterFlow es referencia de capacidades, no fuente de código, branding ni activos.

## Estado real

- React 19, TypeScript estricto, Tailwind 4, Vite y PWA local-first.
- F00–F08 completadas.
- Auditoría extraordinaria F04/M04.1 cerrada sin invalidar su cierre histórico.
- Fase activa: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- Microfase activa: `M09.1 — CPT`.
- F10–F18 y F19–F31 permanecen `NO_INICIADA` salvo contratos/documentación anticipados que no cuentan como implementación formal.
- Puerta de cierre M08.4: GitHub Actions run `31543564627`; lint, typecheck, suite completa y build verdes. Producción no se desplegó porque el trabajo sigue en PR draft.

## Decisiones vigentes

- Dominio y modelo canónico independientes de React, Tailwind, almacenamiento y exportadores.
- Modelo, preview y exportación comparten una sola fuente de verdad.
- Toda mutación persistente del editor usa `ProjectStructureCommand` + `ProjectCommandBus`; no crear otro historial.
- Árbol y canvas consumen `ProjectStructure`; la UI no mantiene árboles ni documentos paralelos.
- Undo/redo crea revisiones monotónicas nuevas y persiste en IndexedDB.
- `workspace.v1`, `appearance.v1`, `library.v1` y `theme-packages.v1` son datos locales de producto/preferencias; solo aplicar un paquete modifica el proyecto.
- No duplicar Selection, State, Action Flow, DataProvider, Auth, Components, History ni Export.
- Funciones futuras no se muestran como activas; se registran como `PARITY_GAP` en su fase propietaria.

## UI/UX vigente

- Dirección: High Density + Minimal Clean + builder/IDE profesional.
- Desktop usa rail, paneles dock/float/minimize y canvas prioritario; tablet y móvil conservan las funciones construidas mediante paneles adaptados.
- La navegación expone solo áreas funcionales; dashboard, IA, preview/run y controles aspiracionales permanecen fuera hasta sus fases reales.
- Apariencia del editor vive en TopBar y nunca se confunde con temas exportables.
- `Biblioteca → Diseño` usa dos superficies: `Tema` para frontend/backend y `Paquetes` para recursos reutilizables.
- Canvas mantiene selección compartida, breadcrumbs, resize, spacing, snapping, reglas, zoom, pan, orientación, device frames y foco entre regiones.
- La barra del canvas se distribuye en tres regiones y adapta controles por container width; se eliminó el estado inferior redundante.
- Popovers/paneles respetan el bottom dock móvil; targets interactivos son aproximadamente 44 px en touch y 36 px en escritorio denso.
- Las cuatro pestañas de Biblioteca adaptan iconos/etiquetas al ancho real; `Documentos` puede mostrarse visualmente como `Docs` sin perder su nombre accesible.

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

## F07 — inspector, estilos y responsive completados

- Inspector generado desde `WidgetDefinition.inspector`: Contenido, Estilo, Layout, Responsive, Datos, Condiciones, Animaciones, Accesibilidad y Avanzado.
- Controles tipados, JSON estructurado, errores inline, defaults seguros y reset; update/reset pasan por Command Bus.
- `style-engine.ts` resuelve tokens/herencia y CSS seguro; bloquea CSS arbitrario, `url()`, `expression`, ciclos e inyección.
- Breakpoints canónicos son editables y heredables; reset elimina solo el override activo y es reversible.
- Bindings literales/rutas/referencias de nodo, condiciones y ARIA comparten contrato entre inspector, renderer, persistencia y undo.

## M08.1 completada — tres ámbitos de tema

- Editor es preferencia local `appearance.v1`; frontend/backend viven en `ProjectStructure.themes`.
- Cada tema usa schema v1 y tokens semánticos estrictos; update/reset pasan por Command Bus, IndexedDB y undo/redo.
- El renderer consume frontend por defecto y backend explícito sin compartir tokens.

## M08.2 completada — presets visuales

- Nueve presets normativos del editor y once presets inmutables de proyecto.
- Frontend/backend permanecen independientes y editables después de aplicar.
- 20 variantes del editor y 11 temas de proyecto verifican contraste WCAG AA automáticamente.

## M08.3 completada — motor de plantillas

- Documentos canónicos: page, template, header, footer, single, archive y 404.
- Composición determinista por prioridad/especificidad/ID, rutas únicas y condiciones tipadas.
- Crear documentos y actualizar condiciones pasan por `ProjectStructureCommand`, IndexedDB y undo/redo.
- `TEMPLATE_SYSTEM.md` conserva el contrato y límites.

## M08.4 completada — paquetes theme

- `ThemePackageSchema`: `electrocms.theme-package`, schema v1, ID UUID y SemVer.
- Partes actuales: tema frontend, tema backend, documentos, componentes globales y breakpoints dependientes.
- Biblioteca local `theme-packages.v1`: crear, editar, duplicar, versionar, importar, exportar y borrar no modifica `ProjectStructure`.
- Importar nunca aplica automáticamente; aplicar exige selección explícita de partes.
- Aplicación remapea IDs, slots, bindings, responsive y referencias de componentes; la estructura candidata completa se valida antes de persistir.
- Conflictos de rutas: `abort` o renombrado determinista de la copia importada mediante `suffix`; nunca sobrescritura silenciosa.
- Aplicar entra al historial mediante `ProjectStructureCommand` + `ProjectCommandBus`; undo real está cubierto por integración.
- UI: `Biblioteca → Diseño → Paquetes`, con SemVer, import/export, confirmación de borrado en dos pasos, selección de partes y política de rutas.
- `THEME_PACKAGE_SYSTEM.md` conserva el contrato completo.

## Riesgos y límites

- F09 debe reutilizar `CmsBackendSchema`/`validateCmsBackend` existentes como contratos anticipados, pero su existencia no significa que CPT/taxonomías/campos estén implementados.
- M09.1 debe formalizar CRUD de tipos de contenido, capacidades, soportes, visibilidad y vínculo single/archive con persistencia e historial reales antes de avanzar a M09.2.
- El inspector debe usar el registro existente y no duplicar schemas ni defaults.
- Ediciones futuras deben converger en Command Bus y resolver overrides por breakpoint.
- Collaboration, AI e integraciones remotas nunca degradan el modo offline/local.
- Secrets no aparecen en frontend, logs, exports ni bundles.

## Próximo paso exacto

Implementar `M09.1 — CPT`: CRUD canónico de tipos de contenido, capacidades, soportes, visibilidad y plantillas single/archive; integrar persistencia/historial y UI funcional, probar invariantes y no avanzar a M09.2 hasta una puerta completa verde.
