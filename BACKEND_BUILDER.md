# Constructor de backend

Estado: contrato de datos aceptado en `M02.3`; F12 reutiliza el mismo motor canónico de documentos, menús, pantallas administrativas, registros, consultas y formularios.

Usa el mismo motor de documentos y plantillas que frontend, con componentes administrativos especializados. Incluye shell, dashboard, tablas, forms, detalle, calendario, kanban, métricas, filtros, bulk actions, saved views, RBAC y auditoría.

Ocultar UI no sustituye autorización: cada lectura y acción debe aplicar permisos en el caso de uso correspondiente. M12.2 no adelanta RBAC; esa responsabilidad continúa en M12.3.

El contrato actual incluye pantallas `dashboard`, `table`, `form`, `detail`, `calendar`, `kanban`, `chart`, `metrics`, `listing` y `custom`; menús jerárquicos; roles y usuarios; permisos por CPT/campo; y referencias coherentes entre pantalla, consulta y formulario.

## M12.1 — Shell administrativo

Un lienzo real puede actuar como shell administrativo editable sin crear un editor paralelo: encabezado, navegación, dashboard y contenido continúan usando Widgets, Capas, Inspector, responsive y persistencia del proyecto. `BackendScreen.documentId` mantiene el enlace con el mismo `Document` y `Menu`/`MenuItem` mantiene la navegación canónica.

## M12.2 — CRUD y vistas

Las superficies administrativas estructuradas enlazan `BackendScreen.contentTypeId`, `queryId` y `formId` sin introducir otro store ni otro schema. La pantalla puede presentarse como tabla, formulario, detalle, calendario, kanban, métricas, gráfico o listado.

- CRUD reutiliza `ContentRecord` y Record/Relation Engine.
- Saved views reutilizan `Query` y Query Engine; búsqueda rápida y estado refinan el resultado operativo sin duplicar el AST de consultas.
- Formularios enlazados reutilizan el orden y mapping de controles de `Form`; si no existe Form, la edición deriva de los campos del CPT.
- Bulk actions realizan preflight sobre una copia canónica antes de mutar la sesión persistente y las eliminaciones requieren confirmación.
- La configuración persiste mediante `ProjectStructureCommand` + `ProjectCommandBus`, por lo que undo/redo continúa siendo válido.
- Guardar posteriormente el shell no degrada una vista estructurada de vuelta a `dashboard` o `custom` por accidente.

El gate obligatorio para cerrar M12.2 es lint + typecheck + suite completa + build + Chromium + preview de PR verdes; producción permanece omitida durante el PR draft. La siguiente microfase es M12.3 — RBAC y contexto de usuario.
