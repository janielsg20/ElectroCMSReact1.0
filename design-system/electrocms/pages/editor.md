# Editor visual — override de página

Estado: aplicado al prototipo visual anticipado solicitado por el usuario. No cierra las fases funcionales F04–F07.

## Fuente

- Hereda `design-system/electrocms/MASTER.md`.
- Referencia visual autorizada: imagen adjunta por el usuario el 2026-08-10; no se consultaron otras aplicaciones.
- Consulta específica `ui-ux-pro-max`: no-code CMS visual editor, densidad 8/10, variación 5/10 y movimiento 3/10.
- Stack detectado: React 19 + TypeScript + Tailwind CSS 4.

## Composición

- Desktop amplio: header compacto, rail principal, panel de páginas/capas, canvas punteado con marco de dispositivo, inspector y status bar.
- Laptop: rail, canvas e inspector persistente; biblioteca accesible como panel contextual.
- Móvil: header compacto, canvas prioritario, dock de cinco destinos y biblioteca/inspector como bottom sheet.
- El canvas del documento mantiene su propio viewport y nunca fuerza overflow horizontal en la página.

## Lenguaje visual

- Soft UI Evolution con profundidad sutil, bordes visibles y superficies diferenciadas.
- Violeta reservado para selección, foco y acciones primarias; canvas del editor neutral.
- Tipografía local del sistema para conservar funcionamiento offline.
- Iconografía SVG outline coherente, sin emoji.
- Densidad alta en desktop; controles críticos conservan 44 × 44 px en todos los tamaños.
- El inspector agrupa Diseño, Acciones y Datos; la selección se comunica con etiqueta, contorno y semántica, no solo con color.

## Estado del prototipo

- Búsqueda de widgets, tabs, selector de viewport, tema y sheets móviles son interactivos.
- Publicar, preview, historial y módulos fuera del editor permanecen deshabilitados y etiquetados como planificados.
- Los ejemplos del canvas son contenido propio de demostración de ElectroCMS, no una referencia externa.
- Verificado en 320, 375, 768, 1024, 1440 y 812 × 375 sin overflow horizontal, errores de consola ni targets activos menores de 44 px.
