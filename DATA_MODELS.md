# Modelos de datos

Estado: contrato por diseñar en F02.

## Agregados mínimos

Project, Document, Node, WidgetDefinition, Theme, Template, ContentType, Taxonomy, FieldDefinition, Record, Relation, Query, Form, Filter, Role, User, BackendScreen, MediaAsset, ExportManifest y HistoryEntry.

## Invariantes

- Todos los IDs son estables y no dependen de posición.
- Todo envelope declara `schemaVersion` y migración compatible.
- Árboles no aceptan ciclos ni referencias a nodos ausentes.
- Relaciones y bindings rotos producen diagnóstico, no pérdida silenciosa.
- Datos persistentes son serializables; estado UI transitorio vive separado.

