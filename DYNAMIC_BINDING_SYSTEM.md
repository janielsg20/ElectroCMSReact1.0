# Dynamic Binding System — ElectroCMS

Actualizado: 2026-08-12.

## Alcance

M09.5 conecta contenido CMS real a propiedades de widgets reutilizando el contrato de datos existente de F07. No introduce un segundo DataProvider, un history paralelo ni estado persistente de preview.

## Contrato canónico

`BindingSourceSchema` admite fuentes serializables `literal`, `project-path`, `node-property`, `cms-record-field` y `cms-record-property`.

Las fuentes CMS guardan referencias explícitas a `recordId` y, cuando corresponde, `fieldId`. El resolver exige que el registro exista y que el campo pertenezca al mismo CPT del registro; las referencias rotas producen diagnósticos en vez de degradarse silenciosamente.

## Resolución

`resolveNodeDataState` mezcla las propiedades responsive resueltas con los bindings del nodo y produce:

- `ready`: el contenido se resolvió correctamente.
- `empty`: existen bindings pero sus valores resolvieron a vacío.
- `error`: existe al menos un diagnóstico de resolución.

Las condiciones siguen usando el mismo `BindingSourceSchema`, por lo que el CMS puede participar en visibilidad sin crear otro motor condicional.

## Preview del editor

El renderer conserva `ProjectStructure` como única fuente de verdad. `ProjectStructureRenderStore` mantiene `auto | loading | empty | error` como estado transitorio por nodo.

`loading` es exclusivamente una simulación visual del editor; no representa una petición remota ni se persiste. Volver a `auto` restaura la resolución canónica.

## Inspector

`DataConditionAccessibilityControl` ofrece controles estructurados para:

- elegir propiedad destino del widget;
- elegir registro CMS;
- elegir campo compatible con el CPT del registro;
- preparar/quitar bindings;
- aplicar la configuración por el Command Bus existente;
- previsualizar `loading`, `empty` y `error` sin modificar el proyecto;
- conservar el editor JSON avanzado para condiciones/casos completos del contrato F07.

El binding pertenece al Inspector porque configura el nodo seleccionado. Los gestores globales de CPT, taxonomías, campos y registros pertenecen a `Contenido` en la navegación principal y nunca a `Capas`.

## Integridad

La validación de proyecto impide borrar registros o campos todavía referenciados por bindings. Theme packages que perderían dependencias CMS se rechazan en vez de exportar referencias inválidas.

Toda configuración persistente de bindings usa `setNodeDataSettings` a través de la sesión/Command Bus existente, por lo que conserva undo/redo y persistencia local-first.

## Pruebas

Cobertura principal:

- `src/domain/project/cms-binding-integrity.test.ts`
- `src/editor-ui/editor/dynamic-binding-control.test.tsx`
- `src/renderers/react/cms-binding-preview.test.tsx`
- pruebas existentes de data/conditions, renderer y sesión/undo-redo de F07.

## Auditoría visual F09

El gate final abre Chromium real y verifica desktop, tablet y móvil; navega `Contenido` desde el sidebar en desktop y `Más → Contenido` en móvil; recorre Tipos, Taxonomías, Campos y Registros/Relaciones; comprueba overflow, excepciones y consola; y captura el editor con el Inspector de contenido dinámico visible.

La arquitectura final mantiene:

- Sidebar principal: Editor, Documentos, Contenido, Diseño.
- Panel contextual izquierdo: solo Capas y Widgets.
- Inspector: propiedades y bindings de la selección.
- Móvil: Widgets, Capas, Canvas, Props y Más.
