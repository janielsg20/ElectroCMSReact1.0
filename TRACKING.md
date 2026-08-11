# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- Microfase actual: `M09.2 — Taxonomías`.
- Estado: `EN_CURSO`.
- F00–F08: `COMPLETADA`.
- `M09.1 — CPT`: `COMPLETADA`.
- `M09.2–M09.5`: pendientes, con M09.2 activa.
- F10–F18: `NO_INICIADA` salvo contratos anticipados que no cuentan como implementación formal.
- F19–F31: `NO_INICIADA`; ampliación documental de paridad funcional.
- Auditoría extraordinaria F04/M04.1: `COMPLETADA` sin invalidar el cierre histórico de F04.

## Roadmap

| Fase | Estado | Alcance |
|---|---|---|
| F00 | COMPLETADA | Descubrimiento y contratos |
| F01 | COMPLETADA | Plataforma React/Tailwind/PWA |
| F02 | COMPLETADA | Modelo canónico y migraciones |
| F03 | COMPLETADA | Persistencia local-first, autosave, recuperación y Command Bus/History |
| F04 | COMPLETADA | Shell responsive, workspace persistente y apariencia local |
| F05 | COMPLETADA | Árbol, renderer, DnD, manipulación directa, selección y viewport |
| F06 | COMPLETADA | Registro versionado, 115 widgets, adapters y biblioteca |
| F07 | COMPLETADA | Inspector, estilos, responsive, bindings, condiciones y ARIA |
| F08 | COMPLETADA | Temas, presets, plantillas y paquetes versionados |
| F09 | EN_CURSO | M09.1 completada; M09.2 Taxonomías activa |
| F10–F18 | NO_INICIADA | Roadmap base restante |
| F19–F31 | NO_INICIADA | Paridad funcional ampliada |

## Cierre auditoría UI/UX F04/M04.1

- Drag/resize cancelable sin persistir interacciones incompletas.
- Coordenadas inválidas de puntero no producen CSS `NaN`.
- Apariencia del editor aislada de temas exportables.
- Toolbar del canvas en tres regiones y adaptada por container width.
- Eliminado estado inferior redundante del canvas.
- Popover de Apariencia compatible con bottom dock móvil.
- Biblioteca adaptada a panel estrecho sin solapamientos.
- `Documentos` puede mostrarse visualmente como `Docs` manteniendo el nombre accesible.
- Al añadirse `Datos`, la navegación usa cinco destinos y compactación por container query, no por viewport global.

## F08 completada

### M08.1 — Tres ámbitos de tema

- `appearance.v1` permanece local al editor.
- Frontend/backend viven en `ProjectStructure.themes` y usan Command Bus/undo/redo.

### M08.2 — Presets visuales

- 9 presets del editor y 11 presets de proyecto.
- Contraste WCAG AA verificado automáticamente.

### M08.3 — Motor de plantillas

- Page, template, header, footer, single, archive y 404 canónicos.
- Composición determinista por prioridad/especificidad/ID.
- Mutaciones mediante Command Bus e IndexedDB.

### M08.4 — Paquetes theme

- Formato `electrocms.theme-package`, schema v1, UUID y SemVer.
- Partes actuales: frontend, backend, documentos, componentes y breakpoints dependientes.
- Biblioteca local `theme-packages.v1` separada del proyecto.
- Importar nunca aplica automáticamente.
- Aplicación por partes remapea IDs, slots, bindings, responsive y referencias de componentes.
- Conflictos de ruta: `abort` o `suffix`, nunca sobrescritura silenciosa.
- Aplicar usa `ProjectStructureCommand` + `ProjectCommandBus`; undo real cubierto.
- UI: `Biblioteca → Diseño → Tema/Paquetes`.
- Documento: `THEME_PACKAGE_SYSTEM.md`.
- Gate funcional: run `31543564627`, lint/typecheck/suite/build verdes.

## Cierre M09.1 — CPT

### Modelo y dominio

- `ProjectStructure.cms` integra opcionalmente `CmsBackendSchema` para mantener retrocompatibilidad con proyectos anteriores.
- `EMPTY_CMS_BACKEND` crea el backend vacío solo cuando una operación CMS lo requiere.
- `content-type-engine.ts` implementa `listContentTypes`, `createContentType`, `updateContentType` y `deleteContentType`.
- Slug e ID son únicos.
- Capacidades y soportes se deduplican.
- Soportes disponibles: title, editor, author, thumbnail, excerpt, revisions y custom-fields.
- Propiedades reales: singular/plural, descripción, icono, capacidades, soportes, público/privado, visibilidad en menú y orden.
- `singleTemplateId` solo acepta Single/Template existentes.
- `archiveTemplateId` solo acepta Archive/Template existentes.
- Borrado bloqueado si existen campos, registros, taxonomías, relaciones, consultas, formularios, pantallas o permisos dependientes.
- Cada candidato valida `CmsBackend` y después `ProjectStructure` completo.

### Persistencia e historial

- Capacidad segregada `ContentTypeSession`; canvas/capas/inspector no dependen de ella.
- Comandos reales:
  - `cms.create-content-type`
  - `cms.update-content-type`
  - `cms.delete-content-type`
- Persistencia por el mismo IndexedDB del proyecto.
- Integración cubierta: `create → update → undo → redo → delete → undo`.

### UI/UX

- Nueva superficie funcional `Biblioteca → Datos → Tipos de contenido`.
- Lista ordenada y editor de alta densidad.
- Formulario para slug, singular/plural, descripción, icono, capacidades, soportes, visibilidad, orden y plantillas.
- Eliminación con confirmación en dos pasos, sin `window.confirm`.
- `aria-live`, foco visible, fieldsets semánticos y targets ~44 px touch / ~36 px desktop.
- No se exponen botones de Taxonomías/Campos/Registros antes de sus microfases.
- Tablist de Biblioteca con cinco destinos y container queries:
  - normal: icono + etiqueta;
  - <260 px: etiqueta compacta;
  - <196 px: iconos con `aria-label`.
- Documento: `CONTENT_TYPE_SYSTEM.md`.

### Puerta M09.1

GitHub Actions run `31544864623` sobre el commit final funcional/documental de M09.1:

- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `VERDE`.
- Build de producción: `VERDE`.
- Deploy producción: `SKIPPED` porque el trabajo sigue en PR draft.

## M09.2 — alcance activo

Implementar Taxonomías antes de avanzar a M09.3:

- CRUD canónico de taxonomías.
- Slug único.
- Singular/plural.
- Jerárquica o no jerárquica.
- Público/privado y orden.
- Asociación a múltiples CPT existentes.
- Plantilla de archivo opcional y compatible.
- Mantener `fieldIds` para campos de término, pero no implementar el builder de campos antes de M09.3.
- Protección de borrado si existen términos, campos u otras referencias dependientes.
- Persistencia e historial mediante `ProjectStructureCommand` + `ProjectCommandBus`.
- UI funcional dentro de Datos sin controles ficticios.
- Pruebas de invariantes, asociaciones, persistencia y undo/redo.
- Gate lint + typecheck + suite + build antes de activar M09.3.

## Bloqueos

- Ninguno técnico conocido para M09.2.
- `TaxonomySchema` y `TaxonomyTermSchema` existen como contratos anticipados, pero todavía no cuentan como implementación formal.

## Regla de avance

No cambiar de microfase sin evidencia reproducible verde. Tipos, documentación o prototipos anticipados no cierran una microfase.

## Documentos de control

- Alcance: `PROMPT_MAESTRO_ELECTROCMS.md` y `FLUTTERFLOW_PARITY_ADDENDUM.md`.
- Reglas: `RULES.md`.
- Plan: `PHASES.md` y `DETAILED_EXECUTION_PHASES.md`.
- Memoria corta: `MEMORY.md`.
- Temas: `THEME_SYSTEM.md`.
- Paquetes: `THEME_PACKAGE_SYSTEM.md`.
- CPT: `CONTENT_TYPE_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
