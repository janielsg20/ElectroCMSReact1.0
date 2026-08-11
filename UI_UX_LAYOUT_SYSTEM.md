# Sistema de layout UI/UX — ElectroCMS

Estado de implementación: `M04.1 — Shell desktop`, `M04.2 — Shell tablet` y `M04.3 — Shell móvil` completadas. El shell de `src/editor-ui/editor/` ya es implementación formal de F04 para escritorio, tablet y móvil, conservando una sola jerarquía funcional. Rutas/shortcuts y temas del editor continúan en M04.4–M04.5; las capacidades funcionales posteriores F05–F07/F19 no se consideran cerradas por esta UI.

## Decisión de producto

ElectroCMS usa un application shell adaptativo y orientado a tareas. La jerarquía funcional se conserva en todos los tamaños; solo cambia el contenedor que la presenta.

## Layout por capacidad disponible

### Desktop/laptop horizontal — desde 1024 px

- Header y toolbar superior persistentes de 40 px.
- Rail de navegación de alta densidad: 44 px colapsado y 44–168 px redimensionable; desde 96 px muestra etiquetas compactas junto a los iconos.
- Panel izquierdo contextual para páginas, capas o componentes con resize dentro de límites explícitos.
- Canvas central flexible con mínimo útil y zoom independiente.
- Inspector derecho redimensionable dentro de límites explícitos.
- Status bar de 24 px para sincronización, selección y diagnóstico.
- Los paneles se redimensionan, desacoplan y acoplan de forma independiente a izquierda, derecha o rail. Soltar en el rail los minimiza como pestañas verticales de borde.
- Los separadores admiten arrastre por puntero y teclado: flechas en pasos de 16 px, `Home` al mínimo y `End` al máximo, con valores ARIA expuestos.
- El rail usa el mismo patrón de resize accesible. Al arrastrar, los paneles flotantes muestran simultáneamente guías para izquierda, derecha y rail, resaltan el destino activo y ofrecen botones equivalentes; maximizar y cerrar no forman parte del sistema.
- M04.1 persiste el workspace mediante un contrato local versionado `workspace.v1`: anchura del rail, anchuras de Biblioteca/Inspector, modo `docked`/`floating`/`minimized`, lado de dock, posición/tamaño flotante, pin y orden de apilado.
- Las preferencias se validan con Zod antes de restaurar. JSON corrupto, versión desconocida o combinaciones incompatibles se ignoran y el shell arranca con defaults seguros.
- Al restaurar en otro tamaño de viewport, rail, anchuras y bounds flotantes se limitan a sus rangos y se reposicionan para no dejar ventanas inaccesibles.
- El adapter web actual usa `localStorage` detrás de `WorkspacePreferencesStore`; estas preferencias son estado de UI y no forman parte del modelo canónico del proyecto.

### Tablet — 768 a 1023 px

Estado: `M04.2` `COMPLETADA`.

- `ResponsiveEditorShell` adapta el shell existente; no duplica navegación, canvas, Biblioteca, Inspector ni el contrato `workspace.v1`.
- Navegación presentada en rail contraído de 44 px, incluso si la preferencia desktop guardó el rail expandido; esa preferencia no se modifica.
- Canvas como región principal y prioritaria.
- Solo un panel contextual persistente a la vez; Biblioteca e Inspector se intercambian mediante controles explícitos.
- El panel secundario aparece como dialog lateral superpuesto, resizable y descartable, y puede promoverse a panel persistente.
- El resize del secundario admite puntero y teclado: flechas en pasos de 16 px, `Home`/`End` y valores ARIA.
- El overlay secundario cierra con `Escape`, retiene foco mientras está abierto y restaura el foco al disparador al cerrar.
- Portrait 768 y landscape 1023 están cubiertos por pruebas; al entrar en 1024 se desmonta la adaptación tablet y recupera el layout desktop.
- La geometría efímera del overlay vive solo en estado React y no se serializa en `workspace.v1`; existe una prueba que verifica que el payload persistido no cambia por redimensionar el overlay.
- Las acciones del header se mantienen mediante el responsive existente; M04.2 no crea una toolbar paralela.

### Móvil/tablet vertical — 320 a 767 px

Estado: `M04.3` `COMPLETADA`.

- `ResponsiveEditorShell` delimita el scope móvil mediante `data-mobile-shell` sin crear otra instancia de Editor, Biblioteca, Inspector ni navegación.
- Header compacto y canvas prioritario; el canvas reserva el espacio del bottom dock y las safe areas.
- Bottom navigation de cinco destinos: `Widgets / Páginas / Canvas / Props / Más`; los demás módulos permanecen en `Más`.
- Widgets, Páginas e Inspector se abren como bottom sheet accesible; las superficies temporales se cierran con `Escape`, retienen/restauran foco y tienen control explícito de cierre.
- Los targets del dock y acciones críticas mantienen al menos 44 px y `touch-action: manipulation`.
- `Canvas` fuera del módulo Editor no es una acción muerta: abre la navegación compacta desde la que se puede volver explícitamente al Editor.
- `max-width: 100vw`, containment de overscroll y safe areas evitan que el chrome móvil cree scroll horizontal de página.
- Al cruzar a 768 px una sheet móvil abierta se cierra a través del mismo flujo de interacción y M04.2 pasa a controlar el layout, sin trasladar estado geométrico temporal.
- `prefers-reduced-motion` elimina transiciones no esenciales del dock.
- 320 y 375 px están cubiertos por pruebas funcionales específicas, además de la transición móvil→tablet.

## Responsive basado en contenedor

- Los breakpoints globales gobiernan el shell.
- Los componentes usan container queries para responder al espacio real de su panel.
- Referencia inicial Tailwind: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`; los breakpoints del documento generado son datos del proyecto y no deben confundirse con los del editor.
- Se prueba explícitamente a 320, 375, 768, 1024, 1280, 1440 y 1920 px, además de 200 % y 400 % de zoom cuando la microfase correspondiente lo cierre.

## Semántica e interacción

- Header: `header`; navegación: `nav`; canvas: `main`; inspector y paneles complementarios: `aside` con nombre accesible.
- Toolbars con tres o más controles usan patrón ARIA Toolbar y roving tabindex cuando corresponda.
- Capas jerárquicas usan patrón Tree View; tablas editables usan Grid solo si se implementa toda su gestión de foco.
- Sheets y modales retienen foco, tienen cierre explícito, `Escape` y restauran foco al disparador.
- Los atajos no reemplazan controles visibles.
- El estado activo se comunica mediante texto/semántica además de color.

## Tokens Tailwind obligatorios

- Colores semánticos: canvas, surface, elevated, text, muted, border, primary, success, warning, danger, focus.
- Espaciado en ritmo de 4/8 px.
- En el chrome del editor, padding y gaps se limitan normalmente a 4–8 px; no se usan márgenes amplios con finalidad decorativa.
- Radios de 4–6 px, controles y filas compactos en desktop; el canvas conserva solo el espacio necesario para manipular el documento.
- Escala de z-index documentada: base, sticky, dropdown, overlay, modal, toast, drag-preview.
- Tipografía con cuerpo mínimo de 16 px en móvil y longitud de línea de 35–60 caracteres móvil / 60–75 desktop.
- Iconos SVG coherentes; sin emoji estructural.

## Criterios de aceptación de layout

- Ninguna función desaparece en pantallas pequeñas.
- No hay scroll horizontal a nivel página a 320 CSS px.
- El foco nunca queda oculto por header, sheet o toolbar sticky.
- Todos los targets críticos alcanzan 44 × 44 CSS px en superficies touch; escritorio de alta densidad admite controles compactos con foco visible y operación por puntero/teclado.
- Drag, resize y reordenar tienen alternativa de una sola activación y teclado.
- `prefers-reduced-motion`, modo oscuro y alto zoom conservan operación y contraste.
- Las preferencias del workspace nunca deben impedir abrir el editor; corrupción, versiones futuras o geometría fuera de pantalla se recuperan con defaults/clamping.

## Implementación vigente

- Desktop desde 1024 px: header/toolbar de 40 px, rail redimensionable, páginas/capas, canvas, inspector y barra de estado de 24 px simultáneos.
- Paneles desktop: movimiento y resize, dock izquierda/derecha/rail, pestañas verticales minimizadas, pin, orden de apilado y restauración por puntero o teclado dentro de límites explícitos.
- Persistencia M04.1: `src/editor-ui/editor/workspace-preferences.ts` + `workspace.v1`, con pruebas de round-trip, corrupción/versionado y remontaje real del shell.
- Tablet 768–1023: `ResponsiveEditorShell`, rail visualmente contraído, canvas + un panel persistente, overlay lateral secundario accesible/redimensionable y geometría efímera aislada de `workspace.v1`.
- Móvil 320–767: canvas prioritario, bottom dock de cinco destinos, sheets accesibles, safe areas, guardrails de overflow y transición explícita a tablet.
- Evidencia M04.2: PR #8 / run `31453249710`, 27 archivos de test y 107/107 pruebas, incluyendo 5 pruebas específicas tablet, más lint/typecheck/build verdes.
- Evidencia M04.3: PR #9 / run `31454024650`, 28 archivos de test y 112/112 pruebas, incluyendo 5 pruebas específicas móvil, más lint/typecheck/build verdes.
- Interacciones habilitadas: búsqueda de widgets, tabs, viewport del documento, tema y sheets con `Escape` y restauración de foco.
- Lenguaje visual vigente: superficies blancas/gris frío, azul `#2563EB` dominante en iconos, selección y navegación; rojo/ámbar/verde solo para errores, advertencias y éxito.
- Acciones de fases posteriores que aún no tienen motor funcional permanecen deshabilitadas o identificadas como planificadas.
- Tema alternativo seleccionable `Bento Motion`: base neutral, azul de marca, paneles/secciones modulares, Lottie local diferido y movimiento adaptativo. Especificación en `design-system/electrocms/pages/bento-motion.md`.

## Fuentes

- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- WAI-ARIA APG Patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- Tailwind responsive design y container queries: https://tailwindcss.com/docs/responsive-design
- MDN container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
