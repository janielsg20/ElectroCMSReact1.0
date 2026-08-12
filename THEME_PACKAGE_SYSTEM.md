# Sistema de paquetes theme

Estado: `M08.4` completada el 2026-08-11.

## Objetivo

M08.4 permite crear, editar, duplicar, versionar, importar, exportar y aplicar por partes paquetes reutilizables sin sobrescritura accidental. El paquete conserva solo capacidades canónicas ya implementadas; no inventa contratos funcionales de fases futuras.

## Formato canónico

- Formato: `electrocms.theme-package`.
- Schema actual: `1`.
- Identidad: `ThemePackageId` UUID tipado.
- Versión de paquete: SemVer `major.minor.patch`.
- Metadatos: nombre, descripción, creación y última actualización.
- Partes admitidas hoy: tema frontend, tema backend, documentos/plantillas, componentes globales y breakpoints requeridos por esos árboles.
- CPT, taxonomías, campos, registros, consultas, formularios, roles, medios y demás módulos se incorporarán cuando sus fases propietarias queden implementadas; M08.4 no los simula.

## Creación y biblioteca local

- Crear un paquete permite seleccionar explícitamente Frontend, Backend, Documentos y Componentes.
- Cuando se seleccionan árboles, los breakpoints canónicos requeridos se incluyen automáticamente.
- Si un documento usa `component-instance`, Componentes es una dependencia obligatoria para producir un paquete autocontenido.
- La biblioteca usa el namespace IndexedDB `theme-packages.v1`, separado del proyecto y del historial.
- Guardar, editar metadatos, versionar, duplicar, importar o eliminar un paquete local no modifica `ProjectStructure`.

## Importación y exportación

- La serialización usa el contrato JSON canónico y valida schema antes y después del round-trip.
- Importar un archivo solo lo añade a la biblioteca local. Nunca se aplica automáticamente al proyecto.
- Exportar produce un JSON canónico versionado apto para volver a importar.
- Un paquete que no contiene una parte solicitada se rechaza con diagnóstico en vez de aplicar un no-op silencioso.

## Aplicación no destructiva

`applyThemePackage()` recibe una selección explícita de partes y genera un `ProjectStructure` candidato completo antes de aceptar cambios.

- Los IDs de documentos, componentes y nodos importados se remapean para no colisionar con el proyecto receptor.
- Slots, bindings `node-property`, overrides responsive y referencias `component-instance` se remapean junto con sus IDs.
- Los breakpoints idénticos se reutilizan; los incompatibles reciben IDs nuevos y preservan su herencia remapeada.
- Temas frontend/backend solo sustituyen el ámbito seleccionado.
- Datos del proyecto no seleccionados permanecen intactos.
- El resultado completo vuelve a pasar `validateProjectStructure`; un paquete inválido no se persiste parcialmente.

## Conflictos de rutas

Para páginas con una ruta ya ocupada existen dos políticas explícitas:

1. `abort`: detiene toda la aplicación del paquete sin cambios parciales.
2. `suffix`: conserva la ruta existente y renombra únicamente la copia importada de forma determinista, por ejemplo `/home` → `/home-2`.

El informe de importación registra rutas renombradas, documentos/componentes importados, breakpoints añadidos/reutilizados y ámbitos de tema actualizados.

## Historial y persistencia

- Aplicar un paquete sí es una mutación persistente del proyecto.
- `BrowserEditorProjectSession` la envuelve en `ProjectStructureCommand` y el `ProjectCommandBus` existente.
- Undo/redo restaura la estructura previa mediante el mismo historial persistente de F03.
- No existe un segundo history ni un árbol paralelo para paquetes.

## UI/UX

La superficie vive en `Biblioteca → Diseño → Paquetes`.

- `Diseño → Tema` mantiene Frontend/Backend.
- `Diseño → Paquetes` concentra creación, biblioteca, SemVer, duplicado, import/export, eliminación y aplicación.
- Importar comunica explícitamente que no aplica automáticamente.
- Eliminar exige confirmación en dos pasos dentro de la UI y nunca usa un diálogo nativo del navegador.
- Las partes a aplicar se seleccionan antes de ejecutar el comando.
- Los conflictos de ruta se presentan como una decisión visible: Detener o Renombrar copia.
- Controles táctiles usan objetivo mínimo aproximado de 44 px y escritorio conserva densidad aproximada de 36 px.
- Tabs, listbox, fieldsets, mensajes `aria-live` y foco visible mantienen navegación accesible.

## Cobertura

Las pruebas añadidas cubren:

- creación y round-trip JSON;
- dependencias de componentes;
- duplicado y SemVer;
- conflictos de ruta abort/suffix;
- selección de partes ausentes;
- persistencia local save/list/remove;
- biblioteca UI, versionado y borrado;
- separación entre guardar paquete y modificar proyecto;
- aplicación mediante Command Bus y undo real;
- regresión de arquitectura visual `Diseño → Tema/Paquetes`.

Puerta de implementación: GitHub Actions run `31543564627`, con lint, typecheck, suite completa y build de producción verdes. El job de despliegue se omite en PRs por diseño.
