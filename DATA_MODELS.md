# Modelos de datos

Estado: identidad y envelope v1 aceptados en `M02.1`; estructura de documentos aceptada en `M02.2`; agregados CMS/backend aceptados en `M02.3`; registry y recuperación aceptados en `M02.4`. F02 completada.

## Contrato implementado en M02.1

La fuente tipada vive en `src/domain/project/`.

- Formato raíz: `electrocms.project`.
- `schemaVersion`: entero literal `1` para el schema actual; versiones desconocidas se rechazan hasta contar con migración compatible.
- `projectId`: UUID RFC válido, estable y desligado de posición, nombre o ruta.
- `revision`: entero no negativo para evolución incremental del mismo proyecto.
- `createdAt` y `updatedAt`: ISO-8601 UTC con precisión fija de milisegundos; `updatedAt` nunca puede preceder a `createdAt`.
- `name`: texto recortado, obligatorio y limitado a 160 caracteres.
- `metadata`: mapa de claves no vacías a valores JSON; no admite funciones, fechas nativas, `undefined` ni objetos de plataforma.
- `payload`: genérico y obligatorio; cada microfase siguiente aporta su schema concreto. El envelope no presenta árboles, CMS o backend como capacidades ya implementadas.

Los objetos raíz son estrictos y rechazan propiedades desconocidas. `serializeCanonical()` valida antes de serializar, ordena recursivamente las claves de objetos y conserva el orden de arrays. No afirma implementar RFC 8785; proporciona determinismo interno reproducible para el modelo JSON validado.

`deserializeCanonical()` distingue JSON mal formado de valores que no cumplen el schema y devuelve errores tipados mediante `Result`.

## Contrato implementado en M02.2

La estructura persistente se define en `src/domain/project/structure-schema.ts` y se valida semánticamente en `src/domain/project/validate-structure.ts`.

- IDs nominales e independientes para documentos, nodos, breakpoints y componentes globales.
- Documentos normalizados por ID con una o varias raíces y un registro de nodos.
- Nodos discriminados entre widget e instancia de componente global, con propiedades, estilos, bindings, condiciones, slots y bloqueo persistente.
- Overrides responsive separados del estado base, asociados a breakpoints configurables.
- Seis breakpoints iniciales: desktop, laptop, tablet horizontal, tablet vertical, móvil grande y móvil pequeño.
- Herencia explícita entre breakpoints; la resolución aplica primero el estado base y después los overrides desde el ancestro hasta el breakpoint solicitado.
- Componentes globales como árboles reutilizables; las instancias se enlazan por ID sin copiar el árbol.
- JSON Schema estricto generado desde el mismo schema Zod.

La validación devuelve diagnósticos tipados y no corrige ni elimina datos silenciosamente. Detecta claves que no coinciden con sus IDs, IDs de nodo repetidos entre árboles, referencias ausentes, nodos huérfanos, padres múltiples, ciclos de nodos, bindings rotos, overrides sin breakpoint, componentes ausentes, recursión de componentes y ciclos de herencia responsive.

## Contrato implementado en M02.3

El modelo normalizado vive en `src/domain/project/cms-schema.ts` y su validación semántica en `src/domain/project/validate-cms.ts`.

- CPT, taxonomías jerárquicas, términos, 27 tipos de campo, registros y estados de contenido.
- Relaciones con entradas independientes y cardinalidades `one-to-one`, `one-to-many` y `many-to-many`.
- Consultas guardadas con grupos de predicados, fuentes de datos, orden, límite, offset y paginación.
- Formularios con controles, condiciones, pasos, acciones, borradores, protección CSRF y mensajes.
- Roles, usuarios, capacidades y permisos por tipo de contenido y campo.
- Menús jerárquicos y pantallas backend enlazables con contenido, consultas, formularios, documentos y roles.
- IDs nominales para cada agregado, registros normalizados por ID y JSON Schema estricto generado desde Zod.

La semántica de relaciones es explícita: `1:1` limita ambos extremos a una entrada; `1:N` permite varios destinos por origen pero un solo origen por destino; `N:N` permite múltiples entradas en ambos extremos. En todos los casos se rechazan pares duplicados y registros cuyo tipo no coincide con el extremo declarado.

Los diagnósticos cubren propietarios incoherentes, referencias ausentes, campos obligatorios, cronología, ciclos de términos, extremos y cardinalidades, predicados y órdenes incompatibles, controles y pasos inválidos, permisos rotos, ciclos de menú y pantallas que mezclan agregados de tipos diferentes.

Este contrato modela y valida datos; no declara implementados los constructores visuales, ejecución de consultas, persistencia, autorización ni render del backend, que pertenecen a fases posteriores.

## Contrato implementado en M02.4

`src/domain/project/migrations.ts` mantiene un registry de pasos forward consecutivos. El primer paso soportado migra el fixture legado v0 al envelope v1 actual, incorporando `revision` y `metadata` sin alterar el payload.

- Cada paso avanza exactamente una versión y no puede duplicar un origen.
- Una versión futura produce `newer-version`; una cadena incompleta produce `missing-migration`.
- El dato antiguo se valida antes de transformarse y el resultado se valida contra el schema actual antes de aceptarse.
- Antes del primer paso se conserva una copia exacta del texto original; los errores posteriores transportan esa copia para recuperación.
- La restauración devuelve byte por byte el origen y permite reintentar la migración.
- Los fixtures `project-v0.json` y `project-v1.json` prueban migración, lectura actual, incompatibilidad, fallo y recuperación.

El registry no escribe en almacenamiento: su integración transaccional con repositorios corresponde a F03.

## Agregados mínimos

Project, Document, Node, WidgetDefinition, Theme, Template, ContentType, Taxonomy, FieldDefinition, Record, Relation, Query, Form, Filter, Role, User, BackendScreen, MediaAsset, ExportManifest y HistoryEntry.

## Invariantes

- Todos los IDs son estables y no dependen de posición.
- Todo envelope declara `schemaVersion` y migración compatible.
- Árboles no aceptan ciclos ni referencias a nodos ausentes.
- Cada nodo pertenece a un único árbol y ocupa una sola posición dentro de este.
- Un componente global no puede depender directa ni indirectamente de sí mismo.
- La herencia de breakpoints es acíclica y solo referencia breakpoints existentes.
- Relaciones y bindings rotos producen diagnóstico, no pérdida silenciosa.
- Datos persistentes son serializables; estado UI transitorio vive separado.
- Toda entrada persistente se valida con el schema de su versión antes de alcanzar repositorios o casos de uso.
