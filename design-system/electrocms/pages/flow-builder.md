# Flow Builder — tema UI/UX de ElectroCMS

Estado: tema visual alternativo implementado de forma anticipada. No cierra F19 ni modifica la fase activa F03/M03.4.

## Objetivo

Flow Builder es un tema independiente para el editor de ElectroCMS que combina Minimal Clean + High Density con una arquitectura visual inspirada en builders profesionales como FlutterFlow, Figma, Linear y herramientas IDE. Reutiliza el mismo DOM, estado, paneles y contratos funcionales del editor; el cambio es exclusivamente de presentación y jerarquía visual.

## Identidad

- ID técnico: `flow`.
- Nombre visible: `Flow Builder`.
- Accent principal light: `#6C5CE7`.
- Accent principal dark: `#A89CF7`.
- Superficies predominantemente blancas/gris frío en light y grafito neutro en dark.
- El violeta se reserva para selección, foco, estados activos y acciones principales.
- No copia branding, assets ni código propietario de FlutterFlow.

## Densidad

- Controles desktop: 30 px aproximadamente.
- Filas de navegación/árbol: 30 px.
- Panel header: 32 px.
- Spacing funcional: 4–8 px.
- Radios: 5–10 px según nivel.
- Touch conserva los targets definidos por el shell base.

## Layout

Flow Builder no introduce un segundo editor. Se apoya en el shell adaptativo existente:

- Topbar compacta y continua.
- App rail de alta densidad.
- Panel contextual izquierdo para páginas, capas y widgets.
- Canvas central dominante.
- Inspector derecho para propiedades.
- Status bar inferior.
- Paneles docked/floating/minimized y resize existentes se conservan.
- Tablet y móvil mantienen overlays, bottom sheets y navegación adaptativa.

En desktop el tema usa una composición continua tipo IDE/builder, sin cards visuales entre rail, paneles y canvas.

## Componentes

### Topbar

- Superficie `--flow-chrome`.
- Brand compacto con bloque de acento violeta.
- Project switcher y acciones con hover sutil.
- Selector de apariencia incluye Studio, Bento Motion y Flow Builder.

### App rail

- Fondo continuo con el chrome.
- Iconos neutrales por defecto.
- Destino activo con superficie violeta suave e indicador vertical de 2 px.
- Labels aparecen usando el comportamiento responsive/redimensionable existente.

### Library / Layers

- Tabs compactas tipo segmented control ligero.
- Tree rows de 30 px.
- Selección mediante background suave, no mediante cajas pesadas.
- Widgets mantienen drag/click y semántica existentes.

### Inspector

- Tabs compactas.
- Contexto de selección destacado con degradado casi imperceptible hacia superficie neutra.
- Inputs de 30 px, fondo gris frío y focus ring violeta.
- Secciones separadas por divisores sutiles.

### Canvas

- Fondo neutro con grid de 20 px muy tenue.
- Toolbar compacta con grupos discretos.
- Device/document usa sombra controlada para mantenerlo como foco principal.
- El canvas conserva todo el comportamiento de viewport, pan, zoom y selección del shell existente.

## Responsive

### Desktop >= 1024 px

- Topbar: 42 px.
- Status bar: 22 px.
- Paneles docked continuos, sin esquinas redondeadas internas.
- Canvas ocupa todo el espacio flexible disponible.

### Tablet 768–1023 px

- Topbar: 44 px.
- Canvas prioritario.
- Paneles flotantes mantienen bordes suaves y shadow de overlay.

### Móvil < 768 px

- Topbar: 44 px.
- Canvas principal.
- Bottom dock y sheets usan el mismo lenguaje Flow.
- Selector de temas hace reflow vertical y permite scroll interno cuando sea necesario.

## Accesibilidad

- No elimina controles visibles ni alternativas de teclado.
- Conserva `focus-visible` y usa `--color-focus` de alto contraste.
- Respeta `prefers-reduced-motion`.
- No usa color como único indicador del estado activo.
- No modifica contratos ARIA del shell actual.

## Implementación

- Tokens TypeScript: `src/editor-ui/theme/tokens.ts` → `flowColorThemes`.
- Selector: `src/editor-ui/editor/TopBar.tsx` → `UiTheme` incluye `flow`.
- CSS aislado: `src/flow-builder-theme-v10.css`.
- Carga final: `src/main.tsx`, después de las capas existentes para que el tema pueda redefinir presentación sin duplicar componentes.

## Restricciones

- No mover lógica del editor al CSS del tema.
- No crear un segundo Canvas, Inspector, Library, State Manager o Selection Manager.
- No marcar F19 como completada por esta entrega visual.
- Cambios funcionales futuros deben implementarse en su fase propietaria.
