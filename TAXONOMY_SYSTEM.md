# Sistema de taxonomías — M09.2

Estado: `COMPLETADA`.

## Fuente de verdad

Las taxonomías viven exclusivamente en `ProjectStructure.cms` mediante `CmsBackendSchema`.

- `cms.taxonomies`: definición normalizada de taxonomías.
- `cms.taxonomyTerms`: términos.
- `cms.contentTypes[*].taxonomyIds`: asociación inversa sincronizada.
- No existe un store React paralelo ni un historial separado.

Toda mutación persistente entra por `ProjectStructureCommand` + `ProjectCommandBus`, se persiste en IndexedDB y participa del undo/redo canónico.

## Taxonomy

El contrato existente `TaxonomySchema` se conserva como fuente canónica:

- `id`
- `slug`
- `singularName`
- `pluralName`
- `description`
- `hierarchical`
- `contentTypeIds`
- `fieldIds`
- `archiveTemplateId`

M09.2 no inventa propiedades `public` u `order` que no pertenecen a este schema.

### Invariantes

- ID y slug únicos.
- Al menos un CPT asociado.
- Todos los `contentTypeIds` deben existir.
- La relación CPT ↔ taxonomía se mantiene bidireccionalmente.
- `archiveTemplateId`, cuando existe, debe apuntar a un documento `archive` o `template`.
- `fieldIds` se preserva, pero el builder de campos pertenece a M09.3.
- Cada candidato valida primero `CmsBackend` y después `ProjectStructure` completo.

## Términos

`TaxonomyTermSchema` conserva:

- ID y taxonomy ID.
- slug y nombre.
- descripción.
- padre opcional.
- valores de campos de término.

Reglas:

- El slug es único dentro de su taxonomía.
- Una taxonomía plana no admite padres.
- El padre debe pertenecer a la misma taxonomía.
- La jerarquía no puede contener ciclos.
- No se permite convertir una taxonomía a plana mientras existan términos hijos.

## Integridad al eliminar

Una taxonomía no se elimina mientras tenga dependencias como:

- términos;
- campos propios o referencias de tipo taxonomía;
- consultas cuyo AST use esa taxonomía.

Un término no se elimina mientras:

- tenga hijos;
- esté usado por registros;
- aparezca en el valor de un predicado de consulta para esa taxonomía.

Al eliminar una taxonomía sin dependencias, sus IDs se retiran también de los CPT asociados.

## Aplicación

`TaxonomySession` es una capacidad segregada del editor y expone:

- create/update/delete taxonomy;
- create/update/delete taxonomy term.

La sesión del navegador adapta esas operaciones a comandos `cms.*` reversibles y persistentes.

## UI/UX

La Biblioteca conserva cinco áreas principales y `Datos` contiene tabs secundarios:

- `Tipos`
- `Taxonomías`

`Taxonomías` incluye:

- lista de taxonomías;
- creación/edición;
- selección múltiple de CPT;
- modo jerárquico/plano;
- plantilla Archive;
- gestión de términos y padres;
- confirmación de borrado en dos pasos;
- estados de error vía `aria-live`.

Los tabpanels inactivos usan el atributo HTML `hidden`, de forma que controles invisibles tampoco aparezcan en el árbol de accesibilidad. Los controles mantienen targets aproximados de 44 px en touch y 36 px en escritorio High Density.

No se exponen controles de campos personalizados antes de M09.3.

## Evidencia

Gate de cierre: GitHub Actions run `31546741841`.

- lint: verde;
- typecheck: verde;
- suite completa: 304/304 pruebas verdes;
- build producción: verde;
- deploy producción: omitido por PR draft.
