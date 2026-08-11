# Sistema de tipos de contenido

Estado: `M09.1 — CPT` completada el 2026-08-11, pendiente únicamente de la puerta documental final del mismo branch.

## Objetivo

M09.1 convierte el contrato anticipado `ContentTypeSchema` en una capacidad real del proyecto: CRUD canónico, persistencia local, historial reversible y UI funcional. La existencia previa del schema no se considera implementación; esta microfase lo integra por primera vez a `ProjectStructure` y al `ProjectCommandBus`.

## Estado canónico

- `ProjectStructure.cms` incorpora opcionalmente `CmsBackendSchema`.
- El campo es opcional para conservar compatibilidad con proyectos y fixtures históricos anteriores a F09.
- `EMPTY_CMS_BACKEND` crea la estructura vacía completa solo cuando una operación CMS la necesita.
- No existe un store paralelo de contenido; el backend forma parte del mismo snapshot persistente del proyecto.

## Contrato CPT

Cada `ContentType` mantiene:

- `id` UUID tipado y estable;
- `slug` único;
- nombre singular y plural;
- descripción e icono;
- lista deduplicada de capacidades;
- soportes: title, editor, author, thumbnail, excerpt, revisions y custom-fields;
- `public` y `showInMenu`;
- orden numérico;
- plantilla single opcional;
- plantilla archive opcional;
- asociaciones futuras `fieldIds` y `taxonomyIds`, conservadas pero no editadas todavía en M09.1.

## Motor de dominio

`content-type-engine.ts` implementa:

- `listContentTypes()` con orden determinista;
- `createContentType()`;
- `updateContentType()` limitado a propiedades propietarias de M09.1;
- `deleteContentType()` con protección de integridad.

### Invariantes

- IDs y slugs duplicados se rechazan sin mutación parcial.
- Capacidades y soportes se normalizan sin duplicados.
- `singleTemplateId` solo acepta documentos `single` o `template` existentes.
- `archiveTemplateId` solo acepta documentos `archive` o `template` existentes.
- Cada candidato valida `CmsBackend` y después `ProjectStructure` completo.
- El borrado se bloquea cuando existen campos, registros, taxonomías, relaciones, consultas, formularios, pantallas o permisos que referencian el CPT.

## Persistencia e historial

`BrowserEditorProjectSession` expone la capacidad segregada `ContentTypeSession`.

- `cms.create-content-type`
- `cms.update-content-type`
- `cms.delete-content-type`

Las tres operaciones usan `ProjectStructureCommand` y `ProjectCommandBus`; IndexedDB, revisión monotónica, undo y redo son los mismos de F03. No existe un historial CMS separado.

La prueba de integración cubre:

`create → update → undo → redo → delete → undo`.

## UI/UX

La funcionalidad aparece en `Biblioteca → Datos` solo después de existir el motor real.

`ContentTypeManager` ofrece:

- lista ordenada de CPT registrados;
- crear y editar;
- slug, singular/plural, descripción, icono y orden;
- capacidades separadas por coma;
- siete soportes declarativos;
- público/privado y visibilidad en menú;
- selección de plantilla single/archive compatible;
- eliminación en dos pasos, sin `window.confirm`;
- mensajes `aria-live` y foco visible;
- targets aproximados de 44 px en touch y 36 px en escritorio denso.

Taxonomías, campos, registros y bindings no se muestran como acciones activas: permanecen explícitamente reservados para M09.2–M09.5.

## Navegación responsive

Al incorporarse `Datos`, la Biblioteca pasa a cinco destinos funcionales: Capas, Widgets, Documentos, Datos y Diseño.

- El tablist usa cinco columnas iguales.
- `library-panel` es un container de ancho propio.
- Sobre 260 px se muestran icono + etiqueta completa.
- Bajo 260 px se ocultan iconos y se usan etiquetas compactas (`Wdg`, `Docs`, etc.).
- Bajo 196 px se muestran únicamente los iconos; cada botón conserva `aria-label` completo.
- No se depende del ancho global de viewport para decidir la compactación del panel.

## Cobertura

Pruebas de dominio:

- retrocompatibilidad sin `cms`;
- creación, orden y deduplicación;
- slug/ID duplicados;
- edición y compatibilidad de plantillas;
- borrado vacío y bloqueo por dependencias.

Pruebas de integración:

- persistencia real y undo/redo.

Pruebas UI:

- crear, editar y eliminar desde el gestor;
- targets responsive;
- grupos accesibles de soportes;
- ausencia de botones ficticios de fases futuras.

Puerta funcional M09.1: GitHub Actions run `31544692206` alcanzó lint, typecheck, suite completa y build verdes antes del ajuste visual final del icono `database`; el commit final vuelve a ejecutar la misma puerta antes de activar M09.2.
