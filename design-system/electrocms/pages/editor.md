# Editor visual — override de página

Estado: aplicado al prototipo visual anticipado solicitado por el usuario. No cierra las fases funcionales F04–F07.

## Fuente

- Hereda `design-system/electrocms/MASTER.md`.
- Referencia visual autorizada: imagen adjunta por el usuario el 2026-08-10; no se consultaron otras aplicaciones.
- Consulta específica `ui-ux-pro-max`: no-code CMS visual editor, densidad 10/10, variación 4/10 y movimiento 2/10.
- Stack detectado: React 19 + TypeScript + Tailwind CSS 4.

## Composición

- Desktop/laptop horizontal desde 1024 px: header compacto, rail de iconos, panel de páginas/capas, canvas punteado con marco de dispositivo, inspector y status bar.
- Laptop: rail, canvas e inspector persistente; biblioteca accesible como panel contextual.
- Móvil: header compacto, canvas prioritario, dock de cinco destinos y biblioteca/inspector como bottom sheet.
- El canvas del documento mantiene su propio viewport y nunca fuerza overflow horizontal en la página.

## Lenguaje visual

- Soft UI Evolution con profundidad sutil, bordes visibles y superficies diferenciadas.
- Azul eléctrico `#2563EB` reservado para selección, foco y acciones primarias; superficies blancas, grises fríos y canvas neutral.
- Tipografía local del sistema para conservar funcionamiento offline.
- Iconografía SVG outline coherente, sin emoji.
- Densidad 10/10 en desktop; se compactan rail, gutters, tipografía y agrupaciones sin reducir controles críticos por debajo de 44 × 44 px.
- El inspector agrupa Propiedades, Acción y Backend; la selección se comunica con etiqueta, contorno y semántica, no solo con color.

## Estado del prototipo

- Búsqueda de widgets, tabs, selector de viewport, tema y sheets móviles son interactivos.
- Publicar, preview, historial y módulos fuera del editor permanecen deshabilitados y etiquetados como planificados.
- Los ejemplos del canvas son contenido propio de demostración de ElectroCMS, no una referencia externa.
- Verificado en 320, 375, 768, 1024, 1440 y 812 × 375 sin overflow horizontal, errores de consola ni targets activos menores de 44 px.
