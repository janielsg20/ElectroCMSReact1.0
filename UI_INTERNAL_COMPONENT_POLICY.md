# UI INTERNAL COMPONENT POLICY — ElectroCMS

Estado: **NORMATIVO / NO NEGOCIABLE**.

Esta política forma parte del alcance funcional y visual de ElectroCMS. Aplica a la interfaz del editor, backend visual, paneles administrativos, previews interactivos y proyectos generados cuando utilicen componentes de ElectroCMS.

## Objetivo

La experiencia de ElectroCMS debe verse y comportarse como una sola aplicación coherente en Windows, macOS, Linux, Android, iOS, PWA y navegadores modernos. Las interacciones habituales no deben cambiar de aspecto o flujo porque el sistema operativo decida mostrar un menú, picker o diálogo propio.

## Regla principal

**No usar controles nativos de plataforma que deleguen la interacción visual principal al sistema operativo o al navegador cuando ElectroCMS pueda ofrecer un componente interno equivalente.**

No basta con aplicar CSS al elemento cerrado. Si al activarlo Android, Windows, macOS, iOS o el navegador abre una UI propia fuera del sistema visual de ElectroCMS, ese control no cumple esta política.

## Componentes que deben ser internos de ElectroCMS

Como mínimo, deben implementarse mediante primitives/componentes propios del Design System:

- Select / Listbox.
- Combobox y autocomplete.
- Dropdown menu.
- Context menu.
- Command menu.
- Popover.
- Tooltip; no depender de `title` como tooltip de producto.
- Dialog, modal y confirmación; no usar `alert()`, `confirm()` ni `prompt()` para flujos de producto.
- Bottom sheet, drawer y off-canvas.
- Color picker; no usar `input[type="color"]` como experiencia principal.
- Date picker, time picker y datetime picker; no delegar la experiencia principal a `input[type="date"]`, `time` o `datetime-local` cuando forme parte de la UI de ElectroCMS.
- Selector de iconos.
- Selector de tipografía.
- Selector de breakpoint.
- Selector de tokens y variables.
- Selector de assets/media.
- Menús de propiedades del Inspector.
- Menús de acciones de tablas, árboles, capas, widgets, páginas, nodos y registros.
- Menús contextuales del Canvas y Widget Tree.
- Controles de “Mover a / Antes de / Después de”, orden, alineación y opciones equivalentes.
- Pickers y menús de filtros, consultas, roles, condiciones, bindings, acciones y configuraciones.

## Controles HTML que no deben usarse como UI final cuando disparan chrome nativo

Salvo excepción documentada, evitar como experiencia visible final:

- `<select>` nativo.
- `<datalist>`.
- `input[type="color"]`.
- `input[type="date"]`.
- `input[type="time"]`.
- `input[type="datetime-local"]`.
- `window.alert()`.
- `window.confirm()`.
- `window.prompt()`.
- Menú contextual nativo del navegador para acciones propias de ElectroCMS.
- Tooltips basados únicamente en el atributo `title`.

Los inputs semánticos pueden utilizarse internamente si no exponen UI nativa incompatible o si sirven como fallback progresivo, pero la experiencia principal visible debe pertenecer al Design System de ElectroCMS.

## Apariencia y consistencia

Todo menú o picker interno debe:

- Usar tokens semánticos del tema activo.
- Respetar Studio, Bento Motion, Flow Builder y futuros presets.
- Respetar Claro, Oscuro y Automático.
- Mantener tipografía, radios, bordes, sombras, spacing, iconografía y estados del resto de la app.
- Usar la escala de z-index oficial.
- Evitar clipping y overflow accidental.
- Reposicionarse al borde del viewport.
- Soportar portal/overlay cuando sea necesario.
- Mantener High Density en desktop sin reducir targets touch en móvil/tablet.
- Adaptarse a safe areas en dispositivos móviles.
- Respetar `prefers-reduced-motion`.

## Comportamiento responsive

El mismo control puede cambiar de contenedor sin cambiar de función:

- Desktop: popover, dropdown, menu o floating panel compacto.
- Tablet: popover amplio, drawer o overlay contextual cuando el espacio lo requiera.
- Móvil: bottom sheet, full-screen sheet o picker interno táctil.

Una propiedad no puede abrir un selector nativo diferente solo por estar en Android, Windows o iOS.

## Accesibilidad obligatoria

Los componentes internos no pueden sacrificar la accesibilidad que ofrecen los controles nativos. Deben implementar el patrón ARIA correcto y pruebas de teclado/touch.

Según el componente, incluir:

- Roles y estados ARIA apropiados (`menu`, `listbox`, `combobox`, `dialog`, `option`, etc.).
- `aria-expanded`, `aria-controls`, `aria-selected`, `aria-activedescendant` cuando corresponda.
- Flechas, Home/End, Enter/Space y typeahead cuando corresponda.
- `Escape` para cerrar superficies temporales.
- Focus trap solo cuando el patrón lo requiera.
- Restauración de foco al trigger al cerrar.
- Foco visible.
- Navegación completa sin ratón.
- Targets touch de al menos 44 × 44 CSS px en superficies táctiles.
- Estados disabled, error, loading, empty y no-results.
- Soporte de lector de pantalla y semántica comprensible.

## Excepciones permitidas

Se permite abrir UI nativa únicamente cuando la plataforma la exige o aporta una frontera de seguridad/capacidad que una UI web interna no puede sustituir de forma segura. Ejemplos:

- Selector de archivos o carpetas del sistema para importar/exportar cuando lo exige la API del navegador/OS.
- Permisos de cámara, micrófono, ubicación, notificaciones o almacenamiento.
- Biometría/autenticación segura del sistema.
- Share sheet del sistema cuando el usuario solicita compartir fuera de la app.
- Print dialog cuando el usuario solicita imprimir.
- UI de instalación/PWA gestionada por navegador o sistema.
- Otros diálogos protegidos por el sandbox/plataforma.

Estas excepciones deben ser **explícitas, puntuales y documentadas**. La app debe mostrar primero una acción interna de ElectroCMS, explicar qué ocurrirá cuando sea relevante y recuperar el contexto/foco al regresar.

## Medios e importación

La Biblioteca Multimedia de ElectroCMS debe ser la experiencia principal para elegir assets ya importados. El selector nativo de archivos solo se utiliza en la frontera “Importar desde dispositivo”. Una vez importado, buscar, filtrar, seleccionar, reemplazar, reutilizar y administrar el asset ocurre dentro de la UI de ElectroCMS.

## Context menus

Cuando un área tenga acciones propias de ElectroCMS:

- Interceptar el gesto contextual apropiado.
- Mostrar `ContextMenu` interno con el tema activo.
- Proporcionar las mismas acciones por botón/teclado para accesibilidad.
- No depender exclusivamente de clic derecho o long-press.

No se debe bloquear el menú nativo globalmente sin necesidad; solo dentro de superficies donde exista un menú interno equivalente y accesible.

## Inspector y edición de propiedades

Esta regla es especialmente obligatoria en el Inspector. Cambiar una propiedad nunca debe provocar que aparezca un menú visualmente ajeno de Android, Windows, macOS, iOS o del navegador.

Ejemplos:

- `display`, `position`, `alignment`, `overflow`, `font`, `weight`, `token`, `breakpoint`, `state`, `role`, `query`, `field`, `action`, `condition` → Listbox/Combobox interno.
- Color → ColorPicker interno.
- Fecha/hora → Date/Time Picker interno.
- Icono → IconPicker interno.
- Asset → MediaPicker interno.
- Variable/binding → VariablePicker interno.

## Testing obligatorio

La política se considera cubierta solo con evidencia. Deben existir pruebas para:

1. Ningún control crítico del editor depende de `<select>` nativo ni diálogos `alert/confirm/prompt`.
2. Los menús internos conservan la apariencia del tema activo.
3. Teclado: abrir, navegar, seleccionar y cerrar.
4. Touch: targets, sheets y scroll interno.
5. Móvil: no se invoca un picker nativo para propiedades cubiertas por componentes internos.
6. Focus restore y Escape.
7. Reflow 320/375 px y tablet 768 px.
8. Dark/light/system.
9. Overflow, collision detection y portal/z-index.
10. Excepciones nativas documentadas y limitadas a fronteras de plataforma.

## Criterio de aceptación

Una funcionalidad visual que utilice un selector, menú o picker no se considera terminada si el flujo principal sigue mostrando UI nativa de la plataforma sin una excepción autorizada.

La implementación preferida es una familia común de primitives internos reutilizables, no componentes ad hoc por pantalla.