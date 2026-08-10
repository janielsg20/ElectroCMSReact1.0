# Tema alternativo — Bento Motion

Estado: implementado como tema visual seleccionable del prototipo anticipado. No altera el modelo canónico ni cierra `M03.4` o fases funcionales posteriores.

## Propósito

Bento Motion ofrece una alternativa moderna, limpia y expresiva al tema Studio. Conserva la estructura, densidad, capacidades de ventanas y azul de marca de ElectroCMS; cambia superficies, jerarquía, radios, profundidad y movimiento.

## Lenguaje visual

- Base neutral fría con superficies translúcidas de alto contraste.
- Azul de marca como único acento decorativo y de selección.
- Paneles, secciones del inspector y grupos de páginas tratados como módulos Bento compactos.
- Radios de 10–16 px, sombras suaves y separación funcional de 4–8 px.
- Inter a 12 px en el chrome del editor; 32 px por control en escritorio y 44 px en touch.
- Tema claro y oscuro completos mediante tokens semánticos; sin colores arbitrarios por panel.

## Movimiento

- Lottie local y cargado de forma diferida en el selector de apariencia.
- Lottie no usa loop continuo y detiene `autoplay` con `prefers-reduced-motion`.
- Transiciones y microinteracciones de 200–280 ms con transform y opacity.
- Entrada escalonada de tarjetas solo al aplicar o cambiar contenido; no existen animaciones infinitas decorativas.
- Iconos SVG responden en hover sin cambiar las dimensiones del layout.

## Selección y accesibilidad

- Botón «Ajustes de apariencia» en el header con `aria-haspopup`, `aria-expanded` y estado visible.
- Selector con `dialog`, `radiogroup` y radios Studio/Bento Motion.
- Operación por click, toque, `Tab`, flechas, `Home`, `End`, `Enter`, `Espacio` y `Escape`.
- Al cerrar, el foco vuelve al botón de ajustes.
- El popover refluye dentro de 320 px y no produce scroll horizontal.

## Responsive

- Escritorio: header, rail, paneles y canvas se presentan como módulos Bento independientes.
- Tablet: rail y canvas conservan targets de 44 px y jerarquía Bento sin reducir funciones.
- Móvil: dock flotante seguro, toolbar modular y sheets Bento con safe area y scroll interno.

## Tokens principales

| Rol | Claro | Oscuro |
|---|---|---|
| Canvas | `#EEF1F5` | `#10141B` |
| Surface | `#FBFCFE` | `#1A202A` |
| Foreground | `#172033` | `#F3F6FA` |
| Muted | `#E5E9EF` | `#252D39` |
| Border | `#CBD3DF` | `#3B4655` |
| Primary | `#2F6FED` | `#75A7FF` |

## Criterios de salida

- Sin overflow horizontal en 320, 375, 768, 1024, 1440 y 812 × 375.
- Contraste y foco visibles en claro/oscuro.
- Ningún target activo menor de 44 px bajo 1024 px.
- Tema Studio sigue disponible y no cambia al seleccionar Bento.
- Lottie se sirve localmente y respeta movimiento reducido.
