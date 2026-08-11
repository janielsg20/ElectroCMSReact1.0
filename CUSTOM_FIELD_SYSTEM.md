# Sistema de campos personalizados — M09.3

Estado: `COMPLETADA`.

## Fuente de verdad

Los campos personalizados viven exclusivamente en `ProjectStructure.cms.fields` mediante `FieldDefinitionSchema`.

- CPT propietario: `FieldDefinition.owner.kind = content-type` y asociación inversa en `ContentType.fieldIds`.
- Taxonomía propietaria: `FieldDefinition.owner.kind = taxonomy` y asociación inversa en `Taxonomy.fieldIds`.
- No existe un store React paralelo ni un schema alternativo para los campos.
- Cada candidato valida primero `CmsBackend` y después `ProjectStructure` completo.

Toda mutación persistente entra por `ProjectStructureCommand` + `ProjectCommandBus`, se persiste en IndexedDB y participa del undo/redo canónico.

## Tipos soportados

M09.3 formaliza los 27 tipos exigidos por el prompt maestro:

- text, textarea, rich-text;
- number, currency;
- email, phone, url;
- date, time, datetime, color;
- select, radio, checkbox, switch;
- image, gallery, file, map;
- relation, user, taxonomy;
- repeater, group;
- calculated, conditional.

## Configuración canónica

Se reutilizan las propiedades existentes de `FieldDefinitionSchema`:

- key, label, type;
- description y placeholder;
- defaultValue y required;
- validation: minLength, maxLength, min, max y pattern;
- options;
- conditions;
- childFieldIds;
- relationId y taxonomyId;
- allowedRoleIds;
- calculatedExpression;
- group y order.

El propietario queda fijo después de crear el campo; mover un campo entre propietarios no se simula como una edición ordinaria.

## Invariantes añadidos por el motor

`custom-field-engine.ts` refuerza el schema con reglas de dominio:

- ID único y key única dentro del mismo propietario.
- El propietario debe existir.
- Los IDs del campo se sincronizan con `ContentType.fieldIds` o `Taxonomy.fieldIds`.
- select/radio requieren opciones; las etiquetas y valores son únicos.
- Tipos sin opciones rechazan `options` ajenas.
- Defaults se validan según tipo: número, booleano, opción, email, URL http/https, color #RRGGBB, fecha/hora/datetime, user existente, términos de la taxonomía configurada, object para group y array para repeater.
- Solo group/repeater admiten childFieldIds; cada hijo debe existir, compartir propietario y no ser el propio campo. Los ciclos quedan además cubiertos por `validateCmsBackend`.
- Las condiciones solo pueden referenciar otro campo existente del mismo propietario.
- relation requiere propietario CPT y una `Relation` canónica existente que incluya ese CPT.
- taxonomy requiere una taxonomía existente; para CPT debe estar asociada a ese CPT.
- calculated requiere expresión; otros tipos no conservan calculatedExpression.
- allowedRoleIds solo acepta roles canónicos existentes.
- Cambiar el tipo queda bloqueado cuando ya hay valores almacenados.

## Integridad al eliminar

Un campo no puede eliminarse mientras tenga dependencias reales:

- valores en registros o términos;
- referencia como hijo de group/repeater;
- condiciones de otros campos;
- predicados u orden de queries;
- controles de formularios mapeados;
- permisos de rol.

Al borrar un campo sin dependencias se retira también de `fieldIds` del propietario.

## Aplicación

`CustomFieldSession` es una capacidad segregada del editor:

- createCustomField;
- updateCustomField;
- deleteCustomField.

La sesión del navegador adapta las operaciones a comandos `cms.create-custom-field`, `cms.update-custom-field` y `cms.delete-custom-field` sobre el historial ya existente.

La integración prueba `create → update → undo → redo → delete → undo` con IndexedDB real de pruebas.

## UI/UX

`Biblioteca → Datos` contiene ahora:

- Tipos;
- Taxonomías;
- Campos.

`Datos → Campos` ofrece edición estructurada, no un formulario JSON genérico:

- propietario CPT/taxonomía;
- selector agrupado de los 27 tipos;
- label/key, descripción, placeholder, group/order y required;
- validaciones;
- editor de opciones;
- selección de hijos para group/repeater;
- taxonomía existente para taxonomy;
- relación existente para relation;
- expresión calculated;
- default contextual;
- condiciones canónicas y visibilidad por roles existentes.

Relaciones nuevas no se crean desde M09.3: la UI informa que su creación pertenece a M09.4. La gestión de roles pertenece a F12. Registros y bindings tampoco se exponen como funciones anticipadas.

Los tabs inactivos usan `hidden`; foco, semántica y mensajes `aria-live` permanecen accesibles. Los targets conservan aproximadamente 44 px en touch y 36 px en escritorio High Density.

## Evidencia

Gate final de cierre: GitHub Actions run `31548253008`.

- lint: verde;
- typecheck: verde;
- suite completa: 73 archivos / 312 pruebas verdes;
- build producción: verde;
- deploy producción: omitido por PR draft.
