# TRACKING — ElectroCMS

Actualizado: 2026-08-11.

> Estado operativo actual. El historial detallado permanece en `CHANGELOG.md` y en los documentos de sistema de cada fase.

## Estado global

- Fase actual: `F09 — Contenido dinámico, CPT, taxonomías y campos`.
- Microfase actual: `M09.3 — Campos personalizados`.
- Estado: `EN_CURSO`.
- F00–F08: `COMPLETADA`.
- `M09.1 — CPT`: `COMPLETADA`.
- `M09.2 — Taxonomías`: `COMPLETADA`.
- `M09.3–M09.5`: pendientes, con M09.3 activa.
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
| F09 | EN_CURSO | M09.1–M09.2 completadas; M09.3 Campos personalizados activa |
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
- Con `Datos`, la navegación usa cinco destinos y compactación por container query, no por viewport global.

## F08 completada

- M08.1 Tres ámbitos de tema: `COMPLETADA`.
- M08.2 Presets visuales: `COMPLETADA`.
- M08.3 Motor de plantillas: `COMPLETADA`.
- M08.4 Paquetes theme: `COMPLETADA`.
- Gate M08.4: run `31543564627`, lint/typecheck/suite/build verdes.

## Cierre M09.1 — CPT

### Modelo y dominio

- `ProjectStructure.cms` integra opcionalmente `CmsBackendSchema` para mantener retrocompatibilidad.
- `content-type-engine.ts` implementa CRUD canónico con ID/slug únicos.
- Capacidades y soportes se deduplican.
- Soportes: title, editor, author, thumbnail, excerpt, revisions y custom-fields.
- Singular/plural, descripción, icono, público/privado, menú, orden y plantillas single/archive son editables.
- Las plantillas se validan contra documentos compatibles.
- El borrado se bloquea ante dependencias CMS.
- Cada candidato valida `CmsBackend` y `ProjectStructure` completo.

### Persistencia/UI

- `ContentTypeSession` está segregada del contrato base.
- Create/update/delete pasan por `ProjectStructureCommand` + `ProjectCommandBus` + IndexedDB.
- Integración: `create → update → undo → redo → delete → undo`.
- UI funcional en `Biblioteca → Datos → Tipos`.
- Targets ~44 px touch / ~36 px desktop, listas y fieldsets accesibles, confirmación de borrado en dos pasos.
- Documento: `CONTENT_TYPE_SYSTEM.md`.

### Puerta M09.1

Run `31544864623`: lint, typecheck, suite completa y build verdes; deploy omitido por PR draft.

## Cierre M09.2 — Taxonomías

### Modelo y dominio

- `taxonomy-engine.ts` reutiliza exactamente `TaxonomySchema` y `TaxonomyTermSchema`; no añade estado CMS paralelo.
- Taxonomías: ID/slug únicos, singular/plural, descripción, jerárquica/plana, asociaciones múltiples, `fieldIds` preservados y `archiveTemplateId` compatible.
- La relación `Taxonomy.contentTypeIds` ↔ `ContentType.taxonomyIds` se sincroniza bidireccionalmente.
- `archiveTemplateId` solo acepta documentos `archive` o `template` existentes.
- Términos: slug único dentro de su taxonomía, descripción y padre opcional.
- Taxonomías planas no admiten padres; padres deben pertenecer a la misma taxonomía; ciclos jerárquicos se rechazan.
- No se permite cambiar a plana mientras existan términos con padre.
- Borrado de taxonomía bloqueado por términos, campos o queries dependientes.
- Borrado de término bloqueado por hijos, registros o predicados de query que lo referencien.
- Cada candidato valida `CmsBackend` y `ProjectStructure` completo.

### Persistencia e historial

- Capacidad segregada `TaxonomySession`.
- Create/update/delete de taxonomías y términos usan comandos `cms.*` sobre el mismo Command Bus.
- IndexedDB y undo/redo canónico cubiertos por integración real.
- Al eliminar una taxonomía válida se limpian también las asociaciones inversas de CPT.

### UI/UX

- `Datos` se organiza en tabs secundarios reales: `Tipos` y `Taxonomías`.
- Los tabpanels inactivos usan el atributo HTML `hidden` para desaparecer también del árbol de accesibilidad.
- El gestor de Taxonomías permite CRUD, CPT múltiples, jerarquía, Archive Template y términos.
- Borrados usan confirmación en dos pasos y presentan diagnósticos con `aria-live`.
- Targets touch/desktop y densidad siguen el sistema High Density + Minimal Clean.
- Campos personalizados no se simulan antes de M09.3.
- Documento: `TAXONOMY_SYSTEM.md`.

### Puerta M09.2

GitHub Actions run `31546741841`:

- Lint: `VERDE`.
- Typecheck: `VERDE`.
- Suite completa: `304/304 VERDE`.
- Build producción: `VERDE`.
- Deploy producción: `SKIPPED` por PR draft.

## M09.3 — alcance activo

Implementar el sistema de campos personalizados antes de avanzar a M09.4:

- CRUD de `FieldDefinition` canónico para propietarios CPT y taxonomía.
- Tipos exigidos por el prompt: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map, relation, user, taxonomy, repeater, group, calculated y conditional.
- Valor predeterminado, placeholder, descripción, requerido y validación.
- Opciones para select/radio/checkbox.
- Condiciones tipadas.
- Campos hijos para group/repeater, sin ciclos.
- Relaciones/taxonomías existentes para tipos que las requieren.
- Expresión para calculated.
- Visibilidad por rol usando el contrato existente.
- Organización por grupo y orden.
- Integridad bidireccional con `ContentType.fieldIds` / `Taxonomy.fieldIds`.
- Persistencia e historial por Command Bus.
- UI funcional y accesible dentro de `Datos`, sin adelantar registros/bindings.
- Tests de invariantes, persistencia, undo/redo y UI.
- Gate lint + typecheck + suite + build antes de activar M09.4.

## Bloqueos

- Ninguno técnico conocido para M09.3.
- `FieldDefinitionSchema` ya existe como contrato anticipado, pero aún no cuenta como implementación formal hasta cerrar CRUD, integridad, persistencia, UI y pruebas.

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
- Taxonomías: `TAXONOMY_SYSTEM.md`.
- Historial: `CHANGELOG.md`.
