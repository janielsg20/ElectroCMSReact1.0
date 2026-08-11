# Sistema de layout UI/UX — ElectroCMS

Estado de implementación: `F04 — Application shell, navegación y workspaces responsive` `COMPLETADA`. M04.1–M04.5 formalizan escritorio, tablet, móvil, navegación profunda/shortcuts y apariencia del editor con una sola jerarquía funcional. F05 está activa y las capacidades funcionales posteriores F05–F07/F19 no se consideran cerradas por esta UI.

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
- La geometría efímera del overlay vive solo en estado React y no se serializa en `workspace.v1`.

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

## Navegación, rutas y shortcuts

Estado: `M04.4` `COMPLETADA`.

- Las rutas del shell son hashes profundos canónicos `#/sección`, adecuados para la PWA y hosting estático sin reglas de rewrite obligatorias.
- `activeSection` sigue siendo la única selección visual. La capa responsive observa `aria-current="page"` en los botones con `data-navigation-section` y sincroniza esa selección con History API.
- URL vacía o desconocida cae en `#/editor`; el estado de historial está versionado con `schemaVersion: 1`.
- `popstate` restaura la sección sin desmontar el shell, de modo que `workspace.v1`, anchuras, docks y otras preferencias de UI permanecen intactas.
- El contexto de TopBar `Producto / sección` funciona como breadcrumb visible y se mantiene sincronizado con la sección activa.
- Existe launcher visible de paleta de comandos; `Ctrl/⌘+K` abre/cierra la paleta, con búsqueda, listbox accesible, flechas, Enter, Escape, focus trap y restauración de foco.
- Shortcuts visibles/documentados: `Alt+Shift+E` Editor, `Alt+Shift+H` Inicio y `Alt+Shift+P` Páginas; no sustituyen controles visibles ni se activan en campos editables.
- Rail desktop, navegación móvil, command palette y shortcuts convergen en el mismo flujo `onSectionChange`.

## Temas del editor

Estado: `M04.5` `COMPLETADA`.

- `appearance.v1` es un contrato local versionado independiente de `workspace.v1` y del modelo canónico del proyecto.
- Preset visual y modo de color son dimensiones separadas: `Studio / Bento Motion / Flow Builder` y `Claro / Oscuro / Automático`.
- El selector usa dos `radiogroup` accesibles y soporta clic, flechas, `Home`, `End`, `Escape` y restauración de foco.
- `Automático` sigue `prefers-color-scheme` mediante `matchMedia` y reacciona a cambios del sistema sin recargar.
- La preferencia se aplica en `main.tsx` antes de montar React para reducir flash de apariencia; defaults compatibles: Studio + claro.
- JSON corrupto, versión futura o payload con campos extra se descarta y recupera defaults seguros.
- Studio, Bento Motion y Flow Builder reutilizan tokens semánticos; no se creó una segunda paleta CSS paralela para claro/oscuro.
- Gate WCAG AA automatizado para seis combinaciones: tres presets × dos colores resueltos.
- `theme-color` HTML y manifest están alineados al azul de marca `#2563EB`.

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
- La paleta usa `dialog`, `combobox`, `listbox` y `option` con selección activa semántica.
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
- Las preferencias del workspace/apariencia nunca deben impedir abrir el editor; corrupción o versiones futuras recuperan defaults seguros.
- Back/forward debe restaurar navegación sin perder estado del workspace.

## Implementación vigente

- Desktop desde 1024 px: header/toolbar de 40 px, rail redimensionable, páginas/capas, canvas, inspector y barra de estado de 24 px simultáneos.
- Paneles desktop: movimiento y resize, dock izquierda/derecha/rail, pestañas verticales minimizadas, pin, orden de apilado y restauración por puntero o teclado dentro de límites explícitos.
- Persistencia M04.1: `src/editor-ui/editor/workspace-preferences.ts` + `workspace.v1`.
- Tablet 768–1023: `ResponsiveEditorShell`, rail contraído, canvas + un panel persistente y overlay lateral secundario accesible/redimensionable.
- Móvil 320–767: canvas prioritario, bottom dock de cinco destinos, sheets accesibles, safe areas y guardrails de overflow.
- Navegación M04.4: `navigation-routing.ts`, `CommandPalette.tsx` y sincronización History API en `ResponsiveEditorShell`.
- Apariencia M04.5: `appearance-preferences.ts`, preaplicación en `main.tsx` y selector dual en `TopBar.tsx`.
- Evidencia M04.2: PR #8 / run `31453249710`, 27 archivos / 107 pruebas.
- Evidencia M04.3: PR #9 / run `31454024650`, 28 archivos / 112 pruebas.
- Evidencia M04.4: PR #10 / run `31454811218`, 30 archivos / 120 pruebas.
- Evidencia M04.5: PR #11 / run `31455514122`, 32 archivos / 132 pruebas, lint/typecheck/build verdes y contraste AA de seis variantes.
- Lenguaje visual vigente: superficies blancas/gris frío, azul `#2563EB` dominante en iconos, selección y navegación; rojo/ámbar/verde solo para errores, advertencias y éxito.
- Acciones de fases posteriores que aún no tienen motor funcional permanecen deshabilitadas o identificadas como planificadas.

## Fuentes

- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- WAI-ARIA APG Patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- Tailwind responsive design y container queries: https://tailwindcss.com/docs/responsive-design
- MDN container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
