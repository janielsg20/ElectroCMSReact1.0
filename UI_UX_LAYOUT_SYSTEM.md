# Sistema de layout UI/UX — ElectroCMS

Estado de implementación: existe un prototipo visual anticipado en `src/editor-ui/editor/`. Representa la composición objetivo y sus adaptaciones, pero no cierra las fases funcionales F04–F07.

## Decisión de producto

ElectroCMS usa un application shell adaptativo y orientado a tareas. La jerarquía funcional se conserva en todos los tamaños; solo cambia el contenedor que la presenta.

## Layout por capacidad disponible

### Desktop/laptop horizontal — desde 1024 px

- Header y toolbar superior persistentes de 40 px.
- Rail de navegación de alta densidad: 44 px colapsado y 44–168 px redimensionable; desde 96 px muestra etiquetas compactas junto a los iconos.
- Panel izquierdo contextual de 192 px por defecto para páginas, capas o componentes; rango 168–280 px.
- Canvas central flexible con mínimo útil y zoom independiente.
- Inspector derecho de 224 px por defecto; rango 216–320 px.
- Status bar de 24 px para sincronización, selección y diagnóstico.
- Los paneles se redimensionan, desacoplan y acoplan de forma independiente a izquierda, derecha o rail. Soltar en el rail los minimiza como pestañas verticales de borde; la persistencia del workspace se implementará en su microfase funcional y no se simula.
- Los separadores admiten arrastre por puntero y teclado: flechas en pasos de 16 px, `Home` al mínimo y `End` al máximo, con valores ARIA expuestos.
- El rail usa el mismo patrón de resize accesible. Al arrastrar, los paneles flotantes muestran simultáneamente guías para izquierda, derecha y rail, resaltan el destino activo y ofrecen botones equivalentes; maximizar y cerrar no forman parte del sistema.

### Tablet — 768 a 1023 px

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
- En el chrome del editor, padding y gaps se limitan normalmente a 4–8 px; no se usan márgenes amplios con finalidad decorativa.
- Radios de 4–6 px, controles y filas de 32 px en desktop; el canvas conserva solo el espacio necesario para manipular el documento.
- Escala de z-index documentada: base, sticky, dropdown, overlay, modal, toast, drag-preview.
- Tipografía con cuerpo mínimo de 16 px en móvil y longitud de línea de 35–60 caracteres móvil / 60–75 desktop.
- Iconos SVG coherentes; sin emoji estructural.

## Criterios de aceptación de layout

- Ninguna función desaparece en pantallas pequeñas.
- No hay scroll horizontal a nivel página a 320 CSS px.
- El foco nunca queda oculto por header, sheet o toolbar sticky.
- Todos los targets críticos alcanzan 44 × 44 CSS px en superficies touch; escritorio de alta densidad admite 32 px con foco visible y operación por puntero/teclado.
- Drag, resize y reordenar tienen alternativa de una sola activación y teclado.
- `prefers-reduced-motion`, modo oscuro y alto zoom conservan operación y contraste.

## Prototipo anticipado implementado

- Desktop desde 1024 px: header/toolbar de 40 px, rail de 44 px, páginas/capas, canvas punteado, inspector y barra de estado de 24 px simultáneos.
- Tablet/laptop: rail y canvas prioritario; páginas/capas e inspector se abren como paneles contextuales según el espacio disponible.
- Móvil: header compacto, canvas con marco de dispositivo, dock de cinco destinos y paneles como bottom sheets.
- Interacciones habilitadas: búsqueda de widgets, tabs, viewport del documento, tema y sheets con `Escape` y restauración de foco.
- Paneles desktop habilitados: movimiento y resize, dock izquierda/derecha/rail, pestañas verticales minimizadas, pin y restauración por puntero o teclado dentro de límites explícitos; cancelar el puntero no ejecuta el dock.
- Lenguaje visual vigente: superficies blancas/gris frío, azul `#2563EB` dominante en iconos, selección y navegación; rojo/ámbar/verde solo para errores, advertencias y éxito. Texto de controles, tabs, páginas, árbol e inspector a 12 px.
- Acciones no implementadas: publicar, preview, undo/redo, navegación a módulos y mutaciones del documento se muestran deshabilitadas o como planificadas.
- Evidencia responsive: 320, 375, 768, 1024, 1440 y 812 × 375 sin overflow horizontal ni errores de consola; 32 px en desktop y 44 px en tablet/móvil.
- Tema alternativo seleccionable `Bento Motion`: base neutral, azul de marca, paneles/secciones modulares, Lottie local diferido y movimiento adaptativo. Especificación en `design-system/electrocms/pages/bento-motion.md`.

## Fuentes

- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- WAI-ARIA APG Patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- Tailwind responsive design y container queries: https://tailwindcss.com/docs/responsive-design
- MDN container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
