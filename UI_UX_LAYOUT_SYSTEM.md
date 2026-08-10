# Sistema de layout UI/UX — ElectroCMS

Estado de implementación: existe un prototipo visual anticipado en `src/editor-ui/editor/`. Representa la composición objetivo y sus adaptaciones, pero no cierra las fases funcionales F04–F07.

## Decisión de producto

ElectroCMS usa un application shell adaptativo y orientado a tareas. La jerarquía funcional se conserva en todos los tamaños; solo cambia el contenedor que la presenta.

## Layout por capacidad disponible

### Desktop amplio — desde 1280 px

- Header/toolbar superior persistente.
- Rail o sidebar de navegación configurable: 64 px colapsada, 240–288 px expandida.
- Panel izquierdo contextual de 280–360 px para elementos, capas o recursos.
- Canvas central flexible con mínimo útil y zoom independiente.
- Inspector derecho de 320–400 px.
- Status bar opcional para sincronización, selección y diagnóstico.
- Los paneles se redimensionan, colapsan y recuerdan el workspace.

### Laptop/tablet horizontal — 768 a 1279 px

- Navegación en rail contraído.
- Canvas como región principal.
- Solo un panel contextual persistente a la vez.
- Inspector y biblioteca aparecen como panel lateral superpuesto, resizable y descartable.
- La toolbar agrupa acciones secundarias en overflow sin ocultarlas.

### Móvil/tablet vertical — 320 a 767 px

- Header compacto y canvas prioritario.
- Navegación superior o inferior con un máximo de cinco destinos de primer nivel; el resto vive en “Más”.
- Elementos, capas e inspector se abren como bottom sheet o pantalla completa.
- Las propiedades se editan por secciones con progressive disclosure.
- Acciones de selección, mover arriba/abajo, duplicar y eliminar permanecen visibles sin depender de drag.
- El canvas puede ser una región bidimensional contenida; el resto de la página debe reflow sin scroll horizontal.

## Responsive basado en contenedor

- Los breakpoints globales gobiernan el shell.
- Los componentes usan container queries para responder al espacio real de su panel.
- Referencia inicial Tailwind: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`; los breakpoints del documento generado son datos del proyecto y no deben confundirse con los del editor.
- Se prueba explícitamente a 320, 375, 768, 1024, 1280, 1440 y 1920 px, además de 200 % y 400 % de zoom.

## Semántica e interacción

- Header: `header`; navegación: `nav`; canvas: `main`; inspector y paneles complementarios: `aside` con nombre accesible.
- Toolbars con tres o más controles usan patrón ARIA Toolbar y roving tabindex.
- Capas jerárquicas usan patrón Tree View; tablas editables usan Grid solo si se implementa toda su gestión de foco.
- Sheets y modales retienen foco, tienen cierre explícito, `Escape` y restauran foco al disparador.
- Los atajos no reemplazan controles visibles.
- El estado activo se comunica mediante texto/semántica además de color.

## Tokens Tailwind obligatorios

- Colores semánticos: canvas, surface, elevated, text, muted, border, primary, success, warning, danger, focus.
- Espaciado en ritmo de 4/8 px.
- Escala de z-index documentada: base, sticky, dropdown, overlay, modal, toast, drag-preview.
- Tipografía con cuerpo mínimo de 16 px en móvil y longitud de línea de 35–60 caracteres móvil / 60–75 desktop.
- Iconos SVG coherentes; sin emoji estructural.

## Criterios de aceptación de layout

- Ninguna función desaparece en pantallas pequeñas.
- No hay scroll horizontal a nivel página a 320 CSS px.
- El foco nunca queda oculto por header, sheet o toolbar sticky.
- Todos los targets críticos alcanzan 44 × 44 CSS px como estándar interno.
- Drag, resize y reordenar tienen alternativa de una sola activación y teclado.
- `prefers-reduced-motion`, modo oscuro y alto zoom conservan operación y contraste.

## Prototipo anticipado implementado

- Desktop: header compacto, rail de 64 px, panel unificado de páginas/capas, canvas punteado, inspector y barra de estado.
- Tablet/laptop: rail y canvas prioritario; páginas/capas e inspector se abren como paneles contextuales según el espacio disponible.
- Móvil: header compacto, canvas con marco de dispositivo, dock de cinco destinos y paneles como bottom sheets.
- Interacciones habilitadas: búsqueda de widgets, tabs, viewport del documento, tema y sheets con `Escape` y restauración de foco.
- Acciones no implementadas: publicar, preview, undo/redo, navegación a módulos y mutaciones del documento se muestran deshabilitadas o como planificadas.
- Evidencia responsive: 320, 375, 768, 1024, 1440 y 812 × 375 sin overflow horizontal, logs de consola ni controles activos menores de 44 px.

## Fuentes

- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- WAI-ARIA APG Patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- Tailwind responsive design y container queries: https://tailwindcss.com/docs/responsive-design
- MDN container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
