# Changelog

## 2026-08-14 — Inicio M13.4: tienda demo compartida

- Añadido `demoStore` al modelo canónico para identidad, colores, producto destacado y preferencias visibles del dashboard; una actualización se registra como una sola acción reversible.
- Añadido `Contenido → Tienda`, una edición accesible de la tienda demo que no crea una copia por workspace.
- Verificación inicial: TypeScript, ESLint y dos pruebas de dominio verdes.

## 2026-08-14 — M13.3: motor canónico de modelos de proyecto

- Un modelo aplica, en una sola mutación reversible del Command Bus, páginas, plantillas Single/Archive, tipo de contenido, campo, clasificación, relación, contenido de ejemplo, consulta, formulario, rol, menú y pantalla administrativa.
- La aplicación preserva los datos existentes: detecta conflictos de tipo y ruta antes de escribir y no sobrescribe recursos.
- Añadida cobertura de creación completa y de rechazo al aplicar el mismo modelo dos veces; TypeScript, lint, build y pruebas focalizadas pasan.
- Añadido el selector visual lazy en Contenido → Modelos, con 20 opciones, ayuda contextual, estados de aplicación y mensajes de conflicto sin exponer identificadores ni contratos internos.
- Añadida prueba de interfaz que cubre selección, aplicación y conflicto; las tarjetas del selector ahora anuncian correctamente su nombre a tecnologías de asistencia.
- La suite completa confirma el alcance: 121 archivos y 476 pruebas aprobadas; TypeScript, ESLint, build y comprobación de espacios también están en verde. La auditoría Chromium queda pendiente de un runner que incluya navegador.

## 2026-08-13 — M13.3: contrato de blueprints de proyecto

- Añadido el catálogo canónico y versionado de los 20 tipos de proyecto requeridos, cada uno con contenido principal y cobertura que deberá materializarse al aplicarlo.
- El catálogo no se presenta como una demo creada: la siguiente entrega lo aplicará al proyecto mediante mutaciones canónicas.

## 2026-08-13 — M13.2: seguridad y rendimiento de multimedia

- La importación valida el encabezado real antes de persistir y admite PNG/JPEG/GIF/WebP/AVIF, SVG, PDF, fuentes, audio y vídeo; rechaza discrepancias MIME y binarios desconocidos.
- Límites locales: 8 MB por archivo y 40 MB por biblioteca. Imágenes y galerías cargan de forma diferida; audio y vídeo precargan metadatos.
- Las imágenes importadas crean una miniatura PNG local de hasta 240 px, separada del original y visible desde la biblioteca.

## 2026-08-13 — M13.1: resolución local de recursos en el lienzo

- El preview del editor detecta las referencias canónicas `asset://` de documentos y componentes y carga sólo sus binarios locales desde IndexedDB.
- El renderer recibe un mapa temporal de fuentes ya resueltas y conserva la misma validación de esquemas seguros para imágenes, galerías, vídeo y audio.
- Añadidas pruebas para la extracción de referencias y para la resolución segura dentro de los adapters React.

## 2026-08-13 — M13.1: selector multimedia en el inspector

- Los widgets de imagen, logo, vídeo, audio y galerías reutilizan la biblioteca desde el inspector mediante un selector visual de recursos compatibles.
- El selector conserva una referencia canónica al recurso y puede mantener URL externas, pero muestra el nombre del archivo en vez de identificadores internos.
- Añadida cobertura para elegir el recurso y guardarlo mediante la mutación canónica del editor. El selector memoiza la lista filtrada para no recalcularla en cada interacción.

## 2026-08-13 — M13.1: organización y protección de recursos

- El gestor permite crear carpetas y etiquetas, asignarlas mediante controles ElectroCMS al recurso seleccionado y verificar que las referencias existan antes de guardarlas.
- Añadidos filtros por tipo y favorito, junto con eliminación en dos pasos; la eliminación sigue bloqueada si el recurso está en uso.
- Corregida la detección de SVG para clasificarlos como iconos antes de la regla general de imágenes y el ciclo de vida asíncrono del formulario de organización.
- Verificación: TypeScript, ESLint, build Vite, 18 pruebas focalizadas y suite completa secuencial de 116 archivos / 462 pruebas verdes.

## 2026-08-13 — Inicio M13.1: biblioteca multimedia canónica

- Añadido el modelo local de recursos multimedia: imágenes, SVG, vídeo, audio, documentos, fuentes e iconos con metadatos, alt, dimensiones, carpetas, etiquetas, favoritos y recientes.
- La biblioteca evita duplicados mediante huella de contenido y bloquea eliminar un recurso todavía referenciado por un documento o componente.
- Crear, editar y eliminar recursos pasa por el Command Bus, por lo que conserva persistencia local y deshacer/rehacer.
- Validación inicial: TypeScript y 14 pruebas focalizadas verdes de dominio y sesión. La interfaz de biblioteca y la persistencia del binario continúan en M13.1.

## 2026-08-13 — M13.1: importación local y gestor visual

- La biblioteca multimedia aparece como herramienta lazy dentro de Contenido y permite importar varios archivos al almacenamiento local IndexedDB.
- La importación obtiene huella SHA-256, tipo, tamaño y dimensiones de imagen; conserva el binario como Data URL local junto con metadatos canónicos del proyecto.
- Añadidas búsqueda de recursos y edición accesible de texto alternativo, descripción y favorito.
- Verificado con ESLint, TypeScript, build Vite y 16 pruebas focalizadas verdes.

## 2026-08-13 — M12.5: registro local de auditoría

- Añadido un registro local de actividad para cada mutación, deshacer y rehacer que pasa por el Command Bus existente.
- Cada entrada conserva acción, etiqueta, comandos, actor (persona activa o modo de configuración) y rutas modificadas; no almacena los valores editados en el informe.
- Administración incorpora un panel accesible de actividad reciente y exportación JSON local. La consulta y la exportación se controlan con las nuevas capacidades explícitas `audit.view` y `audit.export`.
- Verificado con TypeScript, ESLint, build Vite y suite completa: 114 archivos / 455 pruebas verdes. Se ajustó el verificador de arquitectura para que evalúe únicamente módulos de producción; los fixtures de pruebas pueden importar la estructura inicial sin ser una inversión de capas. La auditoría Chromium sigue bloqueada localmente por falta de navegador compatible.

## 2026-08-13 — Auditoría exhaustiva F12: permisos y paneles

- Corregido el modo de configuración de Administración: sin una persona activa vuelve a listar todos los paneles del proyecto, en lugar de ocultarlos y bloquear su edición.
- La simulación de una persona aplica ahora permisos efectivos de lectura, creación, edición, eliminación, acciones masivas y campos dentro de cada vista administrativa. Los datos y controles no autorizados dejan de exponerse; la denegación sigue siendo el valor predeterminado.
- Añadida una salida explícita de la comprobación de permisos para regresar al modo de configuración.
- Añadidas dos pruebas de integración para confirmar tanto el modo de configuración como la denegación de CRUD/datos para una persona sin lectura.
- Validación por lotes: 447 pruebas verdes de dominio, UI, renderers, sesiones, aplicación e infraestructura; ESLint, TypeScript y build Vite verdes. La auditoría Chromium permanece pendiente por ausencia de navegador en el runner.

## 2026-08-13 — Auditoría correctiva F12: código y navegación

- Corregidos los bloqueos de lint y TypeScript introducidos al integrar la versión más reciente: tipo público para el estado de usuario, contexto activo seguro antes de inicializar el CMS, provider separado para Fast Refresh y fixture RBAC tipada correctamente.
- El renombrado de capas ya no sincroniza estado dentro de un efecto; el campo conserva el nombre de la selección mediante una referencia, evitando renderizados en cascada.
- Revisada la ubicación de módulos: Capas/Widgets se mantienen contextuales, Contenido/Administración/Diseño permanecen como workspaces globales y Administración se alcanza en móvil desde `Más`.
- Verificado con ESLint, TypeScript, build Vite y 34 pruebas focalizadas verdes. El runner actual no aporta Chrome/Chromium, por lo que la auditoría visual automatizada queda pendiente.

## 2026-08-13 — Corrección F05: operaciones y accesibilidad del árbol

- Corregida una regresión importante: faltaba eliminar elementos del lienzo aunque era un requisito de F05.1.
- Añadida `deleteNodes` al motor canónico, sesión y Command Bus; la eliminación incluye descendientes, respeta bloqueos y puede revertirse con el historial existente.
- El árbol de capas ofrece ahora selección más clara, acción visible de eliminar, confirmación, atajo Supr/Retroceso y anuncio accesible de resultado.
- Expuestas también las operaciones de duplicar, renombrar, mostrar/ocultar y bloquear/desbloquear, que existían en el dominio pero no en la interfaz.
- Verificado con TypeScript, build Vite y 24 pruebas focalizadas verdes de operaciones y árbol.

## 2026-08-13 — Cierre M12.4: personas y contexto operativo

- Añadido CRUD canónico de personas, validado mediante el Command Bus y protegido frente a correos duplicados o eliminación de autorías existentes.
- Incorporada una persona activa persistente localmente; el área Administración muestra solo los paneles y entradas de menú a los que esa persona tiene acceso explícito.
- Agregado el gestor visual `Personas y acceso`, con asignación de roles, estados y una acción clara para probar permisos sin exponer identificadores internos.
- Verificado con TypeScript, build Vite y 16 pruebas focalizadas verdes de sesión, RBAC y personas. La ejecución completa de ESLint excedió el límite local de 60 s sin emitir diagnóstico.

## 2026-08-13 — Cierre M12.3 y corrección de regresión

- Cerrada M12.3: RBAC con denegación por defecto, CRUD de roles y gestor de Roles y permisos dentro de Administración.
- La auditoría completa por lotes pasó con 110 archivos / 438 pruebas, además de lint, TypeScript y build Vite.
- Corregida una regresión detectada durante la auditoría: el reordenamiento de acciones de formularios usaba una instantánea anterior; ahora opera sobre el estado canónico más reciente.
- Activada M12.4 para personas activas y filtrado operativo de paneles y menús.

## 2026-08-13 — M12.3 RBAC: motor y gestor inicial

- Añadido CRUD canónico de roles mediante Command Bus; la eliminación se bloquea si conserva referencias de usuarios, permisos, menús o paneles.
- Incorporado `Roles y permisos` a Administración, con controles accesibles y divulgación progresiva para permisos generales, por contenido, panel y campo.
- Verificado con lint focalizado, TypeScript, build Vite y 17 pruebas verdes de RBAC, motor de roles y sesión. M12.3 continúa abierta hasta aplicar autorización efectiva en las vistas administrativas.

## 2026-08-13 — Cierre M12.2 y auditoría responsive

- Cerrada M12.2 tras validar la build de producción en móvil 390×844, tablet 768×1024 y escritorio 1440×900, sin desbordamiento horizontal visible.
- Confirmado el flujo completo de Páginas y el acceso a Administración sin errores de consola.
- La cobertura automatizada del head pasa por lotes: 98 archivos / 416 pruebas, además de lint, typecheck y build.
- Activada M12.3 para autorización real por roles y capacidades con denegación por defecto.

## 2026-08-13 — Inicio M12.3: autorización centralizada

- Añadido el evaluador RBAC central con denegación por defecto para capacidades, rutas, pantallas, permisos de contenido, campos y menús.
- Solo usuarios activos con una concesión explícita obtienen acceso; los filtros se aplican antes de entregar navegación o campos a una vista.
- Añadidas las ocho plantillas iniciales de rol y sus capacidades base. Tipos y cuatro pruebas del contrato RBAC verdes.

## 2026-08-13 — Correcciones de navegación entre Páginas y Editor

- Corregido el flujo de Páginas: al seleccionar una página o plantilla aparece `Editar en el editor`, que abre el documento en el lienzo visual existente y vuelve al editor.
- La sesión ahora notifica el cambio de documento activo, por lo que Canvas, breadcrumb y paneles se actualizan sin recargar ni crear un segundo editor.
- Corregida la paridad responsive: Administración se ofrece también en `Más` del menú móvil.
- Añadida cobertura para la selección de documento y el acceso móvil a Administración. Validación focalizada verde: lint, typecheck y 15 pruebas.

## 2026-08-13 — Rutas seguras al crear páginas

- Corregida la creación de páginas: la ruta se deriva automáticamente del nombre y se puede editar, evitando que una página nueva reutilice `/` y choque con la página inicial.
- Añadida prueba de UI para la ruta sugerida y la persistencia de la página. La auditoría local de producción confirmó crear, seleccionar y editar la página en el mismo editor sin errores de consola.
- Se estabilizó una prueba de carga diferida de Formularios, aumentando solo su espera explícita a 5 s; el comportamiento de la aplicación no cambió.
- Validación actual: lint, typecheck, build y cobertura completa dividida en lotes verdes: 98 archivos / 416 pruebas. La suite serial completa excede el límite de 10 minutos del ejecutor y la auditoría visual responsive aún debe repetirse para cerrar M12.2.

## 2026-08-13 — Administración como workspace principal

- Separada Administración como destino principal del sidebar dentro de `Administrar`; Contenido conserva únicamente sus herramientas de datos.
- Añadido workspace central de Administración con lista de paneles y la vista seleccionada, sin crear un segundo canvas, store ni modelo de datos.
- Eliminado lenguaje interno visible de la vista administrativa y añadida cobertura de navegación para la separación de módulos.
- Corregido el gráfico administrativo para que represente realmente la distribución por estado, separado del resumen de métricas.
- Añadido acceso desde un panel administrativo a su lienzo canónico en el editor; no se crea un canvas paralelo.
- Los controles de selección de tabla cumplen 44 px en touch y los valores estructurados quedan dentro de Opciones avanzadas.
- Estabilizada la validación UI: el setup desmonta cada render al finalizar y Vitest ejecuta archivos en serie, evitando contaminación de DOM y carreras con módulos diferidos en jsdom.
- Validación local del head: lint, typecheck, build Vite y suite completa verde (107 archivos / 434 pruebas). La auditoría Chromium del head sigue pendiente para cerrar M12.2.

## 2026-08-12 — Reauditoría UX/UI de Widgets y workspace

- La biblioteca desktop abre a 360 px y admite hasta 400 px; el antiguo valor predeterminado de 216 px se migra automáticamente sin sobrescribir anchos personalizados.
- La cuadrícula cambia por ancho real del panel: dos columnas desde 300 px útiles y una columna cuando el panel se estrecha, preservando el lienzo y la legibilidad.
- El icono ambiguo de `pin` se sustituyó por una estrella reconocible para Favoritos, con descripción accesible y tooltip nativo; la ayuda de la biblioteca explica Insertar, Favoritos y Arrastrar.
- Las tarjetas dejan de mostrar IDs técnicos en el flujo principal y priorizan nombre, categoría y explicación breve, conforme al modelo mental Elementor/WordPress.
- Validación: lint, typecheck y build verdes; 14 pruebas focalizadas verdes; auditoría Chromium sobre producción con 20 estados, cero overflow horizontal, targets touch menores de 44 px, errores de arquitectura, excepciones o consola.

## 2026-08-12 — Auditoría UX/UI M11.1 (editor, Capas y Widgets)

- Formularios expone ahora `Campo obligatorio` al crear, añadir y editar campos; el contrato canónico `FormControlEditablePatch` admite esa mutación y continúa pasando por sesión, Command Bus, persistencia e historial.
- Añadido ordenamiento de campos por arrastre con sensores separados para puntero, touch y teclado, anuncios accesibles y alternativa permanente mediante botones subir/bajar.
- El FormManager responde al ancho real de su contenedor: apila workspace/sidebar, convierte formularios guardados en tarjetas flexibles y reduce texto secundario antes de comprometer legibilidad o targets touch.
- El diálogo de `Tamaños de pantalla` se renderiza mediante portal en `document.body`, evitando que un ancestro transformado lo comprima o desplace respecto del viewport. También se unificó su vocabulario visible (`Añadir tamaño`, `Crear tamaño`).
- Simplificada la presentación del editor con vocabulario orientado a tareas: el administrador responsive ahora se presenta como `Tamaños de pantalla`, explica su propósito y referencia el modo responsive de Elementor sin alterar breakpoints, herencia ni persistencia canónica.
- `Capas` presenta la `Estructura de la página`, con guía visual de anidación, estado visible de elementos ocultos y ayuda contextual que explica selección, jerarquía y alternativa al arrastre.
- `Widgets` incorpora ayuda contextual, descripciones orientadas a la acción y una cuadrícula que usa el ancho real del panel para pasar a dos columnas solo cuando cada tarjeta mantiene una lectura cómoda. El control de cuatro direcciones explica explícitamente que permite arrastrar, mientras `Insertar` continúa siendo la alternativa sin drag-and-drop.
- `HelpTip` se reposiciona como superficie fija dentro del viewport, recalcula su posición ante resize/scroll y se cierra con Escape; los paneles de información dejan de recortarse por paneles o de salir de pantalla.
- La auditoría local agregó detección de Chrome/Edge en Windows, perfil privado y usa la build de producción para evitar que HMR o preferencias previas afecten la revisión. Auditoría Chromium final: 20 estados en desktop/tablet/móvil, cero overflow horizontal, cero targets touch menores de 44×44, cero errores de arquitectura, excepciones o consola.
- Validación técnica: typecheck, lint y build verdes; 23 pruebas focalizadas verdes. La suite global alcanzó 370/373 antes de corregir tres expectativas/timeouts heredados por el nuevo lenguaje y la carga diferida; esas tres pasan aisladas tras el ajuste. El rerun global serial no reportó fallos, pero excedió el límite de seis minutos.
- La revisión visual detectó una regla histórica que daba ancho completo a cada control de una fila de Capas; se limitó a los botones correctos para que el árbol vuelva a mostrar nombre, icono, sangría y menú de cada nodo.

## 2026-08-11 — Auditoría visual F04 / M04.1 (pestañas de Biblioteca)

- Corregidas las pestañas de Biblioteca en paneles estrechos: el contenedor usa su propio breakpoint, elimina iconos redundantes y cambia visualmente `Documentos` a `Docs`, conservando el nombre completo para lectores de pantalla. Se evita que los cuatro destinos se fusionen o se recorten.

## 2026-08-11 — Auditoría visual F04 / M04.1 (canvas y arquitectura de navegación)

- Reestructurada la barra del lienzo en tres regiones de grid: herramientas/selección, viewport y breakpoint, y acciones. Las reglas por container query retiran primero el breadcrumb y controles secundarios cuando los paneles laterales reducen el espacio; no hay solapamiento en 1440, 1024, 768 ni 375 px.
- Eliminado el indicador sticky inferior que repetía breakpoint, ancho, orientación y zoom ya disponibles en la barra superior.
- Separada la apariencia local del editor de los temas de proyecto: TopBar conserva solo `appearance.v1`; Frontend y Backend se editan desde Biblioteca > Diseño y siguen perteneciendo al proyecto exportable.
- Renombrada la pestaña Plantillas como Documentos para describir correctamente sus páginas y plantillas canónicas. No se añadió una sección de componentes porque no existe todavía un editor de componentes funcional.

## 2026-08-11 — Auditoría visual F04 / M04.1

- Corregido el conflicto de selectores de la barra superior que comprimía cada preset del popover de Apariencia a un icono en móvil y superponía los textos.
- El popover respeta ahora el espacio del bottom dock móvil y conserva scroll interno; en tableta el control de apariencia se compacta a un icono de 44 px sin perder nombre accesible ni tooltip.
- Verificado manualmente en 1440, 1024, 768, 375 y 812 px: sin overflow horizontal ni errores de consola. Regresión local: `appearance-shell`, `project-theme-control` y `workspace-persistence`, 13/13 pruebas verdes.

## 2026-08-11 — Auditoría F04 / M04.1 Shell desktop

- Corregida la cancelación de arrastre y redimensionado: un `pointercancel` restaura el rail, el ancho acoplado o la geometría flotante de origen y no persiste una interacción incompleta.
- Normalizadas coordenadas de inicio y movimiento de puntero; eventos incompletos ya no pueden calcular posiciones `NaN` ni emitir estilos CSS inválidos.
- Añadida prueba de regresión para cancelar el movimiento de una ventana flotante; `workspace-persistence.test.tsx` pasa 3/3 pruebas sin advertencias y typecheck verde.

## 2026-08-11 — Auditoría de calidad F08

- Restauradas las dependencias exactas desde `package-lock.json` tras la actualización remota; el lint vuelve a resolver el contrato tipado de drag-and-drop.
- Corregido el campo de nombre del tema de proyecto: en touch usa un target de 44 px y en escritorio conserva la densidad de 36 px.
- Añadida prueba de regresión para ambas clases responsive; `project-theme-control.test.tsx` pasa 4/4 pruebas.

## 2026-08-11 — M08.3 Motor de plantillas

- Formalizados documentos de página, template, header, footer, single, archive y 404 sobre el árbol canónico, con rutas de página únicas y condiciones tipadas.
- Añadida resolución determinista de main/header/footer por prioridad, especificidad y desempate estable, sin duplicación de documentos o árboles.
- La pestaña Plantillas crea documentos y edita condiciones mediante Command Bus, persistencia local e historial reversible.
- Añadido `TEMPLATE_SYSTEM.md` y cobertura para composición, validación, persistencia y undo.
- Puerta local: lint, typecheck, **60 archivos / 276 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 404.80 kB y catálogo 153.40 kB.
- Activada `M08.4 — Paquetes theme`.

## 2026-08-11

- Cerrada `M08.2 — Presets visuales`: catálogo canónico de 9 presets para el editor y 11 presets independientes para frontend/backend.
- Los presets del editor aplican color claro/oscuro, tipografía, sombras, radios, densidad y una gramática estructural compatible; `appearance.v1` migra los IDs históricos Studio/Bento/Flow sin perder preferencias.
- Los presets de proyecto declaran layout, componentes, bordes, elevación, perfil responsive y accesibilidad; aplicarlos crea una copia editable en un único ámbito mediante Command Bus, sin reemplazar contenido ni breakpoints.
- Añadidas paletas visuales, navegación radio con flechas/Home/End, foco roving y pruebas automáticas WCAG AA para 20 variantes de editor y 11 temas de proyecto.
- Puerta local: lint, typecheck, **59 archivos / 271 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 396.37 kB y catálogo 153.40 kB.
- Activada `M08.3 — Motor de plantillas`.

- Cerrada `M08.1 — Tres ámbitos de tema`: editor permanece en `appearance.v1`, mientras frontend/backend se incorporan como estado canónico independiente y retrocompatible en `ProjectStructure.themes`.
- Añadidos schema v1 y tokens semánticos estrictos para color, tipografía, espaciado, radios, sombras, movimiento y densidad; valores inseguros o fuera de rango se rechazan antes de persistir.
- Update/reset de temas pasan por Command Bus, IndexedDB y undo/redo; el renderer consume frontend por defecto y backend de forma explícita sin mezclar tokens.
- El store publica cambios por ámbito preservando granularidad de render; la UI de Ajustes separa Editor/Frontend/Backend con paleta, edición validada y reset honesto.
- La revisión React mantuvo drafts aplicados por evento, compiladores fuera de componentes y suscripciones estables sin estado derivado por efectos.
- Puerta local: lint, typecheck, **57 archivos / 246 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 380.58 kB y catálogo 153.40 kB.
- Activada `M08.2 — Presets visuales`.

- Cerrada `M07.5 — Datos, condiciones y accesibilidad` y completada F07.
- Añadido motor neutral para bindings literales, rutas de proyecto y referencias entre nodos, más condiciones `all/any/negate` con diagnóstico fail-visible.
- Incorporado `node.accessibility` retrocompatible con label, description, roles permitidos y tabIndex acotado; el renderer aplica ARIA y visibilidad reactivas.
- Añadido editor JSON estructurado con diagnósticos, validación y reset en una sola operación reversible; no se adelantaron DataProvider, queries ni Action Flow.
- Update/reset persisten mediante Command Bus e IndexedDB; pruebas cubren fuentes, operadores, reactividad, UI, ARIA y undo.
- Puerta local: lint, typecheck, **55 archivos / 236 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 370.25 kB y catálogo 153.40 kB.
- Activada `F08 / M08.1 — Tres ámbitos de tema`.

- Cerrada `M07.4 — Motor de breakpoints`: alta, edición, orden, orientación y herencia sobre la lista canónica con rechazo de padres inválidos y ciclos.
- Añadido administrador accesible y selección completa de perfiles; Desktop/Tablet/Móvil permanecen como atajos, no como segunda lista.
- El canvas usa el ancho real activo y `workspace.v1` persiste solo ID/orientación de preview; reset elimina únicamente el override del nodo en ese breakpoint.
- Operaciones integradas con Command Bus, IndexedDB, renderer y undo; `RESPONSIVE_ENGINE.md` documenta el contrato.
- Puerta local: lint, typecheck, **54 archivos / 229 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 360.86 kB y catálogo 153.39 kB.
- Activada `M07.5 — Datos, condiciones y accesibilidad`.

- Cerrada `M07.3 — Motor de estilos`: compilador neutral a React para tokens, clases, estados interactivos, herencia segura y CSS determinista con alcance por nodo.
- Rechazadas propiedades, extensiones y valores peligrosos (`url()`, `expression`, selectores o reglas arbitrarias) antes de persistir; el renderer también degrada con seguridad estructuras históricas inválidas.
- Añadido editor de estilos canónicos con clases y JSON estructurado; tamaño, margen y padding permanecen bajo direct manipulation y se preservan al aplicar/resetear estilos visuales.
- `setNodeStyles`, update y reset pasan por `ProjectStructureCommand`, `ProjectCommandBus`, IndexedDB y renderer; integración cubierta hasta undo.
- La revisión React mantuvo el compilador fuera de React, evitó barrels nuevos en la ruta del renderer y conservó un único estado canónico.
- Puerta local: lint, typecheck, **52 archivos / 223 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 349.95 kB y catálogo 153.39 kB.
- Activada `M07.4 — Motor de breakpoints`.

- Cerrada `M07.2 — Controles y validación`: controles nativos tipados, JSON para valores complejos, error inline accesible, defaults seguros y reset por campo.
- Añadidos `setNodeProperties`, `updateWidgetProperty` y `resetWidgetProperty`; todos validan schema/estructura y persisten por `ProjectStructureCommand` + `ProjectCommandBus`.
- Un formulario por campo crea una sola entrada de historial al aplicar; integración IndexedDB cubre invalidación, update, reset y undo.
- Puerta local: lint, typecheck, **51 archivos / 215 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 337.13 kB y catálogo 153.39 kB.
- Activada `M07.3 — Motor de estilos`.

- Cerrada `M07.1 — Inspector generado por schema`: nueve secciones derivadas exclusivamente de `WidgetDefinition.inspector`, con descriptor, tipo, opciones, obligatoriedad, valor efectivo y origen Nodo/Predeterminado.
- Añadidos grupos nativos `details/summary`, conteos, estados vacíos y fallback honesto para selecciones sin definición; no se crearon inputs inertes ni runtimes futuros.
- Creado `INSPECTOR_SYSTEM.md` como contrato breve para F07.
- Puerta local: lint, typecheck, **51 archivos / 213 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 332.28 kB y catálogo 153.39 kB.
- Activada `M07.2 — Controles y validación`.

- Cerrada `M06.5 — UX de biblioteca` y completada F06: búsqueda, categorías, filtros, favoritos, recientes, miniaturas SVG y presets guardados sobre las 115 definiciones reales.
- Añadido `library.v1` para preferencias locales versionadas y recuperables; los presets conservan propiedades/estilos/responsive sin copiar hijos ni referencias dinámicas.
- Añadida inserción por clic y DnD pointer/touch/teclado con destino visible en canvas y alternativa accesible sin arrastre.
- Toda inserción valida defaults, genera ID, elige colocación canónica y ejecuta `ProjectStructureCommand` mediante el `ProjectCommandBus`; el nodo nuevo queda seleccionado.
- La revisión React separó proveedor/contexto DnD, evitó lecturas de refs durante render, difirió búsqueda y aplicó `content-visibility` al catálogo largo.
- Puerta local: lint, typecheck, **49 archivos / 209 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 329.71 kB, DnD 53.27 kB, persistencia 96.44 kB y catálogo 153.39 kB.
- Activada `M07.1 — Inspector generado por schema`.

- Eliminada la “demo final” completa y sus datos aspiracionales: dashboard, módulos, métricas, rutas, command palette y superficies de producto futuras.
- Retirados Run, preview, generador IA, binding, acciones, backend, páginas ficticias y todos los controles inertes que aparentaban funcionalidad.
- Sustituido `Revista Horizonte` por `Proyecto local / Página inicial`, una estructura canónica mínima y una nueva base local v2 que no restaura la demo anterior.
- La biblioteca ahora deriva sus 115 widgets del registro real y permite buscarlos sin afirmar inserción; el inspector muestra exclusivamente estado, propiedades, estilos y overrides del nodo seleccionado.
- Simplificados desktop, tablet y móvil alrededor del editor construido; el dock móvil queda en Widgets, Capas, Canvas e Inspector.
- Eliminados también los fixtures y estilos nominales de demo; la cobertura se actualizó al alcance real sin cerrar anticipadamente M06.5.
- Puerta local posterior al ajuste: lint, typecheck, **46 archivos / 200 pruebas**, build Vite 7.3.6 y `git diff --check` verdes; entry 316.13 kB, DnD 49.08 kB, persistencia 96.44 kB y catálogo 153.39 kB.

- Cerrada `M06.4 — Comercio, formularios y filtros`: añadidas 15 definiciones comerciales, 20 de formulario y 11 filtros; catálogo acumulado de 115 widgets.
- Checkout, carrito, CAPTCHA, submit, filtros y carga progresiva permanecen como estados/contratos declarativos; el preview bloquea destinos inseguros y envíos remotos.
- Añadidos adapters con controles HTML nativos y pruebas de defaults, inspector, exportadores, accesibilidad, seguridad y fallback.
- `widget-catalog` queda en 153.39 kB y el entry principal en 379.66 kB.
- Puerta local: lint, typecheck, **47 archivos / 206 pruebas**, build Vite 7.3.6 y `git diff --check` verdes.
- Activada `M06.5 — UX de biblioteca`.

- Cerrada `M06.3 — Contenido y dinámicos`: añadidas 20 definiciones de contenido y 14 dinámicas al catálogo único, con schemas/defaults, inspector, accesibilidad y matriz de exportadores.
- Los adapters representan contenido semántico, bindings, fallbacks y estados vacíos; queries, relaciones, condiciones y expresiones permanecen declarativas y no simulan un DataProvider futuro.
- Retirados del fallback provisional `content.card` y `content.metric`; las familias de comercio, formularios y filtros continúan reservadas a M06.4.
- Separado `widget-catalog` como chunk de 130.36 kB; el entry principal bajó de 502.46 kB con warning a 379.66 kB sin volver asíncrono el renderer.
- Puerta local: lint, typecheck, **45 archivos / 197 pruebas**, build Vite 7.3.6 y `git diff --check` verdes.
- Activada `M06.4 — Comercio, formularios y filtros`.

- Cerrada `M06.2 — Estructurales y básicos`: registradas 35 definiciones (15 estructurales y 20 básicas) con schemas, defaults, inspectores, iconos, accesibilidad y matriz de exportadores.
- Añadido `ReactWidgetAdapterRegistry`; el renderer canónico valida propiedades y resuelve adapters por `rendererId`, conservando fallback solo para familias posteriores.
- Aislados HTML e iframes no confiables y cubiertos render, inspector, exportación, accesibilidad y fallback mediante pruebas parametrizadas.
- La revisión React confirmó adapters estáticos a nivel de módulo, sin estado paralelo, hooks innecesarios ni componentes inline.
- Puerta local: lint, typecheck, 43 archivos / 188 pruebas, build Vite 7.3.6 y `git diff --check` verdes; entry principal 483.30 kB.
- Activada `M06.3 — Contenido y dinámicos`.

- Cerrada `M06.1 — Contrato de widget`: añadido `WidgetDefinition` neutral a framework con schema/defaults, renderer, inspector, icono, accesibilidad, migraciones y matriz de exportadores.
- `WidgetRegistry` rechaza contratos incompletos, duplicados e incompatibles con diagnósticos tipados y sin omisiones silenciosas.
- Puerta local: lint, typecheck, 41 archivos / 179 pruebas, build Vite 7.3.6 y `git diff --check` verdes; entry principal 457.59 kB.
- Activada `M06.2 — Estructurales y básicos`.

- Cerrada `M05.5 — Selección, zoom y viewport`: zoom 25–200 %, pan acotado, fit, orientación y herramienta activa persisten en `workspace.v1`.
- Añadida migración compatible para preferencias v1 anteriores, device frames portrait/landscape y región bidimensional contenida.
- Añadidos controles y atajos de teclado para zoom/pan/fit y movimiento de foco entre Capas, Canvas e Inspector.
- Puerta local: lint, typecheck, 40 archivos / 175 pruebas, build Vite 7.3.6 y `git diff --check` verdes; entry principal 457.58 kB.
- F05 queda completada; activada `F06 / M06.1 — Contrato de widget`.

- Cerrada `M05.4 — Direct manipulation`: tamaño, padding y margen se persisten como estilos canónicos por breakpoint mediante comandos reversibles.
- Añadidos cuatro handles de resize para pointer/touch/teclado, retícula de 8 px, snapping a guías, reglas del canvas y feedback de dimensiones.
- Conectados selección compartida, breadcrumbs derivados del árbol y menú contextual accesible para editar geometría completa sin arrastrar.
- Activado undo/redo real en el header sobre el `ProjectCommandBus`; nodos locked bloquean resize y espaciado.
- La revisión React sustituyó un contexto que repintaba todos los frames por snapshots booleanos por nodo.
- Puerta local: lint, typecheck, 38 archivos / 169 pruebas, build Vite 7.3.6 y `git diff --check` verdes; entry principal 451.84 kB.
- Activada `M05.5 — Selección, zoom y viewport` sin adelantar F06 ni el Selection Manager formal de F19.

## 2026-08-10

- Cerrada `M05.3 — Drag/drop y alternativas accesibles`: el panel de capas ahora deriva el árbol del `ProjectStructure` canónico y elimina `layerItems` como fuente paralela.
- Añadidos sensores `@dnd-kit` de pointer (4 px), touch (180 ms/6 px) y teclado sortable, con autoscroll, anuncios accesibles, locked state e indicadores antes/después.
- Añadido menú accesible para mover antes, después o dentro sin arrastre; todas las mutaciones pasan por `BrowserEditorProjectSession` → `ProjectStructureCommand` → `ProjectCommandBus` → IndexedDB → render store.
- Corregido el índice de movimientos hacia delante dentro del mismo contenedor y añadidas pruebas específicas de dominio e interacción.
- Separados los chunks DnD y Dexie: entry 435.61 kB, DnD 56.94 kB y persistencia 96.43 kB; lint, typecheck, 36 archivos con 162/162 pruebas y build Vite 7.3.6 correctos.
- Activada `M05.4 — Direct manipulation` sin adelantar M05.5 ni el Selection Manager formal de F19.
- Cerrada `M05.2 — Canvas y renderer`: sustituido el documento HTML estático del canvas por `CanonicalProjectRenderer` sobre `ProjectStructure` validado.
- Añadido `ProjectStructureRenderStore` con snapshots estables por `NodeId`, suscripciones `useSyncExternalStore`, reemplazo atómico y notificación granular; modificar un nodo no repinta ancestros ni hermanos.
- Añadida resolución responsive optimizada para estructuras ya validadas, soporte de roots/slots/componentes globales, representación de `hidden`/`locked` y error boundaries recuperables por nodo.
- Añadidas 6 pruebas de renderer para orden, responsive, bloqueo, aislamiento de errores, granularidad, componentes globales y rechazo de estructuras inválidas.
- Lint, typecheck, 35 archivos con 156/156 pruebas y build Vite 7.3.6 correctos. La comprobación browser se intentó, pero el daemon del CLI temporal no pudo arrancar bajo las restricciones de filesystem del runtime.
- Activada `M05.3 — Drag/drop y alternativas accesibles` sin adelantar M05.4 ni el Selection Manager formal de F19.
- Cerrada `M04.1 — Shell desktop`: formalizado el shell existente y añadida persistencia versionada `workspace.v1` para rail, anchuras, dock/float/minimize, bounds, pin, visibilidad y orden de paneles.
- Añadido `WorkspacePreferencesStore` con adapter `BrowserWorkspacePreferencesStore`, schema Zod estricto, fallback seguro ante JSON corrupto/versiones desconocidas y clamping de geometría al viewport actual.
- Añadidas pruebas de round-trip, corrupción/versionado, limpieza y restauración real del workspace después de desmontar/remontar el editor; `localStorage` se aísla entre tests.
- Corregida la hidratación del workspace para cumplir `react-hooks/set-state-in-effect` y eliminar renders/avisos `act(...)` redundantes.
- PR #6 / GitHub Actions `31451142252`: lint, typecheck, 26 archivos de test con 102/102 pruebas y build Vite 7.3.6 correctos. F04 continúa en `M04.2 — Shell tablet`.
- Cerrada `M03.4 — Command bus e historial`: añadido `ProjectCommandBus` con execute/undo/redo, `CompositeProjectCommand`, branching después de undo, límites configurables y detección de conflictos sin sobrescritura.
- Añadido `ProjectHistoryState` schema v1 con entradas reversibles `before`/`after`, cursor y operación pendiente recuperable; undo/redo conserva revisiones monotónicas creando siempre `revision = current + 1`.
- Persistido el historial en IndexedDB mediante namespace `project-history`; una prueba de integración cierra y reabre la base y confirma que el cursor persiste y undo continúa funcionando.
- Implementado protocolo preparar→guardar proyecto→confirmar historial y recuperación diferenciada para escritura interrumpida o confirmación fallida.
- PR #5 / GitHub Actions `31449931973`: lint, typecheck, 24 archivos de test con 97/97 pruebas y build Vite 7.3.6 correctos. F03 queda completada y la fase activa pasa a `F04 / M04.1 — Shell desktop`.
- Ejecutada una nueva auditoría de integridad UI/UX del shell desde navegación hasta inspector para corregir incoherencias de selección, tamaños, estados, affordance, legibilidad y overrides entre temas.
- Corregido el sidebar principal con estado activo persistente y claramente distinguible en Studio, Bento Motion y Flow Builder; filas compactas aumentadas a 36 px en desktop y 44 px en superficies touch, con iconos y foco más legibles.
- Páginas y Árbol de widgets ahora actualizan selección real al hacer clic; el Inspector sustituye dropdowns falsos por `select` nativos y hace funcionales la matriz de alineación y el estado de vinculado de padding.
- Controles futuros que antes parecían clicables sin comportamiento se marcan explícitamente como deshabilitados/planificados en topbar, biblioteca, inspector y canvas.
- Añadida `src/ui-integrity-v11.css` como guardrail final cross-theme para selected/focus states, tamaños mínimos, microcopy, overflow y reducción de movimiento; la consolidación estructural de las capas CSS sigue reservada a las fases propietarias y no cambia `F03 / M03.4`.
- Añadido `FLUTTERFLOW_PARITY_ADDENDUM.md` como ampliación normativa no destructiva del Prompt Maestro para cubrir capacidades de visual app builder equivalentes en alcance a FlutterFlow mediante arquitectura propia de ElectroCMS.
- Restauradas y preservadas íntegramente las 33 secciones originales de `PROMPT_MAESTRO_ELECTROCMS.md` y añadida la nueva sección 34 que incorpora el Addendum sin sustituir requisitos previos.
- Ampliado `PHASES.md` con F19–F31 y `DETAILED_EXECUTION_PHASES.md` con M19.1–M31.8 para Visual Builder avanzado, Component/Design System, Data/State, Action Flow, Database/API/Auth, Custom Code, Test/Debug, Versioning/Collaboration, AI Builder y Deployment.
- Actualizados `REQUIREMENTS.md`, `RULES.md`, `AGENTS.md`, `README.md` y `MEMORY.md` para hacer trazable el nuevo alcance y evitar que una IA futura salte la microfase activa.
- La fase activa permanece `F03 / M03.4 — Command bus e historial`; F19–F31 se registran `NO_INICIADA` y su documentación no se considera implementación.
- Introducida la clasificación `PARITY_GAP` para capacidades futuras faltantes, con obligación de fase propietaria, arquitectura, criterios de aceptación y pruebas.
- Añadido `Bento Motion` como segundo tema seleccionable desde Ajustes de apariencia en el header, conservando intacto el tema Studio.
- Transformados header, rail, canvas, paneles, secciones del inspector, widgets, dock y sheets en un sistema Bento neutral, limpio y modular con resaltados azules y temas claro/oscuro.
- Incorporado un icono Lottie local cargado de forma diferida, sin loop continuo y con autoplay desactivado bajo `prefers-reduced-motion`; el runtime usa el player light para reducir el chunk de 82.71 a 51.98 kB gzip y eliminar `eval` del build.
- Añadidas transiciones de 200–280 ms, entrada escalonada de tarjetas, respuesta animada de SVG y estados hover/active/focus sin desplazar el layout.
- Implementado selector accesible mediante dialog/radiogroup, click/touch, flechas, `Home`, `End` y `Escape`, con restauración de foco y reflow correcto a 320 px.
- Verificados 320, 375, 768, 1024, 1440 y 812 × 375, temas claro/oscuro, Lottie, sheets, targets touch, consola sin errores, contraste automático, lint, typecheck, 86/86 pruebas y build.
- Publicado Bento Motion en `c82b2ac`; GitHub Actions `31434946512` finalizó correctamente y Cloudflare Pages sirve los assets `index-DxcgV_3s.js`, `index-CA0iNCsS.css` y `BentoMotionIcon-C_InfoPI.js` por HTTPS 200.
- Completada una auditoría integral del editor high-density: layout, paneles, botones, formularios, tipografía, color, responsive, modo oscuro, accesibilidad e interacciones.
- Corregido el recorte vertical de biblioteca e inspector en sheets móviles mediante estructura flex y scroll interno; eliminado también el overflow horizontal del selector de alineación a 320 px.
- Enlazadas pestañas y paneles con `id`, `aria-controls` y `aria-labelledby`; añadidos estados semánticos a página/capa seleccionadas, inputs numéricos y muestra de color identificable.
- Añadido umbral de 4 px al drag-and-drop, feedback activo en controles, padding con safe area en canvas y aplicación de tema previa al pintado para evitar parpadeos claro/oscuro.
- Sincronizados al azul de marca `#2563EB` los tokens TypeScript, CSS, manifest PWA e icono instalable, eliminando restos de la paleta violeta anterior.
- Verificados navegador y layout en 320, 375, 768, 1024, 1440 y 812 × 375, temas claro/oscuro, fuentes de botones a 12 px y consola de la aplicación sin errores; lint, typecheck, 80/80 pruebas y build verdes.
- Publicada la auditoría en `dfd64c7`; GitHub Actions `31431938727` finalizó correctamente y Cloudflare Pages sirve `index-q6ZcTbfS.js`, `index-BMh8EabC.css` y el manifest azul por HTTPS 200.
- Ajustada la UI a la referencia adjunta con superficies claras/grises y azul `#2563EB` como acento dominante; eliminados los colores decorativos distintos entre paneles, menús, páginas, widgets, inspector y dock móvil.
- Normalizados a 12 px los textos de botones, pestañas Páginas/Componentes y Propiedades/Acción/Backend, nombres de páginas, árbol de widgets y controles del inspector.
- Eliminada la acción de cerrar ventanas; ocultar usa el mismo flujo recuperable de minimizar/restaurar y las sheets móviles conservan un control explícito «Ocultar panel» más `Escape`.
- Mejorado el drag-and-drop con tres guías simultáneas, destino activo resaltado, acoplamiento izquierda/derecha/rail, reemplazo seguro del panel ocupado y cancelación sin dock.
- Ampliada la suite a 79/79 pruebas; lint, typecheck, build y navegador en 375/768/1440 px correctos, sin overflow ni errores de consola.
- Publicada la iteración en `b5698fd`; GitHub Actions `31429823913` finalizó en verde y Cloudflare Pages sirve `index-DfL3r9PX.js` e `index-DrRQ4Zf5.css` por HTTPS 200.
- Rehecho el sistema de ventanas con dock por arrastre y preview explícita para izquierda, derecha y rail lateral; cada destino dispone también de botón y alternativa de teclado.
- Eliminada completamente la acción de maximizar paneles; se conservan desacoplar, acoplar, mover, resize, minimizar, fijar, restaurar y cerrar.
- Convertidos los paneles minimizados en pestañas verticales de borde que ocupan toda la altura útil y comparten la barra cuando se minimizan ambos.
- Convertido el rail principal en una barra redimensionable de 44–168 px, con conmutador iconos/etiquetas y resize por puntero o teclado.
- Reducidas las fuentes de menús y opciones hasta 9–10 px en escritorio, manteniendo Inter y targets táctiles de 44 px en móvil.
- Extendidos iconos SVG y colores semánticos a navegación, páginas, widgets, inspector, toolbar, sheets y dock móvil; 78/78 pruebas y build correctos.
- Publicada la iteración en `d22e67c`; GitHub Actions `31426810726` finalizó en verde y Cloudflare Pages sirve `index-DcJefDTZ.js` e `index-B6qq0Yp1.css` por HTTPS 200.
- Evolucionado el shell existente a un sistema profesional de ventanas high-density sin sustituir su estructura ni identidad visual.
- Añadidas acciones funcionales para desacoplar, acoplar, mover, redimensionar, minimizar, maximizar, fijar, restaurar y cerrar biblioteca e inspector.
- Incorporadas alternativas de teclado para movimiento y resize, controles SVG accesibles con tooltip y estados de interacción, y animaciones de 180–200 ms respetando `prefers-reduced-motion`.
- Empaquetada Inter Variable localmente y añadidos acentos semánticos equilibrados por navegación, contenido, IA, formularios, estados y advertencias en light/dark.
- Conservados controles compactos de aproximadamente 32 px en escritorio y áreas táctiles de 44 px en tablet/móvil; ampliada la suite a 76/76 pruebas y validado el build.
- La entrega anticipada no implementa ni cierra `M03.4`; historial, undo/redo y command bus continúan pendientes.
- Publicado `4a11d67`; GitHub Actions `31423720024` y Cloudflare Pages finalizaron correctamente con `index-vIDVryQI.js` validado en producción.
- Aplicada una segunda compactación integral explícita: header y toolbar de 40 px, rail de 44 px, controles y filas de 32 px, y status bar de 24 px.
- Reducidos paneles a 192/224 px por defecto con rangos 168–280/216–320 px; minimizados padding, gaps, radios y separación de secciones al ritmo funcional de 4–8 px.
- Conservados targets de 44 px en tablet/móvil, foco visible, colapso y resize accesible; verificados 320, 375, 768, 1024, 1440 y landscape sin overflow ni errores de consola.
- Publicado `a6c13c7`; GitHub Actions `31419886499` y Cloudflare Pages finalizaron correctamente con `index-B09363my.js` validado en producción.
- Convertidos los paneles laterales en menús compactos, colapsables de forma independiente y redimensionables entre 184–320 px (biblioteca) y 224–360 px (inspector).
- Añadidos separadores accesibles con arrastre por puntero y alternativa de teclado: flechas en pasos de 16 px, `Home` al mínimo y `End` al máximo.
- Reducidos controles, pestañas, filas y opciones a 36 px en escritorio, conservando targets táctiles de 44 px en tablet y móvil.
- Verificados seis viewports sin overflow horizontal; colapso, restauración, arrastre, teclado, sheets de tablet y consola sin errores. Suite ampliada a 74/74 pruebas.
- La entrega anticipada no cierra `M03.4` ni presenta controles planificados como funciones completas.
- Publicado `b57b85a`; GitHub Actions `31417203626` y Cloudflare Pages finalizaron correctamente con `index-CRq1OgZM.js` validado en producción.
- Refinada la UI a densidad 10/10 y mayor fidelidad con la referencia autorizada: azul eléctrico, grises fríos, superficies blancas y sombras neutrales.
- Compactados header, rail de iconos y menús; renombradas las pestañas visibles a Páginas/Componentes y Propiedades/Acción/Backend.
- Ajustado el breakpoint de escritorio para mostrar rail, páginas/capas, canvas e inspector simultáneamente desde 1024 px; tablet y móvil conservan paneles accesibles.
- Publicado el refinamiento en `7bad321`; GitHub Actions `31412507711` y Cloudflare Pages finalizaron correctamente con `index-FlnSUMKE.js` verificado en producción.
- Rediseñado el estudio visual a partir de la única imagen adjunta autorizada: header compacto, rail, páginas/capas, canvas punteado, marco de dispositivo e inspector Diseño/Acciones/Datos.
- Mejorada la adaptación responsive con paneles contextuales en tablet/laptop, dock y bottom sheets en móvil, cierre por `Escape` y restauración de foco.
- Normalizados los controles activos a targets mínimos de 44 px y verificados 320, 375, 768, 1024, 1440 y 812 × 375 sin overflow horizontal ni errores de consola.
- Conservados como deshabilitados los controles aún no funcionales; el rediseño anticipado no cierra F04–F07 ni `M03.4`.
- Publicado el rediseño en `30d846d`; GitHub Actions `31407539886` y Cloudflare Pages completaron correctamente, con `index-2JEzV0jm.js` verificado en producción.
- Cerrada `M03.3`: añadidos schemas estrictos para snapshots, journal y estado de recuperación por proyecto.
- Implementado protocolo de autosave preparar→guardar→confirmar con debounce, límites configurables y conservación de entradas pendientes.
- Añadida recuperación de escrituras interrumpidas, confirmaciones fallidas, proyectos corruptos, entradas superadas y conflictos de revisión sin sobrescritura.
- Conectado el estado de recuperación al namespace IndexedDB `project-recovery` y probada reapertura con journal pendiente; la suite alcanza 72/72 pruebas.
- Publicado `f394d63`; GitHub Actions `31404629844` y el despliegue de M03.3 en Cloudflare Pages finalizaron correctamente.

## 2026-08-09

- Convertido el prompt maestro de Flutter a React + TypeScript + Tailwind CSS, preservando sus 33 secciones.
- Añadido sistema documental para IA de poco contexto: reglas, memoria, tracking, fases y microfases.
- Añadido layout adaptativo accesible para desktop, tablet y móvil.
- Persistido el sistema de diseño inicial generado con `ui-ux-pro-max`.
- Verificados los 22 documentos mínimos, la secuencia completa 1–33 y 89 microfases distribuidas en 19 fases.
- Creado scaffold React 19 + TypeScript + Tailwind 4 con Vite 7.
- Añadidos ESLint, Vitest, Testing Library y scripts de lint/typecheck/test/build.
- Añadido workflow GitHub Actions con puerta de calidad y despliegue a Cloudflare Pages.
- Añadidos `wrangler.jsonc`, fallback SPA y headers de seguridad.
- Verificada la UI en navegador desktop y 375 px, sin errores ni overflow horizontal.
- Instalado y autenticado GitHub CLI 2.97.0.
- Creado y publicado el repositorio público `janielsg20/ElectroCMSReact1.0` con rama principal `main`.
- Creado el proyecto Direct Upload `electrocms-react` en Cloudflare Pages.
- Configurados los secretos cifrados de GitHub Actions para Cloudflare sin exponer credenciales.
- Verificada la ejecución completa de CI/CD: lint, typecheck, 2 pruebas, build y deploy correctos.
- Verificada `https://electrocms-react.pages.dev/` con respuesta HTTPS 200 y contenido esperado.
- Cerrada `M00.2`: se documentó la ausencia de una referencia React autorizada y la decisión expresa de construir desde cero sin usar otras aplicaciones.
- Cerrada `M00.3`: añadidas equivalencias de arquitectura objetivo y regla verificable contra requisitos huérfanos para las 33 secciones.
- Cerrada `M00.4` y puerta G0: aceptadas capas, ADR, dependencias y reglas de dirección arquitectónica.
- Cerrada `M01.2`: añadidas capas de dominio, aplicación, infraestructura, UI, renderers y exportadores con contratos y pruebas contra dependencias inválidas o circulares.
- Cerrada `M01.3`: implementados tokens semánticos light/dark, reset global, tipografía sin dependencia de red, escala de z-index, foco visible y reducción de movimiento.
- Añadidos primitives accesibles `Button`, `Icon` y `TextField`, con estados de carga/error y targets táctiles mínimos de 44 px.
- Añadidas pruebas de contraste WCAG AA, semántica y comportamiento; la suite alcanza 12/12 pruebas.
- Validada la pantalla de fundación de este repositorio en desktop y 375 × 812 sin desbordamiento horizontal.
- Publicado `6705eca`; GitHub Actions `31333777914` y el despliegue de M01.3 en Cloudflare Pages finalizaron correctamente.
- Cerrada `M01.4` y puerta G1: añadidos manifest instalable, iconos PNG/SVG y Service Worker versionado desde los assets reales del build.
- Implementado precache del shell, navegación network-first, assets cache-first, limpieza de cachés antiguas y registro exclusivo de producción.
- Corregida la recuperación offline de módulos ES servidos con `Vary: Origin` mediante coincidencia same-origin que ignora esa variación.
- Añadidos contrato público v1 de adaptadores de plataforma, adaptador web y documentación para futuras envolturas desktop y móvil.
- Validado el núcleo React sin red desde un origen limpio después de detener totalmente el servidor; 17/17 pruebas verdes.
- Publicado `16d76f3`; GitHub Actions `31334792028` y el despliegue PWA en Cloudflare Pages finalizaron correctamente.
- Cerrada `M02.1`: añadido envelope `electrocms.project` v1 con UUID, revisión, nombre, timestamps UTC, metadatos JSON y payload validado por schema.
- Incorporado Zod 4.4.3 como dependencia exacta y fuente común para tipos, validación y JSON Schema estricto.
- Añadida serialización JSON determinista con claves ordenadas, deserialización segura y errores tipados sin excepciones para entradas no confiables.
- Añadidas pruebas de identidad, cronología, versiones incompatibles, propiedades desconocidas, determinismo, round-trip y JSON Schema.
- Publicado `ea034f2`; GitHub Actions `31336177234` y el despliegue posterior a M02.1 finalizaron correctamente.
- Cerrada `M02.2`: añadidos schemas estrictos para documentos, nodos, componentes globales, slots, propiedades, estilos, bindings, condiciones y overrides responsive.
- Incorporados IDs nominales por agregado y seis breakpoints base configurables con orientación y herencia explícita.
- Añadida resolución de estado responsive por cadena de herencia y diagnósticos tipados para referencias rotas, huérfanos, padres múltiples y ciclos estructurales.
- Añadidas pruebas de invariantes, componentes recursivos, bindings rotos, herencia y JSON Schema; la suite alcanza 28/28 pruebas.
- Publicado `f987869`; GitHub Actions `31337310722` y el despliegue de M02.2 en Cloudflare Pages finalizaron correctamente.
- Añadido por petición expresa un prototipo visual anticipado de la interfaz final de ElectroCMS sin declarar completos los motores funcionales posteriores.
- Implementados header, rail principal, biblioteca de widgets, árbol de capas, canvas responsive, inspector de propiedades, status bar y navegación móvil con sheets.
- Ampliados Button e Icon con variantes, tamaños y un catálogo SVG outline coherente; añadidos tokens de superficies, éxito y advertencia.
- Verificada la UI en desktop, tablet, móvil y landscape sin overflow horizontal; búsqueda, tabs, tema y foco de sheets funcionan localmente.
- Publicado `14a00e9`; GitHub Actions `31339361393` y el despliegue del prototipo UI en Cloudflare Pages finalizaron correctamente.
- Cerrada `M02.3`: añadidos modelos normalizados y schemas estrictos para CPT, taxonomías, 27 tipos de campo, registros, relaciones, consultas, formularios, RBAC, usuarios, menús y pantallas backend.
- Añadidos diagnósticos semánticos para propietarios, referencias cruzadas, campos obligatorios, jerarquías, consultas, formularios, permisos, menús y compatibilidad entre pantallas y contenido.
- Probadas las cardinalidades 1:1, 1:N y N:N y los contratos JSON Schema; la suite alcanza 36/36 pruebas.
- Cerrada `M02.4` y F02: añadido registry inmutable de migraciones forward consecutivas con paso v0→v1 y validación de entrada/salida.
- Añadida copia previa exacta y recuperable, incluida en errores posteriores al versionado, más diagnósticos para versiones futuras y cadenas incompletas.
- Añadidos fixtures de proyecto v0/v1 y pruebas de migración, lectura actual, configuración del registry, fallo, restauración byte por byte y reintento; la suite alcanza 42/42 pruebas.
- Publicado `3fbe4fe`; GitHub Actions `31340253571` y el despliegue de M02.4 en Cloudflare Pages finalizaron correctamente.
- Cerrada `M03.1`: añadido puerto `LocalRepository` con resultados y errores tipados para cuota, corrupción, cierre, indisponibilidad y fallos de almacenamiento.
- Incorporados Dexie 4.4.4 y fake-indexeddb 6.2.5 como dependencias exactas de runtime y test respectivamente.
- Añadido adaptador IndexedDB con namespaces, clave compuesta, índices por versión, escritura por lote transaccional y validación de integridad en lectura.
- Probados CRUD indexado, cierre/reapertura, rollback completo por cuota, corrupción detectable y conexión cerrada; la suite alcanza 47/47 pruebas.
- Publicado `a4431fe`; GitHub Actions `31340890680` y el despliegue de M03.1 en Cloudflare Pages finalizaron correctamente.
- Cerrada `M03.2`: añadido `ProjectRecord` con estados activo, archivado y papelera recuperable, timestamps y estado previo validados.
- Implementado `ProjectLifecycleService` para crear, duplicar, renombrar, archivar, eliminar, recuperar, exportar e importar proyectos.
- Añadida importación v0/v1 con migraciones, resolución explícita de conflictos y protección contra sobrescritura por IDs repetidos.
- Conectado el ciclo a IndexedDB mediante `createProjectRecordRepository`; 60/60 pruebas verifican dominio, servicio y reapertura persistente.
- Publicado `8e9b333`; GitHub Actions `31341648227` y el despliegue de M03.2 en Cloudflare Pages finalizaron correctamente.
