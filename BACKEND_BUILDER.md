# Constructor de backend

Estado: contrato de datos aceptado en `M02.3`; implementación visual de F12 en curso sobre el mismo motor canónico de documentos, menús y pantallas administrativas.

Usa el mismo motor de documentos y plantillas que frontend, con componentes administrativos especializados. Incluye shell, dashboard, tablas, forms, detalle, calendario, kanban, métricas, filtros, bulk actions, saved views, RBAC y auditoría.

Ocultar UI no sustituye autorización: cada lectura y acción aplica permisos en el caso de uso correspondiente.

El contrato actual incluye pantallas `dashboard`, `table`, `form`, `detail`, `calendar`, `kanban`, `listing` y `custom`; menús jerárquicos; roles y usuarios; permisos por CPT/campo; y referencias coherentes entre pantalla, consulta y formulario.

La primera integración de F12 convierte un lienzo real en shell administrativo editable sin crear un editor paralelo: encabezado, navegación, dashboard y contenido continúan usando Widgets, Capas, Inspector, responsive y persistencia del proyecto. El gate de calidad debe permanecer verde antes de ampliar el constructor a nuevas superficies administrativas.
