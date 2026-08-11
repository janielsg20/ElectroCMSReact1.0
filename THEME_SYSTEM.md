# Sistema de temas

Estado: M08.1–M08.2 completadas; M08.3 activa.

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

## UI y límites de fase

- Ajustes de tema presenta Editor/Frontend/Backend como ámbitos explícitos.
- Editor ofrece los nueve presets normativos y Claro/Oscuro/Automático en `appearance.v1`; IDs históricos Studio/Bento/Flow se migran de forma segura.
- Frontend/backend permiten revisar paleta, editar el schema completo, aplicar y restablecer con validación inline.
- Frontend/backend ofrecen once presets canónicos con rasgos declarativos de layout, componentes, bordes, elevación, responsive y accesibilidad.
- Cada preset se copia al ámbito elegido mediante el Command Bus y después puede editarse como tema del proyecto; el catálogo base permanece inmutable.
- Las 20 variantes de color del editor y los 11 temas de proyecto verifican contraste WCAG AA automáticamente.
- M08.3 será responsable de templates/partes/condiciones y M08.4 de paquetes, importación, exportación, versiones y conflictos.
- `design-system/electrocms/MASTER.md` sigue siendo referencia visual, no sustituto del contrato canónico.
