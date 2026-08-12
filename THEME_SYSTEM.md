# Sistema de temas

Estado: `M08.1–M08.4` completadas. F08 cerrada el 2026-08-11.

## Ámbitos y persistencia

- `editor`: preferencia local `appearance.v1`; controla ElectroCMS y nunca se exporta con un proyecto.
- `frontend`: `ProjectStructure.themes.frontend`; tema predeterminado del documento generado y del canvas.
- `backend`: `ProjectStructure.themes.backend`; tema independiente para el administrador generado, sin simular todavía sus pantallas.
- Frontend y backend se validan, persisten y revierten mediante el Command Bus canónico. No existe un store de temas paralelo.

## Schema v1

- Cada tema contiene `name`, `schemaVersion: 1` y `tokens`.
- Categorías estrictas: `color`, `typography`, `spacing`, `radius`, `shadow`, `motion` y `density`.
- Colores usan hexadecimal de seis dígitos; medidas y escalas tienen límites; texto visual rechaza expresiones inyectables.
- Las estructuras históricas sin `themes` reciben defaults frontend/backend independientes al cruzar `ProjectStructureSchema`.

## Consumo

- `compileThemeStyleTokens` traduce tokens semánticos al mapa compartido por `compileCanonicalStyles`.
- El renderer usa frontend por defecto y puede solicitar backend explícitamente mediante `themeScope`.
- `ProjectStructureRenderStore` conserva referencias estables y suscripciones por ámbito para no repintar nodos ante cambios no relacionados.
- Los tokens neutrales de `STYLE_ENGINE.md` continúan como fallback; un token del tema del proyecto prevalece cuando comparte ID.

## Presets y plantillas

- Editor ofrece los nueve presets normativos y Claro/Oscuro/Automático en `appearance.v1`; IDs históricos Studio/Bento/Flow se migran de forma segura.
- Frontend/backend ofrecen once presets canónicos con rasgos declarativos de layout, componentes, bordes, elevación, responsive y accesibilidad.
- Cada preset se copia al ámbito elegido mediante el Command Bus y después puede editarse como tema del proyecto; el catálogo base permanece inmutable.
- Las 20 variantes de color del editor y los 11 temas de proyecto verifican contraste WCAG AA automáticamente.
- El motor de plantillas canónico formaliza páginas, templates, headers, footers, single, archive y 404, con composición determinista y condiciones tipadas.

## Paquetes M08.4

- `ThemePackageSchema` define formato `electrocms.theme-package`, schema v1 y versión SemVer.
- Un paquete puede contener tema frontend, tema backend, documentos, componentes globales y breakpoints requeridos.
- Crear, editar, versionar, duplicar, importar, exportar o borrar un paquete opera en la biblioteca local `theme-packages.v1` y no modifica el proyecto.
- Aplicar un paquete permite seleccionar partes; remapea IDs, slots, bindings, responsive y referencias de componentes antes de validar la estructura completa.
- Conflictos de ruta se resuelven explícitamente con `abort` o `suffix`; nunca se sobrescribe una página existente de forma silenciosa.
- Aplicar es una mutación persistente y reversible mediante `ProjectStructureCommand` + `ProjectCommandBus`; undo/redo reutiliza el historial de F03.
- La UI vive en `Biblioteca → Diseño → Tema/Paquetes`, separada de Apariencia del editor.
- El contrato completo y sus límites están documentados en `THEME_PACKAGE_SYSTEM.md`.

## UI y límites de fase

- Apariencia del editor permanece en TopBar y solo afecta a ElectroCMS.
- Temas y paquetes exportables viven en Diseño como recursos del proyecto.
- Controles de tema y paquetes usan targets táctiles amplios, foco visible, tabs y agrupación semántica sin recurrir a chrome nativo salvo el picker real de archivos.
- CPT, taxonomías, campos, formularios, consultas, roles, medios y demás recursos futuros no se incrustan todavía en paquetes; se incorporarán al cerrar sus fases propietarias.
- `design-system/electrocms/MASTER.md` sigue siendo referencia visual, no sustituto del contrato canónico.

## Puerta de cierre

GitHub Actions run `31543564627`: lint, typecheck, suite completa y build de producción verdes. El despliegue de producción quedó omitido porque el trabajo continúa en PR draft.
